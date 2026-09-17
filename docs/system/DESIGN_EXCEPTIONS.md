---
id: BBW-DESIGN-EXCEPTIONS
title: "Registro de excepciones al sistema de diseño — brandbrain-web"
type: canon
status: VIGENTE
version: 1.3
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-17
verified_against_code: 2026-09-17@feat/fase6e-legibilidad-particulas-y-guarda (src/styles/tokens/primitives/typography.css bloques EXC-BBW-01 y EXC-BBW-02 con sus guardas `-fit` · semantic/typography.css · src/components/sections/HeroSection/HeroSection.module.css `min(size, fit)` · scripts/lint/check-typography-system.ts R5/R6/R7)
supersedes: []
superseded_by: null
related: [BBW-PLAN-CONSTRUCCION, BBW-TYPOGRAPHY-WEIGHTS, D-BBW-16, D-BBW-17, D-BBW-18, D-BBW-19, D-DS-AXIOMA-AGNOSTICO]
summary: "Toda excepción a la derivación por fórmula se registra aquí con valor, razón y decisión que la firma (D-BBW-16: una excepción sin razón escrita es un agujero). v1.2 (fase 6b): dos excepciones firmadas — EXC-BBW-01 (tamaño del display, tres madres) y EXC-BBW-02 (tamaño del rótulo `lead`, DERIVADO del display por una sola madre, D-BBW-19); ninguna candidata abierta. Con la segunda excepción la guardia propia cruza los bloques EXC del canon con las filas de §1 (R7). v1.3 (fase 6e): la GUARDA de ajuste al ancho del diseño (14,6vw; 5,9vw derivada ×0,4) que ambas filas ya registraban como 'no es tamaño, es del componente' pasa a vivir como madre `-fit` dentro de cada bloque EXC y el componente del titular la aplica por rol (`min(size, fit)`): el titular real cabe en una línea a 360 px. No es una excepción nueva."
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
| **EXC-BBW-01** | Tamaño del display: **62 → 124 px con pendiente propia 8.4vw** (`--bbf-size-display-min/-max/-slope` → `--bbf-size-display`). Fuera de la escala también sobre los anclajes de D-BBW-17 (18 → 20 px, 1,2 / 1,25): en el polo pequeño cae entre el paso 6 (53,7) y el 7 (64,5); en el grande entre el 8 (119,2) y el 9 (149). El display crece ×2 entre polos; la escala, ×1,11 × (1,25/1,2)ⁿ. Pasa el 200 % en su ventana (738 → 1476 px). | `src/styles/tokens/primitives/typography.css` (bloque `EXCEPCIÓN EXC-BBW-01`) → consumido por `--bbf-type-display-size` en `semantic/typography.css` | Un titular de marca se calibra ópticamente, no matemáticamente: el valor exacto es intención, no ruido. Se conserva la **pendiente del diseño** y no la del sistema porque con la del sistema el display mediría 84 px a 738 px de ancho (+22 px sobre los 62 del diseño), y eso no sería conservar el valor. El tope `14.6vw` del diseño **no es tamaño**: es una guarda de ajuste al ancho por debajo de ~425 px y pertenece al componente del titular (`TYPOGRAPHY_WEIGHTS.md` §3, reserva de ancho). Reescrita sobre D-BBW-17 en la fase 6a-bis: la razón no cambia, los pasos entre los que cae sí. **Fase 6e:** la guarda vive como madre `--bbf-size-display-fit: 14.6vw` en el mismo bloque y llega al componente por el rol `--bbf-type-display-fit` (`font-size: min(size, fit)`); a 360 px el titular mide 52,56 px en una línea (antes 62 px en dos). Sigue siendo texto grande (≥ 24 px): su mínimo de contraste no cambia. | D-BBW-16 (conservada por D-BBW-17) | 2026-09-16 |
| **EXC-BBW-02** | Tamaño del rótulo `lead`: **derivado del display por una proporción única**, `--bbf-size-lead-ratio: 0.4` → `--bbf-size-lead-min/-max` = madres del display × 0,4 (24,8 → 49,6 px) y `--bbf-size-lead = --bbf-size-display × 0,4` (pendiente 3,36vw). **Una sola madre** (la proporción), no tres. Medida del diseño (N0 §2.2): 24/62 = 0,387 · 49/124 = 0,395 · 3,4/8,4 = 0,405 · 5,9/14,6 = 0,404. Frente al diseño (24 → 49, 3,4vw): \|Δ\| < 1 px en cualquier ancho, mismo codo (plano hasta 738 px, luego proporcional al ancho). Suelo: 24,8 ≥ 12 (R5). 200 %: escala lineal del display, que lo pasa en su ventana (738 → 1476 px). | `src/styles/tokens/primitives/typography.css` (bloque `EXCEPCIÓN EXC-BBW-02`) → consumido por `--bbf-type-lead-size` en `semantic/typography.css` | El diseño calibró rótulo y titular **como una unidad** (el N0 ajusta el rótulo por interletrado medido para igualar el ancho del titular): su curva es un codo y ningún paso lineal de la escala la sigue (26 juegos de anclajes probados en la 6a-bis; mejor error 13,5 px / 28 %). Si el rótulo existe para acompañar al titular, que dependa de él: una madre en lugar de tres, y cambiar el display arrastra el rótulo. **Fase 6e:** su guarda `--bbf-size-lead-fit` se DERIVA de la del display por la misma madre (0,4 → 5,84vw frente a 5,9vw del diseño; |Δ| 0,2 px a 360 px) y llega por `--bbf-type-lead-fit`. A 360 px el rótulo mide 21,0 px: cruza el umbral de texto grande de WCAG (24 px) y su mínimo pasa de 3:1 a 4,5:1; la garantía de legibilidad (D-BBW-25) se calibró con ese mínimo. Sigue siendo excepción (no es paso de la escala). El tope `5.9vw` del diseño **no es tamaño**: es la misma guarda de ajuste al ancho que el `14.6vw` del display (5,9/14,6 = 0,404) y pertenece al componente del titular (reserva de ancho, fase 6c). | D-BBW-19 (opción (b) de la v1.1 §2) | 2026-09-16 |

