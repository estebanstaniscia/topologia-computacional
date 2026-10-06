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
