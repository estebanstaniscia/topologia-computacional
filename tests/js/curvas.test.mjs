// Tests del gemelo JS de tcomp.curvas: contra tcomp (fixtures), robust-predicates y earcut.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { orient2d } from "robust-predicates";
import earcut from "earcut";
import {
  orient, orientPerturbado, rayo, vueltasPorAngulos, paridad, triangular, arbolDual, orejas,
  esDiagonal, diagonal, esSimple, autointersecciones, CONTRAEJEMPLO_LIBRO, tresColoreo, caminoDual,
  areaConSigno, laberintoEspiral, laberintoGrilla, copoDeKoch, CURVAS, aEnteros, remuestrear, antihorario,
} from "../../assets/js/curvas.js";
import { aleatorio } from "../../assets/js/comun.js";

const fx = JSON.parse(readFileSync(new URL("./fixtures/curvas.json", import.meta.url)));

test("orient tiene el signo de orient2d de Shewchuk (exacto)", () => {
  const rnd = aleatorio(4);
  for (let k = 0; k < 2000; k++) {
    const p = () => [Math.floor(rnd() * 2000) - 1000, Math.floor(rnd() * 2000) - 1000];
    const [x, a, b] = [p(), p(), p()];
    // orient2d(a, b, c) > 0 si a, b, c giran en sentido HORARIO (convención de Shewchuk)
    assert.equal(Math.sign(orient(x, a, b)), -Math.sign(orient2d(x[0], x[1], a[0], a[1], b[0], b[1])) || 0);
  }
});

test("el flotante ingenuo se equivoca donde robust-predicates no (motivo de G6)", () => {
  // puntos casi alineados con coordenadas grandes y no enteras
  const a = [0.5, 0.5], b = [12, 12], c = [24, 24];
  let errores = 0;
  for (let i = 0; i < 128; i++) for (let j = 0; j < 128; j++) {
    const x = [a[0] + i * 2 ** -53, a[1] + j * 2 ** -53];
    const ingenuo = Math.sign((b[0] - x[0]) * (c[1] - x[1]) - (b[1] - x[1]) * (c[0] - x[0]));
    const exacto = -Math.sign(orient2d(x[0], x[1], b[0], b[1], c[0], c[1]));
    if (ingenuo !== exacto) errores++;
  }
  assert.ok(errores > 0);
});

test("W y cruces coinciden con tcomp en curvas NO simples (40 curvas × 25 puntos)", () => {
  for (const { P, consultas } of fx.curvas) {
    for (const { x, w, n } of consultas) {
      const r = rayo(x, P);
      assert.equal(r.w, w);
      assert.equal(r.n, n);
      assert.equal(((r.n - r.w) % 2 + 2) % 2, 0); // paridad ≡ W (mod 2)
    }
  }
});

test("paridad y triangulación coinciden con tcomp en 60 polígonos simples", () => {
  for (const { P, triangulos, diagonales, paridad: par } of fx.simples) {
    for (const { x, r } of par) assert.equal(paridad(x, P), r);
    const T = triangular(P);
    assert.deepEqual(T.triangulos, triangulos);
    assert.deepEqual(T.diagonales, diagonales);
  }
});

test("la triangulación tiene la misma cantidad de triángulos y área que earcut", () => {
  for (const { P } of fx.simples) {
    const ref = earcut(P.flat());
    const T = triangular(P).triangulos;
    assert.equal(ref.length / 3, T.length);
    const area = (ts) => ts.reduce((s, t) => s + Math.abs(areaConSigno(t.map((i) => P[i]))), 0);
    const tri = []; for (let i = 0; i < ref.length; i += 3) tri.push([ref[i], ref[i + 1], ref[i + 2]]);
    assert.equal(area(tri), area(T));
  }
});

test("árbol dual, dos orejas, 3-coloreo y camino dual", () => {
  for (const { P } of fx.simples) {
    const { triangulos: T } = triangular(P);
    const arcos = arbolDual(T);
    assert.equal(arcos.length, T.length - 1);
    if (P.length >= 4) assert.ok(orejas(T, arcos).length >= 2);
    const color = tresColoreo(P.length, T);
    for (const t of T) assert.deepEqual(t.map((v) => color[v]).sort(), [0, 1, 2]);
    assert.ok(caminoDual(T, arcos, 0, T.length - 1));
  }
});

test("errata: la regla del libro falla en el contraejemplo; la corregida no", () => {
  const C = CONTRAEJEMPLO_LIBRO;
  const idx = [0, 1, 2, 3, 4];
  const [i, j] = diagonal(C, idx, "libro");
  assert.equal(esDiagonal(C, i, j), false);
  const [k, l] = diagonal(C, idx, "corregida");
  assert.equal(esDiagonal(C, k, l), true);
});

test("perturbación: rompe los empates como tcomp", () => {
  assert.equal(orientPerturbado([0, 0], [-1, 0], [1, 0]), 1);
  assert.equal(orientPerturbado([0, 0], [0, 1], [0, 2]), -1);
});

test("curvas de los escenarios: las simples son de Jordan; W del limaçon llega a 2", () => {
  const rnd = aleatorio(9);
  for (const P of [laberintoEspiral(), laberintoGrilla(6, 8, rnd), copoDeKoch(3), aEnteros(CURVAS.circulo())]) {
    assert.ok(esSimple(P), "debería ser simple");
    const Q = antihorario(P);
    assert.ok(areaConSigno(Q) > 0);
  }
  const L = aEnteros(CURVAS.limacon());
  assert.equal(rayo([-45, 0], L).w, 2);
  assert.equal(vueltasPorAngulos([-45, 0], L), 2);
  assert.ok(autointersecciones(aEnteros(CURVAS.ocho())).length >= 1);
});

test("remuestrear produce m puntos equiespaciados", () => {
  const R = remuestrear([[0, 0], [10, 0], [10, 10], [0, 10]], 40);
  assert.equal(R.length, 40);
  const d = R.map((p, i) => Math.hypot(R[(i + 1) % 40][0] - p[0], R[(i + 1) % 40][1] - p[1]));
  for (const x of d) assert.ok(Math.abs(x - 1) < 1e-9);
});

test("polígonos desenredados son simples, y se encuentran contraejemplos a la regla del libro", async () => {
  const { poligonoDesenredado, buscarContraejemplo, triangular: tri, esDiagonal: esD } = await import("../../assets/js/curvas.js");
  const rnd = aleatorio(21);
  for (let k = 0; k < 50; k++) assert.ok(esSimple(poligonoDesenredado(4 + (k % 15), rnd)));
  const c = buscarContraejemplo(aleatorio(5));
  assert.ok(c, "debería encontrar un contraejemplo");
  // y la regla corregida triangula ese mismo polígono sin problemas
  const T = tri(c.P);
  assert.equal(T.triangulos.length, c.P.length - 2);
  assert.ok(T.diagonales.every(([i, j]) => esD(c.P, i, j)));
});
