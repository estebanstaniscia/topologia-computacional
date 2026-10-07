// Una topología no ve formas (sección I.1, pieza 3.8 de la spec).
//
// Panel 1: un abierto U con forma cualquiera y un punto x que el lector arrastra.
//   Alrededor de x caben un disco, un cuadrado y un rombo contenidos en U: es la
//   definición de topología generada por una base, verificándose en vivo. Contra el
//   borde (que no está en U) las tres formas se achican a cero.
// Panel 2: el anidamiento alternado disco ⊃ cuadrado ⊃ rombo ⊃ disco ⊃ …, con un
//   zoom infinito hacia el punto.
// Panel 3: la recta de Sorgenfrey. El lector mueve [a, b) y cambia de topología: en
//   a, el entorno básico usual (a − δ, a + δ) se sale; el de Sorgenfrey [a, a + δ) no.

import { svg, html, texto, lector, alCambiarTema, puntoSVG } from "./comun.js";

// ------------------------------------------------------------------ lógica pura

/** ¿Está p dentro del polígono (lista de vértices)? Regla del rayo. */
export function dentro([x, y], poli) {
  let c = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i], [xj, yj] = poli[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Distancia de p al borde del polígono. */
export function distanciaAlBorde([x, y], poli) {
  let d = Infinity;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [ax, ay] = poli[j], [bx, by] = poli[i];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    d = Math.min(d, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return d;
}

/**
 * Las tres formas básicas centradas en x dentro del disco de radio r (r = distancia
 * al borde): el disco de radio r, el cuadrado inscripto (semilado r/√2) y el rombo
 * inscripto en ese cuadrado (semidiagonal r/√2). Devuelve sus tamaños.
 */
export function formasBasicas(r) {
  return { disco: r, cuadrado: r / Math.SQRT2, rombo: r / Math.SQRT2 };
}

/** Vértices de un cuadrado / rombo centrado en c, para chequear que caen dentro de U. */
export function verticesCuadrado([cx, cy], s) {
  return [[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]];
}
export function verticesRombo([cx, cy], s) {
  return [[cx + s, cy], [cx, cy + s], [cx - s, cy], [cx, cy - s]];
}

/**
 * Recta real con la topología usual o la de Sorgenfrey: ¿el entorno básico de radio
 * δ alrededor de t queda dentro de [a, b)? Usual: (t − δ, t + δ). Sorgenfrey: [t, t + δ).
 */
export function entornoDentro(t, delta, a, b, topologia) {
  const izq = topologia === "usual" ? t - delta : t;
  return izq >= a && t + delta <= b;
}

/** ¿Es [a, b) abierto? En Sorgenfrey sí (es básico); en la usual no (falla en a). */
export const semiabiertoEsAbierto = (topologia) => topologia === "sorgenfrey";

/**
 * El complemento de [a, b) escrito como unión de semiabiertos [t, t + 1) de Sorgenfrey,
 * truncada a la ventana [lo, hi]: prueba de que [a, b) también es cerrado.
 */
export function cubrimientoComplemento(a, b, lo, hi) {
  const piezas = [];
  for (let t = a - 1; t > lo - 1; t -= 1) piezas.push([Math.max(t, lo), Math.min(t + 1, a)]);
  for (let t = b; t < hi; t += 1) piezas.push([t, Math.min(t + 1, hi)]);
  return piezas;
}

// ------------------------------------------------------------------ panel 1

const MANCHA = (() => {
  // una mancha suave, sin forma reconocible
  const pts = [];
  for (let k = 0; k < 64; k++) {
    const t = (2 * Math.PI * k) / 64;
    const r = 112 + 26 * Math.sin(3 * t + 0.4) + 14 * Math.cos(5 * t) + 9 * Math.sin(2 * t - 1);
    pts.push([200 + 1.25 * r * Math.cos(t), 150 + 0.95 * r * Math.sin(t)]);
  }
  return pts;
})();

function panelAbierto() {
  const raiz = html("div", { class: "tc-panel" });
  const tk = lector(raiz);
  const lienzo = svg("svg", { viewBox: "0 0 400 300", role: "img", "aria-label": "Un abierto con forma de mancha y un punto x arrastrable; alrededor de x, un disco, un cuadrado y un rombo contenidos en la mancha." });
  const estado = html("div", { class: "tc-pista", "aria-live": "polite" });
  const bases = { disco: true, cuadrado: true, rombo: true };
  const botones = Object.keys(bases).map((k) => html("button", { "aria-pressed": "true", "data-base": k }, k));
  raiz.append(html("h4", {}, "Un abierto U con forma cualquiera · arrastrá x"),
    html("div", { class: "tc-controles" }, html("span", { class: "tc-pista", style: "margin:0" }, "Bases:"), ...botones), lienzo, estado);
  let x = [235, 170];
  let arrastrando = false;

  function dibujar() {
    lienzo.replaceChildren();
    const d = MANCHA.map((p) => p.join(",")).join(" ");
    svg("polygon", { points: d, fill: tk("--tc-mojado-suave"), stroke: tk("--tc-mojado"), "stroke-width": 2, "stroke-dasharray": "6 4" }, lienzo);
    texto(lienzo, 50, 40, "U", { "font-size": 18, "font-weight": 700, fill: tk("--tc-mojado") });
    const adentro = dentro(x, MANCHA);
    const r = adentro ? distanciaAlBorde(x, MANCHA) * 0.97 : 0;
    const f = formasBasicas(r);
    if (adentro && r > 0.5) {
      if (bases.disco) svg("circle", { cx: x[0], cy: x[1], r: f.disco, fill: "none", stroke: tk("--tc-acento"), "stroke-width": 2.2 }, lienzo);
      if (bases.cuadrado) svg("polygon", { points: verticesCuadrado(x, f.cuadrado).map((p) => p.join(",")).join(" "), fill: "none", stroke: tk("--tc-seco"), "stroke-width": 2.2 }, lienzo);
      if (bases.rombo) svg("polygon", { points: verticesRombo(x, f.rombo).map((p) => p.join(",")).join(" "), fill: "none", stroke: tk("--tc-enlace"), "stroke-width": 2.2 }, lienzo);
    }
    const g = svg("g", { style: "cursor:grab" }, lienzo);
    svg("circle", { cx: x[0], cy: x[1], r: 7, fill: adentro ? tk("--tc-tinta") : tk("--tc-rechazo"), stroke: tk("--tc-panel"), "stroke-width": 2 }, g);
    texto(g, x[0] + 10, x[1] - 9, "x", { "font-size": 15, "font-weight": 700, fill: tk("--tc-tinta") });
    g.addEventListener("pointerdown", (e) => { arrastrando = true; lienzo.setPointerCapture?.(e.pointerId); });
    const activas = Object.keys(bases).filter((k) => bases[k]);
    estado.textContent = !adentro
      ? "x está fuera de U: ningún abierto básico centrado en x cabe en U (ni hace falta)."
      : r < 4
        ? "Pegado al borde: las formas se achican tanto como haga falta, pero siempre hay alguna. El borde mismo no está en U (por eso está punteado)."
        : `x tiene margen r = ${(r / 100).toFixed(2)}: ${activas.length ? activas.map((k) => `un ${k}`).join(", ") : "cualquier forma"} centrado en x cabe en U. Con cualquiera de las tres bases, U es abierto: la topología no ve la forma.`;
  }
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastrando) return;
    x = puntoSVG(lienzo, e);
    dibujar();
  });
  lienzo.addEventListener("pointerup", () => { arrastrando = false; });
  botones.forEach((b) => b.addEventListener("click", () => {
    bases[b.dataset.base] = !bases[b.dataset.base];
    b.setAttribute("aria-pressed", String(bases[b.dataset.base]));
    dibujar();
  }));
  alCambiarTema(dibujar);
  dibujar();
  return raiz;
}

