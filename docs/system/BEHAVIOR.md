---
id: BBW-BEHAVIOR
title: "Constantes de algoritmo de los sistemas dinámicos — brandbrain-web"
type: canon
status: VIGENTE
version: 1.6
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-18
updated: 2026-11-05
verified_against_code: 2026-11-05@feat/m1-imagotipo-vivo (v1.6: §12 nueva — S9 imagotipo vivo, Kirchhoff elastic rod simplificado, 6 tentáculos independientes, muelle amortiguado engage ζ=0.7 / release ζ=0.9; motor en src/behavior/brand-mark-octopus.ts; rig externo en media/masters/brand-icon-rig.json verificado por R10; referencia de §13 en el módulo corregida a §12; D-BBW-28/31) (src/behavior/brand-mark-octopus.ts · src/components/atoms/BrandMark/BrandMarkLive.tsx; origen de cada constante en DESPACHO-BBW-2026-11-05-M1-imagotipo-vivo §0.1/§4)
supersedes: []
superseded_by: null
related: [BBW-TYPOGRAPHY-WEIGHTS, BBW-DESIGN-EXCEPTIONS, BBW-PLAN-CONSTRUCCION, BBW-MEDIA, D-BBW-24, D-BBW-25, D-BBW-28, D-BBW-29, D-BBW-30, D-BBW-31, D-BBW-33, D-BBW-34, D-BBW-35, D-BBW-36, D-BBW-37, D-DOC-13]
summary: "Contrato del hogar de las constantes de algoritmo (D-BBW-30): un módulo declarado por sistema en src/behavior/, sin JSX ni CSS, que lista cada constante con su origen y su clase, y que LEE los tokens que ya existen por getPropertyValue (o por el valor computado donde el navegador los aplica) y jamás los repite. v1.0 (fase 6h, portado P1): S5 modulador de peso (weight-modulator.ts) y S7 ajuste óptico y puntero (optical-fit.ts). v1.1 (fase 6i, portado P2): S1 fondo, el sombreador WebGL2 de cuatro pasadas (backdrop-shader.ts) con su PROCEDENCIA (composición y código propios de Zavala, sin licencia de terceros: Q-BBW-008) y su presupuesto de resolución medido (D-BBW-34); rejilla de escritura del peso en S5 (HAL-BBW-16). v1.2 (fase 6j, portado P3): S2 vídeo, el seguimiento del sujeto (subject-tracking.ts): centroide de luminancia con exponente, suavizado, traslación acotada sobre el zoom, cadena de reintentos; con movimiento reducido el bucle no arranca; la garantía de D-BBW-25 re-medida con una cota sobre la ventana entera de traslación (velo 43 %, sin cambio). v1.3 (fase 6k, portado P4): S3/S4 partículas, el GENERADOR del campo (particle-field.ts, D-BBW-36: se porta el generador con los rangos, los planos y la distribución, no la tirada del export): 21 burbujas en tres planos con tres elementos anidados y dos animaciones con SUS tiempos (ascenso 13,7–28,3 s, oscilación 3,7–7,3 s: el error de la 6e corregido), 31 motas en tres planos con desenfoques distintos, posición horizontal por el promedio de tres muestras, semilla fija reproducible; con movimiento reducido las animaciones no arrancan y con la pestaña oculta se pausan por el mismo rol. v1.6 (M1): S9 imagotipo vivo, barra elástica de Kirchhoff simplificada con 6 tentáculos y rig externo."
tags: [comportamiento, constantes, algoritmos, tokens, sombreador, seguimiento, video, particulas, procedencia, brandbrain-web]
---

# Constantes de algoritmo de los sistemas dinámicos

> **Qué es:** el registro de las constantes que parametrizan un procedimiento (umbrales, exponentes, frecuencias, tolerancias, pasadas) y que
> **no son tokens de diseño** porque ningún estilo las consume. **Qué no es:** un segundo sistema de tokens. Los valores que un estilo consume
> (pesos, tamaños, duraciones, colores) viven en `src/styles/tokens/` y los módulos de aquí los **leen**, nunca los copian.

## §1 — Regla (D-BBW-30)

1. **Un módulo por sistema** en `src/behavior/<sistema>.ts`: objeto congelado con cada constante nombrada, su origen (`dc:Lnnn` = línea del
   export inventariado por el N1) y su clase por D-DOC-13 §2 (estático · plantilla · dinámico), más las funciones puras del algoritmo y las que
   miden el DOM (marcadas como tales). Sin JSX, sin CSS, sin texto.
2. **Los módulos leen los tokens que ya existen y nunca los repiten.** Dos formas, las dos por el navegador: `getComputedStyle(root).getPropertyValue('--bbf-…')`
   para un rol declarado en `:root`, o el valor computado de la propiedad donde el navegador lo aplica (p. ej. `font-weight` del titular = el
   rol `--bbf-type-display-weight`, que el CSS ya resolvió). Un número de peso, tamaño, duración o color dentro de un módulo es un defecto.
   Comprobación: `grep -nE '\b(25|100|300|400|500|700)\b' src/behavior/*.ts` no devuelve ninguna línea de valor (solo comentarios que citan
   el token equivalente).
