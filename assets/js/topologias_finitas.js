// Taller de topologías finitas (sección I.1, pieza 3.6 de la spec).
//
// Un conjunto de 2 o 3 puntos y el retículo de sus subconjuntos. El lector marca
// cuáles son abiertos; la pieza chequea en vivo los tres axiomas (y dice cuál falla
// y con qué conjuntos), dibuja el preorden de especialización como grafo dirigido
// y decide si el espacio es conexo y conexo por caminos (en espacios finitos
// coinciden). Un subconjunto de X se representa como una máscara de bits.

import { svg, html, texto, lector, alCambiarTema, flecha, idUnico } from "./comun.js";

// ------------------------------------------------------------------ lógica pura

export const NOMBRES = ["a", "b", "c"];

export const nombreConjunto = (m, n) => {
  const els = [];
  for (let i = 0; i < n; i++) if (m & (1 << i)) els.push(NOMBRES[i]);
  return els.length ? `{${els.join(", ")}}` : "∅";
};

const popcount = (m) => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

/**
 * Chequea los tres axiomas para la familia `abiertos` (Set de máscaras) sobre n puntos.
 * Devuelve la lista de fallas: {axioma: 1|2|3, conjuntos: [...], falta: máscara}.
 */
export function fallas(abiertos, n) {
  const X = (1 << n) - 1;
  const out = [];
  if (!abiertos.has(0)) out.push({ axioma: 1, conjuntos: [], falta: 0 });
  if (!abiertos.has(X)) out.push({ axioma: 1, conjuntos: [], falta: X });
  const lista = [...abiertos].sort((p, q) => p - q);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const [U, V] = [lista[i], lista[j]];
      if (!abiertos.has(U & V)) out.push({ axioma: 2, conjuntos: [U, V], falta: U & V });
      if (!abiertos.has(U | V)) out.push({ axioma: 3, conjuntos: [U, V], falta: U | V });
    }
  }
  return out;
}

export const esTopologia = (abiertos, n) => fallas(abiertos, n).length === 0;

/** La topología más chica que contiene a la familia: cerrar por ∩ y ∪ y agregar ∅, X. */
export function generada(abiertos, n) {
  const T = new Set([0, (1 << n) - 1, ...abiertos]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const U of [...T]) for (const V of [...T]) {
      for (const W of [U & V, U | V]) if (!T.has(W)) { T.add(W); cambio = true; }
    }
  }
  return T;
}

/** Preorden de especialización: x ≤ y si todo abierto que contiene a x contiene a y. */
export function especializacion(abiertos, n) {
  const rel = [];
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
    if (x === y) continue;
    let ok = true;
    for (const U of abiertos) if ((U >> x) & 1 && !((U >> y) & 1)) { ok = false; break; }
    if (ok) rel.push([x, y]);
  }
  return rel;
}

/** Conexo por la definición: no hay un abierto U no trivial cuyo complemento sea abierto. */
export function clopenNoTrivial(abiertos, n) {
  const X = (1 << n) - 1;
  for (const U of abiertos) if (U !== 0 && U !== X && abiertos.has(X & ~U)) return U;
  return null;
}

/**
 * Conexo por caminos, vía el preorden: si x ≤ y, el camino que vale x en [0, 1/2]
 * y y en (1/2, 1] es continuo (como el camino que salta de 3.3). Así que el espacio
 * es conexo por caminos si el grafo de comparabilidad es conexo.
 */
export function conexoPorCaminos(abiertos, n) {
  const rel = especializacion(abiertos, n);
  const visto = new Set([0]);
  const pila = [0];
  while (pila.length) {
    const x = pila.pop();
    for (const [p, q] of rel) {
      for (const [u, v] of [[p, q], [q, p]]) if (u === x && !visto.has(v)) { visto.add(v); pila.push(v); }
    }
  }
  return visto.size === n;
}

/** Todas las permutaciones de 0..n-1. */
function permutaciones(n) {
  if (n === 1) return [[0]];
  return permutaciones(n - 1).flatMap((p) => Array.from({ length: n }, (_, k) => [...p.slice(0, k), n - 1, ...p.slice(k)]));
}

