// La ola y la tijera (sección I.1, pieza 3.5 de la spec).
//
// La demostración de la Proposición 1 (⇐) ES un algoritmo: una ola que parte de
// un vértice y avanza arista por arista. Cuando se detiene, deja un testigo:
// - si mojó todo, las aristas por las que avanzó forman un ÁRBOL GENERADOR
//   (certificado de conexidad);
// - si no, lo mojado (U) y lo seco (W) forman una SEPARACIÓN: ninguna arista
//   cruza (certificado de desconexión).
// La tijera completa el cuadro: quitar una arista del árbol lo parte en dos
// (corte fundamental); agregar una arista de fuera cierra un ciclo (ciclo
// fundamental). La lógica es la de tcomp.conexidad; vértices 0..n-1, etiquetas 1..n.

import { svg, html, texto, lector, alCambiarTema, puntoSVG } from "./comun.js";

// ------------------------------------------------------------------ lógica pura

const clave = (u, v) => (u < v ? `${u}-${v}` : `${v}-${u}`);

export function adyacencia(n, aristas) {
  const ady = Array.from({ length: n }, () => []);
  for (const [u, v] of aristas) { ady[u].push(v); ady[v].push(u); }
  return ady;
}

/** BFS por frentes: frentes[k] = vértices a distancia k; arbol = aristas [padre, hijo]. */
export function ola(n, aristas, origen = 0) {
  const ady = adyacencia(n, aristas);
  const visto = Array(n).fill(false);
  visto[origen] = true;
  const frentes = [[origen]];
  const arbol = [];
  for (;;) {
    const siguiente = [];
    for (const u of frentes.at(-1)) {
      for (const v of ady[u]) {
        if (!visto[v]) { visto[v] = true; arbol.push([u, v]); siguiente.push(v); }
      }
    }
    if (!siguiente.length) return { frentes, arbol };
    frentes.push(siguiente);
  }
}

/** Veredicto con testigo: {conexo: true, arbol} o {conexo: false, U, W}. */
export function certificar(n, aristas, origen = 0) {
  const { frentes, arbol } = ola(n, aristas, origen);
  const mojados = new Set(frentes.flat());
  if (mojados.size === n) return { conexo: true, arbol, frentes };
  const U = [...mojados].sort((a, b) => a - b);
  const W = [...Array(n).keys()].filter((v) => !mojados.has(v));
  return { conexo: false, U, W, arbol, frentes };
}

/** Aristas de `aristas` que cruzan de U al complemento. */
export function cruzan(aristas, U) {
  const enU = new Set(U);
  return aristas.filter(([u, v]) => enU.has(u) !== enU.has(v));
}

/** Ciclo fundamental de [u, v] respecto del árbol: lista de vértices u … v u. */
export function cicloFundamental(n, arbol, [u, v]) {
  const ady = adyacencia(n, arbol);
  const padre = new Map([[u, u]]);
  const cola = [u];
  while (cola.length) {
    const x = cola.shift();
    for (const y of ady[x]) if (!padre.has(y)) { padre.set(y, x); cola.push(y); }
  }
  if (!padre.has(v)) return null;
  const camino = [v];
  while (camino.at(-1) !== u) camino.push(padre.get(camino.at(-1)));
  return camino.reverse().concat([u]);
}

/** Corte fundamental: las dos partes del árbol sin la arista [u, v]. */
export function corteFundamental(n, arbol, [u, v]) {
  const resto = arbol.filter(([a, b]) => clave(a, b) !== clave(u, v));
  const lado = ola(n, resto, u).frentes.flat().sort((a, b) => a - b);
  const enLado = new Set(lado);
  return [lado, [...Array(n).keys()].filter((x) => !enLado.has(x))];
}

// ------------------------------------------------------------------ escenarios

const W = 640, H = 380;

function rejilla(filas, cols) {
  const pts = [], ar = [];
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
    pts.push([90 + c * ((W - 180) / (cols - 1)), 70 + f * ((H - 140) / (filas - 1))]);
    const i = f * cols + c;
    if (c < cols - 1) ar.push([i, i + 1]);
    if (f < filas - 1) ar.push([i, i + cols]);
  }
  return { puntos: pts, aristas: ar };
}

