"""Prototipo de referencia: sección I.2 Curvas en el plano.

Fija la semántica exacta de los algoritmos de la sección y verifica las
afirmaciones del libro y de la disección. La versión final vive en
`src/tcomp/curvas.py` (la construye Claude Code a partir de la spec).

Contenido:
- orientación: el determinante Δ(x, a, b) del libro (giro a izquierda si > 0);
- algoritmo de paridad, con la perturbación simbólica x' = (x1+ε1, x2+ε2),
  0 < ε1 << ε2, resuelta EXACTAMENTE (sin números chicos de verdad);
- número de vueltas por dos caminos independientes: suma de ángulos y
  cruces con signo del rayo (la paridad es su sombra módulo 2);
- triangulación de polígonos simples: la prueba del libro (vértice de más a
  la izquierda) convertida en algoritmo, y el árbol dual con sus orejas.

Convención: los polígonos son listas de vértices (x, y) con coordenadas
enteras o Fraction, recorridos en orden; la última arista cierra el ciclo.

Uso:  python3 curvas.py   (corre todas las verificaciones)
"""

from __future__ import annotations

import math
from fractions import Fraction


# --------------------------------------------------------------- orientación
def orient(x, a, b):
    """det Δ(x, a, b) del libro = (a1-x1)(b2-x2) - (a2-x2)(b1-x1).

    Es el doble del área con signo del triángulo x, a, b:
    > 0 giro a izquierda (antihorario), < 0 a derecha, = 0 alineados.
    """
    return (a[0] - x[0]) * (b[1] - x[1]) - (a[1] - x[1]) * (b[0] - x[0])


def orient_perturbado(x, a, b) -> int:
    """Signo de det Δ(x', a, b) con x' = (x1+ε1, x2+ε2), 0 < ε1 << ε2.

    Desarrollando el determinante (los términos ε1·ε2 se cancelan):
        det Δ(x', a, b) = det Δ(x, a, b) + ε2·(b1 - a1) + ε1·(a2 - b2).
    Como ε1 << ε2 << cualquier número "real" del problema, el signo es el del
    primer término no nulo de esa lista. Esto es "Simulation of Simplicity"
    (Edelsbrunner y Mücke, 1990) en su versión más pequeña.
    """
    for termino in (orient(x, a, b), b[0] - a[0], a[1] - b[1]):
        if termino != 0:
            return 1 if termino > 0 else -1
    return 0  # solo si a == b (arista degenerada)


# ---------------------------------------------------------- algoritmo de paridad
def cruza(x, a, b) -> bool:
    """doesCross del libro, con x perturbado: ¿el rayo horizontal que sale de
    x' hacia la derecha cruza la arista ab?"""
    if a[1] > b[1]:
        a, b = b, a  # el libro supone a debajo de b
    # a2 < x2 + ε2 < b2  ⟺  a2 <= x2 < b2   (ε2 > 0 infinitesimal)
    if not (a[1] <= x[1] < b[1]):
        return False
    return orient_perturbado(x, a, b) > 0


def sobre_el_poligono(x, P) -> bool:
    for a, b in aristas(P):
        if orient(x, a, b) == 0 and min(a[0], b[0]) <= x[0] <= max(a[0], b[0]) \
                and min(a[1], b[1]) <= x[1] <= max(a[1], b[1]):
            return True
    return False


def cruces(x, P) -> int:
    return sum(cruza(x, a, b) for a, b in aristas(P))


def paridad(x, P) -> str:
    """'adentro' / 'afuera' / 'sobre' para un polígono simple."""
    if sobre_el_poligono(x, P):
        return "sobre"
    return "adentro" if cruces(x, P) % 2 == 1 else "afuera"


# ------------------------------------------------------------ número de vueltas
def vueltas_por_angulos(x, P) -> int:
    """W(γ, x) sumando los giros del vector unitario (γ(s) - x)/|γ(s) - x|.

    Es la definición del libro, discretizada: el ángulo total barrido dividido
    por 2π. Usa punto flotante; el resultado se redondea al entero más cercano.
    """
    total = 0.0
    for a, b in aristas(P):
        ta = math.atan2(a[1] - x[1], a[0] - x[0])
        tb = math.atan2(b[1] - x[1], b[0] - x[0])
        d = tb - ta
        while d <= -math.pi:
            d += 2 * math.pi
        while d > math.pi:
            d -= 2 * math.pi
        total += d
    return round(total / (2 * math.pi))


