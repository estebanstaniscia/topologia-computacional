"""Animaciones de la sección I.1 (spec 3.10).

Escenas: DosEstrategias, UnionPorTamano, CompresionDeCaminos,
DeCaminoDiscretoAContinuo y PersistenciaCero.

Renderizar (borrador / final), por ejemplo:
    uv run manim -ql animaciones/cap01_union_find.py PersistenciaCero
    uv run manim -qm animaciones/cap01_union_find.py PersistenciaCero
y copiar el video a capitulos/01-grafos/media/ (nombre en snake_case).

Los datos salen de tcomp: las fusiones son las de tcomp.persistencia.kruskal y
quién cuelga de quién lo decide tcomp.union_find (con su traza), así que la
animación muestra exactamente lo que calcula la librería.
"""

from __future__ import annotations

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
    DecimalNumber,
    Dot,
    FadeIn,
    FadeOut,
    Indicate,
    Integer,
    Line,
    MathTex,
    NumberLine,
    Scene,
    Text,
    TracedPath,
    ValueTracker,
    VGroup,
    always_redraw,
    config,
    linear,
)

from tcomp.conexidad import certificado
from tcomp.persistencia import kruskal
from tcomp.union_find import UnionFind

# paleta del sitio (modo oscuro), la misma de assets/estilo.css
FONDO = "#151517"
TINTA = "#ecebe7"
TENUE = "#a9a8a1"
LINEA = "#3a3a40"
BARRA = "#3987e5"
MARCA = "#d95926"
ENLACE = "#199e70"
RECHAZO = "#e66767"
CAMINO = "#c98500"
COMPRESION = "#9085e9"
CATEGORICA = [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#008300",
    "#9085e9",
]

config.background_color = FONDO


def nube(semilla: int = 4) -> np.ndarray:
    """Tres grupos de puntos en el plano (coordenadas de escena)."""
    rng = np.random.default_rng(semilla)
    centros = np.array([[-2.2, -1.1], [1.3, -1.3], [-0.5, 1.7]])
    return np.vstack([c + rng.normal(scale=0.36, size=(5, 2)) for c in centros])


