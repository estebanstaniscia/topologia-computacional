// Tests del predicado exacto (BigInt) contra robust-predicates de Shewchuk.
import { test } from "node:test";
import assert from "node:assert/strict";
import { orient2d } from "robust-predicates";
import { orientExacto, aDiadico, mapaDeSignos, CONFIG_MICROSCOPIO } from "../../assets/js/area_signo.js";
import { aleatorio } from "../../assets/js/comun.js";

const shewchuk = (x, a, b) => -Math.sign(orient2d(x[0], x[1], a[0], a[1], b[0], b[1])) || 0;

test("aDiadico reconstruye el double exactamente", () => {
  for (const v of [0.5, -3.25, 1e-300, 5e-324, 2 ** 60, 0.1, -7]) {
    const [m, e] = aDiadico(v);
    assert.equal(Number(m) * 2 ** e, v);
  }
});

test("orientExacto coincide con orient2d en puntos casi alineados", () => {
  const rnd = aleatorio(8);
  for (let k = 0; k < 3000; k++) {
    const a = [rnd() * 100, rnd() * 100], b = [a[0] + rnd() * 50, a[1] + rnd() * 50];
    const t = rnd();
    // x casi sobre la recta ab, perturbado en unos pocos ulps
    const x = [a[0] + t * (b[0] - a[0]) + (rnd() - 0.5) * 1e-14, a[1] + t * (b[1] - a[1]) + (rnd() - 0.5) * 1e-14];
    assert.equal(orientExacto(x, a, b), shewchuk(x, a, b));
  }
});

test("el microscopio: el exacto es una recta limpia y coincide con Shewchuk; el ingenuo se equivoca", () => {
  const { base, a, b } = CONFIG_MICROSCOPIO;
  const m = mapaDeSignos(base, a, b, 32);
  assert.ok(m.errores > 0);
  for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) {
    const x = [base[0] + i * 2 ** -53, base[1] + j * 2 ** -53];
    assert.equal(m.exacto[j * 32 + i], shewchuk(x, a, b));
  }
});
