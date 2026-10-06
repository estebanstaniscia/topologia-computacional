---
seccion: "I.1 Componentes conexas"
estado: listo para construir
fecha: 2026-10-05
fuente: diseccion.md (misma carpeta) · filosofía: bocetos/_proyecto/FILOSOFIA.md
---

# Spec: sección I.1 Componentes conexas (corte vertical de la Fase 1)

## 1. Objetivo de comprensión

Al terminar, Esteban debe poder explicar sin mirar el libro:

1. Las dos definiciones de conexidad (constructiva / por obstrucción), por qué coinciden en
   grafos (Proposición 1, con su prueba) y por qué no en espacios (el peine, con su prueba).
2. Qué es una topología y **por qué** sus axiomas son los que son (clave de las observaciones).
3. Por qué la continuidad se define con preimágenes, y el giro de Sierpiński sobre el ejemplo
   del libro.
4. Union-find completo: representación, operaciones, la cota $\log_2 k$ con su prueba, la
   compresión de caminos y el significado de $\alpha(n)$.
5. Que union-find calcula $\beta_0$ y $\beta_1$ del grafo, y cómo eso conduce a la persistencia.

## 2. Principios de construcción (resumen de FILOSOFIA.md)

- Cada pieza interactiva **codifica el mecanismo real** (no es decorativa).
- El lector **manipula**: mueve parámetros, provoca casos límite, intenta lo imposible.
- Paleta y estilo visual **coherentes en todo el sitio** (definirlos una vez en
  `assets/` y reutilizarlos; modo claro y oscuro).
- Accesible: cada pieza interactiva tiene un texto alternativo que dice qué muestra.

## 3. Entregables

Prioridad: **P0** imprescindible para cerrar la sección · **P1** muy deseable · **P2** si hay tiempo.

### 3.1 Página del capítulo (Quarto) — P0

- **Archivo:** `capitulos/01-grafos/1-1-componentes-conexas.qmd` (agregar al sidebar en
  `_quarto.yml`).
- **Contenido:** reformular `diseccion.md` en el formato del sitio, respetando su orden de
  bloques. Usar callouts de Quarto: `callout-note` para definiciones, `callout-tip` para
  intuiciones/analogías, `callout-important` para teoremas, y bloques colapsables
  (`collapse="true"`) para las demostraciones ★.
- **Referencias cruzadas** con etiquetas de Quarto (`@def-…`, `@thm-…`, `@prp-…`, `@fig-…`).
- La tabla del leitmotiv (sección 0 de la disección) va **arriba de todo**, como mapa.
- Incrustar las piezas 3.3 a 3.9 donde la disección las menciona.

### 3.2 Librería `tcomp` — P0

**`src/tcomp/union_find.py`** — portar `prototipos/union_find.py`:

- Clase `UnionFind(n, estrategia="completa", trazar=False)` con `estrategia` en
  `{"ingenua", "tamano", "completa"}`. Elementos `1..n` **o** `0..n-1` (decidir una
  convención para toda la librería y documentarla; el prototipo usa 1..n como el libro).
- Métodos: `find`, `union` (devuelve `bool`), `conjuntos`, `altura`, `profundidad`.
- Contadores: `componentes` ($\beta_0$), `rechazadas` ($\beta_1$), `saltos`.
- **Traza** opcional de eventos (`find` con camino y nodos comprimidos; `union` con enlace y
  `swap`; `rechazo`) con foto de `parent` y `size` en cada paso. Esta traza alimenta la
  animación de Manim y puede exportarse a JSON para las piezas OJS.
- Convención de desempate del libro: con tamaños iguales, la raíz de `i` cuelga de la de `j`.
- Compresión de caminos **iterativa** (no recursiva) para no chocar con el límite de recursión
  de Python en cadenas largas.

**`src/tcomp/conexidad.py`** — portar `prototipos/certificados.py`:

- `ola(n, aristas, origen)` → frentes de BFS y árbol de la ola.
- `certificado(n, aristas)` → `("conexo", arbol_generador)` o `("desconexo", (U, W))`.
- `verificar_arbol_generador`, `verificar_separacion`.
- `componentes(n, aristas)` en $O(n + m)$ (ejercicio 1(ii)).

