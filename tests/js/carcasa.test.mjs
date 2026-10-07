// Tests de la lógica pura de la carcasa común de gadgets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { codificarEstado, decodificarEstado, leerDelHash, escribirEnHash } from "../../assets/js/gadget/carcasa.js";

test("el estado ida y vuelta por la URL (con acentos, números y listas)", () => {
  const estado = { curva: [[1.5, -2], [3, 4]], punto: [0, 0], nombre: "limaçon", capas: { campo: true } };
  const t = codificarEstado(estado);
  assert.match(t, /^[A-Za-z0-9_-]+$/); // apto para la URL, sin = + /
  assert.deepEqual(decodificarEstado(t), estado);
});

test("un texto inválido no rompe nada", () => {
  assert.equal(decodificarEstado("%%%no-es-base64"), null);
  assert.equal(decodificarEstado(""), null);
});

test("varios gadgets conviven en el mismo hash", () => {
  let h = "";
  h = escribirEnHash(h, "g1", "AAA");
  h = escribirEnHash(h, "g4", "BBB");
  h = escribirEnHash(h, "g1", "CCC"); // reescribe g1 y conserva g4
  assert.equal(leerDelHash(h, "g1"), "CCC");
  assert.equal(leerDelHash(h, "g4"), "BBB");
  assert.equal(leerDelHash(h, "g9"), null);
  assert.equal(leerDelHash("#sec-bases", "g1"), null); // convive con las anclas de Quarto
});
