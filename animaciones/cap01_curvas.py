"""Animaciones de la sección I.2 (spec §7).

Escenas: RayoQueGira, ElFaro, PruebaTriangulacion, CopoDeKoch.

Renderizar (borrador / final):
    uv run manim -ql animaciones/cap01_curvas.py RayoQueGira
    uv run manim -qm animaciones/cap01_curvas.py RayoQueGira
y copiar el video a capitulos/01-grafos/media/ (nombre en snake_case).

Los conteos salen de tcomp.curvas (cruces con signo exactos), así que lo que se ve es lo
que calcula la librería.
"""

from __future__ import annotations

import math

import numpy as np
from manim import (
    DOWN,
    LEFT,
    RIGHT,
    UP,
    Arrow,
    Circle,
    Create,
    DashedLine,
    Dot,
    FadeIn,
    FadeOut,
    Flash,
    Line,
    MathTex,
    Polygon,
    Scene,
    Text,
    TracedPath,
    Transform,
    ValueTracker,
    VGroup,
    always_redraw,
    config,
    linear,
)

from tcomp.curvas import arbol_dual, cruces, orejas, triangular, vueltas_por_cruces

FONDO = "#151517"
TINTA = "#ecebe7"
TENUE = "#a9a8a1"
ACENTO = "#3987e5"
SECO = "#d95926"
CAMINO = "#c98500"
ENLACE = "#199e70"

config.background_color = FONDO


def interseccion_rayo(x, ang, a, b):
    """Corte del rayo x + t·(cos ang, sin ang), t > 0, con el segmento ab: (t, signo) o None.

    El signo es +1 si el segmento cruza el rayo de derecha a izquierda (mirando en la
    dirección del rayo), −1 si al revés: la regla de los cruces con signo, para cualquier
    dirección.
    """
    d = np.array([math.cos(ang), math.sin(ang)])
    a, b, x = np.array(a, float), np.array(b, float), np.array(x, float)
    e = b - a
    den = d[0] * (-e[1]) - d[1] * (-e[0])
    if abs(den) < 1e-12:
        return None
    w = a - x
    t = (w[0] * (-e[1]) - w[1] * (-e[0])) / den
    s = (d[0] * w[1] - d[1] * w[0]) / den
    if t <= 0 or not (0 <= s < 1):
        return None
    signo = 1 if (d[0] * e[1] - d[1] * e[0]) > 0 else -1
    return t, signo


def limacon(n=160, escala=1.0):
    pts = []
    for k in range(n):
        t = 2 * math.pi * (k + 0.5) / n
        r = 1.9 * (0.5 + math.cos(t)) * escala
        pts.append((r * math.cos(t) - 0.9 * escala, r * math.sin(t)))
    return pts