**`src/tcomp/persistencia.py`** — nuevo:

- `persistencia_0(puntos | matriz_distancias)` → lista de pares (nacimiento, muerte) de
  dimensión 0, vía Kruskal + union-find. Muerte infinita para la componente que sobrevive.
- `arbol_generador_minimo(...)` como subproducto.

### 3.3 Tests — P0

`tests/test_union_find.py`, `tests/test_conexidad.py`, `tests/test_persistencia.py`:

- Reproducir **exactamente** las tablas de los ejemplos 1 y 2 de la disección (4.4 y 5.3).
- `rechazadas == m - n + componentes` en grafos aleatorios, para las tres estrategias.
- Altura $\le \log_2(\text{tamaño})$ con unión por tamaño (propiedad).
- Componentes contra `networkx.connected_components`.
- Todo certificado devuelto es verificable (árbol o separación).
- `persistencia_0` contra GUDHI (`RipsComplex` con `max_dimension=1`, pares de dimensión 0) en
  nubes aleatorias; comparar multiconjuntos de muertes con tolerancia.
- Considerar `hypothesis` para los tests de propiedades (consultar antes de agregar la
  dependencia).

### 3.4 Pieza interactiva: "Laboratorio de union-find" — P0 (la pieza estrella)

- **Tecnología:** Observable JS dentro del `.qmd` (D3 para el dibujo). Existe un prototipo
  funcional en HTML/JS puro: `prototipos/union_find_lab.html`. **Portarlo** a OJS (o
  incrustarlo tal cual como HTML si el port complica; decidir con Esteban).
- **Vistas sincronizadas:** (a) el **grafo** con sus aristas (aceptadas en color sólido,
  rechazadas punteadas), (b) el **bosque de up-trees**, (c) el **arreglo** `parent`/`size`.
- **Controles:** estrategia (básica / tamaño / tamaño + compresión), paso a paso adelante y
  atrás, reproducción automática, reinicio.
- **Escenarios precargados:** ejemplo 1 (4 vértices), ejemplo 2 (8 vértices), peor caso de la
  básica, árbol binomial, grafo aleatorio.
- **Narración** de cada paso en texto ("`Find(1)` sube 1 → 2 → 4 y comprime…").
- **Marcadores en vivo:** $\beta_0$, $\beta_1$, saltos acumulados, altura del bosque.

### 3.5 Pieza interactiva: "La ola y la tijera" — P0

- **Tecnología:** OJS + D3.
- El lector arma un grafo (clic para vértices, arrastrar para aristas) o elige uno precargado.
- Botón "lanzar la ola" desde un vértice: animación por frentes (anillos de distancia).
- Al terminar: si cubre todo, resaltar el **árbol generador** y mostrar "certificado de
  conexidad: n − 1 aristas"; si no, colorear $U$ (mojado) y $W$ (seco), resaltar que **ninguna
  arista cruza** y mostrar "certificado de desconexión".
- Modo extra: quitar una arista de un árbol y ver aparecer la separación (corte fundamental);
  agregar una arista y ver el ciclo fundamental.

### 3.6 Pieza interactiva: "Taller de topologías finitas" — P1

- **Tecnología:** OJS.
- Conjunto de 2 o 3 puntos; el lector marca subconjuntos como abiertos.
- Chequeo en vivo de los tres axiomas, señalando **qué** axioma falla y **con qué** conjuntos.
- Vista del **preorden de especialización** como grafo dirigido.
- Indicadores: ¿conexo? ¿conexo por caminos? (para finitos coinciden).
- Botones para cargar: trivial, discreta, Sierpiński.

### 3.7 Pieza interactiva: "Continuidad: tirar hacia atrás" — P0

- **Tecnología:** OJS.
- Panel 1 ($\mathbb{R} \to \mathbb{R}$): la función escalón del libro, ventana $\varepsilon$
  alrededor de $f(0)$, ventana $\delta$ alrededor de 0 con slider; se ve que **ningún δ
  funciona** (los puntos que se escapan se resaltan).
- Panel 2 ($\mathbb{R} \to \{0,1\}$): selector con las 4 topologías del codominio; para cada
  abierto, mostrar su preimagen sobre la recta y si es abierta. Veredicto en vivo. Explicación
  del caso Sierpiński (test semidecidible "$x > 0$").