class PersistenciaCero(Scene):
    """Bolas que crecen, componentes que se fusionan y el código de barras en paralelo."""

    def construct(self):
        X = nube()
        n = len(X)
        fusiones = kruskal(
            X
        )  # [(ε, i, j)] en orden: las aristas del árbol generador mínimo
        eps_max = fusiones[-1][0] * 1.12

        # quién muere en cada fusión: la raíz x que pasa a colgar de y (tcomp decide)
        uf = UnionFind(n, trazar=True)
        eventos = []
        for eps, i, j in fusiones:
            uf.union(i, j)
            x, y = uf.traza[-1].enlace
            eventos.append((eps, i, j, x, y))

        # ---------------------------------------------------------------- la nube
        desplazar = np.array([-3.2, -0.2, 0])
        P = [np.array([*p, 0.0]) + desplazar for p in X]
        eps = ValueTracker(0.0)
        bolas = VGroup(
            *[
                always_redraw(
                    lambda p=p: Circle(
                        radius=max(eps.get_value() / 2, 1e-3),
                        stroke_width=1.2,
                        stroke_color=TENUE,
                        fill_color=TENUE,
                        fill_opacity=0.08,
                    ).move_to(p)
                )
                for p in P
            ]
        )
        puntos = [Dot(p, radius=0.07, color=TINTA) for p in P]

        # ---------------------------------------------------------- el código de barras
        x0, ancho = 1.0, 4.9
        escala = ancho / eps_max
        muerte = {x: e for e, _, _, x, _ in eventos}  # cada raíz que muere, con su ε
        orden = sorted(
            range(n), key=lambda v: muerte.get(v, np.inf)
        )  # la sobreviviente al final
        fila = {v: k for k, v in enumerate(orden)}
        y_arriba, dy = 2.6, 0.32

        def barra(v):
            def dibujar():
                fin = min(eps.get_value(), muerte.get(v, np.inf))
                y = y_arriba - fila[v] * dy
                return Line(
                    [x0, y, 0],
                    [x0 + max(fin, 1e-3) * escala, y, 0],
                    stroke_width=5,
                    color=BARRA,
                )

            return always_redraw(dibujar)

        barras = VGroup(*[barra(v) for v in range(n)])
        eje = Line(
            [x0, y_arriba - n * dy - 0.05, 0],
            [x0 + ancho, y_arriba - n * dy - 0.05, 0],
            color=LINEA,
        )
        marca = always_redraw(
            lambda: Line(
                [x0 + eps.get_value() * escala, y_arriba + 0.2, 0],
                [x0 + eps.get_value() * escala, y_arriba - n * dy - 0.05, 0],
                color=MARCA,
                stroke_width=2,
            )
        )

        # ---------------------------------------------------------- textos y contadores
        titulo = Text("Persistencia en dimensión 0", font_size=30, color=TINTA).to_edge(
            UP, buff=0.35
        )
        etiqueta_eps = MathTex(r"\varepsilon =", color=TINTA, font_size=34)
        valor_eps = always_redraw(
            lambda: DecimalNumber(
                eps.get_value(), num_decimal_places=2, color=TINTA, font_size=34
            ).next_to(etiqueta_eps, RIGHT, buff=0.15)
        )
        etiqueta_b0 = MathTex(r"\beta_0 =", color=TINTA, font_size=34)
        contadores = VGroup(etiqueta_eps, etiqueta_b0).arrange(
            DOWN, aligned_edge=LEFT, buff=0.25
        )
        contadores.to_corner(DOWN + LEFT, buff=0.5)
        cuenta = ValueTracker(n)
        b0 = always_redraw(
            lambda: Integer(
                round(cuenta.get_value()), color=TINTA, font_size=34
            ).next_to(etiqueta_b0, RIGHT, buff=0.15)
        )
        leyenda = Text(
            "cada barra que muere es una Union exitosa", font_size=20, color=TENUE
        )
        leyenda.scale_to_fit_width(min(leyenda.width, ancho)).next_to(
            eje, DOWN, buff=0.3
        ).align_to(eje, LEFT)

        self.add(bolas)
        self.play(
            FadeIn(titulo), *[FadeIn(d) for d in puntos], FadeIn(contadores), FadeIn(b0)
        )
        self.play(
            Create(eje),
            FadeIn(barras),
            FadeIn(marca),
            FadeIn(valor_eps),
            FadeIn(leyenda),
        )
        self.wait(0.5)

        # --------------------------------------------------------------- la filtración
        color_de = {}  # color de cada componente, por su raíz (sigue a la componente)
        raiz_de = list(range(n))
        libres = list(range(len(CATEGORICA)))
        componentes = n
        aristas = []  # (i, j, Line): al fusionarse, toda la componente toma un color
        for e, i, j, x, y in eventos:
            self.play(
                eps.animate.set_value(e),
                run_time=max(0.35, 2.2 * (e - eps.get_value())),
                rate_func=linear,
            )
            if y not in color_de:
                color_de[y] = (
                    color_de.pop(x) if x in color_de else CATEGORICA[libres.pop(0)]
                )
            elif x in color_de:
                libres.insert(0, CATEGORICA.index(color_de.pop(x)))
            for v in range(n):
                if raiz_de[v] == x:
                    raiz_de[v] = y
            miembros = [v for v in range(n) if raiz_de[v] == y]
            componentes -= 1
            arista = Line(P[i], P[j], color=color_de[y], stroke_width=4)
            viejas = [ln for a, b, ln in aristas if raiz_de[a] == y]
            aristas.append((i, j, arista))
            self.play(
                Create(arista),
                *[puntos[v].animate.set_color(color_de[y]) for v in miembros],
                *[ln.animate.set_color(color_de[y]) for ln in viejas],
                cuenta.animate.set_value(componentes),
                run_time=0.45,
            )
            self.bring_to_front(*puntos)
        self.play(eps.animate.set_value(eps_max), run_time=1.0, rate_func=linear)
        sobreviviente = orden[-1]
        y_inf = y_arriba - fila[sobreviviente] * dy
        infinito = MathTex(r"\to \infty", color=BARRA, font_size=30).move_to(
            [x0 + ancho + 0.45, y_inf, 0]
        )
        final = Text(
            "una componente sobrevive: la barra infinita", font_size=22, color=TINTA
        )
        final.scale_to_fit_width(min(final.width, ancho)).next_to(
            leyenda, DOWN, buff=0.2
        ).align_to(leyenda, LEFT)
        self.play(FadeIn(final), FadeIn(infinito))
        self.wait(2)


# ============================================================ utilidades comunes


def nodo(etiqueta: str, pos, color=TINTA, radio=0.28) -> VGroup:
    """Un vértice: círculo con su etiqueta (las del libro, 1..n)."""
    c = Circle(
        radius=radio, color=color, stroke_width=3, fill_color=FONDO, fill_opacity=1
    )
    t = Text(etiqueta, font_size=24, color=TINTA)
    return VGroup(c, t).move_to(pos)