const aplicar = (m, perm) => { let r = 0; perm.forEach((d, i) => { if (m & (1 << i)) r |= 1 << d; }); return r; };

/** Forma canónica de una topología a menos de homeomorfismo (renombrar los puntos). */
export function canonica(abiertos, n) {
  let mejor = null;
  for (const p of permutaciones(n)) {
    const clave = [...abiertos].map((U) => aplicar(U, p)).sort((a, b) => a - b).join(",");
    if (mejor === null || clave < mejor) mejor = clave;
  }
  return mejor;
}

/** Todas las topologías sobre n puntos (familias que contienen ∅ y X y son cerradas). */
export function todasLasTopologias(n) {
  const X = (1 << n) - 1;
  const intermedios = [];
  for (let m = 1; m < X; m++) intermedios.push(m);
  const res = [];
  for (let s = 0; s < 1 << intermedios.length; s++) {
    const T = new Set([0, X]);
    intermedios.forEach((m, k) => { if (s & (1 << k)) T.add(m); });
    if (esTopologia(T, n)) res.push(T);
  }
  return res;
}

/** Catálogo de clases de homeomorfismo: forma canónica -> número de clase (1..). */
export function catalogo(n) {
  const clases = [];
  for (const T of todasLasTopologias(n)) {
    const c = canonica(T, n);
    if (!clases.includes(c)) clases.push(c);
  }
  // orden: por cantidad de abiertos, así la trivial es la 1 y la discreta la última
  clases.sort((p, q) => p.split(",").length - q.split(",").length || (p < q ? -1 : 1));
  return new Map(clases.map((c, k) => [c, k + 1]));
}

// ------------------------------------------------------------------ escenarios

export const ESCENARIOS_TOP = {
  sierpinski: { nombre: "Sierpiński (2 puntos)", n: 2, abiertos: [0, 0b10, 0b11] },
  trivial3: { nombre: "Trivial (3 puntos)", n: 3, abiertos: [0, 0b111] },
  discreta3: { nombre: "Discreta (3 puntos)", n: 3, abiertos: [0, 1, 2, 3, 4, 5, 6, 7] },
  cadena: { nombre: "Una cadena a ≤ b ≤ c", n: 3, abiertos: [0, 0b100, 0b110, 0b111] },
  dosmundos: { nombre: "Dos mundos {a} | {b, c}", n: 3, abiertos: [0, 0b001, 0b110, 0b111] },
  rota: { nombre: "Casi: falta una unión", n: 3, abiertos: [0, 0b001, 0b010, 0b111] },
};

// ------------------------------------------------------------------ la pieza

const W = 360, H = 300;

