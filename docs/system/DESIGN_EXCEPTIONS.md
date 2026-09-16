---
id: BBW-DESIGN-EXCEPTIONS
title: "Registro de excepciones al sistema de diseño — brandbrain-web"
type: canon
status: VIGENTE
version: 1.1
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-16
verified_against_code: 2026-09-16@feat/fase6a-bis-escala-tipografica (src/styles/tokens/primitives/typography.css bloque EXC-BBW-01 sobre los anclajes de D-BBW-17 · semantic/typography.css · scripts/lint/check-weight-tokens.ts R5/R6)
supersedes: []
superseded_by: null
related: [BBW-PLAN-CONSTRUCCION, BBW-TYPOGRAPHY-WEIGHTS, D-BBW-16, D-BBW-17, D-BBW-18, D-DS-AXIOMA-AGNOSTICO]
summary: "Toda excepción a la derivación por fórmula se registra aquí con valor, razón y decisión que la firma (D-BBW-16: una excepción sin razón escrita es un agujero). Hoy una excepción firmada (EXC-BBW-01, tamaño del display, conservada sobre los anclajes de D-BBW-17) y una candidata sin firmar (lead), que sigue provisional; legal cerró por el suelo de legibilidad (D-BBW-18) sin excepción."
tags: [sistema-de-diseno, excepciones, tokens, brandbrain-web]
---

# Registro de excepciones al sistema de diseño

> **Regla (D-BBW-16, 2026-09-16):** todo valor del diseño que no cae en la fórmula se ajusta al peldaño más cercano de su escala.
> Lo que no se ajusta es una **excepción**, y una excepción exige **valor + razón + registro**: el valor vive como madre en el
> archivo de primitivos con un bloque `EXCEPCIÓN EXC-BBW-NN` que la nombra, la razón se escribe ahí y aquí, y esta tabla es el
> registro. **Una excepción sin razón escrita es un agujero**, y un agujero es lo que D-BBW-16 cierra.
> **Qué no es:** una lista de deseos. Una fila entra cuando Zavala la firma; hasta entonces es *candidata* (§2) y el token que la
> esperaría queda marcado `PROVISIONAL` en el archivo semántico.

## §1 — Excepciones firmadas

| ID | Valor (madre) | Dónde vive | Razón | Decisión | Fecha |
|---|---|---|---|---|---|
| **EXC-BBW-01** | Tamaño del display: **62 → 124 px con pendiente propia 8.4vw** (`--bbf-size-display-min/-max/-slope` → `--bbf-size-display`). Fuera de la escala también sobre los anclajes de D-BBW-17 (18 → 20 px, 1,2 / 1,25): en el polo pequeño cae entre el paso 6 (53,7) y el 7 (64,5); en el grande entre el 8 (119,2) y el 9 (149). El display crece ×2 entre polos; la escala, ×1,11 × (1,25/1,2)ⁿ. Pasa el 200 % en su ventana (738 → 1476 px). | `src/styles/tokens/primitives/typography.css` (bloque `EXCEPCIÓN EXC-BBW-01`) → consumido por `--bbf-type-display-size` en `semantic/typography.css` | Un titular de marca se calibra ópticamente, no matemáticamente: el valor exacto es intención, no ruido. Se conserva la **pendiente del diseño** y no la del sistema porque con la del sistema el display mediría 84 px a 738 px de ancho (+22 px sobre los 62 del diseño), y eso no sería conservar el valor. El tope `14.6vw` del diseño **no es tamaño**: es una guarda de ajuste al ancho por debajo de ~425 px y pertenece al componente del titular (`TYPOGRAPHY_WEIGHTS.md` §3, reserva de ancho). Reescrita sobre D-BBW-17 en la fase 6a-bis: la razón no cambia, los pasos entre los que cae sí. | D-BBW-16 (conservada por D-BBW-17) | 2026-09-16 |

## §2 — Candidatas (sin firmar; nada aplicado)

