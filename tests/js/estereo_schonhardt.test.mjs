// Tests de G3 (proyección estereográfica) y G9 (poliedro de Schönhardt).
import { test } from "node:test";
import assert from "node:assert/strict";
import { estereo, estereoInversa, logistica, arco } from "../../assets/js/estereografica.js";
import { tetraedrosValidos, diagonalesAfuera, adentro, vertices, caras } from "../../assets/js/schonhardt.js";

test("la estereográfica y su inversa son inversas (ejercicio 4)", () => {
  for (const t of [-50, -3, -0.5, 0, 0.7, 4, 120]) {
    const p = estereoInversa(t);
    assert.ok(Math.abs(Math.hypot(...p) - 1) < 1e-12); // cae en el círculo
    assert.ok(Math.abs(estereo(p) - t) < 1e-9 * Math.max(1, Math.abs(t)));
  }
  assert.ok(Math.abs(estereo(arco(0.999))) > 100); // cerca de N, al infinito
  // ±30 y no ±40: 1/(1 + e⁻⁴⁰) redondea a exactamente 1 en doble precisión
  assert.ok(logistica(-30) > 0 && logistica(30) < 1 && Math.abs(logistica(0) - 0.5) < 1e-15);
});

test("prisma (θ = 0): tetraedrizable; Schönhardt (θ > 0): ningún tetraedro sirve", () => {
  assert.ok(tetraedrosValidos(0).length > 0);
  for (const g of [10, 20, 30, 45]) {
    const th = (g * Math.PI) / 180;
    assert.equal(tetraedrosValidos(th).length, 0, `${g}°`);
    assert.ok(diagonalesAfuera(th).every((d) => !d.adentro), `${g}°`);
  }
});

test("paridad en 3D: el centro adentro, puntos lejanos afuera", () => {
  const V = vertices(0.5), F = caras();
  assert.equal(adentro([0, 0, 0.8], V, F), true);
  assert.equal(adentro([3, 0, 0.8], V, F), false);
  assert.equal(adentro([0, 0, 5], V, F), false);
});

import { estereoTangente, estereoTangenteInversa, curvaPlano, ladoEnEsfera, fraccionAdentro } from "../../assets/js/estereografica.js";

test("3D: la proyección al plano tangente y su inversa son inversas", () => {
  for (const q of [[0, 0], [1, 0], [-3, 2.5], [10, -7], [0.01, 0.02]]) {
    const p = estereoTangenteInversa(q);
    assert.ok(Math.abs(Math.hypot(...p) - 1) < 1e-12);
    const r = estereoTangente(p);
    assert.ok(Math.hypot(r[0] - q[0], r[1] - q[1]) < 1e-9 * Math.max(1, Math.hypot(...q)));
  }
  assert.deepEqual(estereoTangenteInversa([0, 0]), [0, 0, -1]); // el origen del plano es S
});

test("ejercicio 3(i): N siempre está afuera, y un círculo de radio R encierra R²/(R² + 4) de la esfera", () => {
  for (const R of [0.5, 1, 2, 4, 8]) {
    const c = curvaPlano("circulo", R, 400);
    assert.equal(ladoEnEsfera([0, 0, 1], c), "afuera");
    assert.equal(ladoEnEsfera([0, 0, -1], c), "adentro");
    // el polígono inscripto encierra un poco menos que el círculo: tolerancia 1.5 %
    assert.ok(Math.abs(fraccionAdentro(c) - (R * R) / (R * R + 4)) < 0.015, `R = ${R}`);
  }
  for (const k of ["estrella", "elipse"]) {
    assert.equal(ladoEnEsfera([0, 0, 1], curvaPlano(k, 5)), "afuera");
  }
});

test("una recta del plano parte la esfera en dos hemisferios por N", () => {
  const recta = curvaPlano("recta", 0);
  assert.ok(Math.abs(fraccionAdentro(recta) - 0.5) < 0.01);
});
