// G4 · ¿Adentro o afuera? Desafío humano vs. algoritmo (sección I.2, estación 2).
//
// El teorema de la curva de Jordan dice que una curva cerrada simple parte el plano en
// adentro y afuera. ¿Es «obvio» de qué lado está un punto? El gadget genera curvas de
// Jordan difíciles y un punto; el lector responde contra reloj y el algoritmo de paridad
// responde en microsegundos, mostrando el rayo y sus cruces.

import { svg, html, texto, lector, alCambiarTema, aleatorio } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";
import { laberintoGrilla, laberintoEspiral, copoDeKoch, paridad, rayo, aristas, sobreElPoligono } from "./curvas.js";

// ------------------------------------------------------------------ lógica pura

export const TIPOS = {
  grilla: "Laberinto de grilla (nuevo en cada ronda)",
  espiral: "Laberinto espiral",
  koch: "Copo de Koch (nivel 4)",
};

/** Curva de la ronda. */
export function curvaDeRonda(tipo, rnd) {
  if (tipo === "grilla") return laberintoGrilla(9, 13, rnd, 26);
  if (tipo === "espiral") return laberintoEspiral(4.4, 30, 220);
  return copoDeKoch(4, 250);
}

/**
 * Un punto de consulta que no esté sobre la curva. Con `dificil`, a una distancia de
 * entre 0.6 y 1.5 unidades de una arista al azar (de cualquiera de los dos lados).
 */
export function puntoDeRonda(P, rnd, dificil) {
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let intento = 0; intento < 1000; intento++) {
    let x;
    if (dificil) {
      const [a, b] = aristas(P)[Math.floor(rnd() * P.length)];
      const t = 0.2 + 0.6 * rnd(), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const d = (0.6 + 0.9 * rnd()) * (rnd() < 0.5 ? 1 : -1);
      x = [a[0] + t * (b[0] - a[0]) - (d * (b[1] - a[1])) / L, a[1] + t * (b[1] - a[1]) + (d * (b[0] - a[0])) / L];
    } else {
      x = [x0 + (x1 - x0) * rnd(), y0 + (y1 - y0) * rnd()];
    }
    if (!sobreElPoligono(x, P)) return x;
  }
  return [x1 + 10, y1 + 10];
}

/** Microsegundos por consulta del algoritmo de paridad (promedio de `veces` corridas). */
export function cronometrarAlgoritmo(x, P, veces = 200) {
  const t0 = performance.now();
  let r;
  for (let k = 0; k < veces; k++) r = paridad(x, P);
  return { respuesta: r, microsegundos: ((performance.now() - t0) * 1000) / veces };
}

// ------------------------------------------------------------------ la pieza

