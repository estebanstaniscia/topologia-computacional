"""Curvas en el plano, sección I.2 de Edelsbrunner y Harer.

Los algoritmos de la sección, con aritmética exacta:

- **Orientación:** el determinante Δ(x, a, b) del libro, el doble del área con signo
  del triángulo x, a, b (> 0: giro a izquierda, antihorario).
- **Algoritmo de paridad**, con la perturbación x' = (x₁ + ε₁, x₂ + ε₂), 0 < ε₁ ≪ ε₂,
  resuelta EXACTAMENTE (Simulation of Simplicity, Edelsbrunner y Mücke 1990): el
  signo del determinante perturbado es el del primer término no nulo de
  ``(det Δ(x, a, b), b₁ − a₁, a₂ − b₂)``. No hace falta ningún número chico de verdad.
- **Número de vueltas** por dos caminos independientes: sumando ángulos (flotante) y
  contando con signo los cruces del rayo (exacto). La paridad es su sombra módulo 2.
- **Triangulación** de polígonos simples por la prueba inductiva del libro, con la
  regla **corregida** (vértice dentro de abc más lejano de la recta ac; la regla del
  libro, «el de más a la izquierda», falla: ver ``CONTRAEJEMPLO_LIBRO``), el árbol
  dual, las orejas, y el 3-coloreo de Fisk para la galería de arte.

Convenciones: un polígono es una lista de vértices ``(x, y)`` (enteros o
``Fraction`` para que todo sea exacto) recorridos en orden; la última arista cierra el
ciclo. Los índices de vértices y triángulos son ``0..n-1``.
"""

from __future__ import annotations

import math
import random
from collections import deque
from collections.abc import Sequence
from fractions import Fraction
from itertools import combinations
from typing import Literal

Punto = tuple
Poligono = Sequence[Punto]

# ------------------------------------------------------------------ orientación


def orient(x: Punto, a: Punto, b: Punto):
    """det Δ(x, a, b) = (a₁ − x₁)(b₂ − x₂) − (a₂ − x₂)(b₁ − x₁).

    Es el doble del área con signo del triángulo x, a, b: > 0 si x, a, b giran a la
    izquierda (antihorario), < 0 a la derecha, 0 si están alineados.
    """
    return (a[0] - x[0]) * (b[1] - x[1]) - (a[1] - x[1]) * (b[0] - x[0])


def orient_perturbado(x: Punto, a: Punto, b: Punto) -> int:
    """Signo de det Δ(x', a, b) con x' = (x₁ + ε₁, x₂ + ε₂), 0 < ε₁ ≪ ε₂.

    Desarrollando el determinante (los términos ε₁·ε₂ se cancelan),
    ``det Δ(x', a, b) = det Δ(x, a, b) + ε₂·(b₁ − a₁) + ε₁·(a₂ − b₂)``, y como
    ε₁ ≪ ε₂ ≪ cualquier número del problema, el signo es el del primer término no nulo.
    Devuelve 0 solo si a == b (arista degenerada).
    """
    for termino in (orient(x, a, b), b[0] - a[0], a[1] - b[1]):
        if termino != 0:
            return 1 if termino > 0 else -1
    return 0


def aristas(P: Poligono) -> list[tuple[Punto, Punto]]:
    """Las aristas del polígono cerrado, en el orden del recorrido."""
    return [(P[i], P[(i + 1) % len(P)]) for i in range(len(P))]


def area_con_signo(P: Poligono) -> Fraction:
    """Área con signo (fórmula del cordón): > 0 si el recorrido es antihorario."""
    return Fraction(sum(a[0] * b[1] - b[0] * a[1] for a, b in aristas(P)), 2)


# ------------------------------------------------------------ algoritmo de paridad


def cruce_con_signo(x: Punto, a: Punto, b: Punto) -> int:
    """Cómo cruza la arista orientada a→b el rayo horizontal que sale de x' a la derecha.

    +1 si sube dejando a x' a su izquierda (la curva pasa «por delante» del rayo en
    sentido antihorario), −1 si baja dejándolo a su derecha, 0 si no cruza. La condición
    a₂ < x₂ + ε₂ < b₂ equivale a a₂ ≤ x₂ < b₂: todo es comparación exacta.
    """
    if a[1] <= x[1] < b[1] and orient_perturbado(x, a, b) > 0:
        return 1
    if b[1] <= x[1] < a[1] and orient_perturbado(x, a, b) < 0:
        return -1
    return 0


