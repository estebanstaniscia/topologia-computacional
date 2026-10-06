# Estado del proyecto y cómo retomarlo

> **Para cualquier sesión nueva (Cowork o Claude Code):** este archivo resume dónde está cada
> cosa, cómo se trabaja y en qué punto estamos. Leelo junto con `FILOSOFIA.md` (misma
> carpeta), `bocetos/README.md` y `docs/contexto-proyecto.md`.
>
> Última actualización: 5 de octubre de 2026 (Cowork).

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
| 1. Corte vertical: sección I.1 | **Bocetos listos** (`bocetos/cap01-grafos/1-1-componentes-conexas/`); falta la construcción en Claude Code |

## 5. Próximos pasos

1. Claude Code: integrar `FILOSOFIA.md` y `ESTADO.md` en `CLAUDE.md` (referencias) y construir
   la sección I.1 según su `spec.md`.
2. Cowork: seguir con la sección I.2 (*Curves in the Plane*).

## 6. Registro de decisiones

| Fecha | Decisión |
|---|---|
| 2026-10-03 | Flujo con dos clones sincronizados por GitHub; ramas `bocetos` (Cowork) y `main` (Claude Code); propiedad de carpetas para evitar conflictos |
| 2026-10-03 | Repo público; token fine-grained para el push de Cowork |
| 2026-10-05 | Filosofía pedagógica fijada en `FILOSOFIA.md` |
| 2026-10-05 | Los documentos de proyecto que escribe Cowork viven en `bocetos/_proyecto/` |
| 2026-10-05 | Cada sección produce en `bocetos/`: `diseccion.md`, `spec.md` y `prototipos/` |
