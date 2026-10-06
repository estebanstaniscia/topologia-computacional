"""Homología persistente en dimensión 0 vía Kruskal + union-find (I.1 → VII).

Tomamos una nube de puntos y un radio ε que crece desde 0, y conectamos dos
puntos cuando su distancia es a lo sumo ε. Procesar las aristas **ordenadas por
longitud** con union-find es lo mismo que ver crecer ε:

- cada ``union`` exitosa es la **muerte de una componente** en el tiempo
  ε = longitud de la arista;
- las aristas aceptadas forman el **árbol generador mínimo** (Kruskal);
- los pares (nacimiento, muerte), todos con nacimiento 0, son el **código de
  barras** de la persistencia en dimensión 0. La componente que sobrevive a todas
  las fusiones tiene muerte infinita.

Las funciones aceptan una nube de puntos (arreglo ``(n, d)``, distancia euclídea)
o, con ``distancias=``, una matriz de distancias ``(n, n)`` simétrica. Una
distancia infinita significa "nunca se conectan".
"""

from __future__ import annotations

import math

import numpy as np
from numpy.typing import ArrayLike

from tcomp.union_find import UnionFind

Fusion = tuple[float, int, int]


def matriz_distancias(puntos: ArrayLike) -> np.ndarray:
    """Matriz de distancias euclídeas entre las filas de ``puntos``."""
    X = np.asarray(puntos, dtype=float)
    if X.ndim == 1:
        X = X[:, None]
    dif = X[:, None, :] - X[None, :, :]
    return np.sqrt((dif**2).sum(axis=-1))


def _distancias(puntos: ArrayLike | None, distancias: ArrayLike | None) -> np.ndarray:
    if (puntos is None) == (distancias is None):
        raise ValueError("pasá exactamente uno de: puntos, distancias=")
    if distancias is None:
        return matriz_distancias(puntos)
    D = np.asarray(distancias, dtype=float)
    if D.ndim != 2 or D.shape[0] != D.shape[1]:
        raise ValueError("la matriz de distancias debe ser cuadrada")
    if not np.allclose(D, D.T, equal_nan=False):
        raise ValueError("la matriz de distancias debe ser simétrica")
    return D


def kruskal(
    puntos: ArrayLike | None = None, *, distancias: ArrayLike | None = None
) -> list[Fusion]:
    """Las fusiones de componentes al crecer ε, en orden: ``[(ε, i, j), ...]``.

    Es el algoritmo de Kruskal: se recorren las aristas por longitud creciente y
    union-find descarta las que cerrarían un ciclo. Las aristas devueltas son las
    aceptadas, es decir, el árbol (o bosque) generador mínimo. Con longitudes
    iguales se respeta el orden lexicográfico de ``(i, j)``, así el resultado es
    determinista.
    """
    D = _distancias(puntos, distancias)
    n = D.shape[0]
    iu, ju = np.triu_indices(n, k=1)
    pesos = D[iu, ju]
    finitas = np.isfinite(pesos)
    iu, ju, pesos = iu[finitas], ju[finitas], pesos[finitas]
    orden = np.lexsort((ju, iu, pesos))  # por peso; desempate por (i, j)
    uf = UnionFind(n)
    fusiones: list[Fusion] = []
    for k in orden:
        i, j = int(iu[k]), int(ju[k])
        if uf.union(i, j):
            fusiones.append((float(pesos[k]), i, j))
            if uf.componentes == 1:
                break
    return fusiones


def arbol_generador_minimo(
    puntos: ArrayLike | None = None, *, distancias: ArrayLike | None = None
) -> list[tuple[int, int, float]]:
    """Aristas ``(i, j, peso)`` del árbol generador mínimo (bosque, si hay infinitos)."""
    return [(i, j, eps) for eps, i, j in kruskal(puntos, distancias=distancias)]


def persistencia_0(
    puntos: ArrayLike | None = None, *, distancias: ArrayLike | None = None
) -> list[tuple[float, float]]:
    """Código de barras de dimensión 0: pares ``(nacimiento, muerte)``.

    Todos los nacimientos son 0 (cada punto es una componente desde el comienzo).
    Hay una barra por punto: ``n - c`` mueren en las fusiones de Kruskal y las
    ``c`` componentes que nunca se fusionan (``c = 1`` para una nube con distancias
    finitas) tienen muerte ``math.inf``. Las barras se devuelven ordenadas por
    muerte.
    """
    D = _distancias(puntos, distancias)
    n = D.shape[0]
    fusiones = kruskal(distancias=D)
    barras = [(0.0, eps) for eps, _, _ in fusiones]
    barras += [(0.0, math.inf)] * (n - len(fusiones))
    return barras
