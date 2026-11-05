---
id: BBW-BEHAVIOR-HISTORY
title: "BEHAVIOR — secciones archivadas (brandbrain-web)"
type: history
status: VIGENTE
version: 1.0
owner_repo: bbf-command-hub
subject_repo: brandbrain-web
created: 2026-11-05
updated: 2026-11-05
related: [BBW-BEHAVIOR, P-BBW-77, D-BBW-47, D-BBW-65]
tags: [history, behavior, brandbrain-web, P-BBW-77]
---

# BEHAVIOR — secciones archivadas

Archivo de secciones retiradas o suspendidas de `docs/system/BEHAVIOR.md`.
Cada sección está archivada verbatim (byte-equivalencia verificada con diff vacío en 2026-11-05).
Ninguna de estas secciones se importa en `CLAUDE.md`.

---

## §§BEHAVIOR-S5-tabla-2026-11-05

Tabla de constantes de §2 S5 · Modulador de peso — archivada 2026-11-05.
S5 ⏸ apagado (D-BBW-65). Se restaura íntegra en `BEHAVIOR.md` §2 si S5 se reactiva.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `SAMPLES` | 9 | dc:L503 | estático | pesos muestreados por glifo al medir la tabla de avances, uniformes (100, 150, … 500 con los tokens de hoy) |
| `REFINE` | tolerancia **0,00485 em** · paso mínimo 1 unidad de peso · tope 64 medidas | fase 6h, corregida a em en el héroe rediagramado (no existe en el diseño) | estático (criterio técnico) | refinado de la tabla por bisección donde el avance medido en el punto medio se aparta de la recta más de la tolerancia. **Por qué:** la fuente tiene discontinuidades de avance por sustitución de glifo según el peso. Medido en este repo sobre los 17 glifos del claim, barriendo los 801 pesos de medio punto del eje: el corte está en **224,73** y lo tienen **`e`, `s` y `S`** (la 6h solo conocía la `e`), con un salto de **0,02373 em**; los otros catorce están limpios. Una tabla uniforme de 9 muestras no lo ve y la conservación deriva (simulado 60 s sobre curvas medidas: −4,08…+1,01 px a 1728, 0,69 %; con el refinado −0,59…+0,47 px, 0,14 %). **La tolerancia va en em y no en píxeles**, y la razón es geométrica: para un ESCALÓN, la desviación del punto medio respecto de la cuerda vale `salto/2` **en todos los niveles** de la bisección —no decrece al acercarse—, así que el refinado continúa si y solo si `salto/2 > tolerancia`; como el salto escala con el cuerpo, un umbral absoluto solo dispara por encima de ~105 px de cuerpo (HAL-BBW-25). El valor **no cambia**: 0,00485 em es los 0,5 px de la 6h al cuerpo que el titular tenía entonces (103,17 px), dicho en la unidad en la que era cierto. Queda por encima del ruido de cuantización (≤ 0,00214 em) y por debajo de medio salto (0,01187 em). Resultado: **27 posiciones y hueco de 1 unidad de peso sobre el corte en los cinco anchos**, sin acercarse al tope |
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
---

## §§BEHAVIOR-S7-retirado-2026-11-05

§3 S7 · Ajuste óptico del rótulo y peso por puntero — RETIRADO (D-BBW-47); archivado 2026-11-05.
`src/behavior/optical-fit.ts` no existe.

## §3 — S7 · Ajuste óptico del rótulo y peso por puntero — **RETIRADO** (D-BBW-47)

El módulo `src/behavior/optical-fit.ts` **ya no existe**. Cerraba el rótulo al ancho anclado del titular resolviendo su tamaño con la razón de
interletrado como invariante (D-BBW-41), y teñía y engordaba el rótulo según la distancia del puntero. Las dos cosas eran del **lockup de dos
líneas que cerraban entre sí**; el héroe rediagramado lo sustituye por un claim de tres líneas alineadas a la izquierda que no cierran contra
nada, así que el sistema se queda sin sujeto y sale en el mismo commit que entra su sustituto (I-6). Con él salen la excepción **EXC-BBW-02**
(y su registro en `DESIGN_EXCEPTIONS.md`), los roles `--bbf-type-lead-*`, las madres `--bbf-size-lead-*`, `--bbf-tracking-lead-lock-ratio` y
`--bbf-advance-text-max`, y las transiciones `--bbf-motion-lead-*`. Su única constante que sigue viva, `MIN_DELTA_PX` (0,15, la histéresis del
afinado del cuerpo, `dc:L617`), se muda a `WEIGHT_MODULATOR.REFIT_MIN_DELTA_PX`, que es su único consumidor desde entonces.

