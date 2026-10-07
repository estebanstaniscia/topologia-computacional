---
seccion: "I.2 Curvas en el plano"
estado: listo para construir
paradigma: v2 (visualization-first)
fecha: 2026-10-07
fuente: diseccion.md (misma carpeta) · filosofía: bocetos/_proyecto/FILOSOFIA.md (§6-11 son NUEVAS: leerlas)
---

# Spec: sección I.2 Curvas en el plano (primera sección con el paradigma v2)

## 0. Lo nuevo de esta spec (leer primero)

Esta es la **primera sección con el paradigma v2** (`FILOSOFIA.md` §6-11). Diferencias con I.1:

1. **El gadget es el contenido; el texto lo acompaña.** No se transcriben definiciones del libro:
   se citan con una ficha "Libro, p. X". El texto visible se limita a la "Idea" de cada estación
   (de `diseccion.md`); los aportes propios van en desplegables "Profundizar".
2. **Presupuesto de texto:** ~1.500 palabras visibles como máximo (sin contar desplegables). Para
   comparar: la página de I.1 tiene ~9.700.
3. **Carcasa común de gadgets** (§2): se construye en esta sección y queda para todas las
   siguientes (I.1 se migrará después; ver `TAREAS.md`).
4. **Tecnologías nuevas** (§6): Three.js, Web Audio, Scrollama, predicados exactos, referencias
   de triangulación.
5. **Errata del libro** en la p. 12 (ver `diseccion.md`, Estación 4): implementar la regla
   corregida y mostrar la errata como gadget.

## 1. Objetivo de comprensión

Al terminar, Esteban debe poder hacer (no solo explicar), **usando los gadgets**:

1. Mostrar con el Bisturí por qué $[0,1]$ y $S^1$ no son homeomorfos, y por qué la "firma" de
   puntos de corte no alcanza para distinguir el círculo de la θ.
2. Decidir adentro/afuera con el rayo en un caso degenerado, y explicar qué decide la
   perturbación $\varepsilon_1 \ll \varepsilon_2$ y por qué basta con comparaciones exactas.
3. Triangular un polígono siguiendo la prueba inductiva, ver el árbol dual, señalar las dos
   orejas, y reproducir la errata.
4. Predecir el número de vueltas de una curva dibujada a mano antes de que el gadget lo
   muestre, y explicar por qué paridad ≡ W (mod 2).
5. Explicar por qué el Teorema de Jordan falla en el toro y Schönflies en dimensión 3.

## 2. Carcasa común de gadgets — P0 (infraestructura, una sola vez)

- **Ubicación:** `assets/js/gadget/` (módulos ES, sin dependencias externas, como `comun.js`).
- **Forma:** un Web Component nativo `<tc-gadget>` o una función `montarGadget(contenedor,
  opciones)` (decidir lo más simple que funcione en Quarto/OJS).
- **Provee:** barra superior con título; botones *Pantalla completa*, *Reiniciar*, *Enlace*
  (serializa el estado en el hash de la URL: `#g1=...`), *Exportar SVG/PNG*, *¿Qué estoy
  viendo?* (superpone etiquetas sobre los elementos); **pestañas de Lentes** (contenido HTML por
  lente, con MathJax); selector de **Modo** (*Explorar / Demostración / Desafío*) cuando el
  gadget lo soporte; manejo de tema claro/oscuro con los tokens de `assets/estilo.css`;
  accesibilidad (foco, teclado, `aria-label`).
- **Contrato del gadget:** cada gadget exporta su lógica pura (testeable en Node) separada del
  dibujo, como ya se hace en I.1.

## 3. Arquitectura de la página — P0

Archivo `capitulos/01-grafos/1-2-curvas-en-el-plano.qmd` (agregar al sidebar):

```
[Hero] G1 Lienzo de Jordan, ancho completo (columna `page`/`screen-inset` de Quarto),
       con botón "Modo estudio" (pantalla completa).
[Mapa] 5 tarjetas de estación con miniatura (puede ser una imagen exportada del gadget).
[Estación k] ficha del libro · idea (1-2 líneas) · gadget · ▸ Profundizar (callout colapsable)
[Puentes] G11 + finanzas, breve.
[Desafíos finales] la autoevaluación como 5 desafíos dentro de los gadgets (objetivo §1).
```

- **Ficha del libro:** un componente visual pequeño y consistente (por ejemplo, un "chip" con
  ícono de libro: "Libro · p. 10 · Teorema de la curva de Jordan"). Definirlo en `estilo.css`.
