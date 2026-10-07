# Filosofía del proyecto: el manifiesto pedagógico

> **Documento rector.** Lo deben leer y respetar las dos sesiones de trabajo (Claude en
> Cowork y Claude Code en VS Code) antes de producir cualquier material del libro. Si una
> decisión de diseño entra en conflicto con este documento, gana este documento.
>
> Fuente: lo definió Esteban el 5 de octubre de 2026, al comenzar la sección I.1.

## 1. La misión, en palabras de Esteban

La idea central de todo el trabajo es la **búsqueda obsesiva y sin descanso de la naturaleza
conceptual, geométrica y visual más profunda y fundamental**, transversal a todos los temas.
Cada definición, teorema, demostración, algoritmo, concepto y corolario debe ir acompañado de
interpretaciones que lleven la abstracción a un nuevo nivel y que, paradójicamente, le
permitan al lector ver con una claridad formidable la naturaleza más refinada de lo que está
estudiando.

Ya existe material de altísima calidad que explota enfoques visuales y conceptuales. Por eso
**no alcanza con igualarlo: hay que ir un paso más allá**, con enfoques inusuales y novedosos,
explotando un stack de tecnologías de vanguardia combinadas como nunca antes. No nos
conformamos con dibujos y figuras de ejemplos clásicos. Queremos ser una suerte de *Tier 1*
de la matemática.

## 2. Qué significa "un paso más allá" (criterios operativos)

Una pieza del producto está a la altura si cumple la mayoría de estos criterios:

1. **El lector manipula, no solo mira.** Si un concepto tiene un parámetro, el lector lo mueve.
   Si tiene un caso límite, el lector lo provoca. Si una definición tiene una condición, el
   lector la rompe y ve qué se cae.
2. **La visualización codifica el mecanismo real, no una ilustración decorativa.** El dibujo
   de union-find *es* el arreglo `parent` en vivo; el dibujo de un abierto *es* la condición
   de la definición verificándose.
3. **Toda definición viene con su "por qué es así".** Las definiciones son decisiones de
   diseño. Explicamos qué problema resuelve cada condición y qué se rompe sin ella
   (por ejemplo: por qué intersecciones finitas y uniones arbitrarias).
4. **Dos puntos de vista como mínimo.** Matemático y programador; discreto y continuo;
   constructivo y por obstrucción; local y global; intrínseco y extrínseco. Donde se cruzan
   dos miradas aparece la comprensión profunda.
5. **Ejemplos y contraejemplos inusuales.** Además del ejemplo canónico, buscamos el que
   sorprende: el que está en el borde de la definición, el que muestra que una hipótesis es
   necesaria, el que conecta con algo inesperado.
6. **Las demostraciones son objetos vivos.** Mostramos que muchas demostraciones *son*
   algoritmos (y viceversa), y las animamos como procesos.
7. **Hilos largos.** Cada idea se conecta hacia atrás y hacia adelante en el libro
   (union-find de I.1 reaparece como persistencia 0-dimensional en el capítulo VII) y hacia
   las finanzas cuantitativas.
8. **Verificable.** Todo lo que se afirma se puede comprobar: tests contra librerías de
   referencia, demostraciones completas, formalización en Lean cuando aporta.

## 3. El arsenal

| Arma | Para qué | Tecnología habitual |
|---|---|---|
| Analogía profunda | Transferir intuición de un dominio conocido; siempre declarando dónde se rompe | Texto (Quarto) |
| Interpretación visual estática | Fijar la imagen mental correcta | SVG, Mermaid, Penrose |
| Visualización interactiva | Que el lector explore la definición | Observable JS + D3 dentro de Quarto |
| Animación de procesos | Mostrar algoritmos y demostraciones como procesos en el tiempo | Manim |
| Laboratorio de exploración | Experimentos numéricos (complejidad, estadística, casos aleatorios) | marimo |
| Implementación propia | Entender construyendo; la librería se reutiliza en finanzas | `src/tcomp/` + pytest |
| Verificación formal | Certeza absoluta en resultados selectos | Lean 4 + Mathlib |
| Juego / desafío | Que el lector intente algo imposible y descubra por qué lo es | OJS / Three.js |
| Tabla de contrastes | Poner en paralelo dos mundos (discreto/continuo, etc.) | Texto |
| Certificados | Mostrar qué testigo verifica cada afirmación | Texto + interactivo |

## 4. La matriz de tratamiento

