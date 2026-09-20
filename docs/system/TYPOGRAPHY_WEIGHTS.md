---
id: BBW-TYPOGRAPHY-WEIGHTS
title: "Pesos por familia y animación de peso del titular — brandbrain-web"
type: canon
status: VIGENTE
version: 1.5
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-18
verified_against_code: 2026-09-18@feat/fase6h-modulador-de-peso (v1.5: modulador de peso letra a letra con CONSERVACIÓN de ancho en `src/components/molecules/HeroLock/` + `src/behavior/weight-modulator.ts`; copia oculta, rejilla, keyframes y rol de vista RETIRADOS; medido en Chrome a 360/780/1000/1728/1920 en OUTPUT-BBW-2026-09-17-fase6h §F5; guardia propia `check-typography-system.ts` R1–R8 en verde con el componente en el árbol; rangos medidos: kit ntm5vqh `modulator-vf` wght 25–500 en vivo 2026-09-16; Space Grotesk variable wght 300–700, archivo auto-hospedado)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, D-BBW-14, D-DS-AXIOMA-AGNOSTICO]
summary: "Las dos familias tienen ejes de peso incompatibles (display 25–500, text 300–700): no existe un peso global; cada token de peso lleva su familia, cada rol resuelve por familia y una guardia detecta pesos fuera de rango. Restricciones para la animación de peso del titular: reserva del ancho del estado más ancho, todos los ejes en cada fotograma, peso fijo intermedio con movimiento reducido. v1.4 (fase 6g): reserva de ancho por copia oculta al peso máximo y extremo alto por vista. v1.5 (fase 6h, portado P1): la animación se comporta como el diseño: modulador letra a letra con conservación de ancho (Σ avances = presupuesto al reposo, caja anclada al fotograma más ancho de la señal real, tabla de avances medida en ejecución y re-medida cuando llega la fuente); la copia oculta, la rejilla, los keyframes y el rol de vista se retiran (medían un estado que el diseño nunca renderiza, L-62); font-weight por glifo (D-BBW-29); quieto con movimiento reducido y pestaña oculta (D-BBW-31); interletrado del titular = EXC-BBW-04 (D-BBW-32)."
tags: [tipografia, pesos, ejes-variables, animacion, accesibilidad, brandbrain-web]
---

# Pesos por familia y animación de peso del titular

> **Qué es:** la nota de sistema que dice cómo se piden pesos en este repo y qué restricciones absorbe el sistema para que el titular
> animado no traiga números escritos a mano. **Qué no es:** el componente del titular (vive en `src/components/sections/HeroSection/`).


## Héroe rediagramado (D-BBW-47) — el modulador cambia de sujeto, no de algoritmo

La animación de peso deja de aplicarse a **una palabra** (el titular `deepbrand`) y pasa a aplicarse a **la última línea de un claim
de tres**, una frase con espacios y punto. Las otras dos líneas quedan al peso de reposo del rol.

- **La conservación de ancho es POR LÍNEA.** La caja anclada es la de la tercera línea; las otras dos, el encabezado y la firma son
  hermanos en una columna y no se enteran. Medido: cero recolocación de las seis cajas en 150 cuadros × cinco anchos.
- **El espacio es un glifo con avance** y hay que impedir que se colapse. Un glifo del modulador es elemento flexible, es decir caja de
  bloque, y en una caja de bloque un espacio suelto se colapsa y se recorta: mediría cero, la frase saldría sin espacios y el
  presupuesto se calcularía sobre una tabla falsa. Se arregla con `white-space: pre` en el glifo (HAL-BBW-24).
- **La discontinuidad de avance de la familia la tienen tres glifos**, no uno: `e`, `s` y `S`, todas en el peso **224,73** con un salto
  de **0,02373 em**. Los otros catorce del claim están limpios. La tolerancia del refinado por bisección pasa a ir **en em**
  (`0,00485 em`, el mismo valor que la 6h validó dicho en la unidad en la que era cierto), porque un umbral en píxeles solo dispara por
  encima de ~105 px de cuerpo y el claim tiene cuerpos de 28,56 a 64,01 px (HAL-BBW-25).
