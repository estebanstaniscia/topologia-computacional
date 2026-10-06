// Laboratorio de union-find (sección I.1, pieza 3.4 de la spec).
//
// Tres vistas sincronizadas del MISMO estado: el grafo (aristas aceptadas,
// rechazadas y pendientes), el bosque de up-trees y el arreglo parent/size.
// La simulación es idéntica a tcomp.union_find (convenciones del libro), pero
// con las etiquetas 1..n del libro: el índice 0 de los arreglos no se usa.

import { svg, html, texto, lector, alCambiarTema, flecha, idUnico, aleatorio } from "./comun.js";

export const ESTRATEGIAS = {
  ingenua: "Básica",
  tamano: "Unión por tamaño",
  completa: "Tamaño + compresión",
};

const SLOTS = 7; // colores categóricos disponibles para componentes (--tc-c1..c7)

// ------------------------------------------------------------------ escenarios

export function opsAleatorias(n, semilla, cantidad = 14) {
  const rnd = aleatorio(semilla);
  const vistas = new Set();
  const ops = [];
  let intentos = 0;
  while (ops.length < cantidad && intentos++ < 1000) {
    const a = 1 + Math.floor(rnd() * n);
    const b = 1 + Math.floor(rnd() * n);
    const clave = Math.min(a, b) + "-" + Math.max(a, b);
    if (a === b || vistas.has(clave)) continue;
    vistas.add(clave);
    ops.push(["U", a, b]);
  }
  return ops;
}

export const ESCENARIOS = {
  ej1: {
    nombre: "Ejemplo 1: n = 4 (un triángulo y una cola)",
    n: 4,
    ops: [["U", 1, 2], ["U", 2, 3], ["U", 1, 3], ["U", 3, 4]],
  },
  ej2: {
    nombre: "Ejemplo 2: n = 8 (las dos mejoras en una llamada)",
    n: 8,
    ops: [["U", 1, 2], ["U", 3, 4], ["U", 1, 3], ["U", 5, 6], ["U", 1, 5], ["F", 5]],
  },
  peor: {
    nombre: "Peor caso de la básica: Union(1, k)",
    n: 8,
    ops: [2, 3, 4, 5, 6, 7, 8].map((k) => ["U", 1, k]).concat([["F", 1], ["F", 1]]),
  },
  binomial: {
    nombre: "Árbol binomial (n = 8) y Find de la hoja",
    n: 8,
    ops: [["U", 1, 2], ["U", 3, 4], ["U", 5, 6], ["U", 7, 8], ["U", 1, 3], ["U", 5, 7], ["U", 1, 5], ["F", 1], ["F", 1]],
  },
  aleatorio: { nombre: "Grafo aleatorio (n = 10)", n: 10, ops: null },
};

// ------------------------------------------------------------------ simulación

/**
 * Precalcula todos los estados de la simulación: avanzar y retroceder es solo
 * mover un índice. Cada estado tiene la foto de parent/size, los contadores, lo
 * que hizo el paso (caminos, compresiones, enlace) y su narración.
 */
