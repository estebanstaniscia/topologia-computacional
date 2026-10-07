// G9 · Poliedro de Schönhardt (sección I.2, estación 4; spec §5, G9). Three.js por CDN.
//
// Todo polígono se triangula sin vértices nuevos, pero no todo poliedro se tetraedriza.
// Un prisma triangular con la tapa girada un ángulo θ dobla sus caras laterales hacia
// adentro: para θ > 0, ninguno de los 15 tetraedros que se pueden formar con sus 6
// vértices tiene todas sus aristas adentro. Para decidir si un segmento está adentro se
// usa el algoritmo de paridad en 3D: un rayo contra los triángulos del borde.

import { html, lector, alCambiarTema } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";

// ------------------------------------------------------------------ lógica pura

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Los 6 vértices: A0, A1, A2 abajo; B0, B1, B2 arriba, girados θ (radianes). */
export function vertices(theta, h = 1.6) {
  const V = [];
  for (let i = 0; i < 3; i++) V.push([Math.cos((2 * Math.PI * i) / 3), Math.sin((2 * Math.PI * i) / 3), 0]);
  for (let i = 0; i < 3; i++) V.push([Math.cos((2 * Math.PI * i) / 3 + theta), Math.sin((2 * Math.PI * i) / 3 + theta), h]);
  return V;
}

/** Las caras (triángulos, orientados hacia afuera): tapas y cada cara lateral partida por Ai–B(i+1). */
export function caras() {
  const F = [[0, 2, 1], [3, 4, 5]];
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    F.push([i, j, 3 + j], [i, 3 + j, 3 + i]); // el pliegue va por la diagonal Ai–Bj
  }
  return F;
}

/** Corte rayo–triángulo (Möller–Trumbore): ¿el rayo o + t·d, t > 0, corta el triángulo? */
function cortaTriangulo(o, d, a, b, c) {
  const e1 = sub(b, a), e2 = sub(c, a), p = cruz(d, e2), det = punto(e1, p);
  if (Math.abs(det) < 1e-12) return false;
  const s = sub(o, a), u = punto(s, p) / det;
  if (u < 0 || u > 1) return false;
  const q = cruz(s, e1), v = punto(d, q) / det;
  if (v < 0 || u + v > 1) return false;
  return punto(e2, q) / det > 1e-9;
}

/** Distancia de un punto al triángulo abc (para tratar «sobre el borde» como adentro). */
function distanciaAlTriangulo(x, a, b, c) {
  const n = cruz(sub(b, a), sub(c, a)), L = Math.hypot(...n);
  const d = Math.abs(punto(sub(x, a), n)) / L;
  // proyección dentro del triángulo (coordenadas baricéntricas con un poco de tolerancia)
  const proy = sub(x, n.map((k) => (k / L) * (punto(sub(x, a), n) / L)));
  const v0 = sub(c, a), v1 = sub(b, a), v2 = sub(proy, a);
  const d00 = punto(v0, v0), d01 = punto(v0, v1), d11 = punto(v1, v1), d20 = punto(v2, v0), d21 = punto(v2, v1);
  const den = d00 * d11 - d01 * d01, s = (d11 * d20 - d01 * d21) / den, t = (d00 * d21 - d01 * d20) / den;
  return s >= -1e-9 && t >= -1e-9 && s + t <= 1 + 1e-9 ? d : Infinity;
}

/** El algoritmo de paridad en 3D: ¿x está dentro del poliedro (o sobre su borde)? */
export function adentro(x, V, F) {
  if (F.some(([a, b, c]) => distanciaAlTriangulo(x, V[a], V[b], V[c]) < 1e-9)) return true;
  const d = [0.5713, 0.3017, 0.7631]; // una dirección genérica
  let n = 0;
  for (const [a, b, c] of F) if (cortaTriangulo(x, d, V[a], V[b], V[c])) n++;
  return n % 2 === 1;
}

