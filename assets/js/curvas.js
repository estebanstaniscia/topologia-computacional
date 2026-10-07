// Curvas en el plano (sección I.2): el gemelo JS de tcomp.curvas.
//
// Misma semántica que la librería de Python (testeada contra fixtures generados por
// tcomp, contra robust-predicates y contra earcut). Coordenadas matemáticas: x hacia la
// derecha, y hacia ARRIBA. Con coordenadas enteras (|x| < 2^26) todo es exacto.

// ------------------------------------------------------------------ orientación

/** det Δ(x, a, b): el doble del área con signo del triángulo x, a, b. */
export const orient = (x, a, b) => (a[0] - x[0]) * (b[1] - x[1]) - (a[1] - x[1]) * (b[0] - x[0]);

/** Signo de det Δ(x', a, b) con x' = x + (ε₁, ε₂), 0 < ε₁ ≪ ε₂ (Simulation of Simplicity). */
export function orientPerturbado(x, a, b) {
  for (const t of [orient(x, a, b), b[0] - a[0], a[1] - b[1]]) if (t !== 0) return Math.sign(t);
  return 0;
}

export const aristas = (P) => P.map((p, i) => [p, P[(i + 1) % P.length]]);

export const areaConSigno = (P) => aristas(P).reduce((s, [a, b]) => s + a[0] * b[1] - b[0] * a[1], 0) / 2;

export const antihorario = (P) => (areaConSigno(P) >= 0 ? P.slice() : P.slice().reverse());

// ------------------------------------------------------------ paridad y vueltas

/** +1, −1 o 0: cómo cruza la arista orientada a→b el rayo horizontal desde x'. */
export function cruceConSigno(x, a, b) {
  if (a[1] <= x[1] && x[1] < b[1] && orientPerturbado(x, a, b) > 0) return 1;
  if (b[1] <= x[1] && x[1] < a[1] && orientPerturbado(x, a, b) < 0) return -1;
  return 0;
}

/** El rayo: W (con signo), cantidad de cruces, y dónde cruza cada arista. */
export function rayo(x, P) {
  let w = 0, n = 0;
  const cruces = [];
  for (const [a, b] of aristas(P)) {
    const s = cruceConSigno(x, a, b);
    if (!s) continue;
    w += s;
    n++;
    const t = (x[1] - a[1]) / (b[1] - a[1]);
    cruces.push({ punto: [a[0] + t * (b[0] - a[0]), x[1]], signo: s });
  }
  return { w, n, cruces };
}

export const vueltasPorCruces = (x, P) => rayo(x, P).w;
export const cruces = (x, P) => rayo(x, P).n;

/** W sumando los giros del vector unitario (punto flotante, redondeado). */
export function vueltasPorAngulos(x, P) {
  let total = 0;
  for (const [a, b] of aristas(P)) {
    let d = Math.atan2(b[1] - x[1], b[0] - x[0]) - Math.atan2(a[1] - x[1], a[0] - x[0]);
    d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    total += d;
  }
  return Math.round(total / (2 * Math.PI));
}

export function sobreElPoligono(x, P) {
  return aristas(P).some(([a, b]) => orient(x, a, b) === 0 &&
    Math.min(a[0], b[0]) <= x[0] && x[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= x[1] && x[1] <= Math.max(a[1], b[1]));
}

export function paridad(x, P) {
  if (sobreElPoligono(x, P)) return "sobre";
  return cruces(x, P) % 2 === 1 ? "adentro" : "afuera";
}

// ------------------------------------------------------------------ simplicidad

const seCortan = (p1, p2, q1, q2) => {
  const d1 = orient(q1, q2, p1), d2 = orient(q1, q2, p2), d3 = orient(p1, p2, q1), d4 = orient(p1, p2, q2);
  return d1 * d2 < 0 && d3 * d4 < 0;
};

/** Autointersecciones: [{i, j, punto}] para aristas no consecutivas que se cruzan. */
export function autointersecciones(P) {
  const E = aristas(P), out = [];
  for (let i = 0; i < E.length; i++) {
    for (let j = i + 2; j < E.length; j++) {
      if (i === 0 && j === E.length - 1) continue;
      const [p1, p2] = E[i], [q1, q2] = E[j];
      if (!seCortan(p1, p2, q1, q2)) continue;
      const d1 = orient(q1, q2, p1), d2 = orient(q1, q2, p2), t = d1 / (d1 - d2);
      out.push({ i, j, punto: [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])] });
    }
  }
  return out;
}

export const esSimple = (P) => new Set(P.map((p) => p.join(","))).size === P.length && autointersecciones(P).length === 0;