3. **Los valores de marca dentro de un algoritmo** (los que un diseñador tocaría para cambiar el carácter: anchura de la joroba, ganancias
   del puntero, los vec3 del sombreador cuando llegue) viven en el módulo **marcados como dinámico** con referencia cruzada al token
   equivalente si lo hay. No se convierten en tokens: ningún estilo los consume, y dispersarlos por los componentes es lo que esta regla evita.
4. **El componente cliente solo cablea**: refs, eventos, ciclo de vida. El algoritmo no sabe de React; el componente no sabe de constantes.
5. **Guardia**: solo a la segunda necesidad (D-DOC-13 §3). Hoy la comprueban las guardias existentes: `check-typography-tokens.ts`
   (ningún `fontWeight:`/`fontSize:` numérico en `src/`), `check-typography-system.ts` R4 (ningún `wght` crudo) y `check-color-tokens.ts`
   (ningún color crudo). Fase 6i: los vec3 del sombreador (floats GLSL) no los ve ninguna guardia de color; la comprobación de este contrato es
   `grep` en el output de cada despacho (tabla ⇔ módulo, ningún token repetido). Guardia propia solo a la segunda necesidad real de bloquear
   algo (D-DOC-13 §3): hoy no hay defecto que haya escapado.

## §2 — S5 · Modulador de peso de la tercera línea del claim (`src/behavior/weight-modulator.ts`)

> ### ⏸ APAGADO Y REVERSIBLE desde 2026-09-22 (D-BBW-65)
>
> **Ninguna línea del claim se anima.** Las tres salen con el peso de reposo de su rol, que es el mismo que el HTML servido ya traía, así
> que lo que se ve ahora es exactamente lo que se veía sin JavaScript. **El módulo no se ha borrado ni tocado**: sigue entero, con su
> algoritmo, sus constantes y sus orígenes por línea del export. Lo que se retira es su **aplicación** desde `HeroClaim`.
>
> Es una **excepción declarada a I-6** (nada sin consumidor): Zavala pidió conservarlo porque puede volver. Un módulo sin consumidor y sin
> nota es basura; con nota es una pieza guardada, y el coste de guardarla es cero en el artefacto (nadie lo importa, así que no entra en
> ningún fragmento del build).
>
> **2026-11-02: `HeroClaim` ya no existe** (el claim salió del héroe por orden de Zavala); se recupera de la etiqueta de respaldo de `main`.
> **Qué hay que devolver para encenderlo**, todo en `src/components/molecules/HeroClaim/HeroClaim.tsx`: el reparto de la línea en glifos
> tras hidratar (con su `aria-label` y su restauración al desmontar), el bucle de `requestAnimationFrame` sobre `frame()`, el anclaje de
> la caja vía `calibrate()` —que es lo que impide que la línea empuje a sus hermanas— y la quietud por pestaña oculta y por movimiento
> reducido (D-BBW-31). En la hoja, `.glyph` y el `display: flex` + `contain: layout` de la línea viva. **El afinado del cuerpo con la
> medida real no hay que tocarlo**: se quedó en el componente porque era de la composición y no del movimiento.
>
> La tabla que sigue describe el módulo **tal como está escrito**, que es como sigue estando. Mientras el apagado dure, describe una
> capacidad disponible y no un comportamiento observable.


**Qué hace:** la línea se parte en letras y cada una interpola su peso siguiendo una señal continua sin periodo, con la restricción de que
**Σ avances = presupuesto** (el ancho total nunca cambia: el grosor se redistribuye). Tres partes: señal (pura) → conservación por water-fill
de Newton contra la tabla de avances medida (pura) → calibración (mide el DOM). Inventario: N1 doc A §5.

**Héroe rediagramado (D-BBW-47).** El módulo no cambia de algoritmo, cambia de sujeto: deja de animar **una palabra** (el titular) y pasa a
animar **la última línea de un claim de tres**, una frase con espacios y punto. La conservación es **por línea**: la caja anclada es la de esa
línea y las otras dos, el encabezado y la firma son hermanos que no se enteran. Dos cosas que la frase trae y la palabra no tenía, las dos
medidas en el turno: **el espacio es un glifo con avance** y hay que impedir que se colapse (HAL-BBW-24, `white-space: pre` en el glifo), y
**la discontinuidad de avance la tienen tres glifos**, no uno, con el refinado perdiéndola en cuerpos pequeños (HAL-BBW-25, fila `REFINE`).

*Tabla de constantes archivada en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-S5-tabla-2026-11-05 (S5 apagado, D-BBW-65). Se restaura aquí si S5 se reactiva.*


**Tokens que lee (nunca repite):** `--bbf-type-display-weight-from` / `-to` por `getPropertyValue` en `:root` (= WMIN/WMAX del diseño, madres
`--bbf-weight-display-anim-min/-max`); el **peso de reposo** como `font-weight` computado del titular (rol `--bbf-type-display-weight` =
`--bbf-weight-display-rest`, la fórmula (min + max) / 2 de la fase 5). **El reposo ES el peso de conservación**: el diseño fija el presupuesto en
s = 0,5 del eje (dc:L515), que con 100–500 es 300. El rol de quietud `--bbf-motion-loop-play-state` lo lee el componente.