/** ¿El segmento uv queda adentro del poliedro (o sobre el borde)? Se prueban puntos interiores. */
export function segmentoAdentro(V, F, u, v) {
  for (const t of [0.15, 0.3, 0.5, 0.7, 0.85]) {
    const x = [0, 1, 2].map((k) => V[u][k] + t * (V[v][k] - V[u][k]));
    if (!adentro(x, V, F)) return false;
  }
  return true;
}

/** Los 15 tetraedros posibles y cuáles tienen sus 6 aristas adentro. */
export function tetraedrosValidos(theta) {
  const V = vertices(theta), F = caras(), validos = [];
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) for (let d = c + 1; d < 6; d++) {
    const q = [a, b, c, d];
    const ok = q.every((u, i) => q.slice(i + 1).every((w) => segmentoAdentro(V, F, u, w)));
    if (ok) validos.push(q);
  }
  return validos;
}

/** Las diagonales laterales que no son pliegue: Aj–Bi. ¿Quedan adentro? */
export function diagonalesAfuera(theta) {
  const V = vertices(theta), F = caras();
  return [0, 1, 2].map((i) => {
    const j = (i + 1) % 3;
    return { u: j, v: 3 + i, adentro: segmentoAdentro(V, F, j, 3 + i) };
  });
}

// ------------------------------------------------------------------ la pieza