class RayoQueGira(Scene):
    """El rayo desde x gira 360°: los cruces cambian, pero su paridad nunca."""

    def construct(self):
        titulo = Text(
            "El rayo gira: los cruces cambian, la paridad no", font_size=30, color=TINTA
        )
        titulo.to_edge(UP, buff=0.3)
        # una curva de Jordan con entrantes (un polígono estrellado)
        P = []
        for k in range(14):
            r = 2.7 if k % 2 == 0 else 0.85
            t = math.pi * k / 7 + 0.2
            P.append((r * math.cos(t) - 1.6, r * math.sin(t) * 0.9 - 0.2))
        x = (
            -0.3,
            -0.2,
        )  # adentro, cerca de una punta: 1, 3 o 5 cruces según la dirección
        curva = Polygon(*[(*p, 0) for p in P], color=TINTA, stroke_width=3)
        punto = Dot((*x, 0), color=TINTA, radius=0.11)
        self.play(FadeIn(titulo), Create(curva), FadeIn(punto))

        ang = ValueTracker(0.0)
        aristas = list(zip(P, P[1:] + P[:1]))

        def cortes():
            return [
                c
                for a, b in aristas
                if (c := interseccion_rayo(x, ang.get_value(), a, b))
            ]

        rayo = always_redraw(
            lambda: Line(
                (*x, 0),
                (
                    x[0] + 5.2 * math.cos(ang.get_value()),
                    x[1] + 5.2 * math.sin(ang.get_value()),
                    0,
                ),
                color=CAMINO,
                stroke_width=3,
            )
        )
        marcas = always_redraw(
            lambda: VGroup(
                *[
                    Dot(
                        (
                            x[0] + t * math.cos(ang.get_value()),
                            x[1] + t * math.sin(ang.get_value()),
                            0,
                        ),
                        radius=0.08,
                        color=ACENTO if s > 0 else SECO,
                    )
                    for t, s in cortes()
                ]
            )
        )

        def tablero():
            c = cortes()
            n = len(c)
            w = sum(s for _, s in c)
            return (
                VGroup(
                    Text(f"cruces: {n}", font_size=30, color=TINTA),
                    Text(
                        f"paridad: {'impar' if n % 2 else 'par'}",
                        font_size=30,
                        color=ENLACE,
                    ),
                    Text(f"con signo: {w}", font_size=26, color=TENUE),
                )
                .arrange(DOWN, aligned_edge=LEFT, buff=0.2)
                .to_edge(RIGHT, buff=0.6)
            )

        info = always_redraw(tablero)
        self.add(curva, rayo, marcas, punto, info)
        self.play(ang.animate.set_value(2 * math.pi), run_time=12, rate_func=linear)
        cierre = Text(
            "los cruces aparecen y desaparecen de a pares: la paridad es la del punto",
            font_size=22,
            color=TINTA,
        ).to_edge(DOWN, buff=0.3)
        self.play(FadeIn(cierre))
        self.wait(2)


class ElFaro(Scene):
    """El observador en x mira un punto que recorre el limaçon: dos vueltas."""

    def construct(self):
        titulo = Text(
            "El faro: cuántas vueltas da la cabeza", font_size=30, color=TINTA
        )
        titulo.to_edge(UP, buff=0.3)
        P = limacon(160)
        desplazar = np.array([-2.0, -0.3, 0])
        curva = Polygon(
            *[np.array([*p, 0]) + desplazar for p in P], color=TINTA, stroke_width=3
        )
        x = (-0.45, 0.0)
        xs = np.array([*x, 0]) + desplazar
        w = vueltas_por_cruces(
            (round(x[0] * 1000), round(x[1] * 1000)),
            [(round(a * 1000), round(b * 1000)) for a, b in P],
        )
        punto = Dot(xs, color=SECO, radius=0.09)
        self.play(FadeIn(titulo), Create(curva), FadeIn(punto))

        s = ValueTracker(0.0)
        n = len(P)

        def gamma(t):
            f = (t % 1) * n
            i = int(f) % n
            u = f - int(f)
            a, b = np.array(P[i]), np.array(P[(i + 1) % n])
            return np.array([*(a + u * (b - a)), 0]) + desplazar

        movil = always_redraw(
            lambda: Dot(gamma(s.get_value()), color=CAMINO, radius=0.08)
        )
        rayo = always_redraw(
            lambda: Line(xs, gamma(s.get_value()), color=CAMINO, stroke_width=3)
        )
        # el dial: la dirección del vector unitario, con traza en espiral
        centro = np.array([4.0, 0.2, 0])
        dial = Circle(radius=1.4, color=TENUE, stroke_width=2).move_to(centro)
        acumulado = ValueTracker(0.0)

        def angulo(t):
            g = gamma(t) - xs
            return math.atan2(g[1], g[0])

        previo = [angulo(0.0)]

        def actualizar(m):
            a = angulo(s.get_value())
            d = (a - previo[0] + math.pi) % (2 * math.pi) - math.pi
            acumulado.increment_value(d)
            previo[0] = a

        acumulado.add_updater(actualizar)
        aguja = always_redraw(
            lambda: Arrow(
                centro,
                centro + 1.3 * np.array([math.cos(previo[0]), math.sin(previo[0]), 0]),
                buff=0,
                color=CAMINO,
                stroke_width=5,
            )
        )
        espiral_punto = always_redraw(
            lambda: Dot(
                centro
                + (0.35 + 0.25 * abs(acumulado.get_value()) / (2 * math.pi))
                * np.array([math.cos(previo[0]), math.sin(previo[0]), 0]),
                radius=0.02,
                color=ACENTO,
            )
        )
        traza = TracedPath(
            espiral_punto.get_center, stroke_color=ACENTO, stroke_width=3
        )
        contador = always_redraw(
            lambda: MathTex(
                rf"\text{{vueltas}} = {acumulado.get_value() / (2 * math.pi):.2f}",
                color=TINTA,
                font_size=40,
            ).next_to(dial, DOWN, buff=0.4)
        )
        self.add(acumulado)
        self.play(
            FadeIn(dial), FadeIn(aguja), FadeIn(contador), FadeIn(movil), FadeIn(rayo)
        )
        self.add(traza, espiral_punto)
        self.play(s.animate.set_value(1.0), run_time=10, rate_func=linear)
        acumulado.clear_updaters()
        final = MathTex(rf"W(\gamma, x) = {w}", color=ACENTO, font_size=48).next_to(
            contador, DOWN, buff=0.3
        )
        self.play(FadeIn(final))
        self.wait(2)


