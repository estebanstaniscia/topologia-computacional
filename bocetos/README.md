# bocetos/ — Zona de trabajo de Claude (Cowork)

Esta carpeta es el **taller de diseño** del proyecto. Acá Claude, trabajando desde
la app de escritorio (Cowork) junto con Esteban, deja el material de cada sección
del libro ya estudiado, discutido y "masticado": disecciones, especificaciones de
productos y prototipos. Claude Code, en WSL, toma este material y construye la
versión pulida en el resto del repositorio.

## Los dos espacios de trabajo

| | Cowork (app de escritorio, Windows) | Claude Code (VS Code, WSL2) |
|---|---|---|
| Rol | Estudio, diseño, borradores | Construcción y publicación |
| Rama | `bocetos` | `main` |
| Escribe en | **solo** `bocetos/` | todo el repo **excepto** `bocetos/` |
| Lee | todo el repo | todo el repo, incluido `bocetos/` |
| Hace push a GitHub | sí, a la rama `bocetos` | sí, a `main` |

**Regla de propiedad de carpetas:** Cowork solo escribe en `bocetos/` y Claude
Code nunca modifica `bocetos/`. Como cada uno escribe en archivos distintos, las
fusiones (merges) entre ramas nunca generan conflictos.

## El ciclo

```
 Cowork (rama bocetos)                     Claude Code (rama main)
 ─────────────────────                     ───────────────────────
 1. git pull + merge de origin/main  ◄──── (ve lo último construido)
 2. estudio de la sección X.Y
 3. escribe bocetos/capXX/X-Y-.../
 4. commit + push a origin/bocetos ──────► 5. git fetch && git merge origin/bocetos
                                           6. construye según la spec
                                           7. commit + push a origin/main
                                              (GitHub Actions publica el sitio)
```

## Estructura de esta carpeta

```
bocetos/
├── README.md                       # este archivo (protocolo)
├── _proyecto/                      # documentos rectores del proyecto, escritos por Cowork
│   ├── FILOSOFIA.md                #   manifiesto pedagógico: manda sobre todo lo demás
│   └── ESTADO.md                   #   dónde está cada cosa, cómo retomar, decisiones
└── capNN-tema/
    └── N-M-nombre-seccion/
        ├── diseccion.md            # la sección desarmada: intuición, definiciones,
        │                           #   resultados, demostraciones desarrolladas, ejemplos
        ├── spec.md                 # especificación de los productos a construir
        └── prototipos/             # código de prueba (Python, HTML, etc.), opcional
```

## Formato de `spec.md`

Cada spec es un contrato entre el diseño y la construcción:

1. **Sección del libro** y objetivo de comprensión (qué tiene que poder explicar Esteban al final).
2. **Entregables por capa**: qué archivo, en qué carpeta del repo final, con qué herramienta
   (Quarto, `src/tcomp/`, tests, Manim, OJS, marimo, Lean).
3. **Detalle de cada entregable**: comportamiento, parámetros, casos de prueba, referencias.
4. **Criterio de terminado** verificable.
5. **Estado**: `borrador` → `listo para construir` → `construido` (Claude Code actualiza
   este estado en su resumen de commit, no editando el archivo).

## Instrucciones para Claude Code

- **Antes de construir cualquier sección, leé `bocetos/_proyecto/FILOSOFIA.md`.** Es el
  criterio de calidad de todo el producto.

- Para traer los bocetos: `git fetch origin && git merge origin/bocetos` (estando en `main`).
- Construí solo lo que esté marcado `listo para construir` en `spec.md`.
- La `diseccion.md` es la fuente para escribir el `.qmd` del capítulo: reformulala y
  pulila en el formato del sitio; no la copies tal cual si hace falta adaptarla.
- No edites archivos dentro de `bocetos/`. Si una spec tiene un error, avisale a Esteban
  o dejalo anotado en el mensaje de commit.
