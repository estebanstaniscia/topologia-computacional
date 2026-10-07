// G3 · Proyector estereográfico (sección I.2, estación 1; spec §5, G3). Ejercicio 4.
//
// El círculo S¹, el polo norte N = (0, 1) y un punto p que el lector arrastra sobre el
// círculo. La recta que une N con p corta el eje horizontal en σ(p) = x / (1 − y): un
// homeomorfismo S¹ ∖ {N} → ℝ. Cuando p se acerca a N, σ(p) se va al infinito. En paralelo,
// la logística ℝ → (0, 1): los tres espacios S¹ ∖ {N}, ℝ y (0, 1) son el mismo.

import { svg, html, texto, lector, alCambiarTema, puntoSVG } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";

// ------------------------------------------------------------------ lógica pura

/** Proyección estereográfica desde N = (0, 1): S¹ ∖ {N} → ℝ. */
export const estereo = ([x, y]) => x / (1 - y);
/** Su inversa: ℝ → S¹ ∖ {N}. */
export const estereoInversa = (t) => [(2 * t) / (1 + t * t), (t * t - 1) / (t * t + 1)];
/** La logística: ℝ → (0, 1). */
export const logistica = (t) => 1 / (1 + Math.exp(-t));
/** (0, 1) → S¹ ∖ {N}, recorriendo el círculo desde N hasta N sin tocarlo. */
export const arco = (s) => [Math.cos(Math.PI / 2 + 2 * Math.PI * s), Math.sin(Math.PI / 2 + 2 * Math.PI * s)];

// ------------------------------------------------------------------ la pieza

