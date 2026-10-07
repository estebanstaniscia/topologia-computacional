// G6 · Área con signo (sección I.2, estación 3; spec §5, G6).
//
// El determinante Δ(x, a, b) del algoritmo de paridad es el doble del área con signo del
// triángulo x, a, b. Panel 1: tres puntos arrastrables y el triángulo coloreado por su
// signo. Panel 2, el microscopio de punto flotante: el signo del determinante en una
// grilla de puntos separados por 2⁻⁵³ junto a una recta, calculado con doubles (ruido) y
// con aritmética exacta (una recta limpia). El predicado exacto está hecho con BigInt
// (sin dependencias) y testeado contra robust-predicates (Shewchuk) en Node.

import { svg, html, texto, lector, alCambiarTema, puntoSVG } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";

// ------------------------------------------------------------------ lógica pura

/** Determinante en punto flotante, como lo escribiría cualquiera. */
export const orientIngenuo = (x, a, b) => (a[0] - x[0]) * (b[1] - x[1]) - (a[1] - x[1]) * (b[0] - x[0]);

/** Un double como racional diádico exacto: x = num · 2^exp (num BigInt). */
export function aDiadico(x) {
  if (x === 0) return [0n, 0];
  const vista = new DataView(new ArrayBuffer(8));
  vista.setFloat64(0, x);
  const hi = vista.getUint32(0), lo = vista.getUint32(4);
  const signo = hi >>> 31 ? -1n : 1n;
  const expBits = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let exp;
  if (expBits === 0) exp = -1074; // subnormal
  else { mant |= 1n << 52n; exp = expBits - 1075; }
  return [signo * mant, exp];
}

/** Signo EXACTO de det Δ(x, a, b) para coordenadas double cualesquiera. */
export function orientExacto(x, a, b) {
  const vals = [x[0], x[1], a[0], a[1], b[0], b[1]].map(aDiadico);
  const emin = Math.min(...vals.map(([, e]) => e));
  const [x0, x1, a0, a1, b0, b1] = vals.map(([m, e]) => m << BigInt(e - emin));
  const d = (a0 - x0) * (b1 - x1) - (a1 - x1) * (b0 - x0);
  return d > 0n ? 1 : d < 0n ? -1 : 0;
}

/**
 * El mapa de signos del microscopio: para x = base + (i, j)·paso, el signo del
 * determinante con a y b fijos, calculado de las dos maneras. Devuelve dos arreglos
 * n×n de −1/0/1 y la cantidad de discrepancias.
 */
export function mapaDeSignos(base, a, b, n = 64, paso = 2 ** -53) {
  const ingenuo = new Int8Array(n * n), exacto = new Int8Array(n * n);
  let errores = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = [base[0] + i * paso, base[1] + j * paso];
    const s1 = Math.sign(orientIngenuo(x, a, b)), s2 = orientExacto(x, a, b);
    ingenuo[j * n + i] = s1;
    exacto[j * n + i] = s2;
    if (s1 !== s2) errores++;
  }
  return { ingenuo, exacto, errores, n };
}

export const CONFIG_MICROSCOPIO = { base: [0.5, 0.5], a: [12, 12], b: [24, 24] };

// ------------------------------------------------------------------ panel 1: el triángulo

const W = 420, H = 320;

