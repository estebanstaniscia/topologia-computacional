// Tests de la lógica de "La ola y la tijera": node --test 'tests/js/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { ola, certificar, cruzan, cicloFundamental, corteFundamental, ESCENARIOS_OLA } from "../../assets/js/ola_tijera.js";
import { aleatorio } from "../../assets/js/comun.js";

const clave = ([u, v]) => (u < v ? `${u}-${v}` : `${v}-${u}`);

function grafoAleatorio(rnd, n, p) {
  const ar = [];
  for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (rnd() < p) ar.push([u, v]);
  return ar;
}

function esArbolGenerador(n, aristas, arbol) {
  const E = new Set(aristas.map(clave));
  if (arbol.length !== n - 1 || !arbol.every((a) => E.has(clave(a)))) return false;
  return ola(n, arbol).frentes.flat().length === n;
}

test("frentes del ciclo C6 (igual que tcomp.conexidad)", () => {
  const ar = [0, 1, 2, 3, 4, 5].map((i) => [i, (i + 1) % 6]);
  assert.deepEqual(ola(6, ar).frentes, [[0], [1, 5], [2, 4], [3]]);
});

test("escenarios: dos islas es desconexo sin aristas cruzadas; los otros son conexos", () => {
  const islas = ESCENARIOS_OLA.islas;
  const c = certificar(islas.puntos.length, islas.aristas);
  assert.equal(c.conexo, false);
  assert.deepEqual(c.U, [0, 1, 2, 3, 4]);
  assert.equal(cruzan(islas.aristas, c.U).length, 0);
  for (const k of ["puente", "rejilla"]) {
    const e = ESCENARIOS_OLA[k];
    const r = certificar(e.puntos.length, e.aristas);
    assert.ok(r.conexo && esArbolGenerador(e.puntos.length, e.aristas, r.arbol));
  }
});

test("todo veredicto viene con un testigo verificable (400 grafos)", () => {
  const rnd = aleatorio(11);
  for (let t = 0; t < 400; t++) {
    const n = 1 + Math.floor(rnd() * 18);
    const aristas = grafoAleatorio(rnd, n, rnd() * 0.4);
    const origen = Math.floor(rnd() * n);
    const c = certificar(n, aristas, origen);
    if (c.conexo) assert.ok(esArbolGenerador(n, aristas, c.arbol));
    else {
      assert.ok(c.U.length > 0 && c.W.length > 0 && c.U.length + c.W.length === n);
      assert.ok(c.U.includes(origen));
      assert.equal(cruzan(aristas, c.U).length, 0);
    }
  }
});

test("ciclo fundamental: simple, cerrado por la arista nueva; corte fundamental: separa el árbol", () => {
  const rnd = aleatorio(5);
  for (let t = 0; t < 200; t++) {
    const n = 3 + Math.floor(rnd() * 12);
    const aristas = grafoAleatorio(rnd, n, 0.5);
    const c = certificar(n, aristas);
    if (!c.conexo) continue;
    const enArbol = new Set(c.arbol.map(clave));
    const E = new Set(aristas.map(clave));
    for (const a of aristas) {
      if (enArbol.has(clave(a))) {
        const [U, W] = corteFundamental(n, c.arbol, a);
        const resto = c.arbol.filter((b) => clave(b) !== clave(a));
        assert.equal(U.length + W.length, n);
        assert.equal(cruzan(resto, U).length, 0); // separación del árbol sin a
        assert.deepEqual(cruzan(c.arbol, U).map(clave), [clave(a)]); // a era el único puente
      } else {
        const ciclo = cicloFundamental(n, c.arbol, a);
        assert.equal(ciclo[0], a[0]);
        assert.equal(ciclo.at(-1), a[0]);
        assert.equal(ciclo.at(-2), a[1]);
        assert.equal(new Set(ciclo.slice(0, -1)).size, ciclo.length - 1);
        for (let i = 0; i + 1 < ciclo.length; i++) assert.ok(E.has(clave([ciclo[i], ciclo[i + 1]])));
      }
    }
  }
});
