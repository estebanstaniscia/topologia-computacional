// G5 · Esfera vs. toro (sección I.2, estación 2; spec §5, G5). Three.js por CDN.
//
// Una curva cerrada simple sobre la esfera y otra sobre el toro. El lector «vierte
// pintura» en un punto (clic sobre la superficie): la pintura se expande y se detiene en
// la curva. En la esfera siempre queda de un lado (Jordan vale en la esfera); en el toro,
// con un meridiano, la pintura da la vuelta y cubre todo: el complemento es conexo.
//
// La superficie se discretiza en una grilla en las coordenadas (u, v) de su
// parametrización (las mismas de la textura de Three.js); la pintura es una inundación
// (BFS, la ola de I.1) sobre esa grilla, con las vecindades periódicas del toro y los
// polos de la esfera. Esa lógica es pura y está testeada en Node.

import { html, lector, alCambiarTema } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";

// ------------------------------------------------------------------ lógica pura

export const NU = 96, NV = 48; // celdas en u (vuelta larga) y en v

/**
 * Vecinos de la celda (i, j) en la superficie. Toro: periódico en u y en v. Esfera: u
 * periódico y v no (las filas extremas rodean los polos).
 */
export function vecinos(superficie, i, j) {
  const out = [[(i + 1) % NU, j], [(i - 1 + NU) % NU, j]];
  if (superficie === "toro") {
    out.push([i, (j + 1) % NV], [i, (j - 1 + NV) % NV]);
  } else {
    // la fila extrema ya es un anillo alrededor del polo (u es periódico): no hace falta
    // saltar «por encima» del polo, que además cruzaría una curva que pase por él
    if (j + 1 < NV) out.push([i, j + 1]);
    if (j - 1 >= 0) out.push([i, j - 1]);
  }
  return out;
}

/**
 * Marca como pared las celdas por las que pasa una curva dada en coordenadas (u, v) ∈
 * [0, 1)², muestreada densamente; entre dos celdas en diagonal agrega la intermedia para
 * que la pared no tenga agujeros (en la grilla, la pintura avanza solo en cruz).
 */
export function pared(curvas) {
  const muro = new Uint8Array(NU * NV);
  let previa = null;
  const marcar = (i, j) => { muro[j * NU + i] = 1; };
  for (const curva of curvas) {
    previa = null;
    for (const [u, v] of curva) {
      const i = ((Math.floor(u * NU) % NU) + NU) % NU, j = Math.min(NV - 1, Math.max(0, Math.floor(v * NV)));
      if (previa && previa[0] !== i && previa[1] !== j) marcar(i, previa[1]);
      marcar(i, j);
      previa = [i, j];
    }
  }
  return muro;
}

/** Inundación desde (i, j): orden de llegada por capas (para animar). */
export function inundar(superficie, muro, i0, j0) {
  const dist = new Int32Array(NU * NV).fill(-1);
  if (muro[j0 * NU + i0]) return { dist, capas: [] };
  dist[j0 * NU + i0] = 0;
  const capas = [[[i0, j0]]];
  for (;;) {
    const nueva = [];
    for (const [i, j] of capas.at(-1)) {
      for (const [a, b] of vecinos(superficie, i, j)) {
        const q = b * NU + a;
        if (dist[q] < 0 && !muro[q]) { dist[q] = capas.length; nueva.push([a, b]); }
      }
    }
    if (!nueva.length) return { dist, capas };
    capas.push(nueva);
  }
}

/** Componentes del complemento de la pared (con union-find implícito: inundaciones sucesivas). */
export function componentes(superficie, muro) {
  const visto = new Uint8Array(NU * NV);
  let c = 0;
  for (let q = 0; q < NU * NV; q++) {
    if (visto[q] || muro[q]) continue;
    c++;
    const { dist } = inundar(superficie, muro, q % NU, Math.floor(q / NU));
    for (let k = 0; k < NU * NV; k++) if (dist[k] >= 0) visto[k] = 1;
  }
  return c;
}

