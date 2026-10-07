// Utilidades compartidas por las piezas interactivas del sitio.
// Las piezas no dependen de librerías externas: SVG y DOM a mano, para que el
// dibujo sea literalmente el mecanismo (y para poder testear la lógica con node).

export const NS = "http://www.w3.org/2000/svg";

/** Crea un elemento SVG con atributos y, opcionalmente, lo cuelga de `padre`. */
export function svg(tag, attrs = {}, padre = null) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  if (padre) padre.appendChild(e);
  return e;
}

/** Crea un elemento HTML. `hijos` puede incluir strings y nodos. */
export function html(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  for (const h of hijos.flat()) if (h !== null && h !== undefined) e.append(h);
  return e;
}

/** Texto dentro de un SVG. */
export function texto(padre, x, y, contenido, attrs = {}) {
  const t = svg("text", { x, y, ...attrs }, padre);
  t.textContent = contenido;
  return t;
}

/** Lee un token de color (`--tc-...`) tal como resuelve en `elemento` (respeta el modo oscuro). */
export function token(elemento, nombre) {
  return getComputedStyle(elemento).getPropertyValue(nombre).trim();
}

/**
 * Devuelve una función que lee tokens desde `elemento`. Mientras la pieza todavía
 * no está insertada en la página (OJS la dibuja antes de montarla), los lee del
 * <body>, que define los mismos tokens.
 */
export function lector(elemento) {
  return (nombre) => token(elemento.isConnected ? elemento : document.body, nombre);
}

/**
 * Llama a `fn` cada vez que el sitio cambia entre modo claro y oscuro
 * (Quarto alterna las clases `quarto-light` / `quarto-dark` del <body>).
 */
export function alCambiarTema(fn) {
  const obs = new MutationObserver(() => fn());
  obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

/** Coordenadas de un evento de puntero en el sistema del viewBox de un SVG. */
export function puntoSVG(lienzo, evento) {
  const p = lienzo.createSVGPoint();
  p.x = evento.clientX;
  p.y = evento.clientY;
  const q = p.matrixTransform(lienzo.getScreenCTM().inverse());
  return [q.x, q.y];
}

/** Generador pseudoaleatorio determinista (LCG), para escenarios reproducibles. */
export function aleatorio(semilla) {
  let s = semilla >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

/** Marcador de flecha reutilizable dentro de un SVG. */
export function flecha(lienzo, id, color) {
  const defs = svg("defs", {}, lienzo);
  const m = svg("marker", {
    id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 8, markerHeight: 8,
    markerUnits: "userSpaceOnUse", orient: "auto-start-reverse",
  }, defs);
  svg("path", { d: "M0,0 L10,5 L0,10 z", fill: color }, m);
  return `url(#${id})`;
}

let contadorIds = 0;
/** Id único para marcadores y etiquetas aria dentro de la página. */
export function idUnico(prefijo) {
  contadorIds += 1;
  return `${prefijo}-${contadorIds}`;
}

/**
 * Tipografía matemática de un elemento insertado dinámicamente. Usa MathJax.typeset
 * (sincrónico, como Quarto): en MathJax 4 la variante con promesa puede quedar colgada.
 * Reintenta mientras el elemento no esté en la página o MathJax no haya cargado.
 */
export function tipografiar(elemento, intentos = 40) {
  const mj = globalThis.MathJax;
  if (!elemento.isConnected || typeof mj?.typeset !== "function") {
    if (intentos > 0) setTimeout(() => tipografiar(elemento, intentos - 1), 250);
    return;
  }
  try {
    mj.typesetClear?.([elemento]);
    mj.typeset([elemento]);
  } catch {
    if (intentos > 0) setTimeout(() => tipografiar(elemento, intentos - 1), 250);
  }
}
