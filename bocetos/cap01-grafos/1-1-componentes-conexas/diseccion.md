---
seccion: "I.1 Componentes conexas (Connected Components)"
paginas: "3-8 (ejercicio 1 del capítulo: p. 24)"
estado: borrador completo
autor: Claude (Cowork) con Esteban
fecha: 2026-10-05
---

# I.1 Componentes conexas: disección

> Fuente de los entregables descritos en `spec.md`. Escrita siguiendo
> `bocetos/_proyecto/FILOSOFIA.md`. Las demostraciones marcadas con ★ **no están en el
> libro**: el libro afirma el resultado y nosotros lo probamos.

## 0. La sección en una mirada

**Qué hace la sección.** Compara la noción de *conexidad* en dos mundos: el discreto (grafos)
y el continuo (espacios topológicos). Cierra con un algoritmo, union-find, que decide la
conexidad de un grafo y que reaparecerá en el capítulo VII como el corazón de la persistencia
en dimensión 0.

**El leitmotiv: dos maneras de decir "conexo".** El libro da dos definiciones de conexidad, y
lo hace dos veces:

| | Definición **constructiva** ("se puede llegar") | Definición **por obstrucción** ("no se puede cortar") |
|---|---|---|
| **Grafos** | Hay un camino entre todo par de vértices | No existe una separación de los vértices |
| **Espacios** | Conexo por caminos | No existe una separación en dos abiertos |
| **Testigo** | Un camino (o un árbol generador, que los da todos) | La *ausencia* de un corte |
| **En grafos** | equivalentes (Proposición 1) | |
| **En espacios** | estrictamente más fuerte | estrictamente más débil (el peine) |

La definición constructiva **exhibe un testigo**: el camino. La de obstrucción **niega la
existencia de un testigo contrario**: el corte. En el mundo discreto, si no hay corte, la
búsqueda de caminos nunca se traba, y las dos definiciones coinciden. En el continuo aparecen
espacios que no se pueden cortar y en los que, sin embargo, hay puntos a los que no se puede
llegar. Toda la sección se puede leer como la historia de esa grieta.

**Mapa.**

| Bloque | Tema | Páginas |
|---|---|---|
| 1 | Grafos: simple, camino, conexo, componente, árbol, separación | 3-4 |
| 2 | Espacios topológicos: topología, base, subespacio | 4-5 |
| 3 | Continuidad, caminos, conexo por caminos vs. conexo, el peine | 5-6 |
| 4 | Union-find: estructura básica | 6-7 |
| 5 | Mejoras: unión por tamaño, compresión de caminos, α(n) | 7-8 |
| 6 | Ejercicio 1, puentes hacia adelante y hacia finanzas | 24 |

---

## Bloque 1. Grafos

### 1.1 El grafo como objeto doble

El capítulo abre con una observación que es en sí misma un programa: en topología un grafo es
un **objeto geométrico 1-dimensional** (los vértices son puntos, las aristas son curvas), mientras
que en matemática discreta es un **objeto combinatorio** (un conjunto y una relación). Las dos
visiones son compatibles: la segunda es la "receta" y la primera es el "plato".

La conexidad es **intrínseca**: no depende de cómo dibujemos el grafo (en el papel o en el
aire). Las secciones I.2 a I.4 tratan, en cambio, preguntas **extrínsecas** (cómo se ubica el
grafo en el plano o en el espacio). El libro avisa que el matemático prefiere lo intrínseco
porque suele llevar a resultados más fundamentales.

### 1.2 Grafos simples

**Definición.** Un *grafo abstracto* es un par $G = (V, E)$ con $V$ un conjunto de vértices y
$E$ un conjunto de aristas, cada una un par de vértices. Es **simple** si
$E \subseteq \binom{V}{2}$, el conjunto de pares *no ordenados de elementos distintos*.

**El porqué del diseño.** La condición $E \subseteq \binom{V}{2}$ hace dos cosas a la vez, y
las dos salen "gratis" de la notación:

- Como los elementos de $\binom{V}{2}$ son subconjuntos de **dos** elementos distintos, no hay
  **lazos** (una arista $\{v, v\}$ tendría un solo elemento).
- Como $E$ es un **conjunto** (no una lista ni un multiconjunto), no hay **aristas múltiples**
  entre el mismo par de vértices.

En otras palabras: en un grafo simple la única información es *"¿son adyacentes $u$ y $v$?,
sí o no"*. Para un programador, eso es exactamente una **matriz de adyacencia** simétrica de
ceros y unos con diagonal nula.

**Consecuencias.** Con $n = \operatorname{card} V$ vértices y $m = \operatorname{card} E$
aristas, $m \le \binom{n}{2} = \frac{n(n-1)}{2}$. Todo grafo simple es un subgrafo del
**grafo completo** $K_n$, que tiene todas las aristas posibles. Por eso hay exactamente
$2^{\binom{n}{2}}$ grafos simples sobre $n$ vértices etiquetados: elegir un grafo es elegir un
subconjunto de las aristas de $K_n$ (para $n = 5$: $2^{10} = 1024$).

**Ejemplos simples.** El completo $K_5$ (10 aristas: los lados y diagonales de un pentágono,
con 5 cruces si se dibuja así; figura I.1). El camino $P_4$, el ciclo $C_5$, un árbol, el
grafo de Petersen, y el caso extremo: $n$ vértices sin ninguna arista (el grafo más
desconexo posible, con $n$ componentes).

**Ejemplos que NO son simples.**

- **Los puentes de Königsberg (Euler, 1736).** Cuatro regiones de tierra y siete puentes. Entre
  algunas regiones hay *dos* puentes: es un **multigrafo**. Es históricamente el primer problema
  de teoría de grafos y también uno de los primeros de topología, porque la respuesta no
  depende de distancias ni de formas, solo de *cómo* están conectadas las cosas.
- **Un vértice con un lazo** (una arista que sale y vuelve al mismo vértice).
- (Los **grafos dirigidos** son otra especie: sus aristas son pares *ordenados*.)

**Observación clave para esta sección.** La conexidad **no ve** ni los lazos ni la
multiplicidad de las aristas: si se reemplaza cada grupo de aristas paralelas por una sola y se
borran los lazos, las componentes no cambian. Restringirse a grafos simples no le cuesta nada
a la pregunta de la conexidad.

### 1.3 Caminos y longitud

**Definición.** Un **camino** entre $u$ y $v$ es una sucesión de vértices
$u = u_0, u_1, \dots, u_k = v$ con una arista entre $u_i$ y $u_{i+1}$ para cada
$0 \le i \le k-1$. Su **longitud** es $k$, el número de aristas (no de vértices). Se permiten
repeticiones: el camino puede cruzarse o volver sobre sus pasos. Es **simple** si los
vértices son todos distintos.

**Lema (★, borrado de bucles).** Si hay un camino de $u$ a $v$, hay un camino *simple* de $u$
a $v$, de longitud menor o igual.