def layout_bosque(
    parent: list[int], dx: float = 0.9, dy: float = 1.15, arriba: float = 2.2
) -> dict[int, np.ndarray]:
    """Posiciones de un bosque de up-trees: raíces arriba, hijos debajo, x por hojas."""
    n = len(parent)
    hijos = {v: [] for v in range(n)}
    raices = []
    for v in range(n):
        (raices if parent[v] == v else hijos[parent[v]]).append(v)
    pos, cursor = {}, [0.0]

    def ubicar(v, d):
        if not hijos[v]:
            pos[v] = [cursor[0], d]
            cursor[0] += 1
            return
        for h in sorted(hijos[v]):
            ubicar(h, d + 1)
        xs = [pos[h][0] for h in hijos[v]]
        pos[v] = [(min(xs) + max(xs)) / 2, d]

    for r in sorted(raices):
        ubicar(r, 0)
        cursor[0] += 0.5
    ancho = cursor[0] - 1.5
    return {
        v: np.array([(x - ancho / 2) * dx, arriba - d * dy, 0.0])
        for v, (x, d) in pos.items()
    }


def flechas_bosque(parent, nodos, color=TENUE, resaltar=None) -> VGroup:
    """Una flecha de cada nodo a su padre (las raíces se apuntan a sí mismas: sin flecha)."""
    resaltar = resaltar or {}
    grupo = VGroup()
    for v, p in enumerate(parent):
        if p != v:
            grupo.add(
                Arrow(
                    nodos[v].get_center(),
                    nodos[p].get_center(),
                    buff=0.3,
                    stroke_width=3,
                    max_tip_length_to_length_ratio=0.2,
                    color=resaltar.get(v, color),
                )
            )
    return grupo


# ============================================================ escena 1


class DosEstrategias(Scene):
    """El escultor y el albañil: dos caminos opuestos al mismo tipo de objeto (Prop. 2)."""

    def construct(self):
        pts = [
            (-1.6, 0.9),
            (0.0, 1.6),
            (1.6, 0.9),
            (1.2, -0.9),
            (-1.2, -0.9),
            (0.0, 0.0),
        ]
        aristas = [
            (0, 1),
            (1, 2),
            (2, 3),
            (3, 4),
            (4, 0),
            (0, 5),
            (1, 5),
            (2, 5),
            (3, 5),
        ]
        n = len(pts)

        titulo = Text(
            "Proposición 2: conexo ⟺ tiene árbol generador", font_size=28, color=TINTA
        )
        titulo.to_edge(UP, buff=0.3)
        self.play(FadeIn(titulo))

        def panel(dx, nombre, sub):
            P = [np.array([x * 1.25 + dx, y * 1.25 - 0.3, 0]) for x, y in pts]
            cab = VGroup(
                Text(nombre, font_size=26, color=TINTA),
                Text(sub, font_size=18, color=TENUE),
            ).arrange(DOWN, buff=0.1)
            cab.move_to([dx, 2.45, 0])
            return P, cab

        PI, cabI = panel(-3.4, "El escultor", "saca aristas de ciclos (la prueba)")
        PD, cabD = panel(
            3.4, "El albañil", "pone aristas, rechaza ciclos (el algoritmo)"
        )
        separador = DashedLine([0, 2.9, 0], [0, -3.2, 0], color=LINEA)
        nodosI = [nodo(str(i + 1), PI[i]) for i in range(n)]
        nodosD = [nodo(str(i + 1), PD[i]) for i in range(n)]
        lineasI = {
            e: Line(PI[e[0]], PI[e[1]], color=TENUE, stroke_width=3) for e in aristas
        }
        self.play(FadeIn(cabI), FadeIn(cabD), Create(separador))
        self.play(
            *[Create(ln) for ln in lineasI.values()],
            *[FadeIn(v) for v in nodosI + nodosD],
        )
        self.bring_to_front(*nodosI)

        cuentaI = Text(f"aristas: {len(aristas)}", font_size=22, color=TENUE).move_to(
            [-3.4, -3.1, 0]
        )
        cuentaD = Text("aristas: 0", font_size=22, color=TENUE).move_to([3.4, -3.1, 0])
        self.play(FadeIn(cuentaI), FadeIn(cuentaD))

        # el escultor: recorre las aristas y saca la que no desconecta (está en un ciclo)
        quedan = list(aristas)
        for e in aristas:
            sin_e = [a for a in quedan if a != e]
            if certificado(n, sin_e)[0] == "conexo":
                quedan = sin_e
                self.play(
                    lineasI[e].animate.set_color(RECHAZO).set_stroke(width=6),
                    run_time=0.35,
                )
                nueva = Text(
                    f"aristas: {len(quedan)}", font_size=22, color=TENUE
                ).move_to(cuentaI)
                self.play(
                    FadeOut(lineasI[e]), cuentaI.animate.become(nueva), run_time=0.45
                )
        self.play(*[lineasI[e].animate.set_color(ENLACE) for e in quedan])

        # el albañil: pone las aristas en el mismo orden; union-find rechaza las que cierran ciclo
        uf = UnionFind(n)
        puestas = 0
        for u, v in aristas:
            ln = Line(PD[u], PD[v], color=ENLACE, stroke_width=4)
            if uf.union(u, v):
                puestas += 1
                nueva = Text(f"aristas: {puestas}", font_size=22, color=TENUE).move_to(
                    cuentaD
                )
                self.play(Create(ln), cuentaD.animate.become(nueva), run_time=0.45)
            else:
                rechazo = DashedLine(PD[u], PD[v], color=RECHAZO, stroke_width=4)
                cruz = Text("×", font_size=30, color=RECHAZO).move_to(
                    (PD[u] + PD[v]) / 2
                )
                self.play(Create(rechazo), FadeIn(cruz), run_time=0.35)
                self.play(FadeOut(rechazo), FadeOut(cruz), run_time=0.3)
            self.bring_to_front(*nodosD)

        cierre = Text(
            "dos árboles generadores con n − 1 = 5 aristas: el mismo tipo de objeto",
            font_size=22,
            color=TINTA,
        )
        cierre.to_edge(DOWN, buff=0.15)
        self.play(FadeOut(cuentaI), FadeOut(cuentaD), FadeIn(cierre))
        self.wait(2)