- **Scrollytelling (P1)** en la Estación 5: G1 fijo a la izquierda (sticky) y 4-5 tarjetas a la
  derecha que, al desplazarse, cambian su estado (circle → limaçon → ocho → flor → curva del
  lector). Usar **Scrollama** (CDN) o `IntersectionObserver` nativo.

## 4. Librería `tcomp` — P0

**`src/tcomp/curvas.py`**: portar `prototipos/curvas.py` respetando la convención de índices de
`tcomp` (0..n-1):

- `orient`, `orient_perturbado` (Simulation of Simplicity con el desarrollo exacto).
- `cruza`, `cruces`, `paridad` (con "sobre" para puntos en el borde), `sobre_el_poligono`.
- `vueltas_por_cruces` (exacta) y `vueltas_por_angulos` (flotante).
- `es_simple`, `posicion_general`, `area_con_signo`.
- `triangular` con la regla **corregida** (más lejano de $ac$) y `diagonal_mas_a_la_izquierda`
  (la del libro, para la errata); `arbol_dual`, `orejas`, `es_diagonal`.
- `CONTRAEJEMPLO_LIBRO`.
- `tres_coloreo(triangulacion)` y `guardias(P)` (galería de arte, Fisk) — P1.

**Tests** (`tests/test_curvas.py`):

- Todas las verificaciones de `prototipos/curvas.py` (incluidos polígonos "desenredados", no solo
  estrellados).
- `paridad` contra **shapely** (`Polygon.contains`) en puntos genéricos.
- `triangular` contra **mapbox-earcut**: misma cantidad de triángulos y misma área total.
- Errata: la regla del libro falla en `CONTRAEJEMPLO_LIBRO`, la corregida no.
- `vueltas_por_cruces == vueltas_por_angulos` en curvas no simples (limaçon, ocho, flor).
- Hypothesis (si ya está): `cruces % 2 == vueltas % 2` para curvas y puntos arbitrarios.

## 5. Gadgets

Prioridad: **P0** imprescindible · **P1** muy deseable · **P2** si hay tiempo.

### G1 Lienzo de Jordan (gadget estrella) — P0

**Prototipo funcional:** `prototipos/lienzo_jordan.html` (portarlo a la carcasa común; la lógica
a `assets/js/curvas.js`, testeada con Node contra fixtures generados por `tcomp.curvas`).

- **Escenario:** dibujar a mano alzada una curva cerrada (Pointer Events; usar
  **perfect-freehand** para el trazo); remuestreo por longitud de arco; arrastrar el punto $x$.
- **Capas:** campo $W$ (regiones coloreadas con etiqueta entera en cada región), rayo de
  paridad con cruces $\pm$, flechas de orientación, autointersecciones, triangulación + árbol
  dual + orejas (solo si la curva es simple).
- **Lecturas:** $W$, cruces sin signo, con signo, paridad, chequeo "paridad ≡ W (mod 2)",
  ¿simple?
- **Faro:** animación de $s$ recorriendo $S^1$, el vector unitario desde $x$, dial con traza en
  espiral (radio creciente con las vueltas) y contador de vueltas acumuladas.
- **Sonido (Web Audio API, nativo):** tono de Shepard controlado por el ángulo acumulado (una
  octava por vuelta), clic agudo/grave al completar vuelta $\pm$. Apagado por defecto.
- **Lentes:** Matemático, Programador, Físico (Ampère), Algebraico ($\mathbb{Z}$ vs.
  $\mathbb{Z}/2$): textos en `diseccion.md`, Estación 5.
- **Escenarios:** círculo, ocho, limaçon, círculo recorrido dos veces, flor con lazos, laberinto
  espiral, errata del libro.
- **Invertir orientación** (botón) para ver $W \to -W$.
- **Modo Desafío:** "predecí $W$" (se oculta la lectura; el lector elige un número; se revela).

### G2 Bisturí topológico — P0

- Galería de espacios dibujados como grafos geométricos: intervalo, círculo, ocho, Y, θ, letras.
- **Clic = cortar un punto**: el espacio se recolorea por componentes del complemento y aparece
  $c(p)$. Al pasar el mouse, previsualización.
- **Tabla de firma** que se completa sola por tipo de punto (extremo, interior de arista,
  vértice de grado $k$: $c$ depende del grado y de si es puente).
