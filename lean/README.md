# TComp (Lean 4 + Mathlib)

Formalizaciones selectas de *Computational Topology* (Edelsbrunner y Harer). Lean se usa de
forma selectiva: resultados accesibles y valiosos, no el libro entero.

| Archivo | Contenido |
|---|---|
| `TComp/Grafos.lean` | Sección I.1: apretones de manos y árboles (vía Mathlib); Proposición 1, conexo ⟺ sin separación, con prueba propia; el certificado de desconexión del ejemplo 1 |
| `TComp/Curvas.lean` | Sección I.2: si cada término de una lista vale ±1, la suma ≡ la longitud (mod 2); es decir, paridad ≡ número de vueltas (mod 2) |

## Uso

```bash
cd lean
lake exe cache get   # la primera vez: descarga Mathlib precompilada (varios GB)
lake build           # verifica todas las pruebas
```

Para editar con la extensión de Lean de VS Code, abrí la carpeta `lean/` como workspace propio
(`code lean`): la extensión espera el `lakefile` en la raíz.