def vueltas_por_cruces(x, P) -> int:
    """W(γ, x) contando con signo los cruces del rayo horizontal a la derecha.

    Una arista que sube (a2 < b2 en el sentido del recorrido) y deja a x' a su
    izquierda cruza el rayo "de derecha a izquierda": +1. Una que baja: -1.
    Es EXACTO (aritmética entera) y es el mismo recorrido que el algoritmo de
    paridad: la paridad cuenta los cruces sin signo, es decir, módulo 2.
    """
    w = 0
    for a, b in aristas(P):
        if a[1] <= x[1] < b[1] and orient_perturbado(x, a, b) > 0:
            w += 1  # sube, x' a la izquierda de a→b
        elif b[1] <= x[1] < a[1] and orient_perturbado(x, a, b) < 0:
            w -= 1  # baja, x' a la derecha de a→b
    return w


# ------------------------------------------------------------- triangulación
def aristas(P):
    return [(P[i], P[(i + 1) % len(P)]) for i in range(len(P))]


def area_con_signo(P):
    return Fraction(sum(a[0] * b[1] - b[0] * a[1] for a, b in aristas(P)), 2)


def en_triangulo(p, a, b, c) -> bool:
    """p en el triángulo cerrado abc (abc antihorario)."""
    return orient(p, a, b) >= 0 and orient(p, b, c) >= 0 and orient(p, c, a) >= 0


def _b_a_c(P, idx):
    n = len(idx)
    k = min(range(n), key=lambda t: (P[idx[t]][0], P[idx[t]][1]))
    ka, kc = (k - 1) % n, (k + 1) % n
    a, b, c = P[idx[ka]], P[idx[k]], P[idx[kc]]
    adentro = [t for t in range(n) if t not in (ka, k, kc)
               and en_triangulo(P[idx[t]], a, b, c)]
    return k, ka, kc, a, c, adentro


def diagonal_mas_a_la_izquierda(P, idx):
    """La regla TAL COMO LA ENUNCIA el libro (p. 12): si hay vértices dentro
    del triángulo abc, unir b con el de MÁS A LA IZQUIERDA. ¡Puede fallar!
    Ver CONTRAEJEMPLO_LIBRO."""
    k, ka, kc, a, c, adentro = _b_a_c(P, idx)
    if not adentro:
        return ka, kc
    return k, min(adentro, key=lambda t: (P[idx[t]][0], P[idx[t]][1]))


def diagonal_del_libro(P, idx):
    """El paso inductivo de la prueba (p. 12), con la regla CORREGIDA.

    idx: índices (en P) de los vértices del sub-polígono actual, antihorario.
    Toma el vértice b de más a la izquierda y sus vecinos a, c. Si ningún otro
    vértice cae en el triángulo abc, la diagonal es ac. Si no, es bu con u el
    vértice dentro de abc MÁS LEJANO DE LA RECTA ac (regla clásica; la del
    libro, "el de más a la izquierda", falla: ver CONTRAEJEMPLO_LIBRO).
    Por qué funciona: entre b y la paralela a ac por u no hay vértices, y una
    arista que cortara bu tendría que entrar a esa franja sin cruzar ab ni bc.
    Devuelve (i, j) en posiciones de `idx`.
    """
    k, ka, kc, a, c, adentro = _b_a_c(P, idx)
    if not adentro:
        return ka, kc
    return k, max(adentro, key=lambda t: abs(orient(P[idx[t]], a, c)))


# Pentágono antihorario. b = (-16, 46) es el vértice de más a la izquierda,
# a = (42, -71) y c = (-8, -18) sus vecinos. Dentro de abc están (28, -48) y
# (21, -47). El de más a la izquierda es (21, -47), y el segmento que lo une con
# b CORTA la arista (-8, -18)-(28, -48): no es una diagonal.
CONTRAEJEMPLO_LIBRO = [(42, -71), (-16, 46), (-8, -18), (28, -48), (21, -47)]