**Lo que mide en ejecución (no se supone):** la tabla de avances por glifo y peso (n × 9 medidas uniformes + las del refinado: 27 relayouts
hoy, cada uno compartido por los n glifos), el presupuesto y la caja anclada; se re-mide al montar, en `document.fonts.ready`, en cada `loadingdone` del conjunto de fuentes (si la display llega tarde, la primera
tabla es de la de respaldo y la conservación sería falsa), a los 60/700/1800 ms y en cada `resize`. Cambiar palabra o fuente no exige recalibrar
nada a mano: se remuestrea sola.

**CÓMO se mide el ancho, y por qué no da igual (D-BBW-45, cierra HAL-BBW-22).** La palabra se mide con **`max-content`**, nunca con `auto`. Una caja
con `auto` **encoge para ajustarse** y por tanto **queda topada por el ancho disponible**: en cuanto la palabra no cabe, la medida devuelve el disponible
en vez del ancho real, y como el cuerpo se corrige con `objetivo × cuerpo / medido`, la corrección **se calcula a sí misma** y el cuerpo equivocado se
congela hasta que se recarga. Es exactamente lo que pasaba cuando la display llegaba tarde y la tabla salía de la de respaldo. `max-content` es el ancho
intrínseco y no lo topa el contenedor; además impide que los glifos, que son elementos flexibles, encojan durante la medida. **La calibración desconfía
de su propia medida:** compara el ancho real con el que daría la caja encogida y, si el topado coincide con el disponible —la firma del tope—, lo dice
por consola en desarrollo. **Los tres retardos NO son la red de seguridad:** con red lenta la fuente llega a los ~7,6 s, mucho después de los 1.800 ms;
quien salva la caja es `loadingdone`. El salto mientras tanto lo amortigua el respaldo con métricas ajustadas (`modulator-fallback`, ±1,5 %). Lo que SÍ está calibrado a esta familia: `SIGMA`, `GAUSS`, `SIGMOID_K` (cuántas letras engordan y cuánto) y el
interletrado de la palabra (EXC-BBW-04).

## §3 — S7 · Ajuste óptico del rótulo y peso por puntero — RETIRADO (D-BBW-47)

> Módulo retirado; `src/behavior/optical-fit.ts` no existe. Contenido archivado en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-S7-retirado-2026-11-05.

## §4 — S1 · Fondo: sombreador WebGL2 de cuatro pasadas (`src/behavior/backdrop-shader.ts`)

**Procedencia (Q-BBW-008, respondida por Zavala el 2026-09-18).** Composición **propia de Zavala** en After Effects («SB_Blobs 2», 1920×1080)
→ réplica WebGL2 (`uploads/SB Blobs Background.html`) → elemento `<blob-bg>` (`blob-bg.js`) del export del canvas de diseño (2026-09-15) → el
módulo. Autoría de la composición y del código: Christian Zavala Cubas (cadena de nombre única, D-BBW-58). **Sin código de terceros y sin licencia externa** que
respetar; entra en este repositorio público como código propio. Consta aquí y en la cabecera del módulo porque el repositorio es público.

