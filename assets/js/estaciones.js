// Mapa de estaciones (arquitectura de página v2): tarjetas con miniaturas vivas, dibujadas
// con la misma lógica de los gadgets (assets/js/curvas.js), no con imágenes estáticas.

import { svg, html, lector, alCambiarTema } from "./comun.js";
import { CURVAS, aEnteros, rayo, triangular, arbolDual, antihorario, laberintoEspiral } from "./curvas.js";

const ruta = (P) => P.map((p, i) => (i ? "L" : "M") + `${p[0].toFixed(1)},${(-p[1]).toFixed(1)}`).join(" ") + "Z";

function encuadrar(lienzo, P, margen = 0.12) {
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const w = x1 - x0, h = y1 - y0, m = margen * Math.max(w, h);
  const W = Math.max(w + 2 * m, ((h + 2 * m) * 16) / 10);
  const H = (W * 10) / 16, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  lienzo.setAttribute("viewBox", `${cx - W / 2} ${-cy - H / 2} ${W} ${H}`);
  return W / 160; // grosor de línea a escala
}

const MINIATURAS = {
  1(l, tk) { // θ: el bisturí
    const P = Array.from({ length: 48 }, (_, k) => [100 * Math.cos((2 * Math.PI * k) / 48), 100 * Math.sin((2 * Math.PI * k) / 48)]);
    const e = encuadrar(l, P);
    svg("path", { d: ruta(P), fill: "none", stroke: tk("--tc-c1"), "stroke-width": 4 * e }, l);
    svg("line", { x1: -100, y1: 0, x2: 100, y2: 0, stroke: tk("--tc-c2"), "stroke-width": 4 * e }, l);
    svg("circle", { cx: -100, cy: 0, r: 7 * e, fill: tk("--tc-rechazo") }, l);
  },
  2(l, tk) { // el laberinto espiral: ¿adentro o afuera?
    const P = laberintoEspiral(3.2, 30, 120), e = encuadrar(l, P);
    svg("path", { d: ruta(P), fill: tk("--tc-mojado-suave"), stroke: tk("--tc-tinta"), "stroke-width": 1.6 * e }, l);
    svg("circle", { cx: 8, cy: -4, r: 6 * e, fill: tk("--tc-rechazo") }, l);
  },
  3(l, tk) { // el rayo de paridad sobre una flor
    const P = aEnteros(CURVAS.flor()), e = encuadrar(l, P), x = [10, 10];
    svg("path", { d: ruta(P), fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 1.6 * e }, l);
    svg("line", { x1: x[0], y1: -x[1], x2: 400, y2: -x[1], stroke: tk("--tc-camino"), "stroke-width": 2 * e }, l);
    for (const { punto, signo } of rayo(x, P).cruces) svg("circle", { cx: punto[0], cy: -punto[1], r: 6 * e, fill: signo > 0 ? tk("--tc-acento") : tk("--tc-seco") }, l);
  },
  4(l, tk) { // triangulación con su árbol dual
    const P = antihorario(Array.from({ length: 14 }, (_, k) => { const r = k % 2 ? 90 : 200, t = (Math.PI * k) / 7 + 0.05; return [Math.round(r * Math.cos(t)), Math.round(r * Math.sin(t))]; }));
    const e = encuadrar(l, P), { triangulos: T, diagonales: D } = triangular(P);
    svg("path", { d: ruta(P), fill: tk("--tc-mojado-suave"), stroke: tk("--tc-tinta"), "stroke-width": 2 * e }, l);
    for (const [i, j] of D) svg("line", { x1: P[i][0], y1: -P[i][1], x2: P[j][0], y2: -P[j][1], stroke: tk("--tc-compresion"), "stroke-width": 1.2 * e }, l);
    const c = (t) => [(P[t[0]][0] + P[t[1]][0] + P[t[2]][0]) / 3, -(P[t[0]][1] + P[t[1]][1] + P[t[2]][1]) / 3];
    for (const [s, t] of arbolDual(T)) { const a = c(T[s]), b = c(T[t]); svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: tk("--tc-compresion"), "stroke-width": 2.6 * e }, l); }
  },
  5(l, tk) { // el limaçon con W = 2 en el lazo
    const P = aEnteros(CURVAS.limacon()), e = encuadrar(l, P);
    svg("path", { d: ruta(P), fill: tk("--tc-acento"), "fill-opacity": 0.25, "fill-rule": "nonzero", stroke: tk("--tc-tinta"), "stroke-width": 1.8 * e }, l);
    svg("text", { x: -40, y: 12, "font-size": 30 * e, "font-weight": 700, "text-anchor": "middle", fill: tk("--tc-acento") }, l).textContent = "2";
    svg("text", { x: 110, y: 12, "font-size": 30 * e, "font-weight": 700, "text-anchor": "middle", fill: tk("--tc-acento") }, l).textContent = "1";
  },
};

export const ESTACIONES = [
  { k: 1, ancla: "#sec-e1", titulo: "1 · Caminos y curvas cerradas", sub: "homeomorfismo y el bisturí" },
  { k: 2, ancla: "#sec-e2", titulo: "2 · El teorema de Jordan", sub: "¿adentro o afuera?" },
  { k: 3, ancla: "#sec-e3", titulo: "3 · El algoritmo de paridad", sub: "un rayo y un determinante" },
  { k: 4, ancla: "#sec-e4", titulo: "4 · Triangulación", sub: "el árbol dual y la errata" },
  { k: 5, ancla: "#sec-e5", titulo: "5 · Número de vueltas", sub: "el faro y el tono de Shepard" },
];

export function mapaEstaciones() {
  const raiz = html("nav", { class: "tc-estaciones", "aria-label": "Estaciones de la sección" });
  const tk = lector(raiz);
  const dibujar = () => {
    raiz.replaceChildren(...ESTACIONES.map(({ k, ancla, titulo, sub }) => {
      const l = svg("svg", { role: "img", "aria-hidden": "true" });
      MINIATURAS[k](l, tk);
      return html("a", { class: "tc-estacion", href: ancla }, l, html("b", {}, titulo), html("span", {}, sub));
    }));
  };
  alCambiarTema(dibujar);
  dibujar();
  return raiz;
}