export function adentroAfuera({ tipo = "grilla", id = "g4", semilla = 7 } = {}) {
  const rnd = aleatorio(semilla);
  let tipoActual = tipo, dificil = false, P = curvaDeRonda(tipo, rnd), x = puntoDeRonda(P, rnd, false);
  let inicio = performance.now(), resultado = null;
  const marcador = { rondas: 0, aciertos: 0, tiempoHumano: 0, tiempoAlgoritmo: 0 };

  const lienzo = svg("svg", { role: "img", "aria-label": "Una curva de Jordan complicada y un punto: ¿está adentro o afuera?" });
  const escena = html("div", {}, lienzo);
  const tk = lector(escena);

  const selTipo = html("select", { "aria-label": "Tipo de curva" }, ...Object.entries(TIPOS).map(([k, n]) => html("option", { value: k, selected: k === tipo }, n)));
  const bDificil = html("button", { "aria-pressed": "false", title: "Puntos a una unidad del borde: a ojo no se puede" }, "A ojo no se puede");
  const bAdentro = html("button", { class: "tc-primario", title: "Tecla A" }, "Adentro (A)");
  const bAfuera = html("button", { class: "tc-primario", title: "Tecla F" }, "Afuera (F)");
  const bOtra = html("button", { title: "Tecla N" }, "Otra ronda (N)");
  const controles = html("div", { style: "display:contents" }, selTipo, bDificil, html("span", { class: "tc-g-sep" }), bAdentro, bAfuera, bOtra);

  const vReloj = html("b", {}, "0.0 s");
  const vMarcador = html("div", { class: "tc-g-filas" });
  const vResultado = html("div", { class: "tc-veredicto", "aria-live": "polite" }, "¿Adentro o afuera? Respondé con A o F.");
  const lecturas = html("div", { style: "display:contents" },
    html("div", { class: "tc-g-tarjeta" }, html("h4", {}, "Tu tiempo"), html("div", { class: "tc-g-grande" }, vReloj)),
    vResultado,
    html("div", { class: "tc-g-tarjeta" }, html("h4", {}, "Marcador"), vMarcador));

  function dibujar() {
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    const m = 16, x0 = Math.min(...xs) - m, x1 = Math.max(...xs) + m, y0 = Math.min(...ys) - m, y1 = Math.max(...ys) + m;
    lienzo.setAttribute("viewBox", `${x0} ${-y1} ${x1 - x0} ${y1 - y0}`);
    lienzo.replaceChildren();
    const d = P.map((p, i) => (i ? "L" : "M") + `${p[0]},${-p[1]}`).join(" ") + "Z";
    const escala = (x1 - x0) / 800;
    if (resultado) {
      svg("path", { d, fill: tk("--tc-mojado-suave"), stroke: "none" }, lienzo);
    }
    svg("path", { d, fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 1.6 * escala, "stroke-linejoin": "round" }, lienzo);
    if (resultado) {
      const r = rayo(x, P);
      svg("line", { x1: x[0], y1: -x[1], x2: x1, y2: -x[1], stroke: tk("--tc-camino"), "stroke-width": 2 * escala, "stroke-dasharray": `${6 * escala} ${4 * escala}` }, lienzo);
      for (const { punto } of r.cruces) svg("circle", { cx: punto[0], cy: -punto[1], r: 4 * escala, fill: tk("--tc-camino") }, lienzo);
      texto(lienzo, x0 + 8 * escala, -y1 + 22 * escala, `${r.n} cruces: ${r.n % 2 ? "impar → adentro" : "par → afuera"}`, { "font-size": 16 * escala, "font-weight": 700, fill: tk("--tc-tinta") });
    }
    svg("circle", { cx: x[0], cy: -x[1], r: 5 * escala, fill: tk("--tc-rechazo"), stroke: tk("--tc-panel"), "stroke-width": 1.5 * escala }, lienzo);
  }

  function actualizarMarcador() {
    const m = marcador;
    vMarcador.replaceChildren(
      html("span", {}, "Rondas"), html("b", {}, String(m.rondas)),
      html("span", {}, "Tus aciertos"), html("b", {}, m.rondas ? `${m.aciertos} (${Math.round((100 * m.aciertos) / m.rondas)} %)` : "—"),
      html("span", {}, "Aciertos del algoritmo"), html("b", {}, m.rondas ? `${m.rondas} (100 %)` : "—"),
      html("span", {}, "Tu tiempo medio"), html("b", {}, m.rondas ? `${(m.tiempoHumano / m.rondas / 1000).toFixed(1)} s` : "—"),
      html("span", {}, "Tiempo del algoritmo"), html("b", {}, m.rondas ? `${(m.tiempoAlgoritmo / m.rondas).toFixed(1)} µs` : "—"));
  }

  function responder(r) {
    if (resultado) return;
    const tHumano = performance.now() - inicio;
    const alg = cronometrarAlgoritmo(x, P);
    const ok = alg.respuesta === r;
    resultado = { r, ok, alg };
    Object.assign(marcador, {
      rondas: marcador.rondas + 1, aciertos: marcador.aciertos + (ok ? 1 : 0),
      tiempoHumano: marcador.tiempoHumano + tHumano, tiempoAlgoritmo: marcador.tiempoAlgoritmo + alg.microsegundos,
    });
    vReloj.textContent = `${(tHumano / 1000).toFixed(1)} s`;
    vResultado.className = "tc-veredicto " + (ok ? "si" : "no");
    vResultado.innerHTML = `${ok ? "<b>¡Bien!</b>" : "<b>No.</b>"} El punto está <b>${alg.respuesta}</b>. Vos tardaste ${(tHumano / 1000).toFixed(1)} s; el algoritmo, ${alg.microsegundos.toFixed(1)} µs (unas ${Math.round((tHumano * 1000) / alg.microsegundos).toLocaleString("es-AR")} veces menos).`;
    actualizarMarcador();
    dibujar();
  }

  function nuevaRonda() {
    if (tipoActual === "grilla" || !P.length) P = curvaDeRonda(tipoActual, rnd);
    x = puntoDeRonda(P, rnd, dificil);
    resultado = null;
    inicio = performance.now();
    vResultado.className = "tc-veredicto";
    vResultado.textContent = dificil ? "El punto está a una unidad del borde. ¿Adentro o afuera?" : "¿Adentro o afuera? Respondé con A o F.";
    dibujar();
  }

  let reloj = setInterval(() => { if (!resultado && escena.isConnected) vReloj.textContent = `${((performance.now() - inicio) / 1000).toFixed(1)} s`; }, 100);
  bAdentro.addEventListener("click", () => responder("adentro"));
  bAfuera.addEventListener("click", () => responder("afuera"));
  bOtra.addEventListener("click", nuevaRonda);
  bDificil.addEventListener("click", () => { dificil = !dificil; bDificil.setAttribute("aria-pressed", String(dificil)); nuevaRonda(); });
  selTipo.addEventListener("change", () => { tipoActual = selTipo.value; P = curvaDeRonda(tipoActual, rnd); nuevaRonda(); });

  const gadget = montarGadget({
    id,
    titulo: "¿Adentro o afuera?",
    subtitulo: "vos contra el algoritmo de paridad",
    escenario: escena,
    lecturas,
    controles,
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p><b>Teorema de la curva de Jordan</b> (Libro, pp. 9-10): el complemento de una curva cerrada simple tiene exactamente dos componentes, una acotada y otra no, y la curva es el borde de las dos. Schönflies agrega que el adentro (con la curva) es un disco deformado.</p><p>No es obvio: el copo de Koch no tiene tangente en ningún punto, y hay curvas de Jordan con <b>área positiva</b> (Osgood). La primera demostración aceptada es de Veblen (1905).</p>" },
      { id: "prog", nombre: "Programador", contenido: () => `<p>La máquina no «ve» el adentro: tira un rayo y cuenta cruces, \\(O(n)\\) con aritmética exacta. Esta curva tiene <b>${P.length}</b> vértices.</p><p>Para polígonos, <b>el algoritmo es la demostración</b>: la paridad es constante a lo largo de cualquier camino que no toque la curva y toma los dos valores (cerca de una arista, un lado da par y el otro impar). Entonces hay al menos dos componentes.</p>` },
      { id: "geo", nombre: "Geómetra", contenido: () => "<p>En la esfera también vale (proyectando desde un punto fuera de la curva). En el <b>toro</b> no: un meridiano es una curva cerrada simple cuyo complemento es un cilindro, conexo. Y en dimensión 3, Schönflies falla: la <b>esfera cornuda de Alexander</b> tiene un «adentro» que no es una bola.</p>" },
    ],
    reiniciar: () => { Object.assign(marcador, { rondas: 0, aciertos: 0, tiempoHumano: 0, tiempoAlgoritmo: 0 }); actualizarMarcador(); nuevaRonda(); },
    queVeo: () => [{ elemento: lienzo.querySelector("circle:last-of-type"), texto: "el punto: ¿adentro o afuera?" }],
  });
  gadget.raiz.tabIndex = 0;
  gadget.raiz.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "a") responder("adentro");
    else if (k === "f") responder("afuera");
    else if (k === "n") nuevaRonda();
  });
  alCambiarTema(dibujar);
  actualizarMarcador();
  dibujar();
  void reloj;
  return gadget.raiz;
}
