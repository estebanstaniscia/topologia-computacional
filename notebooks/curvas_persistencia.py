import marimo

__generated_with = "0.25.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import math

    import marimo as mo
    import matplotlib.pyplot as plt
    import numpy as np
    from ripser import ripser

    from tcomp.graficos import tema

    return math, mo, np, plt, ripser, tema


@app.cell
def _(mo):
    mo.md(r"""
    # Los datos tienen forma: de la curva a la persistencia

    Laboratorio de la sección I.2 (anticipo del capítulo VII). Tomamos puntos con ruido sobre
    una curva cerrada y calculamos la **homología persistente en dimensión 1** con `ripser`.
    Nadie les dice a los puntos que vienen de una curva, y sin embargo el código de barras lo
    sabe: cada lazo de la curva aparece como **una barra larga**. El número de vueltas mide el
    «rodear» desde adentro (parado en un punto); la persistencia lo detecta desde afuera, solo
    con las distancias entre los datos.
    """)
    return


@app.cell
def _(math, np):
    def curva(nombre, t):
        """Puntos de la curva en los parámetros t ∈ [0, 1)."""
        a = 2 * math.pi * np.asarray(t)
        if nombre == "círculo":
            return np.c_[np.cos(a), np.sin(a)]
        if nombre == "ocho":
            return np.c_[1.4 * np.sin(a), 0.9 * np.sin(2 * a)]
        if nombre == "limaçon":
            r = 0.5 + np.cos(a)
            return np.c_[r * np.cos(a), r * np.sin(a)]
        if nombre == "flor":
            return np.c_[
                np.cos(a) + 0.63 * np.cos(4 * a), np.sin(a) - 0.63 * np.sin(4 * a)
            ]
        raise ValueError(nombre)

    def muestra(nombre, n, ruido, semilla=0):
        rng = np.random.default_rng(semilla)
        return curva(nombre, rng.uniform(0, 1, n)) + rng.normal(0, ruido, (n, 2))

    CURVAS = ["círculo", "ocho", "limaçon", "flor"]
    return CURVAS, curva, muestra


@app.cell
def _(CURVAS, mo):
    eleccion = mo.ui.dropdown(CURVAS, value="ocho", label="Curva")
    n = mo.ui.slider(40, 400, value=160, step=20, label="Puntos", show_value=True)
    ruido = mo.ui.slider(
        0.0, 0.25, value=0.05, step=0.01, label="Ruido", show_value=True
    )
    mo.hstack([eleccion, n, ruido], justify="start", gap=2)
    return eleccion, n, ruido


@app.cell
def _(eleccion, muestra, n, ripser, ruido):
    X = muestra(eleccion.value, n.value, ruido.value)
    h1 = ripser(X, maxdim=1)["dgms"][1]
    persistencias = sorted((m - b for b, m in h1), reverse=True)
    return X, h1, persistencias


@app.cell
def _(X, curva, eleccion, h1, np, plt, tema):
    with tema("claro") as _p:
        _fig, (_a, _b, _c) = plt.subplots(1, 3, figsize=(12, 3.8), layout="constrained")
        _t = np.linspace(0, 1, 400)
        _a.plot(*curva(eleccion.value, _t).T, color=_p["linea"], lw=1)
        _a.scatter(*X.T, s=8, color=_p["acento"])
        _a.set_aspect("equal")
        _a.set_title(f"{eleccion.value}: los datos")
        _a.axis("off")
        _tope = max([m for _, m in h1] + [0.1]) * 1.1
        _b.plot([0, _tope], [0, _tope], color=_p["linea"], lw=1)
        _b.scatter(h1[:, 0], h1[:, 1], s=22, color=_p["seco"])
        _b.set_xlabel("nacimiento")
        _b.set_ylabel("muerte")
        _b.set_title("Diagrama de persistencia H₁")
        for _k, (_nac, _mue) in enumerate(
            sorted(h1.tolist(), key=lambda par: par[1] - par[0])
        ):
            _c.plot([_nac, _mue], [_k, _k], color=_p["seco"], lw=2)
        _c.set_yticks([])
        _c.set_xlabel("ε")
        _c.set_title("Código de barras H₁")
    _fig
    return


@app.cell
def _(eleccion, mo, persistencias):
    _largas = [p for p in persistencias if p > 0.1]
    mo.md(
        f"**{eleccion.value}:** {len(persistencias)} barras en H₁; las más largas miden "
        f"{', '.join(f'{p:.2f}' for p in persistencias[:3])}. "
        f"Con el umbral 0.1, hay **{len(_largas)} barra{'s' if len(_largas) != 1 else ''} larga"
        f"{'s' if len(_largas) != 1 else ''}**: "
        + {
            "círculo": "un lazo.",
            "ocho": "los dos lóbulos.",
            "limaçon": "el lazo grande y el chico (de distinta longitud).",
            "flor": "los lazos de la flor (los más chicos pueden confundirse con el ruido).",
        }[eleccion.value]
    )
    return


@app.cell
def _(CURVAS, muestra, plt, ripser, tema):
    # Panorama: las cuatro curvas lado a lado (no depende de los controles)
    with tema("claro") as _p:
        _fig, _ejes = plt.subplots(2, 4, figsize=(13, 5.6), layout="constrained")
        for _col, _nombre in enumerate(CURVAS):
            _X = muestra(_nombre, 200, 0.04, semilla=_col)
            _h1 = ripser(_X, maxdim=1)["dgms"][1]
            _ejes[0, _col].scatter(*_X.T, s=6, color=_p["acento"])
            _ejes[0, _col].set_aspect("equal")
            _ejes[0, _col].axis("off")
            _ejes[0, _col].set_title(_nombre)
            _barras = sorted(_h1.tolist(), key=lambda par: par[1] - par[0])
            for _k, (_nac, _mue) in enumerate(_barras):
                _ejes[1, _col].plot([_nac, _mue], [_k, _k], color=_p["seco"], lw=2)
            _ejes[1, _col].set_yticks([])
            _ejes[1, _col].set_xlabel("ε")
    _fig
    return


@app.cell
def _(mo):
    mo.md(r"""
    ## Qué mirar

    - **Círculo:** una barra larga, y muchas cortas que son ruido. Subí el ruido: la barra larga
      se acorta pero sobrevive mucho más que las otras. Es el **teorema de estabilidad** del
      capítulo VIII en acción.
    - **Ocho:** dos barras largas, una por lóbulo. Desde un punto de un lóbulo, el número de
      vueltas es $+1$; desde el otro, $-1$. La persistencia no ve el signo: ve los dos lazos.
    - **Limaçon:** dos barras de **distinta** longitud: el lazo grande y el chico. Desde adentro
      del chico, el número de vueltas es $2$; la persistencia, en cambio, cuenta dos lazos
      distintos.
    - Bajá los puntos a 40: con pocos datos, la forma se pierde. Cuántos datos hacen falta para
      «ver» un lazo es una pregunta central del análisis topológico de datos.
    """)
    return


if __name__ == "__main__":
    app.run()