function panelTriangulo(alCambiar) {
  const lienzo = svg("svg", { viewBox: `${-W / 2} ${-H / 2} ${W} ${H}`, role: "img", "aria-label": "Tres puntos arrastrables x, a, b y el triángulo coloreado según el signo de su área" });
  const tk = lector(lienzo);
  const inicial = { x: [-120, -70], a: [110, -90], b: [20, 110] };
  const P = structuredClone(inicial);
  let arrastre = null;

  function dibujar() {
    lienzo.replaceChildren();
    for (let k = -4; k <= 4; k++) {
      svg("line", { x1: k * 50, y1: -H / 2, x2: k * 50, y2: H / 2, stroke: tk("--tc-linea-suave") }, lienzo);
      svg("line", { x1: -W / 2, y1: k * 50, x2: W / 2, y2: k * 50, stroke: tk("--tc-linea-suave") }, lienzo);
    }
    const d = orientIngenuo(P.x, P.a, P.b), s = Math.sign(d);
    const area = Math.abs(d) / 2, intensidad = Math.min(0.55, 0.12 + area / 40000);
    const pts = [P.x, P.a, P.b].map((p) => `${p[0]},${-p[1]}`).join(" ");
    svg("polygon", { points: pts, fill: s > 0 ? tk("--tc-acento") : s < 0 ? tk("--tc-seco") : "none", "fill-opacity": intensidad, stroke: s === 0 ? tk("--tc-rechazo") : tk("--tc-tinta"), "stroke-width": s === 0 ? 3 : 1.8 }, lienzo);
    // flecha de recorrido x → a → b
    for (const [p, q] of [[P.x, P.a], [P.a, P.b], [P.b, P.x]]) {
      const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], ang = Math.atan2(-(q[1] - p[1]), q[0] - p[0]);
      const t = svg("path", { d: "M-7,-5 L5,0 L-7,5", fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 2 }, lienzo);
      t.setAttribute("transform", `translate(${m[0]},${-m[1]}) rotate(${(ang * 180) / Math.PI})`);
    }
    for (const k of ["x", "a", "b"]) {
      const p = P[k];
      const g = svg("g", { style: "cursor:grab" }, lienzo);
      svg("circle", { cx: p[0], cy: -p[1], r: 9, fill: tk("--tc-panel"), stroke: tk("--tc-tinta"), "stroke-width": 2.5 }, g);
      texto(g, p[0] + 12, -p[1] - 10, k, { "font-size": 16, "font-style": "italic", "font-weight": 700, fill: tk("--tc-tinta") });
      g.addEventListener("pointerdown", (e) => { arrastre = k; lienzo.setPointerCapture?.(e.pointerId); });
    }
    if (s === 0) texto(lienzo, 0, -H / 2 + 26, "¡alineados!  det = 0", { "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: tk("--tc-rechazo") });
    alCambiar(P, d);
  }
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const [mx, my] = puntoSVG(lienzo, e);
    // imán: si casi se alinean, alinear de verdad (para poder provocar det = 0)
    let p = [Math.round(mx), Math.round(-my)];
    const otros = ["x", "a", "b"].filter((k) => k !== arrastre).map((k) => P[k]);
    const [u, v] = otros, dx = v[0] - u[0], dy = v[1] - u[1], L2 = dx * dx + dy * dy;
    if (L2 > 0) {
      const t = ((p[0] - u[0]) * dx + (p[1] - u[1]) * dy) / L2, q = [u[0] + t * dx, u[1] + t * dy];
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 6) p = q;
    }
    P[arrastre] = p;
    dibujar();
  });
  lienzo.addEventListener("pointerup", () => { arrastre = null; });
  return { lienzo, dibujar, reiniciar: () => { Object.assign(P, structuredClone(inicial)); dibujar(); }, puntos: P };
}

// ------------------------------------------------------------------ panel 2: microscopio