Cada concepto relevante de una sección se trata recorriendo esta lista. No todas las filas
aplican siempre, pero hay que considerarlas todas:

1. **Enunciado formal**, fiel al libro en notación.
2. **El porqué del diseño**: qué captura cada condición; qué pasa si se quita.
3. **Intuición y analogía**, con sus límites declarados.
4. **Imagen mental / visual** (estática).
5. **Pieza interactiva o animada**, si el concepto tiene un parámetro o un proceso.
6. **Ejemplos**: canónico, inusual, y **contraejemplos** que marcan la frontera.
7. **Mirada del programador**: qué algoritmo, qué estructura de datos, qué costo.
8. **Discreto ↔ continuo** (y las otras dualidades del prefacio).
9. **Demostraciones completas** de lo que el libro afirma sin probar.
10. **Hilos**: hacia atrás, hacia adelante, hacia finanzas.
11. **Verificación**: tests, contraejemplos computados, formalización.

## 5. Tono y estilo

- Español claro y preciso. La notación matemática sigue al libro.
- Profundidad sin pedantería: cada recurso tiene que *esclarecer*, no lucirse. Si una pieza
  no ayuda a entender algo mejor, no se hace (regla 8 de `CLAUDE.md`).
- Nunca se copia texto extenso del libro: todo es disección propia.

---

# Paradigma v2: el producto como instrumento (desde la sección I.2)

> Definido por Esteban el 7 de octubre de 2026, después de revisar el producto terminado de
> I.1. **No invalida nada de lo anterior: lo radicaliza.** La sección I.1 queda como está por
> ahora; las mejoras pendientes están en `TAREAS.md`.

## 6. El salto que buscamos

El Bloc de notas de Windows y Obsidian guardan el mismo texto, pero son productos de
naturaleza distinta. Lo mismo pasa entre el viejo buscador y un ecosistema con IA, o entre una
página web estática y una aplicación moderna. **Queremos que nuestro producto sea, frente a los
mejores libros y sitios de matemática actuales, lo que Obsidian es frente al Bloc de notas.**

Para eso adoptamos el rol de un **director de innovación** de las empresas que redefinieron
categorías enteras (Apple, Google, Anthropic, OpenAI, Meta, Microsoft): no se mejora el producto
existente, se cambia la categoría.

## 7. Los cinco principios del paradigma v2

1. **Visualización primero (visualization-first).** Históricamente, las imágenes de un libro de
   matemática fueron *complementos del texto*. Invertimos la relación: **el gadget es el
   contenido principal y el texto lo acompaña**. El texto no desaparece: pasa a ser la
   leyenda, la nota al margen, el "profundizar".
2. **Potencia expresiva visual ≥ potencia textual.** Lo visual tiene que alcanzar la misma
   precisión que la exposición formal, o superarla. Un gadget bien hecho *es* una definición
   (se puede jugar con sus condiciones), *es* un teorema (se puede intentar romperlo y no se
   puede) y *es* una demostración (se puede reproducir paso a paso).
3. **Complementar el libro, no reemplazarlo.** No repetimos definiciones que el libro ya da bien:
   las **citamos** con una ficha "Libro, p. X" y vamos directo a lo que el libro *no puede*
   hacer: mover, animar, sonar, desafiar, verificar. El texto propio se reserva para lo que es
   **aporte nuestro**: interpretaciones, demostraciones que el libro omite, ejemplos inusuales,
   puentes, erratas.
4. **Gadgets, no figuras.** Cada pieza es un **gadget tecnológico digital**: un instrumento con
   estado, controles, modos y lecturas, que se usa (no solo se mira) y que se recuerda.
5. **Hipermodernidad deliberada.** En cada sección buscamos al menos un recurso que
   *no hayamos visto nunca* en material de matemática: modelos espaciales e inmersivos, redes
   como circuitos, sonificación, análisis topológico de datos aplicado al propio contenido
   ("los datos tienen forma": usar el libro para mejorar el libro), juegos, desafíos.

## 8. Anatomía de un gadget

Todo gadget del sitio comparte una misma "carcasa" (como las apps de un sistema operativo):

