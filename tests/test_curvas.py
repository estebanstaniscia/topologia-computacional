"""Tests de tcomp.curvas: las afirmaciones de la sección I.2, verificadas.

Referencias: shapely (paridad), mapbox-earcut (triangulación) e hypothesis
(cruces ≡ vueltas mod 2 para curvas y puntos arbitrarios).
"""

import math
import random
from fractions import Fraction

import mapbox_earcut
import numpy as np
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from shapely.geometry import Point, Polygon

from tcomp.curvas import (
    CONTRAEJEMPLO_LIBRO,
    antihorario,
    arbol_dual,
    area_con_signo,
    autointersecciones,
    camino_dual,
    cruces,
    diagonal,
    en_triangulo,
    es_diagonal,
    es_simple,
    guardias,
    orejas,
    orient,
    orient_perturbado,
    paridad,
    poligono_desenredado,
    poligono_estrella,
    posicion_general,
    sobre_el_poligono,
    tres_coloreo,
    triangular,
    vueltas_por_angulos,
    vueltas_por_cruces,
)


def poligonos_simples(semilla, cuantos, tam=(3, 25), general=False):
    """Polígonos simples antihorarios, mitad estrellados y mitad «desenredados»."""
    rng = random.Random(semilla)
    k = 0
    while cuantos > 0:
        gen = poligono_estrella if k % 2 else poligono_desenredado
        k += 1
        P = gen(rng.randint(*tam), rng)
        if len(set(P)) < len(P) or not es_simple(P) or area_con_signo(P) == 0:
            continue
        if general and not posicion_general(P):
            continue
        cuantos -= 1
        yield antihorario(P), rng


def anillo(n, f):
    return [f(2 * math.pi * k / n) for k in range(n)]


LIMACON = anillo(
    120,
    lambda t: (
        round(100 * (0.5 + math.cos(t)) * math.cos(t)),
        round(100 * (0.5 + math.cos(t)) * math.sin(t)),
    ),
)
OCHO = anillo(120, lambda t: (round(100 * math.sin(t)), round(60 * math.sin(2 * t))))
FLOR = anillo(
    240,
    lambda t: (
        round(150 * math.cos(t) + 95 * math.cos(4 * t)),
        round(150 * math.sin(t) - 95 * math.sin(4 * t)),
    ),
)


# ------------------------------------------------------------------ orientación


def test_determinante_del_libro():
    assert orient((0, 0), (1, 0), (0, 1)) > 0  # giro a izquierda
    assert orient((0, 0), (0, 1), (1, 0)) < 0
    assert orient((0, 0), (1, 1), (2, 2)) == 0


def test_determinante_es_el_doble_del_area():
    rng = random.Random(1)
    for _ in range(200):
        x, a, b = [(rng.randint(-50, 50), rng.randint(-50, 50)) for _ in range(3)]
        assert orient(x, a, b) == 2 * area_con_signo([x, a, b])


def test_perturbacion_rompe_los_empates():
    # x sobre la recta ab: decide el término ε₂(b₁ − a₁)
    assert orient_perturbado((0, 0), (-1, 0), (1, 0)) == 1
    assert orient_perturbado((0, 0), (1, 0), (-1, 0)) == -1
    # x alineado en vertical: decide ε₁(a₂ − b₂)
    assert orient_perturbado((0, 0), (0, 1), (0, 2)) == -1
    assert orient_perturbado((0, 0), (0, 2), (0, 1)) == 1


# ------------------------------------------------------------ paridad y vueltas


def test_paridad_y_vueltas_en_poligonos_simples_con_casos_degenerados():
    """W por cruces == W por ángulos, W ∈ {0, 1} y paridad ≡ W (mod 2)."""
    probados = 0
    for P, rng in poligonos_simples(3, 200):
        for _ in range(30):
            # puntos enteros, muchos a la altura de un vértice: rayo por vértices y aristas
            x = (
                rng.randint(-110, 110),
                rng.choice([v[1] for v in P] + [rng.randint(-110, 110)]),
            )
            if sobre_el_poligono(x, P):
                continue
            w_c, w_a = vueltas_por_cruces(x, P), vueltas_por_angulos(x, P)
            assert w_c == w_a
            assert w_c in (0, 1)
            assert cruces(x, P) % 2 == w_c % 2
            probados += 1
    assert probados > 3000


def test_paridad_contra_shapely():
    for P, rng in poligonos_simples(5, 150):
        forma = Polygon(P)
        for _ in range(20):
            # puntos genéricos (no enteros) para que shapely no tenga casos de borde
            x = (rng.uniform(-110, 110), rng.uniform(-110, 110))
            esperado = "adentro" if forma.contains(Point(x)) else "afuera"
            assert paridad(x, P) == esperado


def test_sobre_el_borde():
    cuadrado = [(0, 0), (4, 0), (4, 4), (0, 4)]
    assert paridad((2, 0), cuadrado) == "sobre"
    assert paridad((4, 4), cuadrado) == "sobre"
    assert paridad((2, 2), cuadrado) == "adentro"
    assert paridad((5, 2), cuadrado) == "afuera"


@pytest.mark.parametrize(
    ("x", "w"),
    [((90, 0), 1), ((20, 0), 2), ((-200, 0), 0), ((60, 40), 1), ((-30, 5), 0)],
)
def test_limacon_tiene_un_lazo_con_w_2(x, w):
    assert vueltas_por_cruces(x, LIMACON) == vueltas_por_angulos(x, LIMACON) == w
    assert cruces(x, LIMACON) % 2 == w % 2


def test_ocho_tiene_w_mas_uno_y_menos_uno():
    assert {
        vueltas_por_cruces((50, 10), OCHO),
        vueltas_por_cruces((-50, 10), OCHO),
    } == {1, -1}


