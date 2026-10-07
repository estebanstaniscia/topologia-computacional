// Scrollytelling (sección I.2, estación 5; spec §3): un gadget fijo a la izquierda y
// tarjetas a la derecha que, al pasar por el centro de la pantalla, le cambian el escenario
// (un listener de scroll, regulado con requestAnimationFrame).
//
// Las tarjetas se escriben en Markdown en el .qmd (Quarto las renderiza con MathJax):
//
//   :::: {#scrolly-e5 .tc-scrolly .column-page}
//   ::: {.tc-scrolly-gadget}   ← la celda OJS del gadget
//   ::: {.tc-scrolly-pasos}    ← un ::: {.tc-paso data-escenario="..."} por tarjeta
//
// El gadget expone `raiz.tcEscenario(clave)`. Sin JavaScript de scroll (pantallas angostas
// o lectores de pantalla), cada tarjeta es además un botón que carga su escenario.

/** Índice de la tarjeta más cercana al centro de la ventana (lógica pura, testeable). */
export function pasoCentral(rectangulos, alto) {
  let mejor = -1, dmin = Infinity;
  rectangulos.forEach(({ top, bottom }, i) => {
    const d = top <= alto / 2 && bottom >= alto / 2 ? 0 : Math.min(Math.abs(top - alto / 2), Math.abs(bottom - alto / 2));
    if (d < dmin) { dmin = d; mejor = i; }
  });
  return mejor;
}

export function scrolly(id) {
  const marca = document.createElement("span");
  let intentos = 0;
  const conectar = () => {
    const raiz = document.getElementById(id);
    const gadget = raiz?.querySelector(".tc-gadget");
    if (!gadget?.tcEscenario) {
      if (intentos++ < 200) requestAnimationFrame(conectar);
      return;
    }
    const pasos = [...raiz.querySelectorAll(".tc-paso")];
    let activo = -1;
    const activar = (i) => {
      if (i < 0 || i === activo) return;
      activo = i;
      pasos.forEach((p, k) => p.classList.toggle("activo", k === i));
      gadget.tcEscenario(pasos[i].dataset.escenario);
    };
    pasos.forEach((p, i) => {
      p.tabIndex = 0;
      p.setAttribute("role", "button");
      p.addEventListener("click", () => activar(i));
      p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activar(i); } });
    });
    // solo en pantallas anchas el gadget queda fijo y manda el scroll
    const ancho = window.matchMedia("(min-width: 992px)");
    let pendiente = false;
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        if (!ancho.matches) return;
        // solo mientras la sección está en pantalla
        const r = raiz.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        activar(pasoCentral(pasos.map((p) => p.getBoundingClientRect()), window.innerHeight));
      });
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    window.addEventListener("resize", alDesplazar, { passive: true });
    activar(0);
    alDesplazar();
  };
  requestAnimationFrame(conectar);
  return marca;
}