def cruza(x: Punto, a: Punto, b: Punto) -> bool:
    """``doesCross`` del libro (con x perturbado): ¿el rayo cruza la arista ab?"""
    if a[1] > b[1]:
        a, b = b, a  # el libro supone a debajo de b
    return a[1] <= x[1] < b[1] and orient_perturbado(x, a, b) > 0


def cruces(x: Punto, P: Poligono) -> int:
    """Cantidad de aristas que cruza el rayo (sin signo)."""
    return sum(cruza(x, a, b) for a, b in aristas(P))


def sobre_el_poligono(x: Punto, P: Poligono) -> bool:
    """¿Está x sobre alguna arista del polígono?"""
    for a, b in aristas(P):
        if (
            orient(x, a, b) == 0
            and min(a[0], b[0]) <= x[0] <= max(a[0], b[0])
            and min(a[1], b[1]) <= x[1] <= max(a[1], b[1])
        ):
            return True
    return False


def paridad(x: Punto, P: Poligono) -> Literal["adentro", "afuera", "sobre"]:
    """Algoritmo de paridad del libro para un polígono simple (con «sobre» aparte)."""
    if sobre_el_poligono(x, P):
        return "sobre"
    return "adentro" if cruces(x, P) % 2 == 1 else "afuera"


# ---------------------------------------------------------------- número de vueltas


def vueltas_por_cruces(x: Punto, P: Poligono) -> int:
    """W(γ, x) contando con signo los cruces del rayo horizontal (exacto).

    Es el grado de s ↦ (γ(s) − x)/‖γ(s) − x‖ calculado como la suma de los signos de
    las preimágenes de la dirección 0: las veces que la curva pasa por delante del rayo.
    """
    return sum(cruce_con_signo(x, a, b) for a, b in aristas(P))


def vueltas_por_angulos(x: Punto, P: Poligono) -> int:
    """W(γ, x) sumando los giros del vector unitario (la definición, discretizada).

    Usa punto flotante y redondea el ángulo total sobre 2π al entero más cercano.
    """
    total = 0.0
    for a, b in aristas(P):
        d = math.atan2(b[1] - x[1], b[0] - x[0]) - math.atan2(a[1] - x[1], a[0] - x[0])
        d = (d + math.pi) % (2 * math.pi) - math.pi
        total += d
    return round(total / (2 * math.pi))


# --------------------------------------------------------------- simplicidad


def _se_cortan(p1: Punto, p2: Punto, q1: Punto, q2: Punto) -> bool:
    """Cruce propio de los segmentos p1p2 y q1q2 (los interiores se cortan en un punto)."""
    d1, d2 = orient(q1, q2, p1), orient(q1, q2, p2)
    d3, d4 = orient(p1, p2, q1), orient(p1, p2, q2)
    return d1 * d2 < 0 and d3 * d4 < 0


def autointersecciones(P: Poligono) -> list[tuple[int, int]]:
    """Pares (i, j) de aristas no consecutivas que se cruzan (arista i = P[i]P[i+1])."""
    E = aristas(P)
    n = len(E)
    return [
        (i, j)
        for i in range(n)
        for j in range(i + 2, n)
        if not (i == 0 and j == n - 1) and _se_cortan(*E[i], *E[j])
    ]


def es_simple(P: Poligono) -> bool:
    """¿Es una curva cerrada simple? (sin vértices repetidos ni aristas que se crucen)."""
    return len(set(map(tuple, P))) == len(P) and not autointersecciones(P)


def posicion_general(P: Poligono) -> bool:
    """La hipótesis del libro: abscisas distintas y ningún trío de vértices alineado."""
    if len({p[0] for p in P}) < len(P):
        return False
    return all(orient(a, b, c) != 0 for a, b, c in combinations(P, 3))


# ------------------------------------------------------------------ triangulación


def en_triangulo(p: Punto, a: Punto, b: Punto, c: Punto) -> bool:
    """p en el triángulo cerrado abc (abc antihorario)."""
    return orient(p, a, b) >= 0 and orient(p, b, c) >= 0 and orient(p, c, a) >= 0


