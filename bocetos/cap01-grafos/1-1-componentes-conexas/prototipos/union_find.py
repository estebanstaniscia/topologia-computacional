"""Prototipo de referencia: sistema de conjuntos disjuntos (union-find).

Sección I.1 de Edelsbrunner y Harer. Este archivo es un BOCETO: fija la
semántica exacta (incluidas las convenciones de desempate del libro) y produce
trazas paso a paso que alimentan las visualizaciones. La versión final vive en
`src/tcomp/union_find.py` (la construye Claude Code a partir de la spec).

Convenciones del libro (pp. 6-8):
- `Union(i, j)` calcula x = Find(i), y = Find(j) y, si difieren, cuelga x DEBAJO
  de y (V[x].parent = y).
- Con unión por tamaño: si size[x] > size[y] se intercambian, de modo que el
  árbol más chico cuelga del más grande. En caso de EMPATE, x cuelga de y.
- Las raíces se apuntan a sí mismas (parent[r] == r).

Tres estrategias, para poder compararlas:
- "ingenua":   Find sube sin tocar nada; Union cuelga x de y siempre.
- "tamano":    unión por tamaño, Find sin compresión.
- "completa":  unión por tamaño + compresión de caminos (la versión óptima).

Además de mantener la partición, la estructura cuenta:
- `componentes`: beta_0 del grafo (número de conjuntos).
- `rechazadas`: aristas cuyos extremos ya estaban conectados. Cada una cierra
  un ciclo independiente, así que al final rechazadas = beta_1 = m - n + beta_0.
- `saltos`: total de punteros recorridos por los Find (medida de costo).

Uso:  python3 union_find.py   (corre las verificaciones y muestra las trazas)
"""

from __future__ import annotations

from dataclasses import dataclass, field

ESTRATEGIAS = ("ingenua", "tamano", "completa")


@dataclass
class Evento:
    """Un paso de la traza, pensado para animarlo."""

    tipo: str  # "find", "union", "rechazo"
    args: tuple
    camino: list[int] = field(default_factory=list)  # nodos recorridos por Find
    comprimidos: list[int] = field(default_factory=list)  # nodos re-apuntados a la raíz
    enlace: tuple[int, int] | None = None  # (hijo, padre) creado por Union
    swap: bool = False  # True si la unión por tamaño intercambió x e y
    parent: list[int] = field(default_factory=list)  # foto del arreglo tras el paso
    size: list[int] = field(default_factory=list)


class UnionFind:
    """Union-find sobre los elementos 1..n (índice 0 sin usar, como en el libro)."""

    def __init__(self, n: int, estrategia: str = "completa", trazar: bool = False):
        if estrategia not in ESTRATEGIAS:
            raise ValueError(f"estrategia desconocida: {estrategia}")
        self.n = n
        self.estrategia = estrategia
        self.parent = list(range(n + 1))
        self.size = [1] * (n + 1)
        self.componentes = n
        self.rechazadas = 0
        self.saltos = 0
        self.trazar = trazar
        self.traza: list[Evento] = []

    # ------------------------------------------------------------------ Find
    def find(self, i: int, _registrar: bool = True) -> int:
        camino = [i]
        while self.parent[camino[-1]] != camino[-1]:
            camino.append(self.parent[camino[-1]])
        raiz = camino[-1]
        self.saltos += len(camino) - 1
        comprimidos = []
        if self.estrategia == "completa":
            # Compresión de caminos: todo nodo del camino (salvo la raíz y su
            # hijo directo, que ya apunta a ella) pasa a apuntar a la raíz.
            for v in camino[:-1]:
                if self.parent[v] != raiz:
                    self.parent[v] = raiz
                    comprimidos.append(v)
        if self.trazar and _registrar:
            self._registrar(Evento("find", (i,), camino=camino, comprimidos=comprimidos))
        return raiz

    # ----------------------------------------------------------------- Union
    def union(self, i: int, j: int) -> bool:
        """Devuelve True si unió dos componentes, False si ya estaban unidas."""
        x = self.find(i)
        y = self.find(j)
        if x == y:
            self.rechazadas += 1
            if self.trazar:
                self._registrar(Evento("rechazo", (i, j)))
            return False
        swap = False
        if self.estrategia in ("tamano", "completa") and self.size[x] > self.size[y]:
            x, y = y, x
            swap = True
        self.parent[x] = y
        self.size[y] += self.size[x]
        self.componentes -= 1
        if self.trazar:
            self._registrar(Evento("union", (i, j), enlace=(x, y), swap=swap))
        return True

    # ------------------------------------------------------------ utilidades
    def profundidad(self, i: int) -> int:
        d = 0
        while self.parent[i] != i:
            i = self.parent[i]
            d += 1
        return d

    def altura(self) -> int:
        return max(self.profundidad(i) for i in range(1, self.n + 1))

    def conjuntos(self) -> list[set[int]]:
        por_raiz: dict[int, set[int]] = {}
        for i in range(1, self.n + 1):
            r = i
            while self.parent[r] != r:
                r = self.parent[r]
            por_raiz.setdefault(r, set()).add(i)
        return sorted(por_raiz.values(), key=min)

    def _registrar(self, ev: Evento) -> None:
        ev.parent = self.parent[1:].copy()
        ev.size = self.size[1:].copy()
        self.traza.append(ev)