export function simular(n, ops, estrategia) {
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const size = Array(n + 1).fill(1);
  const color = Array(n + 1).fill(0); // color de la componente cuya raíz es i (0 = sin color)
  let b0 = n, b1 = 0, saltos = 0;
  const foto = (extra) => ({
    parent: parent.slice(), size: size.slice(), color: color.slice(), b0, b1, saltos, ...extra,
  });
  const estados = [foto({
    op: null, idx: -1, caminos: [], comprimidos: [], enlace: null, rechazo: false,
    texto: `Estado inicial: ${n} conjuntos unitarios. Cada raíz se apunta a sí misma (parent[i] = i).`,
  })];

  function find(i) {
    const camino = [i];
    while (parent[camino[camino.length - 1]] !== camino[camino.length - 1]) {
      camino.push(parent[camino[camino.length - 1]]);
    }
    const raiz = camino[camino.length - 1];
    saltos += camino.length - 1;
    const comprimidos = [];
    if (estrategia === "completa") {
      for (const v of camino.slice(0, -1)) {
        if (parent[v] !== raiz) { parent[v] = raiz; comprimidos.push(v); }
      }
    }
    return { raiz, camino, comprimidos };
  }

  const describir = (f, quien) => {
    let t = f.camino.length > 1
      ? `Find(${quien}) sube ${f.camino.join(" → ")} y devuelve la raíz ${f.raiz}`
      : `Find(${quien}) = ${f.raiz} (ya es raíz)`;
    if (f.comprimidos.length) t += `; a la vuelta comprime ${f.comprimidos.map((v) => `${v}→${f.raiz}`).join(", ")}`;
    return t + ".";
  };

  const colorLibre = () => {
    const usados = new Set();
    for (let r = 1; r <= n; r++) if (parent[r] === r && color[r]) usados.add(color[r]);
    for (let c = 1; c <= SLOTS; c++) if (!usados.has(c)) return c;
    return 0;
  };

  ops.forEach((op, idx) => {
    if (op[0] === "F") {
      const f = find(op[1]);
      estados.push(foto({
        op, idx, caminos: [f.camino], comprimidos: f.comprimidos, enlace: null, rechazo: false,
        texto: describir(f, op[1]) + (f.comprimidos.length ? "" : " No hay nada que comprimir."),
      }));
      return;
    }
    const [, i, j] = op;
    const fi = find(i);
    const fj = find(j);
    let x = fi.raiz, y = fj.raiz;
    let t = `Arista (${i}, ${j}). ${describir(fi, i)} ${describir(fj, j)} `;
    let enlace = null, intercambio = false;
    const rechazo = x === y;
    if (rechazo) {
      b1++;
      t += `Mismas raíces: ${i} y ${j} ya estaban conectados. Arista rechazada: cierra un ciclo (β₁ = ${b1}).`;
    } else {
      const sx = size[x], sy = size[y];
      if (estrategia !== "ingenua" && sx > sy) { [x, y] = [y, x]; intercambio = true; }
      // el color sigue a la componente: sobrevive el de la raíz que queda como nombre
      if (!color[y]) color[y] = color[x] || colorLibre();
      color[x] = 0;
      parent[x] = y;
      size[y] += size[x];
      b0--;
      enlace = [x, y];
      if (intercambio) {
        t += `size[${y}] = ${size[y] - size[x]} > size[${x}] = ${size[x]}: se intercambian x ↔ y, así el árbol chico (${x}) cuelga del grande (${y}). `;
      } else if (estrategia !== "ingenua") {
        t += `size[${x}] = ${sx} ≤ size[${y}] = ${sy}: sin intercambio${sx === sy ? " (empate: x cuelga de y, como en el libro)" : ""}. `;
      }
      t += `Union: parent[${x}] = ${y}. Quedan ${b0} conjunto${b0 === 1 ? "" : "s"}.`;
    }
    estados.push(foto({
      op, idx, caminos: [fi.camino, fj.camino], comprimidos: fi.comprimidos.concat(fj.comprimidos),
      enlace, rechazo, intercambio, texto: t,
    }));
  });
  return estados;
}

export function altura(estado, n) {
  let h = 0;
  for (let i = 1; i <= n; i++) {
    let d = 0, r = i;
    while (estado.parent[r] !== r) { r = estado.parent[r]; d++; }
    h = Math.max(h, d);
  }
  return h;
}

export function raizDe(estado, i) {
  while (estado.parent[i] !== i) i = estado.parent[i];
  return i;
}

// ------------------------------------------------------------------ dibujo

function colorComponente(tk, estado, v) {
  const c = estado.color[raizDe(estado, v)];
  return c ? tk(`--tc-c${c}`) : null;
}

