// Continuidad: tirar hacia atrás (sección I.1, pieza 3.7 de la spec).
//
// Panel 1 (ℝ → ℝ): la función escalón del libro, f(x) = 0 si x ≤ 0 y 1 si x > 0.
//   El lector fija la tolerancia ε de la salida, achica la ventana δ de la entrada
//   y mueve el punto x₀: en x₀ = 0 ningún δ funciona; en cualquier otro punto, sí.
// Panel 2 (ℝ → {0,1}): la MISMA fórmula hacia las cuatro topologías de {0,1}. Para
//   cada abierto de la llegada se dibuja su preimagen y se dice si es abierta.
//   La continuidad no es de la fórmula: es de la relación entre dos topologías.

import { svg, html, texto, lector, alCambiarTema } from "./comun.js";

// ------------------------------------------------------------------ lógica pura

/** Las dos funciones: f es el test "x > 0" (la del libro); g es el test "x ≤ 0". */
export const FUNCIONES = {
  f: { nombre: "f: el test «x > 0» (la del libro)", valor: (x) => (x > 0 ? 1 : 0) },
  g: { nombre: "g = 1 − f: el test «x ≤ 0»", valor: (x) => (x > 0 ? 0 : 1) },
};

/** Las cuatro topologías de {0,1}: listas de abiertos (cada abierto, lista de puntos). */
export const TOPOLOGIAS = {
  discreta: { nombre: "Discreta", abiertos: [[], [0], [1], [0, 1]] },
  sierpinski1: { nombre: "Sierpiński, {1} abierto", abiertos: [[], [1], [0, 1]] },
  sierpinski0: { nombre: "Sierpiński, {0} abierto", abiertos: [[], [0], [0, 1]] },
  trivial: { nombre: "Trivial", abiertos: [[], [0, 1]] },
};

/**
 * Preimagen de U ⊆ {0,1} por la función `fn` ("f" o "g"), como uno de cuatro
 * subconjuntos de ℝ: "vacio", "reales", "positivos" = (0, ∞) o "noPositivos" = (−∞, 0].
 */
export function preimagen(fn, U) {
  const s = new Set(U);
  if (s.size === 0) return "vacio";
  if (s.size === 2) return "reales";
  const valorPositivos = FUNCIONES[fn].valor(1); // qué valor toman los x > 0
  return s.has(valorPositivos) ? "positivos" : "noPositivos";
}

/** ¿Es abierto en ℝ? (−∞, 0] no lo es: el 0 no tiene margen hacia la derecha. */
export const esAbierto = (sub) => sub !== "noPositivos";

export function esContinua(fn, top) {
  return TOPOLOGIAS[top].abiertos.every((U) => esAbierto(preimagen(fn, U)));
}

/**
 * Panel 1: ¿funciona este δ en x₀ para esta ε? Devuelve también el conjunto de
 * puntos "que se escapan" dentro de la ventana (un intervalo, o null).
 */
export function pruebaEpsDelta(x0, eps, delta) {
  const f = FUNCIONES.f.valor;
  if (eps > 1) return { funciona: true, escapan: null }; // la ventana de salida contiene a 0 y a 1
  const [a, b] = [x0 - delta, x0 + delta];
  if (f(x0) === 0) {
    // se escapan los x > 0 de la ventana
    return b > 0 ? { funciona: false, escapan: [Math.max(a, 0), b] } : { funciona: true, escapan: null };
  }
  // f(x0) = 1: se escapan los x ≤ 0 de la ventana
  return a < 0 ? { funciona: false, escapan: [a, Math.min(b, 0)] } : { funciona: true, escapan: null };
}

/** El mayor δ que funciona en x₀ (para ε ≤ 1): |x₀| (y ninguno si x₀ = 0). */
export const deltaMaximo = (x0) => Math.abs(x0);

const NOMBRE_SUB = { vacio: "∅", reales: "ℝ", positivos: "(0, ∞)", noPositivos: "(−∞, 0]" };
const conjunto = (U) => (U.length ? `{${U.join(", ")}}` : "∅");

// ------------------------------------------------------------------ panel 1

