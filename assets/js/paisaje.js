// G10 · Paisaje de vueltas (sección I.2, estación 5; spec §5, G10). Three.js por CDN.
//
// Cada región del complemento de la curva se levanta a la altura W(γ, x): el plano se
// vuelve un terreno de mesetas. La curva es la línea de acantilados (cruzarla es subir o
// bajar un escalón) y las regiones de máximo local son las cimas, con la curva corriendo
// antihoraria a su alrededor. Es «los datos tienen forma» aplicado a la propia curva.

import { html, lector, alCambiarTema } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";
import { rayo, aEnteros, CURVAS, aristas } from "./curvas.js";

// ------------------------------------------------------------------ lógica pura

/** Grilla de W sobre el rectángulo [x0, x1] × [y0, y1] con nx × ny muestras. */
export function grillaW(P, [x0, x1, y0, y1], nx, ny) {
  const W = new Int16Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / nx, y = y0 + ((y1 - y0) * (j + 0.5)) / ny;
    W[j * nx + i] = rayo([x, y], P).w;
  }
  return W;
}

/** Cimas y simas: regiones (componentes de la grilla) cuyas vecinas valen todas menos (o más). */
export function extremosLocales(W, nx, ny) {
  const comp = new Int32Array(nx * ny).fill(-1), valores = [], vecinas = [];
  let c = 0;
  for (let s = 0; s < nx * ny; s++) {
    if (comp[s] >= 0) continue;
    const pila = [s], v = W[s], vec = new Set();
    comp[s] = c;
    while (pila.length) {
      const q = pila.pop(), i = q % nx, j = Math.floor(q / nx);
      for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
        if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
        const r = b * nx + a;
        if (W[r] !== v) { vec.add(W[r]); continue; }
        if (comp[r] < 0) { comp[r] = c; pila.push(r); }
      }
    }
    valores.push(v); vecinas.push(vec); c++;
  }
  const cimas = [], simas = [];
  valores.forEach((v, k) => {
    const vs = [...vecinas[k]];
    if (vs.length && vs.every((u) => u < v)) cimas.push(v);
    if (vs.length && vs.every((u) => u > v)) simas.push(v);
  });
  return { regiones: c, cimas, simas };
}

export const CURVAS_PAISAJE = {
  limacon: "Limaçon (una cima de altura 2)",
  flor: "Flor con lazos",
  doble: "Círculo recorrido dos veces",
  ocho: "Ocho (una cima y una sima)",
};

// ------------------------------------------------------------------ la pieza

