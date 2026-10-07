// Tests de la galería de arte de G8: 3-coloreo con orden, guardias de Fisk y polígonos de
// visibilidad. La visibilidad se verifica por dos caminos independientes: el segmento
// guardia → punto no cruza el borde (veDesde) y el punto cae en el polígono de visibilidad.
import { test } from "node:test";
import assert from "node:assert/strict";
import { aleatorio } from "../../assets/js/comun.js";
import {
  antihorario, triangular, tresColoreo, coloreoConOrden, guardiasFisk, veDesde, visibilidad,
  paridad, poligonoDesenredado, areaConSigno, aristas,
} from "../../assets/js/curvas.js";

const distanciaAlBorde = (x, Q) => Math.min(...aristas(Q).map(([a, b]) => {
  const e = [b[0] - a[0], b[1] - a[1]], L = e[0] ** 2 + e[1] ** 2;
  const t = L ? Math.max(0, Math.min(1, ((x[0] - a[0]) * e[0] + (x[1] - a[1]) * e[1]) / L)) : 0;
  return Math.hypot(x[0] - a[0] - t * e[0], x[1] - a[1] - t * e[1]);
}));

function puntosAdentro(P, rnd, cantidad) {
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]), out = [];
  while (out.length < cantidad) {
    const x = [Math.min(...xs) + rnd() * (Math.max(...xs) - Math.min(...xs)), Math.min(...ys) + rnd() * (Math.max(...ys) - Math.min(...ys))];
    if (paridad(x, P) === "adentro" && distanciaAlBorde(x, P) > 1e-3) out.push(x);
  }
  return out;
}

test("el orden del coloreo pinta cada vértice una vez y da el mismo 3-coloreo", () => {
  const rnd = aleatorio(11);
  for (let r = 0; r < 20; r++) {
    const P = antihorario(poligonoDesenredado(8 + (r % 7), rnd));
    const { triangulos } = triangular(P);
    const { color, orden } = coloreoConOrden(P.length, triangulos);
    assert.deepEqual(color, tresColoreo(P.length, triangulos));
    assert.deepEqual([...orden].sort((a, b) => a - b), P.map((_, v) => v));
    for (const t of triangulos) assert.equal(new Set(t.map((v) => color[v])).size, 3);
  }
});

test("en un polígono convexo, cada vértice ve todo", () => {
  const P = [[0, 0], [100, 0], [130, 70], [50, 120], [-20, 60]];
  for (let i = 0; i < P.length; i++) assert.ok(Math.abs(areaConSigno(visibilidad(P, i)) - areaConSigno(P)) < 1e-6);
});

test("Fisk: ⌊n/3⌋ guardias ven todo, y la visibilidad coincide por los dos caminos", () => {
  const rnd = aleatorio(12);
  let comparados = 0;
  for (let r = 0; r < 25; r++) {
    const P = antihorario(poligonoDesenredado(9 + (r % 9), rnd));
    const { triangulos } = triangular(P);
    const G = guardiasFisk(P.length, triangulos);
    assert.ok(G.length <= Math.floor(P.length / 3));
    const V = new Map(G.map((g) => [g, visibilidad(P, g)]));
    for (const x of puntosAdentro(P, rnd, 60)) {
      assert.ok(G.some((g) => veDesde(P, g, x)), `nadie ve ${x} en ${JSON.stringify(P)}`);
      for (const g of G) {
        const Q = V.get(g);
        if (distanciaAlBorde(x, Q) < 1e-3) continue;
        assert.equal(paridad(x, Q) === "adentro", veDesde(P, g, x), `guardia ${g}, punto ${x}`);
        comparados++;
      }
    }
  }
  assert.ok(comparados > 1000);
});