function panelEpsDelta() {
  const raiz = html("div", { class: "tc-panel" });
  const tk = lector(raiz);
  const W = 560, H = 300, X0 = -2, X1 = 2, Y0 = -0.6, Y1 = 1.6;
  const sx = (x) => 40 + ((x - X0) / (X1 - X0)) * (W - 60);
  const sy = (y) => H - 30 - ((y - Y0) / (Y1 - Y0)) * (H - 50);
  const deslizador = (min, max, paso, valor, etiqueta) => {
    const i = html("input", { type: "range", min, max, step: paso, value: valor, "aria-label": etiqueta });
    const v = html("b", {}, "");
    return [html("label", {}, etiqueta, i, v), i, v];
  };
  const [lEps, iEps, vEps] = deslizador(0.05, 1.3, 0.01, 0.4, "ε");
  const [lDel, iDel, vDel] = deslizador(0.005, 1.5, 0.005, 0.8, "δ");
  const [lX0, iX0, vX0] = deslizador(-1.2, 1.2, 0.01, 0, "x₀");
  const bMitad = html("button", { title: "Dividir δ por 2" }, "δ ← δ/2");
  const lienzo = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label": "Gráfico de la función escalón con la ventana de tolerancia ε alrededor de f(x₀) y la ventana δ alrededor de x₀; en rojo, los puntos de la ventana δ cuya imagen se escapa.",
  });
  const veredicto = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  raiz.append(
    html("h4", {}, "ℝ → ℝ · la definición ε-δ"),
    html("div", { class: "tc-controles" }, lEps, lDel, bMitad, lX0),
    lienzo,
    html("div", { class: "tc-leyenda" },
      html("span", {}, html("i", { class: "tc-mancha", style: "background:var(--tc-mojado-suave);border:1px solid var(--tc-mojado)" }), "ventana de salida (f(x₀) − ε, f(x₀) + ε)"),
      html("span", {}, html("i", { class: "tc-mancha", style: "background:var(--tc-seco-suave);border:1px solid var(--tc-seco)" }), "ventana de entrada (x₀ − δ, x₀ + δ)"),
      html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-rechazo)" }), "puntos que se escapan")),
    veredicto,
  );

  function dibujar() {
    const eps = +iEps.value, delta = +iDel.value, x0 = +iX0.value;
    vEps.textContent = eps.toFixed(2);
    vDel.textContent = delta < 0.1 ? delta.toFixed(3) : delta.toFixed(2);
    vX0.textContent = x0.toFixed(2);
    const fx0 = FUNCIONES.f.valor(x0);
    const prueba = pruebaEpsDelta(x0, eps, delta);
    lienzo.replaceChildren();
    // ventanas
    svg("rect", { x: sx(X0), y: sy(fx0 + eps), width: sx(X1) - sx(X0), height: sy(fx0 - eps) - sy(fx0 + eps), fill: tk("--tc-mojado-suave"), "fill-opacity": 0.75 }, lienzo);
    const a = Math.max(X0, x0 - delta), b = Math.min(X1, x0 + delta);
    svg("rect", { x: sx(a), y: sy(Y1), width: Math.max(1, sx(b) - sx(a)), height: sy(Y0) - sy(Y1), fill: tk("--tc-seco-suave"), "fill-opacity": 0.75 }, lienzo);
    // ejes
    svg("line", { x1: sx(X0), y1: sy(0), x2: sx(X1), y2: sy(0), stroke: tk("--tc-linea"), "stroke-width": 1.2 }, lienzo);
    svg("line", { x1: sx(0), y1: sy(Y0), x2: sx(0), y2: sy(Y1), stroke: tk("--tc-linea"), "stroke-width": 1.2 }, lienzo);
    for (const t of [-2, -1, 1, 2]) texto(lienzo, sx(t), sy(0) + 16, String(t), { "text-anchor": "middle", "font-size": 11, fill: tk("--tc-tenue") });
    texto(lienzo, sx(0) - 8, sy(1) + 4, "1", { "text-anchor": "end", "font-size": 11, fill: tk("--tc-tenue") });
    // gráfico de f
    const tinta = tk("--tc-tinta");
    svg("line", { x1: sx(X0), y1: sy(0), x2: sx(0), y2: sy(0), stroke: tinta, "stroke-width": 3 }, lienzo);
    svg("line", { x1: sx(0), y1: sy(1), x2: sx(X1), y2: sy(1), stroke: tinta, "stroke-width": 3 }, lienzo);
    // puntos que se escapan
    if (prueba.escapan) {
      const [p, q] = prueba.escapan;
      const yEsc = 1 - fx0; // se escapan hacia el otro nivel
      svg("line", { x1: sx(Math.max(X0, p)), y1: sy(yEsc), x2: sx(Math.min(X1, q)), y2: sy(yEsc), stroke: tk("--tc-rechazo"), "stroke-width": 6, "stroke-linecap": "round" }, lienzo);
    }
    svg("circle", { cx: sx(0), cy: sy(0), r: 5, fill: tinta }, lienzo); // f(0) = 0
    svg("circle", { cx: sx(0), cy: sy(1), r: 5, fill: tk("--tc-panel"), stroke: tinta, "stroke-width": 2 }, lienzo); // 0 no va a 1
    // x0
    svg("line", { x1: sx(x0), y1: sy(Y0), x2: sx(x0), y2: sy(Y1), stroke: tk("--tc-seco"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, lienzo);
    svg("circle", { cx: sx(x0), cy: sy(fx0), r: 6, fill: tk("--tc-seco"), stroke: tk("--tc-panel"), "stroke-width": 2 }, lienzo);
    texto(lienzo, sx(x0) + 6, sy(Y0) + 14, "x₀", { "font-size": 12, fill: tk("--tc-seco") });

    veredicto.className = "tc-veredicto " + (prueba.funciona ? "si" : "no");
    if (eps > 1) {
      veredicto.innerHTML = "<b>Con ε > 1 cualquier δ funciona:</b> la ventana de salida ya contiene al 0 y al 1. La continuidad se pone a prueba con tolerancias <i>chicas</i>: bajá ε por debajo de 1.";
    } else if (prueba.funciona) {
      veredicto.innerHTML = `<b>Este δ funciona en x₀ = ${x0.toFixed(2)}.</b> Toda la ventana de entrada cae del mismo lado del 0, y f es constante ahí. Funciona cualquier δ ≤ |x₀| = ${deltaMaximo(x0).toFixed(2)}: f es continua en todo x₀ ≠ 0.`;
    } else if (Math.abs(x0) < 1e-9) {
      veredicto.innerHTML = `<b>Este δ no funciona, y ninguno funciona.</b> Por más chica que sea la ventana (−δ, δ), contiene puntos positivos, que saltan a 1, fuera de (−ε, ε). Probá «δ ← δ/2» todas las veces que quieras: el tramo rojo se achica pero nunca desaparece.`;
    } else {
      veredicto.innerHTML = `<b>Este δ no funciona, pero uno más chico sí:</b> la ventana cruza al otro lado del 0. Achicá δ hasta |x₀| = ${deltaMaximo(x0).toFixed(2)} (o llevá x₀ a 0 y mirá qué pasa).`;
    }
  }
  for (const i of [iEps, iDel, iX0]) i.addEventListener("input", dibujar);
  bMitad.addEventListener("click", () => { iDel.value = Math.max(+iDel.min, +iDel.value / 2); dibujar(); });
  alCambiarTema(dibujar);
  dibujar();
  return raiz;
}

// ------------------------------------------------------------------ panel 2

function rectaConSubconjunto(tk, sub) {
  const W = 260, H = 34, X0 = -3, X1 = 3;
  const sx = (x) => 10 + ((x - X0) / (X1 - X0)) * (W - 20);
  const l = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `Preimagen ${NOMBRE_SUB[sub]} sobre la recta real`, style: "max-width:260px" });
  svg("line", { x1: sx(X0), y1: 17, x2: sx(X1), y2: 17, stroke: tk("--tc-linea"), "stroke-width": 2 }, l);
  const color = esAbierto(sub) ? tk("--tc-enlace") : tk("--tc-rechazo");
  const tramo = { reales: [X0, X1], positivos: [0, X1], noPositivos: [X0, 0] }[sub];
  if (tramo) svg("line", { x1: sx(tramo[0]), y1: 17, x2: sx(tramo[1]), y2: 17, stroke: color, "stroke-width": 6, "stroke-linecap": "butt" }, l);
  if (sub === "positivos") svg("circle", { cx: sx(0), cy: 17, r: 5, fill: tk("--tc-panel"), stroke: color, "stroke-width": 2 }, l);
  if (sub === "noPositivos") svg("circle", { cx: sx(0), cy: 17, r: 5, fill: color }, l);
  texto(l, sx(0), 33, "0", { "text-anchor": "middle", "font-size": 10, fill: tk("--tc-tenue") });
  return l;
}