# ============================================================ escena 2


class UnionPorTamano(Scene):
    """El árbol binomial: cada vez que un nodo baja un escalón, su mundo se duplica."""

    def construct(self):
        n = 8
        titulo = Text(
            "Unión por tamaño: la altura es a lo sumo log₂ k", font_size=28, color=TINTA
        )
        titulo.to_edge(UP, buff=0.3)
        self.play(FadeIn(titulo))

        uf = UnionFind(n, "tamano")
        pos = layout_bosque(uf.parent)
        nodos = {v: nodo(str(v + 1), pos[v]) for v in range(n)}
        nodos[0][0].set_color(CAMINO)
        flechas = flechas_bosque(uf.parent, nodos)
        self.play(*[FadeIn(m) for m in nodos.values()])

        def marcador():
            r = uf.raiz(0)
            return (
                VGroup(
                    Text(
                        f"profundidad del nodo 1: {uf.profundidad(0)}",
                        font_size=24,
                        color=CAMINO,
                    ),
                    Text(
                        f"tamaño de su árbol: {uf.size[r]}", font_size=24, color=TINTA
                    ),
                )
                .arrange(DOWN, aligned_edge=LEFT, buff=0.15)
                .to_corner(DOWN + LEFT, buff=0.5)
            )

        info = marcador()
        self.play(FadeIn(info))
        paso = 1
        while paso < n:
            for i in range(0, n, 2 * paso):
                antes = uf.profundidad(0)
                uf.union(i, i + paso)
                pos = layout_bosque(uf.parent)
                nuevas = flechas_bosque(
                    uf.parent,
                    {v: nodos[v].copy().move_to(pos[v]) for v in range(n)},
                    resaltar={uf.traza[-1].enlace[0] if uf.traza else -1: ENLACE},
                )
                bajo = uf.profundidad(0) > antes
                self.play(
                    FadeOut(flechas),
                    *[nodos[v].animate.move_to(pos[v]) for v in range(n)],
                    info.animate.become(marcador()),
                    run_time=0.8,
                )
                flechas = nuevas
                self.play(FadeIn(flechas), run_time=0.4)
                if bajo:
                    self.play(
                        Indicate(nodos[0], color=CAMINO, scale_factor=1.4),
                        Indicate(info[1]),
                        run_time=0.8,
                    )
            paso *= 2
        cota = MathTex(
            r"\text{altura} = 3 = \log_2 8", color=TINTA, font_size=40
        ).to_corner(DOWN + RIGHT, buff=0.5)
        nota = Text(
            "el binomial alcanza la cota: es el peor caso", font_size=20, color=TENUE
        )
        nota.next_to(cota, UP, buff=0.2).align_to(cota, RIGHT)
        self.play(FadeIn(cota), FadeIn(nota))
        self.wait(2)


