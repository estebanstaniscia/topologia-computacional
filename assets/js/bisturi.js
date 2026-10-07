// G2 · Bisturí topológico (sección I.2, estación 1; spec §5, G2).
//
// Un espacio dibujado como grafo geométrico (puntos unidos por segmentos). Cortar un
// punto p y contar las componentes de X ∖ {p}: c(p). Los homeomorfismos conservan c, así
// que la «firma» (cuántos puntos tienen cada valor de c) es un invariante. El comparador
// pone dos espacios lado a lado y decide si la firma los distingue; si no (el círculo y
// la θ), prueba un invariante local: cuántas ramas se juntan en cada punto.
// Las componentes se cuentan con union-find, como en I.1.

import { svg, html, texto, lector, alCambiarTema, puntoSVG } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";
import { GLIFOS, glifosDe } from "./tipografia.js";

// ------------------------------------------------------------------ lógica pura

const clave = (p) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;

/** Grafo geométrico a partir de polilíneas: los puntos repetidos se identifican. */
export function construirEspacio(polilineas) {
  const puntos = [], indice = new Map(), aristas = [];
  const id = (p) => {
    const k = clave(p);
    if (!indice.has(k)) { indice.set(k, puntos.length); puntos.push(p); }
    return indice.get(k);
  };
  for (const linea of polilineas) {
    for (let i = 0; i + 1 < linea.length; i++) {
      const a = id(linea[i]), b = id(linea[i + 1]);
      if (a !== b) aristas.push([a, b]);
    }
  }
  return { puntos, aristas };
}

function unionFind(n) {
  const padre = Array.from({ length: n }, (_, i) => i);
  const find = (i) => { while (padre[i] !== i) { padre[i] = padre[padre[i]]; i = padre[i]; } return i; };
  return { find, union: (a, b) => { padre[find(a)] = find(b); } };
}

/**
 * Cortar un punto: `{tipo: "vertice", v}` o `{tipo: "arista", e}` (un punto interior de
 * la arista e). Devuelve {c, comp}: la cantidad de componentes de X ∖ {p} y, para cada
 * vértice, su componente (−1 para el vértice cortado). En el corte de una arista, los dos
 * pedacitos quedan pegados a sus extremos.
 */
export function cortar(esp, corte) {
  const n = esp.puntos.length, uf = unionFind(n);
  esp.aristas.forEach(([a, b], k) => {
    if (corte.tipo === "arista" && k === corte.e) return;
    if (corte.tipo === "vertice" && (a === corte.v || b === corte.v)) return;
    uf.union(a, b);
  });
  const raices = new Map(), comp = [];
  for (let v = 0; v < n; v++) {
    if (corte.tipo === "vertice" && v === corte.v) { comp.push(-1); continue; }
    const r = uf.find(v);
    if (!raices.has(r)) raices.set(r, raices.size);
    comp.push(raices.get(r));
  }
  return { c: raices.size, comp };
}

const grados = (esp) => {
  const g = esp.puntos.map(() => 0);
  for (const [a, b] of esp.aristas) { g[a]++; g[b]++; }
  return g;
};

/**
 * La firma: grupos de puntos con su c. Los vértices de grado ≠ 2 son puntos especiales
 * (finitos); los demás puntos forman arcos con infinitos puntos (c igual en todo el arco).
 * Devuelve {grupos: [{c, cantidad, tipo}], porC: Map c → cantidad (Infinity si hay
 * infinitos)} y la lista de grados de los puntos especiales (el invariante local).
 */
export function firma(esp) {
  const g = grados(esp);
  const grupos = [];
  // puntos especiales
  g.forEach((d, v) => {
    if (d === 2) return;
    grupos.push({ c: cortar(esp, { tipo: "vertice", v }).c, cantidad: 1, tipo: d === 1 ? "extremo" : `se juntan ${d} ramas` });
  });
  // arcos: componentes del grafo de aristas al sacar los vértices especiales
  const especiales = new Set(g.map((d, v) => (d !== 2 ? v : -1)).filter((v) => v >= 0));
  const m = esp.aristas.length, uf = unionFind(m), porVertice = new Map();
  esp.aristas.forEach(([a, b], k) => {
    for (const v of [a, b]) {
      if (especiales.has(v)) continue;
      if (porVertice.has(v)) uf.union(k, porVertice.get(v)); else porVertice.set(v, k);
    }
  });
  const arcos = new Map();
  for (let k = 0; k < m; k++) { const r = uf.find(k); if (!arcos.has(r)) arcos.set(r, k); }
  for (const k of arcos.values()) grupos.push({ c: cortar(esp, { tipo: "arista", e: k }).c, cantidad: Infinity, tipo: "interior de un arco" });
  // agrupar por c
  const porC = new Map();
  for (const { c, cantidad } of grupos) porC.set(c, (porC.get(c) ?? 0) + cantidad);
  const local = g.filter((d) => d !== 2).sort((a, b) => a - b);
  return { grupos, porC, local };
}