**Qué hace:** cuatro lóbulos de color con unión suave derivan y respiran en un espacio anclado a la comp, se desenfocan (gaussiana separable),
se estiran con un zoom radial desvanecido, se componen sobre un fondo de cuatro colores, se gradúan por luminancia, se apagan hacia un **núcleo
negro cuyo borde deforman dos campos de ruido** (la pieza que impide que la frontera se lea como un círculo), se comprimen con un techo de tono y
reciben un grano temporal cuantizado. Cuatro pasadas, ninguna simplificada; las tres fuentes GLSL se generan desde las constantes (un solo
hogar) y son idénticas al original píxel a píxel (output 6i §F3: 0 píxeles distintos de 3,73 M en siete instantes). Inventario: N1 doc A §1.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `COMP` | 1920 × 1080 | bb:L9 | plantilla | tamaño de la comp de origen: toda ancla y longitud se escribe en px de esa comp |
| `COVER_EXP` | 0,7 | bb:L31-35 | estático | exponente de `coverK`: cuánto agrandan lóbulos y bordes las pantallas más altas que la comp |
| `G4_EPS` · `LUMA` · `GRADE_MIN_LUMA` | 1e−6 · Rec.709 · 0,001 | bb:L36-46, L177 | estático | épsilon del gradiente de cuatro colores; luminancia del grado; mínimo para no dividir por cero |
| `LOBES` | 4 anclas, 12 términos de deriva (amplitud px · rad/s), 4 radios, k 55/55/55/85 | bb:L67-78 | **dinámico** | composición y movimiento de esta marca |
| `BREATH` | ±10 % a 0,33 (seno) y 0,44 (coseno) rad/s | bb:L72-73 | **dinámico** | respiración de los radios |
| `EDGE` | 60 / −120 px | bb:L80 | **dinámico** | borde de los lóbulos (pleno a 120 px dentro, cero a 60 fuera) |
| `LOBE_COLORS` · `BG_COLORS` · `GRADE_COLORS` | 12 vec3 con sus anclas | bb:L82-86, L163-167, L171-175 | **dinámico · valor de marca** (D-BBW-35) | los colores del algoritmo; la rampa vista equivalente al lado (`sea-700` el verde, `deep-800` / `deep-900` los azules); ningún estilo los consume |
| `BLUR` | σ 12 px de comp (mín 1) · 8 muestras por lado · paso 1,5 · ×0,5 | bb:L103-109, L318 | plantilla (σ de AE) / estático | desenfoque gaussiano separable |
| `ZOOM` | centro (1531,4 · 431,4) · 0,105 · 24 muestras · caída 0,86 | bb:L150-161, L339-340 | **dinámico** (centro, cantidad) / estático (muestreo) | «CC Radial Blur Fading Zoom» |
| `CORE` | centro (0,5 · 0,52) · escala 1,45 · deformación 0,74 + 0,40·w1 + 0,16·w2 · campos 2,1 / 4,7 con derivas (0,026 · −0,019) / (−0,017 · 0,031) · bordes 0,10 / 2,05 · piso 0,015 | bb:L184-192 | **dinámico** | el núcleo negro deformado por ruido: **criterio de aceptación de la fase 6i** |
| `NOISE_FIELD` | hash (127,1 · 311,7 · 43758,5453123) · 3 octavas · lacunaridad 2,07 · ganancia ½ | bb:L130-141 | estático | ruido de valor y fbm |
| `TONEMAP` | x/(x+0,55)·1,55·exposure·2 · techo 0,34 | bb:L195-196 | **dinámico** | «el fondo nunca supera el 34 %» (citado en primitives/colors.css) |
| `GRAIN` | 12 pasos/s · hash 0,1031 / 31,32 · desplazamientos (137,31 · 57) / (311,7 · 113) | bb:L125-129, L198-203 | estático | grano temporal cuantizado |
| `INSTANCE` | exposure 0,38 · grade 0,42 · noise 0,045 · speed 0,42 · core 0,56 | dc:L56 | **dinámico** | valores con los que la página instancia el elemento; `speed` escala todo el tiempo (residual de la retícula, N1 doc D §6) |
| `BUDGET` | dprCap **1,0** (el diseño: 1,5) · chainScale 0,5 · minPx 2 | bb:L288-295 · D-BBW-34 | plantilla (coste-calidad) | presupuesto de resolución, elegido con medida (output 6i §F5): fps con todo animado 106 / 102 / 108 para 1,5 / 1,0 / 0,75 (no discriminan); campo sin grano de 1,0 frente a 1,5: 0,2/255 de media, 1,3/255 en p99,9; grano de 1,0: celda de 2 px de dispositivo (1 px CSS), σ +0,6/255. Criterio declarado antes de medir: campo p99,9 < 3/255 · Δσ grano < 1/255 · celda ≤ 1 px CSS → la más barata que cumple es 1,0 (0,75 pasa el campo pero su celda de 2,7 px se ve) |
| `CONTEXT` | antialias false · alpha false · low-power | bb:L217 | estático | atributos del contexto |

**Tokens que lee (nunca repite):** ninguno por valor. Reposo y respaldo = la superficie base por CSS del contenedor (`--bbf-surface-base`,
D-BBW-33); quietud por el rol `--bbf-motion-glow-play-state`, leído por el componente (D-BBW-31): con movimiento reducido y con la pestaña
oculta el bucle se cancela y el lienzo se oculta (queda la superficie base). Sin WebGL2 o con el contexto perdido: lo mismo, y la página sigue.

**Lo que cambia respecto al elemento del diseño sin cambiar la salida:** los uniformes se resuelven una vez (el diseño los buscaba por cuadro);
el tamaño sigue al contenedor por `ResizeObserver` y a la ventana por `resize` (el diseño re-medía en cada cuadro, forzando una disposición
junto al modulador); el reloj continuo se detiene con la pestaña oculta y con movimiento reducido (el diseño seguía). Coste medido con todo
animado en la máquina de referencia: output 6i §F5 (el diseño vivo: 52,7 fps).

## §5 — S2 · Vídeo: seguimiento del sujeto — RETIRADO 2026-11-02

> Módulo retirado; sale con el pez. Contenido archivado en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-S2-retirado-2026-11-05.

## §6 — S6 · Entrada con enfoque progresivo (sin módulo: todo es token)

**Qué hace:** cada pieza de la página nace desenfocada, desplazada y transparente, y se resuelve con la curva firma; el escalonado va **por
jerarquía** (fondo → escenario → cromo → marca → afirmaciones → pie), no por un índice uniforme. Inventario: N1 doc A §6 y doc B §13.

**Por qué NO tiene módulo en `src/behavior/`** (y por qué eso no es una excepción a D-BBW-30): este sistema **no tiene constantes de algoritmo**.
No hay umbral, exponente, tolerancia ni pasada: hay duraciones, retardos, un desplazamiento, dos desenfoques y una escala, y **todos son valores
que un estilo consume**, es decir, tokens. La regla del §1 dice dónde viven las constantes que ningún estilo consume; aquí no hay ninguna. El
sistema vive entero en `base/document.css` (una regla y un par de fotogramas clave), en `semantic/motion.css` (un rol de duración y otro de
retardo por pieza) y en la hoja de cada componente, que solo declara **a qué rol apunta su pieza**.

