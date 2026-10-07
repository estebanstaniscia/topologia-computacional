---
seccion: "I.2 Curvas en el plano (Curves in the Plane)"
paginas: "9-13 (texto 9-12, figura I.6 en p. 13; ejercicios 2, 3 y 4 del capítulo en p. 24)"
estado: borrador completo
paradigma: v2 (visualization-first; ver bocetos/_proyecto/FILOSOFIA.md §6-11)
autor: Claude (Cowork) con Esteban
fecha: 2026-10-07
---

# I.2 Curvas en el plano: guion de estaciones

> **Cómo leer este archivo (paradigma v2).** Ya no es un ensayo para transcribir. Cada
> estación tiene cinco partes con roles distintos en la página:
>
> - **Libro**: ficha con página y nombre del resultado. *No se repite la definición del libro.*
> - **Idea**: una o dos líneas visibles. Es todo el texto que acompaña al gadget por defecto.
> - **Gadget**: la pieza central (especificada en `spec.md` con su código G·).
> - **Lentes**: el texto corto de cada lente del gadget.
> - **Profundizar** (desplegable): aportes propios. Lo marcado ★ no está en el libro.
>
> Todo lo afirmado acá está verificado en `prototipos/curvas.py` o demostrado abajo.

## 0. La sección en una mirada

**Idea.** I.1 juntaba puntos en componentes usando caminos (funciones desde $[0,1]$). I.2
cambia el molde: funciones desde el **círculo** $S^1$. Un camino *conecta*; una curva cerrada
*rodea*. Y rodear es una forma de conectividad que las componentes no ven.

**El hilo oculto de la sección (★).** Los dos algoritmos de la sección son **el mismo
algoritmo** con dos sistemas de números:

| | Algoritmo de paridad | Número de vueltas |
|---|---|---|
| Qué cuenta | Cruces del rayo | Cruces del rayo **con signo** |
| Números | $\mathbb{Z}/2$ (par/impar) | $\mathbb{Z}$ (enteros) |
| Responde | ¿adentro o afuera? (curvas simples) | ¿cuántas veces y en qué sentido rodea? (cualquier curva) |
| Relación | $\text{cruces} \equiv W(\gamma, x) \pmod 2$ **siempre** | |

La paridad es la **sombra módulo 2** del número de vueltas. Es el primer encuentro con una
idea que el libro explota en el capítulo IV: calcular con coeficientes en $\mathbb{Z}/2$ es más
barato y, para muchas preguntas, alcanza.

**Estaciones.**

| # | Estación | Libro | Gadget principal |
|---|---|---|---|
| ★ | Gadget estrella | toda la sección | G1 Lienzo de Jordan |
| 1 | Caminos vs. curvas cerradas; homeomorfismo | p. 9 | G2 Bisturí topológico · G3 Proyector estereográfico |
| 2 | El teorema de la curva de Jordan | pp. 9-10 | G4 ¿Adentro o afuera? · G5 Esfera vs. toro |
| 3 | El algoritmo de paridad | pp. 10-11 | G6 Área con signo · G7 Microscopio de perturbaciones |
| 4 | Triangulación de polígonos | pp. 11-12 | G8 Taller de triangulación · G9 Poliedro de Schönhardt |
| 5 | Número de vueltas | pp. 12-13 | G1 (faro, sonido) · G10 Paisaje de vueltas |
| → | Puentes: los datos tienen forma, galerías de arte, finanzas | — | G11 De la curva a la persistencia |

---

## Estación 1. Caminos, curvas cerradas y homeomorfismo

**Libro:** p. 9, *closed curve*, *homeomorphic*, *homeomorphism*; argumento de que $[0,1]$ y
$S^1$ no son homeomorfos.

**Idea:** un camino es un intervalo deformado; una curva cerrada es un círculo deformado. Un
intervalo y un círculo **no son el mismo espacio**: si les sacás un punto, el intervalo se
parte y el círculo no.

**Gadget:** G2 *Bisturí topológico* (cortar puntos y contar componentes); G3 *Proyector
estereográfico* (ejercicio 4).

**Lentes:**

- *Matemático:* un homeomorfismo es una biyección continua con inversa continua; induce una
  biyección entre los abiertos. Por eso todo lo que se define con abiertos (conexidad,
  cantidad de componentes) se conserva.