const firmaComoTexto = (porC) => [...porC.entries()].sort((a, b) => a[0] - b[0])
  .map(([c, k]) => `${k === Infinity ? "∞" : k} con c = ${c}`).join(" · ");

/** Compara dos espacios: ¿la firma los distingue?, ¿y el invariante local? */
export function comparar(e1, e2) {
  const f1 = firma(e1), f2 = firma(e2);
  const igualFirma = firmaComoTexto(f1.porC) === firmaComoTexto(f2.porC);
  const igualLocal = f1.local.join(",") === f2.local.join(",");
  return { igualFirma, igualLocal, f1, f2 };
}

/**
 * Forma reducida: se borran los vértices de grado 2 (no cambian la topología) y queda un
 * multigrafo cuyos vértices son los puntos especiales (grado ≠ 2) y cuyas aristas son los
 * arcos entre ellos (puede haber lazos y aristas repetidas). Las componentes sin puntos
 * especiales son círculos sueltos. Devuelve {n, arcos: [[u, v]], circulos}.
 */
export function formaReducida(esp) {
  const g = grados(esp);
  const ady = esp.puntos.map(() => []);
  esp.aristas.forEach(([a, b], k) => { ady[a].push([b, k]); ady[b].push([a, k]); });
  const especiales = g.map((d, v) => (d !== 2 ? v : -1)).filter((v) => v >= 0);
  const indice = new Map(especiales.map((v, i) => [v, i]));
  const usada = new Uint8Array(esp.aristas.length), arcos = [];
  for (const s of especiales) {
    for (const [w, k] of ady[s]) {
      if (usada[k]) continue;
      usada[k] = 1;
      let actual = w;
      while (!indice.has(actual)) {
        const sig = ady[actual].find(([, k2]) => !usada[k2]);
        usada[sig[1]] = 1;
        actual = sig[0];
      }
      arcos.push([indice.get(s), indice.get(actual)]);
    }
  }
  // lo que queda son ciclos de vértices de grado 2: un círculo por componente
  let circulos = 0;
  esp.aristas.forEach(([a], k) => {
    if (usada[k]) return;
    circulos++;
    const pila = [a];
    while (pila.length) {
      const v = pila.pop();
      for (const [w, k2] of ady[v]) if (!usada[k2]) { usada[k2] = 1; pila.push(w); }
    }
  });
  return { n: especiales.length, arcos, circulos };
}

function* permutaciones(n) {
  const p = Array.from({ length: n }, (_, i) => i), c = new Array(n).fill(0);
  yield p;
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      const j = i % 2 ? c[i] : 0;
      [p[j], p[i]] = [p[i], p[j]];
      yield p;
      c[i]++; i = 0;
    } else { c[i] = 0; i++; }
  }
}

/**
 * Clase de homeomorfismo de un grafo geométrico: una forma canónica de su forma reducida
 * (el mínimo, sobre todas las permutaciones de los puntos especiales, de la lista ordenada
 * de arcos). Dos grafos son homeomorfos si y solo si sus formas reducidas son isomorfas,
 * así que este invariante es completo, a diferencia de la firma. Fuerza bruta: alcanza
 * para letras (a lo sumo 6 puntos especiales).
 */
export function claseHomeo(esp) {
  const { n, arcos, circulos } = formaReducida(esp);
  if (n > 9) throw new Error("demasiados puntos especiales para la fuerza bruta");
  let mejor = null;
  for (const p of permutaciones(n)) {
    const k = arcos.map(([u, v]) => (p[u] <= p[v] ? `${p[u]}-${p[v]}` : `${p[v]}-${p[u]}`)).sort().join(",");
    if (mejor === null || k < mejor) mejor = k;
  }
  return `${n}|${circulos}|${mejor}`;
}

// ------------------------------------------------------------------ la galería

