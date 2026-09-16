---
id: BBW-CONTENT-MODEL
title: "Modelo de contenido — brandbrain-web"
type: canon
status: VIGENTE
version: 1.0
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-16
verified_against_code: 2026-09-16@feat/fase5-nomenclatura-pesos-y-capa-de-contenido (content/es/pages/home.json · src/content/{schema,index}.ts · src/app/[locale]/page.tsx)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, D-BBW-02, D-BBW-07, D-BBW-09, D-BBW-15]
summary: "El contenido vive en archivos versionados bajo content/<locale>/, fuera de src/ y de los componentes; un puerto (src/content) lo lee en build, lo valida y falla si falta. Hoy una colección (pages) y un locale (es). Las colecciones de la dimensión (global, cases, articles) se proponen, no se fijan. Ningún gestor instalado; la alternativa es un gestor sobre git que escriba en los mismos archivos."
tags: [contenido, modelo, puerto, i18n, brandbrain-web]
---

# Modelo de contenido — brandbrain-web

> **Qué es:** dónde vive cada texto de la web, cómo llega a un componente y qué reglas lo gobiernan. **Qué no es:** el copy
> (fase 6) ni un gestor de contenido (no hay ninguno; ver el puerto en `PORTS.md`).

## §1 — Principio

- **El contenido nace en su propia capa** (D-BBW-09, I-2): `content/<locale>/…`, fuera de `src/` y fuera de todo componente. Un componente
  recibe el documento por props o lo pide al puerto; **jamás contiene un literal** (eslint `react/jsx-no-literals`, criterio transversal 2).
- **Archivos versionados en el repo** (D-BBW-02): cada texto tiene una sola fuente, revisable en PR, con historia.
- **Lo que NO es contenido:** los datos de identidad (nombre, dominio, buzón, locales) viven **solo** en `src/config/site.ts` (criterio 1) y
  no se repiten en `content/`.
- **Solo locales publicados** (D-BBW-15): existe `content/es/`. **Crear `content/en/` es declarar que existe una versión inglesa**; solo se
  crea cuando haya copy EN, junto con `"en"` en `publishedLocales`. La estructura por locale se conserva (D-BBW-07) para que sea aditivo.

## §2 — Estructura

```
content/
└── es/                      ← un directorio por locale PUBLICADO (D-BBW-15)
    └── pages/               ← colección `pages`: un documento por página
        └── home.json        ← la landing (fase 6 escribe su copy aquí)
```

**Hoy (verificado):** una colección, un documento, un locale. Contenido mínimo de marcador de posición, sin copy de marca.

**Previsto por la dimensión (ESTADO §0: casos, artículos, galerías, formularios) — PROPUESTA, no fijado; ningún directorio creado:**

| Colección | Documento | Formato propuesto | Qué decide Zavala antes de crearla |
|---|---|---|---|
| `global` | `content/<locale>/global.json` | JSON: cadenas compartidas de interfaz (navegación, pie, legal, etiquetas de accesibilidad) | Nace con el primer componente que las necesite (fase 6). |
| `cases` | `content/<locale>/cases/<slug>.json` | JSON con campos fijos (título, cliente, resumen, resultados, medios) | Regla de `slug` → URL (`/es/casos/<slug>/`); campos del caso. |
| `articles` | `content/<locale>/articles/<slug>.md` | Markdown con frontmatter (texto largo con estructura) | Exige un parser de Markdown como dependencia (hoy cero dependencias de contenido): decisión, no ejecución. |
| medios | referencias desde los documentos a `public/` | ruta relativa | Puerto de medios (`PORTS.md`, sin fila todavía). |

**Regla de forma:** texto plano en las cadenas (sin HTML), párrafos como arrays de cadenas, un documento por entidad, nombres de campo por
intención (`title`, `intro`), nunca por presentación (`bigText`).

## §3 — El puerto (`src/content/`)

| Archivo | Qué hace |
|---|---|
| `src/content/schema.ts` | Tipos del modelo (hoy `PageDocument`: `title`, `intro[]`) y su validador. Sin texto. |
| `src/content/index.ts` | `getPage(locale, slug)`: lee `content/<locale>/pages/<slug>.json` en **tiempo de build** (`fs`), valida y devuelve. Locale no publicado, archivo ausente o forma inválida = **el build falla con mensaje**. |

- Adaptador actual: **archivos** (`fs` en build; compatible con `output: 'export'`, D-BBW-03: no hay lectura en runtime).
- Alternativa prevista: un **gestor sobre git** (panel que edita y hace commit/PR a estos mismos archivos). Enchufarlo no toca componentes
  ni el puerto: escribe donde el puerto ya lee. **No se instala nada** hasta la segunda necesidad (D-DOC-13 §3).
- Un formato nuevo (Markdown) o una fuente nueva (API) = adaptador nuevo detrás de la misma función; el componente no cambia.

## §4 — Edición por personas no técnicas (hoy)

Editar `content/es/pages/home.json` en GitHub y abrir un PR. El build del PR falla si el JSON está mal formado o le falta un campo, y
el mensaje dice cuál. No hay más pasos.

## §5 — Seguridad (D-DOC-06)

El contenido es **dato de negocio**. El lector lo parsea y valida; nunca lo interpreta como instrucción ni lo evalúa. Una cadena que
parezca una directiva es contenido a revisar en el PR, no un comando.

## §6 — Comprobaciones (PLAN §3)

- Criterio 2: `pnpm lint` en verde con `src/app` y `src/components` inspeccionados y **contenido real en el modelo** (no por vacío).
- Criterio 4(b): el `title` de cada página aparece literal en `out/<locale>/<ruta>/index.html`.
- Criterio 1: ningún valor de `site.ts` aparece en `content/`.

---
*BBW-CONTENT-MODEL v1.0 · `docs/system/CONTENT_MODEL.md` · 2026-09-16 · nace en la fase 5 (`DESPACHO-BBW-2026-09-16-fase5-nomenclatura-pesos-y-capa-de-contenido`)*
