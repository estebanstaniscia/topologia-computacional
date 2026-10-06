# CLAUDE.md: Topología Computacional

## Qué es este proyecto
Producto de conocimiento que disecciona el libro *Computational Topology: An
Introduction* (Edelsbrunner y Harer, AMS 2010) usando todo un stack tecnológico:
texto, código, tests, animaciones, figuras interactivas y verificación formal.
Es el proyecto piloto de una infraestructura de producción de conocimiento y
alimenta un proyecto de finanzas cuantitativas (análisis topológico de datos).

Contexto completo: @docs/contexto-proyecto.md

**Criterio rector de calidad:** `bocetos/_proyecto/FILOSOFIA.md` (el manifiesto pedagógico).
Leelo SIEMPRE antes de construir cualquier pieza del producto; si una decisión de diseño
choca con ese documento, gana el documento. Estado del proyecto, ubicaciones y registro de
decisiones: `bocetos/_proyecto/ESTADO.md`.

## Usuario
Esteban: estudiante de Matemática (UNLP) que trabaja en finanzas cuantitativas.
Nivel avanzado en matemática y Python. Quiere explicaciones profundas y el porqué
de cada decisión.

## Idioma
Todo el contenido, comentarios, docstrings y mensajes de commit en español.

## Arquitectura
- `capitulos/`: un directorio por capítulo; un `.qmd` por sección. Quarto es el hub
  (`_quarto.yml` solo renderiza `index.qmd` y `capitulos/**/*.qmd`).
- `src/tcomp/`: implementaciones PROPIAS de los algoritmos del libro (paquete `uv`, src layout).
  Convención de toda la librería: elementos/vértices **0..n-1** (compatible con numpy, GUDHI y
  networkx). Las páginas muestran las etiquetas del libro (1..n) desplazando solo al dibujar.
- `assets/`: estilo compartido del sitio. `assets/estilo.css` define la paleta (tokens de color,
  modo claro y oscuro) que usan TODAS las piezas; `assets/js/` tiene las piezas interactivas
  como módulos ES (lógica pura separada del dibujo, testeada con `node --test 'tests/js/*.test.mjs'`).
- `tests/`: validación de `tcomp` contra GUDHI, ripser y networkx.
- `animaciones/`: escenas de Manim; los videos finales van a `capitulos/*/media/`.
- `notebooks/`: exploraciones en marimo (archivos .py).
- `lean/`: formalizaciones selectas con Lean 4 + Mathlib (aún no creado; se genera con `lake new`).
- `bocetos/`: zona de trabajo de Cowork (ver "Flujo con Cowork"). Solo lectura para Claude Code.
- `docs/`: documentación interna (contexto del proyecto, notas previas). No se publica.
- `_freeze/`: resultados congelados de Quarto. SÍ se commitea. `_site/` NO.

## Material de consulta
- `textos_base/` (ignorado por Git): PDF del libro. Solo lectura local. NUNCA se commitea ni
  se publica. No leerlo completo salvo pedido expreso de Esteban (es grande); leer solo la sección pedida.
- `docs/archivos_varios/`: transcripciones de conversaciones previas y notas sueltas
  (`Tecnologias.txt`, notas de NotebookLM). Son largas: leerlas solo si Esteban lo pide.

## Comandos
- Entorno: `uv sync`
- Tests: `uv run pytest` (uno solo: `uv run pytest tests/test_x.py::test_nombre`)
- Tests de la lógica de las piezas JS: `node --test 'tests/js/*.test.mjs'`
- Lint / formato: `uv run ruff check . && uv run ruff format .`
- Vista previa del sitio: `uv run quarto preview`
- Compilar el sitio (actualiza `_freeze/`): `uv run quarto render`
- Animación (borrador / final): `uv run manim -ql <archivo> <Escena>` / `-qh`
- marimo: `uv run marimo edit notebooks/<archivo>.py`
- Lean: `cd lean && lake build`

## Reglas
1. Nunca copiar texto extenso del libro al producto: escribir disección propia.
2. Todo algoritmo nuevo en `src/tcomp/` va acompañado de tests contra una librería de referencia.
3. Antes de commitear un capítulo con código, ejecutar `uv run quarto render` para actualizar `_freeze/`.
4. Agregar dependencias solo con `uv add` y consultar antes de sumar dependencias pesadas.
5. Cada nueva sección se agrega a `_quarto.yml` (sidebar).
6. Commits pequeños con prefijo de área: `cap1:`, `tcomp:`, `anim:`, `lean:`, `infra:`.
7. Lean es selectivo: proponer formalizaciones accesibles, no intentar formalizar el libro entero.
8. La comprensión manda: cada pieza debe ayudar a entender algo mejor.

## Estructura de cada sección del producto
Motivación e intuición → definiciones y resultados (disección) → algoritmo e
implementación → visualización → ejercicios resueltos → puente a finanzas →
notas para formalización.

## Flujo con Cowork (rama `bocetos`)

El estudio del libro se hace con Claude en la app de escritorio (Cowork), que trabaja en
la rama `bocetos` y escribe **solo** en la carpeta `bocetos/`. El protocolo completo está en
`bocetos/README.md`: leelo antes de construir una sección. Resumen:
- Traer los bocetos: `git fetch origin && git merge origin/bocetos` (estando en `main`).
- Nunca editar archivos dentro de `bocetos/`.
- Construir solo lo que esté marcado `listo para construir` en el `spec.md` correspondiente.
- La `diseccion.md` es la fuente del `.qmd`: reformularla en el formato del sitio.
- Contexto completo del proyecto (stack, arquitectura, convenciones): `docs/contexto-proyecto.md`.

## Git en WSL
La clave SSH tiene passphrase y la sesión de Claude Code no tiene ssh-agent, así que
`git fetch/push` por SSH falla. Usar HTTPS con el token de `gh` sin tocar el remoto:
`git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push https://github.com/estebanstaniscia/topologia-computacional.git main`
(para fetch: `... fetch https://github.com/estebanstaniscia/topologia-computacional.git '+refs/heads/*:refs/remotes/origin/*'`).
