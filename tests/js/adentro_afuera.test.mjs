// Tests de la lógica de "¿Adentro o afuera?".
import { test } from "node:test";
import assert from "node:assert/strict";
import { curvaDeRonda, puntoDeRonda, cronometrarAlgoritmo, TIPOS } from "../../assets/js/adentro_afuera.js";
import { esSimple, paridad, vueltasPorAngulos, antihorario } from "../../assets/js/curvas.js";
import { aleatorio } from "../../assets/js/comun.js";

test("todas las curvas del desafío son de Jordan (simples)", () => {
  const rnd = aleatorio(3);
  for (const tipo of Object.keys(TIPOS)) for (let k = 0; k < (tipo === "grilla" ? 10 : 1); k++) {
    assert.ok(esSimple(curvaDeRonda(tipo, rnd)), tipo);
  }
});

test("los puntos (fáciles y difíciles) nunca caen sobre la curva, y la paridad acierta", () => {
  const rnd = aleatorio(4);
  for (const tipo of Object.keys(TIPOS)) {
    const P = antihorario(curvaDeRonda(tipo, rnd));
    let adentro = 0;
    for (let k = 0; k < 60; k++) {
      const x = puntoDeRonda(P, rnd, k % 2 === 0);
      const r = paridad(x, P);
      assert.notEqual(r, "sobre");
      // referencia independiente: número de vueltas por ángulos (W ∈ {0, 1})
      assert.equal(r === "adentro" ? 1 : 0, vueltasPorAngulos(x, P));
      if (r === "adentro") adentro++;
    }
    assert.ok(adentro > 0 && adentro < 60, `${tipo}: hay de los dos`);
  }
});

test("el cronómetro devuelve la respuesta y un tiempo positivo", () => {
  const rnd = aleatorio(5);
  const P = curvaDeRonda("koch", rnd);
  const r = cronometrarAlgoritmo([0, 0], P, 20);
  assert.equal(r.respuesta, "adentro");
  assert.ok(r.microsegundos > 0);
});
