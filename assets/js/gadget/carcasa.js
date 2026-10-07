// Carcasa común de gadgets (paradigma v2, FILOSOFIA.md §8).
//
// Todo gadget del sitio se monta con `montarGadget(opciones)`, que devuelve un
// elemento listo para una celda OJS. La carcasa provee lo que comparten todos (como
// la barra de una app de sistema operativo): título, ¿qué estoy viendo?, enlace
// permanente al estado (en el hash de la URL), exportar imagen, reiniciar, pantalla
// completa, pestañas de lentes y selector de modo. El gadget solo aporta su escenario,
// sus lecturas y su lógica (que vive aparte y se testea en Node).

import { html, tipografiar } from "../comun.js";

// ------------------------------------------------------------------ lógica pura

/** Codifica un estado (objeto JSON) en base64url, apto para la URL. */
export function codificarEstado(estado) {
  const json = JSON.stringify(estado);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Inversa de `codificarEstado`; devuelve null si el texto no es un estado válido. */
export function decodificarEstado(texto) {
  try {
    const b64 = texto.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((texto.length + 3) % 4);
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** Lee el valor de `clave` en un hash con la forma `#g1=...&g4=...`. */
export function leerDelHash(hash, clave) {
  for (const parte of hash.replace(/^#/, "").split("&")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i) === clave) return parte.slice(i + 1);
  }
  return null;
}

/** Devuelve el hash con `clave=valor` escrito (y las demás claves intactas). */
export function escribirEnHash(hash, clave, valor) {
  const partes = hash.replace(/^#/, "").split("&").filter((p) => p && !p.startsWith(clave + "="));
  partes.push(`${clave}=${valor}`);
  return "#" + partes.join("&");
}

// ------------------------------------------------------------------ utilidades DOM

const ICONOS = {
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.6" r="0.6" fill="currentColor"/>',
  enlace: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  exportar: '<path d="M12 4v11"/><path d="M7 10.5l5 5 5-5"/><path d="M5 19.5h14"/>',
  reiniciar: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  pantalla: '<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>',
};

function icono(nombre) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", "18");
  s.setAttribute("height", "18");
  s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor");
  s.setAttribute("stroke-width", "1.8");
  s.setAttribute("stroke-linecap", "round");
  s.setAttribute("stroke-linejoin", "round");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = ICONOS[nombre];
  return s;
}

function boton(nombre, titulo, accion) {
  const b = html("button", { class: "tc-g-boton", title: titulo, "aria-label": titulo, type: "button" }, icono(nombre));
  b.addEventListener("click", accion);
  return b;
}

function aviso(raiz, texto) {
  const a = html("div", { class: "tc-g-aviso", role: "status" }, texto);
  raiz.append(a);
  setTimeout(() => a.remove(), 2200);
}

/** Compone las capas (canvas y svg) del escenario en un PNG. */
async function aPNG(escenario, fondo) {
  const r = escenario.getBoundingClientRect();
  const escala = 2;
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(r.width * escala);
  lienzo.height = Math.round(r.height * escala);
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  for (const capa of escenario.querySelectorAll("canvas, svg")) {
    const rc = capa.getBoundingClientRect();
    const x = (rc.left - r.left) * escala, y = (rc.top - r.top) * escala;
    const w = rc.width * escala, h = rc.height * escala;
    if (capa.tagName.toLowerCase() === "canvas") {
      ctx.drawImage(capa, x, y, w, h);
    } else {
      const fuente = new XMLSerializer().serializeToString(capa);
      const img = new Image();
      const url = URL.createObjectURL(new Blob([fuente], { type: "image/svg+xml" }));
      await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = url; });
      ctx.drawImage(img, x, y, w, h);
      URL.revokeObjectURL(url);
    }
  }
  return lienzo.toDataURL("image/png");
}

function descargar(url, nombre) {
  const a = html("a", { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
}

// ------------------------------------------------------------------ la carcasa

/**
 * Monta un gadget. Opciones:
 * - `id` (clave del estado en la URL), `titulo`, `subtitulo`.
 * - `escenario`: el elemento de manipulación directa (con sus canvas/svg).
 * - `lecturas`: elemento con los instrumentos (va al costado, o abajo en pantallas chicas).
 * - `controles`: elemento con la barra de controles propios del gadget.
 * - `lentes`: [{id, nombre, contenido: () => string HTML}] (se recalculan con `refrescarLentes`).
 * - `modos`: [{id, nombre}] y `alCambiarModo(id)`.
 * - `estado`: {obtener: () => objeto, aplicar: (objeto) => void} para el enlace permanente.
 * - `reiniciar`: () => void.
 * - `queVeo`: () => [{elemento, texto}] para las etiquetas de «¿Qué estoy viendo?».
 * - `ancho`: "normal" | "completo" (gadget estrella).
 * Devuelve {raiz, refrescarLentes, modo(), avisar(texto)}.
 */
export function montarGadget(op) {
  const raiz = html("section", {
    class: "tc-gadget" + (op.ancho === "completo" ? " tc-gadget-completo" : ""),
    "aria-label": op.titulo,
  });

  // barra superior
  const bQue = boton("info", "¿Qué estoy viendo?", () => alternarQueVeo());
  const bEnlace = boton("enlace", "Copiar un enlace a este estado", () => copiarEnlace());
  const bExportar = boton("exportar", "Exportar imagen (PNG; con Mayúscula: SVG)", (e) => exportar(e.shiftKey));
  const bReiniciar = boton("reiniciar", "Reiniciar", () => { op.reiniciar?.(); quitarQueVeo(); });
  const bPantalla = boton("pantalla", "Pantalla completa (modo estudio)", () => alternarPantalla());
  if (!op.estado) bEnlace.hidden = true;
  if (!op.reiniciar) bReiniciar.hidden = true;
  if (!op.queVeo) bQue.hidden = true;
  const barra = html("header", { class: "tc-g-barra" },
    html("div", { class: "tc-g-titulos" }, html("h3", {}, op.titulo), op.subtitulo ? html("span", {}, op.subtitulo) : null),
    html("div", { class: "tc-g-acciones" }, bQue, bEnlace, bExportar, bReiniciar, bPantalla));

  // modos
  let modoActual = op.modos?.[0]?.id ?? null;
  const selModos = op.modos?.length
    ? html("div", { class: "tc-g-modos", role: "tablist", "aria-label": "Modo" },
      ...op.modos.map((m) => {
        const b = html("button", { type: "button", role: "tab", "data-modo": m.id, "aria-selected": String(m.id === modoActual) }, m.nombre);
        b.addEventListener("click", () => ponerModo(m.id));
        return b;
      }))
    : null;

  // escenario y lecturas
  const contEscenario = html("div", { class: "tc-g-escenario" }, op.escenario);
  const cuerpo = html("div", { class: "tc-g-cuerpo" + (op.lecturas ? " con-lecturas" : "") },
    // (no <aside>: Quarto lo manda a la columna de márgenes de su grilla de página)
    contEscenario, op.lecturas ? html("div", { class: "tc-g-lecturas" }, op.lecturas) : null);

  // lentes
  let lenteActual = op.lentes?.[0]?.id ?? null;
  let ultimoContenido = null;
  const cuerpoLente = html("div", { class: "tc-g-lente", role: "tabpanel", "aria-live": "polite" });
  const pestanas = op.lentes?.length
    ? html("div", { class: "tc-g-pestanas", role: "tablist", "aria-label": "Lentes" },
      ...op.lentes.map((l) => {
        const b = html("button", { type: "button", role: "tab", "data-lente": l.id, "aria-selected": String(l.id === lenteActual) }, l.nombre);
        b.addEventListener("click", () => { lenteActual = l.id; refrescarLentes(); });
        return b;
      }))
    : null;
  const bloqueLentes = pestanas ? html("div", { class: "tc-g-lentes" }, html("span", { class: "tc-g-rotulo" }, "Lentes"), pestanas, cuerpoLente) : null;

  // (append convertiría un null en el texto "null")
  raiz.append(...[barra,
    (op.controles || selModos) ? html("div", { class: "tc-g-controles" }, selModos, op.controles) : null,
    cuerpo, bloqueLentes].filter(Boolean));

  // ------------------------------------------------------------- comportamiento
  function refrescarLentes() {
    if (!bloqueLentes) return;
    pestanas.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.lente === lenteActual)));
    const lente = op.lentes.find((l) => l.id === lenteActual);
    const nuevo = lente ? lente.contenido() : "";
    // solo si cambió: rehacerlo en cada cuadro pisaría la tipografía de MathJax
    if (nuevo === ultimoContenido) return;
    ultimoContenido = nuevo;
    cuerpoLente.innerHTML = nuevo;
    tipografiar(cuerpoLente);
  }

  function ponerModo(id) {
    modoActual = id;
    selModos?.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.modo === id)));
    op.alCambiarModo?.(id);
  }

  let capaQueVeo = null;
  function quitarQueVeo() { capaQueVeo?.remove(); capaQueVeo = null; bQue.setAttribute("aria-pressed", "false"); }
  function alternarQueVeo() {
    if (capaQueVeo) return quitarQueVeo();
    const base = contEscenario.getBoundingClientRect();
    capaQueVeo = html("div", { class: "tc-g-quevoy", "aria-hidden": "true" });
    for (const { elemento, texto } of op.queVeo() || []) {
      if (!elemento) continue;
      const r = elemento.getBoundingClientRect();
      const etiqueta = html("span", { class: "tc-g-etiqueta" }, texto);
      etiqueta.style.left = `${Math.max(4, r.left - base.left + r.width / 2)}px`;
      etiqueta.style.top = `${Math.max(4, r.top - base.top + r.height / 2)}px`;
      capaQueVeo.append(etiqueta);
    }
    contEscenario.append(capaQueVeo);
    bQue.setAttribute("aria-pressed", "true");
  }

  async function copiarEnlace() {
    const valor = codificarEstado(op.estado.obtener());
    const hash = escribirEnHash(location.hash, op.id, valor);
    history.replaceState(null, "", hash);
    try {
      await navigator.clipboard.writeText(location.href);
      aviso(raiz, "Enlace copiado: abre el gadget en este mismo estado.");
    } catch {
      aviso(raiz, "Enlace listo en la barra de direcciones.");
    }
  }

  async function exportar(comoSVG) {
    const svgPrincipal = contEscenario.querySelector("svg");
    if (comoSVG && svgPrincipal) {
      const fuente = new XMLSerializer().serializeToString(svgPrincipal);
      const url = URL.createObjectURL(new Blob([fuente], { type: "image/svg+xml" }));
      descargar(url, `${op.id || "gadget"}.svg`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const fondo = getComputedStyle(raiz).getPropertyValue("--tc-panel").trim() || "#fff";
    descargar(await aPNG(contEscenario, fondo), `${op.id || "gadget"}.png`);
  }

  function alternarPantalla() {
    if (document.fullscreenElement === raiz) document.exitFullscreen?.();
    else raiz.requestFullscreen?.().catch(() => aviso(raiz, "El navegador no permitió la pantalla completa."));
  }

  // estado inicial desde la URL
  if (op.estado && op.id && typeof location !== "undefined") {
    const valor = leerDelHash(location.hash, op.id);
    const est = valor && decodificarEstado(valor);
    if (est) queueMicrotask(() => op.estado.aplicar(est));
  }
  refrescarLentes();

  return {
    raiz,
    refrescarLentes,
    modo: () => modoActual,
    ponerModo,
    avisar: (t) => aviso(raiz, t),
  };
}

// ------------------------------------------------------------------ piezas de página

/** Ficha «Libro · p. X · nombre»: cita el libro en lugar de repetirlo. */
export function fichaLibro(paginas, nombre) {
  return html("span", { class: "tc-ficha" }, html("span", {}, "Libro"), html("b", {}, paginas), html("span", {}, nombre));
}
