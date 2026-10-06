"""Tests de tcomp.union_find: los ejemplos de la disección, al pie de la letra,
y las propiedades que la sección I.1 afirma (β₀, β₁, cota logarítmica)."""

import json
import math
import random

import networkx as nx
import pytest

from tcomp.union_find import ESTRATEGIAS, UnionFind, componentes_conexas


def libro(arreglo):
    """Pasa un arreglo de la librería (0..n-1) a las etiquetas del libro (1..n)."""
    return [x + 1 for x in arreglo]


def grafo_aleatorio(rng, n, densidad=None):
    posibles = [(u, v) for u in range(n) for v in range(u + 1, n)]
    m = (
        rng.randint(0, len(posibles))
        if densidad is None
        else int(densidad * len(posibles))
    )
    aristas = rng.sample(posibles, m)
    return [(v, u) if rng.random() < 0.5 else (u, v) for u, v in aristas]


# ---------------------------------------------------------------- ejemplos 1 y 2


def test_ejemplo_1_tabla_paso_a_paso():
    """Disección 4.4: n = 4, E = {(1,2), (2,3), (1,3), (3,4)}, versión básica."""
    uf = UnionFind(4, "ingenua")
    tabla = []
    for u, v in [(1, 2), (2, 3), (1, 3), (3, 4)]:
        aceptada = uf.union(u - 1, v - 1)
        tabla.append((aceptada, libro(uf.parent), uf.componentes))
    assert tabla == [
        (True, [2, 2, 3, 4], 3),
        (True, [2, 3, 3, 4], 2),
        (False, [2, 3, 3, 4], 2),  # rechazo: (1,3) cierra el triángulo 1-2-3
        (True, [2, 3, 4, 4], 1),
    ]
    assert uf.rechazadas == 1  # β₁ = 1
    assert uf.altura() == 3  # la cadena 1 → 2 → 3 → 4: altura n - 1


def test_ejemplo_1_sin_la_ultima_arista_es_desconexo():
    conjuntos, bosque, rechazadas = componentes_conexas(4, [(0, 1), (1, 2), (0, 2)])
    assert conjuntos == [{0, 1, 2}, {3}]
    assert bosque == [(0, 1), (1, 2)]
    assert rechazadas == [(0, 2)]


def test_ejemplo_2_tablas_del_paso_3_y_4():
    """Disección 5.3: n = 8, unión por tamaño + compresión de caminos."""
    uf = UnionFind(8, "completa", trazar=True)
    uf.union(0, 1)  # Union(1,2): empate, 1 cuelga de 2
    uf.union(2, 3)  # Union(3,4)
    uf.union(0, 2)  # Union(1,3): Find(1) sube 1 → 2; empate 2 vs 4
    assert libro(uf.parent)[:4] == [2, 4, 4, 4]
    assert uf.size[3] == 4
    uf.union(4, 5)  # Union(5,6)
    assert libro(uf.parent) == [2, 4, 4, 4, 6, 6, 7, 8]  # tabla del paso 3

    uf.union(0, 4)  # Union(1,5): las dos mejoras en la misma llamada
    assert libro(uf.parent) == [4, 4, 4, 4, 6, 4, 7, 8]  # tabla del paso 4
    assert uf.size[3] == 6

    find_1, find_5, enlace = uf.traza[-3:]
    assert libro(find_1.camino) == [1, 2, 4] and libro(find_1.comprimidos) == [1]
    assert libro(find_5.camino) == [5, 6] and find_5.comprimidos == []
    assert enlace.tipo == "union" and enlace.intercambio is True
    assert libro(enlace.enlace) == [6, 4]  # el árbol chico (6) cuelga del grande (4)

    uf.find(4)  # Find(5) recorre 5 → 6 → 4 y comprime
    assert libro(uf.parent)[4] == 4
    assert uf.altura() == 1  # todos a profundidad 1


def test_traza_exportable_a_json():
    uf = UnionFind(3, trazar=True)
    uf.union(0, 1)
    uf.union(1, 0)
    datos = json.loads(json.dumps(uf.traza_dicts()))
    assert [e["tipo"] for e in datos] == [
        "find",
        "find",
        "union",
        "find",
        "find",
        "rechazo",
    ]
    assert datos[2]["enlace"] == [0, 1] and datos[2]["parent"] == [1, 1, 2]


# ------------------------------------------------------- tablas de costo (bloque 4-5)


def peor_caso_basica(n, estrategia):
    """Union(1,2), Union(1,3), ..., Union(1,n) y después n veces Find(1)."""
    uf = UnionFind(n, estrategia)
    for k in range(1, n):
        uf.union(0, k)
    for _ in range(n):
        uf.find(0)
    return uf.saltos


