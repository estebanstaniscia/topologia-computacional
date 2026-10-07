/-
Sección I.2 de Edelsbrunner y Harer: el lema algebraico del hilo central (spec §8).

El algoritmo de paridad y el número de vueltas recorren las mismas aristas: cada cruce
del rayo aporta un signo `s = ±1`. El número de vueltas es la suma de los signos; la
paridad, la cantidad de cruces módulo 2. Como `±1 ≡ 1 (mod 2)`, las dos cuentas tienen la
misma paridad: la paridad es la sombra módulo 2 del número de vueltas.
-/
import Mathlib

namespace TComp

/-- Si cada término de una lista de enteros vale `1` o `-1`, la suma es congruente con la
longitud módulo 2. -/
theorem suma_signos_congruente_longitud :
    ∀ (l : List ℤ), (∀ x ∈ l, x = 1 ∨ x = -1) → l.sum ≡ (l.length : ℤ) [ZMOD 2]
  | [], _ => by simp
  | a :: t, h => by
    have ha : a ≡ 1 [ZMOD 2] := by
      rcases h a (by simp) with rfl | rfl
      · rfl
      · decide
    have ht := suma_signos_congruente_longitud t (fun x hx => h x (by simp [hx]))
    simp only [List.sum_cons, List.length_cons, Nat.cast_add, Nat.cast_one]
    calc a + t.sum ≡ 1 + (t.length : ℤ) [ZMOD 2] := ha.add ht
      _ = (t.length : ℤ) + 1 := by ring

/-- **Paridad ≡ número de vueltas (mod 2).** Con los signos de los cruces del rayo:
`W = Σ signos` y `cruces = cantidad de signos`. -/
theorem paridad_es_vueltas_mod_dos (signos : List ℤ) (h : ∀ s ∈ signos, s = 1 ∨ s = -1) :
    (signos.length : ℤ) % 2 = signos.sum % 2 :=
  (suma_signos_congruente_longitud signos h).symm

/-- Ejemplos calculados. El limaçon visto desde su lazo interior: dos cruces positivos,
`W = 2` y paridad par. El ocho visto desde un lóbulo, con un rayo que corta tres veces
(`+1, +1, −1`): `W = 1` y paridad impar. -/
example : ([1, 1] : List ℤ).sum = 2 ∧ ([1, 1] : List ℤ).length % 2 = 0 := by decide

example : ([1, 1, -1] : List ℤ).sum = 1 ∧ ([1, 1, -1] : List ℤ).length % 2 = 1 := by decide

end TComp