*Prueba.* Si el camino repite un vértice, $u_i = u_j$ con $i < j$, borramos el tramo
$u_{i+1}, \dots, u_j$: lo que queda sigue siendo un camino de $u$ a $v$ y es estrictamente más
corto. Como la longitud no puede bajar para siempre, el proceso termina en un camino sin
repeticiones. ∎

Visualmente, es **cortar los rulos** de un recorrido: cada vez que el camino vuelve a pisar
un lugar por el que ya pasó, el rulo intermedio sobra. (La misma operación aplicada a caminos
aleatorios da el *loop-erased random walk*, un objeto central de la probabilidad moderna.)

**Dos consecuencias que vuelven más adelante.**

- La **distancia** $d(u, v)$, definida como la longitud mínima de un camino de $u$ a $v$,
  convierte a cada componente de un grafo en un **espacio métrico**. Es el primer puente entre
  el grafo combinatorio y el mundo continuo de los bloques 2 y 3.
- Un camino de longitud $k$ es lo mismo que una función $\{0, 1, \dots, k\} \to V$ que manda
  enteros consecutivos a vértices adyacentes. Es decir: **una forma de "recorrer" el grafo
  usando como molde el grafo camino $P_k$**. Guardemos esta imagen para 3.3, donde el molde
  será el intervalo $[0, 1]$.

### 1.4 Conexidad y componentes

**Definición.** Un grafo simple es **conexo** si hay un camino entre todo par de vértices. Una
**componente (conexa)** es un subgrafo conexo **maximal** (no se puede agrandar sin perder la
conexidad).

**La mirada estructural (★).** La relación "$u \sim v$ si hay un camino de $u$ a $v$" es una
**relación de equivalencia**:

- reflexiva: el camino de longitud 0 ($u_0 = u$);
- simétrica: se recorre el camino al revés;
- transitiva: se concatenan dos caminos.

Las componentes son exactamente sus **clases de equivalencia**. Por lo tanto las componentes
**particionan** $V$: todo vértice está en exactamente una. Esta es la observación que hace
posible union-find (bloque 4): decidir la conexidad es **mantener una partición** de los
vértices, y union-find es precisamente una estructura de datos para particiones.

### 1.5 Árboles y árboles generadores

**Definición.** Un **árbol** es un grafo con un *único* camino simple entre cada par de
vértices. Un **árbol generador** de $G = (V, E)$ es un árbol $(V, T)$ con $T \subseteq E$:
tiene todos los vértices de $G$ y una cantidad mínima de aristas para mantenerlos conectados.

**El árbol como punto de equilibrio.** Para un grafo con $n$ vértices, son equivalentes:

1. es un árbol (camino simple único entre cada par);
2. es conexo y no tiene ciclos;
3. es conexo y tiene $n - 1$ aristas;
4. no tiene ciclos y tiene $n - 1$ aristas;
5. es **minimalmente conexo**: sacar cualquier arista lo desconecta;
6. es **maximalmente acíclico**: agregar cualquier arista crea un ciclo.

Las condiciones 5 y 6 cuentan la historia completa: un árbol está **exactamente en el borde**
entre "tener demasiado pocas aristas para ser conexo" y "tener demasiadas para no tener
ciclos". El libro destaca la 5; la 3 la prueba más adelante con union-find (bloque 4).

**Dos experimentos que conviene hacer con las manos (pieza interactiva).**

- **Agregar** una arista $e \notin T$ a un árbol crea **exactamente un ciclo**: el *ciclo
  fundamental* de $e$.
- **Quitar** una arista $e \in T$ parte el árbol en **exactamente dos componentes**: la arista
  era un *puente*, y las dos partes forman una **separación** (ver 1.6). Es el *corte
  fundamental* de $e$.

Ciclos fundamentales y cortes fundamentales son objetos *duales*. Esa dualidad reaparece, muy
amplificada, en el capítulo V (Dualidad).

**Un número sorprendente.** $K_5$ tiene $5^{5-2} = 125$ árboles generadores (fórmula de
Cayley: $K_n$ tiene $n^{n-2}$). La figura I.1 muestra uno de ellos.

### 1.6 Separaciones y la Proposición 1

**Definición.** Una **separación** de un grafo es una partición no trivial de los vértices,
$V = U \,\dot\cup\, W$ con $U, W \neq \emptyset$, tal que **ninguna arista** conecta un vértice
de $U$ con uno de $W$.

**Proposición 1 (★).** *Un grafo simple tiene un camino entre todo par de vértices si y solo
si no tiene ninguna separación.*

*Prueba.*

- **(⇒)** Supongamos que existe una separación $V = U \,\dot\cup\, W$. Elegimos $u \in U$ y
  $w \in W$ y un camino $u = u_0, \dots, u_k = w$. El camino empieza en $U$ y termina en $W$, así
  que hay un primer índice en el que "cruza": $u_i \in U$ y $u_{i+1} \in W$. Pero entre ellos hay
  una arista, y eso contradice que la partición sea una separación.
- **(⇐)** Fijamos un vértice $u$ y definimos $U$ como el conjunto de vértices **alcanzables**
  desde $u$, y $W = V \setminus U$. No hay ninguna arista entre $U$ y $W$: si $x \in U$ e
  $y \in W$ fueran adyacentes, $y$ sería alcanzable (se llega a $x$ y se da un paso más). Si
  $W$ no fuera vacío, $(U, W)$ sería una separación. Como no hay separaciones, $W = \emptyset$:
  todo vértice es alcanzable desde $u$, y por simetría y transitividad hay camino entre todo
  par. ∎

**La vuelta con ojos de programador.** "El conjunto de vértices alcanzables desde $u$" **es un
algoritmo**: la búsqueda en anchura (BFS) o en profundidad (DFS). Imaginemos una **ola** que
parte de $u$ y se expande arista por arista. Cuando la ola se detiene, pasa una de dos cosas:

- cubrió todo, y **las aristas por las que avanzó forman un árbol generador**: un testigo de que
  el grafo es conexo;
- no cubrió todo, y **la línea donde se detuvo es un corte**: lo mojado y lo seco forman una
  separación, un testigo de que el grafo no es conexo.

La demostración y el algoritmo son el mismo objeto. Y el algoritmo corre en tiempo
proporcional a $n + m$, que es la respuesta al ejercicio 1(i) del capítulo (bloque 6).

**Certificados (★).** La proposición tiene una lectura todavía más fina: **cualquiera sea la
respuesta, existe un testigo corto y fácil de verificar.**

| Respuesta | Testigo | Tamaño | Cómo se verifica |
|---|---|---|---|
| "Es conexo" | Un árbol generador | $n - 1$ aristas | Son aristas de $E$, son $n-1$ y conectan todo |
| "No es conexo" | Una separación $(U, W)$ | $n$ etiquetas | Ninguna arista de $E$ cruza de $U$ a $W$ |

Quien recibe el veredicto no necesita confiar en el algoritmo: le basta con chequear el
testigo. En el mundo continuo, en cambio, el peine (3.7) será un espacio **sin ningún corte**
y **sin un camino** hacia uno de sus puntos: ninguno de los dos testigos existe.

