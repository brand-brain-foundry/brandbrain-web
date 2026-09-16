---
id: BBW-DESIGN-EXCEPTIONS
title: "Registro de excepciones al sistema de diseño — brandbrain-web"
type: canon
status: VIGENTE
version: 1.0
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-16
verified_against_code: 2026-09-16@feat/fase6a-residuales-y-modelo-de-contenido (src/styles/tokens/primitives/typography.css bloque EXC-BBW-01 · semantic/typography.css)
supersedes: []
superseded_by: null
related: [BBW-PLAN-CONSTRUCCION, BBW-TYPOGRAPHY-WEIGHTS, D-BBW-16, D-DS-AXIOMA-AGNOSTICO]
summary: "Toda excepción a la derivación por fórmula se registra aquí con valor, razón y decisión que la firma (D-BBW-16: una excepción sin razón escrita es un agujero). Hoy una excepción firmada (EXC-BBW-01, tamaño del display) y dos candidatas sin firmar (lead y legal), que siguen provisionales."
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
| **EXC-BBW-01** | Tamaño del display: **62 → 124 px con pendiente propia 8.4vw** (`--bbf-size-display-min/-max/-slope` → `--bbf-size-display`). Fuera de la escala: cae entre el paso 4 (44→103) y el 5 (59→166). | `src/styles/tokens/primitives/typography.css` (bloque `EXCEPCIÓN EXC-BBW-01`) → consumido por `--bbf-type-display-size` en `semantic/typography.css` | Un titular de marca se calibra ópticamente, no matemáticamente: el valor exacto es intención, no ruido. Se conserva la **pendiente del diseño** y no la del sistema porque con la del sistema el display mediría 84 px a 738 px de ancho (+22 px sobre los 62 del diseño), y eso no sería conservar el valor. El tope `14.6vw` del diseño **no es tamaño**: es una guarda de ajuste al ancho por debajo de ~425 px y pertenece al componente del titular (`TYPOGRAPHY_WEIGHTS.md` §3, reserva de ancho). | D-BBW-16 | 2026-09-16 |

## §2 — Candidatas (sin firmar; nada aplicado)

Residuales de la fase 4 que **no tienen peldaño razonable** en su escala (despacho fase 6a §5): no se ajustaron. El rol semántico
conserva la asignación **provisional** de la fase 4, marcada en `semantic/typography.css`, hasta que Zavala firme una de las opciones.

| Candidata | Valor del diseño | Peldaños vecinos y por qué ninguno sirve | Opciones para Zavala | Recomendación de CC |
|---|---|---|---|---|
| lead (línea "Technologist", acompaña al display) | 24 → 49 px (`min(clamp(24px, 3.4vw, 49px), 5.9vw)`) | paso 2 (24.9→39.3): **−20 % en escritorio** (49 → 39 px) · paso 3 (33.2→63.5): +30 % en escritorio y +56 % en móvil. Ambos son cambio grande, no unos píxeles. | (a) **EXC-BBW-02**: la línea se calibra al ancho del display (el N0 la ajusta por interletrado medido para igualar ese ancho); si el display es excepción por calibración óptica, su compañera lo es por la misma razón → madres 24/49 con pendiente 3.4vw. (b) Aceptar el paso 2 como ajuste perceptible, sabiendo que lo es. | **(a)**: la razón ya está escrita en EXC-BBW-01, es la misma pieza (el lockup). |
| legal / estado (pie: legal y aviso) | 9 → 10 px (`clamp(9px, 0.72vw, 10px)`) | paso −2 (7.9→8.4): −12…−16 %, **por debajo del suelo de 9 px que el diseño respeta en todo el rango** (legibilidad, no percepción) · paso −1 (10.5→11.3): +13…+20 %, igual tamaño que `label` (nav), que el diseño distingue solo por 0.5 px. | (a) legal → paso −1: comparte tamaño con `label`; la distinción de 0.5 px del diseño no era intención perceptible; +1.5 px más legible; **sin excepción**. (b) **EXC-BBW-03**: madres 9/10 como suelo de legibilidad. | **(a)**: resuelve por el sistema sin abrir una excepción; el texto legal gana legibilidad. |

**Cómo se cierra una candidata:** Zavala firma en `shared/DECISIONES.md`; el turno que ejecute mueve la fila a §1 (si es excepción) o
apunta el rol al peldaño firmado (si es ajuste), y retira la marca `PROVISIONAL` del archivo semántico.

## §3 — Lo que este registro exige del sistema

- **Una excepción es una madre con nombre propio** (`--bbf-<escala>-<rol>-…`), nunca un número suelto en un consumidor: las guardias
  siguen bloqueando cualquier valor crudo fuera de `primitives/`.
- **Cuando exista una segunda excepción firmada**, una guardia cruzará los bloques `EXCEPCIÓN EXC-BBW-NN` de `primitives/` con las
  filas de §1 (regla de la segunda necesidad, D-DOC-13 §3). Con una sola excepción, esa guardia sería estructura sin contenido.

---
*BBW-DESIGN-EXCEPTIONS v1.0 · `docs/system/DESIGN_EXCEPTIONS.md` · 2026-09-16 · nace en la fase 6a (`DESPACHO-BBW-2026-09-16-fase6a-residuales-y-modelo-de-contenido`, D-BBW-16)*
