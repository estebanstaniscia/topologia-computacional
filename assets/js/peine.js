// El peine (sección I.1, pieza 3.9 de la spec).
//
// C = barra [0,1]×{0} ∪ dientes {1/k}×[0,1] (k ≥ 1) ∪ {p}, con p = (0, 1).
// C es conexo pero no conexo por caminos: p se VE desde el resto del peine (todo
// disco alrededor de p toca infinitos dientes) pero no se LLEGA a p.
//
// Tres maneras de comprobarlo con las manos:
// 1. Zoom hacia p: a cualquier escala hay infinitos dientes entre vos y p. Hacer
//    zoom no los separa, los amontona (cerca de 0 los dientes están a distancia
//    ~x²), así que siempre queda una franja de dientes más finos que un píxel.
// 2. El disco alrededor de p: por chico que sea, toca a todos los dientes k > 1/r.
// 3. El desafío: dibujar un camino hasta p. El sistema marca dónde el trazo sale
//    del peine; para pasar de un diente al siguiente hay que bajar a la barra.
// Y una lente inusual: x ↦ 1/x manda el diente 1/k al entero k. El peine se vuelve
// una regla infinita y p queda en el infinito.

import { svg, html, texto, lector, alCambiarTema, puntoSVG } from "./comun.js";

// ------------------------------------------------------------------ lógica pura

/** Dientes que toca el disco de radio r centrado en p: todos los k > 1/r (si r ≤ 1). */
export function primerDienteEnDisco(r) {
  // el diente x = 1/k corta al disco (en y = 1, el punto (1/k, 1)) si 1/k < r
  return Math.floor(1 / r) + 1;
}

/**
 * Clasifica un punto del plano respecto del peine, con tolerancia `tol`:
 * "p", "barra", {diente: k}, "densa" (más cerca de 0 que `xDensa`: allí los dientes
 * no se distinguen a esta escala) o "fuera".
 */
export function clasificar([x, y], tol, xDensa = 0) {
  if (Math.hypot(x, y - 1) < tol) return "p";
  if (y < -tol || y > 1 + tol || x < -tol || x > 1 + tol) return "fuera";
  if (Math.abs(y) < tol && x >= -tol && x <= 1 + tol) return "barra";
  if (x < xDensa) return "densa";
  if (x <= tol) return "fuera"; // el diente {0}×(0,1) fue borrado
  // cerca de x los dientes distan ~x²: la tolerancia nunca supera un tercio de esa
  // distancia, así un punto entre dos dientes nunca se confunde con uno de ellos
  const tolDiente = Math.min(tol, (x * x) / 3);
  const k0 = Math.max(1, Math.round(1 / x));
  for (const k of [k0 - 1, k0, k0 + 1]) {
    if (k >= 1 && Math.abs(x - 1 / k) < tolDiente) return { diente: k };
  }
  return "fuera";
}

/** Remuestrea una poligonal para que dos puntos consecutivos estén a menos de `paso`. */
export function remuestrear(puntos, paso) {
  if (puntos.length < 2) return puntos.slice();
  const out = [puntos[0]];
  for (let i = 1; i < puntos.length; i++) {
    const [a, b] = [puntos[i - 1], puntos[i]];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d / paso));
    for (let j = 1; j <= n; j++) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  }
  return out;
}

/**
 * Analiza un trazo (en coordenadas del plano). Devuelve las clases de cada punto,
 * los tramos fuera del peine y un resumen.
 */
export function analizarTrazo(puntos, tol, xDensa = 0) {
  const clases = puntos.map((q) => clasificar(q, tol, xDensa));
  const tramosFuera = [];
  let inicio = -1;
  clases.forEach((c, i) => {
    if (c === "fuera" && inicio < 0) inicio = i;
    if (c !== "fuera" && inicio >= 0) { tramosFuera.push([inicio, i - 1]); inicio = -1; }
  });
  if (inicio >= 0) tramosFuera.push([inicio, clases.length - 1]);
  // pasar de un diente a otro sin bajar a la barra también es un salto (aunque, con
  // dientes más juntos que la tolerancia, ningún punto quede "fuera")
  const saltosEntreDientes = [];
  for (let i = 1; i < clases.length; i++) {
    const [a, b] = [clases[i - 1], clases[i]];
    if (typeof a === "object" && typeof b === "object" && a.diente !== b.diente && puntos[i][1] > tol) {
      saltosEntreDientes.push(i);
    }
  }
  const ultimo = clases.at(-1);
  const dientes = new Set(clases.filter((c) => typeof c === "object").map((c) => c.diente));
  return {
    clases, tramosFuera, saltosEntreDientes,
    nSaltos: tramosFuera.length + saltosEntreDientes.length,
    terminaEnP: ultimo === "p", terminaEnDensa: ultimo === "densa",
    tocaDensa: clases.includes("densa"), dientes: [...dientes].sort((a, b) => a - b),
  };
}

