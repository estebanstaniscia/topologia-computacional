import marimo

__generated_with = "0.25.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import math
    import random
    from functools import lru_cache

    import marimo as mo
    import matplotlib.pyplot as plt

    from tcomp.graficos import tema
    from tcomp.union_find import ESTRATEGIAS, UnionFind

    NOMBRES = {
        "ingenua": "básica",
        "tamano": "por tamaño",
        "completa": "tamaño + compresión",
    }
    return (
        ESTRATEGIAS,
        NOMBRES,
        UnionFind,
        lru_cache,
        math,
        mo,
        plt,
        random,
        tema,
    )


@app.cell
def _(mo):
    mo.md(r"""
    # Union-find: el costo, medido

    Laboratorio de la sección I.1. Medimos, para las tres estrategias de `tcomp.union_find`,
    cuántos **saltos de puntero** cuestan las operaciones y qué **altura** alcanza el bosque,
    en función de la cantidad de elementos $n$. La teoría predice:

    | Estrategia | Altura máxima | Costo de $m$ operaciones |
    |---|---|---|
    | básica | $n - 1$ | $\Theta(m\,n)$ en el peor caso |
    | por tamaño | $\log_2 n$ | $O(m \log n)$ |
    | tamaño + compresión | $\log_2 n$, y se aplana con el uso | $O(m\,\alpha(n))$ |

    Elegí una secuencia de operaciones y el tamaño máximo; los gráficos están en escala
    log-log, así que **una potencia de $n$ es una recta** y su pendiente es el exponente.
    """)
    return


@app.cell
def _(mo):
    secuencia = mo.ui.dropdown(
        options={
            "Aleatoria: n uniones y n consultas al azar": "aleatoria",
            "Peor caso de la básica: Union(1, k) y n veces Find(1)": "peor",
            "Árbol binomial y n veces Find de la hoja más profunda": "binomial",
        },
        value="Peor caso de la básica: Union(1, k) y n veces Find(1)",
        label="Secuencia",
    )
    exponente = mo.ui.slider(
        6, 13, value=11, label="n máximo = 2^k, k =", show_value=True
    )
    mo.hstack([secuencia, exponente], justify="start", gap=2)
    return exponente, secuencia


@app.cell
def _(ESTRATEGIAS, UnionFind, lru_cache, random):
    @lru_cache(maxsize=None)
    def medir(tipo: str, n: int, estrategia: str) -> tuple[float, int]:
        """(saltos por operación, altura máxima alcanzada) para una secuencia de 2n operaciones."""
        uf = UnionFind(n, estrategia)
        altura = 0
        if tipo == "aleatoria":
            rng = random.Random(n)
            for _ in range(n):
                uf.union(rng.randrange(n), rng.randrange(n))
            altura = uf.altura()
            for _ in range(n):
                uf.find(rng.randrange(n))
        elif tipo == "peor":
            for k in range(1, n):
                uf.union(0, k)
            altura = uf.altura()
            for _ in range(n):
                uf.find(0)
        else:  # binomial: uniones entre árboles de igual tamaño
            paso = 1
            while paso < n:
                for i in range(0, n, 2 * paso):
                    uf.union(i, i + paso)
                paso *= 2
            altura = uf.altura()
            hoja = max(range(n), key=uf.profundidad)
            for _ in range(n):
                uf.find(hoja)
        return uf.saltos / (2 * n), altura

    LIMITE_BASICA = (
        2**12
    )  # la básica es cuadrática en el peor caso: más allá tarda demasiado
    assert ESTRATEGIAS == ("ingenua", "tamano", "completa")
    return LIMITE_BASICA, medir


@app.cell
def _(ESTRATEGIAS, LIMITE_BASICA, exponente, medir, secuencia):
    tamanos = [2**k for k in range(4, exponente.value + 1)]
    resultados = {
        e: [
            (n, *medir(secuencia.value, n, e))
            for n in tamanos
            if e != "ingenua" or n <= LIMITE_BASICA
        ]
        for e in ESTRATEGIAS
    }
    return resultados, tamanos


@app.cell
def _(NOMBRES, math, plt, resultados, tamanos, tema):
    with tema("claro") as _p:
        _fig, (_ax1, _ax2) = plt.subplots(1, 2, figsize=(10, 4), layout="constrained")
        _colores = dict(zip(resultados, _p["categorica"]))
        for _e, _datos in resultados.items():
            _ns = [_f[0] for _f in _datos]
            _ax1.plot(
                _ns,
                [_f[1] for _f in _datos],
                "o-",
                color=_colores[_e],
                label=NOMBRES[_e],
                ms=4,
            )
            _ax2.plot(
                _ns,
                [max(_f[2], 0.5) for _f in _datos],
                "o-",
                color=_colores[_e],
                label=NOMBRES[_e],
                ms=4,
            )
        _ax1.plot(
            tamanos,
            [_n / 4 for _n in tamanos],
            ":",
            color=_p["tenue"],
            label="∝ n (referencia)",
        )
        _ax1.plot(
            tamanos,
            [math.log2(_n) / 2 for _n in tamanos],
            "--",
            color=_p["tenue"],
            label="∝ log₂ n (referencia)",
        )
        _ax2.plot(
            tamanos, [_n - 1 for _n in tamanos], ":", color=_p["tenue"], label="n − 1"
        )
        _ax2.plot(
            tamanos,
            [math.log2(_n) for _n in tamanos],
            "--",
            color=_p["tenue"],
            label="log₂ n",
        )
        for _ax, _titulo in (
            (_ax1, "Saltos de puntero por operación"),
            (_ax2, "Altura máxima del bosque"),
        ):
            _ax.set_xscale("log", base=2)
            _ax.set_yscale("log", base=2)
            _ax.set_xlabel("n")
            _ax.set_title(_titulo)
            _ax.legend(fontsize=8)
    _fig
    return