const circulo = (cx, cy, r, n = 36, desde = 0) =>
  Array.from({ length: n + 1 }, (_, k) => { const t = desde + (2 * Math.PI * k) / n; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; });
const segmento = (a, b, n = 12) => Array.from({ length: n + 1 }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);

export const ESPACIOS = {
  intervalo: { nombre: "Intervalo [0, 1]", polilineas: [segmento([-150, 0], [150, 0], 24)] },
  circulo: { nombre: "Círculo S¹", polilineas: [circulo(0, 0, 120)] },
  ocho: { nombre: "Ocho ∞", polilineas: [circulo(-80, 0, 80, 32, 0), circulo(80, 0, 80, 32, Math.PI)] },
  y: { nombre: "Letra Y (trípode)", polilineas: [segmento([0, 0], [0, -140]), segmento([0, 0], [-110, 100]), segmento([0, 0], [110, 100])] },
  theta: { nombre: "Letra θ", polilineas: [circulo(0, 0, 120, 36, 0), segmento([-120, 0], [120, 0], 12)] },
  x: { nombre: "Letra X (cruz)", polilineas: [segmento([-120, -120], [120, 120], 16), segmento([-120, 120], [120, -120], 16)] },
  piruleta: { nombre: "Círculo con cola (P)", polilineas: [circulo(0, 50, 80, 32, -Math.PI / 2), segmento([0, -30], [0, -150], 10)] },
};

// ------------------------------------------------------------------ la pieza

const W = 340, H = 300;

function panel(tk, inicial, alCortar) {
  let claveEsp = inicial, esp = construirEspacio(ESPACIOS[inicial].polilineas), corte = null, previo = null;
  const sel = html("select", { "aria-label": "Espacio", style: "max-width:100%" }, ...Object.entries(ESPACIOS).map(([k, e]) => html("option", { value: k, selected: k === inicial }, e.nombre)));
  const lienzo = svg("svg", { viewBox: `${-W / 2} ${-H / 2} ${W} ${H}`, role: "img", "aria-label": "Espacio dibujado; pasá el mouse para previsualizar un corte y hacé clic para cortar", style: "cursor:crosshair" });
  const raiz = html("div", { class: "tc-g-tarjeta", style: "padding:8px" }, sel, lienzo);

  const sy = (y) => -y; // y hacia arriba
  function cercano([mx, my]) {
    const p = [mx, -my];
    let mejor = null, dmin = 14;
    esp.puntos.forEach((q, v) => {
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const g = esp.aristas.filter(([a, b]) => a === v || b === v).length;
      if (g !== 2 && d < 12 && d < dmin + 4) { dmin = d - 4; mejor = { tipo: "vertice", v, punto: q }; }
    });
    if (mejor) return mejor;
    esp.aristas.forEach(([a, b], e) => {
      const A = esp.puntos[a], B = esp.puntos[b], dx = B[0] - A[0], dy = B[1] - A[1];
      const t = Math.max(0.15, Math.min(0.85, ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / (dx * dx + dy * dy)));
      const q = [A[0] + t * dx, A[1] + t * dy], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < dmin) { dmin = d; mejor = { tipo: "arista", e, punto: q }; }
    });
    return mejor;
  }

  function dibujar() {
    lienzo.replaceChildren();
    const activo = previo ?? corte;
    const res = activo ? cortar(esp, activo) : null;
    const colorDe = (v) => (res ? (res.comp[v] < 0 ? tk("--tc-tenue") : tk(`--tc-c${(res.comp[v] % 7) + 1}`)) : tk("--tc-tinta"));
    esp.aristas.forEach(([a, b], e) => {
      const A = esp.puntos[a], B = esp.puntos[b];
      if (activo?.tipo === "arista" && activo.e === e) {
        // la arista cortada: dos pedacitos, cada uno del color de su extremo
        const q = activo.punto;
        const corr = (P, Q) => [P[0] + 0.86 * (Q[0] - P[0]), P[1] + 0.86 * (Q[1] - P[1])];
        const qa = corr(A, q), qb = corr(B, q);
        svg("line", { x1: A[0], y1: sy(A[1]), x2: qa[0], y2: sy(qa[1]), stroke: colorDe(a), "stroke-width": 4, "stroke-linecap": "round" }, lienzo);
        svg("line", { x1: B[0], y1: sy(B[1]), x2: qb[0], y2: sy(qb[1]), stroke: colorDe(b), "stroke-width": 4, "stroke-linecap": "round" }, lienzo);
        return;
      }
      const col = activo?.tipo === "vertice" && (a === activo.v || b === activo.v) ? colorDe(a === activo.v ? b : a) : colorDe(a);
      svg("line", { x1: A[0], y1: sy(A[1]), x2: B[0], y2: sy(B[1]), stroke: col, "stroke-width": 4, "stroke-linecap": "round" }, lienzo);
    });
    if (activo) {
      const q = activo.punto;
      svg("circle", { cx: q[0], cy: sy(q[1]), r: 7, fill: tk("--tc-panel"), stroke: tk("--tc-rechazo"), "stroke-width": 2.5 }, lienzo);
      texto(lienzo, q[0] + 10, sy(q[1]) - 10, "p", { "font-size": 15, "font-style": "italic", "font-weight": 700, fill: tk("--tc-rechazo") });
      texto(lienzo, -W / 2 + 10, -H / 2 + 22, `c(p) = ${res.c}`, { "font-size": 18, "font-weight": 700, fill: tk("--tc-tinta") });
    }
  }

  lienzo.addEventListener("pointermove", (ev) => { previo = cercano(puntoSVG(lienzo, ev)); dibujar(); });
  lienzo.addEventListener("pointerleave", () => { previo = null; dibujar(); });
  lienzo.addEventListener("click", (ev) => { corte = cercano(puntoSVG(lienzo, ev)); previo = null; dibujar(); alCortar(); });
  sel.addEventListener("change", () => { claveEsp = sel.value; esp = construirEspacio(ESPACIOS[claveEsp].polilineas); corte = null; dibujar(); alCortar(); });

  return {
    raiz, dibujar,
    esp: () => esp, clave: () => claveEsp, corte: () => corte,
    poner(k) { claveEsp = k; sel.value = k; esp = construirEspacio(ESPACIOS[k].polilineas); corte = null; dibujar(); },
  };
}