@pytest.mark.parametrize(
    ("n", "esperado"),
    [(10, (126, 18, 18)), (100, (14_751, 198, 198)), (1000, (1_497_501, 1998, 1998))],
)
def test_tabla_peor_caso_de_la_basica(n, esperado):
    assert tuple(peor_caso_basica(n, e) for e in ESTRATEGIAS) == esperado


def arbol_binomial(k, estrategia):
    """Árbol binomial de altura k (n = 2**k) y n Find sobre la hoja más profunda."""
    n = 2**k
    uf = UnionFind(n, estrategia)
    paso = 1
    while paso < n:
        for i in range(0, n, 2 * paso):
            uf.union(i, i + paso)
        paso *= 2
    hoja = max(range(n), key=uf.profundidad)
    uf.saltos = 0
    for _ in range(n):
        uf.find(hoja)
    return uf.saltos


@pytest.mark.parametrize(
    ("k", "esperado"),
    [(4, (64, 64, 18)), (7, (896, 896, 133)), (10, (10_240, 10_240, 1032))],
)
def test_tabla_arbol_binomial(k, esperado):
    assert tuple(arbol_binomial(k, e) for e in ESTRATEGIAS) == esperado


def test_arbol_binomial_alcanza_la_cota():
    """El árbol binomial es el peor caso de la unión por tamaño: altura log2(n)."""
    for k in range(1, 9):
        uf = UnionFind(2**k, "tamano")
        paso = 1
        while paso < 2**k:
            for i in range(0, 2**k, 2 * paso):
                uf.union(i, i + paso)
            paso *= 2
        assert uf.altura() == k


# ------------------------------------------------------------------- propiedades


@pytest.mark.parametrize("estrategia", ESTRATEGIAS)
def test_betti_y_euler(estrategia):
    """rechazadas = β₁ = m - n + β₀, es decir n - m = β₀ - β₁ (disección 4.2)."""
    rng = random.Random(0)
    for _ in range(300):
        n = rng.randint(1, 30)
        aristas = grafo_aleatorio(rng, n)
        uf = UnionFind(n, estrategia)
        for e in aristas:
            uf.union(*e)
        assert n - len(aristas) == uf.componentes - uf.rechazadas


@pytest.mark.parametrize("estrategia", ESTRATEGIAS)
def test_componentes_contra_networkx(estrategia):
    rng = random.Random(1)
    for _ in range(200):
        n = rng.randint(1, 40)
        aristas = grafo_aleatorio(rng, n, densidad=rng.choice([0.02, 0.05, 0.1, 0.3]))
        G = nx.Graph(aristas)
        G.add_nodes_from(range(n))
        esperado = sorted(nx.connected_components(G), key=min)
        conjuntos, bosque, _ = componentes_conexas(n, aristas, estrategia)
        assert conjuntos == esperado
        assert nx.is_forest(nx.Graph(bosque)) if bosque else True
        assert len(bosque) == n - len(conjuntos)  # el albañil pone n - β₀ ladrillos


@pytest.mark.parametrize("estrategia", ["tamano", "completa"])
def test_cota_logaritmica(estrategia):
    """Con unión por tamaño, todo árbol de k nodos tiene altura <= log2(k)."""
    rng = random.Random(2)
    for _ in range(100):
        n = rng.randint(2, 120)
        uf = UnionFind(n, estrategia)
        for _ in range(3 * n):
            uf.union(rng.randrange(n), rng.randrange(n))
            altura_por_raiz = {}
            for i in range(n):
                r = uf.raiz(i)
                altura_por_raiz[r] = max(altura_por_raiz.get(r, 0), uf.profundidad(i))
            for r, h in altura_por_raiz.items():
                assert h <= math.log2(uf.size[r]) + 1e-12


def test_la_compresion_no_cambia_la_particion():
    rng = random.Random(3)
    for _ in range(100):
        n = rng.randint(1, 50)
        ops = [(rng.randrange(n), rng.randrange(n)) for _ in range(2 * n)]
        resultados = []
        for estrategia in ESTRATEGIAS:
            uf = UnionFind(n, estrategia)
            aceptadas = [uf.union(*op) for op in ops]
            resultados.append((aceptadas, uf.conjuntos()))
        assert resultados[0] == resultados[1] == resultados[2]


def test_cadena_larga_sin_recursion():
    """La compresión iterativa soporta cadenas mucho más largas que el límite de recursión."""
    n = 50_000
    uf = UnionFind(n, "completa")
    # cadena 0 → 1 → ... → n-1 escrita a mano (armarla con uniones básicas es cuadrático)
    uf.parent = [min(i + 1, n - 1) for i in range(n)]
    assert uf.find(0) == n - 1
    assert uf.altura() == 1


def test_estrategia_invalida():
    with pytest.raises(ValueError):
        UnionFind(3, "rapida")
