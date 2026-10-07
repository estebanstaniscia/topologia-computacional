"""Animaciones de la sección I.2 (spec §7).

Escenas: RayoQueGira, ElFaro.

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
    Dot,
    FadeIn,
    Line,
    MathTex,
    Polygon,
    Scene,
    Text,
    TracedPath,
    ValueTracker,
    VGroup,
    always_redraw,
    config,
    linear,
)

from tcomp.curvas import vueltas_por_cruces

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