export const ESCENARIOS_OLA = {
  islas: {
    nombre: "Dos islas",
    puntos: [[110, 110], [210, 70], [250, 180], [150, 240], [80, 330], [420, 90], [560, 130], [520, 270], [400, 250]],
    aristas: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [8, 5], [5, 7]],
  },
  puente: {
    nombre: "Dos racimos y un puente",
    puntos: [[90, 100], [200, 70], [230, 190], [110, 230], [170, 320], [420, 120], [550, 80], [580, 210], [470, 260], [540, 330]],
    aristas: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [3, 4], [2, 5], [5, 6], [6, 7], [7, 8], [8, 5], [8, 9], [7, 9]],
  },
  rejilla: { nombre: "Rejilla 4 × 5", ...rejilla(4, 5) },
  vacio: { nombre: "Hoja en blanco (dibujá vos)", puntos: [], aristas: [] },
};

// ------------------------------------------------------------------ la pieza

export function olaTijera({ escenario = "islas", lanzar = false } = {}) {
  const raiz = html("div", { class: "tc-pieza" });
  const tk = lector(raiz);
  let reducirMov = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const selEsc = html("select", { "aria-label": "Grafo precargado" },
    ...Object.entries(ESCENARIOS_OLA).map(([k, e]) => html("option", { value: k, selected: k === escenario }, e.nombre)));
  const bOla = html("button", { class: "tc-primario" }, "Lanzar la ola");
  const bEditar = html("button", { "aria-pressed": "true" }, "Editar");
  const bTijera = html("button", { "aria-pressed": "false" }, "✂ Tijera");
  const bLimpiar = html("button", { title: "Borrar la ola y los resaltados" }, "Limpiar");
  const lienzo = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label": "Grafo editable. La ola moja los vértices por frentes desde el origen; al terminar muestra un árbol generador o una separación.",
  });
  const veredicto = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  const pista = html("div", { class: "tc-pista" });

  raiz.append(
    html("div", { class: "tc-titulo" }, "La ola y la tijera", html("small", {}, "todo veredicto viene con un testigo")),
    html("div", { class: "tc-panel tc-controles" },
      html("label", {}, "Grafo", selEsc), bOla, bEditar, bTijera, bLimpiar),
    html("div", { class: "tc-panel", style: "margin-top:10px" }, lienzo,
      html("div", { class: "tc-leyenda" },
        html("span", {}, html("i", { class: "tc-mancha", style: "background:var(--tc-mojado)" }), "mojado (U)"),
        html("span", {}, html("i", { class: "tc-mancha", style: "background:var(--tc-seco)" }), "seco (W)"),
        html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-enlace)" }), "aristas por las que avanzó la ola (árbol)"),
        html("span", {}, html("i", { class: "tc-muestra punteada", style: "border-color:var(--tc-tinta)" }), "arista cortada ✂"))),
    html("div", { style: "margin-top:10px" }, veredicto, pista),
  );

  // estado
  let puntos = [], aristas = [], origen = 0;
  let modo = "editar";
  let mojado = null;       // Map vértice -> distancia, durante/después de la ola
  let arbolVisible = [];   // aristas del árbol reveladas hasta ahora
  let resultado = null;    // certificado completo de la última ola
  let resaltado = null;    // {tipo: "corte"|"ciclo", ...}
  let reloj = null;
  let arrastre = null;     // {desde, x, y} mientras se dibuja una arista

  const n = () => puntos.length;
  const nombre = (v) => String(v + 1);

  function cargar() {
    const e = ESCENARIOS_OLA[selEsc.value];
    puntos = e.puntos.map((p) => p.slice());
    aristas = e.aristas.map((a) => a.slice());
    origen = 0;
    limpiar();
  }

  function limpiar() {
    clearInterval(reloj); reloj = null;
    mojado = null; arbolVisible = []; resultado = null; resaltado = null;
    if (modo === "tijera") ponerModo("editar");
    dibujar();
  }

  function ponerModo(m) {
    modo = m;
    bEditar.setAttribute("aria-pressed", String(m === "editar"));
    bTijera.setAttribute("aria-pressed", String(m === "tijera"));
    resaltado = null;
    dibujar();
  }

  function lanzarOla() {
    if (!n()) return;
    clearInterval(reloj);
    reloj = null;
    resaltado = null;
    resultado = certificar(n(), aristas, origen);
    const { frentes, arbol } = resultado;
    mojado = new Map();
    arbolVisible = [];
    let k = 0;
    const avanzar = () => {
      for (const v of frentes[k]) mojado.set(v, k);
      arbolVisible = arbol.filter(([, hijo]) => mojado.has(hijo));
      k++;
      if (k >= frentes.length) { clearInterval(reloj); reloj = null; }
      dibujar();
    };
    if (reducirMov) { while (k < frentes.length) avanzar(); return; }
    avanzar();
    if (reloj === null && k < frentes.length) reloj = setInterval(avanzar, 650);
  }

  // -------------------------------------------------------------- dibujo
  function dibujar() {
    lienzo.replaceChildren();
    const fin = resultado && mojado && mojado.size === resultado.frentes.flat().length && !reloj;
    const enArbol = new Set(arbolVisible.map(([a, b]) => clave(a, b)));
    const lado = resaltado?.tipo === "corte" ? new Set(resaltado.U) : null;
    const enCiclo = new Set();
    if (resaltado?.tipo === "ciclo") {
      const c = resaltado.ciclo;
      for (let i = 0; i + 1 < c.length; i++) enCiclo.add(clave(c[i], c[i + 1]));
    }
    const cruzanCorte = lado ? new Set(cruzan(aristas, resaltado.U).map(([a, b]) => clave(a, b))) : null;

    // aristas (con un trazo ancho invisible para poder hacer clic)
    aristas.forEach(([u, v]) => {
      const [a, b] = [puntos[u], puntos[v]];
      const k = clave(u, v);
      const esCortada = resaltado?.tipo === "corte" && k === clave(...resaltado.arista);
      let color = tk("--tc-tenue"), ancho = 2, guion = null;
      if (enArbol.has(k)) { color = tk("--tc-enlace"); ancho = 4.5; }
      if (enCiclo.size) {
        if (enCiclo.has(k)) { color = tk("--tc-enlace"); ancho = 5.5; } else { color = tk("--tc-linea"); }
      }
      if (cruzanCorte?.has(k) && !esCortada) { color = tk("--tc-tinta"); ancho = 3.5; }
      if (esCortada) { color = tk("--tc-tinta"); ancho = 2.5; guion = "6 6"; }
      if (resaltado?.tipo === "ciclo" && k === clave(...resaltado.arista)) guion = "10 5";
      svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, "stroke-width": ancho, "stroke-dasharray": guion, "stroke-linecap": "round" }, lienzo);
      if (esCortada) {
        texto(lienzo, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 6, "✂", { "text-anchor": "middle", "font-size": 20, fill: tk("--tc-tinta") });
      }
      const golpe = svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "transparent", "stroke-width": 16, style: "cursor:pointer" }, lienzo);
      golpe.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); clicArista([u, v]); });
    });

    if (arrastre) {
      const p = puntos[arrastre.desde];
      svg("line", { x1: p[0], y1: p[1], x2: arrastre.x, y2: arrastre.y, stroke: tk("--tc-acento"), "stroke-width": 2, "stroke-dasharray": "4 4" }, lienzo);
    }

    // vértices
    puntos.forEach(([x, y], v) => {
      let relleno = tk("--tc-panel"), borde = tk("--tc-tenue");
      if (lado) {
        const enU = lado.has(v);
        relleno = enU ? tk("--tc-mojado-suave") : tk("--tc-seco-suave");
        borde = enU ? tk("--tc-mojado") : tk("--tc-seco");
      } else if (mojado?.has(v)) {
        relleno = tk("--tc-mojado-suave"); borde = tk("--tc-mojado");
      } else if (fin && !resultado.conexo) {
        relleno = tk("--tc-seco-suave"); borde = tk("--tc-seco");
      }
      const g = svg("g", { style: "cursor:pointer" }, lienzo);
      if (v === origen && modo === "editar") {
        svg("circle", { cx: x, cy: y, r: 21, fill: "none", stroke: tk("--tc-mojado"), "stroke-width": 2, "stroke-dasharray": "3 3" }, g);
      }
      svg("circle", { cx: x, cy: y, r: 15, fill: relleno, stroke: borde, "stroke-width": 2.5 }, g);
      texto(g, x, y + 5, nombre(v), { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: tk("--tc-tinta") });
      if (mojado?.has(v) && !lado) {
        texto(g, x + 19, y - 16, `d=${mojado.get(v)}`, { "font-size": 11, fill: tk("--tc-mojado") });
      }
      g.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); empezarArrastre(v, ev); });
      g.addEventListener("dblclick", (ev) => { ev.stopPropagation(); borrarVertice(v); });
    });

    actualizarTexto(fin);
  }

  function actualizarTexto(fin) {
    veredicto.className = "tc-veredicto";
    if (resaltado?.tipo === "corte") {
      const [u, v] = resaltado.arista;
      const otras = cruzan(aristas, resaltado.U).filter(([a, b]) => clave(a, b) !== clave(u, v));
      veredicto.innerHTML = `<b>Corte fundamental de (${nombre(u)}, ${nombre(v)}).</b> Sin esa arista, el árbol se parte en exactamente dos piezas: ` +
        `U = {${resaltado.U.map(nombre).join(", ")}} y W = {${resaltado.W.map(nombre).join(", ")}}. Era un <i>puente</i> del árbol. ` +
        (otras.length
          ? `En el grafo, además, cruzan ${otras.length} arista${otras.length > 1 ? "s" : ""} más (en negro): el grafo sin (${nombre(u)}, ${nombre(v)}) sigue conexo, y cada una de esas aristas tiene a (${nombre(u)}, ${nombre(v)}) en su ciclo fundamental.`
          : `Ninguna otra arista del grafo cruza: (${nombre(u)}, ${nombre(v)}) es un puente también del grafo, y (U, W) es una separación de G sin ella.`);
      return;
    }
    if (resaltado?.tipo === "ciclo") {
      const c = resaltado.ciclo;
      veredicto.innerHTML = `<b>Ciclo fundamental de (${nombre(resaltado.arista[0])}, ${nombre(resaltado.arista[1])}).</b> Agregarla al árbol cierra exactamente un ciclo: ` +
        `${c.map(nombre).join(" → ")}, de longitud ${c.length - 1}. Es la arista que union-find habría <i>rechazado</i>.`;
      return;
    }
    if (!resultado) {
      veredicto.innerHTML = n()
        ? `<b>¿Es conexo?</b> Elegí el origen (clic en un vértice) y lanzá la ola.`
        : `<b>Hoja en blanco.</b> Clic en el fondo para crear vértices; arrastrá de un vértice a otro para unirlos.`;
    } else if (!fin) {
      veredicto.innerHTML = `<b>La ola avanza…</b> ${mojado.size} de ${n()} vértices mojados.`;
    } else if (resultado.conexo) {
      veredicto.classList.add("si");
      veredicto.innerHTML = `<b>Conexo.</b> Certificado: un árbol generador de ${resultado.arbol.length} = n − 1 aristas (en verde). ` +
        `Cualquiera lo verifica sin confiar en el algoritmo: son aristas del grafo, son n − 1, y conectan los ${n()} vértices.`;
    } else {
      veredicto.classList.add("no");
      const nCruzan = cruzan(aristas, resultado.U).length;
      veredicto.innerHTML = `<b>Desconexo.</b> Certificado: la separación U = {${resultado.U.map(nombre).join(", ")}} (mojado), ` +
        `W = {${resultado.W.map(nombre).join(", ")}} (seco). Aristas que cruzan de U a W: <b>${nCruzan}</b>. Verificarlo es recorrer las aristas una vez.`;
    }
    pista.textContent = modo === "tijera"
      ? "Tijera: clic en una arista verde (del árbol) para cortarla; clic en una arista gris (fuera del árbol) para ver su ciclo fundamental."
      : "Editar: clic en el fondo agrega un vértice · arrastrar entre vértices agrega una arista · clic en una arista la borra · doble clic en un vértice lo borra · clic en un vértice lo elige como origen.";
  }

  // -------------------------------------------------------------- interacción
  function invalidar() {
    clearInterval(reloj); reloj = null;
    mojado = null; arbolVisible = []; resultado = null; resaltado = null;
  }

  function clicArista(a) {
    if (modo === "tijera") {
      if (!resultado?.conexo) return;
      const enArbol = resultado.arbol.some(([x, y]) => clave(x, y) === clave(...a));
      if (enArbol) {
        const [U, Wl] = corteFundamental(n(), resultado.arbol, a);
        resaltado = { tipo: "corte", arista: a, U, W: Wl };
      } else {
        resaltado = { tipo: "ciclo", arista: a, ciclo: cicloFundamental(n(), resultado.arbol, a) };
      }
      dibujar();
      return;
    }
    aristas = aristas.filter(([x, y]) => clave(x, y) !== clave(...a));
    invalidar();
    dibujar();
  }

  function empezarArrastre(v, ev) {
    if (modo !== "editar") return;
    const [x, y] = puntoSVG(lienzo, ev);
    arrastre = { desde: v, x, y, movido: false };
    lienzo.setPointerCapture?.(ev.pointerId);
  }

  lienzo.addEventListener("pointermove", (ev) => {
    if (!arrastre) return;
    const [x, y] = puntoSVG(lienzo, ev);
    if (Math.hypot(x - puntos[arrastre.desde][0], y - puntos[arrastre.desde][1]) > 18) arrastre.movido = true;
    arrastre.x = x; arrastre.y = y;
    dibujar();
  });

  lienzo.addEventListener("pointerup", (ev) => {
    if (!arrastre) return;
    const [x, y] = puntoSVG(lienzo, ev);
    const destino = puntos.findIndex(([px, py]) => Math.hypot(px - x, py - y) < 20);
    const { desde, movido } = arrastre;
    arrastre = null;
    if (!movido) {
      origen = desde; // clic simple: elegir origen
      invalidar();
    } else if (destino >= 0 && destino !== desde && !aristas.some(([a, b]) => clave(a, b) === clave(desde, destino))) {
      aristas.push([desde, destino]);
      invalidar();
    }
    dibujar();
  });

  lienzo.addEventListener("pointerdown", (ev) => {
    if (modo !== "editar") return;
    const [x, y] = puntoSVG(lienzo, ev);
    if (puntos.some(([px, py]) => Math.hypot(px - x, py - y) < 34)) return;
    puntos.push([Math.max(20, Math.min(W - 20, x)), Math.max(20, Math.min(H - 20, y))]);
    invalidar();
    dibujar();
  });

  function borrarVertice(v) {
    if (modo !== "editar") return;
    puntos.splice(v, 1);
    aristas = aristas.filter(([a, b]) => a !== v && b !== v).map(([a, b]) => [a > v ? a - 1 : a, b > v ? b - 1 : b]);
    origen = Math.min(origen, Math.max(0, n() - 1));
    invalidar();
    dibujar();
  }

  selEsc.addEventListener("change", cargar);
  bOla.addEventListener("click", lanzarOla);
  bLimpiar.addEventListener("click", limpiar);
  bEditar.addEventListener("click", () => ponerModo("editar"));
  bTijera.addEventListener("click", () => {
    if (!resultado || !resultado.conexo) {
      veredicto.className = "tc-veredicto";
      veredicto.innerHTML = "<b>La tijera necesita un árbol generador.</b> Lanzá la ola sobre un grafo conexo primero (por ejemplo, «Dos racimos y un puente» o la rejilla).";
      return;
    }
    ponerModo("tijera");
  });
  alCambiarTema(dibujar);
  cargar();
  if (lanzar) {
    const previo = reducirMov;
    reducirMov = true; // la primera ola se muestra completa, sin animar
    lanzarOla();
    reducirMov = previo;
  }
  return raiz;
}
