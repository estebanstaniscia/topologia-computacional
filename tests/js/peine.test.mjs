// Tests de la lógica de "El peine".
import { test } from "node:test";
import assert from "node:assert/strict";
import { clasificar, analizarTrazo, remuestrear, primerDienteEnDisco } from "../../assets/js/peine.js";

const tol = 0.004;

test("clasificación de puntos", () => {
  assert.equal(clasificar([0, 1], tol), "p");
  assert.equal(clasificar([0.5, 0], tol), "barra");
  assert.deepEqual(clasificar([1 / 7, 0.6], tol), { diente: 7 });
  assert.equal(clasificar([0.3, 0.6], tol), "fuera"); // entre 1/3 y 1/4
  assert.equal(clasificar([0, 0.5], tol), "fuera"); // el diente borrado
  assert.equal(clasificar([0.01, 0.5], tol, 0.05), "densa");
  assert.equal(clasificar([0.5, 1.5], tol), "fuera");
});

test("el disco de radio r toca exactamente los dientes k > 1/r", () => {
  for (const r of [0.9, 0.5, 0.31, 0.1, 0.0123]) {
    const k = primerDienteEnDisco(r);
    assert.ok(1 / k < r && 1 / (k - 1) >= r);
  }
});

test("un camino honesto (subir y bajar por dientes vía la barra) no salta", () => {
  // barra en x=1 -> sube por el diente 1 -> baja -> barra hasta 1/2 -> sube el diente 2
  const camino = remuestrear([[1, 0], [1, 0.8], [1, 0], [0.5, 0], [0.5, 0.9]], 0.002);
  const a = analizarTrazo(camino, tol);
  assert.equal(a.nSaltos, 0);
  assert.deepEqual(a.dientes, [1, 2]);
  assert.equal(a.terminaEnP, false);
});

test("un trazo directo hacia p salta: sale del peine o cambia de diente por el aire", () => {
  const directo = remuestrear([[0.5, 0.0], [0.5, 0.5], [0.0, 1.0]], 0.001);
  const a = analizarTrazo(directo, tol);
  assert.ok(a.nSaltos > 0);
  assert.ok(a.terminaEnP);
});

test("barrido horizontal entre dientes muy juntos: cada hueco es un salto", () => {
  // cerca de x = 0.06 los dientes distan ~0.0036 < 2·tol: la tolerancia adaptativa
  // igual distingue los huecos entre dientes
  const barrido = remuestrear([[0.07, 0.8], [0.05, 0.8]], 0.0002);
  const a = analizarTrazo(barrido, tol);
  assert.ok(a.tramosFuera.length >= 3);
});

test("pasar de un diente a otro sin muestras intermedias también es un salto", () => {
  const a = analizarTrazo([[1 / 14, 0.5], [1 / 15, 0.5]], tol);
  assert.deepEqual(a.saltosEntreDientes, [1]);
  assert.equal(a.nSaltos, 1);
});

test("remuestrear respeta el paso", () => {
  const r = remuestrear([[0, 0], [1, 0]], 0.1);
  assert.equal(r.length, 11);
});
