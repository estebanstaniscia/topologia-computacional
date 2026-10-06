// Tests de la lógica del laboratorio de union-find: node --test tests/js/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { simular, altura, ESCENARIOS, opsAleatorias } from "../../assets/js/union_find_lab.js";

const sinCero = (arr) => arr.slice(1); // las piezas usan 1..n; el índice 0 no se usa

test("ejemplo 1: la tabla de la disección paso a paso (versión básica)", () => {
  const { n, ops } = ESCENARIOS.ej1;
  const e = simular(n, ops, "ingenua");
  assert.deepEqual(e.map((s) => sinCero(s.parent)), [
    [1, 2, 3, 4], [2, 2, 3, 4], [2, 3, 3, 4], [2, 3, 3, 4], [2, 3, 4, 4],
  ]);
  assert.equal(e[3].rechazo, true);
  assert.equal(e.at(-1).b0, 1);
  assert.equal(e.at(-1).b1, 1);
  assert.equal(altura(e.at(-1), n), 3);
});

test("ejemplo 2: tablas de los pasos 3 y 4, intercambio y compresión", () => {
  const { n, ops } = ESCENARIOS.ej2;
  const e = simular(n, ops, "completa");
  assert.deepEqual(sinCero(e[4].parent), [2, 4, 4, 4, 6, 6, 7, 8]);
  assert.deepEqual(sinCero(e[5].parent), [4, 4, 4, 4, 6, 4, 7, 8]);
  assert.equal(e[5].size[4], 6);
  assert.equal(e[5].intercambio, true);
  assert.deepEqual(e[5].enlace, [6, 4]);
  assert.deepEqual(e[5].comprimidos, [1]);
  assert.equal(sinCero(e[6].parent)[4], 4); // Find(5) comprime 5 -> 4
  assert.equal(altura(e[6], n), 1);
});

test("la simulación JS coincide con tcomp en 180 secuencias aleatorias", () => {
  const casos = JSON.parse(readFileSync(new URL("./fixtures/union_find.json", import.meta.url)));
  assert.equal(casos.length, 180);
  for (const c of casos) {
    const e = simular(c.n, c.ops, c.estrategia);
    c.fotos.forEach((f, k) => {
      const s = e[k + 1];
      assert.deepEqual(sinCero(s.parent), f.parent, `${c.estrategia} paso ${k + 1}`);
      assert.equal(s.b0, f.b0);
      assert.equal(s.b1, f.b1);
      assert.equal(s.saltos, f.saltos);
      for (let i = 1; i <= c.n; i++) if (s.parent[i] === i) assert.equal(s.size[i], f.size[i - 1]);
    });
  }
});

test("el color sigue a la componente: un color por raíz no unitaria, sin repetirse", () => {
  for (let semilla = 1; semilla <= 30; semilla++) {
    const e = simular(10, opsAleatorias(10, semilla), "completa");
    for (const s of e) {
      const colores = [];
      for (let r = 1; r <= 10; r++) {
        if (s.parent[r] !== r) continue;
        if (s.size[r] > 1) { assert.ok(s.color[r] > 0); colores.push(s.color[r]); }
        else assert.equal(s.color[r], 0);
      }
      assert.equal(new Set(colores).size, colores.length);
    }
  }
});

test("n - m = β₀ - β₁ en el escenario aleatorio", () => {
  for (let semilla = 1; semilla <= 20; semilla++) {
    const ops = opsAleatorias(10, semilla);
    const fin = simular(10, ops, "tamano").at(-1);
    assert.equal(10 - ops.length, fin.b0 - fin.b1);
  }
});