| Pieza | Duración | Retardo | Origen |
|---|---|---|---|
| fondo (`HeroBackdrop`) | ×10 = 2400 ms | ×1,5 = 120 ms | dc:L55 (2400 / 100) |
| escenario del vídeo (`HeroMedia`) | ×8,5 = 2040 ms | ×2,5 = 200 ms | dc:L63 (2000 / 200) |
| marca (`BrandMark`) | ×4 = 960 ms | ×3,5 = 280 ms | dc:L219 (900 / 260) |
| enlaces de la nav y conmutador | ×4 = 960 ms | ×5 = 400 ms + ×1,5 = 120 ms por enlace | dc:L695, dc:L256 (900 / 380 + 110·i) |
| titular | ×4,5 = 1080 ms | ×11 = 880 ms | dc:L789 (1100 / 880) |
| rótulo | ×4,5 = 1080 ms | ×12,5 = 1000 ms | dc:L805 (1100 / 1000) |
| afirmación 1 · afirmación 2 | ×4 = 960 ms | ×14,5 = 1160 ms · ×16 = 1280 ms | dc:L318, dc:L322 |
| aviso del pie · grupo legal | ×4 = 960 ms | ×16,5 = 1320 ms · ×18 = 1440 ms | dc:L851, dc:L856 |

**Desenfoque y escala:** 10 px → paso ×3 de espaciado (12) para todas las piezas; el escenario lleva 22 px → el desenfoque de la hoja (24) y
una **escala inicial de 1,05**, que es el único residual del sistema y vive como madre en `primitives/motion.css` (D-BBW-38).

**Movimiento reducido (D-BBW-31):** la entrada **no arranca**: `base/document.css` retira la animación entera bajo la preferencia. Colapsar solo
la madre de duración dejaba la animación en 0,04 ms, que es imperceptible pero **medible**: en el primer `requestAnimationFrame` el estilo
computado era todavía el inicial, porque una animación CSS fija su inicio en el fotograma siguiente al que se aplica. Un fotograma de destello es
justo lo que el criterio no quiere.

**Coste (output 6l):** con todo resuelto no cuesta nada medible (117,6–118,9 fps con todo animado, frente a 120 sin las piezas de entrada); en el
**arranque sí se nota**: 173–290 ms de tareas largas en el primer segundo y medio, frente a 0–75 ms sin las entradas. Es el desenfoque animado
sobre trece piezas, dos de ellas a pantalla completa (el lienzo del fondo y el escenario del vídeo).

## §7 — S3/S4 · Partículas: burbujas y nieve marina (`src/behavior/particle-field.ts`)

**Qué hace:** GENERA el campo (D-BBW-36). El export trae los 52 valores concretos, pero son una tirada aleatoria del generador del original, no
un diseño: se porta **el generador** con los recuentos, los rangos por plano y la distribución del diseño, con **semilla fija** (una compilación
produce siempre el mismo campo: HTML completo, D-BBW-09/28, y medida repetible, D-BBW-25). El módulo emite **solo números normalizados 0..1**;
la hoja del componente los lleva a los rangos de las madres. Inventario: N1 doc A §3 (burbujas) y §4 (nieve marina); clasificación: N1 doc D §3.
Todo lo que se ve (tamaños, opacidades, desenfoques por plano, recorridos, tiempos, tintes, alfas, proporciones de la esfera) es token.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `SEED` | 0x6e5f4b3a | fase 6e | plantilla | semilla del generador determinista (mulberry32): cualquier valor sirve; cambiarla cambia la disposición y obliga a re-medir el contraste |
| `COUNTS` | motas 16 / 10 / 5 · burbujas 11 / 7 / 3 | dc:L77-107, L110-214 (N1 doc A §3.3, §4.3) | **dinámico** | recuentos por plano de foco: composición de esta marca (31 motas, 21 burbujas) |
| `X_SAMPLES` | 3 | descripción de Zavala (N1 doc A §7.4: el código del export ya trae la tirada, no el generador) | **dinámico** | muestras uniformes que se PROMEDIAN para la posición horizontal: la media de tres uniformes concentra el campo hacia el centro en vez de repartirlo plano (el export lo muestra: burbujas 29–90 %, motas 12–77 %, medias ≈ 55 % y 51 %) |
| `DECIMALS` | 3 | fase 6e | estático | decimales de cada número normalizado escrito en el HTML |
| (uniforme) | tamaño · opacidad · deriva · fase · duración · oscilación | dc:L77-214 | estático (forma de la tirada) | el resto de campos son uniformes dentro del rango de su plano; cada partícula consume el mismo número de muestras en el mismo orden, así el campo es estable ante cambios de recuento de otro plano |

**Tokens que lee (nunca repite):** ninguno por valor. Los consume el CSS del componente (`HeroParticles.module.css`): rangos de tamaño y
opacidad por plano, desenfoques 0 / 0,3 / 3 (burbujas) y 0 / 0,8 / 4,5 (motas), deriva ±2,9vw, unidad del vaivén `max(--bbf-space-2, 0,85vw)` × 0,55
(`primitives/particles.css` · `semantic/particles.css`); **tiempos por sistema** en `primitives/motion.css`: motas ×150…×362,5 (36–87 s), ascenso de
las burbujas ×57…×118 (13,7–28,3 s), oscilación ×15,5…×30,5 (3,7–7,3 s, `ease-in-out`, claves 0/25/75/100) — los cuatro extremos caen en la
retícula con |Δ| ≤ 20 ms; **proporciones** (D-BBW-37): mota +8 % → −42 % de la altura del campo con meseta 16–84 %; burbuja: envoltorio a −10 %,
nace a +12 % con escala 0,6 y muere a −104 % con escala 1, meseta 12–84 %; esfera: brillo en 33 %/27 %, paradas 34 %/62 %/100 %, borde de línea
al alfa de su plano (0,46 / 0,38 / 0,26), sombra interior. Las mesetas viven en los fotogramas clave (forma, D-BBW-37 c). La quietud (D-BBW-31) va
por el rol `--bbf-motion-particles-play-state` en los tres elementos animados: con movimiento reducido es `paused` desde la raíz y las animaciones
**no arrancan** (cada partícula queda en su fase: el reposo, D-BBW-28); con la pestaña oculta el reloj cliente `HeroParticlesClock` fija el mismo rol
en el campo y lo retira al volver. Sin más JavaScript: el campo viaja en el HTML y anima por CSS.