function panelMicroscopio() {
  const n = 64, escala = 3;
  const { base, a, b } = CONFIG_MICROSCOPIO;
  const mapa = mapaDeSignos(base, a, b, n);
  const lienzoI = html("canvas", { width: n, height: n, style: `width:${n * escala}px;height:${n * escala}px;image-rendering:pixelated;border-radius:6px`, role: "img", "aria-label": "Signo del determinante con aritmética de punto flotante: un patrón ruidoso" });
  const lienzoE = html("canvas", { width: n, height: n, style: `width:${n * escala}px;height:${n * escala}px;image-rendering:pixelated;border-radius:6px`, role: "img", "aria-label": "Signo del determinante con aritmética exacta: una recta limpia" });
  const raiz = html("div", { class: "tc-g-tarjeta" },
    html("h4", {}, "Microscopio de punto flotante"),
    html("div", { style: "display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start" },
      html("figure", { style: "margin:0" }, lienzoI, html("figcaption", { class: "tc-pista" }, "doubles: ruido")),
      html("figure", { style: "margin:0" }, lienzoE, html("figcaption", { class: "tc-pista" }, "exacto: una recta"))),
    html("p", { class: "tc-pista", style: "margin:6px 0 0" },
      `x recorre una grilla de ${n} × ${n} puntos separados por 2⁻⁵³ cerca de (0.5, 0.5); a = (12, 12), b = (24, 24). Azul: giro a izquierda; naranja: a derecha; amarillo: alineados. En ${mapa.errores} de ${n * n} puntos el cálculo con doubles da un signo equivocado.`));
  const pintar = () => {
    const tk = lector(raiz);
    const hex = (c) => { const m = c.replace("#", ""); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
    const col = { 1: hex(tk("--tc-acento")), [-1]: hex(tk("--tc-seco")), 0: hex(tk("--tc-camino")) };
    for (const [lz, arr] of [[lienzoI, mapa.ingenuo], [lienzoE, mapa.exacto]]) {
      const ctx = lz.getContext("2d"), img = ctx.createImageData(n, n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const c = col[arr[j * n + i]], q = ((n - 1 - j) * n + i) * 4; // y hacia arriba
        img.data.set([c[0], c[1], c[2], 255], q);
      }
      ctx.putImageData(img, 0, 0);
    }
  };
  return { raiz, pintar, errores: mapa.errores };
}

// ------------------------------------------------------------------ la pieza

export function areaConSigno({ id = "g6" } = {}) {
  const vDet = html("b", {}, "0"), vArea = html("b"), vSentido = html("b");
  const tarjeta = html("div", { class: "tc-g-tarjeta" }, html("h4", {}, "det Δ(x, a, b)"),
    html("div", { class: "tc-g-grande" }, vDet),
    html("div", { class: "tc-g-filas", style: "margin-top:6px" }, html("span", {}, "Área del triángulo"), vArea, html("span", {}, "Recorrido x → a → b"), vSentido));
  let gadget = null;
  const tri = panelTriangulo((_, d) => {
    vDet.textContent = String(d);
    vArea.textContent = `|det| / 2 = ${Math.abs(d) / 2}`;
    vSentido.textContent = d > 0 ? "antihorario (giro a izquierda)" : d < 0 ? "horario (giro a derecha)" : "alineados";
    vSentido.className = d === 0 ? "tc-g-mal" : "";
    gadget?.refrescarLentes();
  });
  const micro = panelMicroscopio();
  const escena = html("div", {}, tri.lienzo);
  const lecturas = html("div", { style: "display:contents" }, tarjeta, micro.raiz);

  gadget = montarGadget({
    id,
    titulo: "Área con signo",
    subtitulo: "el determinante del algoritmo de paridad, como área",
    escenario: escena,
    lecturas,
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => {
        const { x, a, b } = tri.puntos;
        return `<p>Restando la primera fila a las otras, \\(\\det \\Delta(x, a, b) = (a_1 - x_1)(b_2 - x_2) - (a_2 - x_2)(b_1 - x_1)\\): el producto vectorial de \\(a - x\\) y \\(b - x\\), el área con signo del paralelogramo, es decir, <b>el doble del área con signo del triángulo</b>.</p><p>Acá: \\((${a[0] - x[0]})(${b[1] - x[1]}) - (${a[1] - x[1]})(${b[0] - x[0]}) = ${orientIngenuo(x, a, b)}\\). El argumento del libro («vale en \\((0,0), (1,0), (0,1)\\) y el signo solo cambia al alinearse») es de <b>continuidad</b>: arrastrá un punto a través de la recta de los otros dos.</p>`;
      } },
      { id: "prog", nombre: "Programador", contenido: () => `<p>Un determinante 2×2 cuesta dos productos y una resta. El enemigo es la <b>aritmética de punto flotante</b>: con doubles, el signo de un determinante casi nulo puede salir mal (mirá el microscopio: ${micro.errores} errores). Soluciones: <b>predicados exactos</b> (Shewchuk, <code>robust-predicates</code>) o aritmética entera. Este sitio usa un predicado exacto propio con <code>BigInt</code> (cada double es un racional \\(m \\cdot 2^e\\)), testeado contra el de Shewchuk.</p>` },
      { id: "geo", nombre: "Geómetra", contenido: () => "<p>El signo dice de qué lado de la recta orientada \\(a \\to b\\) queda \\(x\\): positivo, a la izquierda. Es la pregunta elemental de toda la geometría computacional; el algoritmo de paridad, la triangulación y el número de vueltas se arman con ella.</p>" },
    ],
    reiniciar: () => tri.reiniciar(),
    queVeo: () => [{ elemento: tri.lienzo.querySelector("polygon"), texto: "azul: antihorario · naranja: horario" }, { elemento: micro.raiz.querySelector("canvas"), texto: "el mismo cálculo con doubles" }],
  });
  alCambiarTema(() => { tri.dibujar(); micro.pintar(); });
  tri.dibujar();
  micro.pintar();
  return gadget.raiz;
}