def es_diagonal(P, i, j) -> bool:
    """¿El segmento P[i]P[j] es una diagonal (no corta aristas y va por adentro)?"""
    p, q = P[i], P[j]
    for a, b in aristas(P):
        if p in (a, b) or q in (a, b):
            continue
        if orient(a, b, p) * orient(a, b, q) < 0 and orient(p, q, a) * orient(p, q, b) < 0:
            return False
    medio = (Fraction(p[0] + q[0], 2), Fraction(p[1] + q[1], 2))
    return paridad(medio, P) == "adentro"


def triangular(P):
    """Triangulación por la prueba inductiva del libro. P antihorario.

    Devuelve (triangulos, diagonales) con índices de P. Cada diagonal parte el
    n-gono en un n1-gono y un n2-gono con n1 + n2 = n + 2.
    """
    triangulos, diagonales = [], []
    pila = [list(range(len(P)))]
    while pila:
        idx = pila.pop()
        if len(idx) == 3:
            triangulos.append(tuple(idx))
            continue
        i, j = sorted(diagonal_del_libro(P, idx))
        diagonales.append((idx[i], idx[j]))
        pila.append(idx[i:j + 1])
        pila.append(idx[j:] + idx[:i + 1])
    return triangulos, diagonales


def arbol_dual(triangulos):
    """Nodos = triángulos; arcos = pares de triángulos que comparten una diagonal."""
    arcos = []
    lados = {}
    for t, (p, q, r) in enumerate(triangulos):
        for e in (frozenset((p, q)), frozenset((q, r)), frozenset((r, p))):
            lados.setdefault(e, []).append(t)
    for ts in lados.values():
        if len(ts) == 2:
            arcos.append(tuple(ts))
    return arcos


def orejas(triangulos, arcos):
    grado = [0] * len(triangulos)
    for s, t in arcos:
        grado[s] += 1
        grado[t] += 1
    return [t for t, g in enumerate(grado) if g <= 1]


# ------------------------------------------------------------- generadores
def poligono_estrella(n, rng):
    """Polígono simple aleatorio: ángulos ordenados, radios aleatorios (enteros)."""
    angs = sorted(rng.uniform(0, 2 * math.pi) for _ in range(n))
    return [(round(math.cos(t) * rng.randint(20, 100)), round(math.sin(t) * rng.randint(20, 100)))
            for t in angs]


def poligono_desenredado(n, rng):
    """Polígono simple arbitrario (no estrellado): puntos al azar y "2-opt"
    (invertir tramos) hasta que no queden aristas cruzadas."""
    P = list({(rng.randint(-100, 100), rng.randint(-100, 100)) for _ in range(n)})
    rng.shuffle(P)
    cambio = True
    while cambio:
        cambio = False
        m = len(P)
        for i in range(m):
            for j in range(i + 2, m):
                if i == 0 and j == m - 1:
                    continue
                a, b, c, d = P[i], P[(i + 1) % m], P[j], P[(j + 1) % m]
                if orient(c, d, a) * orient(c, d, b) < 0 and orient(a, b, c) * orient(a, b, d) < 0:
                    P[i + 1:j + 1] = reversed(P[i + 1:j + 1])
                    cambio = True
    return P


def posicion_general(P) -> bool:
    """Hipótesis del libro: x distintas y ningún trío de vértices alineado."""
    from itertools import combinations
    if len({p[0] for p in P}) < len(P):
        return False
    return all(orient(a, b, c) != 0 for a, b, c in combinations(P, 3))


def es_simple(P) -> bool:
    E = aristas(P)
    n = len(E)

    def se_cortan(p1, p2, q1, q2):
        d1, d2 = orient(q1, q2, p1), orient(q1, q2, p2)
        d3, d4 = orient(p1, p2, q1), orient(p1, p2, q2)
        return (d1 * d2 < 0) and (d3 * d4 < 0)

    for i in range(n):
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            if se_cortan(*E[i], *E[j]):
                return False
    return len(set(P)) == len(P)