export function tallerTopologias({ escenario = "sierpinski" } = {}) {
  const raiz = html("div", { class: "tc-pieza" });
  const tk = lector(raiz);
  const catalogos = { 2: catalogo(2), 3: catalogo(3) };
  const totales = { 2: todasLasTopologias(2).length, 3: todasLasTopologias(3).length };

  const selEsc = html("select", { "aria-label": "Topología precargada" },
    ...Object.entries(ESCENARIOS_TOP).map(([k, e]) => html("option", { value: k, selected: k === escenario }, e.nombre)));
  const bN = html("button", { title: "Cambiar entre 2 y 3 puntos" }, "");
  const bCompletar = html("button", { title: "Agregar lo que falta: la topología más chica que contiene lo marcado" }, "Completar a una topología");
  const reticulo = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Retículo de subconjuntos: clic en un subconjunto para marcarlo o desmarcarlo como abierto." });
  const preorden = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Preorden de especialización: una flecha de x a y si todo abierto que contiene a x contiene a y." });
  const veredicto = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  const indicadores = html("div", { class: "tc-pista" });

  raiz.append(
    html("div", { class: "tc-titulo" }, "Taller de topologías finitas", html("small", {}, "marcá los abiertos; los axiomas se chequean solos")),
    html("div", { class: "tc-panel tc-controles" }, html("label", {}, "Cargar", selEsc), bN, bCompletar),
    html("div", { class: "tc-grilla", style: "margin-top:10px" },
      html("div", { class: "tc-panel" }, html("h4", {}, "Subconjuntos de X (clic: abierto / no abierto)"), reticulo,
        html("div", { class: "tc-leyenda" },
          html("span", {}, html("i", { class: "tc-mancha", style: "background:var(--tc-acento)" }), "abierto"),
          html("span", {}, html("i", { class: "tc-mancha", style: "border:2px dashed var(--tc-rechazo)" }), "falta para cumplir un axioma"))),
      html("div", { class: "tc-panel" }, html("h4", {}, "Preorden de especialización"), preorden,
        html("div", { class: "tc-leyenda" }, html("span", {}, "x → y: todo abierto que contiene a x contiene a y")))),
    html("div", { style: "margin-top:10px" }, veredicto, indicadores),
  );

  let n = 2;
  let abiertos = new Set();

  function cargar() {
    const e = ESCENARIOS_TOP[selEsc.value];
    n = e.n;
    abiertos = new Set(e.abiertos);
    dibujar();
  }

  // posiciones del retículo: filas por tamaño (Hasse del conjunto de partes)
  function posiciones() {
    const filas = Array.from({ length: n + 1 }, () => []);
    for (let m = 0; m < 1 << n; m++) filas[popcount(m)].push(m);
    const pos = {};
    filas.forEach((fila, k) => fila.forEach((m, j) => {
      pos[m] = [W / 2 + (j - (fila.length - 1) / 2) * (n === 3 ? 108 : 130), H - 36 - (k * (H - 72)) / n];
    }));
    return pos;
  }

  function dibujar() {
    bN.textContent = n === 2 ? "Pasar a 3 puntos" : "Pasar a 2 puntos";
    const pos = posiciones();
    const F = fallas(abiertos, n);
    const faltan = new Set(F.map((f) => f.falta));
    const culpables = new Set(F.flatMap((f) => f.conjuntos));

    reticulo.replaceChildren();
    for (let m = 0; m < 1 << n; m++) for (let i = 0; i < n; i++) {
      const M = m | (1 << i);
      if (M !== m) svg("line", { x1: pos[m][0], y1: pos[m][1], x2: pos[M][0], y2: pos[M][1], stroke: tk("--tc-linea"), "stroke-width": 1.5 }, reticulo);
    }
    for (let m = 0; m < 1 << n; m++) {
      const [x, y] = pos[m];
      const abierto = abiertos.has(m);
      const g = svg("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-pressed": String(abierto), "aria-label": `${nombreConjunto(m, n)}: ${abierto ? "abierto" : "no abierto"}` }, reticulo);
      svg("rect", {
        x: x - 40, y: y - 16, width: 80, height: 32, rx: 9,
        fill: abierto ? tk("--tc-acento") : tk("--tc-panel"),
        stroke: faltan.has(m) ? tk("--tc-rechazo") : culpables.has(m) ? tk("--tc-camino") : abierto ? tk("--tc-acento") : tk("--tc-tenue"),
        "stroke-width": faltan.has(m) || culpables.has(m) ? 3 : 1.5,
        "stroke-dasharray": faltan.has(m) ? "5 3" : null,
      }, g);
      texto(g, x, y + 5, nombreConjunto(m, n), { "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: abierto ? "#fff" : tk("--tc-tinta") });
      const alternar = () => { abierto ? abiertos.delete(m) : abiertos.add(m); dibujar(); };
      g.addEventListener("click", alternar);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); } });
    }

    preorden.replaceChildren();
    const centro = [W / 2, H / 2 + 6];
    const R = 95;
    const pp = Array.from({ length: n }, (_, i) => [centro[0] + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n + (n === 2 ? Math.PI / 2 : 0)), centro[1] + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n + (n === 2 ? Math.PI / 2 : 0))]);
    if (esTopologia(abiertos, n)) {
      const marca = flecha(preorden, idUnico("fl"), tk("--tc-tinta"));
      const rel = especializacion(abiertos, n);
      const hay = new Set(rel.map(([p, q]) => `${p}-${q}`));
      for (const [p, q] of rel) {
        const [a, b] = [pp[p], pp[q]];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
        const doble = hay.has(`${q}-${p}`); // x ≤ y e y ≤ x: indistinguibles; separar las flechas
        const ox = doble ? -uy * 7 : 0, oy = doble ? ux * 7 : 0;
        svg("line", { x1: a[0] + ux * 24 + ox, y1: a[1] + uy * 24 + oy, x2: b[0] - ux * 26 + ox, y2: b[1] - uy * 26 + oy, stroke: tk("--tc-tinta"), "stroke-width": 2, "marker-end": marca }, preorden);
      }
    } else {
      texto(preorden, W / 2, 26, "(solo tiene sentido para una topología)", { "text-anchor": "middle", "font-size": 12, fill: tk("--tc-tenue") });
    }
    pp.forEach(([x, y], i) => {
      svg("circle", { cx: x, cy: y, r: 20, fill: tk("--tc-panel"), stroke: tk("--tc-tinta"), "stroke-width": 2 }, preorden);
      texto(preorden, x, y + 6, NOMBRES[i], { "text-anchor": "middle", "font-size": 17, "font-weight": 700, fill: tk("--tc-tinta") });
    });

    actualizarTexto(F);
  }

  function actualizarTexto(F) {
    if (F.length) {
      veredicto.className = "tc-veredicto no";
      const f = F[0];
      const nc = (m) => nombreConjunto(m, n);
      const motivo = f.axioma === 1
        ? `falla el axioma 1: ${nc(f.falta)} tiene que ser abierto («siempre» y «nunca» se observan sin medir).`
        : f.axioma === 2
          ? `falla el axioma 2: ${nc(f.conjuntos[0])} y ${nc(f.conjuntos[1])} son abiertos, pero su intersección ${nc(f.falta)} no («Y» de dos observaciones).`
          : `falla el axioma 3: ${nc(f.conjuntos[0])} y ${nc(f.conjuntos[1])} son abiertos, pero su unión ${nc(f.falta)} no («O» de dos observaciones).`;
      veredicto.innerHTML = `<b>No es una topología:</b> ${motivo}` + (F.length > 1 ? ` (Hay ${F.length} fallas en total; las punteadas en rojo son lo que falta.)` : "");
      indicadores.textContent = "«Completar» agrega exactamente lo que falta: es la topología generada por lo que marcaste.";
      return;
    }
    veredicto.className = "tc-veredicto si";
    const clase = catalogos[n].get(canonica(abiertos, n));
    const total = catalogos[n].size;
    const U = clopenNoTrivial(abiertos, n);
    const conexo = U === null;
    const caminos = conexoPorCaminos(abiertos, n);
    veredicto.innerHTML = `<b>Es una topología</b> con ${abiertos.size} abiertos: una de las ${totales[n]} topologías sobre ${n} puntos, ` +
      `en la clase de homeomorfismo ${clase} de ${total} (renombrar los puntos no cambia la clase).`;
    indicadores.innerHTML = (conexo
      ? "<b>Conexo:</b> ningún abierto no trivial tiene complemento abierto. "
      : `<b>No conexo:</b> ${nombreConjunto(U, n)} y su complemento son abiertos (un clopen, una propiedad decidible). `) +
      (caminos
        ? "<b>Conexo por caminos:</b> el grafo de especialización conecta todo (cada flecha x → y da un camino que salta, como el de Sierpiński)."
        : "<b>No conexo por caminos:</b> el grafo de especialización tiene más de una pieza.") +
      " En espacios finitos las dos nociones siempre coinciden.";
  }

  selEsc.addEventListener("change", cargar);
  bN.addEventListener("click", () => {
    n = n === 2 ? 3 : 2;
    abiertos = new Set([0, (1 << n) - 1]);
    dibujar();
  });
  bCompletar.addEventListener("click", () => { abiertos = generada(abiertos, n); dibujar(); });
  alCambiarTema(dibujar);
  cargar();
  return raiz;
}