export function posicionGeneral(P) {
  if (new Set(P.map((p) => p[0])).size < P.length) return false;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) for (let k = j + 1; k < P.length; k++) {
    if (orient(P[i], P[j], P[k]) === 0) return false;
  }
  return true;
}

// ------------------------------------------------------------------ triangulación

export const enTriangulo = (p, a, b, c) => orient(p, a, b) >= 0 && orient(p, b, c) >= 0 && orient(p, c, a) >= 0;

function bac(P, idx) {
  const n = idx.length;
  let k = 0;
  for (let t = 1; t < n; t++) {
    const p = P[idx[t]], q = P[idx[k]];
    if (p[0] < q[0] || (p[0] === q[0] && p[1] < q[1])) k = t;
  }
  const ka = (k - 1 + n) % n, kc = (k + 1) % n;
  const a = P[idx[ka]], b = P[idx[k]], c = P[idx[kc]];
  const adentro = [];
  for (let t = 0; t < n; t++) if (t !== ka && t !== k && t !== kc && enTriangulo(P[idx[t]], a, b, c)) adentro.push(t);
  return { k, ka, kc, a, c, adentro };
}

/** El paso inductivo: diagonal del sub-polígono `idx` con la regla "corregida" o "libro". */
export function diagonal(P, idx, regla = "corregida") {
  const { k, ka, kc, a, c, adentro } = bac(P, idx);
  if (!adentro.length) return [ka, kc];
  let mejor = adentro[0];
  for (const t of adentro) {
    const p = P[idx[t]], m = P[idx[mejor]];
    if (regla === "libro") {
      if (p[0] < m[0] || (p[0] === m[0] && p[1] < m[1])) mejor = t;
    } else if (Math.abs(orient(p, a, c)) > Math.abs(orient(m, a, c))) mejor = t;
  }
  return [k, mejor];
}

export const CONTRAEJEMPLO_LIBRO = [[42, -71], [-16, 46], [-8, -18], [28, -48], [21, -47]];

export function esDiagonal(P, i, j) {
  const p = P[i], q = P[j];
  for (const [a, b] of aristas(P)) {
    if (a === p || a === q || b === p || b === q) continue;
    if (seCortan(p, q, a, b)) return false;
  }
  return paridad([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], P) === "adentro";
}

/**
 * Triangulación por la prueba inductiva. P simple y antihorario. Devuelve
 * {triangulos, diagonales, pasos}; cada paso registra b, a, c, los vértices dentro de
 * abc y la diagonal elegida (o el triángulo final), para el modo Demostración.
 */
export function triangular(P, regla = "corregida") {
  const triangulos = [], diagonales = [], pasos = [];
  const pila = [P.map((_, i) => i)];
  while (pila.length) {
    const idx = pila.pop();
    if (idx.length === 3) {
      triangulos.push(idx.slice());
      pasos.push({ poligono: idx, triangulo: idx.slice() });
      continue;
    }
    let [i, j] = diagonal(P, idx, regla);
    if (i > j) [i, j] = [j, i];
    const { k, ka, kc, adentro } = bac(P, idx);
    pasos.push({ poligono: idx, b: idx[k], a: idx[ka], c: idx[kc], adentro: adentro.map((t) => idx[t]), diagonal: [idx[i], idx[j]] });
    diagonales.push([idx[i], idx[j]]);
    pila.push(idx.slice(i, j + 1), idx.slice(j).concat(idx.slice(0, i + 1)));
  }
  return { triangulos, diagonales, pasos };
}

export function arbolDual(triangulos) {
  const lados = new Map();
  triangulos.forEach(([p, q, r], t) => {
    for (const [u, v] of [[p, q], [q, r], [r, p]]) {
      const clave = Math.min(u, v) + "," + Math.max(u, v);
      if (!lados.has(clave)) lados.set(clave, []);
      lados.get(clave).push(t);
    }
  });
  return [...lados.values()].filter((ts) => ts.length === 2);
}

export function orejas(triangulos, arcos) {
  const grado = triangulos.map(() => 0);
  for (const [s, t] of arcos) { grado[s]++; grado[t]++; }
  return grado.map((g, t) => (g <= 1 ? t : -1)).filter((t) => t >= 0);
}

/** El único camino entre dos triángulos en el árbol dual (la ola de I.1). */
export function caminoDual(triangulos, arcos, origen, destino) {
  const vecinos = triangulos.map(() => []);
  for (const [s, t] of arcos) { vecinos[s].push(t); vecinos[t].push(s); }
  const padre = new Map([[origen, origen]]);
  const cola = [origen];
  while (cola.length) {
    const u = cola.shift();
    for (const v of vecinos[u]) if (!padre.has(v)) { padre.set(v, u); cola.push(v); }
  }
  if (!padre.has(destino)) return null;
  const camino = [destino];
  while (camino.at(-1) !== origen) camino.push(padre.get(camino.at(-1)));
  return camino.reverse();
}

