"""Tests de tcomp.persistencia contra GUDHI, ripser y SciPy."""

import math

import gudhi
import numpy as np
import pytest
from ripser import ripser
from scipy.cluster.hierarchy import linkage
from scipy.sparse.csgraph import minimum_spanning_tree

from tcomp.persistencia import (
    arbol_generador_minimo,
    kruskal,
    matriz_distancias,
    persistencia_0,
)


def muertes(barras):
    return np.sort([m for _, m in barras if math.isfinite(m)])


def nube(semilla, n=None, d=2):
    rng = np.random.default_rng(semilla)
    n = n or int(rng.integers(2, 60))
    return rng.normal(size=(n, d))


@pytest.mark.parametrize("semilla", range(25))
def test_contra_gudhi(semilla):
    X = nube(semilla, d=1 + semilla % 3)
    st = gudhi.RipsComplex(points=X).create_simplex_tree(max_dimension=1)
    pares = st.persistence(min_persistence=-1)
    dim0 = [(b, m) for dim, (b, m) in pares if dim == 0]
    barras = persistencia_0(X)
    assert len(barras) == len(X) == len(dim0)
    assert sum(math.isinf(m) for _, m in barras) == 1
    assert all(b == 0 for b, _ in barras)
    np.testing.assert_allclose(muertes(barras), muertes(dim0), atol=1e-9)


@pytest.mark.parametrize("semilla", range(10))
def test_contra_ripser(semilla):
    X = nube(100 + semilla)
    dgm0 = ripser(X, maxdim=0)["dgms"][0]
    np.testing.assert_allclose(muertes(persistencia_0(X)), muertes(dgm0), atol=1e-6)


@pytest.mark.parametrize("semilla", range(10))
def test_enlace_simple_es_persistencia_0(semilla):
    """Las alturas del dendrograma de enlace simple son las muertes (puente a finanzas)."""
    X = nube(200 + semilla)
    alturas = linkage(X, method="single")[:, 2]
    np.testing.assert_allclose(muertes(persistencia_0(X)), np.sort(alturas), atol=1e-12)


@pytest.mark.parametrize("semilla", range(10))
def test_arbol_generador_minimo(semilla):
    X = nube(300 + semilla)
    D = matriz_distancias(X)
    arbol = arbol_generador_minimo(X)
    assert len(arbol) == len(X) - 1
    peso_scipy = minimum_spanning_tree(D).sum()
    assert sum(p for _, _, p in arbol) == pytest.approx(peso_scipy)


def test_matriz_de_distancias_y_correlaciones():
    """Distancia de Mantegna sobre correlaciones: dos bloques de activos."""
    rho = np.array(
        [
            [1.0, 0.9, 0.1, 0.0],
            [0.9, 1.0, 0.0, 0.1],
            [0.1, 0.0, 1.0, 0.8],
            [0.0, 0.1, 0.8, 1.0],
        ]
    )
    D = np.sqrt(2 * (1 - rho))
    fusiones = kruskal(distancias=D)
    # primero se fusionan los pares de cada bloque, al final los bloques entre sí
    assert [(i, j) for _, i, j in fusiones] == [(0, 1), (2, 3), (0, 2)]
    assert fusiones[-1][0] == pytest.approx(math.sqrt(2 * 0.9))


def test_distancias_infinitas_dejan_varias_componentes_vivas():
    D = np.array([[0, 1, np.inf], [1, 0, np.inf], [np.inf, np.inf, 0]])
    barras = persistencia_0(distancias=D)
    assert barras == [(0.0, 1.0), (0.0, math.inf), (0.0, math.inf)]


def test_casos_borde():
    assert persistencia_0(np.zeros((0, 2))) == []
    assert persistencia_0([[0.0, 0.0]]) == [(0.0, math.inf)]
    with pytest.raises(ValueError):
        persistencia_0()
    with pytest.raises(ValueError):
        persistencia_0(distancias=[[0, 1], [2, 0]])
