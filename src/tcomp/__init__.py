"""tcomp: implementaciones propias de los algoritmos de *Computational Topology*.

Edelsbrunner y Harer, AMS 2010. Convención de toda la librería: los elementos y
vértices son ``0..n-1``.
"""

from tcomp.conexidad import certificado, componentes, ola
from tcomp.persistencia import arbol_generador_minimo, kruskal, persistencia_0
from tcomp.union_find import UnionFind, componentes_conexas

__all__ = [
    "UnionFind",
    "arbol_generador_minimo",
    "certificado",
    "componentes",
    "componentes_conexas",
    "kruskal",
    "ola",
    "persistencia_0",
]
