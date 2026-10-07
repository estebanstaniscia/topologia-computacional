# Tareas y revisiones pendientes

> Registro de mejoras para el futuro. Lo mantiene Cowork; Claude Code lo lee pero no lo edita.
> Cada ítem dice **qué**, **por qué** y, si aplica, **qué patrón de gadget** usar
> (ver `FILOSOFIA.md`, sección 10). Al resolver un ítem, se marca con la fecha y el commit.

## Sección I.1: revisión hacia el paradigma v2

Notas de Esteban del 7 de octubre de 2026, al revisar el producto terminado. **No se tocan
hasta que Esteban lo indique.**

### Diagnóstico general

- [ ] **Exceso de texto, redundante con el libro** (la página tiene ~9.700 palabras). Reemplazar
      las definiciones transcriptas por fichas "Libro, p. X" y dejar el texto propio solo para
      aportes (interpretaciones, demostraciones ★, ejemplos inusuales, puentes). Ver presupuesto
      de texto en `FILOSOFIA.md` §9.
- [ ] Reorganizar la página con la arquitectura v2: gadget estrella arriba, estaciones,
      "Profundizar" desplegable.
- [ ] Representar sistemáticamente las **visiones** (matemático, programador, computacional,
      físico) con el patrón **Lentes** en cada gadget, no solo en el texto.
- [ ] Migrar las seis piezas a la **carcasa común** de gadgets que se construya en I.2.

### Ítems concretos

| # | Punto de la disección | Mejora pedida | Patrón sugerido |
|---|---|---|---|
| 1 | 1.3 Borrado de bucles | El "cortar rulos" como **gráfico dinámico**: un camino que se recorre y cada vez que repite un vértice el rulo se desprende animado | Lienzo + Demostración |
| 2 | 1.3 Loop-erased random walk | Un **cuadro emergente** (popover) con un LERW en vivo: caminata aleatoria en una grilla, borrado de bucles en tiempo real, y el árbol que generan (algoritmo de Wilson) | Popover + Faro |
| 3 | 1.3 Espacio métrico | Algo interesante con la **métrica de grafo** como puente discreto ↔ continuo: bolas $B(v, r)$ en el grafo que crecen; el mismo grafo realizado en el plano con bolas euclídeas; comparar | Lienzo + Paisaje |
| 4 | 1.4 Componentes como clases de equivalencia | Visualizar la **relación de equivalencia**: matriz de alcanzabilidad que, al reordenar los vértices por componente, se vuelve **diagonal por bloques**; animar reflexividad, simetría, transitividad (cierre transitivo que "llena" los bloques) | Lienzo + Demostración |
| 5 | 1.5 Árboles, ciclos y cortes | Jugar más con la **dualidad ciclo fundamental / corte fundamental** (agregar arista → ciclo; quitar arista → corte), y con la **fórmula de Cayley** $n^{n-2}$: enumerar y animar los 125 árboles de $K_5$; biyección de **Prüfer** como gadget | Circuito + Demostración |
| 6 | 1.6 Búsqueda en anchura | **Profundizar en BFS**: pseudocódigo, implementaciones en varios lenguajes (Python, C++, Rust, Haskell) con pestañas, aplicaciones (redes sociales, laberintos, rutas, componentes en imágenes) y más visualizaciones (cola en vivo, frente de onda) | Lentes (Programador) + Lienzo |
| 7 | 2.2 Abierto = predicado semidecidible | **Visualizar** la mirada del programador: una "máquina de observación" que pide dígitos de un real con precisión creciente y se detiene cuando confirma la propiedad (o nunca); contrastar $x < 1$ (se confirma) con $x = 0$ (nunca); la intersección infinita como una cola de pruebas que no termina | Microscopio + Faro |
| 8 | 2.4 Sorgenfrey | **Visualizar** el contraejemplo y la conclusión "la conexidad es propiedad del espacio, no del conjunto": la misma recta con dos topologías lado a lado, el intervalo $[0,1)$ "clopen" que corta una y no la otra | Bisturí + Lentes |
| 9 | General | **Visualizaciones para cada punto de vista** (programador, computacional, matemático): llevar el patrón Lentes a cada definición importante | Lentes |
| 10 | 3.7 El peine | Mantener (a Esteban le encantó cómo "rompe todo"); evaluar versión 3D o con zoom semántico más profundo | Microscopio |
| 11 | 2.4 Bases | Mantener el anidamiento de formas (muy bien valorado) como modelo de calidad | — |

### Técnicos (detectados por Cowork)

- [ ] En un navegador sin acceso a CDN, las piezas OJS muestran "unable to load module" y las
      fórmulas no se renderizan. Evaluar **empaquetar localmente** las dependencias críticas
      (MathJax, D3, runtime de OJS) para que el sitio funcione sin conexión o en redes
      restringidas.
- [ ] Verificar que los videos `.mp4` usen un códec compatible con todos los navegadores
      (H.264 + AAC, `faststart`).

## Sección I.2

- [ ] Construir según `bocetos/cap01-grafos/1-2-curvas-en-el-plano/spec.md`.
- [ ] Reportar la **errata** de la p. 12 (regla "el vértice de más a la izquierda") a la fe de
      erratas del libro, si existe un canal. Contraejemplo verificado en
      `prototipos/curvas.py` (`CONTRAEJEMPLO_LIBRO`).

## Transversales

- [ ] **Carcasa común de gadgets** (Web Components): construirla en I.2 y migrar I.1.
- [ ] Enlaces permanentes al estado de cada gadget (compartir "esta curva con este punto").
- [ ] Modo "estudio" a pantalla completa para el gadget estrella de cada sección.