- **El ancho lo fija la línea más larga** (D-BBW-48): la guarda servida divide entre la cuenta de letras de la más larga, y el afinado
  por medida toma el máximo de los tres anchos reales, con la tercera línea ya anclada.

## §1 — Dos familias, dos escalas incompatibles

| Familia (D-BBW-14) | Origen del rango | Eje `wght` real | Qué significa "500" | Qué pasa fuera del rango |
|---|---|---|---|---|
| display `modulator-vf` | Adobe Fonts, proyecto `ntm5vqh` (puerto `src/styles/fonts/display.ts`), medido en vivo 2026-09-16 | **25–500** | **Su máximo.** En la escala convencional de la web 500 es "medium". | Pedir 600 o 700 no falla: el navegador **recorta en silencio** al máximo servido. La negrita "no aparece" y nadie sabe por qué. |
| text Space Grotesk variable | archivo `src/styles/fonts/space-grotesk-variable.woff2` (OFL 1.1), descriptor `weight: "300 700"` en `text.ts` | **300–700** | Medium (convención web). | Pedir 200 o 800 recorta a 300 / 700 sin aviso. |

**Consecuencia:** un token de peso no puede ser un número global. `--bbf-weight-medium: 500` significaba "medio" sobre text y
"lo más pesado posible" sobre display. Desde la fase 5 **todo token de peso lleva su familia en el nombre** y **el rol tipográfico
resuelve el peso por familia**.

## §2 — Dónde vive cada cosa (tokens)

| Pieza | Token(es) | Archivo | Regla |
|---|---|---|---|
| Rango real por familia (madres) | `--bbf-weight-display-range-min/-max` · `--bbf-weight-text-range-min/-max` | `src/styles/tokens/primitives/typography.css` | Es lo que el sistema "ve": la guardia lee estos cuatro valores. Cambiar de familia = cambiar el rango aquí. |
| Pesos de la familia display | `--bbf-weight-display-anim-min` (100) · `-anim-max` (500) · `-rest` (fórmula: punto medio) | ídem | Extremos de la animación del titular (N0 §2.2: WMIN/WMAX) y reposo legible. |
| Pesos de la familia text | `--bbf-weight-text-light` (300) · `-regular` (400) · `-medium` (500) | ídem | Valores de eje: madres. |
| Extremos de la animación como estado de movimiento | `--bbf-weight-display-from` · `--bbf-weight-display-to` | `src/styles/tokens/primitives/motion.css` | Con `prefers-reduced-motion: reduce` **ambos valen `--bbf-weight-display-rest`**: la animación se retira sin que el componente sepa nada (mismo patrón que la madre de duración). |
| Peso por rol (lo que consume un componente) | `--bbf-type-display-weight` (reposo) · `--bbf-type-display-weight-from/-to` · `--bbf-type-lead-weight` · `--bbf-type-body-weight` · `--bbf-type-claim-weight` · `--bbf-type-label-weight` · `--bbf-type-menu-weight` · `--bbf-type-legal-weight` · `--bbf-type-notice-weight` | `src/styles/tokens/semantic/typography.css` | **Un componente pide el rol; nunca escribe un número.** Cada rol tiene una familia fija, así que el mismo concepto ("peso normal") resuelve a 300 en display y a 400 en text sin que el consumidor lo sepa. |

**Guardias (dos, complementarias):** `scripts/lint/check-typography-tokens.ts` (copia por contrato, CONTRATO-04) bloquea
`font-weight: <número>` fuera de primitivos; `scripts/lint/check-typography-system.ts` (propia del repo; nació en la fase 5 como `check-weight-tokens.ts` y se **renombró en la fase 6b** porque ya no comprueba solo pesos) exige familia en todo
`--bbf-weight-*`, comprueba que cada valor cae en el rango de su familia, que el descriptor de `text.ts` coincide con el rango del token,
y bloquea `wght` numérico crudo en `font-variation-settings`; **desde la fase 6a-bis (D-BBW-17 · D-BBW-18) la misma guardia propia cubre la escala de tamaño**: cada paso y excepción del canon evaluados contra el suelo `--bbf-text-floor` en ambos polos (R5) y cada `--bbf-type-<rol>-size` obligado a consumir un `--bbf-size-*` del canon (R6), sin guardia nueva (regla de la segunda necesidad, D-DOC-13 §3); **desde la fase 6b** cruza además las excepciones del canon con el registro `DESIGN_EXCEPTIONS.md` §1 (R7) y obliga a que el literal de `@media` fuera de primitivos espeje una madre `--bbf-bp-*` (R8). Ambas corren en `pnpm guard` y en el pre-commit (fail-closed).