Con la escala re-anclada (D-BBW-17, fase 6a-bis) las candidatas se volvieron a medir contra **todos** los juegos de anclajes probados
(output 6a-bis §2). **`legal` cerró sin excepción**: el suelo de legibilidad (D-BBW-18) lo lleva al paso −2 (12,5 → 12,8 px) y la fila
desaparece de aquí. **`lead` sigue sin peldaño con cualquier anclaje**, y la escala nueva no es excusa para forzarlo.

| Candidata | Valor del diseño | Por qué ningún paso sirve (sobre 18 → 20 px, 1,2 / 1,25; medido en todo el rango, L-45) | Opciones para Zavala | Recomendación de CC |
|---|---|---|---|---|
| lead (línea "Technologist", acompaña al display) | 24 → 49 px (`min(clamp(24px, 3.4vw, 49px), 5.9vw)`): **plana en 24 px hasta 706 px** y desde ahí proporcional al ancho (3,4vw), como el display (8,4vw; la relación lead/display es ≈ 0,40 en todo el recorrido) | Un paso de la escala es una recta entre polos; la línea del diseño es un codo. Paso 2 (25,9 → 31,3): +15 % a 706 px, **−36 % a 1440**. Paso 3 (31,1 → 39,1): **+40 % a 706 px**, −20 % a 1440. Paso 4 (37,3 → 48,8): −0 % a 1440 pero **+71 % a 706 px**. Ningún candidato de anclajes (26 probados) baja de 13,5 px de error máximo. | (a) **EXC-BBW-02**: la línea se calibra al ancho del display (el N0 la ajusta por interletrado medido para igualar ese ancho); si el display es excepción por calibración óptica, su compañera lo es por la misma razón → madres 24/49 con pendiente 3,4vw (tres madres, como EXC-BBW-01). (b) **Derivarla del display**: una sola madre nueva, la relación lead/display (≈ 0,40), y `--bbf-size-lead = --bbf-size-display × relación`; conserva la forma del diseño (mismo codo, misma pendiente relativa) sin escribir 24/49/3,4vw a mano; sigue siendo excepción (no es paso de la escala) pero con una madre en vez de tres. (c) Aceptar el paso 2 o el 3 sabiendo que es cambio grande. | **(b)**: es la razón de (a) llevada a la fórmula: si el lead existe para acompañar al display, que dependa de él. Menos madres, mismo valor, y el guardia R5/R6 ya la cubriría (la madre de excepción se evalúa contra el suelo). |

**Cómo se cierra una candidata:** Zavala firma en `shared/DECISIONES.md`; el turno que ejecute mueve la fila a §1 (si es excepción) o
apunta el rol al peldaño firmado (si es ajuste), y retira la marca `PROVISIONAL` del archivo semántico.

## §3 — Lo que este registro exige del sistema

- **Una excepción es una madre con nombre propio** (`--bbf-<escala>-<rol>-…`), nunca un número suelto en un consumidor: las guardias
  siguen bloqueando cualquier valor crudo fuera de `primitives/`.
- **Toda madre de excepción se comprueba contra el suelo** (D-BBW-18): la guardia propia `scripts/lint/check-weight-tokens.ts` (R5) evalúa
  cada par `--bbf-size-<x>-min/-max` del canon, pasos y excepciones por igual, y (R6) obliga a que cada rol consuma un `--bbf-size-*`.
- **Cuando exista una segunda excepción firmada**, una guardia cruzará los bloques `EXCEPCIÓN EXC-BBW-NN` de `primitives/` con las
  filas de §1 (regla de la segunda necesidad, D-DOC-13 §3). Con una sola excepción, esa guardia sería estructura sin contenido.

---
*BBW-DESIGN-EXCEPTIONS v1.1 · `docs/system/DESIGN_EXCEPTIONS.md` · 2026-09-16 · nace en la fase 6a (`DESPACHO-BBW-2026-09-16-fase6a-residuales-y-modelo-de-contenido`, D-BBW-16); v1.1 en la fase 6a-bis (D-BBW-17 · D-BBW-18: legal cerrada por el suelo, lead re-medida, EXC-BBW-01 reescrita sobre los anclajes nuevos)*
