---
id: BBW-TYPOGRAPHY-WEIGHTS
title: "Pesos por familia y animación de peso del titular — brandbrain-web"
type: canon
status: VIGENTE
version: 1.3
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-17
verified_against_code: 2026-09-16@feat/fase6b-componentes-y-secciones (guardia propia renombrada `check-typography-system.ts`, R1–R8; rangos medidos: kit ntm5vqh `modulator-vf` wght 25–500 en vivo 2026-09-16; Space Grotesk variable wght 300–700, archivo auto-hospedado)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, D-BBW-14, D-DS-AXIOMA-AGNOSTICO]
summary: "Las dos familias tienen ejes de peso incompatibles (display 25–500, text 300–700): no existe un peso global; cada token de peso lleva su familia, cada rol resuelve por familia y una guardia detecta pesos fuera de rango. Restricciones escritas para la animación de peso del titular (fase 6): reserva del ancho del estado más ancho, todos los ejes en cada fotograma, peso fijo intermedio con movimiento reducido. La animación NO se implementa aquí."
tags: [tipografia, pesos, ejes-variables, animacion, accesibilidad, brandbrain-web]
---

# Pesos por familia y animación de peso del titular

> **Qué es:** la nota de sistema que dice cómo se piden pesos en este repo y qué restricciones absorbe el sistema para que el titular
> animado de la fase 6 no traiga números escritos a mano. **Qué no es:** el componente del titular ni su animación (fase 6).

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

## §3 — Restricciones para la animación de peso del titular (fase 6 la construye; esto la acota)

La animación del titular se conserva (Zavala, 2026-09-16). Tres hechos medidos que el componente **no puede ignorar**:

1. **Animar el peso cambia el ancho del texto.** Según la documentación de Adobe consultada, el kit no expone ningún eje que cambie el peso
   aparente sin cambiar el ancho (solo `wght`). Por tanto la línea animada **cambia de ancho en cada fotograma**. Regla: **reservar el
   espacio del estado más ancho** (medir la línea en el extremo más ancho de la animación, que en un eje de peso es normalmente el de
   mayor peso, `--bbf-type-display-weight-to`; **medir, no suponer**) y mantener esa caja fija mientras las letras animan. Sin reserva,
   la línea se recoloca en cada fotograma y arrastra lo que tenga alrededor (el N0 lo resolvía con un muestreo de avances por glifo).
2. **Los navegadores no interpolan por nombre de eje.** Si la animación usa `font-variation-settings`, **todos los ejes animados deben
   listarse en cada fotograma, en el mismo orden**, o la interpolación se rompe (salta en vez de transicionar). Si solo se anima `wght`,
   animar `font-weight` sobre la fuente variable interpola numéricamente y evita el problema; en ambos casos el valor sale del token,
   no de un número.
3. **Con movimiento reducido, la animación se retira y el peso se fija en un valor legible intermedio, no en el más dramático.** Ya está
   resuelto en tokens: `--bbf-type-display-weight-from` y `-to` colapsan a `--bbf-weight-display-rest` (punto medio, 300) bajo
   `prefers-reduced-motion: reduce`, y `--bbf-duration-base` cae a 0.01 ms. El componente no necesita una rama de accesibilidad propia.

**Guarda de ajuste al ancho (fase 6e, aplicada):** el tope `14.6vw` / `5.9vw` del diseño vive como madre `--bbf-size-display-fit` /
`--bbf-size-lead-fit` (bloques EXC-BBW-01/02) y el componente del titular la aplica por rol (`font-size: min(size, fit)`): a 360 px la
palabra real `Creative` mide 52,56 px (265 px de ancho) y cabe en una línea con peso 300. **La reserva de ancho del estado más grueso (punto 1)
sigue pendiente del turno de movimiento**: la guarda garantiza que quepa el reposo, no el peso máximo (500); medir la palabra a 500 antes de animar.

**Comprobación prevista para la fase 6 (con el titular construido):** (a) `getComputedStyle(h1).fontWeight` bajo movimiento reducido = 300;
(b) el ancho de la caja del titular no cambia entre el primer y el último fotograma (`getBoundingClientRect().width` igual); (c) el
guardia de pesos sigue en verde con el componente en el árbol.

## §4 — Cómo añadir un peso (ALIGN → REPLACE → CREATE)

1. ¿Existe ya un rol que lo cubra? (`--bbf-type-<rol>-weight`) → úsalo.
2. ¿Existe el valor en la familia? (`--bbf-weight-<familia>-*`) → apunta el rol a él.
3. Si no: crear el primitivo **con familia** y **dentro del rango**; si el rango no lo permite, no es un peso: es un cambio de familia
   (puerto de tipografía display, `PORTS.md`).

---
*BBW-TYPOGRAPHY-WEIGHTS v1.2 · `docs/system/TYPOGRAPHY_WEIGHTS.md` · 2026-09-16 · nace en la fase 5 (`DESPACHO-BBW-2026-09-16-fase5-nomenclatura-pesos-y-capa-de-contenido`); v1.1 fase 6a-bis (R5/R6); v1.2 fase 6b (guardia renombrada, R7/R8, roles claim/menu/notice)*