# ------------------------------------------------------------- verificaciones
if __name__ == "__main__":
    import random

    rng = random.Random(3)

    # 1. El determinante: giro a izquierda en el ejemplo del libro.
    assert orient((0, 0), (1, 0), (0, 1)) > 0
    print("OK  det Δ((0,0),(1,0),(0,1)) > 0: giro a izquierda")

    # 2. Paridad = número de vueltas módulo 2, y las dos formas de calcular W coinciden.
    probados = 0
    for k in range(400):
        P = (poligono_estrella if k % 2 else poligono_desenredado)(rng.randint(3, 25), rng)
        if len(set(P)) < len(P) or not es_simple(P) or area_con_signo(P) == 0:
            continue
        if area_con_signo(P) < 0:
            P = P[::-1]  # antihorario
        for _ in range(30):
            # puntos enteros: muchos casos degenerados (rayo por vértices, aristas horizontales)
            x = (rng.randint(-110, 110), rng.choice([v[1] for v in P] + [rng.randint(-110, 110)]))
            if sobre_el_poligono(x, P):
                continue
            w_c, w_a = vueltas_por_cruces(x, P), vueltas_por_angulos(x, P)
            assert w_c == w_a, (P, x, w_c, w_a)
            assert w_c in (0, 1)
            assert (cruces(x, P) % 2) == (w_c % 2)
            probados += 1
    print(f"OK  {probados} consultas (muchas degeneradas): W por cruces == W por ángulos,"
          " y paridad == W mod 2")

    # 3. Curvas NO simples: W puede valer 2, -1, ...; la paridad sigue siendo W mod 2.
    limacon = [(round(100 * (0.5 + math.cos(t)) * math.cos(t)), round(100 * (0.5 + math.cos(t)) * math.sin(t)))
               for t in [2 * math.pi * k / 120 for k in range(120)]]
    for x, w_esperado in (((90, 0), 1), ((20, 0), 2), ((-200, 0), 0)):
        assert vueltas_por_cruces(x, limacon) == vueltas_por_angulos(x, limacon) == w_esperado
        assert cruces(x, limacon) % 2 == w_esperado % 2
    ocho = [(round(100 * math.sin(t)), round(60 * math.sin(2 * t))) for t in
            [2 * math.pi * k / 120 for k in range(120)]]
    ws = {vueltas_por_cruces((50, 10), ocho), vueltas_por_cruces((-50, 10), ocho)}
    assert ws == {1, -1}
    print("OK  limaçon con lazo interior: W = 2 adentro del lazo; el ocho: W = +1 y -1")

    # 4. Triangulación: n-2 triángulos, n-3 diagonales, el dual es un árbol, >= 2 orejas.
    hechos = 0
    for k in range(3000):
        P = (poligono_estrella if k % 2 else poligono_desenredado)(rng.randint(3, 30), rng)
        if len(set(P)) < len(P) or not es_simple(P) or not posicion_general(P):
            continue
        if area_con_signo(P) < 0:
            P = P[::-1]
        n = len(P)
        T, D = triangular(P)
        assert len(T) == n - 2 and len(D) == n - 3
        assert sum(abs(area_con_signo([P[i] for i in t])) for t in T) == abs(area_con_signo(P))
        arcos = arbol_dual(T)
        assert len(arcos) == len(T) - 1  # árbol: nodos - 1 arcos (y conexo, ver abajo)
        # conexidad del dual con la ola de I.1
        vistos, pila = {0}, [0]
        while pila:
            t = pila.pop()
            for s, r in arcos:
                for u, v in ((s, r), (r, s)):
                    if u == t and v not in vistos:
                        vistos.add(v)
                        pila.append(v)
        assert len(vistos) == len(T)
        if n >= 4:
            assert len(orejas(T, arcos)) >= 2  # ¡dos orejas!, no solo una
        hechos += 1
    C = CONTRAEJEMPLO_LIBRO
    assert es_simple(C) and area_con_signo(C) > 0 and posicion_general(C)
    i, j = diagonal_mas_a_la_izquierda(C, list(range(5)))
    assert not es_diagonal(C, i, j)
    i, j = diagonal_del_libro(C, list(range(5)))
    assert es_diagonal(C, i, j)
    print("OK  errata: en el pentágono CONTRAEJEMPLO_LIBRO la regla 'más a la izquierda'"
          " no da una diagonal; la regla 'más lejano de ac' sí")
    print(f"OK  {hechos} polígonos: n-2 triángulos, n-3 diagonales, áreas suman,"
          " dual = árbol, al menos 2 orejas")
