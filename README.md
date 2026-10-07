# Topología Computacional

Disección del libro *Computational Topology: An Introduction* (Herbert Edelsbrunner y
John L. Harer, AMS 2010) construida con todo un stack tecnológico: texto propio,
implementaciones en Python, tests, animaciones, figuras interactivas y, cuando vale la
pena, verificación formal en Lean.

Es el proyecto piloto de una infraestructura personal de producción de conocimiento:
un mismo contenido vive una sola vez en este repositorio y desde ahí se genera en el
formato que mejor le sirve (página web interactiva, PDF, animación, notebook, prueba
formal). Además alimenta un proyecto de finanzas cuantitativas con herramientas de
análisis topológico de datos (TDA).

> Este repositorio **no** contiene el texto ni el PDF del libro. Contiene una disección
> propia: reformulaciones, demostraciones desarrolladas, ejemplos, código y visualizaciones.

## Estado

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Infraestructura: uv, Quarto, Manim, marimo, GUDHI, pruebas de humo, publicación automática | Hecha |
| 1 | Corte vertical: sección I.1 *Componentes conexas* tocando todas las capas | Construida |

## El libro y su mapa

| Parte | Capítulos |
|---|---|
| A. Topología geométrica computacional | I. Grafos · II. Superficies · III. Complejos |
| B. Topología algebraica computacional | IV. Homología · V. Dualidad · VI. Funciones de Morse |
| C. Topología persistente computacional | VII. Persistencia · VIII. Estabilidad · IX. Aplicaciones |

Cada sección del producto sigue la estructura: motivación e intuición → definiciones y
resultados → algoritmo e implementación → visualización → ejercicios resueltos →
puente a finanzas → notas para formalización.

**Sitio publicado:** https://estebanstaniscia.github.io/topologia-computacional/

## Cómo se trabaja

El trabajo se reparte entre dos espacios que se sincronizan a través de GitHub:

```
 Claude en la app de escritorio (Cowork)        Claude Code (VS Code + WSL2)
 rama bocetos · escribe solo en bocetos/        rama main · escribe en todo menos bocetos/
 ─────────────────────────────────────          ──────────────────────────────────────────
 estudio del libro, disección, specs   ──push──► merge de origin/bocetos
                                                 construye: .qmd, src/tcomp/, tests,
 merge de origin/main  ◄──────────────push────── animaciones, notebooks, Lean
```

Como cada lado escribe en carpetas distintas, los merges entre ramas no generan
conflictos. El protocolo completo está en [`bocetos/README.md`](bocetos/README.md).

## Estructura

```
├── index.qmd, _quarto.yml   # Portada y configuración del sitio (Quarto es el hub)
├── capitulos/               # Un directorio por capítulo, un .qmd por sección; media/ para videos
├── src/tcomp/               # Librería propia con los algoritmos del libro
├── tests/                   # Validación de tcomp contra GUDHI, ripser y networkx
├── animaciones/             # Escenas de Manim
├── notebooks/               # Exploraciones en marimo (.py)
├── lean/                    # Formalizaciones selectas con Lean 4 + Mathlib
├── bocetos/                 # Taller de diseño (rama bocetos, Cowork)
├── docs/                    # Contexto del proyecto y notas internas (no se publica)
└── _freeze/                 # Resultados de ejecución congelados de Quarto (se versiona)
```

Cada push a `main` dispara `.github/workflows/publicar.yml`, que compila el sitio con
Quarto (usando `_freeze/`, sin volver a ejecutar Python) y lo publica en la rama `gh-pages`.

## Stack

- **Documentos:** Quarto (sitio web y PDF vía Typst), marimo.
- **Visualización:** Manim CE, Observable JS, Mermaid.
- **Cálculo y TDA:** NumPy, SciPy, networkx, GUDHI, ripser, persim.
- **Infraestructura:** uv (Python 3.12), Git y GitHub, GitHub Actions + Pages, Claude Code y Claude Cowork.
- **Verificación formal:** Lean 4 + Mathlib (`cd lean && lake build`).

## Uso local

Requiere [uv](https://docs.astral.sh/uv/) y [Quarto](https://quarto.org/).

```bash
uv sync                    # crea el entorno a partir de uv.lock
uv run pytest              # corre los tests
uv run quarto preview      # abre el sitio en el navegador
uv run quarto render       # compila el sitio y actualiza _freeze/
uv run marimo edit notebooks/<archivo>.py
node --test 'tests/js/*.test.mjs'   # tests de las piezas interactivas
uv run manim -ql animaciones/<archivo>.py <Escena>
```

## Documentación

- [`docs/contexto-proyecto.md`](docs/contexto-proyecto.md): visión, arquitectura, flujo de
  trabajo, convenciones y guía de instalación de la Fase 0.
- [`CLAUDE.md`](CLAUDE.md): instrucciones para Claude Code.
- [`bocetos/README.md`](bocetos/README.md): protocolo entre Cowork y Claude Code.