def test_flor_y_curvas_no_simples_coinciden_por_los_dos_caminos():
    rng = random.Random(9)
    valores = set()
    for _ in range(400):
        x = (rng.uniform(-260, 260), rng.uniform(-260, 260))
        w = vueltas_por_cruces(x, FLOR)
        assert w == vueltas_por_angulos(x, FLOR)
        assert cruces(x, FLOR) % 2 == w % 2
        valores.add(w)
    assert {0, 1, 2}.issubset(valores) or {-1, 0, 1}.issubset(valores)
    assert not es_simple(FLOR) and autointersecciones(FLOR)


def test_invertir_la_orientacion_cambia_el_signo_de_w():
    for x in [(20, 0), (90, 0), (-30, 5)]:
        assert vueltas_por_cruces(x, LIMACON[::-1]) == -vueltas_por_cruces(x, LIMACON)


@settings(max_examples=300, deadline=None)
@given(
    st.lists(
        st.tuples(st.integers(-30, 30), st.integers(-30, 30)), min_size=3, max_size=12
    ),
    st.tuples(st.integers(-35, 35), st.integers(-35, 35)),
)
def test_cruces_congruente_con_vueltas_mod_2(P, x):
    """Para CUALQUIER curva poligonal (simple o no) y punto fuera de ella."""
    if sobre_el_poligono(x, P):
        return
    w = vueltas_por_cruces(x, P)
    assert cruces(x, P) % 2 == w % 2
    assert w == vueltas_por_angulos(x, P)


# ------------------------------------------------------------------ triangulación


def test_triangulacion_n_menos_2_y_dual_arbol_con_dos_orejas():
    hechos = 0
    for P, _ in poligonos_simples(7, 400, tam=(3, 30), general=True):
        n = len(P)
        T, D = triangular(P)
        assert len(T) == n - 2 and len(D) == n - 3
        assert all(es_diagonal(P, i, j) for i, j in D)
        assert sum(abs(area_con_signo([P[i] for i in t])) for t in T) == area_con_signo(
            P
        )
        arcos = arbol_dual(T)
        assert len(arcos) == len(T) - 1
        assert len(camino_dual(T, arcos, 0, len(T) - 1)) >= 1  # conexo: hay camino
        if n >= 4:
            assert len(orejas(T, arcos)) >= 2  # ¡dos orejas!, no solo una
        hechos += 1
    assert hechos == 400


def test_triangulacion_contra_mapbox_earcut():
    for P, _ in poligonos_simples(11, 150, general=True):
        T, _ = triangular(P)
        v = np.array(P, dtype=np.float64)
        ref = mapbox_earcut.triangulate_float64(v, np.array([len(P)], dtype=np.uint32))
        tris_ref = ref.reshape(-1, 3)
        assert len(tris_ref) == len(T)
        area_ref = sum(abs(area_con_signo([P[i] for i in t])) for t in tris_ref)
        assert area_ref == sum(abs(area_con_signo([P[i] for i in t])) for t in T)


def test_errata_del_libro():
    """La regla del libro (el de más a la izquierda en abc) falla; la corregida no."""
    C = CONTRAEJEMPLO_LIBRO
    assert es_simple(C) and area_con_signo(C) > 0 and posicion_general(C)
    i, j = diagonal(C, list(range(5)), "libro")
    assert not es_diagonal(C, i, j)
    i, j = diagonal(C, list(range(5)), "corregida")
    assert es_diagonal(C, i, j)


def test_la_regla_corregida_nunca_falla_y_la_del_libro_a_veces():
    """En triangulaciones completas: la del libro falla en algún paso de la recursión."""
    fallas = {"libro": 0, "corregida": 0}
    for P, _ in poligonos_simples(13, 1500, tam=(4, 30), general=True):
        for regla in fallas:
            _, D = triangular(P, regla)
            if not all(es_diagonal(P, i, j) for i, j in D):
                fallas[regla] += 1
    assert fallas["corregida"] == 0
    assert (
        fallas["libro"] > 0
    )  # del orden de 1 cada 200 polígonos, como en la disección


def test_pasos_de_la_prueba():
    P = antihorario(CONTRAEJEMPLO_LIBRO)
    T, _, pasos = triangular(P, pasos=True)
    primero = pasos[0]
    assert P[primero["b"]] == (-16, 46)
    assert sorted(P[v] for v in primero["adentro"]) == [(21, -47), (28, -48)]
    assert P[primero["diagonal"][1]] == (28, -48) or P[primero["diagonal"][0]] == (
        28,
        -48,
    )
    assert sum(1 for p in pasos if "triangulo" in p) == len(T) == 3


def test_en_triangulo():
    assert en_triangulo((1, 1), (0, 0), (4, 0), (0, 4))
    assert en_triangulo((0, 0), (0, 0), (4, 0), (0, 4))  # cerrado
    assert not en_triangulo((3, 3), (0, 0), (4, 0), (0, 4))


# --------------------------------------------------------------- galería de arte


def test_tres_coloreo_y_guardias_de_fisk():
    for P, _ in poligonos_simples(17, 200, tam=(3, 30), general=True):
        n = len(P)
        T, _ = triangular(P)
        color = tres_coloreo(n, T)
        assert all(sorted(color[v] for v in t) == [0, 1, 2] for t in T)
        G = guardias(P)
        assert len(G) <= n // 3
        # cada triángulo tiene un guardia en un vértice: lo ve entero (es convexo)
        assert all(any(v in G for v in t) for t in T)


def test_area_exacta_con_fracciones():
    P = [
        (Fraction(0), Fraction(0)),
        (Fraction(1, 3), Fraction(0)),
        (Fraction(0), Fraction(1, 7)),
    ]
    assert area_con_signo(P) == Fraction(1, 42)