let THREE = null;
const cargarThree = () => (THREE ? Promise.resolve(THREE)
  : import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm").then((m) => (THREE = m)));

export function schonhardt({ id = "g9", grados = 30 } = {}) {
  const contenedor = html("div", { style: "position:relative;aspect-ratio:16/10;background:var(--tc-panel)" });
  const tk = lector(contenedor);
  const desliz = html("input", { type: "range", min: 0, max: 60, step: 1, value: grados, "aria-label": "Giro de la tapa en grados" });
  const vGrados = html("b", {}, `${grados}°`);
  const lecturas = html("div", { class: "tc-g-tarjeta" });
  let rehacer = null;

  const actualizarLecturas = (theta) => {
    const T = tetraedrosValidos(theta), D = diagonalesAfuera(theta);
    const afuera = D.filter((d) => !d.adentro).length;
    lecturas.replaceChildren(html("h4", {}, "¿Tetraedrizable sin vértices nuevos?"), html("div", { class: "tc-g-filas" },
      html("span", {}, "Giro de la tapa"), html("b", {}, `${Math.round((theta * 180) / Math.PI)}°`),
      html("span", {}, "Diagonales laterales afuera (en rojo)"), html("b", { class: afuera ? "tc-g-mal" : "tc-g-ok" }, `${afuera} de 3`),
      html("span", {}, "Tetraedros con las 6 aristas adentro"), html("b", { class: T.length ? "tc-g-ok" : "tc-g-mal" }, `${T.length} de 15`),
      html("span", {}, "Veredicto"), html("b", { class: T.length ? "tc-g-ok" : "tc-g-mal" }, T.length ? "sí (se puede)" : "NO: ningún tetraedro sirve")));
  };

  cargarThree().then((T) => {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", cursor: "grab" });
    contenedor.append(renderer.domElement);
    const escena = new T.Scene(), camara = new T.PerspectiveCamera(35, 16 / 10, 0.1, 100);
    camara.position.set(0, -5.2, 2.6);
    camara.up.set(0, 0, 1);
    camara.lookAt(0, 0, 0.8);
    escena.add(new T.AmbientLight(0xffffff, 1.3));
    const luz = new T.DirectionalLight(0xffffff, 1.6);
    luz.position.set(3, -4, 6);
    escena.add(luz);
    const grupo = new T.Group();
    escena.add(grupo);
    let giro = 0.4;

    rehacer = () => {
      const theta = (+desliz.value * Math.PI) / 180;
      vGrados.textContent = `${desliz.value}°`;
      grupo.clear();
      const V = vertices(theta), F = caras();
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(F.flatMap((f) => f.flatMap((k) => V[k])), 3));
      geo.computeVertexNormals();
      grupo.add(new T.Mesh(geo, new T.MeshStandardMaterial({ color: tk("--tc-acento"), transparent: true, opacity: 0.35, side: T.DoubleSide, roughness: 0.8 })));
      const linea = (u, v, color, ancho = 1) => {
        const g = new T.BufferGeometry().setFromPoints([new T.Vector3(...V[u]), new T.Vector3(...V[v])]);
        grupo.add(new T.Line(g, new T.LineBasicMaterial({ color, linewidth: ancho })));
      };
      const vistas = new Set();
      for (const [a, b, c] of F) for (const [u, v] of [[a, b], [b, c], [c, a]]) {
        const k = Math.min(u, v) + "-" + Math.max(u, v);
        if (vistas.has(k)) continue;
        vistas.add(k);
        linea(u, v, tk("--tc-tinta"));
      }
      for (const d of diagonalesAfuera(theta)) linea(d.u, d.v, d.adentro ? tk("--tc-enlace") : tk("--tc-rechazo"));
      for (const v of V) {
        const m = new T.Mesh(new T.SphereGeometry(0.05, 16, 12), new T.MeshStandardMaterial({ color: tk("--tc-tinta") }));
        m.position.set(...v);
        grupo.add(m);
      }
      actualizarLecturas(theta);
      dibujar();
    };
    const dibujar = () => {
      const r = contenedor.getBoundingClientRect();
      if (r.width) { renderer.setSize(r.width, r.height, false); camara.aspect = r.width / r.height; camara.updateProjectionMatrix(); }
      grupo.rotation.z = giro;
      renderer.render(escena, camara);
    };
    let arrastre = null;
    renderer.domElement.addEventListener("pointerdown", (e) => { arrastre = e.clientX; renderer.domElement.setPointerCapture?.(e.pointerId); });
    renderer.domElement.addEventListener("pointermove", (e) => { if (arrastre === null) return; giro += (e.clientX - arrastre) * 0.01; arrastre = e.clientX; dibujar(); });
    renderer.domElement.addEventListener("pointerup", () => { arrastre = null; });
    new ResizeObserver(dibujar).observe(contenedor);
    rehacer();
  }).catch(() => {
    contenedor.append(html("div", { class: "tc-pista", style: "padding:20px" }, "No se pudo cargar Three.js (se carga por CDN): la vista 3D necesita conexión."));
    actualizarLecturas((+desliz.value * Math.PI) / 180);
  });
  desliz.addEventListener("input", () => rehacer?.());

  const gadget = montarGadget({
    id,
    titulo: "Poliedro de Schönhardt",
    subtitulo: "en 3D, triangular puede ser imposible",
    escenario: html("div", {}, contenedor, html("div", { style: "padding:8px" }, lecturas)),
    controles: html("label", {}, "Giro de la tapa", desliz, vGrados),
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p>Schönhardt (1928): con la tapa girada, las caras laterales se pliegan hacia adentro por las diagonales \\(A_iB_{i+1}\\), y las otras tres diagonales \\(A_{i+1}B_i\\) quedan <b>afuera</b>. Cada tetraedro con 4 de los 6 vértices usa al menos una de esas diagonales: no hay descomposición sin agregar vértices. Con \\(\\theta = 0\\) (el prisma) sí la hay. La prueba inductiva del plano no se generaliza.</p>" },
      { id: "prog", nombre: "Programador", contenido: () => "<p>¿Un segmento está adentro? Se prueban puntos interiores con el <b>algoritmo de paridad en 3D</b>: un rayo en una dirección genérica y la cuenta de triángulos del borde que corta (Möller–Trumbore). Es el mismo algoritmo de la estación 3, una dimensión más arriba. Después se revisan los \\(\\binom{6}{4} = 15\\) tetraedros posibles.</p>" },
    ],
    reiniciar: () => { desliz.value = grados; rehacer?.(); },
  });
  alCambiarTema(() => rehacer?.());
  return gadget.raiz;
}