// ------------------------------------------------------------------ modo tipográfico

/** Nombres de las clases, a partir de un representante de cada una. */
const NOMBRES_CLASE = [
  ["I", "arco"], ["O", "círculo"], ["T", "trípode (como la Y)"], ["P", "círculo con una cola"],
  ["A", "círculo con dos colas en puntos distintos"], ["Q", "círculo con dos colas en el mismo punto"],
  ["B", "ocho (dos lazos en un punto)"], ["H", "H (dos trípodes unidos)"], ["X", "cruz (cuatro ramas)"],
];
const claseDeGlifo = new Map();
const claseDe = (ch) => {
  if (!claseDeGlifo.has(ch)) claseDeGlifo.set(ch, claseHomeo(construirEspacio(GLIFOS[ch])));
  return claseDeGlifo.get(ch);
};
const nombreClase = new Map(NOMBRES_CLASE.map(([ch, nombre]) => [claseDe(ch), nombre]));

/** Agrupa los caracteres de una palabra por clase de homeomorfismo (en orden de aparición). */
export function agruparPorClase(palabra) {
  const grupos = new Map();
  for (const ch of glifosDe(palabra)) {
    const k = claseDe(ch);
    if (!grupos.has(k)) grupos.set(k, { clave: k, nombre: nombreClase.get(k) ?? "otra clase", letras: [] });
    if (!grupos.get(k).letras.includes(ch)) grupos.get(k).letras.push(ch);
  }
  return [...grupos.values()];
}