const muestras = (f, n = 4000) => Array.from({ length: n + 1 }, (_, k) => f(k / n));

/** Curvas cerradas simples de cada superficie, en coordenadas (u, v). */
export const CURVAS_SUP = {
  esfera: {
    ecuador: { nombre: "Ecuador", curvas: [muestras((t) => [t, 0.5])] },
    meridiano: { nombre: "Meridiano (pasa por los polos)", curvas: [muestras((t) => [0.25, t]), muestras((t) => [0.75, t])] },
    inclinado: { nombre: "Círculo máximo inclinado", curvas: [muestras((t) => {
      // círculo máximo con normal inclinada 50°: parametrizado en 3D y llevado a (u, v)
      const a = 2 * Math.PI * t, inc = (50 * Math.PI) / 180;
      const x = Math.cos(a), y = Math.sin(a) * Math.cos(inc), z = Math.sin(a) * Math.sin(inc);
      return [(Math.atan2(y, x) / (2 * Math.PI) + 1) % 1, Math.acos(-z) / Math.PI];
    })] },
    paralelo: { nombre: "Paralelo (cerca del polo)", curvas: [muestras((t) => [t, 0.85])] },
  },
  toro: {
    meridiano: { nombre: "Meridiano (alrededor del tubo)", curvas: [muestras((t) => [0.0, t])] },
    paralelo: { nombre: "Paralelo (a lo largo del anillo)", curvas: [muestras((t) => [t, 0.5])] },
    diagonal: { nombre: "Curva (1, 1): una vuelta de cada", curvas: [muestras((t) => [t, t])] },
    dos: { nombre: "Dos meridianos (estos sí separan)", curvas: [muestras((t) => [0.0, t]), muestras((t) => [0.5, t])] },
  },
};

// ------------------------------------------------------------------ dibujo 3D