function panelTopologias() {
  const raiz = html("div", { class: "tc-panel" });
  const tk = lector(raiz);
  const botonesTop = Object.entries(TOPOLOGIAS).map(([k, t]) => html("button", { "data-top": k, "aria-pressed": "false" }, t.nombre));
  const selFn = html("select", { "aria-label": "Función" },
    ...Object.entries(FUNCIONES).map(([k, f]) => html("option", { value: k }, f.nombre)));
  const tabla = html("div", { style: "overflow-x:auto" });
  const veredicto = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  const explicacion = html("div", { class: "tc-pista" });
  let top = "discreta";

  raiz.append(
    html("h4", {}, "ℝ → {0, 1} · la misma fórmula, cuatro topologías en la llegada"),
    html("div", { class: "tc-controles" }, html("label", {}, "Función", selFn), ...botonesTop),
    tabla, veredicto, explicacion,
  );

  function dibujar() {
    const fn = selFn.value;
    botonesTop.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.top === top)));
    const filas = TOPOLOGIAS[top].abiertos.map((U) => {
      const sub = preimagen(fn, U);
      const ok = esAbierto(sub);
      return html("tr", {},
        html("td", {}, conjunto(U)),
        html("td", {}, NOMBRE_SUB[sub]),
        html("td", { style: "min-width:200px" }, rectaConSubconjunto(tk, sub)),
        html("td", {}, ok ? "✓ abierta" : "✗ no abierta"));
    });
    tabla.replaceChildren(html("table", { class: "tc-tabla" },
      html("tr", {}, html("th", {}, "abierto U de la llegada"), html("th", {}, `${fn}⁻¹(U)`), html("th", {}, "sobre la recta"), html("th", {}, "¿abierta en ℝ?")),
      ...filas));
    const cont = esContinua(fn, top);
    veredicto.className = "tc-veredicto " + (cont ? "si" : "no");
    veredicto.innerHTML = cont
      ? `<b>${fn} es continua</b> hacia {0, 1} con la topología ${TOPOLOGIAS[top].nombre.toLowerCase()}: todas las preimágenes de abiertos son abiertas.`
      : `<b>${fn} no es continua</b> hacia {0, 1} con la topología ${TOPOLOGIAS[top].nombre.toLowerCase()}: hay un abierto cuya preimagen, (−∞, 0], no es abierta (el 0 no tiene margen hacia la derecha).`;
    const textos = {
      discreta: "Con la discreta, todo se puede observar, incluso «salió 0». Pero «x ≤ 0» no se confirma con mediciones finitas.",
      sierpinski1: fn === "f"
        ? "El giro: con {1} abierto, «1» significa <i>confirmado</i> y «0» <i>todavía no</i>. El test «x > 0» es semidecidible: si x > 0, una medición finita lo confirma; si x = 0, ninguna lo descarta. El salto está permitido justo en la dirección en que se puede observar."
        : "Con {1} abierto, g pide confirmar «x ≤ 0» en tiempo finito, y eso es imposible: ninguna medición finita distingue 0 de un positivo muy chico.",
      sierpinski0: fn === "f"
        ? "Ahora el observable es «salió 0», que pide confirmar «x ≤ 0»: imposible con precisión finita."
        : "Es la imagen especular del giro: g vale 0 exactamente en los positivos, y «x > 0» sí se confirma. La continuidad depende de qué valor se declara observable.",
      trivial: "Con la trivial no se observa nada: toda función hacia un espacio trivial es continua.",
    };
    explicacion.innerHTML = textos[top];
  }
  botonesTop.forEach((b) => b.addEventListener("click", () => { top = b.dataset.top; dibujar(); }));
  selFn.addEventListener("change", dibujar);
  alCambiarTema(dibujar);
  dibujar();
  return raiz;
}

// ------------------------------------------------------------------ la pieza

export function continuidad() {
  const raiz = html("div", { class: "tc-pieza" });
  raiz.append(
    html("div", { class: "tc-titulo" }, "Continuidad: tirar hacia atrás", html("small", {}, "la continuidad es una relación entre dos topologías")),
    html("div", { class: "tc-grilla" }, html("div", { class: "tc-ancho" }, panelEpsDelta()), html("div", { class: "tc-ancho" }, panelTopologias())),
  );
  return raiz;
}