/** 3-coloreo de Fisk: se colorea un triángulo y se recorre el árbol dual. */
export function tresColoreo(n, triangulos) {
  const color = Array(n).fill(-1);
  if (!triangulos.length) return color;
  triangulos[0].forEach((v, c) => { color[v] = c; });
  const arcos = arbolDual(triangulos);
  const vecinos = triangulos.map(() => []);
  for (const [s, t] of arcos) { vecinos[s].push(t); vecinos[t].push(s); }
  const vistos = new Set([0]), cola = [0];
  while (cola.length) {
    const u = cola.shift();
    for (const t of vecinos[u]) {
      if (vistos.has(t)) continue;
      vistos.add(t);
      const usados = new Set(triangulos[t].map((v) => color[v]).filter((c) => c >= 0));
      for (const v of triangulos[t]) if (color[v] < 0) color[v] = [0, 1, 2].find((c) => !usados.has(c));
      cola.push(t);
    }
  }
  return color;
}

/** En qué triángulo cae el punto x (o -1). */
export function trianguloQueContiene(P, triangulos, x) {
  return triangulos.findIndex(([i, j, k]) => enTriangulo(x, P[i], P[j], P[k]));
}

// ------------------------------------------------------------------ curvas y generadores

/** Remuestreo uniforme por longitud de arco de una curva cerrada. */
export function remuestrear(pts, m) {
  const C = pts.concat([pts[0]]), L = [0];
  for (let i = 1; i < C.length; i++) L.push(L[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]));
  const tot = L.at(-1), out = [];
  let j = 0;
  for (let k = 0; k < m; k++) {
    const s = (tot * k) / m;
    while (L[j + 1] < s) j++;
    const u = (s - L[j]) / (L[j + 1] - L[j] || 1);
    out.push([C[j][0] + u * (C[j + 1][0] - C[j][0]), C[j][1] + u * (C[j + 1][1] - C[j][1])]);
  }
  return out;
}

/** Redondea a enteros (y quita vértices repetidos consecutivos): aritmética exacta. */
export function aEnteros(P) {
  const out = [];
  for (const p of P) {
    const q = [Math.round(p[0]), Math.round(p[1])];
    const u = out.at(-1);
    if (!u || u[0] !== q[0] || u[1] !== q[1]) out.push(q);
  }
  while (out.length > 1 && out[0][0] === out.at(-1)[0] && out[0][1] === out.at(-1)[1]) out.pop();
  return out;
}

const anillo = (n, f) => Array.from({ length: n }, (_, k) => f((2 * Math.PI * k) / n));

/** Laberinto espiral: una banda que se enrosca (una curva de Jordan muy larga). */
export function laberintoEspiral(vueltas = 3.4, separacion = 34, n = 160) {
  const afuera = [], adentro = [];
  for (let k = 0; k <= n; k++) {
    const th = 1.6 + (vueltas * Math.PI * k) / n, r = 10 + (separacion * 0.7) * th;
    afuera.push([r * Math.cos(th), 0.8 * r * Math.sin(th)]);
    adentro.push([(r - separacion) * Math.cos(th), 0.8 * (r - separacion) * Math.sin(th)]);
  }
  return aEnteros(afuera.concat(adentro.reverse()));
}

/** Copo de Koch de nivel `nivel` centrado en el origen. */
export function copoDeKoch(nivel = 3, radio = 240) {
  let P = anillo(3, (t) => [radio * Math.cos(t + Math.PI / 2), radio * Math.sin(t + Math.PI / 2)]).reverse();
  for (let l = 0; l < nivel; l++) {
    const Q = [];
    for (const [a, b] of aristas(P)) {
      const d = [(b[0] - a[0]) / 3, (b[1] - a[1]) / 3];
      const p1 = [a[0] + d[0], a[1] + d[1]], p3 = [a[0] + 2 * d[0], a[1] + 2 * d[1]];
      // el pico hacia afuera (P horario: afuera queda a la izquierda)
      const p2 = [p1[0] + d[0] / 2 - (Math.sqrt(3) / 2) * d[1], p1[1] + d[1] / 2 + (Math.sqrt(3) / 2) * d[0]];
      Q.push(a, p1, p2, p3);
    }
    P = Q;
  }
  return aEnteros(P.map(([x, y]) => [x * 4, y * 4])).map(([x, y]) => [x / 4, y / 4]);
}