**Pregunta para pensar (con respuesta).** ¿Dónde se usa que $G$ es finito en la prueba de
(⇐)? *En ningún lado.* La prueba funciona igual para grafos infinitos, porque los caminos
siempre son finitos. Lo que sí usa la finitud es el **algoritmo**: en un grafo infinito la ola
puede no terminar nunca.

### 1.7 La Proposición 2: el escultor y el albañil

**Proposición 2 (★).** *Un grafo es conexo si y solo si tiene un árbol generador.*

*Prueba.*

- **(⇐)** Si $(V, T)$ es un árbol generador, sus caminos usan aristas de $T \subseteq E$, así
  que también son caminos de $G$.
- **(⇒)** Mientras el grafo tenga un ciclo, sacamos una arista del ciclo. El grafo sigue
  siendo conexo: un camino que usaba esa arista puede dar la vuelta por el resto del ciclo. El
  proceso termina, porque hay finitas aristas, en un grafo conexo y sin ciclos: un árbol. ∎

**Dos estrategias opuestas para llegar al mismo objeto.**

- **El escultor (prueba destructiva).** Parte del bloque entero, el grafo, y **saca material**
  (aristas de ciclos) hasta que no sobra nada.
- **El albañil (algoritmo constructivo).** Parte de los vértices sueltos y **pone ladrillos**
  (aristas) de a uno, **descartando** cada ladrillo que cerraría un ciclo.

El albañil es exactamente union-find procesando las aristas (bloque 4), y si los ladrillos
llegan ordenados por peso es el **algoritmo de Kruskal** para el árbol generador mínimo. Las
aristas descartadas por el albañil son exactamente las que el escultor podría haber sacado.

**Equivalencias del bloque 1, en resumen.**

$$
\text{hay caminos entre todo par}
\iff
\text{no hay separación}
\iff
\text{hay un árbol generador}
$$

---

## Bloque 2. Espacios topológicos

### 2.1 Por qué abandonar las distancias

Para hablar de conexidad no hacen falta distancias: alcanza con saber **qué puntos están
cerca de cuáles**, sin decir *cuán* cerca. Eso es una topología. Es el gesto que el prefacio
describe como pasar "de la geometría a la topología": nos sacamos de encima la carga del
tamaño y nos quedamos con el fenómeno de la conectividad.

### 2.2 La definición y su porqué

**Definición.** Una **topología** en un conjunto $X$ es una colección $\mathcal{U}$ de
subconjuntos de $X$, llamados **abiertos**, tal que:

1. $X$ y $\emptyset$ son abiertos;
2. si $U_1$ y $U_2$ son abiertos, $U_1 \cap U_2$ es abierto (y por inducción, toda intersección
   **finita**);
3. la unión de **cualquier** familia de abiertos (finita, infinita, incluso no numerable) es
   abierta.

El par $(X, \mathcal{U})$ es un **espacio topológico**.

**La pregunta que hay que hacerse: ¿por qué intersecciones finitas pero uniones arbitrarias?**
La asimetría parece arbitraria hasta que se lee la definición con la siguiente clave.

**Clave (★): un abierto es una propiedad que se puede confirmar con una observación finita.**
Pensemos un punto de $\mathbb{R}$ como algo que solo conocemos por mediciones de precisión
finita (como un número real en una computadora, o una magnitud en un laboratorio).

- La propiedad "$x$ está a menos de $\tfrac{1}{k}$ de $0$" se puede **confirmar** con una
  medición suficientemente precisa: si es cierta, alguna medición finita lo muestra. Por eso el
  intervalo $(-\tfrac1k, \tfrac1k)$ es abierto.
- La propiedad "$x = 0$ exactamente" **nunca** se puede confirmar con una medición finita:
  siempre queda margen de error. Por eso $\{0\}$ no es abierto.

Con esta clave, los axiomas son leyes de la lógica de las observaciones:

| Axioma | Lectura como observación |
|---|---|
| $X$ y $\emptyset$ abiertos | "Siempre" y "nunca" se confirman sin medir nada |
| Intersección finita | **Y** de dos pruebas: se corren las dos, ambas terminan en tiempo finito |
| Unión arbitraria | **O** de muchas pruebas: alcanza con que **una** confirme (se corren todas en paralelo) |
| Intersección infinita: **no** | **Y** de infinitas pruebas: habría que esperar para siempre |

El ejemplo del libro es exactamente esto: $\bigcap_{k \ge 1} (-\tfrac1k, \tfrac1k) = \{0\}$
no es abierto, porque confirmar **todas** las precisiones a la vez equivale a confirmar
"$x = 0$", que requiere precisión infinita.

Para un programador: **abierto = predicado semidecidible**, es decir, un test que termina
diciendo "sí" cuando la respuesta es sí, aunque pueda no terminar nunca cuando es no. (Esta
lectura es un área seria de la matemática: *Topology via Logic*, S. Vickers, 1989; y la
semántica de lenguajes de programación de D. Scott y M. Smyth.)

Una segunda imagen, más geométrica: un conjunto es abierto si **cada uno de sus puntos tiene
margen de maniobra**, es decir, se puede mover un poco en cualquier dirección sin salirse.

### 2.3 Ejemplos, de lo extremo a lo extraño

- **Topología discreta:** todos los subconjuntos son abiertos. Todo es observable; cada punto
  está "aislado".
- **Topología trivial (indiscreta):** solo $\emptyset$ y $X$. Nada es observable; ningún par de
  puntos se distingue.
- **La recta real usual:** generada por los intervalos abiertos (ver 2.4).
- **Espacios finitos.** Sobre $\{a, b\}$ hay exactamente 4 topologías: la trivial, la discreta
  y dos copias del **espacio de Sierpiński**, cuyos abiertos son $\emptyset, \{b\}, \{a, b\}$.
  Sobre 3 puntos hay 29 topologías (9 a menos de homeomorfismo). Una topología finita es lo
  mismo que un **preorden** (orden de especialización: $x \le y$ si todo abierto que contiene a
  $x$ contiene a $y$), así que **los espacios finitos se dibujan como grafos dirigidos**. Es un
  puente inesperado entre topología y combinatoria.

El **espacio de Sierpiński** es la estrella de esta sección: con la clave de 2.2 es el espacio
de "valores de verdad observables". El punto $b$ es "confirmado" y el punto $a$ es "todavía no
confirmado". Se puede observar que algo pasó, pero no que no pasó. Lo vamos a usar en 3.2 para
reinterpretar el ejemplo de continuidad del libro.

### 2.4 Bases

**Definición.** Una **base** de una topología en $X$ es una colección $\mathcal{B}$ de
subconjuntos tal que (a) todo punto está en algún elemento de $\mathcal{B}$, y (b) si
$x \in B_1 \cap B_2$, existe $B_3 \in \mathcal{B}$ con $x \in B_3 \subseteq B_1 \cap B_2$. La
**topología generada** está formada por los $U$ tales que todo $x \in U$ tiene un $B$ con
$x \in B \subseteq U$; equivalentemente, todas las uniones de intersecciones finitas de
elementos de la base.