## §2 — Candidatas (sin firmar; nada aplicado)

**Ninguna.** La última candidata, `lead`, se firmó como EXC-BBW-02 (D-BBW-19, fase 6b) por la vía (b) que recomendaba la v1.1: derivarla del
display con una sola madre. `legal` había cerrado en la 6a-bis por el suelo de legibilidad (D-BBW-18) sin excepción. HAL-BBW-09 cerrado.

**Cómo entra una candidata nueva:** el turno que detecta un valor sin peldaño la escribe aquí con valor del diseño, por qué ningún paso sirve
(medido en su rango real, L-45), opciones y recomendación; el token que la esperaría queda `PROVISIONAL` en el archivo semántico. **Cómo se
cierra:** Zavala firma en `shared/DECISIONES.md`; el turno que ejecute mueve la fila a §1 (si es excepción) o apunta el rol al peldaño firmado (si
es ajuste), y retira la marca `PROVISIONAL`.

## §3 — Lo que este registro exige del sistema

- **Una excepción es una madre con nombre propio** (`--bbf-<escala>-<rol>-…`), nunca un número suelto en un consumidor: las guardias
  siguen bloqueando cualquier valor crudo fuera de `primitives/`.
- **Toda madre de excepción se comprueba contra el suelo** (D-BBW-18): la guardia propia `scripts/lint/check-typography-system.ts` (R5) evalúa
  cada par `--bbf-size-<x>-min/-max` del canon, pasos y excepciones por igual, y (R6) obliga a que cada rol consuma un `--bbf-size-*`.
- **Con la segunda excepción firmada (EXC-BBW-02, fase 6b) llegó la guardia prevista** (regla de la segunda necesidad, D-DOC-13 §3): la guardia
  propia `scripts/lint/check-typography-system.ts` (R7) exige que el conjunto de bloques `EXCEPCIÓN EXC-BBW-NN` de `primitives/typography.css`
  sea exactamente el conjunto de filas `**EXC-BBW-NN**` de este §1. Una excepción en el código sin fila, o una fila sin código, rompe el build.
  Demostrada fallando en `OUTPUT-BBW-2026-09-16-fase6b-componentes-y-secciones`.

---
*BBW-DESIGN-EXCEPTIONS v1.3 · `docs/system/DESIGN_EXCEPTIONS.md` · 2026-09-17 · nace en la fase 6a (`DESPACHO-BBW-2026-09-16-fase6a-residuales-y-modelo-de-contenido`, D-BBW-16); v1.1 en la fase 6a-bis (D-BBW-17 · D-BBW-18: legal cerrada por el suelo, lead re-medida, EXC-BBW-01 reescrita sobre los anclajes nuevos); v1.2 en la fase 6b (D-BBW-19: lead → EXC-BBW-02 con una madre; guardia R7); v1.3 en la fase 6e (guardas `-fit` como madres de los bloques EXC, aplicadas por el componente del titular)*
