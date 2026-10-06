"""Sistema de conjuntos disjuntos (union-find), sección I.1 de Edelsbrunner y Harer.

La estructura mantiene una partición de los elementos ``0..n-1`` como un bosque de
árboles con punteros hacia arriba (*up-trees*) guardado en un arreglo lineal
``parent``: el arreglo es el almacenamiento y el bosque es el significado.

Convenciones del libro (pp. 6-8), respetadas al pie de la letra:

- Las raíces se apuntan a sí mismas: ``parent[r] == r``.
- ``union(i, j)`` calcula ``x = find(i)``, ``y = find(j)`` y, si difieren, cuelga
  ``x`` DEBAJO de ``y`` (``parent[x] = y``).
- Con unión por tamaño, si ``size[x] > size[y]`` se intercambian, de modo que el
  árbol más chico cuelga del más grande. En caso de EMPATE, ``x`` cuelga de ``y``.

Tres estrategias, para poder compararlas:

- ``"ingenua"``: ``find`` sube sin tocar nada; ``union`` cuelga ``x`` de ``y`` siempre.
- ``"tamano"``: unión por tamaño, ``find`` sin compresión.
- ``"completa"``: unión por tamaño + compresión de caminos (la versión óptima).

Además de mantener la partición, la estructura cuenta:

- ``componentes``: β₀ del grafo procesado (cantidad de conjuntos).
- ``rechazadas``: aristas cuyos extremos ya estaban conectados. Cada una cierra un
  ciclo independiente, así que al final ``rechazadas == β₁ == m - n + β₀``.
- ``saltos``: total de punteros recorridos por los ``find`` (medida de costo).

Los elementos son ``0..n-1`` (convención de toda la librería). Las páginas del sitio
muestran las etiquetas ``1..n`` del libro sumando 1 al dibujar.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import asdict, dataclass, field
from typing import Literal

Estrategia = Literal["ingenua", "tamano", "completa"]
ESTRATEGIAS: tuple[Estrategia, ...] = ("ingenua", "tamano", "completa")


@dataclass
class Evento:
    """Un paso de la traza, pensado para animarlo o exportarlo a JSON.

    - ``tipo``: ``"find"``, ``"union"`` o ``"rechazo"``.
    - ``args``: argumentos de la operación (``(i,)`` o ``(i, j)``).
    - ``camino``: nodos recorridos por ``find``, de ``i`` a la raíz.
    - ``comprimidos``: nodos re-apuntados a la raíz por la compresión.
    - ``enlace``: ``(hijo, padre)`` creado por ``union``.
    - ``intercambio``: si la unión por tamaño intercambió ``x`` e ``y``.
    - ``parent``, ``size``: foto del arreglo después del paso.
    """

    tipo: Literal["find", "union", "rechazo"]
    args: tuple[int, ...]
    camino: list[int] = field(default_factory=list)
    comprimidos: list[int] = field(default_factory=list)
    enlace: tuple[int, int] | None = None
    intercambio: bool = False
    parent: list[int] = field(default_factory=list)
    size: list[int] = field(default_factory=list)


class UnionFind:
    """Union-find sobre los elementos ``0..n-1``.

    >>> uf = UnionFind(4)
    >>> uf.union(0, 1), uf.union(1, 2), uf.union(0, 2)
    (True, True, False)
    >>> uf.componentes, uf.rechazadas
    (2, 1)
    """

    def __init__(
        self, n: int, estrategia: Estrategia = "completa", trazar: bool = False
    ):
        if estrategia not in ESTRATEGIAS:
            raise ValueError(
                f"estrategia desconocida: {estrategia!r}; opciones: {ESTRATEGIAS}"
            )
        if n < 0:
            raise ValueError("n debe ser no negativo")
        self.n = n
        self.estrategia = estrategia
        self.parent = list(range(n))
        self.size = [1] * n
        self.componentes = n
        self.rechazadas = 0
        self.saltos = 0
        self.trazar = trazar
        self.traza: list[Evento] = []

    # ------------------------------------------------------------------ find
    def find(self, i: int, *, registrar: bool = True) -> int:
        """Devuelve la raíz (el nombre) del conjunto que contiene a ``i``.

        Con la estrategia ``"completa"`` comprime el camino: todo nodo recorrido
        pasa a apuntar directamente a la raíz. La compresión es iterativa (dos
        pasadas) para no chocar con el límite de recursión de Python en cadenas
        largas; el resultado es idéntico al de la versión recursiva del libro.
        """
        camino = [i]
        while self.parent[camino[-1]] != camino[-1]:
            camino.append(self.parent[camino[-1]])
        raiz = camino[-1]
        self.saltos += len(camino) - 1
        comprimidos = []
        if self.estrategia == "completa":
            for v in camino[:-1]:
                if (
                    self.parent[v] != raiz
                ):  # el hijo directo de la raíz ya apunta a ella
                    self.parent[v] = raiz
                    comprimidos.append(v)
        if self.trazar and registrar:
            self._registrar(
                Evento("find", (i,), camino=camino, comprimidos=comprimidos)
            )
        return raiz

    # ----------------------------------------------------------------- union
    def union(self, i: int, j: int) -> bool:
        """Une los conjuntos de ``i`` y ``j``.

        Devuelve ``True`` si fusionó dos componentes y ``False`` si ya estaban
        unidas (la arista ``(i, j)`` se rechaza: cierra un ciclo).
        """
        x = self.find(i)
        y = self.find(j)
        if x == y:
            self.rechazadas += 1
            if self.trazar:
                self._registrar(Evento("rechazo", (i, j)))
            return False
        intercambio = False
        if self.estrategia != "ingenua" and self.size[x] > self.size[y]:
            x, y = y, x
            intercambio = True
        self.parent[x] = y
        self.size[y] += self.size[x]
        self.componentes -= 1
        if self.trazar:
            self._registrar(
                Evento("union", (i, j), enlace=(x, y), intercambio=intercambio)
            )
        return True

    def conectados(self, i: int, j: int) -> bool:
        """¿Están ``i`` y ``j`` en la misma componente? (``find(i) == find(j)``)."""
        return self.find(i) == self.find(j)

    # ------------------------------------------------------------ consultas
    def raiz(self, i: int) -> int:
        """Raíz de ``i`` sin efectos laterales (no comprime ni cuenta saltos)."""
        while self.parent[i] != i:
            i = self.parent[i]
        return i

    def profundidad(self, i: int) -> int:
        """Cantidad de punteros entre ``i`` y su raíz (sin efectos laterales)."""
        d = 0
        while self.parent[i] != i:
            i = self.parent[i]
            d += 1
        return d

    def altura(self) -> int:
        """Altura del bosque: la mayor profundidad de un nodo."""
        return max((self.profundidad(i) for i in range(self.n)), default=0)

    def conjuntos(self) -> list[set[int]]:
        """La partición actual, ordenada por el menor elemento de cada conjunto."""
        por_raiz: dict[int, set[int]] = {}
        for i in range(self.n):
            por_raiz.setdefault(self.raiz(i), set()).add(i)
        return sorted(por_raiz.values(), key=min)

    # ---------------------------------------------------------------- traza
    def traza_dicts(self) -> list[dict]:
        """La traza como lista de diccionarios (lista para ``json.dumps``)."""
        return [asdict(ev) for ev in self.traza]

    def _registrar(self, ev: Evento) -> None:
        ev.parent = self.parent.copy()
        ev.size = self.size.copy()
        self.traza.append(ev)


def componentes_conexas(
    n: int, aristas: Iterable[tuple[int, int]], estrategia: Estrategia = "completa"
) -> tuple[list[set[int]], list[tuple[int, int]], list[tuple[int, int]]]:
    """Decide la conexidad procesando las aristas de a una (algoritmo de la p. 6).

    Es el "albañil" de la disección: pone las aristas de a una y descarta las que
    cerrarían un ciclo. Devuelve ``(conjuntos, bosque, rechazadas)``:

    - ``conjuntos``: las componentes conexas;
    - ``bosque``: aristas aceptadas, que forman un bosque generador (un árbol
      generador si el grafo es conexo);
    - ``rechazadas``: aristas que cerraron un ciclo; hay exactamente β₁ de ellas.
    """
    uf = UnionFind(n, estrategia)
    bosque: list[tuple[int, int]] = []
    rechazadas: list[tuple[int, int]] = []
    for u, v in aristas:
        (bosque if uf.union(u, v) else rechazadas).append((u, v))
    return uf.conjuntos(), bosque, rechazadas