# Decágono en «Y» (semilla 1343 de poligono_desenredado): en el primer paso hay dos
# vértices dentro de abc y la regla del libro (el de más a la izquierda) da un segmento que
# corta una arista. Antihorario, como pide triangular().
DECAGONO = [
    (24, 93),
    (-79, 82),
    (-66, -28),
    (-30, 58),
    (-16, 34),
    (-40, 23),
    (-39, -54),
    (-12, -47),
    (-13, 20),
    (54, 75),
]
COLORES_T = [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#4fa34f",
    "#9085e9",
    "#c08550",
]


def corte_de_segmentos(p, q, a, b):
    """Punto donde el segmento pq corta propiamente al segmento ab (floats), o None."""
    p, q, a, b = (np.array(v, float) for v in (p, q, a, b))
    r, s = q - p, b - a
    den = r[0] * s[1] - r[1] * s[0]
    if abs(den) < 1e-12:
        return None
    t = ((a - p)[0] * s[1] - (a - p)[1] * s[0]) / den
    u = ((a - p)[0] * r[1] - (a - p)[1] * r[0]) / den
    if 1e-9 < t < 1 - 1e-9 and 1e-9 < u < 1 - 1e-9:
        return p + t * r
    return None


def disposicion_arbol(n, arcos):
    """Coordenadas (x, nivel) de un árbol, prolijo: hojas en orden y padres centrados.
    La raíz es un centro del árbol (así queda lo más bajo posible)."""
    vecinos = {v: [] for v in range(n)}
    for s, t in arcos:
        vecinos[s].append(t)
        vecinos[t].append(s)

    def altura(raiz):
        nivel, frente, vistos = 0, [raiz], {raiz}
        while frente:
            frente = [w for v in frente for w in vecinos[v] if w not in vistos]
            vistos.update(frente)
            nivel += 1
        return nivel

    raiz = min(range(n), key=altura)
    pos, siguiente = {}, [0]

    def ubicar(v, padre, nivel):
        hijos = [w for w in vecinos[v] if w != padre]
        for w in hijos:
            ubicar(w, v, nivel + 1)
        if hijos:
            x = sum(pos[w][0] for w in hijos) / len(hijos)
        else:
            x = siguiente[0]
            siguiente[0] += 1
        pos[v] = (x, nivel)

    ubicar(raiz, None, 0)
    return pos