def componentes_conexas(n: int, aristas, estrategia: str = "completa"):
    """Decide conexidad procesando aristas (algoritmo de la p. 6).

    Devuelve (conjuntos, aristas_del_bosque, aristas_rechazadas). Las aristas
    aceptadas forman un bosque generador; las rechazadas cierran ciclos.
    """
    uf = UnionFind(n, estrategia)
    bosque, ciclos = [], []
    for u, v in aristas:
        (bosque if uf.union(u, v) else ciclos).append((u, v))
    return uf.conjuntos(), bosque, ciclos


# ============================================================ verificaciones
def _arbol_ascii(uf: UnionFind) -> str:
    hijos: dict[int, list[int]] = {}
    for i in range(1, uf.n + 1):
        if uf.parent[i] != i:
            hijos.setdefault(uf.parent[i], []).append(i)
    lineas = []

    def dibujar(v, prefijo=""):
        etiqueta = f"{v} (size={uf.size[v]})" if uf.parent[v] == v else str(v)
        lineas.append(prefijo + etiqueta)
        for h in sorted(hijos.get(v, [])):
            dibujar(h, prefijo + "    ")

    for r in range(1, uf.n + 1):
        if uf.parent[r] == r:
            dibujar(r)
    return "\n".join(lineas)


def verificar_ejemplo_4_vertices():
    """Ejemplo de NotebookLM: n=4, E={(1,2),(2,3),(1,3),(3,4)}, versión ingenua."""
    uf = UnionFind(4, "ingenua", trazar=True)
    resultados = [uf.union(*e) for e in [(1, 2), (2, 3), (1, 3), (3, 4)]]
    assert resultados == [True, True, False, True]
    assert uf.componentes == 1 and uf.rechazadas == 1
    # La versión ingenua arma la cadena 1 -> 2 -> 3 -> 4: altura 3 = n - 1.
    assert uf.parent[1:] == [2, 3, 4, 4]
    assert uf.altura() == 3
    return uf


def verificar_ejemplo_8_vertices():
    """Ejemplo de NotebookLM con unión por tamaño + compresión (n=8)."""
    uf = UnionFind(8, "completa", trazar=True)
    uf.union(1, 2)
    uf.union(3, 4)
    uf.union(1, 3)
    assert uf.parent[1:] == [2, 4, 4, 4, 5, 6, 7, 8]  # 1 -> 2 -> 4, 3 -> 4
    assert uf.size[4] == 4
    uf.union(5, 6)
    assert uf.parent[1:] == [2, 4, 4, 4, 6, 6, 7, 8]  # tabla del paso 3
    uf.union(1, 5)
    # Find(1) comprime 1 -> 4; tamaños 4 > 2 provocan el swap: 6 cuelga de 4.
    assert uf.parent[1:] == [4, 4, 4, 4, 6, 4, 7, 8]  # tabla final de NotebookLM
    assert uf.size[4] == 6
    assert uf.traza[-1].swap is True
    uf.find(5)  # el comentario final: Find(5) comprime 5 -> 4
    assert uf.parent[5] == 4
    return uf