// ------------------------------------------------------------------ panel 2

function panelAnidamiento() {
  const raiz = html("div", { class: "tc-panel" });
  const tk = lector(raiz);
  const lienzo = svg("svg", { viewBox: "0 0 400 300", role: "img", "aria-label": "Zoom infinito hacia un punto: discos, cuadrados y rombos alternados, cada uno dentro del anterior." });
  const bPlay = html("button", { class: "tc-primario" }, "Zoom hacia el punto");
  raiz.append(html("h4", {}, "Anidamiento alternado · zoom infinito"), html("div", { class: "tc-controles" }, bPlay), lienzo,
    html("div", { class: "tc-pista" }, "Cada forma contiene a la siguiente. Por eso «tener un disco alrededor» y «tener un cuadrado alrededor» son la misma condición: generan los mismos abiertos."));
  let fase = 0; // log en base √2 de la escala
  let reloj = null;
  const c = [200, 150];

  function dibujar() {
    lienzo.replaceChildren();
    const colores = [tk("--tc-acento"), tk("--tc-seco"), tk("--tc-enlace")];
    // el patrón se repite cada tres formas (factor (√2)³), así que basta dibujar la
    // escala módulo 3; el zoom real (que crece sin límite) va en el rótulo
    const escala = Math.SQRT2 ** (fase % 3);
    const zoomReal = Math.SQRT2 ** fase;
    // formas k = ..., cada una de tamaño 140·(1/√2)^k (en pantalla: × escala)
    for (let k = -4; k < 40; k++) {
      const tam = 140 * Math.SQRT1_2 ** k * escala;
      if (tam > 420 || tam < 1.2) continue;
      const tipo = ((k % 3) + 3) % 3;
      const color = colores[tipo];
      if (tipo === 0) svg("circle", { cx: c[0], cy: c[1], r: tam, fill: "none", stroke: color, "stroke-width": 2 }, lienzo);
      else if (tipo === 1) svg("polygon", { points: verticesCuadrado(c, tam).map((p) => p.join(",")).join(" "), fill: "none", stroke: color, "stroke-width": 2 }, lienzo);
      else svg("polygon", { points: verticesRombo(c, tam).map((p) => p.join(",")).join(" "), fill: "none", stroke: color, "stroke-width": 2 }, lienzo);
    }
    svg("circle", { cx: c[0], cy: c[1], r: 3, fill: tk("--tc-tinta") }, lienzo);
    texto(lienzo, 390, 290, `zoom ×${zoomReal < 1000 ? zoomReal.toFixed(1) : zoomReal.toExponential(1)}`, { "text-anchor": "end", "font-size": 12, fill: tk("--tc-tenue") });
  }
  bPlay.addEventListener("click", () => {
    if (reloj) { clearInterval(reloj); reloj = null; bPlay.textContent = "Zoom hacia el punto"; return; }
    bPlay.textContent = "Pausa";
    reloj = setInterval(() => { fase += 0.04; dibujar(); }, 40);
  });
  alCambiarTema(dibujar);
  dibujar();
  return raiz;
}