def _b_a_c(P: Poligono, idx: list[int]):
    """b = vértice de más a la izquierda del sub-polígono; a, c sus vecinos; los de adentro."""
    n = len(idx)
    k = min(range(n), key=lambda t: (P[idx[t]][0], P[idx[t]][1]))
    ka, kc = (k - 1) % n, (k + 1) % n
    a, b, c = P[idx[ka]], P[idx[k]], P[idx[kc]]
    adentro = [
        t for t in range(n) if t not in (ka, k, kc) and en_triangulo(P[idx[t]], a, b, c)
    ]
    return k, ka, kc, a, c, adentro


Regla = Literal["corregida", "libro"]


def diagonal(
    P: Poligono, idx: list[int], regla: Regla = "corregida"
) -> tuple[int, int]:
    """El paso inductivo de la prueba (p. 12): una diagonal del sub-polígono ``idx``.

    Toma el vértice b de más a la izquierda y sus vecinos a, c. Si ningún otro vértice
    cae en el triángulo abc, la diagonal es ac. Si no, une b con un vértice u dentro de
    abc, elegido con la ``regla``:

    - ``"corregida"``: u = el más lejano de la recta ac. Entre b y la paralela a ac por u
      no hay vértices, así que una arista que cortara bu tendría que entrar a esa franja
      sin cruzar ab ni bc: imposible.
    - ``"libro"``: u = el de más a la izquierda, como lo enuncia el libro. **Puede
      fallar** (``CONTRAEJEMPLO_LIBRO``).

    Devuelve (i, j) como posiciones dentro de ``idx``.
    """
    k, ka, kc, a, c, adentro = _b_a_c(P, idx)
    if not adentro:
        return ka, kc
    if regla == "libro":
        return k, min(adentro, key=lambda t: (P[idx[t]][0], P[idx[t]][1]))
    return k, max(adentro, key=lambda t: abs(orient(P[idx[t]], a, c)))


# Pentágono antihorario. b = (-16, 46) es el vértice de más a la izquierda; a = (42, -71)
# y c = (-8, -18) sus vecinos. Dentro de abc están (28, -48) y (21, -47). El de más a la
# izquierda es (21, -47), y el segmento que lo une con b CORTA la arista (-8, -18)-(28, -48).
CONTRAEJEMPLO_LIBRO: list[tuple[int, int]] = [
    (42, -71),
    (-16, 46),
    (-8, -18),
    (28, -48),
    (21, -47),
]


def es_diagonal(P: Poligono, i: int, j: int) -> bool:
    """¿El segmento P[i]P[j] es una diagonal (no corta aristas y va por adentro)?"""
    p, q = P[i], P[j]
    for a, b in aristas(P):
        if p in (a, b) or q in (a, b):
            continue
        if _se_cortan(p, q, a, b):
            return False
    medio = (Fraction(p[0] + q[0], 2), Fraction(p[1] + q[1], 2))
    return paridad(medio, P) == "adentro"


def triangular(P: Poligono, regla: Regla = "corregida", pasos: bool = False):
    """Triangulación por la prueba inductiva del libro. P simple y antihorario.

    Devuelve ``(triangulos, diagonales)`` con índices de P; cada diagonal parte el
    n-gono en un n₁-gono y un n₂-gono con n₁ + n₂ = n + 2. Con ``pasos=True`` devuelve
    además la lista de pasos de la prueba (para el modo Demostración de los gadgets):
    cada paso es un diccionario con el sub-polígono, b, a, c, los vértices dentro de abc
    y la diagonal elegida.
    """
    triangulos: list[tuple[int, ...]] = []
    diagonales: list[tuple[int, int]] = []
    registro = []
    pila = [list(range(len(P)))]
    while pila:
        idx = pila.pop()
        if len(idx) == 3:
            triangulos.append(tuple(idx))
            if pasos:
                registro.append({"poligono": idx, "triangulo": tuple(idx)})
            continue
        i, j = sorted(diagonal(P, idx, regla))
        if pasos:
            k, ka, kc, _, _, adentro = _b_a_c(P, idx)
            registro.append(
                {
                    "poligono": idx,
                    "b": idx[k],
                    "a": idx[ka],
                    "c": idx[kc],
                    "adentro": [idx[t] for t in adentro],
                    "diagonal": (idx[i], idx[j]),
                }
            )
        diagonales.append((idx[i], idx[j]))
        pila.append(idx[i : j + 1])
        pila.append(idx[j:] + idx[: i + 1])
    if pasos:
        return triangulos, diagonales, registro
    return triangulos, diagonales