**El porqué del diseño.** La base son los **"abiertos básicos"**: las observaciones
elementales a partir de las cuales se arman todas las demás. La condición (b) garantiza que la
intersección de dos básicos sea unión de básicos, es decir, que el **Y** de dos observaciones
elementales se pueda expresar con observaciones elementales.

**La imagen que vale oro (★): discos, cuadrados y rombos dan la misma topología en
$\mathbb{R}^2$.** Alrededor de cualquier punto, dentro de cada disco cabe un cuadrado centrado
en el punto, y dentro de ese cuadrado cabe un disco, y así indefinidamente. Ese **anidamiento
alternado** implica que las dos bases generan exactamente los mismos abiertos. Moraleja: **la
topología no ve formas, solo cercanía.** Un disco y un cuadrado son "la misma noción de
alrededor".

**El contraejemplo que vale más oro todavía (★): la recta de Sorgenfrey.** Si en $\mathbb{R}$
usamos como base los intervalos semiabiertos $[a, b)$ en vez de los abiertos $(a, b)$,
obtenemos **otra** topología sobre el mismo conjunto. En ella, $[0, 1)$ es abierto y su
complemento $(-\infty, 0) \cup [1, \infty)$ también lo es (es unión de semiabiertos). Así que
$[0,1)$ es a la vez abierto y cerrado, y la recta de Sorgenfrey **no es conexa** (ver 3.5). El
mismo conjunto $\mathbb{R}$ es conexo o no según la topología: **la conexidad es una
propiedad del espacio topológico, no del conjunto**.

### 2.5 Subespacios

**Definición.** Si $Y \subseteq X$ y $\mathcal{U}$ es una topología en $X$, la **topología de
subespacio** en $Y$ está formada por los conjuntos $Y \cap U$ con $U \in \mathcal{U}$.

**El ejemplo del libro.** En $[0, 1] \subseteq \mathbb{R}$, el conjunto $(\tfrac12, 1]$ es
abierto, porque es $[0,1] \cap (\tfrac12, 2)$. Pero en $\mathbb{R}$ no es abierto: el punto $1$
no tiene margen hacia la derecha.

**La imagen: el borde del mundo.** Para un habitante de $[0, 1]$, no existe nada más allá de
$1$. El punto $1$ tiene "margen de maniobra" en todas las direcciones que existen en su mundo,
que es solo hacia la izquierda. Ser abierto **no es una propiedad de un conjunto, sino de un
conjunto dentro de un universo**. Esto importa muchísimo en el resto del libro, donde los
grafos y los complejos viven como subespacios de $\mathbb{R}^2$ o $\mathbb{R}^d$.

---

## Bloque 3. Continuidad, caminos y conexidad

### 3.1 Continuidad

**Definición.** Una función $f : X \to Y$ entre espacios topológicos es **continua** si la
**preimagen** de todo abierto es abierta: $U$ abierto en $Y$ implica $f^{-1}(U)$ abierto en $X$.

**¿Por qué preimágenes y no imágenes?** Porque la continuidad expresa "**si la entrada se mueve
poco, la salida se mueve poco**", y eso se lee de atrás hacia adelante: fijada una tolerancia
para la salida (un abierto $U$ alrededor de $f(x)$), tiene que existir una tolerancia para la
entrada (un abierto alrededor de $x$, contenido en $f^{-1}(U)$) que la garantice. La versión con
imágenes falla de entrada: una función constante es lo más continuo que hay y manda todo abierto
en un punto, que no es abierto.

**Recuperando el ε-δ.** Para $f : \mathbb{R} \to \mathbb{R}$, la definición es equivalente a la
del análisis: la ventana $(f(x)-\varepsilon, f(x)+\varepsilon)$ es un abierto de la salida, y
el intervalo $(x - \delta, x + \delta)$ es un abierto básico de la entrada contenido en su
preimagen.

**Con la clave de las observaciones (★):** $f$ es continua si **toda propiedad observable de la
salida es una propiedad observable de la entrada**. Dicho de forma computacional: se puede
aproximar la salida tanto como se quiera midiendo la entrada con suficiente precisión. Por eso
existe el principio (Brouwer, Turing) de que **toda función computable sobre los reales es
continua**.

### 3.2 El ejemplo del libro, y su giro inesperado

**El ejemplo.** $f : \mathbb{R} \to \mathbb{R}$ que manda $(-\infty, 0]$ a $0$ y $(0, \infty)$
a $1$. No es continua: para $0 < \varepsilon < 1$, el abierto $(-\varepsilon, \varepsilon)$
tiene preimagen $(-\infty, 0]$, que no es abierta (el punto $0$ no tiene margen a la derecha).

**La imagen.** Fijemos la ventana de tolerancia $\varepsilon$ alrededor de $f(0) = 0$. Por más
chica que sea la ventana de entrada alrededor de $0$, siempre contiene puntos positivos, que
saltan a $1$, fuera de la ventana. **No existe ningún δ que funcione.** (Pieza interactiva: el
lector achica δ y el salto no desaparece.)

**El giro (★).** Ahora miremos la *misma fórmula* con otra topología en la llegada. Tomemos
$Y = \{0, 1\}$ y probemos sus cuatro topologías:

| Topología en $\{0,1\}$ | Abiertos | ¿Es continua $f$? | Por qué |
|---|---|---|---|
| Discreta | $\emptyset, \{0\}, \{1\}, \{0,1\}$ | No | $f^{-1}(\{0\}) = (-\infty, 0]$ no es abierto |
| Sierpiński con $\{1\}$ abierto | $\emptyset, \{1\}, \{0,1\}$ | **Sí** | $f^{-1}(\{1\}) = (0, \infty)$ es abierto |
| Sierpiński con $\{0\}$ abierto | $\emptyset, \{0\}, \{0,1\}$ | No | $f^{-1}(\{0\}) = (-\infty, 0]$ no es abierto |
| Trivial | $\emptyset, \{0,1\}$ | Sí | Toda función a un trivial es continua |

¡La misma función salta y es continua! Lección: **la continuidad no es una propiedad de la
fórmula, sino de la relación entre dos topologías**.

Y la lectura computacional lo explica todo: $f$ es el test "$x > 0$". Ese test es
**semidecidible**: si $x > 0$, alguna aproximación finita lo confirma; si $x = 0$, ninguna
aproximación finita descarta que sea positivo. En Sierpiński con $\{1\}$ abierto, "1" es
"confirmado" y "0" es "todavía no": **el salto está permitido solo en la dirección en que se
puede observar**. En general, una función continua $X \to$ Sierpiński es exactamente lo mismo
que un abierto de $X$ (su preimagen de "confirmado").

### 3.3 Caminos continuos: ¿el análogo de los caminos discretos?

**Definición.** Un **camino** en $X$ es una función continua $\gamma : [0, 1] \to X$. Conecta
$\gamma(0)$ con $\gamma(1)$. Se permiten autointersecciones ($\gamma(s) = \gamma(t)$ con
$s \ne t$); si no hay, $\gamma$ es inyectiva y el camino es **simple**.

**Sí, es el análogo exacto, y la analogía es precisa (★).**