// ------------------------------------------------------------------ la pieza

const W = 640, H = 520;
const ANCHO1 = 1.6;          // ancho del mundo visible con zoom 1
const P_PANT = [0.1, 0.15];  // dónde queda p en la pantalla (fracción), fijo al hacer zoom

/**
 * Opciones: `zoom` (factor inicial), `lente` (abrir con la lente 1/x), `disco` (radio
 * inicial) y `trazo` (un intento ya dibujado, en coordenadas del plano).
 */
export function peine({ zoom: zoomInicial = 1, lente: lenteInicial = false, disco = 0.2, trazo: trazoInicial = null } = {}) {
  const raiz = html("div", { class: "tc-pieza" });
  const tk = lector(raiz);

  const iZoom = html("input", { type: "range", min: 0, max: 6, step: 0.01, value: Math.log10(zoomInicial), "aria-label": "Zoom hacia p (escala logarítmica)" });
  const vZoom = html("b", {}, "×1");
  const iDisco = html("input", { type: "range", min: -4, max: 0, step: 0.01, value: Math.log10(disco), "aria-label": "Radio del disco alrededor de p (escala logarítmica)" });
  const vDisco = html("b", {}, "");
  const bLente = html("button", { "aria-pressed": "false", title: "Ver el peine a través de la lente x ↦ 1/x" }, "Lente x ↦ 1/x");
  const bDesafio = html("button", { class: "tc-primario" }, "Desafío: dibujá un camino hasta p");
  const bBorrar = html("button", {}, "Borrar trazo");
  const lienzo = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label": "El peine con un diente borrado: la barra, los dientes en x = 1/k y el punto p = (0, 1). Un disco alrededor de p toca infinitos dientes. Se puede dibujar un trazo y el sistema marca dónde sale del peine.",
  });
  const estado = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  const pista = html("div", { class: "tc-pista" });

  raiz.append(
    html("div", { class: "tc-titulo" }, "El peine", html("small", {}, "visible e inalcanzable")),
    html("div", { class: "tc-panel tc-controles" },
      html("label", {}, "Zoom hacia p", iZoom, vZoom),
      html("label", {}, "Disco de radio r", iDisco, vDisco),
      bLente, bDesafio, bBorrar),
    html("div", { class: "tc-panel", style: "margin-top:10px" }, lienzo,
      html("div", { class: "tc-leyenda" },
        html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-tinta)" }), "el peine"),
        html("span", {}, html("i", { class: "tc-mancha", style: "background:var(--tc-camino);opacity:.55" }), "franja de infinitos dientes a menos de 4 px entre sí"),
        html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-mojado)" }), "disco alrededor de p"),
        html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-enlace)" }), "trazo sobre el peine"),
        html("span", {}, html("i", { class: "tc-muestra punteada", style: "border-color:var(--tc-rechazo)" }), "trazo fuera del peine (salto)"))),
    html("div", { style: "margin-top:10px" }, estado, pista),
  );

  let lente = lenteInicial;
  let dibujando = false;
  let desafio = false;
  let trazo = [];          // en coordenadas del plano
  let analisis = null;

  // ---- geometría de la vista
  const zoom = () => 10 ** +iZoom.value;
  const vista = () => {
    const ww = ANCHO1 / zoom(), wh = (ww * H) / W;
    const izq = 0 - P_PANT[0] * ww, arriba = 1 + P_PANT[1] * wh;
    const esc = W / ww;
    return { ww, wh, izq, arriba, esc, sx: (x) => (x - izq) * esc, sy: (y) => (arriba - y) * esc, mx: (px) => izq + px / esc, my: (py) => arriba - py / esc };
  };
  const radio = () => 10 ** +iDisco.value;
  const xDensa = (v) => Math.sqrt(4 / v.esc); // por debajo, los dientes distan menos de 4 px

  function dibujar() {
    lienzo.replaceChildren();
    vZoom.textContent = "×" + formatear(zoom());
    vDisco.textContent = "r = " + formatear(radio());
    bLente.setAttribute("aria-pressed", String(lente));
    bDesafio.disabled = lente;
    if (lente) dibujarLente(); else dibujarReal();
    actualizarTexto();
  }

  function dibujarReal() {
    const v = vista();
    const tinta = tk("--tc-tinta");
    const xMax = Math.min(1, v.mx(W));
    const xD = Math.min(xDensa(v), xMax);
    // franja densa: [0, xD] × [0, 1]
    if (xD > 0) {
      svg("rect", { x: v.sx(0), y: v.sy(1), width: v.sx(xD) - v.sx(0), height: v.sy(0) - v.sy(1), fill: tk("--tc-camino"), "fill-opacity": 0.32 }, lienzo);
    }
    // dientes resolubles: x = 1/k en (xD, xMax]
    if (xMax > xD) {
      const kMin = Math.max(1, Math.ceil(1 / xMax - 1e-9));
      const kMax = Math.floor(1 / xD);
      for (let k = kMin; k <= kMax && k - kMin < 4000; k++) {
        const x = 1 / k;
        svg("line", { x1: v.sx(x), y1: v.sy(0), x2: v.sx(x), y2: v.sy(1), stroke: tinta, "stroke-width": 1.6 }, lienzo);
      }
      // etiquetas: de derecha a izquierda, dejando aire entre ellas
      let ultimaX = Infinity, puestas = 0;
      for (let k = kMin; k <= kMax && puestas < 4; k++) {
        const px = v.sx(1 / k);
        if (px > W - 24 || ultimaX - px < 46) continue;
        texto(lienzo, px, Math.max(14, v.sy(1) - 8), k === 1 ? "x = 1" : `1/${k}`, { "text-anchor": "middle", "font-size": 11, fill: tk("--tc-tenue") });
        ultimaX = px; puestas++;
      }
    }
    // barra
    svg("line", { x1: v.sx(0), y1: v.sy(0), x2: v.sx(1), y2: v.sy(0), stroke: tinta, "stroke-width": 2.4 }, lienzo);
    // el diente borrado
    svg("line", { x1: v.sx(0), y1: v.sy(0), x2: v.sx(0), y2: v.sy(1), stroke: tk("--tc-tenue"), "stroke-width": 1, "stroke-dasharray": "2 5" }, lienzo);
    // disco alrededor de p
    const r = radio();
    svg("circle", { cx: v.sx(0), cy: v.sy(1), r: r * v.esc, fill: tk("--tc-mojado-suave"), "fill-opacity": 0.35, stroke: tk("--tc-mojado"), "stroke-width": 2 }, lienzo);
    // trazo
    dibujarTrazo(v);
    // p
    svg("circle", { cx: v.sx(0), cy: v.sy(1), r: 6, fill: tk("--tc-rechazo"), stroke: tk("--tc-panel"), "stroke-width": 2 }, lienzo);
    texto(lienzo, v.sx(0) - 10, v.sy(1) - 10, "p", { "text-anchor": "end", "font-size": 15, "font-weight": 700, fill: tinta });
    // indicadores de escala
    if (xD > 0 && v.sx(xD) - v.sx(0) > 24) {
      texto(lienzo, v.sx(xD / 2), Math.min(H - 10, v.sy(0.5)), "∞", { "text-anchor": "middle", "font-size": 18, fill: tinta });
    }
    if (v.sy(0) > H) {
      svg("rect", { x: W - 292, y: H - 30, width: 284, height: 22, rx: 6, fill: tk("--tc-panel"), stroke: tk("--tc-linea") }, lienzo);
      texto(lienzo, W - 150, H - 14, "↓ la barra está más abajo, fuera de la vista", { "text-anchor": "middle", "font-size": 12, fill: tk("--tc-tenue") });
    }
  }

  function dibujarTrazo(v) {
    if (trazo.length < 2) return;
    const clases = analisis?.clases;
    const saltos = new Set(analisis?.saltosEntreDientes || []);
    for (let i = 1; i < trazo.length; i++) {
      const fuera = clases && (clases[i] === "fuera" || clases[i - 1] === "fuera" || saltos.has(i));
      svg("line", {
        x1: v.sx(trazo[i - 1][0]), y1: v.sy(trazo[i - 1][1]), x2: v.sx(trazo[i][0]), y2: v.sy(trazo[i][1]),
        stroke: fuera ? tk("--tc-rechazo") : tk("--tc-enlace"), "stroke-width": fuera ? 3 : 4.5,
        "stroke-dasharray": fuera ? "5 4" : null, "stroke-linecap": "round",
      }, lienzo);
    }
    const inicios = (analisis?.tramosFuera || []).map(([a]) => Math.max(0, a - 1)).concat([...saltos].map((i) => i - 1));
    for (const a of inicios) {
      const q = trazo[a];
      svg("circle", { cx: v.sx(q[0]), cy: v.sy(q[1]), r: 7, fill: "none", stroke: tk("--tc-rechazo"), "stroke-width": 2 }, lienzo);
    }
  }

  function dibujarLente() {
    // u = 1/x: el diente 1/k va al entero k. La ventana muestra k en [K, K + 24].
    const K = Math.max(1, Math.floor(zoom()));
    const span = 24;
    const fin = W - 120; // la regla termina acá; a la derecha queda «→ p»
    const su = (u) => 50 + ((u - K + 0.5) / (span + 1)) * (fin - 50);
    const sy = (y) => 70 + (1 - y) * (H - 170);
    const tinta = tk("--tc-tinta");
    const kDisco = primerDienteEnDisco(radio());
    // región que corresponde al disco: todos los dientes k ≥ kDisco (la cola hacia el infinito)
    const u0 = Math.max(K - 0.5, kDisco - 0.5);
    if (u0 < K + span + 0.5) {
      svg("rect", { x: su(u0), y: sy(1) - 18, width: fin - su(u0), height: 36, fill: tk("--tc-mojado-suave"), "fill-opacity": 0.6, stroke: tk("--tc-mojado"), "stroke-width": 1.5 }, lienzo);
    }
    svg("line", { x1: su(K - 0.5), y1: sy(0), x2: fin, y2: sy(0), stroke: tinta, "stroke-width": 2.4 }, lienzo);
    svg("line", { x1: fin, y1: sy(0), x2: fin + 40, y2: sy(0), stroke: tinta, "stroke-width": 2.4, "stroke-dasharray": "3 5" }, lienzo);
    for (let k = K; k <= K + span; k++) {
      svg("line", { x1: su(k), y1: sy(0), x2: su(k), y2: sy(1), stroke: tinta, "stroke-width": 1.8 }, lienzo);
      if ((k - K) % 4 === 0) texto(lienzo, su(k), sy(0) + 18, String(k), { "text-anchor": "middle", "font-size": 11, fill: tk("--tc-tenue") });
    }
    texto(lienzo, W - 14, sy(1) + 5, "→ p", { "text-anchor": "end", "font-size": 15, "font-weight": 700, fill: tk("--tc-rechazo") });
    texto(lienzo, W - 14, sy(1) + 24, "(en el infinito)", { "text-anchor": "end", "font-size": 11, fill: tk("--tc-tenue") });
    texto(lienzo, 50, sy(0) + 44, `diente k ↔ x = 1/k · mostrando k = ${formatear(K)} … ${formatear(K + span)}`, { "font-size": 12, fill: tk("--tc-tenue") });
    texto(lienzo, 50, sy(1) - 30, `el disco de radio ${formatear(radio())} alrededor de p ↔ todos los dientes k ≥ ${formatear(kDisco)}`, { "font-size": 12, fill: tk("--tc-mojado") });
  }

  function actualizarTexto() {
    estado.className = "tc-veredicto";
    const r = radio();
    if (lente) {
      estado.innerHTML = `<b>La lente x ↦ 1/x.</b> Manda el diente x = 1/k al entero k: el peine se vuelve una regla con un diente en cada entero y p se va al infinito. ` +
        `Un entorno de p es un entorno del infinito: <i>todos los dientes a partir de uno</i>. Llegar a p sería cruzar infinitos dientes, y entre dos dientes consecutivos solo se pasa por la barra. ` +
        `Movés el zoom y siempre aparecen más: k nunca se termina.`;
      pista.textContent = "Lente: el control de zoom avanza por la regla hacia el infinito; el disco se convierte en una cola de dientes.";
      return;
    }
    if (analisis && trazo.length > 1) {
      const nf = analisis.nSaltos;
      if (nf > 0) {
        estado.classList.add("no");
        estado.innerHTML = `<b>Tu trazo salta ${nf} ${nf > 1 ? "veces" : "vez"} fuera del peine</b> (en rojo, con un círculo donde empieza cada salto). ` +
          `En el peine, para pasar de un diente al siguiente hay que bajar hasta la barra: no hay atajos por el aire.` +
          (analisis.terminaEnP ? " Y aunque termines en p, llegaste saltando." : "");
      } else if (analisis.terminaEnDensa || (analisis.tocaDensa && !analisis.terminaEnP)) {
        estado.classList.add("si");
        estado.innerHTML = `<b>Llegaste a la franja densa sin salirte del peine.</b> Hacé zoom: la franja nunca desaparece. Entre tu trazo y p siempre quedan infinitos dientes, ` +
          `y cada uno exige bajar a la barra y volver a subir. Acercarse a p exige infinitas oscilaciones de amplitud ≥ 1/2 en tiempo finito: la continuidad lo prohíbe.`;
      } else if (analisis.terminaEnP) {
        estado.classList.add("no");
        estado.innerHTML = `<b>Terminaste en p, pero mirá cómo llegaste:</b> el último tramo cruza la franja densa, donde a esta escala no se distingue qué hiciste. Hacé zoom: un camino de verdad tendría que bajar a la barra entre cada par de dientes.`;
      } else {
        estado.classList.add("si");
        estado.innerHTML = `<b>Es un camino en el peine${analisis.dientes.length ? ` (usa los dientes ${analisis.dientes.slice(0, 6).map((k) => `1/${k}`).join(", ")}${analisis.dientes.length > 6 ? ", …" : ""})` : ""}.</b> Ahora intentá llegar a p.`;
      }
      pista.textContent = "Dibujá de nuevo para otro intento. El zoom también vale mientras dibujás.";
      return;
    }
    estado.innerHTML = `<b>Todo disco alrededor de p toca al peine.</b> El de radio ${formatear(r)} toca a todos los dientes x = 1/k con k ≥ ${formatear(primerDienteEnDisco(r))}: infinitos. ` +
      `Por eso p está en la clausura del resto del peine, y C es conexo. Achicá el disco o hacé zoom: no hay escala a la que p quede aislado.`;
    pista.textContent = desafio
      ? "Desafío: dibujá con el mouse o el dedo un camino que empiece en la barra y llegue a p."
      : "Zoom y disco: los controles de arriba. La franja amarilla es honesta: ahí hay infinitos dientes, a menos de 4 píxeles entre sí; ninguna escala la hace desaparecer.";
  }

  // ---- interacción: dibujar el trazo
  lienzo.addEventListener("pointerdown", (ev) => {
    if (lente || !desafio) return;
    dibujando = true;
    const v = vista();
    const [px, py] = puntoSVG(lienzo, ev);
    trazo = [[v.mx(px), v.my(py)]];
    analisis = null;
    lienzo.setPointerCapture?.(ev.pointerId);
    dibujar();
  });
  lienzo.addEventListener("pointermove", (ev) => {
    if (!dibujando) return;
    const v = vista();
    const [px, py] = puntoSVG(lienzo, ev);
    trazo.push([v.mx(px), v.my(py)]);
    dibujar();
  });
  const terminar = () => {
    if (!dibujando) return;
    dibujando = false;
    const v = vista();
    trazo = remuestrear(trazo, 0.5 / v.esc);
    analisis = analizarTrazo(trazo, 7 / v.esc, xDensa(v));
    dibujar();
  };
  lienzo.addEventListener("pointerup", terminar);
  lienzo.addEventListener("pointercancel", terminar);
  lienzo.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    iZoom.value = Math.max(+iZoom.min, Math.min(+iZoom.max, +iZoom.value - ev.deltaY * 0.002));
    reanalizar();
  }, { passive: false });

  function reanalizar() {
    if (trazo.length > 1 && !dibujando) {
      const v = vista();
      analisis = analizarTrazo(trazo, 7 / v.esc, xDensa(v));
    }
    dibujar();
  }

  iZoom.addEventListener("input", reanalizar);
  iDisco.addEventListener("input", dibujar);
  bLente.addEventListener("click", () => { lente = !lente; dibujar(); });
  bDesafio.addEventListener("click", () => {
    desafio = true; trazo = []; analisis = null;
    bDesafio.setAttribute("aria-pressed", "true");
    lienzo.style.cursor = "crosshair";
    dibujar();
  });
  bBorrar.addEventListener("click", () => { trazo = []; analisis = null; dibujar(); });
  alCambiarTema(dibujar);
  if (trazoInicial) {
    desafio = true;
    trazo = trazoInicial.map((q) => q.slice());
    dibujando = true;
    terminar();
  } else {
    dibujar();
  }
  return raiz;
}

function formatear(x) {
  if (x >= 1e4) return x.toExponential(1).replace("e+", "·10^");
  if (x >= 100) return Math.round(x).toLocaleString("es-AR");
  if (x >= 1) return (Math.round(x * 10) / 10).toString();
  return x.toPrecision(2);
}