- **Comparador:** dos espacios lado a lado; el gadget declara "distinguidos por la firma" o "misma
  firma: probá el invariante local" (θ vs. círculo).
- **Modo tipográfico (P1):** el lector escribe una palabra; cada letra (esqueleto precargado en
  sans-serif) se clasifica y se agrupan por clase de homeomorfismo con colores.
- Lógica: los espacios son grafos; $c(p)$ se calcula con la ola o union-find de I.1 (reutilizar
  `tcomp`/`ola_tijera.js`). **Hilo con I.1 explícito en la lente Programador.**

### G3 Proyector estereográfico — P1

- **2D:** el círculo, el polo norte $N$, un punto arrastrable en el círculo y su proyección sobre
  la recta; cuando el punto se acerca a $N$, la proyección se va al infinito (lectura numérica).
  Panel paralelo con la logística $\mathbb{R} \to (0,1)$.
- **3D (Three.js):** la esfera, el plano, la proyección de una curva dibujada en el plano sobre la
  esfera (y viceversa). Sirve también para el ejercicio 3(i): una curva de Jordan del plano se
  ve en la esfera, y el "afuera" contiene al polo.

### G4 ¿Adentro o afuera? (desafío humano vs. algoritmo) — P0

- Se genera una curva de Jordan difícil (laberinto espiral, laberinto de grilla aleatorio con
  borde de pasillos, copo de Koch nivel 3-4) y un punto.
- El lector responde (teclas A/F) con cronómetro; luego el algoritmo responde en microsegundos y
  muestra el rayo con sus cruces. Marcador acumulado humano vs. algoritmo.
- Variante "a ojo no se puede": puntos a 1 px del borde en curvas fractales.

### G5 Esfera vs. toro — P1 (Three.js)

- Dos superficies 3D rotables. El lector traza una curva cerrada simple (sobre una familia
  precargada: ecuador / meridiano / paralelo / curva (p,q) en el toro) y luego "vierte pintura"
  en un punto: la pintura se expande (inundación sobre una malla) y se detiene en la curva.
- Esfera: la pintura siempre queda de un lado. Toro con meridiano: **la pintura da la vuelta y
  cubre todo**. Lectura: "componentes del complemento: 2 / 1".

### G6 Área con signo — P0

- Tres puntos arrastrables $x, a, b$; el triángulo se rellena con color según el signo (azul
  antihorario, naranja horario) e intensidad según el área; lectura de $\det \Delta$ = 2·área.
- Al alinearse, destello y "det = 0". Lente Programador: el mismo cálculo en punto flotante vs.
  exacto, con un caso donde el flotante se equivoca (puntos casi alineados con coordenadas
  grandes). Usar **robust-predicates** (`orient2d`) como referencia exacta.

### G7 Microscopio de perturbaciones — P1

- Configuraciones degeneradas precargadas: rayo por un vértice "pico" (∧), por un vértice
  "escalón" (las dos aristas del mismo lado), arista horizontal sobre el rayo, $x$ sobre una
  arista.
