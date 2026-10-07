// Tests de la lógica de "Esfera vs. toro": quién separa y quién no.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CURVAS_SUP, pared, componentes, inundar, NU, NV } from "../../assets/js/esfera_toro.js";

const c = (s, k) => componentes(s, pared(CURVAS_SUP[s][k].curvas));

test("en la esfera, toda curva cerrada simple separa en 2 (Jordan en la esfera)", () => {
  for (const k of Object.keys(CURVAS_SUP.esfera)) assert.equal(c("esfera", k), 2, k);
});

test("en el toro, un meridiano, un paralelo o la (1,1) NO separan; dos meridianos sí", () => {
  assert.equal(c("toro", "meridiano"), 1);
  assert.equal(c("toro", "paralelo"), 1);
  assert.equal(c("toro", "diagonal"), 1);
  assert.equal(c("toro", "dos"), 2);
});

test("la inundación en el toro con un meridiano cubre todo lo que no es pared", () => {
  const muro = pared(CURVAS_SUP.toro.meridiano.curvas);
  const { dist } = inundar("toro", muro, 40, 10);
  let pintadas = 0, libres = 0;
  for (let q = 0; q < NU * NV; q++) { if (!muro[q]) libres++; if (dist[q] >= 0) pintadas++; }
  assert.equal(pintadas, libres);
});

test("sin curva, las dos superficies son conexas", () => {
  assert.equal(componentes("esfera", new Uint8Array(NU * NV)), 1);
  assert.equal(componentes("toro", new Uint8Array(NU * NV)), 1);
});
