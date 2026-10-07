// G3 · Proyector estereográfico (sección I.2, estación 1; spec §5, G3). Ejercicio 4.
//
// El círculo S¹, el polo norte N = (0, 1) y un punto p que el lector arrastra sobre el
// círculo. La recta que une N con p corta el eje horizontal en σ(p) = x / (1 − y): un
// homeomorfismo S¹ ∖ {N} → ℝ. Cuando p se acerca a N, σ(p) se va al infinito. En paralelo,
// la logística ℝ → (0, 1): los tres espacios S¹ ∖ {N}, ℝ y (0, 1) son el mismo.
//
// Modo 3D (Three.js): la esfera de Riemann apoyada en el plano (tangente en el polo sur).
// Una curva de Jordan del plano se ve en la esfera, y el «afuera» (la región no acotada)
// es la que contiene al polo N (ejercicio 3(i)); una recta del plano es un círculo de la
// esfera que pasa por N.

import { svg, html, texto, lector, alCambiarTema, puntoSVG } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";
import { paridad } from "./curvas.js";

// ------------------------------------------------------------------ lógica pura

/** Proyección estereográfica desde N = (0, 1): S¹ ∖ {N} → ℝ. */
export const estereo = ([x, y]) => x / (1 - y);
/** Su inversa: ℝ → S¹ ∖ {N}. */
export const estereoInversa = (t) => [(2 * t) / (1 + t * t), (t * t - 1) / (t * t + 1)];
/** La logística: ℝ → (0, 1). */
export const logistica = (t) => 1 / (1 + Math.exp(-t));
/** (0, 1) → S¹ ∖ {N}, recorriendo el círculo desde N hasta N sin tocarlo. */
export const arco = (s) => [Math.cos(Math.PI / 2 + 2 * Math.PI * s), Math.sin(Math.PI / 2 + 2 * Math.PI * s)];

// ------------------------------------------------------------------ lógica pura, 3D

/** Esfera unidad → plano tangente en el polo sur S = (0, 0, −1), proyectando desde N. */
export const estereoTangente = ([x, y, z]) => [(2 * x) / (1 - z), (2 * y) / (1 - z)];
/** Su inversa: plano → esfera ∖ {N}. */
export const estereoTangenteInversa = ([u, v]) => {
  const r2 = u * u + v * v;
  return [(4 * u) / (r2 + 4), (4 * v) / (r2 + 4), (r2 - 4) / (r2 + 4)];
};

/** Curvas del plano (tangente), escaladas por `tam`. La recta no es cerrada. */
export const CURVAS_PLANO = {
  circulo: { nombre: "Círculo centrado en S", cerrada: true, f: (t, tam) => [tam * Math.cos(t), tam * Math.sin(t)] },
  estrella: { nombre: "Estrella", cerrada: true, f: (t, tam) => { const r = tam * (1 + 0.45 * Math.cos(5 * t)); return [r * Math.cos(t), r * Math.sin(t)]; } },
  elipse: { nombre: "Elipse corrida", cerrada: true, f: (t, tam) => [tam * (0.9 + 1.4 * Math.cos(t)), tam * 0.8 * Math.sin(t)] },
  recta: { nombre: "Recta (y viceversa)", cerrada: false, f: (t, tam) => [0.5 * tam, Math.tan((t - Math.PI) / 2.02)] },
};

export function curvaPlano(clave, tam, n = 240) {
  const c = CURVAS_PLANO[clave];
  const puntos = Array.from({ length: n }, (_, k) => c.f((2 * Math.PI * (k + 0.5)) / n, tam));
  return { puntos, cerrada: c.cerrada, clave, tam };
}

const aEnteros = (P) => P.map(([u, v]) => [Math.round(u * 1e4), Math.round(v * 1e4)]);

/**
 * ¿De qué lado de la curva queda el punto p de la esfera? Se proyecta al plano y se usa el
 * algoritmo de paridad; N (el punto del infinito) está siempre en la región no acotada.
 * Para la recta, los dos semiplanos: «adentro» es el lado de S.
 */