## §3 — Restricciones para la animación de peso del titular (portada en la fase 6h por CONSERVACIÓN de ancho; esto la acota)

La animación del titular existe desde la fase 6g y **desde la fase 6h se comporta como el diseño**: es un **modulador letra a letra**
(`src/components/molecules/HeroLock/` + `src/behavior/weight-modulator.ts`, contrato en `docs/system/BEHAVIOR.md`): cada letra interpola su
peso siguiendo una señal continua sin periodo, y la suma de avances de todas las letras se mantiene igual al **presupuesto** (la suma a peso de
reposo) en cada cuadro. Tres hechos medidos que el componente **no puede ignorar**, y cómo los cumple:

1. **Animar el peso cambia el ancho de cada letra**, y el kit no expone ningún eje que cambie el peso aparente sin cambiar el ancho (solo
   `wght`). Regla: **la línea no puede cambiar de ancho**. Cómo se cumple: **por conservación, no por reserva**. El modulador mide en ejecución
   la tabla de avances de cada glifo en nueve pesos del eje **y la refina por bisección donde la medida se aparta de la recta** (la `e` de
   `modulator-vf` pierde 2,79 px de avance de golpe en el peso 225: una tabla uniforme no lo ve y la conservación deriva 0,7 %; con el refinado,
   0,14 %; `BEHAVIOR.md` §2), fija el presupuesto como la suma de avances al peso de reposo, y en cada cuadro
   corrige los pesos con un water-fill de Newton hasta que Σ avances = presupuesto ± 0,04 px: **una letra solo engorda si otra adelgaza**. La caja
   del titular se ancla (`width` en px) al fotograma más ancho de 40 cuadros simulados de la señal real (presupuesto + ≤ 0,1 %), con el
   contenido centrado, así que nada de alrededor se recoloca. **Medir, no suponer:** la tabla se re-mide al montar, cuando las fuentes están
   listas, cada vez que llega una fuente (una tabla medida sobre la de respaldo daría una conservación falsa), a 60/700/1800 ms y al cambiar el
   tamaño de la ventana.
   **Lo que la fase 6g creyó y el N1 desmintió (L-58 → L-62):** la 6g midió la palabra con todas las letras al peso máximo (1191 px a 1728;
   505 a 360, "no cabe por debajo de ~650 px"), reservó ese ancho con una copia oculta en una rejilla y acotó el extremo alto por vista
   (P-BBW-37). Ese estado **no existe en el diseño**: el diseño conserva el ancho por construcción y la palabra mide siempre lo del reposo
   (734,6–735,2 px a 1728; 310,0–311,6 a 360, con letras entre 116 y 492). La copia oculta, la rejilla, los fotogramas clave y el rol de vista
   se retiraron en la 6h en el mismo commit que el modulador; P-BBW-37 quedó **disuelto**, no ratificado. El reposo 300 de la fase 5
   (`--bbf-weight-display-rest` = (min + max) / 2) es exactamente el peso de conservación del diseño.
2. **Un solo eje, la propiedad estándar (D-BBW-29).** El modulador escribe `font-weight` numérico por letra (interpolación numérica sobre la
   fuente variable), no `font-variation-settings`: la guardia propia R4 sigue en verde sin excepción. Los extremos y el reposo son tokens que el
   módulo **lee** (`--bbf-type-display-weight-from/-to` por `getPropertyValue`; el reposo como `font-weight` computado del titular) y nunca
   repite (D-BBW-30).
3. **Con movimiento reducido y con la pestaña oculta el bucle se detiene y queda el reposo (D-BBW-31).** El componente lee el rol
   `--bbf-motion-loop-play-state` (`semantic/motion.css`, el mismo que pausa ripple y pulso) y `document.hidden`; al detenerse retira los pesos
   por letra y el CSS deja el peso de rol (300). Se aparta del diseño a propósito: el diseño ignora la preferencia en sus bucles.