- *Programador:* un **invariante** es una función que da lo mismo en objetos equivalentes. Para
  probar que dos objetos *no* son equivalentes, alcanza con encontrar un invariante que los
  distinga. "Componentes después de sacar un punto" es un invariante computable.
- *Geómetra:* el homeomorfismo permite estirar, doblar y deformar, pero no cortar ni pegar.

### Profundizar

**Por qué el argumento del libro funciona (★, desarrollado).** Si $h : [0,1] \to S^1$ fuera un
homeomorfismo, también lo sería su restricción $[0,1] \setminus \{\tfrac12\} \to S^1 \setminus
\{h(\tfrac12)\}$. El lado izquierdo tiene dos componentes y el derecho una (un círculo sin un
punto es un arco). Pero un homeomorfismo conserva la cantidad de componentes. Absurdo.

**El invariante generalizado: tipos de puntos de corte (★).** Para un espacio $X$ y un punto
$p$, sea $c(p)$ = cantidad de componentes de $X \setminus \{p\}$. La **firma** de $X$ cuenta
cuántos puntos tienen cada valor de $c$ (por ejemplo: "infinitos con $c=1$, infinitos con
$c=2$, uno con $c=3$"). Los homeomorfismos conservan la firma.

| Espacio | Firma |
|---|---|
| Intervalo $[0,1]$ | 2 puntos con $c=1$ (extremos), el resto $c=2$ |
| Círculo $S^1$ | todos $c=1$ |
| Ocho (∞) | el punto doble con $c=2$; todos los demás $c=1$ |
| Letra Y (trípode) | 3 extremos con $c=1$, el centro con $c=3$, el resto $c=2$ |
| Letra θ | todos $c=1$: **¡la misma firma que el círculo!** |

La firma **no es un invariante completo**: el círculo y la θ tienen la misma y no son
homeomorfos. Se distinguen con un invariante **local**: en la θ hay dos puntos donde se juntan
tres ramas (una vecindad chica del punto, sin el punto, tiene 3 pedazos), y en el círculo
ninguno. Moraleja de programador: un invariante distingue, pero no siempre identifica.

Esto da un **gadget de topología tipográfica**: clasificar las letras del alfabeto (en una
tipografía sin serifa) por homeomorfismo. Por ejemplo (la respuesta depende de la tipografía): C, I, J, L, M, N, S, U, V, W, Z son
todas intervalos; D y O son círculos; E, F, T, Y son trípodes (homeomorfos entre sí); A y R son
homeomorfas; H y K también; X es una cruz (un punto con $c = 4$). Es un clásico que, convertido en gadget (el lector
escribe una palabra y las letras se agrupan solas), se vuelve inolvidable.

**Ejercicio 4 del capítulo, resuelto (★).** Homeomorfismos explícitos:

- $\mathbb{R} \to (0,1)$: la **logística** $x \mapsto \dfrac{1}{1 + e^{-x}}$ (la misma función
  de la regresión logística y las redes neuronales).
- $(0,1) \to S^1 \setminus \{(0,1)\}$: $t \mapsto (\cos(\tfrac{\pi}{2} + 2\pi t),
  \sin(\tfrac{\pi}{2} + 2\pi t))$, que recorre el círculo empezando y terminando en el polo
  norte $(0,1)$ sin tocarlo.
- Directo $S^1 \setminus \{N\} \to \mathbb{R}$: la **proyección estereográfica**
  $(x, y) \mapsto \dfrac{x}{1 - y}$, la recta que une el polo norte con el punto, hasta cortar
  el eje.
- Generalización: $\mathbb{R}^2 \to$ disco abierto con $v \mapsto \dfrac{v}{1 + \|v\|}$, y
  esfera menos un punto $\to \mathbb{R}^2$ con la proyección estereográfica
  $(x, y, z) \mapsto \dfrac{(x, y)}{1 - z}$.

---

## Estación 2. El teorema de la curva de Jordan

**Libro:** p. 9-10, *simple closed curve*, **Teorema de la curva de Jordan**, Teorema de
Schönflies; validez en la esfera, falla en el toro; Schönflies falla en dimensión > 2.

**Idea:** una curva cerrada simple parte al plano en exactamente dos regiones: adentro y
afuera. Parece obvio, pero solo es obvio para curvas "amables": para curvas arbitrarias es
uno de los teoremas más difíciles de demostrar bien.

**Gadget:** G4 *¿Adentro o afuera?* (desafío humano vs. algoritmo en laberintos y curvas
monstruosas); G5 *Esfera vs. toro* (3D).

**Lentes:**

- *Matemático:* el complemento de la imagen tiene exactamente dos componentes, una acotada y otra
  no; ambas tienen a la curva como borde.
- *Programador:* la afirmación "obvia" esconde un algoritmo no obvio: ¿cómo decide una máquina
  si un punto está adentro? (Estación 3).
- *Geómetra:* Schönflies dice más: el adentro con la curva es un disco deformado. En 3D falla:
  la **esfera cornuda de Alexander** es una esfera cuyo "adentro" no es una bola.

### Profundizar

**Por qué no es obvio.** Las curvas de Jordan pueden ser monstruosas: el **copo de Koch** es
una curva cerrada simple sin tangente en ningún punto, y existen curvas de Jordan con **área
positiva** (curvas de Osgood), donde "la curva" ocupa una región del plano. La primera
demostración (Jordan; el libro la fecha en 1882, otras fuentes en 1887) fue considerada incompleta; la primera
satisfactoria es de Veblen (1905).

**Jordan para polígonos (★, la prueba que sí es corta).** Para un polígono simple $P$:

1. **A lo sumo dos componentes.** Cerca de $P$, a cada lado de cada arista hay una franja
   delgada. Moviéndose "en paralelo" al polígono se recorre toda la franja de un lado sin
   cruzarlo, y lo mismo del otro. Todo punto del complemento se puede llevar en línea recta
   hasta alguna franja. Hay solo dos franjas: a lo sumo dos componentes.
2. **Al menos dos.** La paridad de los cruces de un rayo (Estación 3) es **constante** a lo largo
   de cualquier camino que no toque $P$ (solo cambia al cruzar una arista) y toma los dos
   valores (cerca de una arista, un lado da par y el otro impar). Una función continua no puede
   tomar dos valores en un conjunto conexo: hay dos componentes.

La prueba para polígonos usa exactamente el algoritmo de paridad: **el algoritmo es la
demostración** (como la ola en I.1).

**Esfera y toro (ejercicio 3, ★).**

- *(i) Esfera.* Si $\gamma$ es una curva simple en $S^2$, elegimos un punto $N$ fuera de ella y
  proyectamos estereográficamente desde $N$: la curva va a una curva de Jordan del plano, que lo
  parte en dos; al volver, el adentro y el afuera (que ahora contiene a $N$) son las dos
  componentes de $S^2 \setminus \gamma$.
- *(ii) Toro.* Un **meridiano** (una vuelta alrededor del "tubo") es una curva cerrada simple
  cuyo complemento es un cilindro abierto: **conexo**. En el toro, una curva cerrada simple puede
  no separar. (Gadget G5: el lector pinta desde un punto y la pintura se derrama por todo el
  toro; en la esfera, la pintura se detiene en la curva.)

---

## Estación 3. El algoritmo de paridad

**Libro:** pp. 10-11, *Parity Algorithm*, el determinante $\Delta(x, a, b)$, `doesCross`, la
perturbación $x' = (x_1 + \varepsilon_1, x_2 + \varepsilon_2)$.

**Idea:** para saber si un punto está adentro, tirá un rayo y contá cuántas veces cruza el
borde. Impar: adentro. Par: afuera. La dificultad real no está en la idea sino en los **casos
degenerados** (el rayo pasa por un vértice, o roza una arista), y el libro los resuelve con un
truco infinitesimal.

**Gadget:** el rayo de G1; G6 *Área con signo* (el determinante como área); G7 *Microscopio de
perturbaciones* (los ε a la vista).

**Lentes:**

- *Matemático:* $\det \Delta(x, a, b)$ es el **doble del área con signo** del triángulo $x, a, b$.
  Positivo: se recorre en sentido antihorario (giro a izquierda).
- *Programador:* `doesCross` son dos comparaciones y un determinante 3×3; el algoritmo es $O(n)$.
  El enemigo es la **aritmética de punto flotante**: con números de máquina, el signo de un
  determinante casi nulo puede salir mal. Solución: **predicados exactos** (Shewchuk) o
  aritmética entera.
- *Geómetra:* el rayo es un **sensor de dirección**: cuenta cuántas veces el borde pasa por
  delante en esa dirección.

### Profundizar

**El determinante como área (★).** Restando la primera fila a las otras,
$\det \Delta(x,a,b) = (a_1 - x_1)(b_2 - x_2) - (a_2 - x_2)(b_1 - x_1)$, que es el producto
vectorial (en el plano) de $a - x$ y $b - x$: el área con signo del paralelogramo que generan,
es decir, **el doble del área con signo del triángulo**. El argumento del libro ("vale en
$(0,0), (1,0), (0,1)$ y el signo solo cambia al alinearse") es un argumento de **continuidad**:
el determinante es una función continua de los tres puntos y solo se anula en configuraciones
alineadas.

**La perturbación resuelta exactamente (★).** No hace falta elegir números chicos. Desarrollando:

$$\det \Delta(x', a, b) = \det \Delta(x, a, b) \;+\; \varepsilon_2\,(b_1 - a_1) \;+\; \varepsilon_1\,(a_2 - b_2)$$

(los términos $\varepsilon_1\varepsilon_2$ se cancelan). Como $0 < \varepsilon_1 \ll \varepsilon_2 \ll$
cualquier número del problema, **el signo es el del primer término no nulo** de esa lista. Y la
comparación $a_2 < x_2 + \varepsilon_2 < b_2$ equivale a $a_2 \le x_2 < b_2$. Todo el
truco se reduce a comparaciones exactas, sin ningún número infinitesimal de verdad. Esta técnica
se llama **Simulation of Simplicity** y la inventaron **Edelsbrunner y Mücke (1990)**: el autor
del libro está usando su propia herramienta.

**Qué decide la perturbación en cada caso degenerado (para G7).**

| Caso | Sin perturbar | Con $x'$ |
|---|---|---|
| El rayo pasa por un vértice | ¿cuenta 0, 1 o 2 cruces? | El rayo pasa *apenas arriba* ($\varepsilon_2$): cuenta según las aristas que suben por arriba del vértice |
| El rayo contiene una arista horizontal | indefinido | Esa arista nunca cruza ($a_2 = b_2$) |
| $x$ está sobre una arista | "sobre" | El libro decide según $x'$; nosotros reportamos "sobre" aparte |

**Paridad ≡ vueltas (mod 2) (★).** Cada cruce aporta $\pm 1$ al conteo con signo y $1$ al conteo
sin signo; como $\pm 1 \equiv 1 \pmod 2$, los dos conteos tienen la misma paridad. Si la curva
es simple y antihoraria, $W \in \{0, 1\}$ y la paridad **es** $W$.

---

## Estación 4. Triangulación de polígonos

**Libro:** pp. 11-12, *triangulation*, *diagonal*, existencia por inducción, $n-3$ diagonales y
$n-2$ triángulos, el **árbol dual**, *ear* (oreja); no se generaliza a tetraedros en $\mathbb{R}^3$.

**Idea:** todo polígono simple se puede cortar en triángulos usando solo sus vértices. Si
dibujás un punto en cada triángulo y unís los que comparten una diagonal, aparece **un árbol**: el
"esqueleto" del polígono. El árbol explica por qué siempre hay orejas, y sirve para navegar.

**Gadget:** G8 *Taller de triangulación* (la prueba inductiva animada, el árbol dual, las
orejas, la navegación, la errata); G9 *Poliedro de Schönhardt* (3D).

**Lentes:**

- *Matemático:* inducción sobre $n$: una diagonal parte el $n$-gono en un $n_1$-gono y un
  $n_2$-gono con $n_1 + n_2 = n + 2$.
- *Programador:* el **recorte de orejas** (*ear clipping*) triangula en $O(n^2)$; existe un
  algoritmo lineal (Chazelle, 1991), pero es tan complejo que nadie lo implementa.
- *Grafos (I.1):* el dual es un árbol: cada diagonal es un **puente**. Navegar dentro del polígono
  es buscar un camino en un árbol: la ola de I.1.

### Profundizar

**Errata del libro (★, verificada).** El libro dice: si hay vértices dentro del triángulo $abc$,
unir $b$ con **el de más a la izquierda** dentro de $abc$. Esa regla **puede fallar**. En el
pentágono (antihorario)

$$(42, -71),\ (-16, 46),\ (-8, -18),\ (28, -48),\ (21, -47)$$

en posición general, $b = (-16, 46)$, y dentro de $abc$ están $(28,-48)$ y $(21,-47)$. El de más
a la izquierda, $(21, -47)$, da un segmento que **corta la arista** $(-8,-18)$–$(28,-48)$: no es
una diagonal. La regla correcta (la de la demostración clásica) es **el vértice dentro de $abc$
más lejano de la recta $ac$**: entre $b$ y la paralela a $ac$ por ese vértice no hay ningún
vértice, así que ninguna arista puede cruzar el segmento sin cruzar $ab$ o $bc$. En 3.000
polígonos aleatorios, la regla del libro falló en 7 de cada 1.164 y la corregida nunca.
(`CONTRAEJEMPLO_LIBRO` en `prototipos/curvas.py`.)

**$n - 2$ triángulos, con una prueba de una línea (★).** Los ángulos de los triángulos llenan
exactamente los ángulos interiores del polígono (no hay vértices nuevos). Cada triángulo suma
$\pi$, y los ángulos interiores de un $n$-gono suman $(n-2)\pi$. Entonces hay $n-2$ triángulos. Y
como cada triángulo tiene 3 lados, de los cuales los $n$ lados del polígono se usan una vez y
cada diagonal dos: $3(n-2) = n + 2d$, así que $d = n - 3$.

**El dual es un árbol, y hay al menos DOS orejas (★).** El dual es conexo (el polígono es
conexo) y cada diagonal parte el polígono en dos, así que cada arco del dual es un puente: es un
árbol con $n-2$ nodos. El libro deduce "al menos una oreja" de que un árbol tiene una hoja, pero
todo árbol con al menos 2 nodos tiene **al menos 2 hojas**: es el **teorema de las dos orejas**
(Meisters, 1975), y es la base del algoritmo de recorte de orejas.

**Navegar un laberinto (★).** El libro motiva la triangulación con "encontrar la salida de un
laberinto". El mecanismo: se triangula el laberinto, se toma el árbol dual y se busca en él (con
la ola de I.1) el camino entre el triángulo de entrada y el de salida. Como es un árbol, ese
camino es **único**. En un laberinto espiral, el árbol dual es literalmente el pasillo.

**Puente: el problema de la galería de arte (★).** ¿Cuántos guardias fijos hacen falta para
vigilar una galería con forma de polígono de $n$ lados? Respuesta: $\lfloor n/3 \rfloor$ siempre
alcanzan, y a veces son necesarios (Chvátal, 1975). La prueba de Fisk (1978) es una joya: se
triangula, el grafo de la triangulación se **3-colorea** (quitando orejas por inducción), y el
color menos usado tiene a lo sumo $\lfloor n/3 \rfloor$ vértices; como cada triángulo tiene un
vértice de cada color, esos guardias ven todo.

**En 3D no funciona: el poliedro de Schönhardt (1928).** Se toma un prisma triangular y se gira
la tapa superior unos grados: las caras laterales se doblan hacia adentro. El resultado es un
poliedro de 6 vértices que **no se puede descomponer en tetraedros** sin agregar vértices: cada
tetraedro posible usa una diagonal que queda afuera. (Gadget G9: un deslizador de giro y el
momento en que la descomposición se vuelve imposible.)

---

## Estación 5. Número de vueltas

**Libro:** pp. 12-13, *winding number* $W(\gamma, x)$, valores $\pm 1$ para curvas simples, cambio
de $\pm 1$ al cruzar, regiones de máximo y mínimo local con borde orientado; figura I.6.

**Idea:** pararse en $x$, mirar un punto que recorre la curva y contar cuántas vueltas da la
cabeza. Es un entero. No cambia mientras $x$ no cruce la curva; al cruzarla, salta en uno.

**Gadget:** G1 (campo $W$ coloreado, faro con dial, **sonificación** con tono de Shepard); G10
*Paisaje de vueltas* (3D).

**Lentes:**

- *Matemático:* $W(\gamma, x) = \dfrac{1}{2\pi}\displaystyle\oint d\theta$, el **grado** de la
  función $s \mapsto \dfrac{\gamma(s) - x}{\|\gamma(s) - x\|}$ de $S^1$ en $S^1$. En análisis
  complejo: $\dfrac{1}{2\pi i}\displaystyle\oint_\gamma \dfrac{dz}{z - x}$.
- *Programador:* dos implementaciones $O(n)$: sumar los incrementos de `atan2` (punto flotante),
  o contar cruces con signo del rayo (exacta). Son el mismo número.
- *Físico:* **ley de Ampère**: si por $x$ pasa un cable con corriente $I$ perpendicular al plano,
  $\oint_\gamma \mathbf{B} \cdot d\boldsymbol{\ell} = \mu_0 I\, W(\gamma, x)$. La física cuenta las
  vueltas.
- *Algebraico:* $\mathbb{Z}$ contra $\mathbb{Z}/2$ (ver §0).

### Profundizar

**Por qué los cruces con signo dan $W$ (★).** El rayo horizontal hacia la derecha es el conjunto
de puntos que se ven desde $x$ en la dirección $\theta_0 = 0$. Cada vez que el punto móvil cruza
el rayo, la cabeza del observador pasa por la dirección $\theta_0$: en sentido antihorario si la
curva cruza hacia arriba, horario si cruza hacia abajo. Contar esos pasos con signo es contar las
vueltas netas. En lenguaje de topología diferencial: **el grado es la suma de los signos de las
preimágenes de un valor regular**, y el rayo es esa preimagen. La paridad es lo mismo, mirado
módulo 2.

**W es constante por regiones (★).** $W(\gamma, x)$ depende continuamente de $x$ (fuera de la
curva) y toma valores enteros. Una función continua a valores enteros es constante en cada
conjunto conexo: es constante en cada región del complemento.

**El salto de ±1 y las regiones de borde orientado.** Al cruzar la curva de izquierda a derecha
(respecto de su orientación), $W$ baja en 1; de derecha a izquierda, sube en 1. Por eso una
región de **máximo local** de $W$ (todas las vecinas valen uno menos) tiene la curva corriendo
antihoraria a su alrededor: queda **a la izquierda** de todos sus arcos de borde. Una de mínimo
local queda a la derecha de todos.

**La sonificación (★).** Se mapea el ángulo acumulado del vector al **tono de Shepard**, una
ilusión auditiva que parece subir para siempre: cada vuelta antihoraria es una octava "hacia
arriba", cada vuelta horaria una "hacia abajo", y cada vuelta completa se marca con un clic
(agudo si es +, grave si es −). $W$ se vuelve **la cantidad de veces que el tono "sube" una
octava**. Con los ojos cerrados se distingue un círculo ($W=1$) del lazo interior de un limaçon
($W=2$).

**El paisaje (★).** Si se levanta cada región a la altura $W$, el plano se vuelve un **terreno de
mesetas** (G10): la curva es el conjunto de acantilados, cruzarla es subir o bajar un escalón, y
las regiones de máximo local son las cimas. Es el principio de "los datos tienen forma" aplicado
a la propia curva.

---

## Puentes

**Los datos tienen forma: de la curva a la persistencia (★, anticipo del capítulo VII).** Si se
toman puntos con ruido sobre una curva cerrada dibujada y se calcula la homología persistente en
dimensión 1, aparece **una barra larga**: los datos "saben" que forman un lazo, aunque nadie les
dijo que eran una curva. Un ocho da **dos** barras. La persistencia detecta el "rodear" que el
número de vueltas mide desde adentro. (G11: el lector dibuja, se muestrean puntos, se ve el
diagrama de persistencia; versión marimo con `ripser`.)

**Finanzas (★).** En un oscilador (por ejemplo, un indicador y su derivada, o la señal analítica
de una serie), la trayectoria en el **plano de fases** gira alrededor del origen; el número de
vueltas cuenta **ciclos completos** y es robusto al ruido (es un entero: solo cambia si la
trayectoria pasa por el origen). Y el algoritmo de paridad es la base de cualquier "¿este estado
del mercado está dentro de la región de riesgo?" cuando la región es un polígono.

## Apéndice: ejercicios del capítulo vinculados

- **Ejercicio 2 (shelling de discos):** probar que toda triangulación de un polígono (con vértices
  interiores) tiene un orden en el que cada unión inicial de triángulos es un disco. *Pista:
  quitar "orejas" generalizadas desde el borde, como en el teorema de las dos orejas.*
- **Ejercicio 3:** resuelto en la Estación 2.
- **Ejercicio 4:** resuelto en la Estación 1.