| | Camino discreto | Camino continuo |
|---|---|---|
| Molde | El grafo camino $P_k = \{0, 1, \dots, k\}$ | El intervalo $[0, 1]$ |
| Qué se exige | Enteros consecutivos van a vértices adyacentes | Puntos cercanos van a puntos cercanos (continuidad) |
| Simple | Vértices distintos | Función inyectiva |
| Borrar repeticiones | Cortar rulos (lema 1.3): trivial | Todo camino entre puntos distintos contiene un camino simple, en espacios de Hausdorff: un teorema profundo |

En ambos casos un camino es **una copia deformada de un segmento estándar dibujada dentro del
espacio**. El intervalo $[0, 1]$ es la versión continua del grafo camino.

**El puente concreto: la realización geométrica.** Si dibujamos el grafo $G$ como un espacio
$|G|$ (cada arista, un segmento), un camino discreto $u_0, \dots, u_k$ se convierte en un
camino continuo: en el tiempo $t \in [\tfrac{i}{k}, \tfrac{i+1}{k}]$ se recorre la arista
$u_i u_{i+1}$ a velocidad constante. Y recíprocamente, un camino continuo en $|G|$ entre dos
vértices pasa por una sucesión de vértices que, borrando rulos, es un camino discreto. Por eso:

$$G \text{ conexo} \iff |G| \text{ conexo por caminos} \iff |G| \text{ conexo}.$$

Para grafos, los tres mundos coinciden. (Animación: un camino discreto que "se derrite" en un
camino continuo, con el reloj $t$ corriendo.)

**Caminos raros, para calibrar la intuición.**

- **La curva de Peano** es un camino $[0,1] \to [0,1]^2$ **sobreyectivo**: pasa por todos los
  puntos del cuadrado. Un camino puede ser mucho más salvaje que "una curva".
- **Un camino que salta (★).** En el espacio de Sierpiński $\{a, b\}$ (abierto $\{b\}$), la
  función $\gamma(t) = a$ para $t \le \tfrac12$ y $\gamma(t) = b$ para $t > \tfrac12$ es
  continua, porque $\gamma^{-1}(\{b\}) = (\tfrac12, 1]$ es abierto en $[0,1]$. **Un camino
  hecho de un único salto.** Es el mismo fenómeno de 3.2.

### 3.4 Conexo por caminos

**Definición.** Un espacio es **conexo por caminos** si todo par de puntos se conecta por un
camino. Es la versión continua de la definición constructiva: "**se puede llegar**".

### 3.5 Separaciones y conexidad

**Definición.** Una **separación** de $X$ es una partición $X = U \,\dot\cup\, W$ en dos
abiertos no vacíos. $X$ es **conexo** si no tiene separaciones. Es la versión continua de la
definición por obstrucción: "**no se puede cortar**".

**Formas equivalentes (★).** Son equivalentes:

1. $X$ es conexo;
2. los únicos subconjuntos de $X$ a la vez abiertos y cerrados (*clopen*) son $\emptyset$ y $X$;
3. toda función continua $X \to \{0, 1\}$ (con la topología discreta) es constante.

**Con la clave de las observaciones:** un clopen es una propiedad que se puede **confirmar y
también refutar** en tiempo finito, es decir, una propiedad **decidible**. Un espacio es conexo
si no admite **ninguna propiedad decidible no trivial**. Por eso, por ejemplo, en $\mathbb{R}$
no existe ningún test computable total que separe a los reales en dos clases no vacías.

### 3.6 Conexo por caminos implica conexo

**Teorema.** *Si $X$ es conexo por caminos, es conexo.*

Primero un lema que es el corazón de todo: **el intervalo $[0, 1]$ es conexo.**

*Prueba del lema (★).* Supongamos $[0,1] = A \,\dot\cup\, B$ con $A, B$ abiertos (en
$[0,1]$), no vacíos, y $0 \in A$. Sea $s = \sup\{t : [0, t] \subseteq A\}$. Si $s \in A$, como
$A$ es abierto hay margen a la derecha de $s$ dentro de $A$ (salvo que $s = 1$, y entonces
$[0,1] \subseteq A$ y $B = \emptyset$): contradicción con la definición de $s$. Si
$s \in B$, como $B$ es abierto hay un margen a la izquierda de $s$ dentro de $B$, pero esos
puntos están en $A$ por definición de $s$: contradicción. ∎

*Prueba del teorema (★).* Si $X = U \,\dot\cup\, W$ fuera una separación, tomamos $u \in U$,
$w \in W$ y un camino $\gamma$ de $u$ a $w$. Entonces $\gamma^{-1}(U)$ y $\gamma^{-1}(W)$ son
abiertos (por continuidad), disjuntos, no vacíos ($0$ está en el primero y $1$ en el segundo) y
cubren $[0,1]$: una separación de $[0,1]$, que contradice el lema. ∎

**Las dos pruebas, lado a lado (pieza visual).**

| Grafos (Prop. 1, ⇒) | Espacios (Teorema 3.6) |
|---|---|
| El camino empieza en $U$ y termina en $W$ | El camino empieza en $U$ y termina en $W$ |
| Hay un **primer índice** en que cruza: $u_i \in U$, $u_{i+1} \in W$ | Hay un **supremo** donde "cruza" |
| La arista $u_i u_{i+1}$ cruza el corte: absurdo | $[0, 1]$ quedaría separado: absurdo |

Es **el mismo argumento**: en lo discreto el "primer cruce" es un índice; en lo continuo es un
supremo, y la conexidad de $[0,1]$ hace el papel de "no hay huecos entre enteros consecutivos".

### 3.7 La vuelta es falsa: el peine

**La construcción (p. 6).** En $\mathbb{R}^2$ tomamos la barra $[0,1] \times \{0\}$, los
dientes $\{\tfrac1k\} \times [0,1]$ para todo entero $k \ge 1$, y el diente
$\{0\} \times [0,1]$; finalmente borramos el interior de este último diente,
$\{0\} \times (0, 1)$. Queda el **peine con un diente borrado** $C$, con la topología de
subespacio de $\mathbb{R}^2$. Del diente borrado sobrevive solo la punta $p = (0, 1)$ (y su
base $(0,0)$, que está en la barra).

**$C$ es conexo (★).** Sea $S = C \setminus \{p\}$: la barra con todos los dientes. $S$ es
conexo por caminos (de cualquier punto se baja por su diente a la barra y se sube por otro), y
por 3.6 es conexo. Además $p$ está en la **clausura** de $S$: todo disco alrededor de $p$ toca
las puntas de los dientes $\{\tfrac1k\} \times [0,1]$ para $k$ grande. Y vale el lema general:
*si $S$ es conexo y $S \subseteq T \subseteq \overline{S}$, entonces $T$ es conexo* (cualquier
separación de $T$ cortaría a $S$, porque $S$ es denso en $T$). Es lo que el libro resume como
"la unión de un conjunto conexo por caminos y un punto límite".