class PruebaTriangulacion(Scene):
    """La inducción del libro (p. 12) con la regla corregida y el árbol dual al costado."""

    def construct(self):
        P = DECAGONO
        n = len(P)
        triangulos, diagonales, pasos = triangular(P, "corregida", pasos=True)
        arcos = arbol_dual(triangulos)
        hojas = orejas(triangulos, arcos)

        escala, centro = 0.039, np.array([-3.3, -0.2, 0])
        medio = np.array([(-79 + 54) / 2, (-54 + 93) / 2])

        def M(i_o_p):
            p = P[i_o_p] if isinstance(i_o_p, int) else i_o_p
            return np.array([*(np.array(p, float) - medio) * escala, 0]) + centro

        titulo = Text(
            "Todo polígono se triangula: la prueba inductiva", font_size=30, color=TINTA
        ).to_edge(UP, buff=0.3)
        poligono = Polygon(*[M(i) for i in range(n)], color=TINTA, stroke_width=3)
        vertices = VGroup(*[Dot(M(i), radius=0.05, color=TINTA) for i in range(n)])
        self.play(FadeIn(titulo), Create(poligono), FadeIn(vertices), run_time=2)

        def leyenda(texto, color=TINTA):
            return Text(texto, font_size=22, color=color).to_edge(DOWN, buff=0.35)

        # ---------------------------------------------------------------- el árbol dual
        pos = disposicion_arbol(len(triangulos), arcos)
        xs = [p[0] for p in pos.values()]
        niveles = max(p[1] for p in pos.values())
        caja_x, caja_y = (2.3, 6.3), (1.45, -2.75)

        def A(t):
            x, nivel = pos[t]
            fx = (x - min(xs)) / max(1, max(xs) - min(xs))
            fy = nivel / max(1, niveles)
            return np.array(
                [
                    caja_x[0] + fx * (caja_x[1] - caja_x[0]),
                    caja_y[0] + fy * (caja_y[1] - caja_y[0]),
                    0,
                ]
            )

        rotulo_arbol = Text("árbol dual", font_size=24, color=TENUE).move_to(
            [sum(caja_x) / 2, 2.85, 0]
        )
        contador = VGroup(
            Text("triángulos: 0", font_size=22, color=TINTA),
            Text("diagonales: 0", font_size=22, color=TINTA),
        ).arrange(RIGHT, buff=0.4)
        contador.move_to([sum(caja_x) / 2, 2.3, 0])
        self.play(FadeIn(rotulo_arbol), FadeIn(contador))

        def actualizar_contador(nt, nd):
            nuevo = VGroup(
                Text(f"triángulos: {nt}", font_size=22, color=TINTA),
                Text(f"diagonales: {nd}", font_size=22, color=TINTA),
            ).arrange(RIGHT, buff=0.4)
            nuevo.move_to(contador.get_center())
            contador.become(nuevo)

        # ---------------------------------------------------------------- primer paso, lento
        p0 = pasos[0]
        b, a, c = p0["b"], p0["a"], p0["c"]
        texto = leyenda("b = el vértice de más a la izquierda; a y c, sus vecinos")
        etiquetas = VGroup(
            Text("b", font_size=26, color=CAMINO).next_to(M(b), LEFT, buff=0.12),
            Text("a", font_size=26, color=CAMINO).next_to(M(a), RIGHT, buff=0.12),
            Text("c", font_size=26, color=CAMINO).next_to(M(c), LEFT, buff=0.12),
        )
        tri = Polygon(M(a), M(b), M(c), color=CAMINO, stroke_width=2)
        tri.set_fill(CAMINO, opacity=0.12)
        self.play(FadeIn(texto), FadeIn(etiquetas), Create(tri))
        self.wait(1.5)
        adentro = VGroup(*[Dot(M(u), radius=0.1, color=CAMINO) for u in p0["adentro"]])
        self.play(
            texto.animate.become(
                leyenda("hay vértices dentro de abc: ac no sirve como diagonal")
            ),
            FadeIn(adentro),
        )
        self.wait(1.5)
        # la regla del libro: el de más a la izquierda
        u_libro = min(p0["adentro"], key=lambda t: P[t])
        rojo = Line(M(b), M(u_libro), color=SECO, stroke_width=5)
        corte = next(
            q
            for i in range(n)
            if (q := corte_de_segmentos(P[b], P[u_libro], P[i], P[(i + 1) % n]))
            is not None
        )
        self.play(
            texto.animate.become(
                leyenda("regla del libro: unir b con el de más a la izquierda…", SECO)
            ),
            Create(rojo),
        )
        marca = Dot(M(tuple(corte)), radius=0.11, color=SECO)
        self.play(FadeIn(marca), Flash(M(tuple(corte)), color=SECO))
        self.play(
            texto.animate.become(
                leyenda("…corta una arista: la errata del libro", SECO)
            )
        )
        self.wait(1.5)
        # la regla corregida: el más lejano de la recta ac, con la franja vacía
        u = p0["diagonal"][1] if p0["diagonal"][0] == b else p0["diagonal"][0]
        d = np.array(P[c], float) - np.array(P[a], float)
        paralela = DashedLine(
            M(tuple(np.array(P[u]) - 0.22 * d)),
            M(tuple(np.array(P[u]) + 0.3 * d)),
            color=ENLACE,
            stroke_width=2,
        )
        self.play(
            FadeOut(rojo),
            FadeOut(marca),
            texto.animate.become(
                leyenda(
                    "corregida: el más lejano de la recta ac; entre b y la paralela no hay vértices",
                    ENLACE,
                )
            ),
            Create(paralela),
        )
        self.wait(1.5)
        verde = Line(M(b), M(u), color=ENLACE, stroke_width=5)
        self.play(Create(verde))
        self.play(
            texto.animate.become(
                leyenda(
                    "la diagonal parte el n-gono en dos polígonos más chicos: inducción"
                )
            )
        )
        self.wait(1.5)
        self.play(FadeOut(tri), FadeOut(adentro), FadeOut(paralela), FadeOut(etiquetas))
        diagonales_dibujadas = [verde]
        nd, nt = 1, 0
        actualizar_contador(nt, nd)

        # ---------------------------------------------------------------- el resto, rápido
        nodos, t_idx = {}, 0
        self.play(
            texto.animate.become(
                leyenda("se repite en cada pedazo hasta que solo quedan triángulos")
            )
        )
        for paso in pasos[1:]:
            if "diagonal" in paso:
                i, j = paso["diagonal"]
                pb, pa, pc = paso["b"], paso["a"], paso["c"]
                guia = Polygon(M(pa), M(pb), M(pc), color=CAMINO, stroke_width=2)
                linea = Line(M(i), M(j), color=ENLACE, stroke_width=4)
                nd += 1
                self.play(Create(guia), run_time=0.4)
                self.play(Create(linea), FadeOut(guia), run_time=0.5)
                actualizar_contador(nt, nd)
                diagonales_dibujadas.append(linea)
            else:
                t = paso["triangulo"]
                color = COLORES_T[t_idx % len(COLORES_T)]
                relleno = Polygon(*[M(v) for v in t], stroke_width=0)
                relleno.set_fill(color, opacity=0.45)
                nodo = Dot(A(t_idx), radius=0.13, color=color)
                aristas_nuevas = [
                    Line(A(s1), A(s2), color=TENUE, stroke_width=3)
                    for s1, s2 in arcos
                    if t_idx in (s1, s2) and (s1 if s2 == t_idx else s2) in nodos
                ]
                nodos[t_idx] = nodo
                nt += 1
                actualizar_contador(nt, nd)
                self.play(
                    FadeIn(relleno),
                    FadeIn(nodo),
                    *[Create(e) for e in aristas_nuevas],
                    run_time=0.6,
                )
                for e in aristas_nuevas:
                    self.bring_to_back(e)
                t_idx += 1
        self.wait(1)

        # ---------------------------------------------------------------- el cierre
        resumen = leyenda(
            f"n = {n}: n − 2 = {len(triangulos)} triángulos, n − 3 = {len(diagonales)} diagonales"
        )
        self.play(texto.animate.become(resumen))
        self.wait(2)
        anillos = VGroup(
            *[
                Circle(radius=0.22, color=TINTA, stroke_width=3).move_to(A(h))
                for h in hojas
            ]
        )
        orejas_poly = VGroup(
            *[
                Polygon(*[M(v) for v in triangulos[h]], color=TINTA, stroke_width=5)
                for h in hojas
            ]
        )
        self.play(
            texto.animate.become(
                leyenda(
                    f"las hojas del árbol son orejas: hay al menos dos (acá, {len(hojas)})"
                )
            ),
            Create(anillos),
            Create(orejas_poly),
        )
        self.wait(3)