> Notas de fases cerradas (6e ✅, 6k ✅) archivadas en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-notas-fases-2026-11-05.

## §8 — Sombras de texto (P-BBW-31, cerrado en la 6l)

El mapeo elemento → sombra que faltaba desde la 6a lo dejó inventariado el N1 (doc B §11) y las seis sombras del diseño caen en los cuatro pasos
que `primitives/shadows.css` ya tenía. Se asignan **por rol tipográfico** (`--bbf-type-<rol>-shadow`, `semantic/typography.css`), nunca por
palabra. **No son la garantía de legibilidad** (D-BBW-25 lo dice expresamente) y el velo local sigue calibrado sin contar con ellas; lo que las
sombras darían si contaran está medido en el output 6l §5.

## §9 — Cómo entra un sistema nuevo (P5)

1. Módulo `src/behavior/<sistema>.ts` con el objeto congelado, origen por línea y clase por constante; funciones puras separadas de las que
   tocan el DOM o la GPU.
2. Tabla en este documento con las mismas columnas; sección "tokens que lee".
3. Componente cliente que solo cablea, y que lee la quietud por el rol de reproducción correspondiente (`--bbf-motion-*-play-state`): con
   movimiento reducido y con la pestaña oculta el bucle se detiene y queda el reposo (D-BBW-31).
4. El HTML servido trae el estado de reposo del sistema; el output del despacho lo demuestra sobre `out/` (D-BBW-28).
5. Lo que el sistema sustituye se retira en el mismo commit (N1 doc C §4).

---
*BBW-BEHAVIOR v1.4 · `docs/system/BEHAVIOR.md` · 2026-09-18 · v1.4 en la fase 6l (`DESPACHO-BBW-2026-09-18-fase6l-P5-entradas-sombras-y-lockup`: S6 entradas con enfoque progresivo, sin módulo porque no tiene constantes de algoritmo; sombras de texto por rol, P-BBW-31 cerrado; D-BBW-38/39) · v1.3 · `docs/system/BEHAVIOR.md` · 2026-09-18 · v1.3 en la fase 6k (`DESPACHO-BBW-2026-09-18-fase6k-P4-particulas-fieles`: S3/S4 partículas, D-BBW-36/37) · v1.2 en la fase 6j (`DESPACHO-BBW-2026-09-18-fase6j-P3-seguimiento-del-sujeto`: S2 seguimiento del sujeto) · v1.1 en la fase 6i (`DESPACHO-BBW-2026-09-17-fase6i-P2-sombreador-de-fondo`: S1 con procedencia, D-BBW-33/34/35, HAL-BBW-16) · nace en la fase 6h (`DESPACHO-BBW-2026-09-17-fase6h-P1-modulador-de-peso`, D-BBW-30)*

## §10 — Recorte del titular: por qué la mitad vive en el arnés (D-BBW-40, fase 6m)

**El defecto (HAL-BBW-20).** A 360 px `deepbrand` pedía 374,5 px con la guarda `14.6vw`, que se había calibrado contra `Creative`; el bloque
deja 328 y el héroe recortaba 7,3 px por lado. **Ninguna guardia lo veía**, y no por descuido: el documento **no desborda**
(`scrollWidth == clientWidth` en los cinco anchos) porque el héroe tiene `overflow: hidden`. El recorte es invisible para cualquier
comprobación que mire el documento.

**Lo que SÍ vive en una guardia de código** (`scripts/lint/check-typography-system.ts`, R9): la **causa**, no el síntoma. R9 obliga a que el
margen de seguridad esté declarado a los dos lados del punto de corte con suelo de 16 px, a que toda guarda `-fit-unit` derive de
`--bbf-lockup-target` **sin ningún literal de longitud**, y a que todo rol de borde (`-pad`, `-side`, `-page`) tome `max(var(--bbf-space-safe), …)`.

**Fase 7b (D-BBW-42): el ancho deja de ser un TOPE y pasa a ser la INVARIANTE.** Las guardas ya no miden contra el ancho *disponible* sino
contra el ancho *objetivo* (`--bbf-lockup-target`), que es el que el lockup tenía en el diseño — `--bbf-lockup-width-per-size` (5,93013 px de
lockup por px de cuerpo del titular, medido en el export en nueve anchos con amplitud del 0,0139 %) por `--bbf-size-display` — con el
disponible como **suelo de seguridad**. La guardia crece con un apartado (d) que ata el propio objetivo al disponible y a la razón medida,
**sin literales**: sin él, (b) sería aflojar la regla, porque bastaría escribir el objetivo a mano para saltarse D-BBW-40. Comprobada contra
las dos regresiones (objetivo escrito a mano, y objetivo que se salta el margen): las caza.