**$C$ no es conexo por caminos (★).** Sea $\gamma : [0, 1] \to C$ un camino con
$\gamma(0) = p$. Veamos que $\gamma$ es constante. Sea $T = \gamma^{-1}(p)$, que es cerrado y no
vacío. Mostremos que también es abierto. Si $\gamma(t_0) = p$, por continuidad hay un intervalo
$J \ni t_0$ con $\gamma(J)$ dentro del disco de radio $\tfrac12$ alrededor de $p$. Ese disco
corta a $C$ en el punto $p$ más trozos verticales de los dientes $\{\tfrac1k\} \times [0,1]$
(uno por cada $k$ suficientemente grande), y **cada trozo es abierto y cerrado** dentro de esa
intersección. Como $\gamma(J)$ es conexo
(imagen continua de un intervalo) y contiene a $p$, no puede tocar ningún trozo: si tocara
uno, por ser clopen, $\gamma(J)$ quedaría entero dentro de él y no contendría a $p$. Entonces
$\gamma(J) = \{p\}$, y $T$ es abierto. Como $[0,1]$ es conexo, $T = [0,1]$: el camino nunca se
mueve de $p$. Ningún camino sale de $p$ hacia el resto del peine. ∎

**La imagen: la torre visible e inalcanzable.** Desde la barra, el punto $p$ se *ve*: cualquier
vecindad suya, por chica que sea, contiene puntos del resto del peine. Pero no hay **ningún
camino** que llegue. Cada intento de acercarse obliga a subir por un diente $\tfrac1k$ y, para
saltar al siguiente, a bajar hasta la barra. Llegar a $p$ requeriría infinitas subidas y
bajadas de altura $\tfrac12$ en tiempo finito, y la continuidad lo prohíbe. (Pieza
interactiva: un zoom infinito hacia $p$, en el que siempre aparecen más dientes, y un
"desafío": el lector intenta dibujar un camino hasta $p$ y el sistema le muestra dónde salta.)

Y el leitmotiv se cumple: **$C$ no tiene ningún corte (no hay testigo de desconexión) y no
hay ningún camino hacia $p$ (no hay testigo de conexión por caminos)**. En el mundo discreto
eso es imposible (1.6).

**Un hermano famoso:** la *curva seno del topólogo*, $\{(x, \sin \tfrac1x) : 0 < x \le 1\}$
junto con el segmento $\{0\} \times [-1, 1]$. Mismo fenómeno: conexa, no conexa por caminos.

### 3.8 La jerarquía, y por qué en este libro casi nunca importa

$$\text{conexo por caminos} \;\subsetneq\; \text{conexo}$$

El libro dice que "para la mayoría de los espacios que encontraremos, son lo mismo". La razón
precisa (★):

> **Teorema.** Si $X$ es conexo y **localmente conexo por caminos** (todo punto tiene vecindades
> arbitrariamente chicas conexas por caminos), entonces $X$ es conexo por caminos.

Los grafos, los complejos simpliciales, las variedades, los abiertos de $\mathbb{R}^n$ y los
espacios finitos son localmente conexos por caminos, así que en ellos las dos nociones
coinciden. El peine falla en **un único punto**: $p$ no tiene vecindades chicas conexas por
caminos. **La grieta entre las dos definiciones es una patología local**, concentrada en un
punto donde el espacio se "acumula".

(Diagrama de Euler para la página: el círculo grande "conexos" contiene al círculo
"conexos por caminos", que contiene a los "localmente conexos por caminos y conexos". Ubicar
ejemplos: $\mathbb{R}$, $|K_5|$, el peine, la curva seno, Sierpiński, Sorgenfrey, que queda
afuera de todos.)

---

## Bloque 4. Union-find: el sistema de conjuntos disjuntos

### 4.1 El problema

Volvemos a los grafos con una pregunta algorítmica: **decidir si un grafo es conexo**. La idea
del libro es procesar las aristas **de a una** y mantener, en todo momento, la partición de los
vértices en componentes del grafo construido hasta ese momento (la relación de equivalencia de
1.4, construida incrementalmente).

- Al principio no hay aristas: $n$ componentes, cada vértice solo, $\{1\}, \{2\}, \dots, \{n\}$.
- Cada arista $(u, v)$ o bien **fusiona** dos componentes, o bien une dos vértices que **ya
  estaban** conectados.
- Al final, el grafo es conexo **si y solo si** queda un único conjunto, $[n] = \{1, \dots, n\}$.

**Importante:** el algoritmo **no modifica el grafo** ni lo "vuelve conexo"; solo **lleva la
cuenta** de la conectividad del grafo dado, arista por arista. (Esta fue la duda central en la
conversación con NotebookLM.)

**El tipo abstracto de datos.** Dos operaciones:

- `Find(i)`: devuelve el **nombre** del conjunto que contiene a $i$ (un representante).
- `Union(i, j)`: si $i$ y $j$ están en conjuntos distintos, los reemplaza por su unión.

`Find` sirve para saber si dos vértices ya están juntos: `Find(u) == Find(v)`.

### 4.2 Contar es demostrar: árboles, ciclos y números de Betti

**El argumento del libro.** Cada `Union` exitosa **reduce en uno** la cantidad de conjuntos. Se
empieza con $n$ y se termina con $1$ si el grafo es conexo: hacen falta exactamente $n - 1$
uniones exitosas. Las aristas que provocaron esas uniones forman un árbol generador (el
albañil de 1.7). Corolario: **todo árbol con $n$ vértices tiene $m = n - 1$ aristas.**

**La extensión que anticipa el capítulo IV (★).** Llevemos dos contadores:

- $\beta_0$ = cantidad de conjuntos al final = cantidad de **componentes**;
- $\beta_1$ = cantidad de aristas **rechazadas** (las que unían vértices ya conectados).

Cada arista o fusiona (y hay exactamente $n - \beta_0$ fusiones) o se rechaza. Entonces
$m = (n - \beta_0) + \beta_1$, es decir:

$$\boxed{\;n - m = \beta_0 - \beta_1\;}$$

Cada arista rechazada cierra **un ciclo nuevo, independiente de los anteriores**: $\beta_1$
cuenta los "agujeros" del grafo. $\beta_0$ y $\beta_1$ son los **números de Betti** del grafo,
y la fórmula es su **característica de Euler**. Sin decirlo, union-find está calculando la
**homología** del grafo en dimensiones 0 y 1, que es el tema del capítulo IV. (Verificado en el
prototipo sobre 300 grafos aleatorios y las tres estrategias.)

### 4.3 La representación: un bosque de árboles invertidos dentro de un arreglo

Cada conjunto se guarda como un **árbol con punteros hacia arriba** (*up-tree*): cada nodo
apunta a su padre, y la **raíz** es el nombre del conjunto. Todos los árboles viven en un
**arreglo lineal** $V[1..n]$, donde $V[i].\text{parent}$ es el padre de $i$.

La figura I.2 del libro muestra la idea clave: **el arreglo es el almacenamiento y el bosque es
el significado**. Los nodos pueden estar en cualquier orden en el arreglo; lo que importa son
los punteros. (Pieza interactiva central: las dos vistas, arreglo y bosque, sincronizadas en
vivo.) Quién es padre de quién no importa, mientras cada conjunto forme un único árbol.