/**
 * Laberinto de grilla: un árbol generador aleatorio de una grilla (pasillos) y su
 * contorno como curva de Jordan. Devuelve el polígono (en unidades de `celda`).
 */
export function laberintoGrilla(filas, cols, rnd, celda = 30) {
  // árbol generador aleatorio por DFS sobre las celdas
  const visto = new Set(["0,0"]), pila = [[0, 0]], abiertas = new Set();
  while (pila.length) {
    const [f, c] = pila.at(-1);
    const vecinos = [[f + 1, c], [f - 1, c], [f, c + 1], [f, c - 1]]
      .filter(([g, d]) => g >= 0 && d >= 0 && g < filas && d < cols && !visto.has(g + "," + d));
    if (!vecinos.length) { pila.pop(); continue; }
    const [g, d] = vecinos[Math.floor(rnd() * vecinos.length)];
    visto.add(g + "," + d);
    abiertas.add([f, c, g, d].join(","));
    abiertas.add([g, d, f, c].join(","));
    pila.push([g, d]);
  }
  // cada celda es un cuadrado de lado 2 (pasillo de ancho 1 + muro): unión de cuadrados
  // y conexiones; el contorno se arma siguiendo el borde de la región en una grilla fina
  const W2 = 2 * cols + 1, H2 = 2 * filas + 1, lleno = new Set();
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
    lleno.add(`${2 * f + 1},${2 * c + 1}`);
    if (abiertas.has([f, c, f + 1, c].join(","))) lleno.add(`${2 * f + 2},${2 * c + 1}`);
    if (abiertas.has([f, c, f, c + 1].join(","))) lleno.add(`${2 * f + 1},${2 * c + 2}`);
  }
  return contornoDeCeldas(lleno, H2, W2).map(([x, y]) => [(x - W2 / 2) * celda, (H2 / 2 - y) * celda]);
}

/** Contorno (antihorario en coordenadas matemáticas) de una región de celdas simplemente conexa. */
function contornoDeCeldas(lleno, H, W) {
  const esta = (f, c) => lleno.has(`${f},${c}`);
  // aristas dirigidas del borde, dejando la región a la izquierda (en coordenadas de pantalla, y hacia abajo)
  const sig = new Map();
  for (const clave of lleno) {
    const [f, c] = clave.split(",").map(Number);
    if (!esta(f - 1, c)) sig.set(`${c + 1},${f}`, [c, f]); // borde de arriba: de derecha a izquierda
    if (!esta(f + 1, c)) sig.set(`${c},${f + 1}`, [c + 1, f + 1]); // abajo: de izquierda a derecha
    if (!esta(f, c - 1)) sig.set(`${c},${f}`, [c, f + 1]); // izquierda: hacia abajo
    if (!esta(f, c + 1)) sig.set(`${c + 1},${f + 1}`, [c + 1, f]); // derecha: hacia arriba
  }
  const inicio = sig.keys().next().value;
  const out = [];
  let actual = inicio;
  do {
    const [x, y] = actual.split(",").map(Number);
    out.push([x, y]);
    const [nx, ny] = sig.get(actual);
    actual = `${nx},${ny}`;
  } while (actual !== inicio && out.length <= 4 * lleno.size + 4);
  // quitar vértices colineales
  const limpio = out.filter((p, i) => {
    const a = out[(i - 1 + out.length) % out.length], b = out[(i + 1) % out.length];
    return orient(a, p, b) !== 0;
  });
  return limpio;
}

export const CURVAS = {
  circulo: () => anillo(72, (t) => [200 * Math.cos(t), 200 * Math.sin(t)]),
  // desfasado media muestra: así el punto doble es un cruce propio y no un vértice repetido
  ocho: () => anillo(120, (t) => [300 * Math.sin(t + Math.PI / 120), 190 * Math.sin(2 * (t + Math.PI / 120))]),
  limacon: () => anillo(150, (t) => { const r = 150 * (0.5 + Math.cos(t)); return [r * Math.cos(t) - 60, r * Math.sin(t)]; }),
  doble: () => anillo(144, (t) => [190 * Math.cos(2 * t) * (1 + 0.06 * Math.sin(t)), 190 * Math.sin(2 * t) * (1 + 0.06 * Math.sin(t))]),
  flor: () => anillo(240, (t) => [150 * Math.cos(t) + 95 * Math.cos(4 * t), 150 * Math.sin(t) - 95 * Math.sin(4 * t)]),
  espiral: () => laberintoEspiral(),
  errata: () => CONTRAEJEMPLO_LIBRO.map(([x, y]) => [x * 7 - 90, y * 3.9 + 20]),
};