export function ladoEnEsfera(p, curva) {
  if (p[2] > 1 - 1e-12) return "afuera";
  const q = estereoTangente(p);
  if (!curva.cerrada) return q[0] < 0.5 * curva.tam ? "adentro" : "afuera";
  curva.enteros ??= aEnteros(curva.puntos);
  return paridad([Math.round(q[0] * 1e4) + 0.5, Math.round(q[1] * 1e4) + 0.5], curva.enteros) === "adentro" ? "adentro" : "afuera";
}

/** Puntos casi uniformes en la esfera (espiral de Fibonacci). */
export const puntosFibonacci = (n) => Array.from({ length: n }, (_, k) => {
  const z = 1 - (2 * (k + 0.5)) / n, r = Math.sqrt(1 - z * z), t = k * Math.PI * (3 - Math.sqrt(5));
  return [r * Math.cos(t), r * Math.sin(t), z];
});

/** Fracción del área de la esfera que queda adentro de la curva. */
export function fraccionAdentro(curva, n = 4000) {
  const P = puntosFibonacci(n);
  return P.filter((p) => ladoEnEsfera(p, curva) === "adentro").length / n;
}

// ------------------------------------------------------------------ la pieza

export function proyectorEstereografico({ id = "g3" } = {}) {
  const W = 640, H = 315, R = 110, cx = 200, cy = 170, esc = R; // unidades: 1 = R píxeles
  const lienzo = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Círculo con el polo norte N, un punto p arrastrable y su proyección estereográfica sobre la recta; a la derecha, la logística" });
  const vista2d = html("div", {}, lienzo);
  const vista3d = html("div", { hidden: true });
  const escena = html("div", {}, vista2d, vista3d);
  const tk = lector(escena);
  let ang = -0.6; // ángulo de p
  let arrastre = false;

  const aS = ([x, y]) => [cx + x * esc, cy - y * esc];
  function dibujar() {
    lienzo.replaceChildren();
    const p = [Math.cos(ang), Math.sin(ang)], t = estereo(p);
    // el eje (la recta ℝ) y el círculo
    svg("line", { x1: 10, y1: cy, x2: 400, y2: cy, stroke: tk("--tc-linea"), "stroke-width": 2 }, lienzo);
    for (let k = -3; k <= 3; k++) {
      const q = aS([k, 0]);
      if (q[0] < 10 || q[0] > 400) continue;
      svg("line", { x1: q[0], y1: cy - 4, x2: q[0], y2: cy + 4, stroke: tk("--tc-tenue") }, lienzo);
      // ±1 caen sobre el círculo: se corren hacia afuera para que no los tape el trazo
      const dx = Math.abs(k) === 1 ? 9 * k : 0;
      texto(lienzo, q[0] + dx, cy + 18, String(k), { "text-anchor": k === 1 ? "start" : k === -1 ? "end" : "middle", "font-size": 11, fill: tk("--tc-tenue") });
    }
    svg("circle", { cx, cy, r: R, fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 2.5 }, lienzo);
    const N = aS([0, 1]), P = aS(p), T = aS([t, 0]);
    // la recta de N a σ(p), recortada a la vista
    const fin = Math.abs(t) * esc < 2000 ? T : aS([Math.sign(t) * 20, 0]);
    svg("line", { x1: N[0], y1: N[1], x2: fin[0], y2: fin[1], stroke: tk("--tc-camino"), "stroke-width": 2 }, lienzo);
    svg("circle", { cx: N[0], cy: N[1], r: 6, fill: tk("--tc-panel"), stroke: tk("--tc-rechazo"), "stroke-width": 2.5 }, lienzo);
    texto(lienzo, N[0] + 10, N[1] - 8, "N (sacado)", { "font-size": 13, "font-weight": 700, fill: tk("--tc-rechazo") });
    if (Math.abs(t) < 3.2) svg("circle", { cx: T[0], cy: T[1], r: 7, fill: tk("--tc-seco") }, lienzo);
    const g = svg("g", { style: "cursor:grab" }, lienzo);
    svg("circle", { cx: P[0], cy: P[1], r: 9, fill: tk("--tc-acento"), stroke: tk("--tc-panel"), "stroke-width": 2 }, g);
    texto(g, P[0] + 12, P[1] + 4, "p", { "font-size": 15, "font-style": "italic", "font-weight": 700, fill: tk("--tc-acento") });
    g.addEventListener("pointerdown", (e) => { arrastre = true; lienzo.setPointerCapture?.(e.pointerId); });
    texto(lienzo, 12, 24, `σ(p) = x / (1 − y) = ${Math.abs(t) > 1e4 ? (t > 0 ? "+∞ (casi)" : "−∞ (casi)") : t.toFixed(3)}`, { "font-size": 15, "font-weight": 700, fill: tk("--tc-seco") });
    // la logística a la derecha
    const gx = 430, gw = 190, gy = 60, gh = 220;
    const L = ([u, v]) => [gx + ((u + 6) / 12) * gw, gy + gh - v * gh];
    svg("rect", { x: gx, y: gy, width: gw, height: gh, fill: "none", stroke: tk("--tc-linea") }, lienzo);
    const pts = Array.from({ length: 121 }, (_, k) => { const u = -6 + (12 * k) / 120; return L([u, logistica(u)]).join(","); });
    svg("polyline", { points: pts.join(" "), fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 2 }, lienzo);
    for (const v of [0, 1]) svg("line", { x1: gx, y1: L([0, v])[1], x2: gx + gw, y2: L([0, v])[1], stroke: tk("--tc-tenue"), "stroke-dasharray": "3 3" }, lienzo);
    const tl = Math.max(-6, Math.min(6, t)), Q = L([tl, logistica(t)]);
    svg("circle", { cx: Q[0], cy: Q[1], r: 6, fill: tk("--tc-seco") }, lienzo);
    texto(lienzo, gx, gy - 10, `logística(σ(p)) = ${logistica(t).toFixed(4)} ∈ (0, 1)`, { "font-size": 13, fill: tk("--tc-tinta") });
    texto(lienzo, gx + gw / 2, gy + gh + 18, "ℝ → (0, 1)", { "font-size": 12, "text-anchor": "middle", fill: tk("--tc-tenue") });
  }
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const [mx, my] = puntoSVG(lienzo, e);
    ang = Math.atan2(-(my - cy), mx - cx);
    // no dejar llegar exactamente a N (π/2): ahí σ no está definida
    if (Math.abs(ang - Math.PI / 2) < 0.002) ang = Math.PI / 2 - 0.002 * Math.sign(ang - Math.PI / 2 || 1);
    dibujar();
  });
  lienzo.addEventListener("pointerup", () => { arrastre = false; });

  // ---------------------------------------------------------------- modo 3D
  const tresD = esferaDeRiemann(tk);
  vista3d.append(tresD.raiz);
  const controles3d = html("div", { style: "display:contents", hidden: true }, tresD.controles);

  const gadget = montarGadget({
    id,
    titulo: "Proyector estereográfico",
    modos: [{ id: "2d", nombre: "Círculo (2D)" }, { id: "3d", nombre: "Esfera (3D)" }],
    alCambiarModo: (m) => {
      vista2d.hidden = m === "3d"; vista3d.hidden = m !== "3d"; controles3d.hidden = m !== "3d";
      if (m === "3d") tresD.activar();
    },
    controles: controles3d,
    subtitulo: "S¹ ∖ {N}, ℝ y (0, 1) son el mismo espacio",
    escenario: escena,
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p><b>Ejercicio 4 ★.</b> \\(\\sigma(x, y) = \\frac{x}{1 - y}\\) es un homeomorfismo \\(S^1 \\setminus \\{N\\} \\to \\mathbb{R}\\), con inversa \\(t \\mapsto \\left(\\frac{2t}{1+t^2}, \\frac{t^2-1}{t^2+1}\\right)\\). La logística \\(t \\mapsto 1/(1 + e^{-t})\\) lleva \\(\\mathbb{R}\\) a \\((0, 1)\\). En dimensión 2, la misma proyección lleva la esfera menos un punto al plano: por eso Jordan vale en la esfera.</p>" },
      { id: "geo", nombre: "Geómetra", contenido: () => "<p><b>Modo 3D, ejercicio 3(i) ★.</b> La esfera apoyada en el plano: \\(\\sigma(x, y, z) = \\frac{2(x, y)}{1 - z}\\) proyecta desde el polo norte \\(N\\). Una curva de Jordan del plano se ve en la esfera, y la región <b>no acotada</b> del plano es la que contiene a \\(N\\): en la esfera, «adentro» y «afuera» son simétricos (dos discos), y lo único que distingue al afuera es contener el punto del infinito. Agrandá la curva: el afuera se achica a un casquete alrededor de \\(N\\), pero nunca desaparece. La recta es un círculo que pasa por \\(N\\): en la esfera, rectas y círculos son lo mismo.</p>" },
      { id: "prog", nombre: "Programador", contenido: () => "<p>La logística es la misma función de la regresión logística y de las redes neuronales: comprime toda la recta real en el intervalo \\((0, 1)\\) sin romper nada (es continua, biyectiva y con inversa continua, la función <i>logit</i>). Topológicamente, una red que termina en una sigmoide no pierde información de forma.</p>" },
    ],
    reiniciar: () => { ang = -0.6; dibujar(); tresD.reiniciar(); },
  });
  alCambiarTema(() => { dibujar(); tresD.rehacer(); });
  dibujar();
  return gadget.raiz;
}

