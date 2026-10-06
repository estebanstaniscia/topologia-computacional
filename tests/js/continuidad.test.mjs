// Tests de la lógica de "Continuidad: tirar hacia atrás".
import { test } from "node:test";
import assert from "node:assert/strict";
import { preimagen, esAbierto, esContinua, pruebaEpsDelta, deltaMaximo } from "../../assets/js/continuidad.js";

test("la tabla del giro (disección 3.2): f es continua solo con Sierpiński {1} y con la trivial", () => {
  assert.equal(esContinua("f", "discreta"), false);
  assert.equal(esContinua("f", "sierpinski1"), true);
  assert.equal(esContinua("f", "sierpinski0"), false);
  assert.equal(esContinua("f", "trivial"), true);
});

test("la imagen especular: g = 1 − f es continua con Sierpiński {0}, no con {1}", () => {
  assert.equal(esContinua("g", "sierpinski1"), false);
  assert.equal(esContinua("g", "sierpinski0"), true);
  assert.equal(esContinua("g", "discreta"), false);
  assert.equal(esContinua("g", "trivial"), true);
});

test("preimágenes", () => {
  assert.equal(preimagen("f", [1]), "positivos");
  assert.equal(preimagen("f", [0]), "noPositivos");
  assert.equal(preimagen("g", [1]), "noPositivos");
  assert.equal(preimagen("f", []), "vacio");
  assert.equal(preimagen("f", [0, 1]), "reales");
  assert.equal(esAbierto("noPositivos"), false);
  assert.equal(esAbierto("positivos"), true);
});

test("ε-δ en x₀ = 0: ningún δ funciona para ε ≤ 1", () => {
  for (let delta = 1; delta > 1e-12; delta /= 2) {
    const r = pruebaEpsDelta(0, 0.5, delta);
    assert.equal(r.funciona, false);
    assert.deepEqual(r.escapan, [0, delta]);
  }
  assert.equal(pruebaEpsDelta(0, 1.2, 0.3).funciona, true); // ε > 1: todo vale
});

test("ε-δ en x₀ ≠ 0: funciona exactamente δ ≤ |x₀|", () => {
  for (const x0 of [-0.7, -0.1, 0.05, 0.9]) {
    const m = deltaMaximo(x0);
    assert.equal(pruebaEpsDelta(x0, 0.3, m).funciona, true);
    assert.equal(pruebaEpsDelta(x0, 0.3, m * 0.5).funciona, true);
    assert.equal(pruebaEpsDelta(x0, 0.3, m * 1.01).funciona, false);
  }
});