export function proyectorEstereografico({ id = "g3" } = {}) {
  const W = 640, H = 315, R = 110, cx = 200, cy = 170, esc = R; // unidades: 1 = R píxeles
  const lienzo = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Círculo con el polo norte N, un punto p arrastrable y su proyección estereográfica sobre la recta; a la derecha, la logística" });
  const escena = html("div", {}, lienzo);
  const tk = lector(escena);
  let ang = -0.6; // ángulo de p
  let arrastre = false;

  const aS = ([x, y]) => [cx + x * esc, cy - y * esc];
  function dibujar() {
    lienzo.replaceChildren();
    const p = [Math.cos(ang), Math.sin(ang)], t = estereo(p);
    // el eje (la recta ℝ) y el círculo
    svg("line", { x1: 10, y1: cy, x2: 400, y2: cy, stroke: tk("--tc-linea"), "stroke-width": 2 }, lienzo);
    for (let k = -3; k <= 3; k++) {
      const q = aS([k, 0]);
      if (q[0] < 10 || q[0] > 400) continue;
      svg("line", { x1: q[0], y1: cy - 4, x2: q[0], y2: cy + 4, stroke: tk("--tc-tenue") }, lienzo);
      // ±1 caen sobre el círculo: se corren hacia afuera para que no los tape el trazo
      const dx = Math.abs(k) === 1 ? 9 * k : 0;
      texto(lienzo, q[0] + dx, cy + 18, String(k), { "text-anchor": k === 1 ? "start" : k === -1 ? "end" : "middle", "font-size": 11, fill: tk("--tc-tenue") });
    }
    svg("circle", { cx, cy, r: R, fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 2.5 }, lienzo);
    const N = aS([0, 1]), P = aS(p), T = aS([t, 0]);
    // la recta de N a σ(p), recortada a la vista
    const fin = Math.abs(t) * esc < 2000 ? T : aS([Math.sign(t) * 20, 0]);
    svg("line", { x1: N[0], y1: N[1], x2: fin[0], y2: fin[1], stroke: tk("--tc-camino"), "stroke-width": 2 }, lienzo);
    svg("circle", { cx: N[0], cy: N[1], r: 6, fill: tk("--tc-panel"), stroke: tk("--tc-rechazo"), "stroke-width": 2.5 }, lienzo);
    texto(lienzo, N[0] + 10, N[1] - 8, "N (sacado)", { "font-size": 13, "font-weight": 700, fill: tk("--tc-rechazo") });
    if (Math.abs(t) < 3.2) svg("circle", { cx: T[0], cy: T[1], r: 7, fill: tk("--tc-seco") }, lienzo);
    const g = svg("g", { style: "cursor:grab" }, lienzo);
    svg("circle", { cx: P[0], cy: P[1], r: 9, fill: tk("--tc-acento"), stroke: tk("--tc-panel"), "stroke-width": 2 }, g);
    texto(g, P[0] + 12, P[1] + 4, "p", { "font-size": 15, "font-style": "italic", "font-weight": 700, fill: tk("--tc-acento") });
    g.addEventListener("pointerdown", (e) => { arrastre = true; lienzo.setPointerCapture?.(e.pointerId); });
    texto(lienzo, 12, 24, `σ(p) = x / (1 − y) = ${Math.abs(t) > 1e4 ? (t > 0 ? "+∞ (casi)" : "−∞ (casi)") : t.toFixed(3)}`, { "font-size": 15, "font-weight": 700, fill: tk("--tc-seco") });
    // la logística a la derecha
    const gx = 430, gw = 190, gy = 60, gh = 220;
    const L = ([u, v]) => [gx + ((u + 6) / 12) * gw, gy + gh - v * gh];
    svg("rect", { x: gx, y: gy, width: gw, height: gh, fill: "none", stroke: tk("--tc-linea") }, lienzo);
    const pts = Array.from({ length: 121 }, (_, k) => { const u = -6 + (12 * k) / 120; return L([u, logistica(u)]).join(","); });
    svg("polyline", { points: pts.join(" "), fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 2 }, lienzo);
    for (const v of [0, 1]) svg("line", { x1: gx, y1: L([0, v])[1], x2: gx + gw, y2: L([0, v])[1], stroke: tk("--tc-tenue"), "stroke-dasharray": "3 3" }, lienzo);
    const tl = Math.max(-6, Math.min(6, t)), Q = L([tl, logistica(t)]);
    svg("circle", { cx: Q[0], cy: Q[1], r: 6, fill: tk("--tc-seco") }, lienzo);
    texto(lienzo, gx, gy - 10, `logística(σ(p)) = ${logistica(t).toFixed(4)} ∈ (0, 1)`, { "font-size": 13, fill: tk("--tc-tinta") });
    texto(lienzo, gx + gw / 2, gy + gh + 18, "ℝ → (0, 1)", { "font-size": 12, "text-anchor": "middle", fill: tk("--tc-tenue") });
  }
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const [mx, my] = puntoSVG(lienzo, e);
    ang = Math.atan2(-(my - cy), mx - cx);
    // no dejar llegar exactamente a N (π/2): ahí σ no está definida
    if (Math.abs(ang - Math.PI / 2) < 0.002) ang = Math.PI / 2 - 0.002 * Math.sign(ang - Math.PI / 2 || 1);
    dibujar();
  });
  lienzo.addEventListener("pointerup", () => { arrastre = false; });

  const gadget = montarGadget({
    id,
    titulo: "Proyector estereográfico",
    subtitulo: "S¹ ∖ {N}, ℝ y (0, 1) son el mismo espacio",
    escenario: escena,
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p><b>Ejercicio 4 ★.</b> \\(\\sigma(x, y) = \\frac{x}{1 - y}\\) es un homeomorfismo \\(S^1 \\setminus \\{N\\} \\to \\mathbb{R}\\), con inversa \\(t \\mapsto \\left(\\frac{2t}{1+t^2}, \\frac{t^2-1}{t^2+1}\\right)\\). La logística \\(t \\mapsto 1/(1 + e^{-t})\\) lleva \\(\\mathbb{R}\\) a \\((0, 1)\\). En dimensión 2, la misma proyección lleva la esfera menos un punto al plano: por eso Jordan vale en la esfera.</p>" },
      { id: "prog", nombre: "Programador", contenido: () => "<p>La logística es la misma función de la regresión logística y de las redes neuronales: comprime toda la recta real en el intervalo \\((0, 1)\\) sin romper nada (es continua, biyectiva y con inversa continua, la función <i>logit</i>). Topológicamente, una red que termina en una sigmoide no pierde información de forma.</p>" },
    ],
    reiniciar: () => { ang = -0.6; dibujar(); },
  });
  alCambiarTema(dibujar);
  dibujar();
  return gadget.raiz;
}
