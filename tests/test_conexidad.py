"""Tests de tcomp.conexidad: todo veredicto viene con un testigo verificable."""

import random
from itertools import pairwise

import networkx as nx
import pytest

from tcomp.conexidad import (
    certificado,
    ciclo_fundamental,
    componentes,
    corte_fundamental,
    ola,
    verificar_arbol_generador,
    verificar_separacion,
)
from tcomp.union_find import componentes_conexas


def grafo_aleatorio(rng, n, densidad):
    posibles = [(u, v) for u in range(n) for v in range(u + 1, n)]
    return rng.sample(posibles, int(densidad * len(posibles)))


def test_ejemplo_de_la_pagina():
    """El grafo del ejemplo 1, con y sin la arista (3,4)."""
    assert certificado(4, [(0, 1), (1, 2), (0, 2)]) == ("desconexo", ([0, 1, 2], [3]))
    veredicto, arbol = certificado(4, [(0, 1), (1, 2), (0, 2), (2, 3)])
    assert veredicto == "conexo" and arbol == [(0, 1), (0, 2), (2, 3)]


def test_frentes_de_la_ola():
    # ciclo C6: la ola avanza por los dos lados y se encuentra en el vértice opuesto
    aristas = [(i, (i + 1) % 6) for i in range(6)]
    frentes, arbol = ola(6, aristas)
    assert frentes == [[0], [1, 5], [2, 4], [3]]
    assert len(arbol) == 5


def test_todo_veredicto_tiene_testigo_verificable():
    rng = random.Random(7)
    for _ in range(500):
        n = rng.randint(1, 25)
        aristas = grafo_aleatorio(rng, n, rng.choice([0.05, 0.1, 0.2, 0.4]))
        veredicto, testigo = certificado(n, aristas)
        G = nx.Graph(aristas)
        G.add_nodes_from(range(n))
        assert (veredicto == "conexo") == nx.is_connected(G)
        if veredicto == "conexo":
            assert verificar_arbol_generador(n, aristas, testigo)
        else:
            assert verificar_separacion(n, aristas, *testigo)


def test_los_verificadores_rechazan_testigos_falsos():
    aristas = [(0, 1), (1, 2), (2, 3)]
    assert not verificar_arbol_generador(4, aristas, [(0, 1), (1, 2)])  # pocas aristas
    assert not verificar_arbol_generador(
        4, aristas, [(0, 1), (1, 2), (0, 3)]
    )  # (0,3) no está
    assert not verificar_separacion(4, aristas, [0, 1], [2, 3])  # (1,2) cruza
    assert not verificar_separacion(4, aristas, [0, 1, 2, 3], [])  # trivial
    assert verificar_arbol_generador(1, [], [])  # un solo vértice: árbol vacío


def test_componentes_contra_union_find_y_networkx():
    rng = random.Random(8)
    for _ in range(300):
        n = rng.randint(1, 40)
        aristas = grafo_aleatorio(rng, n, rng.choice([0.02, 0.05, 0.1]))
        etiqueta = componentes(n, aristas)
        por_etiqueta = {}
        for v, e in enumerate(etiqueta):
            por_etiqueta.setdefault(e, set()).add(v)
        conjuntos, _, _ = componentes_conexas(n, aristas)
        assert sorted(por_etiqueta.values(), key=min) == conjuntos
        G = nx.Graph(aristas)
        G.add_nodes_from(range(n))
        assert len(por_etiqueta) == nx.number_connected_components(G)


@pytest.mark.parametrize("semilla", range(20))
def test_ciclo_y_corte_fundamentales(semilla):
    rng = random.Random(semilla)
    n = rng.randint(3, 15)
    arbol = list(nx.random_labeled_tree(n, seed=semilla).edges())
    # agregar una arista que no está crea exactamente un ciclo...
    fuera = [
        (u, v)
        for u in range(n)
        for v in range(u + 1, n)
        if not nx.Graph(arbol).has_edge(u, v)
    ]
    if fuera:
        e = rng.choice(fuera)
        ciclo = ciclo_fundamental(n, arbol, e)
        G = nx.Graph(arbol + [e])
        assert ciclo[0] == ciclo[-1] == e[0] and ciclo[-2] == e[1]
        assert len(set(ciclo[:-1])) == len(ciclo) - 1  # ciclo simple
        assert all(G.has_edge(a, b) for a, b in pairwise(ciclo))
        assert len(nx.cycle_basis(G)) == 1
    # ... y quitar una arista del árbol lo parte en exactamente dos componentes
    e = rng.choice(arbol)
    U, W = corte_fundamental(n, arbol, e)
    resto = [a for a in arbol if a != e]
    assert verificar_separacion(n, resto, U, W)
    assert (e[0] in U) != (e[1] in U)  # la arista quitada era el único puente