function modoTipografico(tk, alCambiar) {
  const entrada = html("input", { type: "text", value: "TOPOLOGIA", maxlength: 36, "aria-label": "Palabra", style: "flex:1;min-width:10em;font-size:1rem;padding:4px 8px" });
  const atajo = (rotulo, valor) => {
    const b = html("button", { type: "button" }, rotulo);
    b.addEventListener("click", () => { entrada.value = valor; dibujar(); });
    return b;
  };
  const barra = html("div", { style: "display:flex;gap:6px;flex-wrap:wrap;align-items:center" },
    entrada, atajo("A–Z", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), atajo("0–9", "0123456789"), atajo("Q y 4", "Q4 AR"));
  const lienzo = svg("svg", { role: "img", "aria-label": "La palabra dibujada como esqueletos de letras, coloreadas por clase de homeomorfismo", style: "width:100%;height:auto" });
  const raiz = html("div", { class: "tc-g-tarjeta", style: "padding:8px;display:grid;gap:8px" }, barra, lienzo);
  const leyenda = html("div", { class: "tc-g-tarjeta" });

  function dibujar() {
    const letras = glifosDe(entrada.value);
    const grupos = agruparPorClase(entrada.value);
    const colorDe = (ch) => tk(`--tc-c${(grupos.findIndex((g) => g.clave === claseDe(ch)) % 9) + 1}`);
    const porFila = 13, paso = 82, filas = Math.max(1, Math.ceil(letras.length / porFila));
    const ancho = Math.max(4, Math.min(letras.length, porFila)) * paso;
    lienzo.setAttribute("viewBox", `-20 -112 ${ancho + 20} ${filas * 140}`);
    lienzo.replaceChildren();
    letras.forEach((ch, i) => {
      const ox = (i % porFila) * paso, oy = Math.floor(i / porFila) * 140;
      const g = svg("g", { transform: `translate(${ox} ${oy})` }, lienzo);
      const esp = construirEspacio(GLIFOS[ch]);
      const color = colorDe(ch);
      for (const [a, b] of esp.aristas) {
        const A = esp.puntos[a], B = esp.puntos[b];
        svg("line", { x1: A[0], y1: -A[1], x2: B[0], y2: -B[1], stroke: color, "stroke-width": 8, "stroke-linecap": "round" }, g);
      }
      // los puntos donde se juntan 3 o más ramas: los que la topología ve
      const gr = esp.puntos.map(() => 0);
      for (const [a, b] of esp.aristas) { gr[a]++; gr[b]++; }
      esp.puntos.forEach((q, v) => { if (gr[v] >= 3) svg("circle", { cx: q[0], cy: -q[1], r: 6.5, fill: tk("--tc-panel"), stroke: tk("--tc-tinta"), "stroke-width": 2.5 }, g); });
    });
    if (!letras.length) texto(lienzo, 0, -40, "Escribí letras o dígitos", { "font-size": 22, fill: tk("--tc-tenue") });
    leyenda.replaceChildren(html("h4", {}, `${grupos.length} ${grupos.length === 1 ? "clase" : "clases"} de homeomorfismo`),
      ...grupos.map((g) => html("div", { style: "margin:6px 0" },
        html("div", { style: `color:${colorDe(g.letras[0])};font-weight:700;font-size:1.1rem;letter-spacing:0.12em;overflow-wrap:anywhere` }, g.letras.join(" ")),
        html("div", { style: "font-size:0.85rem;color:var(--tc-tenue)" }, g.nombre))));
    alCambiar?.();
  }
  entrada.addEventListener("input", dibujar);
  return { raiz, leyenda, dibujar, palabra: () => entrada.value, poner(v) { entrada.value = v; dibujar(); } };
}