@app.cell
def _(ESTRATEGIAS, LIMITE_BASICA, NOMBRES, math, medir, plt, tema):
    # Panorama: las tres secuencias lado a lado (no depende de los controles)
    _secuencias = {
        "aleatoria": "Aleatoria",
        "peor": "Peor caso de la básica",
        "binomial": "Árbol binomial",
    }
    _ns = [2**_k for _k in range(4, 12)]
    with tema("claro") as _p:
        _fig, _ejes = plt.subplots(
            1, 3, figsize=(11, 3.4), layout="constrained", sharey=True
        )
        for _ax, (_tipo, _titulo) in zip(_ejes, _secuencias.items()):
            for _e, _color in zip(ESTRATEGIAS, _p["categorica"]):
                _xs = [_n for _n in _ns if _e != "ingenua" or _n <= LIMITE_BASICA]
                _ax.plot(
                    _xs,
                    [medir(_tipo, _n, _e)[0] for _n in _xs],
                    "o-",
                    ms=3,
                    color=_color,
                    label=NOMBRES[_e],
                )
            _ax.plot(
                _ns,
                [math.log2(_n) / 2 for _n in _ns],
                "--",
                color=_p["tenue"],
                lw=1,
                label="∝ log₂ n",
            )
            _ax.set_xscale("log", base=2)
            _ax.set_yscale("log", base=2)
            _ax.set_title(_titulo)
            _ax.set_xlabel("n")
        _ejes[0].set_ylabel("saltos por operación")
        _ejes[0].legend(fontsize=8)
    _fig
    return


@app.cell
def _(NOMBRES, mo, resultados):
    _filas = []
    for _e, _datos in resultados.items():
        for _n, _costo, _altura in _datos:
            _filas.append(
                {
                    "estrategia": NOMBRES[_e],
                    "n": _n,
                    "saltos por operación": round(_costo, 3),
                    "altura": _altura,
                }
            )
    mo.ui.table(
        _filas, selection=None, page_size=30, label="Los números detrás de los gráficos"
    )
    return


@app.cell
def _(mo):
    mo.md(r"""
    ## Qué mirar

    - **Peor caso de la básica:** la curva de saltos de la básica es paralela a la referencia
      $\propto n$: cada `Find(1)` recorre la cadena entera. Las otras dos se quedan planas, y
      la unión por tamaño queda *escondida detrás* de la compresión: `Union(1, k)` cuelga
      siempre al recién llegado de la raíz, así que el árbol nunca pasa de altura 1.
    - **Árbol binomial:** la unión por tamaño alcanza **exactamente** $\log_2 n$ de altura
      (es su peor caso) y cada `Find` desde la hoja cuesta $\log_2 n$; con compresión, la
      primera consulta aplana el camino y las demás cuestan un salto: el costo por operación
      tiende a una constante.
    - **Aleatoria:** en promedio todo es mucho más barato que en el peor caso; aun así la
      compresión gana.

    ## La inversa de Ackermann: una constante en la práctica

    Con la definición de Cormen, Leiserson, Rivest y Stein,
    $A_0(j) = j + 1$ y $A_k(j) = A_{k-1}^{(j+1)}(j)$, y $\alpha(n)$ es el menor $k$ con
    $A_k(1) \ge n$. Calculamos los primeros valores (el quinto ya no entra en ninguna
    computadora):
    """)
    return


@app.cell
def _(mo):
    def A(k: int, j: int) -> int:
        if k == 0:
            return j + 1
        x = j
        for _ in range(j + 1):
            x = A(k - 1, x)
        return x

    _umbrales = [A(_k, 1) for _k in range(4)]
    _rangos = ["n ≤ 2", "n = 3", "4 ≤ n ≤ 7", "8 ≤ n ≤ 2047"]
    _tabla = [
        {"k": _k, "A_k(1)": f"{_u:,}", "α(n) = k para": _r}
        for _k, (_u, _r) in enumerate(zip(_umbrales, _rangos))
    ]
    _tabla.append(
        {"k": 4, "A_k(1)": "≫ 10^600", "α(n) = k para": "todo n que se pueda escribir"}
    )
    assert _umbrales == [2, 3, 7, 2047]
    mo.ui.table(_tabla, selection=None, label="Umbrales de α(n)")
    return


if __name__ == "__main__":
    app.run()