let THREE = null;
const cargarThree = () => (THREE ? Promise.resolve(THREE)
  : import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm").then((m) => (THREE = m)));

function escena3D(superficie, tk, alPintar) {
  const contenedor = html("div", { style: "position:relative;aspect-ratio:1/0.85;background:var(--tc-panel);border-radius:10px;overflow:hidden" });
  const rotulo = html("div", { class: "tc-g-pista", style: "top:8px;bottom:auto;font-weight:600" }, superficie === "esfera" ? "Esfera" : "Toro");
  const estado = { muro: null, dist: null, frente: 0, clave: null, malla: null, textura: null, lienzo: null, render: null };
  contenedor.append(rotulo);

  const pintarTextura = () => {
    if (!estado.lienzo) return;
    const ctx = estado.lienzo.getContext("2d"), img = ctx.createImageData(NU, NV);
    const hex = (c) => { const m = c.replace("#", ""); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
    const base = hex(tk("--tc-panel")), linea = hex(tk("--tc-linea")), muro = hex(tk("--tc-tinta")), pintura = hex(superficie === "esfera" ? tk("--tc-acento") : tk("--tc-seco"));
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const q = j * NU + i, d = estado.dist?.[q] ?? -1;
      let c = (i % 8 === 0 || j % 8 === 0) ? linea : base;
      if (estado.muro?.[q]) c = muro;
      else if (d >= 0 && d <= estado.frente) c = pintura;
      // la textura va con v hacia arriba
      img.data.set([c[0], c[1], c[2], 255], ((NV - 1 - j) * NU + i) * 4);
    }
    ctx.putImageData(img, 0, 0);
    if (estado.textura) estado.textura.needsUpdate = true;
    estado.render?.();
  };

  cargarThree().then((T) => {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
    contenedor.append(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", cursor: "crosshair" });
    const escena = new T.Scene(), camara = new T.PerspectiveCamera(40, 1, 0.1, 100);
    camara.position.set(0, 0, superficie === "esfera" ? 4.2 : 5.4);
    escena.add(new T.AmbientLight(0xffffff, 1.6));
    const luz = new T.DirectionalLight(0xffffff, 1.6);
    luz.position.set(2, 3, 4);
    escena.add(luz);
    estado.lienzo = document.createElement("canvas");
    estado.lienzo.width = NU; estado.lienzo.height = NV;
    estado.textura = new T.CanvasTexture(estado.lienzo);
    estado.textura.magFilter = T.NearestFilter;
    estado.textura.colorSpace = T.SRGBColorSpace;
    const geo = superficie === "esfera" ? new T.SphereGeometry(1.3, 96, 64) : new T.TorusGeometry(1.3, 0.55, 64, 128);
    const malla = new T.Mesh(geo, new T.MeshStandardMaterial({ map: estado.textura, roughness: 0.75 }));
    malla.rotation.set(superficie === "esfera" ? 0.35 : 0.9, superficie === "esfera" ? 0.4 : -0.7, 0);
    escena.add(malla);
    estado.malla = malla;
    const tam = () => {
      const r = contenedor.getBoundingClientRect();
      if (!r.width) return;
      renderer.setSize(r.width, r.height, false);
      camara.aspect = r.width / r.height;
      camara.updateProjectionMatrix();
    };
    estado.render = () => { tam(); renderer.render(escena, camara); };
    new ResizeObserver(() => estado.render()).observe(contenedor);
    // rotar arrastrando; clic sin arrastrar = verter pintura
    let arrastre = null;
    renderer.domElement.addEventListener("pointerdown", (e) => { arrastre = { x: e.clientX, y: e.clientY, movio: false }; renderer.domElement.setPointerCapture?.(e.pointerId); });
    renderer.domElement.addEventListener("pointermove", (e) => {
      if (!arrastre) return;
      const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) arrastre.movio = true;
      malla.rotation.y += dx * 0.01; malla.rotation.x += dy * 0.01;
      arrastre.x = e.clientX; arrastre.y = e.clientY;
      estado.render();
    });
    renderer.domElement.addEventListener("pointerup", (e) => {
      if (arrastre && !arrastre.movio) {
        const r = renderer.domElement.getBoundingClientRect();
        const ray = new T.Raycaster();
        ray.setFromCamera(new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camara);
        const hit = ray.intersectObject(malla)[0];
        if (hit?.uv) alPintar(Math.floor(hit.uv.x * NU) % NU, Math.min(NV - 1, Math.floor(hit.uv.y * NV)));
      }
      arrastre = null;
    });
    pintarTextura();
  }).catch(() => {
    contenedor.append(html("div", { class: "tc-pista", style: "padding:20px" }, "No se pudo cargar Three.js (se carga por CDN): la vista 3D necesita conexión."));
  });

  return { contenedor, estado, pintarTextura };
}

// ------------------------------------------------------------------ la pieza

export function esferaToro({ id = "g5", verter: verterAlInicio = false } = {}) {
  const escena = html("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px" });
  const tk = lector(escena);
  const lados = {};
  const sel = {};
  const lecturas = html("div", { class: "tc-g-tarjeta" });
  let reloj = null;

  const actualizarLecturas = () => {
    const filas = ["esfera", "toro"].map((s) => {
      const L = lados[s], c = componentes(s, L.estado.muro);
      return [html("span", {}, `${s === "esfera" ? "Esfera" : "Toro"} · ${CURVAS_SUP[s][sel[s].value].nombre}`), html("b", { class: c === 1 ? "tc-g-mal" : "tc-g-ok" }, `${c} componente${c > 1 ? "s" : ""}`)];
    });
    lecturas.replaceChildren(html("h4", {}, "Componentes del complemento"), html("div", { class: "tc-g-filas" }, ...filas.flat()),
      html("p", { class: "tc-pista", style: "margin:8px 0 0" }, "Clic sobre una superficie: vierte pintura en ese punto. Arrastrá para rotar."));
  };

  const verter = (s, i, j) => {
    const L = lados[s];
    const { dist, capas } = inundar(s, L.estado.muro, i, j);
    L.estado.dist = dist;
    L.estado.frente = 0;
    clearInterval(L.reloj);
    L.reloj = setInterval(() => {
      L.estado.frente += 2;
      L.pintarTextura();
      if (L.estado.frente >= capas.length) clearInterval(L.reloj);
    }, 30);
  };

  for (const s of ["esfera", "toro"]) {
    sel[s] = html("select", { "aria-label": `Curva sobre ${s}` }, ...Object.entries(CURVAS_SUP[s]).map(([k, c]) => html("option", { value: k }, c.nombre)));
    lados[s] = escena3D(s, tk, (i, j) => verter(s, i, j));
    const cargar = () => {
      lados[s].estado.muro = pared(CURVAS_SUP[s][sel[s].value].curvas);
      lados[s].estado.dist = null;
      lados[s].pintarTextura();
      actualizarLecturas();
    };
    sel[s].addEventListener("change", cargar);
    lados[s].cargar = cargar;
    escena.append(html("div", { class: "tc-g-tarjeta", style: "padding:8px;display:flex;flex-direction:column;gap:6px" }, sel[s], lados[s].contenedor));
    lados[s].estado.muro = pared(CURVAS_SUP[s][sel[s].value].curvas);
  }
  const bVerter = html("button", { class: "tc-primario", title: "Verter pintura en un punto fijo de cada superficie" }, "Verter pintura en las dos");
  bVerter.addEventListener("click", () => { verter("esfera", 10, 12); verter("toro", 20, 10); });

  const gadget = montarGadget({
    id,
    titulo: "Esfera vs. toro",
    subtitulo: "¿la curva separa? Verté pintura y mirá",
    escenario: html("div", {}, escena, html("div", { style: "padding:0 8px 8px" }, lecturas)),
    controles: bVerter,
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p><b>Esfera (ejercicio 3(i)) ★.</b> Se elige un punto \\(N\\) fuera de la curva y se proyecta estereográficamente desde \\(N\\): la curva va a una curva de Jordan del plano, que lo parte en dos. Al volver, el afuera contiene a \\(N\\). Por eso en la esfera la pintura siempre se detiene.</p><p><b>Toro (ejercicio 3(ii)) ★.</b> El complemento de un meridiano es un cilindro abierto: <b>conexo</b>. Una curva cerrada simple en el toro puede no separar. Dos meridianos, en cambio, sí.</p>" },
      { id: "prog", nombre: "Programador", contenido: () => "<p>La superficie es una grilla en las coordenadas \\((u, v)\\) de su parametrización (las mismas de la textura en Three.js). La pintura es una <b>búsqueda en anchura</b>, la ola de I.1, que no cruza las celdas de la curva. La única diferencia entre esfera y toro está en la función <code>vecinos</code>: en el toro, \\(u\\) y \\(v\\) dan la vuelta; en la esfera, solo \\(u\\), y los polos conectan una fila entera.</p>" },
      { id: "geo", nombre: "Geómetra", contenido: () => "<p>El toro tiene un <b>agujero</b> que la esfera no: hay curvas que lo rodean (meridianos y paralelos) y que ningún movimiento achica a un punto. Esas curvas no separan. En el capítulo IV, esto se mide: el toro tiene \\(\\beta_1 = 2\\) y la esfera \\(\\beta_1 = 0\\).</p>" },
    ],
    reiniciar: () => { for (const s of ["esfera", "toro"]) { sel[s].selectedIndex = 0; lados[s].cargar(); } },
    queVeo: () => [{ elemento: lados.toro.contenedor, texto: "clic: vertir pintura · arrastrar: rotar" }],
  });
  alCambiarTema(() => { lados.esfera.pintarTextura(); lados.toro.pintarTextura(); });
  actualizarLecturas();
  if (verterAlInicio) setTimeout(() => bVerter.click(), 600);
  void reloj;
  return gadget.raiz;
}
