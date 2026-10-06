"""Figuras de matplotlib con la paleta del sitio, en versión clara y oscura.

Las páginas de Quarto piden dos versiones de cada figura (``#| renderings: [light,
dark]``) y muestran la que corresponde al modo del lector. Este módulo fija la
paleta (la misma de ``assets/estilo.css``) y dibuja los objetos que se repiten en
el libro: nubes de puntos con su árbol generador mínimo y códigos de barras.

Uso típico en una celda::

    for modo in MODOS:
        with tema(modo) as paleta:
            fig, ax = plt.subplots()
            ...
            plt.show()
"""

from __future__ import annotations

import math
from collections.abc import Iterator, Sequence
from contextlib import contextmanager

import matplotlib.pyplot as plt
import numpy as np

MODOS = ("claro", "oscuro")

PALETAS = {
    "claro": {
        "fondo": "#ffffff",
        "tinta": "#1d1d1f",
        "tenue": "#5f5e5a",
        "linea": "#d9d6cf",
        "acento": "#2a78d6",
        "rechazo": "#e34948",
        "enlace": "#1baf7a",
        "seco": "#eb6834",
        "categorica": [
            "#2a78d6",
            "#eb6834",
            "#1baf7a",
            "#eda100",
            "#e87ba4",
            "#008300",
            "#4a3aa7",
        ],
    },
    "oscuro": {
        "fondo": "#151517",
        "tinta": "#ecebe7",
        "tenue": "#a9a8a1",
        "linea": "#3a3a40",
        "acento": "#3987e5",
        "rechazo": "#e66767",
        "enlace": "#199e70",
        "seco": "#d95926",
        "categorica": [
            "#3987e5",
            "#d95926",
            "#199e70",
            "#c98500",
            "#d55181",
            "#008300",
            "#9085e9",
        ],
    },
}


@contextmanager
def tema(modo: str) -> Iterator[dict]:
    """Contexto de matplotlib con la paleta del modo (``"claro"`` u ``"oscuro"``)."""
    p = PALETAS[modo]
    estilo = {
        # fondo transparente: la figura toma el color de la página en los dos modos
        "figure.facecolor": "none",
        "axes.facecolor": "none",
        "savefig.facecolor": "none",
        "savefig.transparent": True,
        "axes.edgecolor": p["linea"],
        "axes.labelcolor": p["tenue"],
        "axes.titlecolor": p["tinta"],
        "axes.titlesize": 11,
        "axes.titleweight": "bold",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.grid": False,
        "xtick.color": p["tenue"],
        "ytick.color": p["tenue"],
        "text.color": p["tinta"],
        "legend.frameon": False,
        "legend.labelcolor": p["tinta"],
        "font.size": 10,
        "lines.linewidth": 2,
    }
    with plt.rc_context(estilo):
        yield p


def nube_con_arbol(
    ax,
    X: np.ndarray,
    arbol: Sequence[tuple[int, int, float]],
    p: dict,
    eps: float | None = None,
):
    """Dibuja una nube de puntos y su árbol generador mínimo.

    Si se da ``eps``, solo se dibujan las aristas del árbol de longitud <= eps
    (el grafo de vecindad al radio eps restringido al árbol: mismas componentes).
    """
    for i, j, peso in arbol:
        if eps is None or peso <= eps:
            ax.plot(
                *X[[i, j]].T, color=p["enlace"], lw=2, zorder=1, solid_capstyle="round"
            )
    ax.scatter(
        *X.T, s=26, color=p["acento"], edgecolor=p["fondo"], linewidth=1.2, zorder=2
    )
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    for lado in ("left", "bottom"):
        ax.spines[lado].set_visible(False)


def codigo_de_barras(
    ax,
    barras: Sequence[tuple[float, float]],
    p: dict,
    tope: float | None = None,
    marca: float | None = None,
):
    """Dibuja un código de barras de dimensión 0 (barras ordenadas por muerte).

    Las barras infinitas se dibujan hasta ``tope`` con una flecha. ``marca``
    dibuja una línea vertical (por ejemplo, el radio eps actual).
    """
    finitas = [m for _, m in barras if math.isfinite(m)]
    tope = tope or (max(finitas) * 1.15 if finitas else 1.0)
    orden = sorted(barras, key=lambda b: (b[1], b[0]), reverse=True)
    for y, (nac, muerte) in enumerate(orden):
        fin = tope if math.isinf(muerte) else muerte
        ax.plot([nac, fin], [y, y], color=p["acento"], lw=2.2, solid_capstyle="butt")
        if math.isinf(muerte):
            ax.annotate(
                "",
                xy=(tope * 1.03, y),
                xytext=(fin * 0.97, y),
                arrowprops={"arrowstyle": "->", "color": p["acento"], "lw": 1.5},
            )
    if marca is not None:
        ax.axvline(marca, color=p["seco"], lw=1.5, ls="--")
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.set_xlim(0, tope * 1.06)
    ax.set_ylim(-1, len(orden))
    ax.set_xlabel("ε")
