"""Prototipo: certificados de conexidad y de desconexión ("la ola y la tijera").

Idea central de la disección de I.1: en un grafo finito, la pregunta
"¿es conexo?" tiene SIEMPRE un testigo corto y verificable, sea cual sea la
respuesta:

- SÍ  -> un árbol generador (n-1 aristas). Verificarlo es fácil: son aristas de
         E, son n-1 y conectan todo. Es el certificado CONSTRUCTIVO
         ("se puede llegar").
- NO  -> una separación V = U ⊔ W sin aristas cruzadas. Verificarla es fácil:
         recorrer E y comprobar que ninguna arista cruza. Es el certificado
         por OBSTRUCCIÓN ("no se puede cortar"... y acá sí se pudo).

La búsqueda en anchura (la "ola") produce uno u otro: si la ola cubre todo,
las aristas por las que avanzó forman un árbol generador; si se detiene antes,
lo alcanzado y lo no alcanzado forman una separación. Es exactamente la
demostración de la Proposición 1 (⇐) convertida en algoritmo, en tiempo
O(n + m): la respuesta al ejercicio 1(i) del capítulo.

Uso:  python3 certificados.py
"""

from __future__ import annotations

from collections import deque


def lista_adyacencia(n: int, aristas):
    ady = {v: [] for v in range(1, n + 1)}
    for u, v in aristas:
        ady[u].append(v)
        ady[v].append(u)
    return ady


def ola(n: int, aristas, origen: int = 1):
    """BFS desde `origen`. Devuelve (frentes, arbol):

    - frentes[k] = vértices a distancia exactamente k (los "anillos" de la ola);
    - arbol = aristas (padre, hijo) por las que avanzó la ola.
    """
    ady = lista_adyacencia(n, aristas)
    visto = {origen}
    frentes = [[origen]]
    arbol = []
    cola = deque([origen])
    while cola:
        siguiente = []
        for _ in range(len(cola)):
            u = cola.popleft()
            for v in ady[u]:
                if v not in visto:
                    visto.add(v)
                    arbol.append((u, v))
                    siguiente.append(v)
                    cola.append(v)
        if siguiente:
            frentes.append(siguiente)
    return frentes, arbol


def certificado(n: int, aristas):
    """Decide conexidad y devuelve el testigo correspondiente.

    ("conexo", arbol_generador)  o  ("desconexo", (U, W)).
    """
    frentes, arbol = ola(n, aristas)
    alcanzados = {v for f in frentes for v in f}
    if len(alcanzados) == n:
        return "conexo", arbol
    return "desconexo", (sorted(alcanzados), sorted(set(range(1, n + 1)) - alcanzados))


def verificar_arbol_generador(n, aristas, arbol) -> bool:
    E = {frozenset(e) for e in aristas}
    if len(arbol) != n - 1 or any(frozenset(e) not in E for e in arbol):
        return False
    _, alcanzado = ola(n, arbol)
    return len({v for e in alcanzado for v in e} | {1}) == n


def verificar_separacion(n, aristas, U, W) -> bool:
    U, W = set(U), set(W)
    if not U or not W or U & W or U | W != set(range(1, n + 1)):
        return False
    return all((u in U) == (v in U) for u, v in aristas)


def componentes(n: int, aristas):
    """Ejercicio 1(ii): etiquetar componentes en O(n + m) relanzando la ola."""
    ady = lista_adyacencia(n, aristas)
    etiqueta = {}
    actual = 0
    for s in range(1, n + 1):
        if s in etiqueta:
            continue
        actual += 1
        etiqueta[s] = actual
        cola = deque([s])
        while cola:
            u = cola.popleft()
            for v in ady[u]:
                if v not in etiqueta:
                    etiqueta[v] = actual
                    cola.append(v)
    return etiqueta


if __name__ == "__main__":
    import random

    rng = random.Random(7)
    for _ in range(500):
        n = rng.randint(1, 25)
        posibles = [(u, v) for u in range(1, n + 1) for v in range(u + 1, n + 1)]
        aristas = rng.sample(posibles, rng.randint(0, len(posibles) // 3))
        veredicto, testigo = certificado(n, aristas)
        if veredicto == "conexo":
            assert verificar_arbol_generador(n, aristas, testigo)
        else:
            assert verificar_separacion(n, aristas, *testigo)
        # Coherencia con union-find: mismas componentes.
        from union_find import componentes_conexas

        conj, _, _ = componentes_conexas(n, aristas)
        et = componentes(n, aristas)
        assert sorted(sorted(c) for c in conj) == sorted(
            sorted(v for v in et if et[v] == k) for k in set(et.values())
        )
    print("OK  500 grafos: todo veredicto viene con un testigo verificable")
    print("OK  la ola (BFS) y union-find coinciden en las componentes")

    # Ejemplo para la página: el grafo de 4 vértices de las notas, sin la arista (3,4).
    print(certificado(4, [(1, 2), (2, 3), (1, 3)]))
    print(certificado(4, [(1, 2), (2, 3), (1, 3), (3, 4)]))
