// G7 · Microscopio de perturbaciones (sección I.2, estación 3; spec §5, G7).
//
// Configuraciones degeneradas del algoritmo de paridad, vistas en tres niveles de zoom:
// sin perturbar (¿cuenta 0, 1 o 2?), a escala ε₂ (x' apenas ARRIBA de x) y a escala ε₁
// (x' apenas a la DERECHA). En cada nivel, la decisión de doesCross para cada arista y el
// conteo final. La perturbación es simbólica (comparaciones exactas, assets/js/curvas.js);
// los tests verifican que coincide con mover el punto un poquito de verdad.

import { svg, html, texto, lector, alCambiarTema } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";
import { aristas, orient, orientPerturbado, cruces, sobreElPoligono } from "./curvas.js";

// ------------------------------------------------------------------ lógica pura

/** Estado de una arista frente al rayo SIN perturbar. */
export function estadoSinPerturbar(x, a, b) {
  const [lo, hi] = a[1] <= b[1] ? [a, b] : [b, a];
  if (orient(x, a, b) === 0 && Math.min(a[0], b[0]) <= x[0] && x[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= x[1] && x[1] <= Math.max(a[1], b[1])) return "x está sobre la arista";
  if (a[1] === b[1] && a[1] === x[1]) return a[0] > x[0] || b[0] > x[0] ? "el rayo contiene la arista" : "no cruza";
  if (x[1] < lo[1] || x[1] > hi[1]) return "no cruza";
  if (x[1] === lo[1] || x[1] === hi[1]) {
    const v = x[1] === lo[1] ? lo : hi;
    return v[0] > x[0] ? "el rayo pasa por un vértice" : "no cruza";
  }
  return orient(x, lo, hi) > 0 ? "cruza" : "no cruza";
}

/** Decisión de doesCross con x' = x + (ε₁, ε₂): {cruza, motivo}. */
export function decisionPerturbada(x, a, b) {
  const [lo, hi] = a[1] <= b[1] ? [a, b] : [b, a];
  if (lo[1] === hi[1]) return { cruza: false, motivo: "horizontal: a₂ = b₂, nunca cruza" };
  if (!(lo[1] <= x[1] && x[1] < hi[1])) return { cruza: false, motivo: x[1] === hi[1] ? "x₂ + ε₂ queda arriba de la arista" : "fuera de la franja" };
  const d = orient(x, lo, hi), s = orientPerturbado(x, lo, hi);
  const nivel = d !== 0 ? "det" : hi[0] - lo[0] !== 0 ? "ε₂" : "ε₁";
  return { cruza: s > 0, motivo: `${lo[1] === x[1] ? "a₂ ≤ x₂ (el vértice queda abajo de x′); " : ""}signo decidido por ${nivel}: ${s > 0 ? "x′ a la izquierda" : "x′ a la derecha"}` };
}

export const CONFIGURACIONES = {
  pico: { nombre: "Rayo por un pico ∧", P: [[-6, -3], [2, 0], [8, -4], [8, 4], [-6, 4]], x: [-2, 0], nota: "Las dos aristas del vértice (2, 0) están ABAJO del rayo: con x′ apenas arriba, ninguna de las dos cruza." },
  valle: { nombre: "Rayo por un valle ∨", P: [[-6, -4], [8, -4], [8, 4], [2, 0], [-6, 4]], x: [-2, 0], nota: "Las dos aristas del vértice (2, 0) están ARRIBA del rayo: con x′ apenas arriba, las dos cruzan (la paridad no cambia)." },
  escalon: { nombre: "Rayo por un escalón", P: [[-6, -4], [8, -4], [4, -2], [2, 0], [4, 3], [8, 4], [-6, 4]], x: [-2, 0], nota: "Una arista del vértice (2, 0) baja y la otra sube: con x′ apenas arriba, cruza exactamente una." },
  horizontal: { nombre: "Arista horizontal sobre el rayo", P: [[-6, -4], [8, -4], [8, 0], [3, 0], [3, 4], [-6, 4]], x: [-2, 0], nota: "La arista (8, 0)-(3, 0) está sobre el rayo: con a₂ = b₂ nunca cruza. Las verticales que la tocan deciden por la regla a₂ ≤ x₂ < b₂." },
  sobre: { nombre: "x sobre una arista", P: [[-6, -4], [8, -4], [8, 4], [-6, 4]], x: [8, 1], nota: "x está sobre el borde: el libro decide según x′ (apenas a la derecha y arriba); nosotros lo reportamos aparte como «sobre»." },
};

// ------------------------------------------------------------------ dibujo

/** El punto donde el rayo es degenerado: el primer vértice sobre el rayo (o x, si está sobre el borde). */
export function puntoCritico(x, P) {
  if (sobreElPoligono(x, P)) return x;
  const sobreRayo = P.filter((v) => v[1] === x[1] && v[0] > x[0]).sort((u, v) => u[0] - v[0]);
  return sobreRayo[0] ?? x;
}

function panel(titulo, x, P, nivel, tk) {
  // nivel 0: vista completa; 1: escala ε₂ (x' apenas arriba); 2: escala ε₁ (x' apenas a la derecha)
  const W = 300, H = 220, cx = W / 2, cy = H / 2;
  const lienzo = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": titulo });
  let A;
  if (nivel === 0) {
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
    A = ([px, py]) => [cx + (px - mx) * 16, cy - (py - my) * 16];
  } else {
    const f = puntoCritico(x, P), esc = nivel === 1 ? 40 : 80;
    A = ([px, py]) => [cx + (px - f[0]) * esc, cy - (py - f[1]) * esc];
  }
  svg("rect", { x: 0, y: 0, width: W, height: H, fill: tk("--tc-panel") }, lienzo);
  svg("polygon", { points: P.map((p) => A(p).join(",")).join(" "), fill: tk("--tc-mojado-suave"), "fill-opacity": 0.5, stroke: tk("--tc-tinta"), "stroke-width": 2 }, lienzo);
  P.forEach((p) => { const q = A(p); svg("circle", { cx: q[0], cy: q[1], r: 3.5, fill: tk("--tc-tinta") }, lienzo); });
  const xq = A(x);
  svg("line", { x1: Math.max(-10, xq[0]), y1: xq[1], x2: W, y2: xq[1], stroke: tk("--tc-camino"), "stroke-width": nivel ? 1.5 : 2.5, "stroke-dasharray": nivel ? "4 4" : null }, lienzo);
  if (xq[0] > 0) {
    svg("circle", { cx: xq[0], cy: xq[1], r: 5, fill: tk("--tc-tinta") }, lienzo);
    texto(lienzo, xq[0] - 4, xq[1] + 18, "x", { "font-size": 14, "font-style": "italic", "font-weight": 700, "text-anchor": "end", fill: tk("--tc-tinta") });
  }
  if (nivel) {
    // x' = x + (ε₁, ε₂), con desplazamientos simbólicos visibles: ε₂ en los dos niveles,
    // ε₁ solo a escala ε₁ (en la otra escala es invisible: ε₁ ≪ ε₂)
    const e2 = 14, e1 = nivel === 2 ? 12 : 0;
    const yp = xq[1] - e2, x0 = Math.max(-10, xq[0] + e1);
    svg("line", { x1: x0, y1: yp, x2: W, y2: yp, stroke: tk("--tc-acento"), "stroke-width": 2.5 }, lienzo);
    if (xq[0] > 0) {
      svg("circle", { cx: xq[0] + e1, cy: yp, r: 5, fill: tk("--tc-acento") }, lienzo);
      texto(lienzo, xq[0] + e1 - 4, yp - 8, "x′", { "font-size": 14, "font-style": "italic", "font-weight": 700, "text-anchor": "end", fill: tk("--tc-acento") });
    } else {
      texto(lienzo, 8, yp - 6, "rayo de x′ →", { "font-size": 12, fill: tk("--tc-acento") });
      texto(lienzo, 8, xq[1] + 16, "rayo de x →", { "font-size": 12, fill: tk("--tc-camino") });
    }
    // dónde corta el rayo perturbado cada arista (en pantalla)
    for (const [a, b] of aristas(P)) {
      const [pa, pb] = [A(a), A(b)];
      if ((pa[1] - yp) * (pb[1] - yp) >= 0) continue;
      const t = (yp - pa[1]) / (pb[1] - pa[1]), cxp = pa[0] + t * (pb[0] - pa[0]);
      if (cxp > x0) svg("circle", { cx: cxp, cy: yp, r: 5.5, fill: "none", stroke: tk("--tc-acento"), "stroke-width": 2.5 }, lienzo);
    }
  }
  texto(lienzo, 10, 18, titulo, { "font-size": 13, "font-weight": 700, fill: tk("--tc-tinta") });
  return lienzo;
}

export function microscopio({ configuracion = "pico", id = "g7" } = {}) {
  let clave = configuracion;
  const sel = html("select", { "aria-label": "Configuración degenerada" }, ...Object.entries(CONFIGURACIONES).map(([k, c]) => html("option", { value: k, selected: k === clave }, c.nombre)));
  const paneles = html("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;padding:8px" });
  const tabla = html("div", { style: "overflow-x:auto;padding:0 8px" });
  const veredicto = html("div", { class: "tc-veredicto", style: "margin:8px", "aria-live": "polite" });
  const escena = html("div", {}, paneles, tabla, veredicto);
  const tk = lector(escena);

  function dibujar() {
    const { P, x, nota } = CONFIGURACIONES[clave];
    paneles.replaceChildren(panel("Sin perturbar", x, P, 0, tk), panel("Escala ε₂: x′ apenas arriba", x, P, 1, tk), panel("Escala ε₁: x′ apenas a la derecha", x, P, 2, tk));
    const filas = aristas(P).map(([a, b]) => {
      const sp = estadoSinPerturbar(x, a, b), dp = decisionPerturbada(x, a, b);
      const ambiguo = sp !== "cruza" && sp !== "no cruza";
      return html("tr", {}, html("td", {}, `(${a.join(", ")}) → (${b.join(", ")})`),
        html("td", { class: ambiguo ? "tc-cambio" : "" }, sp),
        html("td", {}, dp.cruza ? "✓ cruza" : "✗ no cruza"), html("td", { style: "text-align:left;font-size:0.8rem" }, dp.motivo));
    });
    tabla.replaceChildren(html("table", { class: "tc-tabla" },
      html("tr", {}, html("th", {}, "arista"), html("th", {}, "sin perturbar"), html("th", {}, "con x′"), html("th", {}, "por qué")), ...filas));
    const n = cruces(x, P), sobre = sobreElPoligono(x, P);
    veredicto.className = "tc-veredicto si";
    veredicto.innerHTML = `<b>Con x′: ${n} cruce${n === 1 ? "" : "s"} → ${n % 2 ? "adentro" : "afuera"}${sobre ? " (pero x está sobre el borde: el reporte honesto es «sobre»)" : ""}.</b> ${nota}`;
  }
  sel.addEventListener("change", () => { clave = sel.value; dibujar(); });

  const gadget = montarGadget({
    id,
    titulo: "Microscopio de perturbaciones",
    subtitulo: "los ε a la vista",
    escenario: escena,
    controles: sel,
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p>\\(x' = (x_1 + \\varepsilon_1, x_2 + \\varepsilon_2)\\) con \\(0 < \\varepsilon_1 \\ll \\varepsilon_2 \\ll\\) todo número del problema. Como el rayo de \\(x'\\) ya no pasa por ningún vértice ni contiene ninguna arista, no hay casos degenerados. Y no hace falta elegir números: \\(\\det\\Delta(x', a, b) = \\det\\Delta(x, a, b) + \\varepsilon_2(b_1 - a_1) + \\varepsilon_1(a_2 - b_2)\\), así que el signo es el del primer término no nulo.</p>" },
      { id: "prog", nombre: "Programador", contenido: () => "<p>Todo se reduce a comparaciones exactas, sin ningún número chico: \\(a_2 \\le x_2 < b_2\\) para la franja, y el signo del primer término no nulo de \\((\\det, b_1 - a_1, a_2 - b_2)\\). Es <b>Simulation of Simplicity</b> (Edelsbrunner y Mücke, 1990). En los tests, la decisión simbólica coincide con mover el punto de verdad \\(10^{-7}\\) a la derecha y \\(10^{-4}\\) arriba.</p>" },
    ],
    reiniciar: () => { sel.value = configuracion; clave = configuracion; dibujar(); },
  });
  alCambiarTema(dibujar);
  dibujar();
  return gadget.raiz;
}
