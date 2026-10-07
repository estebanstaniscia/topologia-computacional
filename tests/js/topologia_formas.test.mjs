// Tests de la lógica de "Una topología no ve formas".
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dentro, distanciaAlBorde, formasBasicas, verticesCuadrado, verticesRombo,
  entornoDentro, cubrimientoComplemento,
} from "../../assets/js/topologia_formas.js";
import { aleatorio } from "../../assets/js/comun.js";

const cuadradoU = [[0, 0], [10, 0], [10, 6], [0, 6]];

test("dentro y distancia al borde", () => {
  assert.ok(dentro([5, 3], cuadradoU));
  assert.ok(!dentro([11, 3], cuadradoU));
  assert.equal(distanciaAlBorde([5, 3], cuadradoU), 3);
  assert.equal(distanciaAlBorde([1, 3], cuadradoU), 1);
});

test("las tres formas básicas centradas en x caben en U (polígono convexo y no convexo)", () => {
  const estrella = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 2 : 5, t = (Math.PI * k) / 5;
    return [r * Math.cos(t), r * Math.sin(t)];
  });
  const rnd = aleatorio(3);
  for (const U of [cuadradoU, estrella]) {
    let probados = 0;
    while (probados < 300) {
      const x = [-6 + 17 * rnd(), -6 + 13 * rnd()];
      if (!dentro(x, U)) continue;
      probados++;
      const r = distanciaAlBorde(x, U) * 0.97;
      const f = formasBasicas(r);
      for (const v of [...verticesCuadrado(x, f.cuadrado), ...verticesRombo(x, f.rombo)]) assert.ok(dentro(v, U));
      for (let k = 0; k < 24; k++) {
        const t = (2 * Math.PI * k) / 24;
        assert.ok(dentro([x[0] + f.disco * Math.cos(t), x[1] + f.disco * Math.sin(t)], U));
      }
    }
  }
});

test("Sorgenfrey: [a, b) es abierto (en a cabe [a, a + δ)); en la usual no", () => {
  assert.equal(entornoDentro(0, 0.3, 0, 1, "sorgenfrey"), true);
  assert.equal(entornoDentro(0, 0.3, 0, 1, "usual"), false);
  for (let d = 0.5; d > 1e-9; d /= 2) assert.equal(entornoDentro(0, d, 0, 1, "usual"), false); // ningún δ
  assert.equal(entornoDentro(0.5, 0.2, 0, 1, "usual"), true); // los puntos interiores sí tienen margen
});

test("el complemento de [a, b) es unión de semiabiertos (dentro de la ventana)", () => {
  const [a, b, lo, hi] = [0.3, 1.7, -3, 4];
  const piezas = cubrimientoComplemento(a, b, lo, hi);
  for (let t = lo; t < hi; t += 0.01) {
    const enComplemento = t < a || t >= b;
    const cubierto = piezas.some(([p, q]) => t >= p && t < q);
    assert.equal(cubierto, enComplemento, `t = ${t}`);
  }
});