function dibujarGrafo(lienzo, tk, n, ops, estados, k) {
  lienzo.replaceChildren();
  const W = 400, H = 300, R = 112, cx = W / 2, cy = H / 2 + 4;
  const pos = (i) => [
    cx + R * Math.cos((2 * Math.PI * (i - 1)) / n - Math.PI / 2),
    cy + R * Math.sin((2 * Math.PI * (i - 1)) / n - Math.PI / 2),
  ];
  const st = estados[k];
  const estadoArista = new Map();
  for (let s = 1; s <= k; s++) {
    const S = estados[s];
    if (S.op && S.op[0] === "U") estadoArista.set(S.idx, S.rechazo ? "rechazada" : "aceptada");
  }
  ops.forEach((op, idx) => {
    if (op[0] !== "U") return;
    const [a, b] = [pos(op[1]), pos(op[2])];
    const est = estadoArista.get(idx);
    const actual = st.idx === idx;
    const colorAcept = colorComponente(tk, st, op[1]) || tk("--tc-aceptada");
    svg("line", {
      x1: a[0], y1: a[1], x2: b[0], y2: b[1],
      stroke: est === "aceptada" ? colorAcept : est === "rechazada" ? tk("--tc-rechazo") : tk("--tc-linea"),
      "stroke-width": actual ? 5 : est ? 3 : 1.5,
      "stroke-dasharray": est === "rechazada" ? "7 5" : est ? null : "2 5",
      "stroke-linecap": "round",
    }, lienzo);
    if (est === "rechazada") {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      svg("circle", { cx: mx, cy: my, r: 8, fill: tk("--tc-panel"), stroke: tk("--tc-rechazo"), "stroke-width": 1.5 }, lienzo);
      texto(lienzo, mx, my + 4, "×", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: tk("--tc-rechazo") });
    }
  });
  for (let i = 1; i <= n; i++) {
    const [x, y] = pos(i);
    const c = colorComponente(tk, st, i);
    svg("circle", { cx: x, cy: y, r: 15, fill: tk("--tc-panel") }, lienzo);
    svg("circle", {
      cx: x, cy: y, r: 15, fill: c || tk("--tc-panel"), "fill-opacity": c ? 0.28 : 1,
      stroke: c || tk("--tc-tenue"), "stroke-width": 2,
    }, lienzo);
    texto(lienzo, x, y + 5, String(i), { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: tk("--tc-tinta") });
  }
}

function dibujarBosque(lienzo, tk, n, st) {
  lienzo.replaceChildren();
  const hijos = Array.from({ length: n + 1 }, () => []);
  const raices = [];
  for (let i = 1; i <= n; i++) (st.parent[i] === i ? raices : hijos[st.parent[i]]).push(i);
  const P = {};
  let hoja = 0, maxD = 0;
  const ubicar = (v, d) => {
    maxD = Math.max(maxD, d);
    if (!hijos[v].length) { P[v] = [hoja++, d]; return; }
    hijos[v].forEach((c) => ubicar(c, d + 1));
    const xs = hijos[v].map((c) => P[c][0]);
    P[v] = [(Math.min(...xs) + Math.max(...xs)) / 2, d];
  };
  raices.forEach((r) => { ubicar(r, 0); hoja += 0.6; });
  const W = 400, padX = 26, padY = 38;
  const dy = maxD ? Math.max(48, Math.min(68, (300 - 2 * padY) / maxD)) : 0;
  const H = Math.max(300, 2 * padY + maxD * dy);
  lienzo.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const ancho = Math.max(hoja - 0.6 - 1, 0);
  const escala = ancho > 0 ? Math.min(58, (W - 2 * padX) / ancho) : 0;
  const off = (W - ancho * escala) / 2;
  const xy = (v) => [off + P[v][0] * escala, padY + P[v][1] * dy];

  const enCamino = new Set();
  (st.caminos || []).forEach((p) => p.forEach((v, i) => { if (i < p.length - 1) enCamino.add(v); }));
  const comp = new Set(st.comprimidos || []);
  const marcas = {
    neutro: flecha(lienzo, idUnico("fl"), tk("--tc-tenue")),
    camino: flecha(lienzo, idUnico("fl"), tk("--tc-camino")),
    comp: flecha(lienzo, idUnico("fl"), tk("--tc-compresion")),
    enlace: flecha(lienzo, idUnico("fl"), tk("--tc-enlace")),
  };
  for (let v = 1; v <= n; v++) {
    if (st.parent[v] === v) continue;
    const [x1, y1] = xy(v), [x2, y2] = xy(st.parent[v]);
    const esEnlace = st.enlace && st.enlace[0] === v;
    const tipo = esEnlace ? "enlace" : comp.has(v) ? "comp" : enCamino.has(v) ? "camino" : "neutro";
    const color = { enlace: tk("--tc-enlace"), comp: tk("--tc-compresion"), camino: tk("--tc-camino"), neutro: tk("--tc-tenue") }[tipo];
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    svg("line", {
      x1: x1 + ux * 14, y1: y1 + uy * 14, x2: x2 - ux * 16, y2: y2 - uy * 16, stroke: color,
      "stroke-width": tipo === "neutro" ? 1.8 : 3.5, "stroke-dasharray": tipo === "comp" ? "6 3" : null,
      "marker-end": marcas[tipo],
    }, lienzo);
  }
  for (let v = 1; v <= n; v++) {
    const [x, y] = xy(v);
    const esRaiz = st.parent[v] === v;
    const c = colorComponente(tk, st, v);
    svg("circle", { cx: x, cy: y, r: 13, fill: tk("--tc-panel") }, lienzo);
    svg("circle", {
      cx: x, cy: y, r: 13, fill: c || tk("--tc-panel"), "fill-opacity": c ? 0.28 : 1,
      stroke: esRaiz ? tk("--tc-tinta") : (c || tk("--tc-tenue")), "stroke-width": esRaiz ? 2.6 : 1.6,
    }, lienzo);
    texto(lienzo, x, y + 5, String(v), { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: tk("--tc-tinta") });
    if (esRaiz) {
      texto(lienzo, x, y - 19, `size ${st.size[v]}`, { "text-anchor": "middle", "font-size": 11, fill: tk("--tc-tenue") });
    }
  }
}

