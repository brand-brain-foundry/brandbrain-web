---
id: BBW-BEHAVIOR
title: "Constantes de algoritmo de los sistemas dinámicos — brandbrain-web"
type: canon
status: VIGENTE
version: 1.1
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-18
updated: 2026-09-18
verified_against_code: 2026-09-18@feat/fase6i-sombreador-de-fondo (src/behavior/weight-modulator.ts · src/behavior/optical-fit.ts · src/behavior/backdrop-shader.ts · src/components/molecules/HeroLock/ · src/components/molecules/HeroBackdrop/; origen de cada constante en `0_info/brandbrain-web/Eye Fish Landing.dc.html` y `blob-bg.js` por línea, inventariado en OUTPUT-BBW-2026-09-17-N1-A §1/§5/§7 y clasificado en OUTPUT-BBW-2026-09-17-N1-D §1/§4)
supersedes: []
superseded_by: null
related: [BBW-TYPOGRAPHY-WEIGHTS, BBW-DESIGN-EXCEPTIONS, BBW-PLAN-CONSTRUCCION, D-BBW-28, D-BBW-29, D-BBW-30, D-BBW-31, D-BBW-33, D-BBW-34, D-BBW-35, D-DOC-13]
summary: "Contrato del hogar de las constantes de algoritmo (D-BBW-30): un módulo declarado por sistema en src/behavior/, sin JSX ni CSS, que lista cada constante con su origen y su clase, y que LEE los tokens que ya existen por getPropertyValue (o por el valor computado donde el navegador los aplica) y jamás los repite. v1.0 (fase 6h, portado P1): S5 modulador de peso (weight-modulator.ts) y S7 ajuste óptico y puntero (optical-fit.ts). v1.1 (fase 6i, portado P2): S1 fondo, el sombreador WebGL2 de cuatro pasadas (backdrop-shader.ts) con su PROCEDENCIA (composición y código propios de Zavala, sin licencia de terceros: Q-BBW-008) y su presupuesto de resolución medido (D-BBW-34); rejilla de escritura del peso en S5 (HAL-BBW-16). Los sistemas P3–P5 añaden su módulo y su tabla aquí."
tags: [comportamiento, constantes, algoritmos, tokens, sombreador, procedencia, brandbrain-web]
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

## §2 — S5 · Modulador de peso del titular (`src/behavior/weight-modulator.ts`)