- **Zoom en dos niveles:** escala $\varepsilon_2$ (se ve $x'$ apenas arriba) y escala
  $\varepsilon_1$ (apenas a la derecha). En cada nivel, la decisión de `doesCross` para cada
  arista y el conteo final.
- Tabla "sin perturbar / con $x'$" de la Estación 3.

### G8 Taller de triangulación — P0

- El lector **hace clic para poner vértices** (polígono simple; avisar si se cruza) o elige un
  escenario.
- **Modo Demostración:** la prueba inductiva paso a paso: vértice $b$ más a la izquierda,
  triángulo $abc$, vértices adentro, la diagonal elegida, la partición en $n_1 + n_2 = n + 2$,
  recursión (pila visible).
- **Árbol dual** que crece a medida que aparecen triángulos; **orejas** resaltadas (siempre
  $\ge 2$); contadores $n-2$, $n-3$.
- **Modo errata:** la regla del libro (rojo) vs. la corregida (verde) sobre
  `CONTRAEJEMPLO_LIBRO`; botón "generar otro contraejemplo" (búsqueda aleatoria en vivo).
- **Navegación:** dos puntos dentro del polígono; camino por el árbol dual (ola de I.1) y la
  ruta resultante a través de los triángulos.
- **Galería de arte (P1):** 3-coloreo animado y guardias del color menos usado, con sus polígonos
  de visibilidad.

### G9 Poliedro de Schönhardt — P1 (Three.js)

- Prisma triangular con deslizador de giro de la tapa (0° a 60°). Lectura: "¿tetraedrizable sin
  vértices nuevos?" Se muestran las 6 diagonales posibles de las caras laterales y cuáles quedan
  afuera del poliedro. El "sí" se vuelve "no" en cuanto el giro es positivo.

### G10 Paisaje de vueltas — P1 (Three.js)

- La curva de G1 (compartiendo estado) se levanta en 3D: cada región a altura $W$ (mesetas con
  bordes verticales sobre la curva). Cámara orbital y modo "caminar" (primera persona) por el
  paisaje: cruzar la curva es subir o bajar un escalón. Las cimas (máximos locales) muestran la
  orientación antihoraria de su borde con flechas.

### G11 De la curva a la persistencia — P2 (anticipo del capítulo VII)

- **Versión marimo (P1):** `notebooks/curvas_persistencia.py`: elegir o dibujar (con un widget)
  una curva, muestrear $N$ puntos con ruido regulable, calcular persistencia $H_1$ con `ripser`,
  mostrar diagrama y código de barras. Círculo → una barra larga; ocho → dos; limaçon → dos de
  distinta longitud.
- **Versión en el sitio (P2):** export estático del notebook con 3-4 casos precalculados.

## 6. Tecnologías nuevas a instalar o usar

| Tecnología | Para qué | Cómo |
|---|---|---|
| **Three.js** | G3, G5, G9, G10 | En OJS: `THREE = import("https://cdn.jsdelivr.net/npm/three@<versión>/+esm")` (o `npm:three`); nada que instalar. Para tests: `npm i -D three` si hace falta |
| **Web Audio API** | Sonido de G1 | Nativa del navegador |
| **Scrollama** | Scrollytelling de la Estación 5 | CDN, o `IntersectionObserver` nativo |
| **perfect-freehand** | Trazo a mano alzada en G1 | `npm:perfect-freehand` en OJS |
| **robust-predicates** | `orient2d` exacto en JS (G6 y tests) | `npm:robust-predicates`; para tests: `npm i -D robust-predicates` |
| **earcut** | Referencia de triangulación en tests JS | `npm i -D earcut` |
| **shapely**, **mapbox-earcut** | Referencias en tests de Python | `uv add --dev shapely mapbox-earcut` |

Si los tests JS necesitan dependencias, crear un `package.json` mínimo con `devDependencies`
(consultar con Esteban antes, regla 4 de `CLAUDE.md`).

## 7. Animaciones de Manim — P1

`animaciones/cap01_curvas.py`, videos a `capitulos/01-grafos/media/`:

1. **`RayoQueGira`**: el rayo desde $x$ gira 360°; el conteo de cruces cambia, pero **su paridad
   nunca** (los cruces aparecen y desaparecen de a pares). Es la prueba visual de que la paridad
   no depende de la dirección del rayo.
2. **`PruebaTriangulacion`**: la inducción del libro con la regla corregida, con el árbol dual
   creciendo al costado.
3. **`ElFaro`**: el observador en $x$, el vector unitario y el dial, para el limaçon ($W = 2$),
   con el contador de vueltas.
4. **`CopoDeKoch`** (P2): iteraciones del copo con un punto adentro y el rayo, para mostrar que
   Jordan vale aunque la curva no tenga tangentes.

## 8. Lean — P2

`lean/TComp/Curvas.lean`: el lema algebraico del hilo central. Si cada término de una lista de
enteros vale $\pm 1$, la suma es congruente con la longitud módulo 2 (paridad ≡ vueltas). Es
corto y conecta el algoritmo con su justificación.

## 9. Criterio de terminado

- [ ] Carcasa común de gadgets en `assets/js/gadget/` y usada por los gadgets de I.2.
- [ ] La página compila, está en el sidebar y respeta el presupuesto de texto visible.
- [ ] `uv run pytest` y `node --test 'tests/js/*.test.mjs'` en verde (incluida la errata).
- [ ] Gadgets P0 funcionando en el sitio publicado: G1, G2, G4, G6, G8.
- [ ] Al menos un gadget 3D (P1) y una animación de Manim.
- [ ] Esteban puede completar los 5 desafíos del objetivo de comprensión.

## 10. Preguntas abiertas para Esteban

- ¿Avanzamos con la carcasa común como Web Component o preferís una función de montaje más
  simple?
- ¿Te sirve el sonido activado con un botón (apagado por defecto), o preferís que la
  sonificación sea una pieza separada?