# ============================================================ escena 3


class CompresionDeCaminos(Scene):
    """Find sube por una cadena y, a la vuelta de la recursión, todos saltan a la raíz."""

    def construct(self):
        n = 6
        titulo = Text(
            "Compresión de caminos: a la vuelta, todos le reportan al director",
            font_size=26,
            color=TINTA,
        )
        titulo.to_edge(UP, buff=0.3)
        self.play(FadeIn(titulo))

        # la cadena 1 → 2 → ... → 6, escrita a mano; tcomp decide qué se comprime
        uf = UnionFind(n, "completa", trazar=True)
        uf.parent = [1, 2, 3, 4, 5, 5]
        x_raiz, y_raiz = -2.6, 2.1
        pos = {v: np.array([x_raiz, y_raiz - 1.0 * (n - 1 - v), 0]) for v in range(n)}
        nodos = {v: nodo(str(v + 1), pos[v]) for v in range(n)}
        padre = list(uf.parent)  # lo que se dibuja (se actualiza paso a paso)
        color = {v: TENUE for v in range(n)}

        def flecha(v):
            return always_redraw(
                lambda: Arrow(
                    nodos[v].get_center(),
                    nodos[padre[v]].get_center(),
                    buff=0.3,
                    stroke_width=5 if color[v] != TENUE else 3,
                    color=color[v],
                    max_tip_length_to_length_ratio=0.18,
                )
            )

        flechas = VGroup(*[flecha(v) for v in range(n - 1)])
        self.play(*[FadeIn(m) for m in nodos.values()], FadeIn(flechas))

        textos = VGroup(Text("Find(1)", font_size=30, color=CAMINO)).move_to(
            [2.6, 1.6, 0]
        )
        self.play(FadeIn(textos))

        # la ida: subir hasta la raíz
        raiz = uf.find(0)
        ev = uf.traza[-1]
        for v in ev.camino[:-1]:
            color[v] = CAMINO
            self.play(Indicate(nodos[v], color=CAMINO), run_time=0.45)
        self.play(Indicate(nodos[raiz], color=TINTA, scale_factor=1.5))
        t_raiz = Text(f"raíz: {raiz + 1}", font_size=26, color=TINTA)
        comprimidos = ev.comprimidos[
            ::-1
        ]  # la recursión regresa desde la raíz hacia abajo
        t_orden = Text(
            "a la vuelta: " + ", ".join(str(v + 1) for v in comprimidos),
            font_size=22,
            color=TENUE,
        )
        t_nota = Text("(el 5 ya apuntaba a la raíz)", font_size=20, color=TENUE)
        textos.add(t_raiz, t_orden, t_nota)
        textos.arrange(DOWN, buff=0.25).move_to([3.2, 1.2, 0])
        self.play(FadeIn(t_raiz), FadeIn(t_orden), FadeIn(t_nota))

        # la vuelta: cada nodo comprimido pasa a apuntar a la raíz y baja al abanico
        abanico = [
            v for v in range(n - 1)
        ]  # orden horizontal: 5, 4, 3, 2, 1 bajo la raíz
        destino = {
            v: np.array([x_raiz + 1.0 * (k - 2), y_raiz - 1.9, 0])
            for k, v in enumerate(abanico[::-1])
        }
        self.play(nodos[n - 2].animate.move_to(destino[n - 2]), run_time=0.5)
        color[n - 2] = TENUE
        for v in comprimidos:
            padre[v] = raiz
            color[v] = COMPRESION
            self.play(nodos[v].animate.move_to(destino[v]), run_time=0.6)
        assert padre == uf.parent  # lo dibujado es exactamente el arreglo de tcomp
        fin = Text(
            "ahora cualquier Find desde el 1 cuesta un salto", font_size=24, color=TINTA
        )
        fin.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(fin))
        self.wait(2)


# ============================================================ escena 4