def copo_de_koch(nivel, radio=1.0):
    """Copo de Koch antihorario de circunradio ``radio``: cada lado se parte en tres y el
    tercio del medio se reemplaza por dos lados de un triángulo equilátero hacia afuera."""
    P = [
        (
            radio * math.cos(math.pi / 2 + 2 * math.pi * k / 3),
            radio * math.sin(math.pi / 2 + 2 * math.pi * k / 3),
        )
        for k in range(3)
    ]
    giro = (math.cos(-math.pi / 3), math.sin(-math.pi / 3))
    for _ in range(nivel):
        Q = []
        for i, a in enumerate(P):
            b = P[(i + 1) % len(P)]
            d = ((b[0] - a[0]) / 3, (b[1] - a[1]) / 3)
            p1 = (a[0] + d[0], a[1] + d[1])
            p3 = (a[0] + 2 * d[0], a[1] + 2 * d[1])
            p2 = (
                p1[0] + d[0] * giro[0] - d[1] * giro[1],
                p1[1] + d[0] * giro[1] + d[1] * giro[0],
            )
            Q += [a, p1, p2, p3]
        P = Q
    return P


def subdividir(P, partes=4):
    """Cada lado partido en ``partes`` tramos alineados (para que el nivel k se transforme
    en el k + 1 con los bultos creciendo desde los lados)."""
    Q = []
    for i, a in enumerate(P):
        b = P[(i + 1) % len(P)]
        Q += [
            (a[0] + (b[0] - a[0]) * t / partes, a[1] + (b[1] - a[1]) * t / partes)
            for t in range(partes)
        ]
    return Q


