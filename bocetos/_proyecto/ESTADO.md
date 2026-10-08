# Estado del proyecto y cómo retomarlo

> **Para cualquier sesión nueva (Cowork o Claude Code):** este archivo resume dónde está cada
> cosa, cómo se trabaja y en qué punto estamos. Leelo junto con `FILOSOFIA.md` (misma
> carpeta, **incluido el paradigma v2**, §6-11), `TAREAS.md`, `bocetos/README.md` y
> `docs/contexto-proyecto.md`.
>
> Última actualización: 8 de octubre de 2026 (Cowork).

## 1. Qué es esto

Estudio del libro *Computational Topology* (Edelsbrunner y Harer, AMS 2010) como proyecto
piloto de una infraestructura personal de producción de conocimiento. El producto es un sitio
Quarto con disección propia, código, tests, animaciones, piezas interactivas y Lean. Detalle
completo en `docs/contexto-proyecto.md`. La filosofía pedagógica, que manda sobre todo lo
demás, está en `bocetos/_proyecto/FILOSOFIA.md`.

## 2. Dónde vive cada cosa

| Cosa | Ubicación |
|---|---|
| Repositorio (GitHub, público) | `https://github.com/estebanstaniscia/topologia-computacional` |
| Sitio publicado | `https://estebanstaniscia.github.io/topologia-computacional/` |
| Clon de Claude Code (principal) | WSL2: `~/proyectos/topologia-computacional`, rama `main` |
| Clon de Cowork | Windows: `C:\Users\esteb\OneDrive\Documentos\Algunos proyectos\Apuntes Personales\Computational topology\topologia-computacional`, rama `bocetos` |
| Token de GitHub para Cowork | `...\Computational topology\.credenciales\github-token.txt` (fuera del repo; fine-grained, solo este repo, Contents read/write, vence cada 90 días) |
| PDF del libro | Documentos del proyecto de claude.ai (para Cowork) y `textos_base/` en WSL (ignorado por git, para Claude Code) |
| Notas previas (NotebookLM, conversación del stack) | `docs/archivos_varios/` |

(La carpeta de Windows se llama "OneDrive" por herencia, pero la sincronización con OneDrive
está desactivada.)

## 3. Cómo se trabaja (resumen)

- **Cowork** (app de escritorio): estudio, disección y specs. Rama `bocetos`. Escribe **solo**
  en `bocetos/`. Hace push a `origin/bocetos`.
- **Claude Code** (VS Code + WSL2): construcción. Rama `main`. Escribe en todo **menos**
  `bocetos/`. Hace push a `origin/main`; GitHub Actions publica el sitio.
- Sincronización: Cowork hace `git fetch origin && git merge origin/main` al empezar; Claude
  Code hace `git fetch origin && git merge origin/bocetos` antes de construir.
- Protocolo completo: `bocetos/README.md`.

### Particularidades técnicas de Cowork

- El git de Cowork corre en una máquina virtual Linux de la app, con la carpeta de Windows
  montada. **En cada sesión nueva**, git necesita el **permiso de borrado** sobre la carpeta
  *Computational topology* (para sus archivos `.lock`): Cowork lo pide y Esteban lo aprueba.
- El helper de credenciales está configurado **en el `.git/config` del clon** y lee el token
  desde `../.credenciales/github-token.txt`. Si el push falla por autenticación, el token
  venció: generar uno nuevo y reemplazar el contenido del `.txt`.
- Cowork no puede acceder a archivos dentro de WSL (`\\wsl.localhost\...`): por eso el flujo
  pasa por GitHub.

## 4. Dónde estamos

| Fase | Estado |
|---|---|
| 0. Infraestructura (uv, Quarto, Manim, marimo, GUDHI, Pages, Actions) | Hecha |
| 1. Corte vertical: sección I.1 | **Hecha** (2026-10-07): P0, P1 y P2 construidos; Lean con la Proposición 1 |
| 2. Régimen de crucero, paradigma v2 | **En curso**: I.2 construida (primera sección v2) |

| Sección | Bocetos | Construcción |
|---|---|---|
| I.1 Componentes conexas | listos | construida (revisiones v2 pendientes en `TAREAS.md`) |
| I.2 Curvas en el plano | listos (paradigma v2) | **construida** (2026-10-08): P0, P1 y P2; 1.299 palabras visibles |
| I.3 Nudos y enlaces | pendiente | — |

## 5. Próximos pasos

1. Cowork: sección I.3 (*Knots and Links*) con el paradigma v2.
2. Más adelante: revisiones v2 de I.1 (`TAREAS.md`), incluida la migración a la carcasa común de
   gadgets y el desborde horizontal en el celular.

## 6. Registro de decisiones

| Fecha | Decisión |
|---|---|
| 2026-10-03 | Flujo con dos clones sincronizados por GitHub; ramas `bocetos` (Cowork) y `main` (Claude Code); propiedad de carpetas para evitar conflictos |
| 2026-10-03 | Repo público; token fine-grained para el push de Cowork |
| 2026-10-05 | Filosofía pedagógica fijada en `FILOSOFIA.md` |
| 2026-10-05 | Los documentos de proyecto que escribe Cowork viven en `bocetos/_proyecto/` |
| 2026-10-05 | Cada sección produce en `bocetos/`: `diseccion.md`, `spec.md` y `prototipos/` |
| 2026-10-07 | Fase 1 cerrada. Convenciones de Claude Code: `tcomp` con índices 0..n-1; paleta propia sobre cosmo en `assets/estilo.css`; piezas como módulos JS testeados con Node; notebooks publicados como export estático |
| 2026-10-07 | **Paradigma v2** (visualization-first, gadgets, lentes, presupuesto de texto): `FILOSOFIA.md` §6-11. I.1 queda como está; sus mejoras van a `TAREAS.md` |
| 2026-10-07 | Errata detectada en el libro (p. 12, regla de triangulación); se usa la regla clásica corregida |
| 2026-10-08 | I.2 construida. Carcasa común de gadgets en `assets/js/gadget/`. Dependencias de desarrollo del proyecto: shapely, mapbox-earcut, hypothesis (Python); robust-predicates, earcut (Node). MathJax 4 con `typeset` sincrónico; scrollytelling con listener de scroll nativo (sin librería); paleta ampliada con `--tc-c8` y `--tc-c9` |
| 2026-10-08 | Errata de la p. 12 confirmada por Claude Code (~1 de cada 200 triangulaciones con la regla del libro) |