---

## §§BEHAVIOR-S2-retirado-2026-11-05

§5 S2 · Vídeo: seguimiento del sujeto — RETIRADO 2026-11-02; archivado 2026-11-05.
Sale con el pez; recuperable de la etiqueta de respaldo de `main`.

## §5 — S2 · Vídeo: seguimiento del sujeto — **RETIRADO el 2026-11-02** (sale con el pez; recuperable de la etiqueta de respaldo de `main`)

**Qué hace:** cada `PERIOD_MS` (y en cada `timeupdate`) dibuja el fotograma en un lienzo de 96×54, calcula el **centroide de luminancia** con un
exponente que pesa lo claro por encima de lo oscuro (sin él la neblina del fondo arrastra el centroide al centro y el seguimiento deja de
perseguir nada, dc:L413), lo suaviza con un filtro exponencial y **traslada el encuadre de forma acotada** sobre una escala algo mayor que uno:
la holgura es exactamente la mitad del sobrante del zoom, así la traslación nunca descubre el borde del vídeo. Tres partes: centroide y
suavizado (puras) → encuadre y cadena de transformación (puras) → muestreador (lee el fotograma). Inventario: N1 doc A §2; clasificación: N1 doc D §2.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `ZOOM` | 1,08 | dc:L391 | **dinámico** | «cuánto sobra para poder seguir»: escala del vídeo dentro del escenario; acota la traslación. Residual de la retícula (N1 doc D §2: no cae en ninguna escala y ningún estilo lo consume): constante del módulo, no madre |
| `SAMPLE` | 96 × 54 | dc:L401 | estático | lienzo de muestreo: 16:9 mínimo con precisión suficiente |
| `PERIOD_MS` | 70 | dc:L661 | estático | periodo de muestreo en el bucle de cuadros (a 120 Hz: una muestra cada 75 ms); además una muestra por `timeupdate` (dc:L665, ≈ 4/s). Periodo de muestreo, no duración de UI: fuera de la retícula (N1 doc D §6) |
| `LUMA` | Rec.709 | dc:L412 | estático | luminancia sobre el valor codificado; misma fórmula que el sombreador y el modelo de contraste |
| `THRESHOLD` | 0,1 | dc:L414 | plantilla | umbral bajo el cual el píxel no pesa (depende del vídeo: negro con sujeto) |
| `EXPONENT` | 2,4 | dc:L414 | plantilla | exponente del peso: pesa lo claro por encima de la neblina |
| `MIN_MASS` | 0,6 | dc:L418 | plantilla | masa mínima del cuadro para actualizar: evita saltos en cuadros casi negros (este vídeo: 123–162 en todos sus 192 fotogramas, nunca por debajo) |
| `SMOOTHING` | 0,085 | dc:L421-423 | plantilla | suavizado exponencial por muestra (~14 muestras ≈ 1 s para el 71 %); la primera muestra fija sin suavizar |
| `RETRY` | 350 ms × 24 | dc:L650 | estático | cadena de reintentos de reproducción: cada 350 ms hasta 24 intentos (8,4 s) o hasta que reproduce; más `loadeddata`, `canplay`, visibilidad y primer gesto |
| `MIN_READY_STATE` · `DECIMALS` | 2 · 3 | dc:L398, L433 | estático | `readyState` mínimo para muestrear (HAVE_CURRENT_DATA); decimales de la traslación escrita |

**Héroe rediagramado (D-BBW-47) — cambia el DESTINO, no el algoritmo.** El arte pasa a vivir en la zona derecha del héroe. El seguimiento sigue
llevando el centroide al **centro de su escenario**, con la misma traslación acotada y la misma holgura; lo que se mueve es **el escenario**, por
el rol de vista `--bbf-stage-left` (72 % en la vista de dos zonas, 50 % en la de una). Es la única forma de llevar el sujeto a la derecha sin tocar
las cotas: **la holgura de la traslación es la mitad del sobrante del zoom, ±3,7037 % del vídeo**, y no alcanza ni de lejos a cruzar media pantalla;
forzarla descubriría el borde del rectángulo, que es justo lo que la restricción de radios de la máscara (50 %/50 %) impide. No se tocan `ZOOM`,
`slackPercent`, `framing` ni los radios.