function tablaArreglo(n, st, previo) {
  const celdas = (nombre, arr, esSize) => {
    const tr = html("tr", {}, html("th", {}, nombre));
    for (let i = 1; i <= n; i++) {
      const raiz = st.parent[i] === i;
      if (esSize && !raiz) { tr.append(html("td")); continue; }
      const cambio = previo && arr[i] !== (esSize ? previo.size : previo.parent)[i];
      tr.append(html("td", { class: [cambio ? "tc-cambio" : "", raiz && !esSize ? "tc-raiz" : ""].join(" ").trim() }, String(arr[i])));
    }
    return tr;
  };
  const cab = html("tr", {}, html("th", {}, "i"));
  for (let i = 1; i <= n; i++) cab.append(html("th", {}, String(i)));
  return html("table", { class: "tc-tabla" }, cab, celdas("parent", st.parent, false), celdas("size (raíces)", st.size, true));
}

// ------------------------------------------------------------------ la pieza

/**
 * Monta el laboratorio y devuelve su elemento raíz.
 * Opciones: `escenario` (clave de ESCENARIOS), `estrategia` (clave de ESTRATEGIAS) y
 * `paso` (paso inicial, para abrir la pieza en el momento que comenta el texto).
 */
export function laboratorio({ escenario = "ej1", estrategia = "completa", paso: pasoInicial = 0 } = {}) {
  const raiz = html("div", { class: "tc-pieza", tabindex: "0", "aria-label": "Laboratorio de union-find. Flechas izquierda y derecha para retroceder y avanzar." });
  const tk = lector(raiz);
  const selEsc = html("select", { "aria-label": "Escenario" },
    ...Object.entries(ESCENARIOS).map(([k, e]) => html("option", { value: k, selected: k === escenario }, e.nombre)));
  const selEst = html("select", { "aria-label": "Estrategia" },
    ...Object.entries(ESTRATEGIAS).map(([k, nombre]) => html("option", { value: k, selected: k === estrategia }, nombre)));
  const bReinicio = html("button", { title: "Volver al inicio", "aria-label": "Volver al inicio" }, "⟲");
  const bAtras = html("button", { title: "Paso anterior", "aria-label": "Paso anterior" }, "◀");
  const bAdelante = html("button", { class: "tc-primario", title: "Paso siguiente" }, "Paso ▶");
  const bPlay = html("button", {}, "Reproducir");
  const bOtro = html("button", { title: "Sortear otro grafo aleatorio" }, "Otro grafo");
  const marcador = (etiqueta) => {
    const b = html("b", {}, "–");
    return [html("div", { class: "tc-marcador" }, b, html("span", {}, etiqueta)), b];
  };
  const [mB0, vB0] = marcador("β₀ componentes");
  const [mB1, vB1] = marcador("β₁ aristas rechazadas");
  const [mSaltos, vSaltos] = marcador("saltos de Find");
  const [mAlt, vAlt] = marcador("altura del bosque");
  const paso = html("div", { class: "tc-paso" });
  const narr = html("div", { class: "tc-texto", "aria-live": "polite" });
  const lienzoGrafo = svg("svg", { viewBox: "0 0 400 300", role: "img", "aria-label": "Grafo: aristas aceptadas en el color de su componente, rechazadas en rojo punteado con una cruz, pendientes en gris punteado." });
  const lienzoBosque = svg("svg", { viewBox: "0 0 400 300", role: "img", "aria-label": "Bosque de up-trees: cada nodo apunta a su padre; las raíces tienen borde grueso y su tamaño." });
  const arreglo = html("div", { style: "overflow-x:auto" });

  raiz.append(
    html("div", { class: "tc-titulo" }, "Laboratorio de union-find", html("small", {}, "el grafo, el bosque y el arreglo son el mismo estado")),
    html("div", { class: "tc-grilla" },
      html("div", { class: "tc-panel tc-ancho tc-controles" },
        html("label", {}, "Escenario", selEsc), html("label", {}, "Estrategia", selEst), bOtro,
        bReinicio, bAtras, bAdelante, bPlay,
        html("div", { class: "tc-marcadores" }, mB0, mB1, mSaltos, mAlt)),
      html("div", { class: "tc-panel tc-ancho tc-narracion" }, paso, narr),
      html("div", { class: "tc-panel" }, html("h4", {}, "Grafo"), lienzoGrafo,
        html("div", { class: "tc-leyenda" },
          html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-tinta)" }), "aceptada (color de su componente)"),
          html("span", {}, html("i", { class: "tc-muestra punteada", style: "border-color:var(--tc-rechazo)" }), "rechazada ×: cierra un ciclo"),
          html("span", {}, html("i", { class: "tc-muestra punteos", style: "border-color:var(--tc-linea)" }), "pendiente"))),
      html("div", { class: "tc-panel" }, html("h4", {}, "Bosque de up-trees"), lienzoBosque,
        html("div", { class: "tc-leyenda" },
          html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-camino)" }), "camino de Find"),
          html("span", {}, html("i", { class: "tc-muestra punteada", style: "border-color:var(--tc-compresion)" }), "puntero comprimido"),
          html("span", {}, html("i", { class: "tc-muestra", style: "border-color:var(--tc-enlace)" }), "enlace nuevo de Union"))),
      html("div", { class: "tc-panel tc-ancho" }, html("h4", {}, "Arreglo V[1..n]: el almacenamiento real"), arreglo)),
  );

  let semilla = 42;
  let cur = { n: 0, ops: [], estados: [], k: 0 };
  let reloj = null;

  function cargar(mantenerPaso = false) {
    const e = ESCENARIOS[selEsc.value];
    const ops = e.ops || opsAleatorias(e.n, semilla);
    const k = mantenerPaso ? cur.k : 0;
    cur = { n: e.n, ops, estados: simular(e.n, ops, selEst.value), k: 0 };
    cur.k = Math.min(k, cur.estados.length - 1);
    bOtro.hidden = !!e.ops;
    dibujar();
  }

  function dibujar() {
    const { n, ops, estados, k } = cur;
    const st = estados[k];
    const op = st.op ? (st.op[0] === "U" ? ` · Union(${st.op[1]}, ${st.op[2]})` : ` · Find(${st.op[1]})`) : "";
    paso.textContent = `Paso ${k} de ${estados.length - 1}${op}`;
    narr.textContent = st.texto;
    vB0.textContent = st.b0;
    vB1.textContent = st.b1;
    vSaltos.textContent = st.saltos;
    vAlt.textContent = altura(st, n);
    dibujarGrafo(lienzoGrafo, tk, n, ops, estados, k);
    dibujarBosque(lienzoBosque, tk, n, st);
    arreglo.replaceChildren(tablaArreglo(n, st, k ? estados[k - 1] : null));
    bAtras.disabled = k === 0;
    bAdelante.disabled = k === estados.length - 1;
  }

  const mover = (d) => {
    cur.k = Math.max(0, Math.min(cur.estados.length - 1, cur.k + d));
    dibujar();
  };
  const parar = () => { clearInterval(reloj); reloj = null; bPlay.textContent = "Reproducir"; };

  bAdelante.addEventListener("click", () => mover(1));
  bAtras.addEventListener("click", () => mover(-1));
  bReinicio.addEventListener("click", () => { parar(); cur.k = 0; dibujar(); });
  selEsc.addEventListener("change", () => { parar(); cargar(); });
  selEst.addEventListener("change", () => cargar(true));
  bOtro.addEventListener("click", () => { parar(); semilla += 1; cargar(); });
  bPlay.addEventListener("click", () => {
    if (reloj) return parar();
    if (cur.k === cur.estados.length - 1) cur.k = 0;
    bPlay.textContent = "Pausa";
    reloj = setInterval(() => (cur.k >= cur.estados.length - 1 ? parar() : mover(1)), 1700);
  });
  raiz.addEventListener("keydown", (e) => {
    if (e.target.tagName === "SELECT") return;
    if (e.key === "ArrowRight") { e.preventDefault(); mover(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); mover(-1); }
  });
  alCambiarTema(dibujar);
  cargar();
  if (pasoInicial) mover(pasoInicial);
  return raiz;
}
