// G8 · Taller de triangulación (sección I.2, estación 4; spec §5, G8).
//
// Todo polígono simple se corta en triángulos usando solo sus vértices. Modos:
// Explorar (la triangulación, el árbol dual, las orejas), Demostración (la prueba
// inductiva del libro paso a paso, con la pila de sub-polígonos), Navegar (el único
// camino entre dos puntos por el árbol dual: la ola de I.1) y Errata (la regla del libro
// contra la corregida, con búsqueda de contraejemplos en vivo). La lógica es la de
// assets/js/curvas.js (gemelo de tcomp.curvas).

import { svg, html, texto, lector, alCambiarTema, puntoSVG, aleatorio, tipografiar } from "./comun.js";
import { montarGadget } from "./gadget/carcasa.js";
import {
  triangular, arbolDual, orejas, caminoDual, coloreoConOrden, guardiasFisk, visibilidad, esSimple, antihorario, enTriangulo,
  CONTRAEJEMPLO_LIBRO, esDiagonal, poligonoDesenredado, buscarContraejemplo, autointersecciones,
  posicionGeneral, laberintoEspiral,
} from "./curvas.js";

const W = 800, H = 480;

const ESCENARIOS_T = {
  peine: { nombre: "Un peine (muchas orejas)", P: () => {
    const P = [[-300, -150], [300, -150], [300, 150]];
    for (let k = 5; k >= 0; k--) P.push([-300 + 100 * k + 60, 150], [-300 + 100 * k + 30, -60], [-300 + 100 * k, 150]);
    return P.slice(0, -1).concat([[-300, 150]]);
  } },
  estrella: { nombre: "Estrella de 7 puntas", P: () => Array.from({ length: 14 }, (_, k) => { const r = k % 2 ? 90 : 200, t = (Math.PI * k) / 7 + 0.05; return [Math.round(r * Math.cos(t)), Math.round(r * Math.sin(t))]; }) },
  espiral: { nombre: "Laberinto espiral", P: () => laberintoEspiral(3, 36, 60).map(([x, y]) => [Math.round(x * 0.9), Math.round(y * 0.9)]) },
  errata: { nombre: "Errata del libro (p. 12)", P: () => CONTRAEJEMPLO_LIBRO.map(([x, y]) => [x * 6 - 80, y * 3.3 + 30]) },
  azar: { nombre: "Polígono al azar", P: null },
  vacio: { nombre: "Hoja en blanco (clic para poner vértices)", P: () => [] },
};