**Tokens que lee (nunca repite):** ninguno por valor. La geometría del escenario y su **máscara** son roles de composición que consume el CSS
del componente (`--bbf-stage-*`, `--bbf-stage-mask`, primitives/composition.css); la máscara va sobre el ESCENARIO, no sobre el vídeo (la
traslación no la mueve) y sus radios son **50 % / 50 %**: un radio mayor dejaría la parada transparente fuera de la caja y se vería el borde
del rectángulo (N1 doc A §2.7). La quietud (D-BBW-31) la lee el componente por el rol de medio **`--bbf-motion-media-display`** resuelto en el
vídeo (semantic/motion.css): es el rol que el medio ya tenía desde la 6d (con movimiento reducido el vídeo no se muestra y queda el póster), y
la regla es la misma que `--bbf-motion-*-play-state` para los bucles: vídeo oculto por el rol → **el bucle no arranca** (ni cuadros ni
reintentos); pestaña oculta → se detiene y el vídeo se **pausa** (el diseño seguía decodificando). No se crea un segundo rol para lo mismo.

**Reposo (D-BBW-28):** `REST_TRANSFORM` = escala al zoom, sin traslación, escrito en línea en el vídeo **y en la imagen fija** del HTML servido;
el póster (primer fotograma exacto, MEDIA.md §6) lo recibe con el vídeo, así **póster y reposo coinciden** (medido: caja del vídeo y de la
imagen fija = escenario × 1,08, centradas, en los cinco anchos). La primera muestra fija sin suavizar (comportamiento del diseño): al arrancar,
el encuadre pasa del reposo al centroide del primer cuadro de golpe (con este vídeo, 3,9 % del escenario, casi todo vertical: el pez nada por
encima del centro); en el diseño lo cubre la entrada del escenario (2 s de desenfoque, P5). Con la reproducción automática bloqueada el
lienzo lee negro (sin fotograma presentado) y el encuadre se queda en reposo.

**Lo que mide en ejecución (output 6j):** por muestra, `drawImage` del fotograma al lienzo 6,4 ms de mediana / 9,6 de media / 22,5 en p95
(es la lectura GPU→CPU del fotograma entero; la lectura del lienzo, 0,04 ms); 147 muestras en 9 s = 15,7 % del hilo principal; con todo
animado 108,9–110,8 fps a 120 Hz (sin seguimiento 107,1; vídeo en pausa 112,6; P2: 113,9). El diseño medía 6,5–29 ms por llamada. Con este
vídeo la traslación vive en dx 0–2,4 % · dy 0–3,7 % (el tope vertical se toca el 11 % del tiempo).

**Lo que cambia respecto al diseño sin cambiar la salida:** `preload="metadata"` y póster (D-BBW-24) en vez de `preload="auto"` sin póster;
pestaña oculta → pausa y cancelación (el diseño saltaba el trabajo pero seguía reprogramando y decodificando); movimiento reducido → el bucle
no arranca (el diseño lo ignoraba); un solo `rAF` con cancelación real y retirada de los seis oyentes al desmontar.

---

## §§BEHAVIOR-notas-fases-2026-11-05

Notas de fases cerradas en §7 (fases 6e ✅ y 6k ✅) — archivadas 2026-11-05.

**Lo que corrige respecto a la 6e:** las burbujas llevaban los tiempos de las motas (36–87 s, 2,6–3× más lentas que el diseño) y una oscilación
común de 2,4 s alternada; ahora cada burbuja tiene su ascenso (13,7–28,3 s) y su oscilación (3,7–7,3 s), inconmensurables entre sí: la subida nunca
es regular. El "halo" de la 6e era el borde de la esfera; el brillo estaba en la esquina y las paradas repartidas uniformes; faltaban la escala
0,6 → 1, las mesetas, el arranque bajo el borde y las dos capas (nieve debajo de burbujas: aquí orden del documento, sin token).

**Lo que mide el output de la 6k:** reproducibilidad (dos generaciones y dos compilaciones idénticas), recuentos y tiempos computados en Chrome,
garantía D-BBW-25 re-medida buscando el mínimo, coste con 73 elementos animados a la vez (52 partículas + 21 osciladores) y su parte en el arranque.