class DeCaminoDiscretoAContinuo(Scene):
    """Un camino discreto u₀, …, u_k se reparametriza con un reloj t ∈ [0, 1] (3.3)."""

    def construct(self):
        pts = {
            0: (-3.6, 0.6),
            1: (-2.0, 1.8),
            2: (-0.4, 0.8),
            3: (1.4, 1.7),
            4: (3.0, 0.4),
            5: (0.9, -0.6),
        }
        aristas = [(0, 1), (1, 2), (2, 3), (3, 4), (2, 5), (5, 4), (0, 5)]
        camino = [0, 1, 2, 5, 4]
        k = len(camino) - 1
        P = {v: np.array([x, y + 0.3, 0]) for v, (x, y) in pts.items()}

        titulo = Text(
            "Un camino discreto se derrite en un camino continuo",
            font_size=28,
            color=TINTA,
        )
        titulo.to_edge(UP, buff=0.3)
        lineas = VGroup(
            *[Line(P[u], P[v], color=LINEA, stroke_width=4) for u, v in aristas]
        )
        nodos = {
            v: nodo(f"u{camino.index(v)}" if v in camino else "·", P[v], radio=0.3)
            for v in P
        }
        self.play(FadeIn(titulo), Create(lineas), *[FadeIn(m) for m in nodos.values()])

        # 1. lo discreto: un vértice por instante entero
        ficha = Dot(P[camino[0]], radius=0.13, color=CAMINO)
        reloj_d = Text("i = 0", font_size=26, color=CAMINO).to_corner(
            DOWN + LEFT, buff=0.6
        )
        self.play(FadeIn(ficha), FadeIn(reloj_d))
        for i in range(1, k + 1):
            nuevo = Text(f"i = {i}", font_size=26, color=CAMINO).move_to(reloj_d)
            self.play(
                ficha.animate.move_to(P[camino[i]]),
                reloj_d.animate.become(nuevo),
                run_time=0.6,
            )
        nota = Text(
            "molde: el grafo camino {0, 1, …, k}", font_size=22, color=TENUE
        ).next_to(reloj_d, RIGHT, buff=0.6)
        self.play(FadeIn(nota))
        self.wait(0.6)

        # 2. lo continuo: el molde es [0, 1]; en [i/k, (i+1)/k] se recorre la arista u_i u_{i+1}
        recta = NumberLine(
            x_range=[0, 1, 1 / k], length=8, color=TENUE, include_numbers=False
        ).move_to([0, -2.4, 0])
        marcas = VGroup(
            *[
                MathTex(
                    rf"\tfrac{{{i}}}{{{k}}}" if 0 < i < k else ("0" if i == 0 else "1"),
                    font_size=26,
                    color=TENUE,
                ).next_to(recta.n2p(i / k), DOWN, buff=0.15)
                for i in range(k + 1)
            ]
        )
        t = ValueTracker(0.0)

        def gamma(s):
            s = min(max(s, 0.0), 1.0) * k
            i = min(int(s), k - 1)
            return P[camino[i]] + (s - i) * (P[camino[i + 1]] - P[camino[i]])

        self.play(
            FadeOut(reloj_d),
            FadeOut(nota),
            ficha.animate.move_to(P[camino[0]]),
            Create(recta),
            FadeIn(marcas),
        )
        ficha.add_updater(lambda m: m.move_to(gamma(t.get_value())))
        rastro = TracedPath(ficha.get_center, stroke_color=CAMINO, stroke_width=6)
        cursor = always_redraw(
            lambda: Dot(recta.n2p(t.get_value()), radius=0.1, color=CAMINO)
        )
        hecho = always_redraw(
            lambda: Line(
                recta.n2p(0),
                recta.n2p(max(t.get_value(), 1e-3)),
                color=CAMINO,
                stroke_width=6,
            )
        )
        etiqueta = always_redraw(
            lambda: (
                MathTex(rf"t = {t.get_value():.2f}", font_size=30, color=TINTA)
                .next_to(recta, UP, buff=0.25)
                .align_to(recta, LEFT)
            )
        )
        formula = (
            MathTex(r"\gamma : [0,1] \to |G|", color=TINTA, font_size=34)
            .next_to(recta, UP, buff=0.25)
            .align_to(recta, RIGHT)
        )
        self.add(rastro, hecho, cursor)
        self.bring_to_front(*nodos.values())
        self.bring_to_front(ficha)
        self.play(FadeIn(etiqueta), FadeIn(formula))
        self.play(t.animate.set_value(1.0), run_time=6, rate_func=linear)
        ficha.clear_updaters()
        cierre = Text(
            "mismo recorrido; el molde pasó de {0, …, k} a [0, 1]",
            font_size=22,
            color=TINTA,
        )
        cierre.next_to(titulo, DOWN, buff=0.2)
        self.play(FadeIn(cierre))
        self.wait(2)