export function bisturi({ izquierda = "circulo", derecha = "theta", id = "g2" } = {}) {
  const comparador = html("div", { style: "display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 240px), 1fr));gap:8px" });
  const escena = html("div", { style: "padding:8px" }, comparador);
  const tk = lector(escena);
  const veredicto = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  const tablas = html("div", {});
  const actualizar = () => {
    const { igualFirma, igualLocal, f1, f2 } = comparar(A.esp(), B.esp());
    const nombre = (p) => ESPACIOS[p.clave()].nombre;
    veredicto.className = "tc-veredicto " + (igualFirma && igualLocal ? "" : "si");
    veredicto.innerHTML = !igualFirma
      ? `<b>Distinguidos por la firma.</b> No hay ningún homeomorfismo entre ${nombre(A)} y ${nombre(B)}: un homeomorfismo conservaría cuántos puntos tienen cada c.`
      : !igualLocal
        ? `<b>Misma firma, pero el invariante local los distingue.</b> La firma no es un invariante completo. En ${f1.local.some((d) => d >= 3) ? nombre(A) : nombre(B)} hay puntos donde se juntan ${Math.max(...f1.local, ...f2.local, 0)} ramas (una vecindad chica sin el punto tiene ${Math.max(...f1.local, ...f2.local, 0)} pedazos); en el otro, no.`
        : `<b>La firma y el invariante local coinciden.</b> Ninguno de los dos invariantes los distingue (${nombre(A) === nombre(B) ? "es el mismo espacio" : "¿serán homeomorfos?"}).`;
    const tabla = (f, p) => html("div", { class: "tc-g-tarjeta" }, html("h4", {}, `Firma de ${ESPACIOS[p.clave()].nombre}`),
      html("div", { class: "tc-g-filas" }, ...f.grupos.flatMap((g) => [html("span", {}, `${g.cantidad === Infinity ? "∞ puntos" : g.cantidad === 1 ? "1 punto" : g.cantidad + " puntos"} (${g.tipo})`), html("b", {}, `c = ${g.c}`)])));
    tablas.replaceChildren(tabla(f1, A), tabla(f2, B));
    gadget?.refrescarLentes();
  };
  let gadget = null;
  const A = panel(tk, izquierda, () => actualizar());
  const B = panel(tk, derecha, () => actualizar());
  comparador.append(A.raiz, B.raiz);
  const T = modoTipografico(tk, () => gadget?.refrescarLentes());
  T.raiz.hidden = true; T.leyenda.hidden = true;
  escena.append(T.raiz);
  const lecturasComparar = html("div", { style: "display:contents" }, veredicto, tablas);
  const lecturas = html("div", { style: "display:contents" }, lecturasComparar, T.leyenda);
  const ponerModo = (m) => {
    const tipo = m === "tipografico";
    comparador.hidden = tipo; lecturasComparar.hidden = tipo;
    T.raiz.hidden = !tipo; T.leyenda.hidden = !tipo;
    if (tipo) T.dibujar();
  };

  gadget = montarGadget({
    id,
    titulo: "Bisturí topológico",
    subtitulo: "cortá un punto y contá los pedazos",
    escenario: escena,
    lecturas,
    modos: [{ id: "comparar", nombre: "Comparar" }, { id: "tipografico", nombre: "Tipográfico" }],
    alCambiarModo: ponerModo,
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p>Un homeomorfismo \\(h: X \\to Y\\) se restringe a un homeomorfismo \\(X \\setminus \\{p\\} \\to Y \\setminus \\{h(p)\\}\\), y los homeomorfismos conservan la cantidad de componentes. Por eso \\(c(p)\\) se conserva, y con él la <b>firma</b>. El intervalo tiene puntos con \\(c = 2\\) y el círculo no: no son homeomorfos (el argumento del libro, p. 9).</p>" },
      { id: "prog", nombre: "Programador", contenido: () => "<p>Un <b>invariante</b> es una función que da lo mismo en objetos equivalentes: para probar que dos objetos <i>no</i> son equivalentes, alcanza con uno que los distinga. Acá el espacio es un grafo y \\(c(p)\\) se calcula con el <b>union-find de I.1</b>: se procesan todas las aristas salvo la cortada (o las del vértice cortado) y se cuentan las raíces.</p><pre>uf = UnionFind(n)\nfor e in aristas:\n    if not toca_el_corte(e):\n        uf.union(*e)\nc = uf.componentes</pre><p class='tc-pista'>Moraleja: un invariante distingue, pero no siempre identifica (círculo vs. θ).</p>" },
      { id: "tipo", nombre: "Tipógrafo", contenido: () => "<p>El modo <b>Tipográfico</b> usa un invariante <b>completo</b>: se borran los puntos de grado 2 (que la topología no ve) y queda un multigrafo con los puntos especiales y los arcos entre ellos. Dos letras son homeomorfas si y solo si esos multigrafos son isomorfos. Sorpresas: <b>A ≅ R</b> y <b>Q ≅ 4</b> son, las dos, un círculo con dos colas, pero en A las colas salen de puntos distintos y en Q del mismo: no son homeomorfas entre sí. La respuesta depende de la tipografía: en Helvetica la pierna de la K sale del brazo y K ≅ H; en otras fuentes sale del asta y K ≅ X.</p>" },
      { id: "geo", nombre: "Geómetra", contenido: () => "<p>El homeomorfismo permite estirar, doblar y deformar, pero no cortar ni pegar. Por eso la forma no importa (el círculo y el cuadrado son lo mismo) y la cantidad de pedazos al cortar sí.</p>" },
    ],
    reiniciar: () => { A.poner(izquierda); B.poner(derecha); T.poner("TOPOLOGIA"); actualizar(); },
    queVeo: () => [{ elemento: A.raiz.querySelector("svg"), texto: "pasá el mouse: previsualiza el corte" }, { elemento: B.raiz.querySelector("select"), texto: "cambiá el espacio a comparar" }],
  });
  alCambiarTema(() => { A.dibujar(); B.dibujar(); T.dibujar(); });
  A.dibujar(); B.dibujar(); actualizar();
  return gadget.raiz;
}
