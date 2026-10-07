// Tests de la lógica del scrollytelling: qué tarjeta está en el centro de la pantalla.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pasoCentral } from "../../assets/js/scrolly.js";

test("la tarjeta que contiene el centro gana; si ninguna, la más cercana", () => {
  const alto = 800; // centro en 400
  assert.equal(pasoCentral([{ top: -300, bottom: -100 }, { top: 350, bottom: 500 }, { top: 900, bottom: 1100 }], alto), 1);
  assert.equal(pasoCentral([{ top: 100, bottom: 300 }, { top: 480, bottom: 600 }], alto), 1); // 80 < 100
  assert.equal(pasoCentral([{ top: 100, bottom: 380 }, { top: 480, bottom: 600 }], alto), 0); // 20 < 80
  assert.equal(pasoCentral([], alto), -1);
});