Convención (p. 8): **la raíz se apunta a sí misma**, $V[r].\text{parent} = r$. Así no hace falta
un valor especial `null`.

### 4.4 La versión básica

```python
def find(i):
    if parent[i] != i:
        return find(parent[i])   # subir hasta la raíz
    return i

def union(i, j):
    x, y = find(i), find(j)
    if x != y:
        parent[x] = y            # la raíz x pasa a colgar de la raíz y
```

**La analogía de la empresa.** Cada conjunto es una empresa; la raíz es su director general.
`Find(i)` es "preguntarle a tu jefe, que le pregunta a su jefe, ... hasta llegar al director".
`Union` es una **fusión**: el director de una empresa pasa a reportarle al director de la otra.

**Ejemplo 1 (de las notas de NotebookLM, con los índices corregidos).** $n = 4$,
$E = \{(1,2), (2,3), (1,3), (3,4)\}$, versión básica.

| Paso | Arista | `Find` | Acción | `parent[1..4]` | Componentes |
|---|---|---|---|---|---|
| 0 | | | | `[1, 2, 3, 4]` | {1} {2} {3} {4} |
| 1 | (1,2) | 1 ≠ 2 | `parent[1] = 2` | `[2, 2, 3, 4]` | {1,2} {3} {4} |
| 2 | (2,3) | 2 ≠ 3 | `parent[2] = 3` | `[2, 3, 3, 4]` | {1,2,3} {4} |
| 3 | (1,3) | 3 = 3 | **rechazo**: cierra un ciclo | `[2, 3, 3, 4]` | {1,2,3} {4} |
| 4 | (3,4) | 3 ≠ 4 | `parent[3] = 4` | `[2, 3, 4, 4]` | {1,2,3,4} |

Una componente al final: **conexo**. Una arista rechazada: $\beta_1 = 1$ (el triángulo 1-2-3).
Sin la arista (3,4) habrían quedado dos conjuntos, $\{1,2,3\}$ y $\{4\}$: **desconexo**, y esos
conjuntos *son* las componentes.

Pero mirá el árbol final: es la cadena $1 \to 2 \to 3 \to 4$, de altura $3 = n - 1$. **Ese es el
problema** de la versión básica.

### 4.5 El peor caso de la versión básica

Con la secuencia `Union(1,2)`, `Union(1,3)`, ..., `Union(1,n)`, cada unión cuelga la raíz vieja
**debajo** del vértice nuevo, y el árbol degenera en una cadena de longitud $n - 1$. Cada `Find`
desde el fondo cuesta $n - 1$ pasos y el costo total se vuelve **cuadrático**.

Saltos de puntero medidos por el prototipo (unir todo y después $n$ veces `Find(1)`):

| $n$ | básica | por tamaño | por tamaño + compresión |
|---|---|---|---|
| 10 | 126 | 18 | 18 |
| 100 | 14 751 | 198 | 198 |
| 1 000 | 1 497 501 | 1 998 | 1 998 |

---

## Bloque 5. Mejorando el tiempo de ejecución

### 5.1 Unión por tamaño

**La regla:** siempre se cuelga el árbol **más chico** debajo del **más grande**. Cada raíz
guarda el tamaño de su árbol.

```python
def union(i, j):
    x, y = find(i), find(j)
    if x != y:
        if size[x] > size[y]:
            x, y = y, x          # x es siempre el árbol más chico
        parent[x] = y
        size[y] += size[x]
```

Convención de desempate del libro: si los tamaños son iguales, $x$ cuelga de $y$.

**Teorema.** *Con unión por tamaño, un árbol de $k$ nodos tiene altura a lo sumo $\log_2 k$.*

*Prueba (desarrollada, ★).* La profundidad de un nodo $v$ aumenta **solo** cuando la raíz de su
árbol se cuelga debajo de otra raíz, y eso solo ocurre si su árbol era el **más chico** (o del
mismo tamaño). En ese momento el árbol de $v$ se fusiona con otro al menos tan grande, así que
**el tamaño del árbol de $v$ por lo menos se duplica**. Empezando en tamaño 1 y sin poder
superar $k$, eso puede pasar a lo sumo $\log_2 k$ veces. ∎

**La imagen: cada vez que bajás un escalón, tu mundo por lo menos se duplica.** Bajar es caro
porque solo se baja al fusionarse con algo más grande. (Animación: el **árbol binomial**, que
se obtiene fusionando siempre árboles de igual tamaño, alcanza exactamente la cota: altura
$\log_2 k$. Es el peor caso de la unión por tamaño.)

En la analogía de la empresa: **en una fusión, el director de la empresa más chica le reporta
al de la más grande**. Así, la cadena de mando de cualquier empleado crece en un nivel solo
cuando su empresa al menos se duplica.

### 5.2 Compresión de caminos

**La regla:** cada vez que un `Find` recorre un camino hasta la raíz, **todos los nodos del
camino pasan a apuntar directamente a la raíz**.

```python
def find(i):
    if parent[i] != i:
        parent[i] = find(parent[i])   # encontrar la raíz y colgarse de ella
    return parent[i]
```

En el pseudocódigo del libro, `return V[i].parent = Find(V[i].parent)` hace las dos cosas en
una línea: la asignación devuelve el valor asignado. Es la recursión la que permite comprimir
**a la vuelta**: primero se baja hasta la raíz y, al regresar de cada llamada, se re-apunta
cada nodo.

**En la empresa:** después de escalar una consulta hasta el director, **todos los que
participaron de la cadena reciben línea directa con el director**. La burocracia se aplana sola,
justo donde se usa.

Efecto medido: árbol binomial de altura $\log_2 n$ y $n$ consultas `Find` sobre la hoja más
profunda.

| $n$ | básica | por tamaño | por tamaño + compresión |
|---|---|---|---|
| 16 | 64 | 64 | 18 |
| 128 | 896 | 896 | 133 |
| 1 024 | 10 240 | 10 240 | 1 032 |

La unión por tamaño acota **cada** consulta en $\log_2 n$; la compresión hace que, después de
la primera, las demás cuesten un solo salto.

### 5.3 Ejemplo 2 (de las notas de NotebookLM, verificado)

$n = 8$, unión por tamaño + compresión de caminos.

1. `Union(1,2)`: raíces 1 y 2, tamaños iguales: `parent[1] = 2`, `size[2] = 2`.
   `Union(3,4)`: igual, `parent[3] = 4`, `size[4] = 2`.
2. `Union(1,3)`: `Find(1)` sube $1 \to 2$ y devuelve 2; `Find(3)` devuelve 4. Tamaños 2 y 2,
   iguales: `parent[2] = 4`, `size[4] = 4`. Árbol: 4 con hijos 2 y 3; 1 cuelga de 2
   (profundidad 2).
3. `Union(5,6)`: `parent[5] = 6`, `size[6] = 2`.

   | $i$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
   |---|---|---|---|---|---|---|---|---|
   | `parent` | 2 | 4 | 4 | 4 | 6 | 6 | 7 | 8 |
   | `size` (raíces) | | | | 4 | | 2 | 1 | 1 |

