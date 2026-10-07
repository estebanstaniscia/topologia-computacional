// Tests del Microscopio de perturbaciones: lo simbólico coincide con lo numérico.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIGURACIONES, estadoSinPerturbar, decisionPerturbada } from "../../assets/js/microscopio.js";
import { aristas, cruces, esSimple, cruceConSigno } from "../../assets/js/curvas.js";

test("las configuraciones son polígonos simples con un caso degenerado de verdad", () => {
  for (const [k, { P, x }] of Object.entries(CONFIGURACIONES)) {
    assert.ok(esSimple(P), k);
    const estados = aristas(P).map(([a, b]) => estadoSinPerturbar(x, a, b));
    assert.ok(estados.some((e) => e !== "cruza" && e !== "no cruza"), `${k}: debería haber un caso degenerado`);
  }
});

test("la perturbación simbólica = mover x un poquito de verdad (ε₁ ≪ ε₂)", () => {
  for (const [k, { P, x }] of Object.entries(CONFIGURACIONES)) {
    const xr = [x[0] + 1e-7, x[1] + 1e-4];
    const simbolico = aristas(P).map(([a, b]) => decisionPerturbada(x, a, b).cruza);
    // numérico: el rayo de xr ya no es degenerado; contamos cruces con la fórmula común
    const numerico = aristas(P).map(([a, b]) => cruceConSigno(xr, a, b) !== 0);
    assert.deepEqual(simbolico, numerico, k);
    assert.equal(cruces(x, P), numerico.filter(Boolean).length, k);
  }
});

test("los conteos esperados: pico 1, valle 3, escalón 1, horizontal 1", () => {
  const n = (k) => cruces(CONFIGURACIONES[k].x, CONFIGURACIONES[k].P);
  assert.equal(n("pico"), 1);
  assert.equal(n("valle"), 3);
  assert.equal(n("escalon"), 1);
  assert.equal(n("horizontal"), 1);
});
