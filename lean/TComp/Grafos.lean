/-
Sección I.1 de Edelsbrunner y Harer: formalizaciones selectas (spec 3.12).

1. El lema de los apretones de manos y «un árbol con n vértices tiene n − 1 aristas»,
   tomados de Mathlib: primer contacto con la herramienta.
2. La Proposición 1 (conexo ⟺ sin separación), con prueba PROPIA. Sigue las dos
   direcciones de la página:
   (⇒) el «primer cruce» de un camino es una inducción sobre el camino;
   (⇐) U = los vértices alcanzables desde u; si no fuera todo, sería una separación.
-/
import Mathlib

namespace TComp

open SimpleGraph Finset

variable {V : Type*} (G : SimpleGraph V)

/-! ## Lo que ya está en Mathlib -/

/-- **Apretones de manos.** La suma de los grados es el doble de la cantidad de aristas:
cada arista aporta un apretón a cada uno de sus dos extremos. -/
theorem apretones_de_manos [Fintype V] [DecidableRel G.Adj] :
    ∑ v, G.degree v = 2 * #G.edgeFinset :=
  G.sum_degrees_eq_twice_card_edges

/-- **Un árbol con `n` vértices tiene `n − 1` aristas** (la cuenta del albañil, §4.2). -/
theorem arbol_aristas [Fintype V] [Fintype G.edgeSet] (h : G.IsTree) :
    #G.edgeFinset + 1 = Fintype.card V :=
  h.card_edgeFinset

/-! ## Proposición 1, con prueba propia -/

/-- Una **separación** de un grafo: un conjunto de vértices `U`, no vacío y con complemento
no vacío, tal que ninguna arista cruza (los extremos de toda arista están los dos en `U` o
los dos fuera). -/
def EsSeparacion (U : Set V) : Prop :=
  U.Nonempty ∧ Uᶜ.Nonempty ∧ ∀ ⦃u v⦄, G.Adj u v → (u ∈ U ↔ v ∈ U)

variable {G}

/-- El corazón de (⇒): un camino que empieza en `U` termina en `U`, si ninguna arista cruza.
Es el argumento del «primer cruce», hecho por inducción sobre el camino. -/
theorem mem_de_camino {U : Set V} (hU : ∀ ⦃u v⦄, G.Adj u v → (u ∈ U ↔ v ∈ U)) :
    ∀ {u v : V} (_ : G.Walk u v), u ∈ U → v ∈ U
  | _, _, .nil, h => h
  | _, _, .cons hadj p, h => mem_de_camino hU p ((hU hadj).1 h)

/-- **Proposición 1.** Hay un camino entre todo par de vértices si y solo si no existe
ninguna separación. (En Mathlib, «hay un camino entre todo par» es `Preconnected`.) -/
theorem preconectado_iff_sin_separacion :
    G.Preconnected ↔ ¬ ∃ U : Set V, EsSeparacion G U := by
  constructor
  · -- (⇒) un camino de `u ∈ U` a `w ∉ U` tendría que cruzar el corte
    rintro hconexo ⟨U, ⟨u, hu⟩, ⟨w, hw⟩, hU⟩
    obtain ⟨p⟩ := hconexo u w
    exact hw (mem_de_camino hU p hu)
  · -- (⇐) los alcanzables desde `u` forman un conjunto sin aristas que crucen
    intro hsin u v
    by_contra hnv
    apply hsin
    refine ⟨{x | G.Reachable u x}, ⟨u, Reachable.refl u⟩, ⟨v, hnv⟩, ?_⟩
    intro a b hab
    exact ⟨fun ha => ha.trans hab.reachable, fun hb => hb.trans hab.reachable.symm⟩

/-- La versión con `Connected` de Mathlib, que además exige que haya algún vértice. -/
theorem conexo_iff_sin_separacion :
    G.Connected ↔ Nonempty V ∧ ¬ ∃ U : Set V, EsSeparacion G U := by
  rw [connected_iff, preconectado_iff_sin_separacion, and_comm]

/-! ## Un ejemplo calculado: el grafo del Ejemplo 1 sin la arista (3,4) es desconexo -/

/-- El grafo del ejemplo 1 sin la arista (3, 4): el triángulo 1-2-3 y el vértice 4 suelto
(con los vértices `0..3` de la librería). -/
def triangulo : SimpleGraph (Fin 4) :=
  SimpleGraph.fromEdgeSet {s(0, 1), s(1, 2), s(0, 2)}

/-- Su certificado de desconexión: `U = {0, 1, 2}` es una separación (como devuelve
`tcomp.conexidad.certificado`). -/
theorem triangulo_tiene_separacion : EsSeparacion triangulo ({0, 1, 2} : Set (Fin 4)) := by
  refine ⟨⟨0, by simp⟩, ⟨3, by simp⟩, ?_⟩
  intro u v h
  simp only [triangulo, fromEdgeSet_adj, Set.mem_insert_iff, Set.mem_singleton_iff] at h
  fin_cases u <;> fin_cases v <;> simp_all

theorem triangulo_no_conexo : ¬ triangulo.Connected := by
  rw [conexo_iff_sin_separacion]
  exact fun ⟨_, h⟩ => h ⟨_, triangulo_tiene_separacion⟩

end TComp