**Qué hace:** la palabra se parte en letras y cada una interpola su peso siguiendo una señal continua sin periodo, con la restricción de que
**Σ avances = presupuesto** (el ancho total nunca cambia: el grosor se redistribuye). Tres partes: señal (pura) → conservación por water-fill
de Newton contra la tabla de avances medida (pura) → calibración (mide el DOM). Inventario: N1 doc A §5.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `SAMPLES` | 9 | dc:L503 | estático | pesos muestreados por glifo al medir la tabla de avances, uniformes (100, 150, … 500 con los tokens de hoy) |
| `REFINE` | tolerancia 0,5 px · paso mínimo 1 unidad de peso · tope 64 medidas | fase 6h (no existe en el diseño) | estático (criterio técnico) | refinado de la tabla por bisección donde el avance medido en el punto medio se aparta de la recta más de la tolerancia. **Por qué:** la fuente tiene discontinuidades de avance por sustitución de glifo según el peso (`modulator-vf`: la `e` pierde 2,79 px de golpe entre 224,5 y 225, medido con las dos propiedades en el diseño y en la construcción); una tabla uniforme de 9 muestras no la ve y la conservación deriva (simulado 60 s sobre curvas medidas: −4,08…+1,01 px a 1728, 0,69 %; con el refinado −0,59…+0,47 px, 0,14 %, ningún cuadro fuera del ±0,1 % del inventario). La tolerancia queda por encima del ruido de cuantización del avance (pasos de 0,47–0,78 px por 2 unidades de peso → ≤ 0,22 px de error lineal en 50 unidades) y muy por debajo del salto; resultado hoy: 27 posiciones, 18 más que el diseño, todas concentradas alrededor de 225 |
| `PIN_FRAMES` · `PIN_STEP_S` | 40 · 0,45 s | dc:L518-519 | estático | cuadros simulados de la señal real (0…17,55 s) para anclar la caja al más ancho |
| `MIN_PIN_PX` | 20 | dc:L522 | estático | ancho mínimo para aceptar un anclaje |
| `SIGMA` | 0,34 | dc:L552 | **dinámico** | anchura de la joroba: cuántas letras engordan a la vez (carácter de la marca) |
| `BUMP` | 0,5 + 0,56·sin(0,58t) + 0,12·sin(1,31t + 1,7) | dc:L553 | **dinámico** | joroba errante (recorre −0,18…1,18 de la palabra); frecuencias en rad/s, inconmensurables: sin periodo |
| `GAUSS` | 2,5 · −1,1 | dc:L559 | **dinámico** | ganancia y desplazamiento de la gaussiana centrada en la joroba |
| `NOISE` | 0,52/0,83/2,19 · 0,34/1,27/0,77 · 0,21/2,03/4,11 | dc:L560-562 | **dinámico** | ruido por letra: amplitud, frecuencia (rad/s), fase por índice |
| `SIGMOID_K` | 1,9 | dc:L563 | **dinámico** | pendiente de la sigmoide; impide alcanzar los extremos exactos (observado 116–492) |
| `NEWTON` | 14 pasadas · 0,04 px · 0,001 px | dc:L570-584 | estático | tope de pasadas, tolerancia del presupuesto y pendiente mínima de la tabla |
| `REFIT_DELAYS_MS` | 60 · 700 · 1800 | dc:L449-451 | estático | re-calibraciones tras el montaje (patrón de carga de fuente; no son duraciones de UI: fuera de la retícula, N1 doc D §6) |
| `WEIGHT_GRID` | 0,5 | fase 6i (no existe en el diseño, que escribía un decimal: dc:L591) | estático (criterio técnico) | rejilla a la que se ajusta todo peso escrito o medido. **Por qué (HAL-BBW-16):** Chrome resuelve `font-weight` en cuartos de punto y los cubos **382,25 y 468,75 colisionan** (el segundo instanciado dibuja con el glifo del primero: ±12 px de avance en la palabra durante un cuadro a 52,56 px; 11–20 cuadros de cada 7 200 a 360 px; medido igual en 65,52 · 84 · 124 px). Un barrido de los 1 601 cuartos del eje no encontró otra pareja; con `font-variation-settings` no ocurre, pero D-BBW-29 escribe `font-weight`. La rejilla de medio punto excluye los dos cubos; el error de conservación que añade queda medido en el output 6i. Es la causa de HAL-BBW-15 / P-BBW-40 |

**Tokens que lee (nunca repite):** `--bbf-type-display-weight-from` / `-to` por `getPropertyValue` en `:root` (= WMIN/WMAX del diseño, madres
`--bbf-weight-display-anim-min/-max`); el **peso de reposo** como `font-weight` computado del titular (rol `--bbf-type-display-weight` =
`--bbf-weight-display-rest`, la fórmula (min + max) / 2 de la fase 5). **El reposo ES el peso de conservación**: el diseño fija el presupuesto en
s = 0,5 del eje (dc:L515), que con 100–500 es 300. El rol de quietud `--bbf-motion-loop-play-state` lo lee el componente.

**Lo que mide en ejecución (no se supone):** la tabla de avances por glifo y peso (n × 9 medidas uniformes + las del refinado: 27 relayouts
hoy, cada uno compartido por los n glifos), el presupuesto y la caja anclada; se re-mide al montar, en `document.fonts.ready`, en cada `loadingdone` del conjunto de fuentes (si la display llega tarde, la primera
tabla es de la de respaldo y la conservación sería falsa), a los 60/700/1800 ms y en cada `resize`. Cambiar palabra o fuente no exige recalibrar
nada a mano: se remuestrea sola. Lo que SÍ está calibrado a esta familia: `SIGMA`, `GAUSS`, `SIGMOID_K` (cuántas letras engordan y cuánto) y el
interletrado de la palabra (EXC-BBW-04).

## §3 — S7 · Ajuste óptico del rótulo y peso por puntero (`src/behavior/optical-fit.ts`)