Comprobado que detecta las dos formas de la regresión: devolver `14.6vw` a la guarda da dos errores R9, y quitarle el suelo a `--bbf-bar-side`
da uno.

**Lo que NO puede vivir en una guardia, y se dice en vez de fingirlo:** que la palabra **quepa**. Exige la familia display cargada (la sirve
Adobe en ejecución), disposición resuelta y el modulador calibrado. No hay navegador en el proceso de verificación y añadir uno es una
dependencia nueva. **Queda como paso del arnés**, y este es el paso:

1. Servir `out/` en la raíz con rangos HTTP (`pnpm preview:serve`; sin rangos el vídeo se queda en `readyState 0`).
2. Un `iframe` por ancho de {360, 780, 1000, 1728, 1920}, con la **pestaña visible** (si no, `requestAnimationFrame` no corre).
3. Esperar `document.fonts.ready` y ~3 s (la calibración del modulador tiene retardos a 60/700/1800 ms).
4. Por ancho, medir la **tinta** y no la caja: extremos de los `span` de letra del titular menos el interletrado sobrante; para el rótulo, su
   caja menos el interletrado (que se aplica también tras la última letra); para cabecera y pie, sus hijos visibles recortados por todo
   antecesor con `overflow` distinto de `visible` (si no, la onda de 160 px del subrayado da un falso positivo).
5. Comprobar: margen mínimo de tinta ≥ `--bbf-space-safe` en los cinco anchos, y `scrollWidth == clientWidth`.
6. Repetir con los `<script>` retirados (`srcdoc` + `<base>`): es el estado **servido**, donde manda la guarda derivada sola.

Valores de referencia de la 6m: margen mínimo de tinta 16,05 px (360) · 21,48 (780) · 32,00 (1000) · 40,00 (1728 y 1920), desborde 0 en todos;
servido, 20,00 px a 360 con el titular a 37,963 px y 270 px de ancho sobre 328 disponibles.

## §11 — S8 · Campo del criterio (`src/behavior/criterio-field.ts`, 2026-11-02)

**Qué hace:** una rejilla de puntos donde corren carriles de «texto». Cada 4,1 s una consulta barre una banda de carriles con un cursor,
enciende los aciertos, la cierra con dos corchetes, saca a la derecha una barra por carril y se disuelve punto a punto. Conducta escrita en
`OUTPUT-BBW-2026-11-01-F0` §4 (hub); **implementación propia**: el archivo de la referencia (`criterio-field.js`) no se abrió (C14). PRNG
mulberry32 y hash entero propios, deterministas por semilla. El componente `CriterioField` (molecule cliente) solo cablea.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `SEED` | 0x5a7cc0b5 | propio | plantilla | semilla; cambiarla cambia la disposición, no la conducta |
| `DOT` | 3 px | F0 §4.0 | dinámico | lado del punto; el paso es aparte |
| `WIDE_MIN_W/H` · `LINE_DIVISIONS` | 480 × 160 · 7 | F0 §4.1 | plantilla | modo amplio: paso = interlineado del primer párrafo / 7, y un carril por línea del párrafo |
| `LANE_STEP_WIDE/NARROW` · `NARROW_PITCH` · `NARROW_FIRST_ROW` | 7 · 4 · 4 px · 1 | F0 §4.0, §4.1 | plantilla | separación de carriles en filas; paso fijo del estrecho |
| `DPR_CAP` | 2 | F0 §4.1 | estático | densidad máxima del lienzo |
| `EDGE_WIDE/NARROW` | 28 · 14 columnas | F0 §4.1 | dinámico | borde suave por azar fijo; el amplio no suaviza la derecha (el campo sale de la página) |
| `PATTERN_LENGTH` · `RUN_*` · `GAP_*` · `DEPTHS` · `SPARSE_SHARE` · `STRONG_SHARE` | 2048 · 2 + ⌊r₁r₂·34⌋ · 6 + ⌊r^1,5·110·g⌋ (g 0,35/0,75, corte 40 filas) · 0,94/0,86/0,74 · 25 % · 16 % | F0 §4.2 | dinámico | patrón cíclico de cada carril |
| `LIVE_WINDOW_S` · `LIVE_SHARE` · `FRAME_MS` | 2,6 s · 34 % · 100 ms | F0 §4.2, §4.4 | dinámico / estático | carriles vivos avanzan una posición por fotograma; 10 fps con `setTimeout` |
| `QUERY_*` · `SWEEP_END_S` · `RESULT_END_S` · `DISSOLVE_START_S` | 1,2 / 4,1 / 3,38 s · 0,76 · 1,18 · 2,48 s | F0 §4.3 | dinámico | línea de tiempo de la consulta |
| `BAND_*` · `BAR_*` · `HIT_EXTRA_SHARE` · `TRAMA_EVERY` | ver módulo | F0 §4.3 | dinámico | banda, barras, aciertos y trama |
| `STILL_AT_S` | 2,7 s | F0 §4.4 | estático | fotograma único con movimiento reducido |