| Parte | Qué es |
|---|---|
| **Escenario** | El área de manipulación directa (dibujar, arrastrar, cortar, rotar) |
| **Lecturas** | Instrumentos que muestran en vivo lo que calcula (números, diales, medidores) |
| **Capas** | Interruptores para superponer vistas del mismo objeto |
| **Lentes** | Pestañas *Matemático / Programador / Físico / Algebraico / Geómetra*: la misma escena leída desde cada disciplina, con su fórmula, su código o su ley |
| **Modos** | *Explorar* (libre) · *Demostración* (paso a paso, adelante y atrás) · *Desafío* (el lector compite contra el algoritmo o intenta romper un teorema) |
| **Escenarios precargados** | Ejemplos canónicos, inusuales, patológicos y erratas |
| **Carcasa común** | Pantalla completa, reinicio, enlace permanente al estado (en la URL), exportar imagen, "¿qué estoy viendo?" |
| **Gemelo verificado** | Su semántica coincide con `tcomp` (Python) y está testeada en Node |

## 9. Arquitectura de página v2

```
┌─────────────────────────────────────────────────────────────┐
│ GADGET ESTRELLA (ancho completo): la sección entera en un   │
│ instrumento. Se puede usar sin leer nada más.               │
├─────────────────────────────────────────────────────────────┤
│ Mapa de estaciones: tarjetas con miniaturas vivas           │
├─────────────────────────────────────────────────────────────┤
│ ESTACIÓN k                                                  │
│  [Libro, p. X · Definición/Teorema]  ← ficha, no repetición │
│  La idea en una o dos líneas                                │
│  GADGET de la estación (con lentes y modos)                 │
│  ▸ Profundizar: aportes propios, demostraciones ★, puentes  │
└─────────────────────────────────────────────────────────────┘
```

- **Presupuesto de texto:** como guía, no más de ~1.500 palabras visibles por sección sin
  desplegar, y no más de ~120 por estación. Lo demás va en "Profundizar".
- **Scrollytelling** donde haya una narración con pasos: el gadget queda fijo y las tarjetas de
  texto, al desplazarse, *controlan* su estado.
- La autoevaluación final sigue, pero como **desafíos** dentro de los gadgets.

## 10. Patrones de gadgets (catálogo vivo)

| Patrón | Idea | Primer uso |
|---|---|---|
| Lienzo | El lector crea el objeto (dibuja una curva, un polígono, un grafo) y todo se recalcula | I.2 Lienzo de Jordan |
| Faro | Un observador fijo mira un proceso y un dial acumula lo que ve | I.2 número de vueltas |
| Bisturí | Cortar el objeto y ver qué invariante cambia | I.2 homeomorfismos |
| Microscopio | Zoom a escalas infinitesimales (ε) para ver decisiones simbólicas | I.2 perturbación |
| Desafío humano vs. algoritmo | El lector intenta y el algoritmo responde al instante | I.2 laberintos |
| Cazador de erratas | Un contraejemplo verificado, mostrado en vivo | I.2 triangulación |
| Paisaje | Una función sobre el plano convertida en terreno 3D recorrible | I.2 número de vueltas |
| Sonificación | Una magnitud se escucha (altura, ritmo, timbre) | I.2 tono de Shepard |
| Circuito | Grafos dibujados como circuitos donde "fluye" algo (corriente, señal, agua) | I.1 (pendiente) |
| Lentes | La misma escena desde varias disciplinas | I.2 en adelante |
| Los datos tienen forma | Aplicar TDA a objetos del propio curso | I.2 (curva → persistencia H₁) |

## 11. Radar tecnológico

| Anillo | Tecnologías |
|---|---|
| **Adoptar** (ya en uso) | Quarto, OJS + D3, Manim, marimo, Lean, `tcomp`, tests JS en Node |
| **Incorporar ahora** (I.2) | **Three.js** (3D: paisajes, toro, esfera, poliedros) · **Web Audio API** (sonificación, nativa del navegador) · **Scrollama** (scrollytelling) · **robust-predicates** (predicados geométricos exactos de Shewchuk, JS) · **earcut** y **mapbox-earcut** (referencias de triangulación para tests) · **perfect-freehand** (trazos a mano alzada de calidad) |
| **Probar** | Web Components nativos para la carcasa común de los gadgets · enlaces permanentes de estado · modo "estudio" a pantalla completa |
| **Evaluar** (horizonte) | WebXR (realidad virtual en el navegador) · WebGPU (simulaciones masivas) · Penrose (diagramas desde notación) · entrada por lápiz y gestos |

Regla: las tecnologías de navegador se cargan por CDN o con `npm:` dentro de OJS (no requieren
instalación). Las de desarrollo se instalan solo en WSL, consultando antes de sumar
dependencias pesadas (regla 4 de `CLAUDE.md`).