export function tallerTriangulacion({ escenario = "peine", id = "g8" } = {}) {
  const rnd = aleatorio(31);
  let P = antihorario(ESCENARIOS_T[escenario].P());
  let modo = "explorar", paso = 0, regla = "corregida", guardias = false;
  let navegar = { a: null, b: null }, arrastre = null;
  // galería de arte: cuántos vértices del 3-coloreo ya se pintaron (animación) y la guardia
  // bajo el mouse
  let pintados = Infinity, temporizador = null, resaltada = null;

  const lienzo = svg("svg", { viewBox: `${-W / 2} ${-H / 2} ${W} ${H}`, role: "img", "aria-label": "Polígono con su triangulación, árbol dual y orejas" });
  const escena = html("div", {}, lienzo);
  const tk = lector(escena);
  const aS = ([x, y]) => [x, -y];

  const selEsc = html("select", { "aria-label": "Polígono" }, ...Object.entries(ESCENARIOS_T).map(([k, e]) => html("option", { value: k, selected: k === escenario }, e.nombre)));
  const bAtras = html("button", { title: "Paso anterior" }, "◀");
  const bAdelante = html("button", { title: "Paso siguiente" }, "▶");
  const selRegla = html("select", { "aria-label": "Regla" }, html("option", { value: "corregida" }, "Regla corregida (más lejano de ac)"), html("option", { value: "libro" }, "Regla del libro (más a la izquierda)"));
  const bContra = html("button", { title: "Buscar al azar un polígono donde la regla del libro falla" }, "Generar otro contraejemplo");
  const bGuardias = html("button", { "aria-pressed": "false", title: "Galería de arte: 3-coloreo y guardias (Fisk)" }, "Guardias");
  const controles = html("div", { style: "display:contents" }, selEsc, bGuardias, html("span", { class: "tc-g-sep" }), bAtras, bAdelante, selRegla, bContra);

  const lec = html("div", { class: "tc-g-filas" });
  const narr = html("div", { class: "tc-veredicto", "aria-live": "polite" });
  const lecturas = html("div", { style: "display:contents" }, html("div", { class: "tc-g-tarjeta" }, html("h4", {}, "Cuentas"), lec), narr);

  // ------------------------------------------------------------------ cálculo
  const simple = () => P.length >= 3 && esSimple(P);
  const calcular = () => {
    if (!simple()) return null;
    const T = triangular(P, regla);
    const arcos = arbolDual(T.triangulos);
    return { ...T, arcos, hojas: orejas(T.triangulos, arcos) };
  };

  function dibujar() {
    lienzo.replaceChildren();
    const R = calcular();
    const enDemo = modo === "demo" && R;
    const pasoActual = enDemo ? R.pasos[Math.min(paso, R.pasos.length - 1)] : null;
    // en la demostración, solo los triángulos y diagonales ya decididos hasta este paso
    const hechos = enDemo ? R.pasos.slice(0, paso + 1) : null;
    const triVisibles = R ? (enDemo ? R.triangulos.filter((t) => hechos.some((p) => p.triangulo && p.triangulo.join() === t.join())) : R.triangulos) : [];
    const diagVisibles = R ? (enDemo ? hechos.filter((p) => p.diagonal).map((p) => p.diagonal) : R.diagonales) : [];
    const { color, orden } = coloreoConOrden(P.length, R?.triangulos ?? []);
    const yaPintado = new Set(orden.slice(0, pintados));
    const coloreoCompleto = guardias && R && pintados >= P.length;
    const G = coloreoCompleto ? guardiasFisk(P.length, R.triangulos) : [];

    if (P.length >= 3) svg("polygon", { points: P.map((p) => aS(p).join(",")).join(" "), fill: tk("--tc-mojado-suave"), "fill-opacity": 0.55, stroke: "none" }, lienzo);
    // lo que ve cada guardia: juntas cubren todo el polígono
    for (const g of G) {
      if (resaltada !== null && g !== resaltada) continue;
      svg("polygon", { points: visibilidad(P, g).map((p) => aS(p).join(",")).join(" "), fill: tk(`--tc-c${color[g] + 1}`), "fill-opacity": resaltada === null ? 0.2 : 0.4, stroke: resaltada === null ? "none" : tk(`--tc-c${color[g] + 1}`), "stroke-width": 1.5 }, lienzo);
    }
    // camino de navegación
    if (modo === "navegar" && R && navegar.a && navegar.b) {
      const ta = R.triangulos.findIndex(([i, j, k]) => enTriangulo(navegar.a, P[i], P[j], P[k]));
      const tb = R.triangulos.findIndex(([i, j, k]) => enTriangulo(navegar.b, P[i], P[j], P[k]));
      if (ta >= 0 && tb >= 0) {
        const camino = caminoDual(R.triangulos, R.arcos, ta, tb);
        for (const t of camino) svg("polygon", { points: R.triangulos[t].map((i) => aS(P[i]).join(",")).join(" "), fill: tk("--tc-camino"), "fill-opacity": 0.35 }, lienzo);
        // la ruta: por los puntos medios de las diagonales que se cruzan
        const ruta = [navegar.a];
        for (let k = 0; k + 1 < camino.length; k++) {
          const [s, t] = [R.triangulos[camino[k]], R.triangulos[camino[k + 1]]];
          const comun = s.filter((v) => t.includes(v));
          ruta.push([(P[comun[0]][0] + P[comun[1]][0]) / 2, (P[comun[0]][1] + P[comun[1]][1]) / 2]);
        }
        ruta.push(navegar.b);
        svg("polyline", { points: ruta.map((p) => aS(p).join(",")).join(" "), fill: "none", stroke: tk("--tc-seco"), "stroke-width": 3, "stroke-linejoin": "round" }, lienzo);
        narr.innerHTML = `<b>Navegar:</b> el árbol dual tiene un único camino entre los dos triángulos (${camino.length} triángulo${camino.length > 1 ? "s" : ""}): la ola de I.1 lo encuentra. Como el dual es un árbol, la salida del laberinto es única.`;
      } else {
        narr.innerHTML = "<b>Navegar:</b> arrastrá los dos puntos naranjas dentro del polígono.";
      }
    }
    if (R) {
      const hojas = new Set(R.hojas);
      if (!enDemo && !guardias) {
        R.triangulos.forEach((t, k) => { if (hojas.has(k)) svg("polygon", { points: t.map((i) => aS(P[i]).join(",")).join(" "), fill: tk("--tc-compresion"), "fill-opacity": 0.18 }, lienzo); });
      }
      for (const [i, j] of diagVisibles) {
        const a = aS(P[i]), b = aS(P[j]), ok = esDiagonal(P, i, j);
        svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: ok ? tk("--tc-compresion") : tk("--tc-rechazo"), "stroke-width": ok ? 1.6 : 3.5 }, lienzo);
      }
      // árbol dual (de los triángulos visibles)
      const vis = new Set(triVisibles.map((t) => t.join()));
      const centro = (t) => aS([(P[t[0]][0] + P[t[1]][0] + P[t[2]][0]) / 3, (P[t[0]][1] + P[t[1]][1] + P[t[2]][1]) / 3]);
      if (!guardias) {
        for (const [s, t] of R.arcos) {
          if (!vis.has(R.triangulos[s].join()) || !vis.has(R.triangulos[t].join())) continue;
          const a = centro(R.triangulos[s]), b = centro(R.triangulos[t]);
          svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: tk("--tc-compresion"), "stroke-width": 2.4 }, lienzo);
        }
        R.triangulos.forEach((t, k) => { if (vis.has(t.join())) { const c = centro(t); svg("circle", { cx: c[0], cy: c[1], r: hojas.has(k) ? 5 : 3, fill: tk("--tc-compresion") }, lienzo); } });
      }
    }
    // demostración: el sub-polígono actual, b, a, c, el triángulo abc y los de adentro
    if (pasoActual && pasoActual.diagonal) {
      const sub = pasoActual.poligono;
      svg("polygon", { points: sub.map((i) => aS(P[i]).join(",")).join(" "), fill: "none", stroke: tk("--tc-camino"), "stroke-width": 3.5, "stroke-dasharray": "8 5" }, lienzo);
      svg("polygon", { points: [pasoActual.a, pasoActual.b, pasoActual.c].map((i) => aS(P[i]).join(",")).join(" "), fill: tk("--tc-camino"), "fill-opacity": 0.25, stroke: tk("--tc-camino") }, lienzo);
      for (const v of pasoActual.adentro) { const q = aS(P[v]); svg("circle", { cx: q[0], cy: q[1], r: 9, fill: "none", stroke: tk("--tc-seco"), "stroke-width": 2.5 }, lienzo); }
      for (const [v, nombre] of [[pasoActual.b, "b"], [pasoActual.a, "a"], [pasoActual.c, "c"]]) {
        const q = aS(P[v]);
        texto(lienzo, q[0] - 18, q[1] - 10, nombre, { "font-size": 16, "font-weight": 700, "font-style": "italic", fill: tk("--tc-tinta") });
      }
    }
    // el borde y los vértices
    if (P.length >= 2) {
      svg(P.length >= 3 ? "polygon" : "polyline", { points: P.map((p) => aS(p).join(",")).join(" "), fill: "none", stroke: tk("--tc-tinta"), "stroke-width": 2.4, "stroke-linejoin": "round" }, lienzo);
    }
    for (const { punto } of P.length >= 3 ? autointersecciones(P) : []) {
      const q = aS(punto);
      svg("circle", { cx: q[0], cy: q[1], r: 7, fill: "none", stroke: tk("--tc-rechazo"), "stroke-width": 2.5 }, lienzo);
    }
    P.forEach((p, v) => {
      const q = aS(p);
      const pintado = guardias && R && yaPintado.has(v);
      const c = pintado ? tk(`--tc-c${[1, 2, 3][color[v]] ?? 1}`) : tk("--tc-tinta");
      svg("circle", { cx: q[0], cy: q[1], r: pintado ? 6 : 3.5, fill: c }, lienzo);
    });
    if (guardias && R && !coloreoCompleto) {
      narr.innerHTML = `<b>Coloreando (${Math.min(pintados, P.length)} de ${P.length}).</b> Se recorre el árbol dual: cada triángulo nuevo comparte una diagonal con uno ya pintado, así que tiene dos vértices con color y el tercero recibe el que falta.`;
    }
    if (coloreoCompleto) {
      for (const g of G) {
        const q = aS(P[g]);
        const anillo = svg("circle", { cx: q[0], cy: q[1], r: 12, fill: "transparent", stroke: tk(`--tc-c${color[g] + 1}`), "stroke-width": 3, style: "cursor:help" }, lienzo);
        anillo.addEventListener("pointerenter", () => { resaltada = g; dibujar(); });
        anillo.addEventListener("pointerleave", () => { resaltada = null; dibujar(); });
      }
      narr.innerHTML = `<b>Galería de arte (Fisk).</b> El 3-coloreo da a cada triángulo un vértice de cada color, y cada guardia ve sus triángulos enteros. El color menos usado tiene ${G.length} vértices (con un anillo): ${G.length} ≤ ⌊${P.length}/3⌋ = ${Math.floor(P.length / 3)} guardias. Lo sombreado es lo que ve cada una (pasá el mouse por un anillo): juntas cubren todo.`;
    }
    if (modo === "navegar") {
      for (const k of ["a", "b"]) {
        if (!navegar[k]) continue;
        const q = aS(navegar[k]);
        const g = svg("g", { style: "cursor:grab" }, lienzo);
        svg("circle", { cx: q[0], cy: q[1], r: 9, fill: tk("--tc-seco"), stroke: tk("--tc-panel"), "stroke-width": 2 }, g);
        g.addEventListener("pointerdown", (e) => { e.stopPropagation(); arrastre = k; lienzo.setPointerCapture?.(e.pointerId); });
      }
    }
    actualizarLecturas(R, pasoActual);
  }

  function actualizarLecturas(R, pasoActual) {
    const n = P.length;
    const filas = [["Vértices n", String(n)]];
    if (n >= 3 && !simple()) filas.push(["¿Simple?", "no: el borde se cruza"]);
    if (R) {
      filas.push(["Triángulos (n − 2)", `${R.triangulos.length}`], ["Diagonales (n − 3)", `${R.diagonales.length}`],
        ["Orejas (hojas del dual)", `${R.hojas.length} ≥ 2`], ["¿Posición general?", posicionGeneral(P) ? "sí" : "no"]);
      const malas = R.diagonales.filter(([i, j]) => !esDiagonal(P, i, j)).length;
      if (regla === "libro") filas.push(["Segmentos que NO son diagonales", malas ? `${malas} (en rojo)` : "0"]);
    }
    lec.replaceChildren(...filas.flatMap(([a, b]) => [html("span", {}, a), html("b", {}, b)]));
    bAtras.disabled = modo !== "demo" || paso === 0;
    bAdelante.disabled = modo !== "demo" || !R || paso >= R.pasos.length - 1;
    if (modo === "demo" && R && pasoActual) {
      const pila = R.pasos.length - 1 - paso;
      narr.className = "tc-veredicto";
      narr.innerHTML = pasoActual.diagonal
        ? `<b>Paso ${paso + 1} de ${R.pasos.length}.</b> En el sub-polígono de ${pasoActual.poligono.length} vértices (punteado), \\(b\\) es el de más a la izquierda y \\(a, c\\) sus vecinos. ${pasoActual.adentro.length
          ? `Dentro del triángulo \\(abc\\) hay ${pasoActual.adentro.length} vértice${pasoActual.adentro.length > 1 ? "s" : ""} (con anillo): la diagonal une \\(b\\) con ${regla === "libro" ? "el de más a la izquierda (regla del libro)" : "el más lejano de la recta \\(ac\\)"}.`
          : "No hay vértices dentro de \\(abc\\): la diagonal es \\(ac\\)."} La diagonal parte el polígono en dos con \\(n_1 + n_2 = n + 2\\). Quedan ${pila} paso${pila === 1 ? "" : "s"}.`
        : `<b>Paso ${paso + 1} de ${R.pasos.length}.</b> Un sub-polígono de 3 vértices ya es un triángulo.`;
      tipografiar(narr);
    } else if (modo === "errata") {
      narr.className = "tc-veredicto " + (R && R.diagonales.every(([i, j]) => esDiagonal(P, i, j)) ? "si" : "no");
      narr.innerHTML = regla === "libro"
        ? "<b>Regla del libro:</b> si hay vértices dentro de \\(abc\\), unir \\(b\\) con el de más a la izquierda. En rojo, los segmentos que cortan una arista: no son diagonales. Cambiá a la regla corregida."
        : "<b>Regla corregida:</b> el vértice dentro de \\(abc\\) más lejano de la recta \\(ac\\). Entre \\(b\\) y la paralela a \\(ac\\) por él no hay vértices: ninguna arista puede cruzar el segmento sin cruzar \\(ab\\) o \\(bc\\).";
      tipografiar(narr);
    } else if (modo === "explorar" && !guardias) {
      narr.className = "tc-veredicto";
      narr.innerHTML = P.length < 3 ? "<b>Clic en el escenario</b> para poner vértices (en orden)." : !simple() ? "<b>El borde se cruza:</b> no es un polígono simple. Deshacé con Reiniciar o elegí otro." : "Puntos violetas: un nodo por triángulo; unidos si comparten una diagonal. Es un <b>árbol</b>, y sus hojas (sombreadas) son las <b>orejas</b>: siempre hay al menos dos.";
    }
  }

  // ------------------------------------------------------------------ interacción
  lienzo.addEventListener("pointerdown", (e) => {
    const [mx, my] = puntoSVG(lienzo, e);
    const p = [Math.round(mx), Math.round(-my)];
    if (modo === "navegar") {
      const k = !navegar.a ? "a" : !navegar.b ? "b" : null;
      if (k) { navegar[k] = p; dibujar(); }
      return;
    }
    if (modo === "explorar" && !guardias) {
      P = P.length >= 3 && !simple() ? P : P.concat([p]);
      if (P.length >= 3 && simple()) P = antihorario(P);
      selEsc.value = "vacio";
      dibujar();
    }
  });
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const [mx, my] = puntoSVG(lienzo, e);
    navegar[arrastre] = [mx, -my];
    dibujar();
  });
  lienzo.addEventListener("pointerup", () => { arrastre = null; });

  function cargar(k) {
    P = antihorario(ESCENARIOS_T[k].P ? ESCENARIOS_T[k].P() : poligonoAzar());
    paso = 0;
    navegar = { a: null, b: null };
    if (modo === "navegar") ubicarNavegantes();
    dibujar();
  }
  const poligonoAzar = () => {
    for (;;) { const Q = poligonoDesenredado(14, rnd, 100).map(([x, y]) => [x * 3, y * 2]); if (esSimple(Q)) return Q; }
  };
  function ubicarNavegantes() {
    const R = calcular();
    if (!R) return;
    const cen = (t) => [(P[t[0]][0] + P[t[1]][0] + P[t[2]][0]) / 3, (P[t[0]][1] + P[t[1]][1] + P[t[2]][1]) / 3];
    const hojas = R.hojas;
    navegar = { a: cen(R.triangulos[hojas[0]]), b: cen(R.triangulos[hojas.at(-1)]) };
  }

  selEsc.addEventListener("change", () => cargar(selEsc.value));
  bAtras.addEventListener("click", () => { paso = Math.max(0, paso - 1); dibujar(); });
  bAdelante.addEventListener("click", () => { paso++; dibujar(); });
  selRegla.addEventListener("change", () => { regla = selRegla.value; paso = 0; dibujar(); });
  function animarColoreo() {
    clearInterval(temporizador);
    resaltada = null;
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    pintados = quieto ? Infinity : 0;
    dibujar();
    if (quieto) return;
    temporizador = setInterval(() => {
      pintados++;
      if (!guardias || pintados >= P.length) { clearInterval(temporizador); pintados = Infinity; }
      dibujar();
    }, 260);
  }
  bGuardias.addEventListener("click", () => {
    guardias = !guardias;
    bGuardias.setAttribute("aria-pressed", String(guardias));
    if (guardias) animarColoreo(); else { clearInterval(temporizador); pintados = Infinity; dibujar(); }
  });
  bContra.addEventListener("click", () => {
    const c = buscarContraejemplo(rnd);
    if (!c) { gadget.avisar("No apareció ninguno en este intento: probá otra vez."); return; }
    P = c.P.map(([x, y]) => [x * 3, y * 2]);
    regla = "libro"; selRegla.value = "libro"; selEsc.value = "vacio";
    dibujar();
    gadget.avisar("Contraejemplo nuevo: la regla del libro falla en algún paso (en rojo).");
  });

  const ajustarControles = () => {
    selRegla.hidden = bContra.hidden = modo !== "errata" && modo !== "demo";
    bContra.hidden = modo !== "errata";
    bAtras.hidden = bAdelante.hidden = modo !== "demo";
  };

  const gadget = montarGadget({
    id,
    titulo: "Taller de triangulación",
    subtitulo: "la prueba inductiva, el árbol dual y la errata del libro",
    escenario: escena,
    lecturas,
    controles,
    modos: [{ id: "explorar", nombre: "Explorar" }, { id: "demo", nombre: "Demostración" }, { id: "navegar", nombre: "Navegar" }, { id: "errata", nombre: "Errata" }],
    alCambiarModo: (m) => {
      modo = m;
      paso = 0;
      guardias = false; bGuardias.setAttribute("aria-pressed", "false"); clearInterval(temporizador); pintados = Infinity;
      if (m === "errata") { selEsc.value = "errata"; regla = "libro"; selRegla.value = "libro"; P = antihorario(ESCENARIOS_T.errata.P()); }
      else if (m !== "demo") { regla = "corregida"; selRegla.value = "corregida"; }
      if (m === "navegar") { if (selEsc.value === "errata" || selEsc.value === "vacio") { selEsc.value = "espiral"; P = antihorario(ESCENARIOS_T.espiral.P()); } ubicarNavegantes(); }
      ajustarControles();
      dibujar();
    },
    lentes: [
      { id: "mat", nombre: "Matemático", contenido: () => "<p><b>Inducción sobre \\(n\\)</b> (Libro, pp. 11-12): una diagonal parte el \\(n\\)-gono en un \\(n_1\\)-gono y un \\(n_2\\)-gono con \\(n_1 + n_2 = n + 2\\).</p><p><b>\\(n - 2\\) triángulos, en una línea ★:</b> los ángulos de los triángulos llenan exactamente los ángulos interiores del polígono, que suman \\((n-2)\\pi\\); cada triángulo aporta \\(\\pi\\). Y como cada lado del polígono se usa una vez y cada diagonal dos, \\(3(n-2) = n + 2d\\): hay \\(d = n - 3\\) diagonales.</p>" },
      { id: "prog", nombre: "Programador", contenido: () => "<p>El <b>recorte de orejas</b> (<i>ear clipping</i>) triangula en \\(O(n^2)\\): siempre hay una oreja (¡dos!), se recorta y se repite. Existe un algoritmo lineal (Chazelle, 1991), tan complejo que nadie lo implementa. Este taller usa la prueba del libro como algoritmo, con la regla corregida, y se compara en los tests contra <code>earcut</code> (Mapbox): misma cantidad de triángulos y misma área.</p>" },
      { id: "grafos", nombre: "Grafos (I.1)", contenido: () => "<p>El <b>dual es un árbol</b>: es conexo y cada diagonal parte el polígono en dos, así que cada arco es un <b>puente</b>. Un árbol con al menos dos nodos tiene al menos <b>dos hojas</b>: el teorema de las dos orejas (Meisters, 1975), más fuerte que el «al menos una» del libro. Navegar dentro del polígono es buscar el único camino en un árbol: la ola de I.1.</p>" },
    ],
    reiniciar: () => { selEsc.value = escenario; cargar(escenario); },
    estado: { obtener: () => ({ P }), aplicar: (e) => { if (Array.isArray(e.P)) { P = e.P; selEsc.value = "vacio"; dibujar(); } } },
    queVeo: () => [{ elemento: lienzo.querySelector("circle"), texto: "nodo del árbol dual (un triángulo)" }],
  });
  ajustarControles();
  alCambiarTema(dibujar);
  dibujar();
  return gadget.raiz;
}
