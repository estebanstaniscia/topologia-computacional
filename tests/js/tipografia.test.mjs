// Tests del modo tipográfico de G2: la clase de homeomorfismo de los esqueletos de letras.
import { test } from "node:test";
import assert from "node:assert/strict";
import { construirEspacio, claseHomeo, formaReducida, agruparPorClase, ESPACIOS, comparar } from "../../assets/js/bisturi.js";
import { GLIFOS, glifosDe } from "../../assets/js/tipografia.js";

const clase = (ch) => claseHomeo(construirEspacio(GLIFOS[ch]));
const espacio = (k) => construirEspacio(ESPACIOS[k].polilineas);

test("las letras y dígitos se agrupan en las clases esperadas (Helvetica)", () => {
  const esperadas = ["0DO", "1257CGIJLMNSUVWZ", "3EFTY", "4Q", "69P", "8B", "AR", "HK", "X"];
  for (const grupo of esperadas) for (const ch of grupo) assert.equal(clase(ch), clase(grupo[0]), `${ch} ≅ ${grupo[0]}`);
  const representantes = new Set(esperadas.map((g) => clase(g[0])));
  assert.equal(representantes.size, esperadas.length); // clases distintas entre sí
});

test("el invariante completo distingue lo que la firma no (círculo vs. θ)", () => {
  assert.notEqual(claseHomeo(espacio("circulo")), claseHomeo(espacio("theta")));
  // A y Q: misma «forma» a ojo (círculo con dos colas) pero distinta clase
  assert.notEqual(clase("A"), clase("Q"));
});

test("las letras coinciden con los espacios de la galería", () => {
  assert.equal(clase("O"), claseHomeo(espacio("circulo")));
  assert.equal(clase("I"), claseHomeo(espacio("intervalo")));
  assert.equal(clase("Y"), claseHomeo(espacio("y")));
  assert.equal(clase("X"), claseHomeo(espacio("x")));
  assert.equal(clase("P"), claseHomeo(espacio("piruleta")));
  assert.equal(clase("B"), claseHomeo(espacio("ocho")));
});

test("la clase es invariante: si dos espacios tienen la misma clase, tienen la misma firma", () => {
  const todos = [...Object.keys(GLIFOS).map((ch) => construirEspacio(GLIFOS[ch])), ...Object.keys(ESPACIOS).map(espacio)];
  for (const e1 of todos) for (const e2 of todos) {
    if (claseHomeo(e1) !== claseHomeo(e2)) continue;
    const { igualFirma, igualLocal } = comparar(e1, e2);
    assert.ok(igualFirma && igualLocal);
  }
});

test("forma reducida: el círculo es un círculo suelto, el ocho un vértice con dos lazos", () => {
  assert.deepEqual(formaReducida(espacio("circulo")), { n: 0, arcos: [], circulos: 1 });
  const ocho = formaReducida(espacio("ocho"));
  assert.equal(ocho.n, 1);
  assert.deepEqual(ocho.arcos, [[0, 0], [0, 0]]);
});

test("palabras: tildes fuera, minúsculas a mayúsculas, se agrupan sin repetir", () => {
  assert.deepEqual(glifosDe("Año 2!"), ["A", "N", "O", "2"]);
  const g = agruparPorClase("topologia");
  assert.deepEqual(g.map((x) => x.letras.join("")), ["T", "O", "P", "LGI", "A"]);
  assert.equal(g.find((x) => x.letras.includes("L")).nombre, "arco");
});
