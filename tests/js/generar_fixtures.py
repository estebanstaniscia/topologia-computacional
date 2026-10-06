"""Genera las trazas de referencia de tcomp que validan la simulación JS del laboratorio.

Uso: uv run python tests/js/generar_fixtures.py
Las piezas JS usan las etiquetas del libro (1..n); acá se traducen sumando 1.
"""

import json
import random
from pathlib import Path

from tcomp.union_find import ESTRATEGIAS, UnionFind

rng = random.Random(2026)
casos = []
for _ in range(60):
    n = rng.randint(2, 14)
    ops = []
    for _ in range(rng.randint(1, 3 * n)):
        if rng.random() < 0.2:
            ops.append(["F", rng.randint(1, n)])
        else:
            ops.append(["U", rng.randint(1, n), rng.randint(1, n)])
    for estrategia in ESTRATEGIAS:
        uf = UnionFind(n, estrategia)
        fotos = []
        for op in ops:
            if op[0] == "F":
                uf.find(op[1] - 1)
            else:
                uf.union(op[1] - 1, op[2] - 1)
            fotos.append(
                {
                    "parent": [p + 1 for p in uf.parent],
                    "size": uf.size.copy(),
                    "b0": uf.componentes,
                    "b1": uf.rechazadas,
                    "saltos": uf.saltos,
                }
            )
        casos.append({"n": n, "ops": ops, "estrategia": estrategia, "fotos": fotos})

destino = Path(__file__).parent / "fixtures" / "union_find.json"
destino.write_text(json.dumps(casos))
print(f"{len(casos)} casos -> {destino}")
