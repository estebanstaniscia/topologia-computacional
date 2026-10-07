// Tests de la lógica del "Taller de topologías finitas".
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fallas, esTopologia, generada, especializacion, clopenNoTrivial, conexoPorCaminos,
  todasLasTopologias, catalogo, canonica, ESCENARIOS_TOP,
} from "../../assets/js/topologias_finitas.js";

test("los números de la disección: 4 topologías sobre 2 puntos; 29 sobre 3, en 9 clases", () => {
  assert.equal(todasLasTopologias(2).length, 4);
  assert.equal(catalogo(2).size, 3); // trivial, Sierpiński (dos copias homeomorfas), discreta
  assert.equal(todasLasTopologias(3).length, 29);
  assert.equal(catalogo(3).size, 9);
});

test("en espacios finitos, conexo ⟺ conexo por caminos (las 29 + las 4)", () => {
  for (const n of [2, 3]) for (const T of todasLasTopologias(n)) {
    assert.equal(clopenNoTrivial(T, n) === null, conexoPorCaminos(T, n));
  }
});

test("Sierpiński: conexo, conexo por caminos, preorden a ≤ b", () => {
  const T = new Set(ESCENARIOS_TOP.sierpinski.abiertos);
  assert.ok(esTopologia(T, 2));
  assert.equal(clopenNoTrivial(T, 2), null);
  assert.deepEqual(especializacion(T, 2), [[0, 1]]); // todo abierto que contiene a "a" contiene a "b"
});

test("dos mundos: no conexo, y el clopen es testigo", () => {
  const T = new Set(ESCENARIOS_TOP.dosmundos.abiertos);
  assert.ok(esTopologia(T, 3));
  assert.notEqual(clopenNoTrivial(T, 3), null);
  assert.equal(conexoPorCaminos(T, 3), false);
});

test("las fallas dicen qué axioma y con qué conjuntos", () => {
  const F = fallas(new Set(ESCENARIOS_TOP.rota.abiertos), 3);
  assert.deepEqual(F, [{ axioma: 3, conjuntos: [1, 2], falta: 3 }]); // {a} ∪ {b} = {a, b} falta
  const sinX = fallas(new Set([0, 1]), 2);
  assert.equal(sinX[0].axioma, 1);
});

test("generada: es topología, contiene lo marcado y es la más chica", () => {
  for (const T of todasLasTopologias(3)) {
    assert.equal(generada(T, 3).size, T.size); // una topología se genera a sí misma
  }
  const G = generada(new Set([0b001, 0b010]), 3);
  assert.ok(esTopologia(G, 3));
  assert.deepEqual([...G].sort((a, b) => a - b), [0, 1, 2, 3, 7]);
});

test("la forma canónica no depende de cómo se llamen los puntos", () => {
  const T1 = new Set([0, 0b001, 0b111]);
  const T2 = new Set([0, 0b100, 0b111]);
  assert.equal(canonica(T1, 3), canonica(T2, 3));
});