def verificar_betti():
    """rechazadas = beta_1 = m - n + beta_0 en grafos aleatorios."""
    import random

    rng = random.Random(0)
    for _ in range(300):
        n = rng.randint(1, 30)
        posibles = [(u, v) for u in range(1, n + 1) for v in range(u + 1, n + 1)]
        aristas = rng.sample(posibles, rng.randint(0, len(posibles)))
        for est in ESTRATEGIAS:
            uf = UnionFind(n, est)
            for e in aristas:
                uf.union(*e)
            assert uf.rechazadas == len(aristas) - n + uf.componentes


def verificar_cota_logaritmica():
    """Con unión por tamaño, un árbol de k nodos tiene altura <= log2(k)."""
    import math
    import random

    rng = random.Random(1)
    for _ in range(200):
        n = rng.randint(2, 200)
        uf = UnionFind(n, "tamano")
        for _ in range(3 * n):
            uf.union(rng.randint(1, n), rng.randint(1, n))
            for r in {uf.find(i, _registrar=False) for i in range(1, n + 1)}:
                k = uf.size[r]
                h = max(uf.profundidad(i) for i in range(1, n + 1) if uf.find(i, False) == r)
                assert h <= math.log2(k) + 1e-9


def peor_caso_ingenuo(n: int) -> dict[str, int]:
    """Secuencia adversaria: Union(1,2), Union(1,3), ..., Union(1,n), luego n Find(1).

    En la versión ingenua cada Union cuelga la raíz vieja debajo del vértice
    nuevo y la cadena crece: el costo total es cuadrático.
    """
    costos = {}
    for est in ESTRATEGIAS:
        uf = UnionFind(n, est)
        for k in range(2, n + 1):
            uf.union(1, k)
        for _ in range(n):
            uf.find(1)
        costos[est] = uf.saltos
    return costos


def arbol_binomial(k: int) -> dict[str, int]:
    """Construye un árbol de altura k = log2(n) (n = 2**k) con uniones entre
    árboles de igual tamaño, y después hace n Find sobre la hoja más profunda.

    Separa el aporte de cada mejora: la unión por tamaño acota cada Find en
    log2(n) saltos; la compresión hace que, tras el primer Find, los demás
    cuesten 1 salto.
    """
    n = 2**k
    costos = {}
    for est in ESTRATEGIAS:
        uf = UnionFind(n, est)
        paso = 1
        while paso < n:
            for i in range(1, n + 1, 2 * paso):
                uf.union(i, i + paso)
            paso *= 2
        hoja = max(range(1, n + 1), key=uf.profundidad)
        uf.saltos = 0
        for _ in range(n):
            uf.find(hoja)
        costos[est] = uf.saltos
    return costos


if __name__ == "__main__":
    print("== Ejemplo de 4 vértices (ingenua) ==")
    uf4 = verificar_ejemplo_4_vertices()
    print(_arbol_ascii(uf4))
    print(f"componentes={uf4.componentes}  rechazadas(beta_1)={uf4.rechazadas}\n")

    print("== Ejemplo de 8 vértices (tamaño + compresión) ==")
    uf8 = verificar_ejemplo_8_vertices()
    print(_arbol_ascii(uf8), "\n")

    verificar_betti()
    print("OK  rechazadas == m - n + beta_0 en 300 grafos aleatorios x 3 estrategias")
    verificar_cota_logaritmica()
    print("OK  altura <= log2(tamaño) con unión por tamaño")

    print("\n== Peor caso de la versión ingenua (saltos totales de Find) ==")
    for n in (10, 100, 1000):
        print(f"n={n:5d}  ", peor_caso_ingenuo(n))

    print("\n== Árbol binomial de altura log2(n): n Find sobre la hoja más profunda ==")
    for k in (4, 7, 10):
        print(f"n={2**k:5d}  ", arbol_binomial(k))
