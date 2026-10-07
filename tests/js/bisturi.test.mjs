// Tests de la lógica del Bisturí topológico: las firmas de la disección.
import { test } from "node:test";
import assert from "node:assert/strict";
import { construirEspacio, cortar, firma, comparar, ESPACIOS } from "../../assets/js/bisturi.js";

const esp = (k) => construirEspacio(ESPACIOS[k].polilineas);
const porC = (k) => Object.fromEntries([...firma(esp(k)).porC.entries()]);

test("las firmas de la tabla de la disección", () => {
  assert.deepEqual(porC("intervalo"), { 1: 2, 2: Infinity });
  assert.deepEqual(porC("circulo"), { 1: Infinity });
  assert.deepEqual(porC("ocho"), { 1: Infinity, 2: 1 });
  assert.deepEqual(porC("y"), { 1: 3, 2: Infinity, 3: 1 });
});

test("Y: 3 extremos con c = 1, el centro con c = 3, el resto c = 2", () => {
  const f = firma(esp("y"));
  const extremos = f.grupos.filter((g) => g.tipo === "extremo");
  assert.equal(extremos.length, 3);
  assert.ok(extremos.every((g) => g.c === 1));
  assert.ok(f.grupos.some((g) => g.tipo.startsWith("se juntan 3") && g.c === 3));
  assert.ok(f.grupos.filter((g) => g.cantidad === Infinity).every((g) => g.c === 2));
});

test("θ tiene la misma firma que el círculo; el invariante local los distingue", () => {
  const r = comparar(esp("circulo"), esp("theta"));
  assert.equal(r.igualFirma, true);
  assert.equal(r.igualLocal, false);
  assert.deepEqual(r.f2.local, [3, 3]);
});

test("intervalo vs. círculo: la firma los distingue (el argumento del libro)", () => {
  assert.equal(comparar(esp("intervalo"), esp("circulo")).igualFirma, false);
});

test("X: un punto con c = 4", () => {
  assert.ok(firma(esp("x")).grupos.some((g) => g.c === 4 && g.cantidad === 1));
});

test("cortar coincide con contar componentes por fuerza bruta (BFS) en todos los cortes", () => {
  for (const k of Object.keys(ESPACIOS)) {
    const e = esp(k), n = e.puntos.length;
    const bfs = (ok) => {
      const ady = Array.from({ length: n }, () => []);
      e.aristas.forEach(([a, b], i) => { if (ok(a, b, i)) { ady[a].push(b); ady[b].push(a); } });
      return ady;
    };
    const cuenta = (ady, fuera) => {
      const visto = new Set([fuera]); let c = 0;
      for (let s = 0; s < n; s++) {
        if (visto.has(s)) continue;
        c++; const pila = [s]; visto.add(s);
        while (pila.length) for (const v of ady[pila.pop()]) if (!visto.has(v)) { visto.add(v); pila.push(v); }
      }
      return c;
    };
    for (let v = 0; v < n; v++) assert.equal(cortar(e, { tipo: "vertice", v }).c, cuenta(bfs((a, b) => a !== v && b !== v), v));
    for (let i = 0; i < e.aristas.length; i++) assert.equal(cortar(e, { tipo: "arista", e: i }).c, cuenta(bfs((a, b, j) => j !== i), -1));
  }
});