### 3.8 Pieza interactiva: "Una topología no ve formas" — P1

- **Tecnología:** OJS + D3.
- Un punto de $\mathbb{R}^2$ y la animación del **anidamiento alternado** disco ⊃ cuadrado ⊃
  disco ⊃ … (también rombos); zoom continuo hacia el punto.
- Segundo modo: la recta de Sorgenfrey; el lector arrastra el intervalo $[a, b)$ y ve que es
  abierto y cerrado a la vez.

### 3.9 Pieza interactiva: "El peine" — P0

- **Tecnología:** OJS + D3 (o Three.js si se quiere profundidad; no es necesario).
- **Zoom infinito** hacia $p = (0,1)$: a cualquier escala aparecen más dientes (generar los
  dientes visibles según el nivel de zoom).
- **Desafío:** el lector dibuja a mano un camino desde la barra hacia $p$; el sistema detecta y
  marca dónde el trazo "salta" (sale del peine) y explica por qué no hay camino continuo.
- Indicador: "todo disco alrededor de $p$ toca al peine" (con el disco arrastrable y achicable).

### 3.10 Animaciones de Manim — P1

Archivo `animaciones/cap01_union_find.py`, videos finales en `capitulos/01-grafos/media/`:

1. **`DosEstrategias`**: el mismo grafo procesado por el escultor (borra aristas de ciclos) y
   el albañil (agrega aristas rechazando ciclos), en pantalla dividida, llegando al mismo tipo
   de objeto.
2. **`UnionPorTamano`**: construcción del árbol binomial; un nodo resaltado baja de nivel y en
   cada bajada su árbol se duplica (contador de tamaño junto al nodo). Cierra con la cota
   $\log_2 k$.
3. **`CompresionDeCaminos`**: un `Find` sube por una cadena y, a la vuelta de la recursión, los
   punteros "saltan" a la raíz uno por uno.
4. **`DeCaminoDiscretoAContinuo`**: un camino en un grafo dibujado se reparametriza con un
   reloj $t \in [0,1]$ y "se derrite" en un camino continuo (3.3 de la disección).
5. **`PersistenciaCero`**: nube de puntos, bolas de radio $\varepsilon$ creciendo, aristas que
   aparecen, componentes que se fusionan (colores que se unifican) y, en paralelo, el código de
   barras que se dibuja. Usar la traza de `tcomp.union_find`.

### 3.11 Notebook marimo — P1

`notebooks/union_find_complejidad.py`:

- Saltos totales y altura máxima vs. $n$ (escala log-log) para las tres estrategias, en:
  secuencias aleatorias, el peor caso de la básica y el árbol binomial.
- Slider de $n$ y selector de secuencia.
- Tabla de $\alpha(n)$ con los umbrales de Ackermann.

### 3.12 Lean — P2

`lean/TComp/Grafos.lean`: lema de los apretones de manos (vía Mathlib) como primer contacto.
Si sale fácil, formalizar la Proposición 1 (conexo ⟺ sin separación) con prueba propia.

### 3.13 Sección "Puente a finanzas" — P1

Al final del `.qmd`: distancia de correlación de Mantegna, árbol generador mínimo de activos,
enlace simple = persistencia 0-dimensional. Un ejemplo con datos sintéticos (dos bloques de
activos correlacionados) usando `tcomp.persistencia`; datos reales quedan para más adelante.

## 4. Criterio de terminado

- [ ] `capitulos/01-grafos/1-1-componentes-conexas.qmd` compila con `uv run quarto render` y
      aparece en el sidebar.
- [ ] `uv run pytest` en verde, incluidos los tests de los ejemplos 1 y 2.
- [ ] Las piezas P0 (3.4, 3.5, 3.7, 3.9) funcionan en el sitio publicado.
- [ ] Al menos una animación de Manim incrustada.
- [ ] Esteban puede explicar los 5 puntos del objetivo de comprensión sin el libro.

## 5. Preguntas abiertas para Esteban

- ¿Elementos 1..n (como el libro) o 0..n-1 (idiomático en Python) en `tcomp`?
- ¿Identidad visual propia del sitio desde ya, o seguir con el tema `cosmo` por ahora?
