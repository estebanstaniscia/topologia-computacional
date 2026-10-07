"""Fixtures de tcomp.curvas que validan el gemelo JS (assets/js/curvas.js).

Uso: uv run python tests/js/generar_fixtures_curvas.py
"""

import json
import math
import random
from pathlib import Path

from tcomp.curvas import (
    antihorario,
    area_con_signo,
    cruces,
    es_simple,
    paridad,
    poligono_desenredado,
    poligono_estrella,
    posicion_general,
    triangular,
    vueltas_por_cruces,
)

rng = random.Random(2026)
casos = []
# curvas no simples: polígonos aleatorios cualesquiera (con autointersecciones)
for _ in range(40):
    P = [
        (rng.randint(-50, 50), rng.randint(-50, 50)) for _ in range(rng.randint(3, 15))
    ]
    puntos = [
        (rng.randint(-55, 55), rng.choice([p[1] for p in P] + [rng.randint(-55, 55)]))
        for _ in range(25)
    ]
    casos.append(
        {
            "P": P,
            "consultas": [
                {"x": x, "w": vueltas_por_cruces(x, P), "n": cruces(x, P)}
                for x in puntos
            ],
        }
    )
# polígonos simples: paridad y triangulación (en posición general, como el libro)
simples = []
k = 0
while len(simples) < 60:
    gen = poligono_estrella if k % 2 else poligono_desenredado
    k += 1
    P = gen(rng.randint(3, 22), rng)
    if (
        len(set(P)) < len(P)
        or not es_simple(P)
        or not posicion_general(P)
        or area_con_signo(P) == 0
    ):
        continue
    P = antihorario(P)
    T, D = triangular(P)
    puntos = [(rng.randint(-110, 110), rng.randint(-110, 110)) for _ in range(20)]
    simples.append(
        {
            "P": P,
            "triangulos": [list(t) for t in T],
            "diagonales": [list(d) for d in D],
            "paridad": [{"x": x, "r": paridad(x, P)} for x in puntos],
        }
    )
destino = Path(__file__).parent / "fixtures" / "curvas.json"
destino.write_text(json.dumps({"curvas": casos, "simples": simples}))
print(f"{len(casos)} curvas, {len(simples)} polígonos simples -> {destino}")
assert math.isfinite(1.0)