def arbol_dual(triangulos: Sequence[tuple[int, ...]]) -> list[tuple[int, int]]:
    """Nodos = triángulos; arcos = pares de triángulos que comparten una diagonal."""
    lados: dict[frozenset, list[int]] = {}
    for t, (p, q, r) in enumerate(triangulos):
        for e in (frozenset((p, q)), frozenset((q, r)), frozenset((r, p))):
            lados.setdefault(e, []).append(t)
    return [tuple(ts) for ts in lados.values() if len(ts) == 2]


def orejas(
    triangulos: Sequence[tuple[int, ...]], arcos: Sequence[tuple[int, int]]
) -> list[int]:
    """Las hojas del árbol dual: triángulos con dos lados en el borde del polígono."""
    grado = [0] * len(triangulos)
    for s, t in arcos:
        grado[s] += 1
        grado[t] += 1
    return [t for t, g in enumerate(grado) if g <= 1]


def camino_dual(triangulos, arcos, origen: int, destino: int) -> list[int]:
    """El único camino entre dos triángulos en el árbol dual (la ola de I.1)."""
    vecinos: dict[int, list[int]] = {t: [] for t in range(len(triangulos))}
    for s, t in arcos:
        vecinos[s].append(t)
        vecinos[t].append(s)
    padre = {origen: origen}
    cola = deque([origen])
    while cola:
        u = cola.popleft()
        for v in vecinos[u]:
            if v not in padre:
                padre[v] = u
                cola.append(v)
    camino = [destino]
    while camino[-1] != origen:
        camino.append(padre[camino[-1]])
    return camino[::-1]


# ------------------------------------------------------------- galería de arte (Fisk)


def tres_coloreo(n: int, triangulos: Sequence[tuple[int, ...]]) -> list[int]:
    """3-coloreo de los vértices de una triangulación (prueba de Fisk, 1978).

    Se colorea un triángulo con 0, 1, 2 y se recorre el árbol dual: cada triángulo vecino
    comparte dos vértices ya coloreados, y su tercer vértice recibe el color que falta.
    """
    color = [-1] * n
    if not triangulos:
        return color
    for c, v in enumerate(triangulos[0]):
        color[v] = c
    arcos = arbol_dual(triangulos)
    vecinos: dict[int, list[int]] = {t: [] for t in range(len(triangulos))}
    for s, t in arcos:
        vecinos[s].append(t)
        vecinos[t].append(s)
    vistos = {0}
    cola = deque([0])
    while cola:
        u = cola.popleft()
        for t in vecinos[u]:
            if t in vistos:
                continue
            vistos.add(t)
            usados = {color[v] for v in triangulos[t] if color[v] >= 0}
            for v in triangulos[t]:
                if color[v] < 0:
                    color[v] = ({0, 1, 2} - usados).pop()
            cola.append(t)
    return color


def guardias(P: Poligono) -> list[int]:
    """Vértices donde poner ⌊n/3⌋ guardias que vigilan todo el polígono (Fisk).

    Triangula, 3-colorea y devuelve los vértices del color menos usado: cada triángulo
    tiene un vértice de cada color, así que esos guardias ven todos los triángulos.
    """
    T, _ = triangular(P)
    color = tres_coloreo(len(P), T)
    cuenta = [color.count(c) for c in range(3)]
    menor = cuenta.index(min(cuenta))
    return [v for v, c in enumerate(color) if c == menor]


# ------------------------------------------------------------------ generadores


def poligono_estrella(n: int, rng: random.Random) -> list[tuple[int, int]]:
    """Polígono aleatorio estrellado: ángulos ordenados, radios aleatorios (enteros)."""
    angs = sorted(rng.uniform(0, 2 * math.pi) for _ in range(n))
    return [
        (
            round(math.cos(t) * rng.randint(20, 100)),
            round(math.sin(t) * rng.randint(20, 100)),
        )
        for t in angs
    ]


def poligono_desenredado(n: int, rng: random.Random) -> list[tuple[int, int]]:
    """Polígono arbitrario (no estrellado): puntos al azar y «2-opt» (invertir tramos)
    hasta que no queden aristas cruzadas."""
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
                if _se_cortan(a, b, c, d):
                    P[i + 1 : j + 1] = reversed(P[i + 1 : j + 1])
                    cambio = True
    return P


def antihorario(P: Poligono) -> list:
    """El mismo polígono, recorrido en sentido antihorario."""
    return list(P) if area_con_signo(P) > 0 else list(P)[::-1]