// ------------------------------------------------------------------ panel 3

function panelSorgenfrey() {
  const raiz = html("div", { class: "tc-panel" });
  const tk = lector(raiz);
  const W = 640, H = 170, LO = -3, HI = 4;
  const sx = (t) => 30 + ((t - LO) / (HI - LO)) * (W - 60);
  const ix = (px) => LO + ((px - 30) / (W - 60)) * (HI - LO);
  const lienzo = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "La recta real con el intervalo [a, b); arrastrá a y b. Se muestra el entorno básico de a en la topología elegida y el complemento cubierto por semiabiertos." });
  const bUsual = html("button", { "aria-pressed": "false" }, "Topología usual: (a − δ, a + δ)");
  const bSorg = html("button", { "aria-pressed": "true" }, "Sorgenfrey: [a, a + δ)");
  const estado = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  raiz.append(html("h4", {}, "La recta de Sorgenfrey · arrastrá a y b"), html("div", { class: "tc-controles" }, bUsual, bSorg), lienzo, estado);
  let a = 0, b = 1.6, top = "sorgenfrey", arrastre = null;
  const delta = 0.35;

  function dibujar() {
    bUsual.setAttribute("aria-pressed", String(top === "usual"));
    bSorg.setAttribute("aria-pressed", String(top === "sorgenfrey"));
    lienzo.replaceChildren();
    const y = 70;
    svg("line", { x1: sx(LO), y1: y, x2: sx(HI), y2: y, stroke: tk("--tc-linea"), "stroke-width": 2 }, lienzo);
    for (let t = LO; t <= HI; t++) texto(lienzo, sx(t), y + 40, String(t), { "text-anchor": "middle", "font-size": 11, fill: tk("--tc-tenue") });
    // [a, b)
    svg("line", { x1: sx(a), y1: y, x2: sx(b), y2: y, stroke: tk("--tc-acento"), "stroke-width": 7 }, lienzo);
    svg("circle", { cx: sx(a), cy: y, r: 6, fill: tk("--tc-acento") }, lienzo);
    svg("circle", { cx: sx(b), cy: y, r: 6, fill: tk("--tc-panel"), stroke: tk("--tc-acento"), "stroke-width": 2.5 }, lienzo);
    // complemento cubierto por semiabiertos (solo en Sorgenfrey)
    if (top === "sorgenfrey") {
      cubrimientoComplemento(a, b, LO, HI).forEach(([p, q], k) => {
        const yy = y - 18 - (k % 2) * 7;
        svg("line", { x1: sx(p) + 2, y1: yy, x2: sx(q) - 2, y2: yy, stroke: tk("--tc-seco"), "stroke-width": 3 }, lienzo);
        svg("circle", { cx: sx(p) + 2, cy: yy, r: 3.2, fill: tk("--tc-seco") }, lienzo);
      });
    }
    // entorno básico de a
    const izq = top === "usual" ? a - delta : a;
    const ok = entornoDentro(a, delta, a, b, top);
    const ye = y + 20;
    svg("line", { x1: sx(izq), y1: ye, x2: sx(a + delta), y2: ye, stroke: ok ? tk("--tc-enlace") : tk("--tc-rechazo"), "stroke-width": 4 }, lienzo);
    if (top === "usual") svg("line", { x1: sx(izq), y1: ye, x2: sx(a), y2: ye, stroke: tk("--tc-rechazo"), "stroke-width": 4, "stroke-dasharray": "4 3" }, lienzo);
    texto(lienzo, sx(a + delta) + 8, ye + 4, ok ? "entorno básico de a: cabe en [a, b)" : "entorno básico de a: se sale de [a, b)", { "font-size": 12, fill: ok ? tk("--tc-enlace") : tk("--tc-rechazo") });
    texto(lienzo, sx(a), y - 34, "a", { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: tk("--tc-tinta") });
    texto(lienzo, sx(b), y - 34, "b", { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: tk("--tc-tinta") });
    // asas de arrastre
    for (const [cual, t] of [["a", a], ["b", b]]) {
      const asa = svg("rect", { x: sx(t) - 9, y: y - 50, width: 18, height: 64, fill: "transparent", style: "cursor:ew-resize" }, lienzo);
      asa.addEventListener("pointerdown", (e) => { arrastre = cual; lienzo.setPointerCapture?.(e.pointerId); });
    }
    estado.className = "tc-veredicto " + (top === "sorgenfrey" ? "si" : "no");
    estado.innerHTML = top === "sorgenfrey"
      ? `<b>En Sorgenfrey, [a, b) es abierto</b> (es un básico: en a cabe [a, a + δ)) <b>y también cerrado</b>: su complemento es la unión de los semiabiertos naranjas. ` +
        `Un clopen no trivial: la recta de Sorgenfrey no es conexa. El conjunto es el mismo ℝ; cambió la topología.`
      : `<b>Con la topología usual, [a, b) no es abierto:</b> todo intervalo (a − δ, a + δ) se sale por la izquierda (en rojo), y el punto a no tiene margen. ` +
        `Por eso ℝ usual sí es conexo.`;
  }
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const t = Math.round(ix(puntoSVG(lienzo, e)[0]) * 20) / 20;
    if (arrastre === "a") a = Math.max(LO + 0.2, Math.min(t, b - 0.2));
    else b = Math.min(HI - 0.2, Math.max(t, a + 0.2));
    dibujar();
  });
  lienzo.addEventListener("pointerup", () => { arrastre = null; });
  bUsual.addEventListener("click", () => { top = "usual"; dibujar(); });
  bSorg.addEventListener("click", () => { top = "sorgenfrey"; dibujar(); });
  alCambiarTema(dibujar);
  dibujar();
  return raiz;
}

// ------------------------------------------------------------------ la pieza

export function topologiaFormas() {
  const raiz = html("div", { class: "tc-pieza" });
  raiz.append(
    html("div", { class: "tc-titulo" }, "Una topología no ve formas", html("small", {}, "solo cercanía")),
    html("div", { class: "tc-grilla" }, panelAbierto(), panelAnidamiento(), html("div", { class: "tc-ancho" }, panelSorgenfrey())),
  );
  return raiz;
}