**Interletrado del titular (D-BBW-32, EXC-BBW-04):** fijo, con el valor del diseño (0,01em, atado a los sidebearings de `modulator-vf`; a cero
los pares chocan). Debe ser fijo porque el **ajuste óptico del rótulo** (`src/behavior/optical-fit.ts`) se mide sobre la caja anclada del titular:
el rótulo se interletra en px hasta cerrar a ese ancho y recorta el sobrante con margen negativo; su interletrado de rol (`--bbf-type-lead-tracking`)
es el valor inicial hasta la primera medida.

**Guarda de ajuste al ancho (fase 6e, aplicada):** el tope `14.6vw` / `5.9vw` del diseño vive como madre `--bbf-size-display-fit` /
`--bbf-size-lead-fit` (bloques EXC-BBW-01/02) y el componente la aplica por rol (`font-size: min(size, fit)`). Con la conservación de ancho
**la guarda cubre todo el recorrido**: la caja anclada mide lo del reposo (+ ≤ 0,1 %), y el reposo es lo que la guarda garantiza (a 360 px,
52,56 px de cuerpo: 311 px anclados frente a 332 disponibles, medido en el output 6h).

**Fase 7b (D-BBW-42): la guarda deja de ser solo un tope de pantalla estrecha.** Mide contra el ancho OBJETIVO
(`--bbf-lockup-target` = `--bbf-lockup-width-per-size` × `--bbf-size-display`, con el disponible como suelo), que es el ancho que el lockup
tenía en el diseño. El ancho es la invariante y el cuerpo la consecuencia en TODO el recorrido, no solo abajo: a 1728 el titular baja de 124
a 103,17 px y mide 735,23 px, los 735,36 del diseño (Δ −0,13 px). **La conservación de ancho del modulador no se mueve**: cambia el cuerpo,
no el mecanismo (amplitud de la caja anclada 0,00 px en 90 tomas, los cinco anchos).

**Comprobación (ejecutada en la fase 6h, `OUTPUT-BBW-2026-09-17-fase6h-P1-modulador-de-peso` §F5):** (a) Σ avances medidos por cuadro
frente al presupuesto en cinco anchos durante varios segundos (deriva bajo el umbral del inventario); (b) cajas del titular, bloque, rótulo,
afirmaciones y barra idénticas cuadro a cuadro; (c) re-calibración cuando la fuente real está lista, demostrada por el evento
`bbf:weight-calibrated`; (d) `font-weight` de las letras = reposo con los roles de movimiento reducido invertidos y con la pestaña oculta;
(e) el texto literal y el peso de reposo en `out/es/index.html`; (f) guardias en verde sin excepción nueva. **Coste:** ocho cambios de
`font-weight` por cuadro obligan a recomponer la línea (hilo principal); medido en el output 6h contra el presupuesto del inventario
(≈ 6 ms/cuadro en el diseño); el titular anima dentro de `contain: layout`.

## §4 — Cómo añadir un peso (ALIGN → REPLACE → CREATE)

1. ¿Existe ya un rol que lo cubra? (`--bbf-type-<rol>-weight`) → úsalo.
2. ¿Existe el valor en la familia? (`--bbf-weight-<familia>-*`) → apunta el rol a él.
3. Si no: crear el primitivo **con familia** y **dentro del rango**; si el rango no lo permite, no es un peso: es un cambio de familia
   (puerto de tipografía display, `PORTS.md`).

---
*BBW-TYPOGRAPHY-WEIGHTS v1.5 · `docs/system/TYPOGRAPHY_WEIGHTS.md` · 2026-09-18 · v1.5 fase 6h (modulador por conservación de ancho; reserva por copia y extremo por vista retirados) · nace en la fase 5 (`DESPACHO-BBW-2026-09-16-fase5-nomenclatura-pesos-y-capa-de-contenido`); v1.1 fase 6a-bis (R5/R6); v1.2 fase 6b (guardia renombrada, R7/R8, roles claim/menu/notice); v1.3 fase 6e (guardas `-fit`); v1.4 fase 6g (animación construida y medida: reserva por copia oculta, extremo alto por vista)*