class CopoDeKoch(Scene):
    """Jordan sin tangentes: el copo de Koch, nivel a nivel, con dos rayos de paridad."""

    def construct(self):
        niveles = 5
        x_adentro, x_afuera = (0.0, 0.6157), (1.0, -0.1643)
        escala, centro = 2.5, np.array([-3.4, -0.45, 0])

        def M(p):
            return np.array([p[0] * escala, p[1] * escala, 0]) + centro

        E = 10**6

        def contar(x, P, direccion):
            """Cruces del rayo (derecha: +1, izquierda: −1), con tcomp y exactos: el rayo
            hacia la izquierda es el rayo hacia la derecha del polígono reflejado."""
            s = direccion
            Pe = [(round(s * a * E), round(b * E)) for a, b in P]
            return cruces((round(s * x[0] * E), round(x[1] * E)), Pe)

        def marcas(x, P, ang):
            radio = 0.06 if len(P) <= 48 else 0.035
            pts = []
            for i, a in enumerate(P):
                b = P[(i + 1) % len(P)]
                if (c := interseccion_rayo(x, ang, a, b)) is not None:
                    t, signo = c
                    q = (x[0] + t * math.cos(ang), x[1] + t * math.sin(ang))
                    pts.append(
                        Dot(M(q), radius=radio, color=ACENTO if signo > 0 else SECO)
                    )
            return VGroup(*pts)

        titulo = Text(
            "Jordan sin tangentes: el copo de Koch", font_size=30, color=TINTA
        ).to_edge(UP, buff=0.3)
        self.play(FadeIn(titulo))

        copos = [copo_de_koch(k) for k in range(niveles + 1)]
        curva = Polygon(*[M(p) for p in copos[0]], color=TINTA, stroke_width=2.5)
        punto_a = Dot(M(x_adentro), radius=0.08, color=ENLACE)
        punto_b = Dot(M(x_afuera), radius=0.08, color=CAMINO)
        rayo_a = Line(
            M(x_adentro), M((1.25, x_adentro[1])), color=ENLACE, stroke_width=2
        )
        rayo_b = Line(M(x_afuera), M((-1.1, x_afuera[1])), color=CAMINO, stroke_width=2)
        rotulos = VGroup(
            Text("x", font_size=24, color=ENLACE).next_to(
                punto_a, UP + LEFT, buff=0.05
            ),
            Text("x′", font_size=24, color=CAMINO).next_to(punto_b, DOWN, buff=0.1),
        )
        self.play(Create(curva), run_time=1.5)
        self.play(
            FadeIn(punto_a),
            FadeIn(punto_b),
            Create(rayo_a),
            Create(rayo_b),
            FadeIn(rotulos),
        )

        # la tabla, a la derecha
        columnas = [0.9, 2.0, 3.65, 5.55]
        cabecera = VGroup(
            *[
                Text(t, font_size=21, color=c).move_to([cx, 2.6, 0])
                for t, c, cx in zip(
                    ["nivel", "lados", "cruces de x", "cruces de x′"],
                    [TENUE, TENUE, ENLACE, CAMINO],
                    columnas,
                )
            ]
        )
        self.play(FadeIn(cabecera))

        def leyenda(texto, color=TINTA):
            return Text(texto, font_size=22, color=color).to_edge(DOWN, buff=0.35)

        texto = leyenda("la paridad de los cruces dice adentro (impar) o afuera (par)")
        self.play(FadeIn(texto))
        marcas_a = marcas(x_adentro, copos[0], 0.0)
        marcas_b = marcas(x_afuera, copos[0], math.pi)
        self.play(FadeIn(marcas_a), FadeIn(marcas_b))
        filas = VGroup()
        for k in range(niveles + 1):
            P = copos[k]
            if k > 0:
                previo = Polygon(
                    *[M(p) for p in subdividir(copos[k - 1])],
                    color=TINTA,
                    stroke_width=2.5,
                )
                self.remove(curva)
                curva = previo
                self.add(curva)
                nueva = Polygon(*[M(p) for p in P], color=TINTA, stroke_width=2.5)
                nuevas_a = marcas(x_adentro, P, 0.0)
                nuevas_b = marcas(x_afuera, P, math.pi)
                self.play(
                    Transform(curva, nueva),
                    FadeOut(marcas_a),
                    FadeOut(marcas_b),
                    run_time=1.6,
                )
                marcas_a, marcas_b = nuevas_a, nuevas_b
                self.play(FadeIn(marcas_a), FadeIn(marcas_b), run_time=0.5)
            na, nb = contar(x_adentro, P, 1), contar(x_afuera, P, -1)
            # el gemelo verificado: lo dibujado (floats) coincide con tcomp (exacto)
            assert (na, nb) == (len(marcas_a), len(marcas_b)), (k, na, nb)
            assert na % 2 == 1 and nb % 2 == 0
            y = 2.05 - 0.5 * k
            fila = VGroup(
                Text(str(k), font_size=22, color=TINTA).move_to([columnas[0], y, 0]),
                Text(str(len(P)), font_size=22, color=TINTA).move_to(
                    [columnas[1], y, 0]
                ),
                Text(f"{na} · impar", font_size=22, color=ENLACE).move_to(
                    [columnas[2], y, 0]
                ),
                Text(f"{nb} · par", font_size=22, color=CAMINO).move_to(
                    [columnas[3], y, 0]
                ),
            )
            filas.add(fila)
            self.play(FadeIn(fila), run_time=0.6)
            if k == 2:
                self.play(
                    texto.animate.become(
                        leyenda(
                            "cada nivel: 4 veces más lados y una longitud 4/3 mayor"
                        )
                    )
                )
            if k == 4:
                self.play(
                    texto.animate.become(
                        leyenda(
                            "los cruces cambian, la paridad nunca: aparecen de a pares"
                        )
                    )
                )
            self.wait(0.6)

        self.wait(1)
        self.play(
            texto.animate.become(
                leyenda(
                    "en el límite: longitud infinita y sin tangente en ningún punto"
                )
            )
        )
        self.wait(2.5)
        self.play(
            texto.animate.become(
                leyenda(
                    "y aun así es una curva de Jordan: separa el plano en adentro y afuera",
                    ENLACE,
                )
            )
        )
        self.wait(3)