4. `Union(1,5)`: **las dos mejoras en la misma llamada.**
   - `Find(1)` recorre $1 \to 2 \to 4$ y, a la vuelta, **comprime**: `parent[1] = 4`.
   - `Find(5)` recorre $5 \to 6$: raíz 6, tamaño 2.
   - Tamaños 4 > 2: **intercambio** ($x \leftrightarrow y$), así que el árbol de 6 (el chico)
     cuelga del de 4: `parent[6] = 4`, `size[4] = 6`.

   | $i$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
   |---|---|---|---|---|---|---|---|---|
   | `parent` | **4** | 4 | 4 | 4 | 6 | **4** | 7 | 8 |
   | `size` (raíces) | | | | **6** | | | 1 | 1 |

   Árbol: 4 con hijos 1, 2, 3 y 6; 5 cuelga de 6.
5. Un `Find(5)` posterior recorre $5 \to 6 \to 4$ y comprime `parent[5] = 4`: todos a
   profundidad 1.

### 5.4 El costo final: la inversa de Ackermann

Con las dos mejoras, una secuencia de $m$ operaciones sobre $n$ elementos cuesta a lo sumo una
constante por $m\,\alpha(n)$, donde $\alpha$ es la **inversa de la función de Ackermann**
(Tarjan, 1975; también se probó que esta cota no se puede mejorar en general). El libro no
demuestra el resultado; el análisis completo está en el texto de Tarjan citado en las notas.

**Cuán lento crece $\alpha$.** La función de Ackermann crece tan rápido que su inversa es, en la
práctica, una constante: según la variante exacta de la definición, $\alpha(n) \le 4$ para todo
$n$ que pueda escribirse en el universo físico. El libro lo dice así: para que $\alpha(n)$ supere
5 hacen falta más vértices que electrones en el universo. Teóricamente $\alpha(n) \to \infty$,
así que "tiempo constante por operación" es cierto en la práctica pero no en la teoría.

(Pieza visual sugerida: una "escalera de torres de potencias" que muestre los umbrales de
$\alpha$, con una escala logarítmica iterada que haga visible lo invisible.)

### 5.5 Resumen comparativo

| Estrategia | Altura máxima | Costo de $m$ operaciones |
|---|---|---|
| Básica | $n - 1$ | $\Theta(m\,n)$ en el peor caso |
| Unión por tamaño | $\log_2 n$ | $O(m \log n)$ |
| Tamaño + compresión | $\log_2 n$ (y se aplana con el uso) | $O(m\,\alpha(n))$ |

---

## Bloque 6. Ejercicio 1 y puentes

### 6.1 Ejercicio 1 del capítulo (p. 24)

*Union-find decide la conexidad en tiempo proporcional a $(n + m)\,\alpha(n)$.*

**(i) Un algoritmo en tiempo $n + m$.** La **ola** de 1.6: búsqueda en anchura (o en
profundidad) desde un vértice, con listas de adyacencia. Cada vértice entra a la cola una vez y
cada arista se mira dos veces (una por extremo): tiempo $O(n + m)$. Si la ola cubre los $n$
vértices, es conexo (y las aristas usadas son un árbol generador); si no, lo alcanzado y lo no
alcanzado son una separación.

**(ii) Calcular las componentes en tiempo $n + m$.** Se recorren los vértices en orden; cada
vez que uno no tiene etiqueta, se lanza una ola nueva desde él con una etiqueta nueva. Cada
vértice y cada arista se procesan una sola vez en total.

**Entonces, ¿para qué union-find?** Porque la ola necesita **todo el grafo de antemano**.
Union-find funciona **en línea**: las aristas llegan de a una, en cualquier orden, y en todo
momento se puede preguntar si dos vértices están conectados. Esa es exactamente la situación
de Kruskal y de la persistencia, donde las aristas llegan **ordenadas por un parámetro**.

### 6.2 Hacia adelante: persistencia en dimensión 0 (capítulo VII)

Tomemos una nube de puntos y un radio $\varepsilon$ que crece desde 0. Conectamos dos puntos
cuando su distancia es menor que $\varepsilon$. Procesar las aristas **ordenadas por longitud**
con union-find es lo mismo que ver crecer $\varepsilon$:

- cada `Union` exitosa es la **muerte de una componente** en el tiempo $\varepsilon$ = longitud
  de la arista;
- las aristas aceptadas forman el **árbol generador mínimo** (Kruskal);
- el registro de nacimientos (todos en 0) y muertes es el **código de barras** de la homología
  persistente en dimensión 0.

Cuando las componentes nacen en momentos distintos (filtraciones de funciones, capítulo VII),
la fusión sigue la **regla del mayor**: al fusionarse dos componentes, muere la **más joven**.
Es una variante de la unión por tamaño, pero por edad.

### 6.3 Hacia las finanzas

Con retornos de $N$ activos, la distancia de correlación $d_{ij} = \sqrt{2(1 - \rho_{ij})}$
(Mantegna, 1999) convierte el mercado en una nube de puntos. Union-find sobre las aristas
ordenadas por $d$ da:

- el **árbol generador mínimo** del mercado (la "columna vertebral" de correlaciones);
- el **clustering jerárquico de enlace simple** (*single linkage*), cuyo dendrograma **es** el
  código de barras de dimensión 0;
- con ventanas deslizantes en el tiempo, la **cantidad de componentes a un umbral fijo** como
  indicador de régimen: en crisis las correlaciones suben y el mercado "se conecta" antes.

### 6.4 Notas para formalización (Lean)

- **Lema de los apretones de manos** (suma de grados = 2m): primer contacto con Lean, existe en
  Mathlib (`SimpleGraph.sum_degrees_eq_twice_card_edges`).
- **Un árbol con $n$ vértices tiene $n - 1$ aristas:** también está en Mathlib (buscar en torno a
  `SimpleGraph.IsTree.card_edgeFinset`; verificar el nombre exacto en la versión instalada).
- **Proposición 1 (conexo ⟺ sin separación):** buen candidato a formalización **propia**, porque
  probablemente no esté en Mathlib con esta forma y su prueba es corta y constructiva.

---

## Apéndice: ejercicios propuestos (con pista)

1. Probá las equivalencias de 1.5 (las seis caracterizaciones del árbol). *Pista: contá aristas
   con union-find.*
2. Mostrá que la recta de Sorgenfrey no es conexa pero que $[0,1)$ con la topología usual sí lo
   es. *Pista: 3.5 y 3.6.*
3. Enumerá las 4 topologías de $\{a, b\}$ y decidí cuáles son conexas y cuáles conexas por
   caminos. *Pista: Sierpiński es conexo por caminos (3.3).*
4. ¿Es continua la composición de funciones continuas? Probalo con preimágenes y explicalo con
   la clave de las observaciones.
5. Construí, para cada $n$, una secuencia de uniones que haga que la unión por tamaño alcance
   altura exactamente $\lfloor \log_2 n \rfloor$.
6. Probá que si cada `Union` cuelga la raíz de **menor altura** (unión por rango), también vale
   la cota $\log_2 k$.