**En el héroe oscuro (2026-11-02):** ocupa el ESCENARIO que tenía el vídeo del pez (misma geometría, máscara radial y entrada). Como el escenario
pasa por debajo del bloque de texto, el módulo lee el borde derecho del bloque y **los carriles nacen a su derecha** (`Geometry.start`), con el
borde suave contado desde ahí. Medido antes de esta regla: con el campo bajo los párrafos el contraste caía a **1,67** a 1440 (el cursor claro
pasando bajo el texto); con ella, el peor píxel de fondo bajo el texto da **≥ 5,65**, y **≥ 9,95** cuando además la zona de texto pasa por encima de la viñeta (cinco anchos, seis tomas por ancho, D-BBW-25).

**Tokens que lee (nunca repite):** `--bbf-field-lane`, `--bbf-field-lane-live`, `--bbf-field-read`, `--bbf-field-hit` y `--bbf-text-on-base`,
resueltos por el navegador en un elemento sonda; la quietud por `--bbf-motion-loop-play-state`.

**Quietud (D-BBW-31, I-9):** con movimiento reducido se pinta UN fotograma (una consulta resuelta) y el bucle **no arranca**; se repinta si
cambia el tamaño o cargan las fuentes. Con la pestaña oculta el reloj se detiene y, al volver, sigue donde estaba. **HTML servido:** la placa
vacía, que es su reposo (decorativo, `aria-hidden`: no hay texto que perder, I-4).

## §12 — S9 · Imagotipo vivo (`src/behavior/brand-mark-octopus.ts`, M1 · 2026-11-05)

**Qué hace:** en reposo el SVG oficial del imagotipo se muestra inline en color acento (`--bbf-accent`). Al pasar el puntero o tocar (`touchstart`), un lienzo canvas superpone la visualización animada de la misma forma: los 6 tentáculos oscilan independientemente con física de **barra elástica de Kirchhoff simplificada** (desplazamiento perpendicular al eje anchor→tip, envolvente `sNorm^1.5`, suma de dos sinusoides de fases y frecuencias distintas por tentáculo). Al soltar, cada tentáculo vuelve a su posición con un pequeño escalonado de retardo (`releaseDelay`). Con movimiento reducido: solo cambia el color del SVG; el motor no arranca.

**Rig externo:** los límites de arco (`fromFrac`/`anchorFrac`/`tipFrac`/`toFrac`) y los parámetros físicos (`a1`, `w1`, `a2`, `w2`, `phase`, `releaseDelay`) de cada tentáculo viven en `media/masters/brand-icon-rig.json`, verificados en cada commit por la guardia R10 (`scripts/lint/check-brand-mark-rig.ts`; R10a–R10e: schema, longitud de arco ±1 %, orden de fracciones, no solapamiento, distancia tip–centro). El rig se embebe en el módulo como constante congelada.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `SPRING_K_ON` | 12 | M1 §0.1 | plantilla | rigidez del muelle al hacer hover (subamortiguado, overshoot pequeño) |
| `SPRING_ZETA_ON` | 0.7 | M1 §0.1 | plantilla | amortiguamiento al hacer hover |
| `SPRING_K_OFF` | 6 | M1 §0.1 | plantilla | rigidez del muelle al soltar (sobrecontenido, retorno suave) |
| `SPRING_ZETA_OFF` | 0.9 | M1 §0.1 | plantilla | amortiguamiento al soltar |
| `AMPLITUDE_MAX` | 14 u | M1 §0.1 | dinámico | desplazamiento máximo en la punta del tentáculo (u del SVG, viewBox 263.2×271.5) |
| `ENV_EXP` | 1.5 | M1 §0.1 | estático | exponente del taper de Kirchhoff: sNorm^1.5 (nulo en anclaje, máximo en punta) |
| `SAMPLE_N` | 600 | M1 §0.1 | dinámico | puntos de muestreo del camino completo (error ≤ 0.25 u con κ ≤ 0.1) |
| `DPR_CAP` | 2 | M1 §0.1 | estático | densidad de píxeles máxima del lienzo |
| `AMP_MIN_VISIBLE` | 0.01 | M1 §0.1 | estático | amplitud mínima para mostrar el lienzo (evita repintado en reposo) |
| `TOUCH_HOLD_MS` | 2 000 ms | M1 §4.11 | plantilla | duración de la animación de despertar táctil antes de volver al reposo |

**Tokens que lee (nunca repite):** `--bbf-motion-octopus-play-state` (quietud; D-BBW-31); el color se lee de `getComputedStyle(svgEl).color` (el token `--bbf-accent` / `--bbf-text-on-base` resuelto por el navegador durante la transición CSS del enlace).

**HTML servido (D-BBW-28):** el SVG inline (`<path fill="currentColor" d={...}/>`) sale en el HTML desde el primer byte. El lienzo no existe en el HTML servido; lo crea el componente cliente y solo aparece cuando la amplitud supera `AMP_MIN_VISIBLE`. Con movimiento reducido el motor no arranca y el SVG es el único elemento visible.

**Quietud (D-BBW-31):** `--bbf-motion-octopus-play-state: paused` → `isStill()` devuelve `true` → el motor no arranca. Con la pestaña oculta (`visibilitychange`) el bucle rAF se cancela; al volver, si hay amplitud activa, se reanuda. CLS=0: el lienzo es `position:absolute; inset:0` sobre el flujo del SVG.
