// G1 · Lienzo de Jordan: el gadget estrella de la sección I.2 (spec §5, G1).
//
// Dibujás una curva cerrada (o elegís una), movés el punto x, y todo se recalcula:
// el campo W (el número de vueltas en cada región), el rayo de paridad con sus cruces
// ±, la orientación, las autointersecciones y, si la curva es simple, la triangulación
// con su árbol dual y sus orejas. El faro recorre la curva y un dial acumula las vueltas;
// el sonido las convierte en un tono de Shepard. La lógica es la de assets/js/curvas.js
// (gemelo de tcomp.curvas, testeado en Node).

import { svg, html, texto, lector, alCambiarTema } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";
import {
  rayo, autointersecciones, esSimple, areaConSigno, triangular, arbolDual, orejas, aEnteros,
  remuestrear, CURVAS, sobreElPoligono, diagonal, esDiagonal,
} from "./curvas.js";

const W_ = 800, H_ = 560;
const aM = ([sx, sy]) => [sx - W_ / 2, H_ / 2 - sy];
const aS = ([mx, my]) => [mx + W_ / 2, H_ / 2 - my];

export const ESCENARIOS_G1 = {
  circulo: { nombre: "Círculo", x: [-60, 40] },
  ocho: { nombre: "Ocho (W = +1 y −1)", x: [-150, 20] },
  limacon: { nombre: "Limaçon (W = 2 en el lazo)", x: [-45, 0] },
  doble: { nombre: "Círculo recorrido dos veces", x: [20, 30] },
  flor: { nombre: "Flor con lazos", x: [10, 10] },
  espiral: { nombre: "Laberinto espiral", x: [0, 0] },
  errata: { nombre: "Errata del libro (p. 12)", x: [-330, 230], errata: true },
};

/** Curva (enteros) del escenario. */
export const curvaDe = (clave) => aEnteros(CURVAS[clave]());

let freehand = null; // perfect-freehand, por CDN (si no carga, se dibuja una poligonal)
import("https://cdn.jsdelivr.net/npm/perfect-freehand@1.2.3/+esm").then((m) => { freehand = m.getStroke; }).catch(() => {});

// ------------------------------------------------------------------ sonido (Web Audio)

function crearSonido() {
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx(), master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const osc = Array.from({ length: 7 }, () => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.connect(g); g.connect(master); o.start();
    return { o, g };
  });
  return {
    ctx, master,
    /** Tono de Shepard: una vuelta antihoraria = una octava «hacia arriba», para siempre. */
    tono(acumulado) {
      const frac = acumulado / (2 * Math.PI), t = ctx.currentTime;
      osc.forEach(({ o, g }, k) => {
        const x = (((k + frac) % 7) + 7) % 7;
        o.frequency.setTargetAtTime(55 * 2 ** x, t, 0.01);
        g.gain.setTargetAtTime(Math.exp(-((x - 3.5) ** 2) / 2) * 0.2, t, 0.01);
      });
    },
    clic(signo) {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.frequency.value = signo > 0 ? 1320 : 440;
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.13);
    },
    volumen(v) { master.gain.setTargetAtTime(v, ctx.currentTime, 0.05); },
  };
}

// ------------------------------------------------------------------ el gadget