// ------------------------------------------------------------------ la esfera de Riemann (3D)

let THREE = null;
const cargarThree = () => (THREE ? Promise.resolve(THREE)
  : import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm").then((m) => (THREE = m)));

function esferaDeRiemann(tk) {
  const contenedor = html("div", { style: "position:relative;aspect-ratio:16/10;background:var(--tc-panel)" });
  const selCurva = html("select", { "aria-label": "Curva del plano" }, ...Object.entries(CURVAS_PLANO).map(([k, c]) => html("option", { value: k }, c.nombre)));
  const desliz = html("input", { type: "range", min: 0.3, max: 8, step: 0.05, value: 1.6, "aria-label": "Tamaño de la curva" });
  const controles = html("div", { style: "display:contents" }, selCurva, html("label", {}, "Tamaño", desliz));
  const lecturas = html("div", { class: "tc-g-tarjeta" });
  const raiz = html("div", {}, contenedor, html("div", { style: "padding:8px" }, lecturas));
  let activo = false, rehacer = () => {}, giro = -0.5;

  const actualizarLecturas = (curva) => {
    const f = fraccionAdentro(curva, 3000);
    const recta = !curva.cerrada;
    lecturas.replaceChildren(html("h4", {}, recta ? "Una recta es un círculo por N" : "Ejercicio 3(i): ¿dónde queda el polo?"), html("div", { class: "tc-g-filas" },
      html("span", {}, recta ? "Lado de S (izquierda)" : "Esfera adentro de la curva"), html("b", { style: `color:${tk("--tc-c1")}` }, `${(100 * f).toFixed(1)} %`),
      html("span", {}, recta ? "Lado opuesto" : "Esfera afuera"), html("b", { style: `color:${tk("--tc-c2")}` }, `${(100 * (1 - f)).toFixed(1)} %`),
      html("span", {}, "El polo N"), html("b", {}, recta ? "sobre la curva (la recta llega al infinito)" : "afuera, siempre: es el punto del infinito"),
      ...(curva.clave === "circulo" ? [html("span", {}, "Fórmula del casquete: R²/(R² + 4)"), html("b", {}, `${((100 * curva.tam ** 2) / (curva.tam ** 2 + 4)).toFixed(1)} %`)] : [])));
  };

  function activar() {
    if (activo) return;
    activo = true;
    cargarThree().then((T) => {
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
      Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", cursor: "grab" });
      contenedor.append(renderer.domElement);
      const escena = new T.Scene(), camara = new T.PerspectiveCamera(38, 16 / 10, 0.1, 100);
      camara.position.set(0, -8.6, 4.6);
      camara.up.set(0, 0, 1);
      camara.lookAt(0, 0, -0.1);
      escena.add(new T.AmbientLight(0xffffff, 1.5));
      const luz = new T.DirectionalLight(0xffffff, 1.3);
      luz.position.set(3, -4, 6);
      escena.add(luz);
      const grupo = new T.Group();
      escena.add(grupo);
      const L = 4.2; // medio lado del plano dibujado
      const color = (lado) => new T.Color(tk(lado === "adentro" ? "--tc-c1" : "--tc-c2"));

      rehacer = () => {
        const curva = curvaPlano(selCurva.value, +desliz.value, 200);
        grupo.clear();
        // la esfera, coloreada por lado (por vértice)
        const geoE = new T.SphereGeometry(1, 96, 64);
        geoE.rotateX(Math.PI / 2); // polos en el eje z
        geoE.translate(0, 0, 1);   // apoyada en el plano z = 0 (el centro en z = 1)
        const posE = geoE.attributes.position, colE = [];
        for (let k = 0; k < posE.count; k++) {
          const p = [posE.getX(k), posE.getY(k), posE.getZ(k) - 1];
          const c = color(ladoEnEsfera(p, curva));
          colE.push(c.r, c.g, c.b);
        }
        geoE.setAttribute("color", new T.Float32BufferAttribute(colE, 3));
        grupo.add(new T.Mesh(geoE, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })));
        // el plano z = 0, también por lado
        const geoP = new T.PlaneGeometry(2 * L, 2 * L, 110, 110);
        const posP = geoP.attributes.position, colP = [];
        for (let k = 0; k < posP.count; k++) {
          const c = color(ladoEnEsfera(estereoTangenteInversa([posP.getX(k), posP.getY(k)]), curva));
          colP.push(c.r, c.g, c.b);
        }
        geoP.setAttribute("color", new T.Float32BufferAttribute(colP, 3));
        grupo.add(new T.Mesh(geoP, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, side: T.DoubleSide })));
        // la curva en el plano (recortada a la vista) y su imagen en la esfera
        const tinta = new T.LineBasicMaterial({ color: tk("--tc-tinta") });
        const enVista = curva.puntos.filter(([u, v]) => Math.abs(u) <= L && Math.abs(v) <= L);
        const plano = enVista.map(([u, v]) => new T.Vector3(u, v, 0.003));
        if (curva.cerrada && enVista.length === curva.puntos.length) plano.push(plano[0]);
        if (plano.length > 1) grupo.add(new T.Line(new T.BufferGeometry().setFromPoints(plano), tinta));
        const esfera = curva.puntos.map((q) => { const p = estereoTangenteInversa(q); return new T.Vector3(p[0] * 1.004, p[1] * 1.004, p[2] * 1.004 + 1); });
        if (curva.cerrada) esfera.push(esfera[0]);
        grupo.add(new T.Line(new T.BufferGeometry().setFromPoints(esfera), tinta));
        // unos rayos desde N: cada punto de la curva y su sombra
        const N = new T.Vector3(0, 0, 2);
        const rayo = new T.LineBasicMaterial({ color: tk("--tc-camino"), transparent: true, opacity: 0.7 });
        for (let k = 0; k < 8; k++) {
          const q = curva.puntos[Math.floor((k * curva.puntos.length) / 8)];
          if (Math.abs(q[0]) > L || Math.abs(q[1]) > L) continue;
          grupo.add(new T.Line(new T.BufferGeometry().setFromPoints([N, new T.Vector3(q[0], q[1], 0)]), rayo));
        }
        const polo = new T.Mesh(new T.SphereGeometry(0.06, 16, 12), new T.MeshBasicMaterial({ color: tk("--tc-rechazo") }));
        polo.position.copy(N);
        grupo.add(polo);
        actualizarLecturas(curva);
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
      actualizarLecturas(curvaPlano(selCurva.value, +desliz.value));
    });
  }
  // el deslizador dispara muchos eventos: a lo sumo un recálculo por cuadro
  let pendiente = false;
  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; rehacer(); });
  };
  selCurva.addEventListener("change", pedir);
  desliz.addEventListener("input", pedir);
  return {
    raiz, controles, activar,
    rehacer: () => rehacer(),
    reiniciar: () => { selCurva.value = "circulo"; desliz.value = 1.6; giro = -0.5; rehacer(); },
  };
}