let THREE = null;
const cargarThree = () => (THREE ? Promise.resolve(THREE)
  : import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm").then((m) => (THREE = m)));

export function paisaje({ curva = "flor", id = "g10" } = {}) {
  const contenedor = html("div", { style: "position:relative;aspect-ratio:16/9;background:var(--tc-panel)" });
  const tk = lector(contenedor);
  const sel = html("select", { "aria-label": "Curva" }, ...Object.entries(CURVAS_PAISAJE).map(([k, n]) => html("option", { value: k, selected: k === curva }, n)));
  const bGirar = html("button", { "aria-pressed": "true", title: "Rotación automática" }, "⟳ Girar");
  const lecturas = html("div", { class: "tc-g-tarjeta" });
  const NX = 220, NY = 160, LIM = [-330, 330, -240, 240];
  let girar = true, rehacer = null;

  const describir = (P, W) => {
    const { regiones, cimas, simas } = extremosLocales(W, NX, NY);
    const max = Math.max(...W), min = Math.min(...W);
    lecturas.replaceChildren(html("h4", {}, "El terreno"), html("div", { class: "tc-g-filas" },
      html("span", {}, "Altura máxima / mínima"), html("b", {}, `${max} / ${min}`),
      html("span", {}, "Regiones (mesetas)"), html("b", {}, String(regiones)),
      html("span", {}, "Cimas (máximos locales)"), html("b", {}, cimas.length ? cimas.join(", ") : "—"),
      html("span", {}, "Simas (mínimos locales)"), html("b", {}, simas.length ? simas.join(", ") : "—"),
      html("span", {}, "Vértices de la curva"), html("b", {}, String(P.length))),
      html("p", { class: "tc-pista", style: "margin:8px 0 0" }, "Arrastrá para rotar. Cruzar la curva es subir o bajar exactamente un escalón."));
  };

  cargarThree().then((T) => {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", cursor: "grab" });
    contenedor.append(renderer.domElement);
    const escena = new T.Scene(), camara = new T.PerspectiveCamera(38, 16 / 9, 1, 5000);
    escena.add(new T.AmbientLight(0xffffff, 1.2));
    const luz = new T.DirectionalLight(0xffffff, 1.8);
    luz.position.set(-300, 500, 400);
    escena.add(luz);
    const grupo = new T.Group();
    escena.add(grupo);
    let rot = { x: -0.95, z: 0.5 };
    const escala = 60; // altura de un escalón

    rehacer = () => {
      grupo.clear();
      const P = aEnteros(CURVAS[sel.value]());
      const W = grillaW(P, LIM, NX, NY);
      describir(P, W);
      // malla de mesetas: un vértice por muestra, altura W·escala
      const geo = new T.PlaneGeometry(LIM[1] - LIM[0], LIM[3] - LIM[2], NX - 1, NY - 1);
      const pos = geo.attributes.position, colores = [];
      const hex = (c) => new T.Color(c);
      const cPos = hex(tk("--tc-acento")), cNeg = hex(tk("--tc-seco")), cCero = hex(tk("--tc-linea"));
      for (let k = 0; k < pos.count; k++) {
        const i = k % NX, j = NY - 1 - Math.floor(k / NX); // PlaneGeometry va de arriba hacia abajo
        const w = W[j * NX + i];
        pos.setZ(k, w * escala);
        const base = w > 0 ? cPos : w < 0 ? cNeg : cCero;
        const c = base.clone().lerp(new T.Color(0xffffff), w === 0 ? 0 : Math.max(0, 0.45 - 0.15 * Math.abs(w)));
        colores.push(c.r, c.g, c.b);
      }
      geo.setAttribute("color", new T.Float32BufferAttribute(colores, 3));
      geo.computeVertexNormals();
      grupo.add(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: T.DoubleSide })));
      // la curva, en el borde superior de cada acantilado (a su izquierda, W es mayor)
      const pts = [];
      for (const [a, b] of aristas(P)) {
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const izq = [m[0] - ((b[1] - a[1]) / L) * 3, m[1] + ((b[0] - a[0]) / L) * 3];
        pts.push(new T.Vector3(a[0], a[1], rayo(izq, P).w * escala + 1.5));
      }
      pts.push(pts[0].clone());
      grupo.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: tk("--tc-tinta") })));
      dibujar();
    };

    const dibujar = () => {
      const r = contenedor.getBoundingClientRect();
      if (r.width) { renderer.setSize(r.width, r.height, false); camara.aspect = r.width / r.height; camara.updateProjectionMatrix(); }
      grupo.rotation.set(rot.x, 0, rot.z);
      camara.position.set(0, -40, 900);
      camara.lookAt(0, 0, 0);
      renderer.render(escena, camara);
    };
    let arrastre = null;
    renderer.domElement.addEventListener("pointerdown", (e) => { arrastre = [e.clientX, e.clientY]; girar = false; bGirar.setAttribute("aria-pressed", "false"); renderer.domElement.setPointerCapture?.(e.pointerId); });
    renderer.domElement.addEventListener("pointermove", (e) => {
      if (!arrastre) return;
      rot.z += (e.clientX - arrastre[0]) * 0.008;
      rot.x = Math.max(-1.5, Math.min(0, rot.x + (e.clientY - arrastre[1]) * 0.006));
      arrastre = [e.clientX, e.clientY];
      dibujar();
    });
    renderer.domElement.addEventListener("pointerup", () => { arrastre = null; });
    new ResizeObserver(dibujar).observe(contenedor);
    const animar = () => {
      if (girar && contenedor.isConnected) { rot.z += 0.003; dibujar(); }
      requestAnimationFrame(animar);
    };
    requestAnimationFrame(animar);
    rehacer();
  }).catch(() => {
    contenedor.append(html("div", { class: "tc-pista", style: "padding:20px" }, "No se pudo cargar Three.js (se carga por CDN): la vista 3D necesita conexión."));
  });

  sel.addEventListener("change", () => rehacer?.());
  bGirar.addEventListener("click", () => { girar = !girar; bGirar.setAttribute("aria-pressed", String(girar)); });

  const gadget = montarGadget({
    id,
    titulo: "Paisaje de vueltas",
    subtitulo: "cada región, a la altura de su W",
    escenario: html("div", {}, contenedor, html("div", { style: "padding:8px" }, lecturas)),
    controles: html("div", { style: "display:contents" }, sel, bGirar),
    lentes: [
      { id: "geo", nombre: "Geómetra", contenido: () => "<p>\\(W\\) es constante en cada región y salta en \\(\\pm 1\\) al cruzar la curva: el gráfico de \\(x \\mapsto W(\\gamma, x)\\) es un terreno de <b>mesetas</b> con acantilados de altura uno. Una <b>cima</b> (todas sus vecinas más bajas) tiene la curva corriendo antihoraria a su alrededor: queda a la izquierda de todos sus arcos de borde. Una sima, a la derecha (figura I.6 del libro).</p>" },
      { id: "prog", nombre: "Programador", contenido: () => `<p>La altura de cada uno de los ${NX} × ${NY} puntos de la grilla es el número de vueltas por cruces con signo, exacto. Las cimas y simas salen de una inundación (la ola de I.1) que agrupa la grilla en regiones y compara cada una con sus vecinas. El dibujo es una malla de Three.js con colores por vértice.</p>` },
      { id: "fis", nombre: "Físico", contenido: () => "<p><b>Ley de Ampère.</b> Si en el punto \\(x\\) se pone un cable perpendicular al plano con corriente \\(I\\), la circulación del campo magnético a lo largo de la curva es \\(\\mu_0 I\\, W(\\gamma, x)\\). La altura del terreno sobre \\(x\\) es esa circulación, en unidades de \\(\\mu_0 I\\): mover el cable sin cruzar la curva no la cambia; cruzarla la cambia en exactamente un escalón.</p>" },
  ],
    reiniciar: () => { sel.value = curva; rehacer?.(); },
  });
  alCambiarTema(() => rehacer?.());
  return gadget.raiz;
}