**Qué hace:** el rótulo se interletra hasta que su ancho medido iguala el ancho **anclado** del titular (por eso la caja del titular no puede
reflotar); el sobrante tras la última letra se recorta con margen negativo. El puntero mueve el peso del rótulo dentro del rango de su familia y
lo tiñe de acento al acercarse. Inventario: N1 doc A §7 (el "tracking por puntero" del comentario del diseño no existe en su código).

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `OPTICAL_FIT.MIN_TARGET_PX` | 20 | dc:L601 | estático | ancho mínimo del titular para ajustar |
| `OPTICAL_FIT.MAX_TRACK_PX` | 40 | dc:L616 | estático | tope del interletrado medido |
| `OPTICAL_FIT.MIN_DELTA_PX` | 0,15 | dc:L617 | estático | cambio mínimo para reescribir (histéresis) |
| `POINTER_WEIGHT.REACH_MIN_PX` | 420 | dc:L470 | **dinámico** | alcance mínimo de la atracción (cae en ×105 de espaciado, pero ningún estilo lo consume: constante, no token; residual reportado) |
| `POINTER_WEIGHT.PULL_GAIN` · `LATERAL_GAIN` | 140 · 130 | dc:L473 | **dinámico** | cuánto engorda al acercarse; cuánto más a la derecha y menos a la izquierda |
| `POINTER_WEIGHT.LATERAL_SPAN` | 0,75 | dc:L472 | **dinámico** | fracción del ancho del lock que cubre el recorrido lateral |
| `POINTER_WEIGHT.WEIGHT_STEP` · `PULL_STEP` | 5 · 0,04 | dc:L474 | estático | histéresis de reescritura |
| `POINTER_WEIGHT.TINT_THRESHOLD` | 0,02 | dc:L802 | estático | atracción a partir de la cual el rótulo se tiñe (`data-pull="near"`, color por CSS) |

**Tokens que lee (nunca repite):** peso de reposo del rótulo como `font-weight` computado (rol `--bbf-type-lead-weight`); rango de la familia
de texto por `--bbf-weight-text-range-min/-max`. **Tokens que consume el CSS del componente** (no el módulo): interletrado inicial
`--bbf-type-lead-tracking` (hasta la primera medida; diseño 0,3em → ×7), transiciones `--bbf-motion-lead-weight-*` / `--bbf-motion-lead-tint-*`
(`semantic/motion.css`), tinte `--bbf-accent`.

## §4 — S1 · Fondo: sombreador WebGL2 de cuatro pasadas (`src/behavior/backdrop-shader.ts`)

**Procedencia (Q-BBW-008, respondida por Zavala el 2026-09-18).** Composición **propia de Zavala** en After Effects («SB_Blobs 2», 1920×1080)
→ réplica WebGL2 (`uploads/SB Blobs Background.html`) → elemento `<blob-bg>` (`blob-bg.js`) del export del canvas de diseño (2026-09-15) → el
módulo. Autoría de la composición y del código: Christian Zavala (Brand Brain Foundry). **Sin código de terceros y sin licencia externa** que
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

## §5 — Cómo entra un sistema nuevo (P3–P5)

1. Módulo `src/behavior/<sistema>.ts` con el objeto congelado, origen por línea y clase por constante; funciones puras separadas de las que
   tocan el DOM o la GPU.
2. Tabla en este documento con las mismas columnas; sección "tokens que lee".
3. Componente cliente que solo cablea, y que lee la quietud por el rol de reproducción correspondiente (`--bbf-motion-*-play-state`): con
   movimiento reducido y con la pestaña oculta el bucle se detiene y queda el reposo (D-BBW-31).
4. El HTML servido trae el estado de reposo del sistema; el output del despacho lo demuestra sobre `out/` (D-BBW-28).
5. Lo que el sistema sustituye se retira en el mismo commit (N1 doc C §4).

---
*BBW-BEHAVIOR v1.1 · `docs/system/BEHAVIOR.md` · 2026-09-18 · v1.1 en la fase 6i (`DESPACHO-BBW-2026-09-17-fase6i-P2-sombreador-de-fondo`: S1 con procedencia, D-BBW-33/34/35, HAL-BBW-16) · nace en la fase 6h (`DESPACHO-BBW-2026-09-17-fase6h-P1-modulador-de-peso`, D-BBW-30)*
