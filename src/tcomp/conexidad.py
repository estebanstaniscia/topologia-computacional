"""Conexidad de grafos con certificados: "la ola y la tijera" (sección I.1).

Idea central: en un grafo finito, la pregunta "¿es conexo?" tiene SIEMPRE un
testigo corto y fácil de verificar, sea cual sea la respuesta.

- **Sí** → un árbol generador (n - 1 aristas de E que conectan todo). Es el
  certificado constructivo: "se puede llegar".
- **No** → una separación V = U ⊔ W sin aristas que crucen. Es el certificado por
  obstrucción: "se puede cortar".

La búsqueda en anchura (la "ola") produce uno u otro: si la ola cubre todo, las
aristas por las que avanzó forman un árbol generador; si se detiene antes, lo
mojado y lo seco forman una separación. Es la demostración de la Proposición 1
(⇐) convertida en algoritmo, en tiempo O(n + m): el ejercicio 1(i) del capítulo.

Los grafos se dan como ``n`` (vértices ``0..n-1``) y una lista de aristas ``(u, v)``.
"""

from __future__ import annotations

from collections import deque
from collections.abc import Iterable, Sequence
from typing import Literal

Arista = tuple[int, int]


def lista_adyacencia(n: int, aristas: Iterable[Arista]) -> list[list[int]]:
    """Listas de adyacencia de un grafo no dirigido sobre ``0..n-1``."""
    ady: list[list[int]] = [[] for _ in range(n)]
    for u, v in aristas:
        ady[u].append(v)
        ady[v].append(u)
    return ady


def ola(
    n: int, aristas: Iterable[Arista], origen: int = 0
) -> tuple[list[list[int]], list[Arista]]:
    """Búsqueda en anchura desde ``origen``, organizada por frentes.

    Devuelve ``(frentes, arbol)``:

    - ``frentes[k]``: vértices a distancia exactamente ``k`` del origen (los
      "anillos" de la ola);
    - ``arbol``: aristas ``(padre, hijo)`` por las que avanzó la ola. Forman un
      árbol generador de la componente del origen.
    """
    ady = lista_adyacencia(n, aristas)
    visto = [False] * n
    visto[origen] = True
    frentes = [[origen]]
    arbol: list[Arista] = []
    while True:
        siguiente = []
        for u in frentes[-1]:
            for v in ady[u]:
                if not visto[v]:
                    visto[v] = True
                    arbol.append((u, v))
                    siguiente.append(v)
        if not siguiente:
            return frentes, arbol
        frentes.append(siguiente)


def certificado(
    n: int, aristas: Sequence[Arista]
) -> (
    tuple[Literal["conexo"], list[Arista]]
    | tuple[Literal["desconexo"], tuple[list[int], list[int]]]
):
    """Decide la conexidad y devuelve el testigo correspondiente.

    ``("conexo", arbol_generador)`` o ``("desconexo", (U, W))``. El grafo vacío
    (``n == 0``) se considera conexo, con el árbol vacío como testigo.
    """
    if n == 0:
        return "conexo", []
    frentes, arbol = ola(n, aristas)
    mojados = {v for frente in frentes for v in frente}
    if len(mojados) == n:
        return "conexo", arbol
    secos = sorted(set(range(n)) - mojados)
    return "desconexo", (sorted(mojados), secos)


def verificar_arbol_generador(
    n: int, aristas: Iterable[Arista], arbol: Sequence[Arista]
) -> bool:
    """¿Es ``arbol`` un árbol generador de ``(0..n-1, aristas)``?

    Basta chequear tres cosas fáciles: son aristas del grafo, son ``n - 1``, y
    conectan todo (la ola sobre ellas moja los ``n`` vértices).
    """
    if n == 0:
        return len(arbol) == 0
    E = {frozenset(e) for e in aristas}
    if len(arbol) != n - 1 or any(frozenset(e) not in E for e in arbol):
        return False
    frentes, _ = ola(n, arbol)
    return sum(len(f) for f in frentes) == n


def verificar_separacion(
    n: int, aristas: Iterable[Arista], U: Iterable[int], W: Iterable[int]
) -> bool:
    """¿Es ``(U, W)`` una separación de ``(0..n-1, aristas)``?

    Partición no trivial de los vértices y ninguna arista que cruce de U a W.
    """
    U, W = set(U), set(W)
    if not U or not W or U & W or U | W != set(range(n)):
        return False
    return all((u in U) == (v in U) for u, v in aristas)


def componentes(n: int, aristas: Iterable[Arista]) -> list[int]:
    """Ejercicio 1(ii): etiqueta de componente de cada vértice, en tiempo O(n + m).

    Se recorren los vértices en orden; cada vez que uno no tiene etiqueta se lanza
    una ola nueva desde él con una etiqueta nueva. Las etiquetas son ``0, 1, ...``
    en el orden en que aparecen.
    """
    ady = lista_adyacencia(n, aristas)
    etiqueta = [-1] * n
    actual = 0
    for s in range(n):
        if etiqueta[s] != -1:
            continue
        etiqueta[s] = actual
        cola = deque([s])
        while cola:
            u = cola.popleft()
            for v in ady[u]:
                if etiqueta[v] == -1:
                    etiqueta[v] = actual
                    cola.append(v)
        actual += 1
    return etiqueta


def ciclo_fundamental(n: int, arbol: Sequence[Arista], arista: Arista) -> list[int]:
    """El único ciclo que aparece al agregar ``arista`` (que no está en el árbol).

    Devuelve los vértices del ciclo en orden, empezando y terminando en
    ``arista[0]``: el camino del árbol de ``u`` a ``v`` cerrado por la arista nueva.
    """
    u, v = arista
    ady = lista_adyacencia(n, arbol)
    padre = {u: u}
    cola = deque([u])
    while cola:
        x = cola.popleft()
        for y in ady[x]:
            if y not in padre:
                padre[y] = x
                cola.append(y)
    if v not in padre:
        raise ValueError("los extremos de la arista no están en el mismo árbol")
    camino = [v]
    while camino[-1] != u:
        camino.append(padre[camino[-1]])
    return camino[::-1] + [u]


def corte_fundamental(
    n: int, arbol: Sequence[Arista], arista: Arista
) -> tuple[list[int], list[int]]:
    """Las dos partes en que se parte el árbol al quitar ``arista`` (que está en él).

    Es una separación del árbol sin esa arista: la arista era un puente.
    """
    resto = [e for e in arbol if frozenset(e) != frozenset(arista)]
    if len(resto) == len(arbol):
        raise ValueError("la arista no pertenece al árbol")
    frentes, _ = ola(n, resto, origen=arista[0])
    lado = sorted(v for frente in frentes for v in frente)
    return lado, sorted(set(range(n)) - set(lado))
