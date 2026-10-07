// Tests de la lógica del Paisaje de vueltas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { grillaW, extremosLocales } from "../../assets/js/paisaje.js";
import { aEnteros, CURVAS, vueltasPorAngulos } from "../../assets/js/curvas.js";

const LIM = [-330, 330, -240, 240];

test("la grilla de W coincide con W por ángulos (referencia independiente)", () => {
  const P = aEnteros(CURVAS.flor());
  const W = grillaW(P, LIM, 33, 24);
  for (let j = 0; j < 24; j++) for (let i = 0; i < 33; i++) {
    const x = [LIM[0] + (660 * (i + 0.5)) / 33, LIM[2] + (480 * (j + 0.5)) / 24];
    assert.equal(W[j * 33 + i], vueltasPorAngulos(x, P));
  }
});

test("el limaçon: una cima de altura 2; el ocho: una cima (+1) y una sima (−1)", () => {
  const L = grillaW(aEnteros(CURVAS.limacon()), LIM, 160, 120);
  assert.deepEqual(extremosLocales(L, 160, 120).cimas, [2]);
  const O = grillaW(aEnteros(CURVAS.ocho()), LIM, 160, 120);
  const e = extremosLocales(O, 160, 120);
  assert.deepEqual(e.cimas, [1]);
  assert.deepEqual(e.simas, [-1]);
});

test("vecinas que difieren en exactamente uno (los acantilados miden un escalón)", () => {
  const P = aEnteros(CURVAS.flor()), nx = 200, ny = 150;
  const W = grillaW(P, LIM, nx, ny);
  let saltos = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i + 1 < nx; i++) {
    const d = Math.abs(W[j * nx + i] - W[j * nx + i + 1]);
    assert.ok(d <= 2); // entre dos muestras vecinas la curva puede pasar una o, raramente, dos veces
    if (d === 1) saltos++;
  }
  assert.ok(saltos > 0);
});
