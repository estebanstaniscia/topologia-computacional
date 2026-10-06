"""Animaciones de la sección I.1 (spec 3.10).

Renderizar (borrador / final):
    uv run manim -ql animaciones/cap01_union_find.py PersistenciaCero
    uv run manim -qm animaciones/cap01_union_find.py PersistenciaCero
y copiar el video a capitulos/01-grafos/media/.

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
    Circle,
    Create,
    DecimalNumber,
    Dot,
    FadeIn,
    Integer,
    Line,
    MathTex,
    Scene,
    Text,
    ValueTracker,
    VGroup,
    always_redraw,
    config,
    linear,
)

from tcomp.persistencia import kruskal
from tcomp.union_find import UnionFind

# paleta del sitio (modo oscuro), la misma de assets/estilo.css
FONDO = "#151517"
TINTA = "#ecebe7"
TENUE = "#a9a8a1"
LINEA = "#3a3a40"
BARRA = "#3987e5"
MARCA = "#d95926"
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