export function lienzoJordan({ escenario = "ocho", id = "g1" } = {}) {
  let clave = escenario;
  let P = curvaDe(clave);
  let x = ESCENARIOS_G1[clave].x.slice();
  const capas = { campo: true, rayo: true, orientacion: true, triangulacion: false };
  let trazo = null, arrastrando = false, dibujar = false;
  let faro = null, sonido = null, sonidoActivo = false;
  let desafio = null; // {respuesta: null | número}
  let gadget = null; // la carcasa (se monta al final)

  // ---- escenario: canvas (campo) + svg (todo lo demás)
  const lienzoCampo = html("canvas", { "aria-hidden": "true", style: "position:absolute;inset:0;width:100%;height:100%" });
  const lienzo = svg("svg", { viewBox: `0 0 ${W_} ${H_}`, role: "img", style: "position:relative",
    "aria-label": "Curva cerrada, punto de consulta x, rayo de paridad y regiones coloreadas por número de vueltas" });
  const pista = html("div", { class: "tc-g-pista" }, "Arrastrá el punto x · ✎ para dibujar tu curva");
  const escena = html("div", { style: `position:relative;aspect-ratio:${W_}/${H_}` }, lienzoCampo, lienzo, pista);
  const tk = lector(escena);

  // ---- controles
  const selEsc = html("select", { "aria-label": "Curva de ejemplo" },
    html("option", { value: "" }, "Tu curva"),
    ...Object.entries(ESCENARIOS_G1).map(([k, e]) => html("option", { value: k, selected: k === clave }, e.nombre)));
  const bDibujar = html("button", { "aria-pressed": "false", title: "Dibujar una curva cerrada a mano alzada" }, "✎ Dibujar");
  const bInvertir = html("button", { title: "Invertir la orientación: W cambia de signo" }, "⇄ Invertir");
  const bCapa = (k, nombre) => {
    const b = html("button", { "aria-pressed": String(capas[k]) }, nombre);
    b.addEventListener("click", () => { capas[k] = !capas[k]; b.setAttribute("aria-pressed", String(capas[k])); if (k === "campo") pintarCampo(); dibujarTodo(); });
    return b;
  };
  const bFaro = html("button", { title: "Recorrer la curva y mirar el vector desde x" }, "◉ Faro");
  const bSonido = html("button", { "aria-pressed": "false", title: "Escuchar el ángulo como un tono de Shepard" }, "♪ Sonido");
  const controles = html("div", { style: "display:contents" }, selEsc, bDibujar, bInvertir, html("span", { class: "tc-g-sep" }),
    bCapa("campo", "Campo W"), bCapa("rayo", "Rayo"), bCapa("orientacion", "Orientación"), bCapa("triangulacion", "Triangulación"),
    html("span", { class: "tc-g-sep" }), bFaro, bSonido);

  // ---- lecturas
  const vW = html("b", {}, "0"), vWtexto = html("span", { class: "tc-pista", style: "margin:0" });
  const vN = html("b"), vNs = html("b"), vPar = html("b"), vChk = html("b"), vSimple = html("b");
  const tarjetaW = html("div", { class: "tc-g-tarjeta" }, html("h4", {}, "Número de vueltas W(γ, x)"),
    html("div", { class: "tc-g-grande" }, vW, vWtexto),
    html("div", { class: "tc-g-filas", style: "margin-top:8px" },
      html("span", {}, "Cruces del rayo"), vN, html("span", {}, "Con signo: (+) − (−)"), vNs,
      html("span", {}, "Paridad"), vPar, html("span", {}, "Paridad ≡ W (mod 2)"), vChk,
      html("span", {}, "¿Curva simple?"), vSimple));
  const dial = svg("svg", { viewBox: "-60 -60 120 120", width: 112, height: 112, role: "img", "aria-label": "Dial del faro: la dirección del vector unitario y su traza en espiral" });
  const vVueltas = html("b", { style: "font-size:1.8rem;font-variant-numeric:tabular-nums" }, "0.00");
  const tarjetaFaro = html("div", { class: "tc-g-tarjeta" }, html("h4", {}, "Faro: (γ(s) − x)/‖γ(s) − x‖"),
    html("div", { style: "display:flex;gap:10px;align-items:center" }, dial,
      html("div", {}, html("div", { class: "tc-pista", style: "margin:0" }, "vueltas acumuladas"), vVueltas)));
  const cajaDesafio = html("div", { class: "tc-g-tarjeta", hidden: true });
  const lecturas = html("div", { style: "display:contents" }, tarjetaW, tarjetaFaro, cajaDesafio);

  // ------------------------------------------------------------------ cálculo
  const info = () => (P.length >= 3 ? rayo(x, P) : { w: 0, n: 0, cruces: [] });
  const intersecciones = () => autointersecciones(P);

  // ------------------------------------------------------------------ campo W
  let rejilla = null;
  function pintarCampo() {
    const r = escena.getBoundingClientRect();
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    lienzoCampo.width = Math.max(1, Math.round((r.width || W_) * dpr));
    lienzoCampo.height = Math.max(1, Math.round((r.height || H_) * dpr));
    const ctx = lienzoCampo.getContext("2d");
    ctx.clearRect(0, 0, lienzoCampo.width, lienzoCampo.height);
    rejilla = null;
    if (!capas.campo || P.length < 3 || (desafio && desafio.respuesta === null)) return;
    const celda = 4, gx = Math.ceil(W_ / celda), gy = Math.ceil(H_ / celda), G = new Int16Array(gx * gy);
    for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) G[j * gx + i] = rayo(aM([(i + 0.5) * celda, (j + 0.5) * celda]), P).w;
    rejilla = { G, gx, gy, celda };
    const hex = (c) => { const m = c.replace("#", ""); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
    const pos = hex(tk("--tc-acento")), neg = hex(tk("--tc-seco"));
    const chico = document.createElement("canvas");
    chico.width = gx; chico.height = gy;
    const cctx = chico.getContext("2d"), img = cctx.createImageData(gx, gy);
    for (let q = 0; q < gx * gy; q++) {
      const v = G[q];
      if (!v) continue;
      const c = v > 0 ? pos : neg;
      img.data.set([c[0], c[1], c[2], Math.round(255 * Math.min(0.62, 0.14 + 0.16 * Math.abs(v)))], 4 * q);
    }
    cctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(chico, 0, 0, lienzoCampo.width, lienzoCampo.height);
  }

  /** Una etiqueta por región: inundación en la rejilla y el punto más «interior». */
  function etiquetasDeRegion(g) {
    if (!rejilla) return [];
    const { G, gx, gy, celda } = rejilla, visto = new Uint8Array(gx * gy), puestas = [];
    for (let s = 0; s < gx * gy; s++) {
      if (visto[s]) continue;
      const v = G[s], pila = [s], celdas = [];
      visto[s] = 1;
      while (pila.length) {
        const c = pila.pop();
        celdas.push(c);
        const i = c % gx, j = (c / gx) | 0;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ii = i + di, jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= gx || jj >= gy) continue;
          const d = jj * gx + ii;
          if (!visto[d] && G[d] === v) { visto[d] = 1; pila.push(d); }
        }
      }
      if (celdas.length < 25) continue;
      let mejor = celdas[0], puntaje = -1;
      const paso = Math.max(1, (celdas.length / 300) | 0);
      for (let q = 0; q < celdas.length; q += paso) {
        const c = celdas[q], i = c % gx, j = (c / gx) | 0;
        let r = 1;
        while (r < 40) {
          let ok = true;
          for (const [di, dj] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) {
            const ii = i + di, jj = j + dj;
            if (ii < 0 || jj < 0 || ii >= gx || jj >= gy || G[jj * gx + ii] !== v) { ok = false; break; }
          }
          if (!ok) break;
          r++;
        }
        if (r > puntaje) { puntaje = r; mejor = c; }
      }
      const bx = ((mejor % gx) + 0.5) * celda, by = (((mejor / gx) | 0) + 0.5) * celda;
      puestas.push(texto(g, bx, by + 6, (v > 0 ? "+" : "") + v, {
        "text-anchor": "middle", "font-size": 18, "font-weight": 700,
        fill: v > 0 ? tk("--tc-acento") : v < 0 ? tk("--tc-seco") : tk("--tc-tenue"),
      }));
    }
    return puestas;
  }

  // ------------------------------------------------------------------ dibujo
  let refs = {};
  function dibujarTodo() {
    lienzo.replaceChildren();
    refs = {};
    const defs = svg("defs", {}, lienzo);
    const m = svg("marker", { id: `${id}-fl`, viewBox: "0 0 10 10", refX: 5, refY: 5, markerWidth: 11, markerHeight: 11, markerUnits: "userSpaceOnUse", orient: "auto" }, defs);
    svg("path", { d: "M0,1 L9,5 L0,9 z", fill: tk("--tc-tinta") }, m);
    const ocultarW = desafio && desafio.respuesta === null;
    const simple = P.length >= 3 && esSimple(P);
    if (P.length >= 3) {
      if (capas.campo && !ocultarW) refs.regiones = etiquetasDeRegion(svg("g", {}, lienzo));
      if (capas.triangulacion && simple) dibujarTriangulacion();
      const d = P.map((p, i) => (i ? "L" : "M") + aS(p).join(",")).join(" ") + "Z";
      refs.curva = svg("path", { d, fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 2.4, "stroke-linejoin": "round" }, lienzo);
      if (capas.orientacion) {
        const paso = Math.max(1, Math.round(P.length / 14));
        for (let i = 0; i < P.length; i += paso) {
          const a = aS(P[i]), b = aS(P[(i + 1) % P.length]);
          svg("line", { x1: a[0], y1: a[1], x2: (a[0] + b[0]) / 2, y2: (a[1] + b[1]) / 2, stroke: "transparent", "marker-end": `url(#${id}-fl)` }, lienzo);
        }
      }
      for (const { punto } of intersecciones()) {
        const s = aS(punto);
        refs.cruce = svg("circle", { cx: s[0], cy: s[1], r: 5, fill: "none", stroke: tk("--tc-rechazo"), "stroke-width": 2.2 }, lienzo);
      }
      if (ESCENARIOS_G1[clave]?.errata) dibujarErrata();
    }
    if (trazo && trazo.length > 1) dibujarTrazo();
    const r = info();
    const xs = aS(x);
    if (capas.rayo && P.length >= 3 && !ocultarW) {
      refs.rayo = svg("line", { x1: xs[0], y1: xs[1], x2: W_, y2: xs[1], stroke: tk("--tc-camino"), "stroke-width": 2, "stroke-dasharray": "6 5" }, lienzo);
      for (const { punto, signo } of r.cruces) {
        const q = aS(punto);
        refs.marca = svg("circle", { cx: q[0], cy: q[1], r: 9, fill: signo > 0 ? tk("--tc-acento") : tk("--tc-seco") }, lienzo);
        texto(lienzo, q[0], q[1] + 4, signo > 0 ? "+" : "−", { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#fff" });
      }
    }
    if (faro) {
      const g = aS(faro.punto);
      svg("line", { x1: xs[0], y1: xs[1], x2: g[0], y2: g[1], stroke: tk("--tc-camino"), "stroke-width": 3 }, lienzo);
      svg("circle", { cx: g[0], cy: g[1], r: 7, fill: tk("--tc-camino") }, lienzo);
    }
    refs.x = svg("circle", { cx: xs[0], cy: xs[1], r: 9, fill: tk("--tc-panel"), stroke: tk("--tc-tinta"), "stroke-width": 2.5, style: "cursor:grab" }, lienzo);
    texto(lienzo, xs[0] + 12, xs[1] - 10, "x", { "font-size": 15, "font-style": "italic", "font-weight": 700, fill: tk("--tc-tinta") });
    actualizarLecturas(r, simple);
    dibujarDial();
    gadget?.refrescarLentes();
  }

  function dibujarTrazo() {
    if (freehand) {
      const contorno = freehand(trazo, { size: 7, thinning: 0.5, smoothing: 0.5, streamline: 0.4 });
      if (contorno.length) {
        svg("path", { d: contorno.map((p, i) => (i ? "L" : "M") + p.join(",")).join(" ") + "Z", fill: tk("--tc-acento") }, lienzo);
        return;
      }
    }
    svg("path", { d: trazo.map((p, i) => (i ? "L" : "M") + p.join(",")).join(" "), fill: "none", stroke: tk("--tc-acento"), "stroke-width": 3, "stroke-linecap": "round" }, lienzo);
  }

  function dibujarTriangulacion() {
    const Q = areaConSigno(P) < 0 ? P.slice().reverse() : P;
    const { triangulos: T, diagonales: D } = triangular(Q);
    const arcos = arbolDual(T), hojas = new Set(orejas(T, arcos));
    const g = svg("g", {}, lienzo);
    const color = tk("--tc-compresion");
    T.forEach((t, k) => {
      if (hojas.has(k)) svg("polygon", { points: t.map((i) => aS(Q[i]).join(",")).join(" "), fill: color, "fill-opacity": 0.18 }, g);
    });
    for (const [i, j] of D) {
      const a = aS(Q[i]), b = aS(Q[j]);
      svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, "stroke-width": 1, opacity: 0.7 }, g);
    }
    const centro = (t) => aS([(Q[t[0]][0] + Q[t[1]][0] + Q[t[2]][0]) / 3, (Q[t[0]][1] + Q[t[1]][1] + Q[t[2]][1]) / 3]);
    for (const [s, t] of arcos) {
      const a = centro(T[s]), b = centro(T[t]);
      svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, "stroke-width": 2.2 }, g);
    }
    T.forEach((t, k) => { const c = centro(t); svg("circle", { cx: c[0], cy: c[1], r: hojas.has(k) ? 4.5 : 2.6, fill: color }, g); });
    refs.triangulacion = g;
    texto(g, 12, 22, `n = ${Q.length}: ${T.length} triángulos (n − 2), ${D.length} diagonales (n − 3), árbol dual con ${hojas.size} hojas = orejas`, { "font-size": 13, fill: color, "font-weight": 600 });
  }

  function dibujarErrata() {
    const idx = P.map((_, i) => i);
    const [bi, ui] = diagonal(P, idx, "libro"), [bj, uj] = diagonal(P, idx, "corregida");
    const S = (i) => aS(P[i]);
    svg("line", { x1: S(bi)[0], y1: S(bi)[1], x2: S(ui)[0], y2: S(ui)[1], stroke: tk("--tc-rechazo"), "stroke-width": 3.5 }, lienzo);
    svg("line", { x1: S(bj)[0], y1: S(bj)[1], x2: S(uj)[0], y2: S(uj)[1], stroke: tk("--tc-enlace"), "stroke-width": 3.5, "stroke-dasharray": "9 5" }, lienzo);
    texto(lienzo, 12, H_ - 34, `Rojo: la regla del libro (el de más a la izquierda en abc): ${esDiagonal(P, bi, ui) ? "diagonal" : "corta una arista, NO es diagonal"}.`, { "font-size": 13, fill: tk("--tc-rechazo"), "font-weight": 600 });
    texto(lienzo, 12, H_ - 15, `Verde: la regla clásica (el más lejano de la recta ac): ${esDiagonal(P, bj, uj) ? "siempre da una diagonal" : "?"}.`, { "font-size": 13, fill: tk("--tc-enlace"), "font-weight": 600 });
  }

  function actualizarLecturas(r, simple) {
    const oculto = desafio && desafio.respuesta === null;
    const sobre = P.length >= 3 && sobreElPoligono(x, P);
    vW.textContent = oculto ? "?" : sobre ? "—" : String(r.w);
    const positivos = r.cruces.filter((c) => c.signo > 0).length;
    vN.textContent = oculto ? "?" : r.n;
    vNs.textContent = oculto ? "?" : `${positivos} − ${r.n - positivos} = ${r.w}`;
    vPar.textContent = oculto ? "?" : r.n % 2 ? "impar" : "par";
    vChk.textContent = oculto ? "?" : ((r.n - r.w) % 2 + 2) % 2 === 0 ? "✓ siempre" : "✗";
    vChk.className = "tc-g-ok";
    const k = intersecciones().length;
    vSimple.textContent = P.length < 3 ? "—" : simple ? "sí (Jordan)" : k ? `no (${k} cruce${k === 1 ? "" : "s"})` : "no (se toca)";
    vWtexto.textContent = oculto ? "" : sobre ? "x está sobre la curva"
      : simple ? (r.w ? "adentro" : "afuera")
      : r.w ? `${Math.abs(r.w)} vuelta${Math.abs(r.w) > 1 ? "s" : ""} ${r.w > 0 ? "antihoraria" : "horaria"}${Math.abs(r.w) > 1 ? "s" : ""}` : "sin vuelta neta";
  }

  function dibujarDial() {
    dial.replaceChildren();
    svg("circle", { cx: 0, cy: 0, r: 46, fill: "none", stroke: tk("--tc-linea"), "stroke-width": 2 }, dial);
    for (let k = 0; k < 12; k++) {
      const t = (k * Math.PI) / 6;
      svg("line", { x1: 40 * Math.cos(t), y1: 40 * Math.sin(t), x2: 46 * Math.cos(t), y2: 46 * Math.sin(t), stroke: tk("--tc-linea") }, dial);
    }
    if (!faro) { vVueltas.textContent = "0.00"; return; }
    const pts = faro.traza.map(([a, acc]) => { const r = 14 + (6 * Math.abs(acc)) / (2 * Math.PI); return [r * Math.cos(a), -r * Math.sin(a)]; });
    if (pts.length > 1) svg("path", { d: pts.map((p, i) => (i ? "L" : "M") + p.join(",")).join(" "), fill: "none", stroke: faro.acumulado >= 0 ? tk("--tc-acento") : tk("--tc-seco"), "stroke-width": 1.6 }, dial);
    svg("line", { x1: 0, y1: 0, x2: 44 * Math.cos(faro.angulo), y2: -44 * Math.sin(faro.angulo), stroke: tk("--tc-camino"), "stroke-width": 3, "stroke-linecap": "round" }, dial);
    svg("circle", { cx: 0, cy: 0, r: 4, fill: tk("--tc-tinta") }, dial);
    vVueltas.textContent = (faro.acumulado / (2 * Math.PI)).toFixed(2);
  }

  // ------------------------------------------------------------------ faro y sonido
  let animacion = null;
  function correrFaro() {
    if (P.length < 3) return;
    cancelAnimationFrame(animacion);
    const total = 5200, t0 = performance.now(), n = P.length;
    const anguloDe = (p) => Math.atan2(p[1] - x[1], p[0] - x[0]);
    faro = { punto: P[0], angulo: anguloDe(P[0]), acumulado: 0, traza: [] };
    if (sonidoActivo) sonido?.volumen(0.9);
    let previo = faro.angulo, ultimaVuelta = 0;
    const paso = (ahora) => {
      const s = Math.min(1, (ahora - t0) / total), f = s * n, i = Math.floor(f) % n, u = f - Math.floor(f);
      const a = P[i], b = P[(i + 1) % n], pt = [a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])];
      const ang = anguloDe(pt);
      let d = ang - previo;
      while (d <= -Math.PI) d += 2 * Math.PI;
      while (d > Math.PI) d -= 2 * Math.PI;
      faro.acumulado += d; previo = ang;
      faro.punto = pt; faro.angulo = ang;
      faro.traza.push([ang, faro.acumulado]);
      const vueltas = Math.trunc(faro.acumulado / (2 * Math.PI));
      if (vueltas !== ultimaVuelta) { if (sonidoActivo) sonido?.clic(vueltas > ultimaVuelta ? 1 : -1); ultimaVuelta = vueltas; }
      if (sonidoActivo) sonido?.tono(faro.acumulado);
      dibujarTodo();
      if (s < 1) animacion = requestAnimationFrame(paso);
      else {
        if (sonidoActivo) sonido?.volumen(0);
        setTimeout(() => { faro = null; dibujarTodo(); }, 1800);
      }
    };
    animacion = requestAnimationFrame(paso);
  }

  // ------------------------------------------------------------------ interacción
  const puntoPantalla = (e) => {
    const r = lienzo.getBoundingClientRect();
    return [((e.clientX - r.left) * W_) / r.width, ((e.clientY - r.top) * H_) / r.height];
  };
  lienzo.addEventListener("pointerdown", (e) => {
    lienzo.setPointerCapture?.(e.pointerId);
    if (dibujar) { trazo = [puntoPantalla(e)]; dibujarTodo(); return; }
    arrastrando = true;
    x = aM(puntoPantalla(e)).map(Math.round);
    dibujarTodo();
  });
  lienzo.addEventListener("pointermove", (e) => {
    if (trazo) {
      const p = puntoPantalla(e), q = trazo.at(-1);
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 3) { trazo.push(p); dibujarTodo(); }
    } else if (arrastrando) {
      x = aM(puntoPantalla(e)).map(Math.round);
      dibujarTodo();
    }
  });
  const soltar = () => {
    if (trazo) {
      if (trazo.length > 8) {
        P = aEnteros(remuestrear(trazo.map(aM), 110));
        clave = "";
        selEsc.value = "";
        pintarCampo();
      }
      trazo = null;
      dibujar = false;
      bDibujar.setAttribute("aria-pressed", "false");
      pista.textContent = "Arrastrá el punto x · ✎ para dibujar otra curva";
      dibujarTodo();
    }
    arrastrando = false;
  };
  lienzo.addEventListener("pointerup", soltar);
  lienzo.addEventListener("pointercancel", soltar);

  bDibujar.addEventListener("click", () => {
    dibujar = !dibujar;
    bDibujar.setAttribute("aria-pressed", String(dibujar));
    pista.textContent = dibujar ? "Dibujá una curva cerrada de un solo trazo: al soltar se cierra sola" : "Arrastrá el punto x · ✎ para dibujar tu curva";
  });
  bInvertir.addEventListener("click", () => { P = P.slice().reverse(); pintarCampo(); dibujarTodo(); });
  bFaro.addEventListener("click", correrFaro);
  bSonido.addEventListener("click", () => {
    sonidoActivo = !sonidoActivo;
    bSonido.setAttribute("aria-pressed", String(sonidoActivo));
    if (sonidoActivo && !sonido) sonido = crearSonido();
    if (sonido) sonidoActivo ? sonido.ctx.resume() : sonido.ctx.suspend();
  });
  selEsc.addEventListener("change", () => { if (selEsc.value) cargar(selEsc.value); });

  function cargar(k) {
    clave = k;
    P = curvaDe(k);
    x = ESCENARIOS_G1[k].x.slice();
    const errata = !!ESCENARIOS_G1[k].errata;
    capas.campo = !errata;
    capas.triangulacion = errata;
    pista.hidden = errata; // los textos de la errata ocupan ese lugar
    controles.querySelectorAll("button[aria-pressed]").forEach((b) => {
      if (b.textContent === "Campo W") b.setAttribute("aria-pressed", String(capas.campo));
      if (b.textContent === "Triangulación") b.setAttribute("aria-pressed", String(capas.triangulacion));
    });
    pintarCampo();
    dibujarTodo();
  }

  // ------------------------------------------------------------------ modo desafío
  function plantearDesafio() {
    desafio = { respuesta: null };
    cajaDesafio.hidden = false;
    const opciones = [-2, -1, 0, 1, 2, 3].map((v) => {
      const b = html("button", {}, String(v));
      b.addEventListener("click", () => { desafio.respuesta = v; revelar(); });
      return b;
    });
    cajaDesafio.replaceChildren(html("h4", {}, "Desafío: predecí W"),
      html("p", { class: "tc-pista", style: "margin:0 0 6px" }, "Se ocultaron el campo y las lecturas. Mové x o dibujá una curva, y elegí cuántas vueltas da la curva alrededor de x."),
      html("div", { class: "tc-controles" }, ...opciones));
    pintarCampo();
    dibujarTodo();
  }
  function revelar() {
    const w = info().w;
    const ok = desafio.respuesta === w;
    cajaDesafio.replaceChildren(html("h4", {}, "Desafío: predecí W"),
      html("p", { class: ok ? "tc-g-ok" : "tc-g-mal", style: "margin:0 0 6px" }, ok ? `¡Exacto! W = ${w}.` : `Dijiste ${desafio.respuesta}; W = ${w}.`),
      html("p", { class: "tc-pista", style: "margin:0 0 6px" }, "Pista: contá los cruces del rayo con signo: + si la curva lo cruza hacia arriba, − hacia abajo."),
      html("button", { onclick: plantearDesafio }, "Otra vez"));
    pintarCampo();
    dibujarTodo();
  }

  // ------------------------------------------------------------------ lentes
  const lentes = [
    { id: "mat", nombre: "Matemático", contenido: () => {
      const w = info().w;
      return `<p><b>Grado de una función.</b> El vector unitario define \\(u: S^1 \\to S^1\\). \\(W(\\gamma, x)\\) es su <b>grado</b>: cuántas veces \\(u\\) cubre el círculo, con signo.</p>
        <p>\\(W(\\gamma, x) = \\frac{1}{2\\pi}\\oint d\\theta = \\frac{1}{2\\pi i}\\oint_\\gamma \\frac{dz}{z - x} = ${w}\\). Es continua en \\(x\\) y entera: por eso es <b>constante en cada región</b> y solo salta (en ±1) al cruzar la curva.</p>`;
    } },
    { id: "prog", nombre: "Programador", contenido: () => {
      const r = info();
      return `<p>Dos algoritmos, el mismo recorrido de aristas, \\(O(n)\\), con aritmética exacta (enteros):</p>
<pre>w = 0                          # en ℤ: número de vueltas
c = 0                          # en ℤ/2: paridad
for a, b in aristas(curva):
    s = cruce_con_signo(x, a, b)   # +1, −1 o 0
    w += s
    c += abs(s)
assert (c - w) % 2 == 0        # la paridad es W mod 2</pre>
<p class="tc-pista">Ahora: w = ${r.w}, c = ${r.n}. Los casos degenerados (el rayo por un vértice) los decide la perturbación \\(x' = x + (\\varepsilon_1, \\varepsilon_2)\\), resuelta con comparaciones exactas (<code>tcomp.curvas.orient_perturbado</code>).</p>`;
    } },
    { id: "fis", nombre: "Físico", contenido: () => `<p><b>Ley de Ampère.</b> Si por \\(x\\) pasa un cable perpendicular al plano con corriente \\(I\\), la circulación del campo magnético a lo largo de \\(\\gamma\\) es</p>
      <p style="text-align:center">\\(\\displaystyle\\oint_\\gamma \\mathbf{B}\\cdot d\\boldsymbol{\\ell} = \\mu_0\\, I\\, W(\\gamma, x) = ${info().w}\\,\\mu_0 I\\)</p>
      <p>La física cuenta las vueltas: un lazo que rodea el cable dos veces mide el doble; uno que no lo rodea, cero.</p>` },
    { id: "alg", nombre: "Algebraico", contenido: () => {
      const w = info().w;
      return `<p><b>\\(\\mathbb{Z}\\) contra \\(\\mathbb{Z}/2\\).</b> La paridad cuenta cruces <b>sin signo</b> (módulo 2); el número de vueltas, <b>con signo</b> (en los enteros).</p>
        <p>Para curvas simples alcanza \\(\\mathbb{Z}/2\\) (\\(W \\in \\{0, 1\\}\\)). Con autointersecciones, \\(\\mathbb{Z}/2\\) pierde información: acá \\(\\mathbb{Z}\\) dice <b>${w}</b> y \\(\\mathbb{Z}/2\\) dice <b>${((w % 2) + 2) % 2}</b>. Anticipo del capítulo IV: el libro calcula homología con coeficientes en \\(\\mathbb{Z}/2\\) por esta economía.</p>`;
    } },
  ];

  gadget = montarGadget({
    id,
    titulo: "Lienzo de Jordan",
    subtitulo: "dibujá una curva cerrada y mové x: todo lo demás se calcula solo",
    ancho: "completo",
    escenario: escena,
    lecturas,
    controles,
    lentes,
    modos: [{ id: "explorar", nombre: "Explorar" }, { id: "desafio", nombre: "Desafío" }],
    alCambiarModo: (m) => {
      if (m === "desafio") plantearDesafio();
      else { desafio = null; cajaDesafio.hidden = true; pintarCampo(); dibujarTodo(); }
    },
    estado: {
      obtener: () => ({ P, x, capas }),
      aplicar: (e) => {
        if (Array.isArray(e.P) && e.P.length >= 3) { P = e.P; clave = ""; selEsc.value = ""; }
        if (Array.isArray(e.x)) x = e.x;
        if (e.capas) Object.assign(capas, e.capas);
        pintarCampo();
        dibujarTodo();
      },
    },
    reiniciar: () => { selEsc.value = escenario; cargar(escenario); },
    queVeo: () => [
      { elemento: refs.curva, texto: "la curva γ (con su orientación)" },
      { elemento: refs.x, texto: "el punto x (arrastralo)" },
      { elemento: refs.rayo, texto: "el rayo de paridad" },
      { elemento: refs.marca, texto: "un cruce: + sube, − baja" },
      { elemento: refs.regiones?.[0], texto: "W de esta región" },
      { elemento: refs.cruce, texto: "autointersección" },
    ],
  });

  // el escenario necesita estar en la página para medir el canvas
  const observador = new ResizeObserver(() => { pintarCampo(); dibujarTodo(); });
  observador.observe(escena);
  alCambiarTema(() => { pintarCampo(); dibujarTodo(); });
  cargar(clave);
  // para el scrollytelling (scrolly.js): cambiar de escenario desde afuera; "dibujar" deja
  // el lienzo listo para la curva del lector
  gadget.raiz.tcEscenario = (k) => {
    if (k === "dibujar") { if (!dibujar) bDibujar.click(); return; }
    if (dibujar) bDibujar.click();
    if (k !== clave) { selEsc.value = k; cargar(k); }
  };
  return gadget.raiz;
}
