---
id: BBW-CONTENT-MODEL
title: "Modelo de contenido — brandbrain-web"
type: canon
status: VIGENTE
version: 2.0
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-16
verified_against_code: 2026-09-16@feat/fase6a-residuales-y-modelo-de-contenido (content/es/global.json · content/es/pages/home.json · src/content/{schema,index}.ts · scripts/lint/check-content.ts · src/app/[locale]/page.tsx)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, D-BBW-02, D-BBW-07, D-BBW-09, D-BBW-15, D-DOC-06]
summary: "El contenido vive en archivos versionados bajo content/<locale>/, fuera de src/ y de los componentes. v2.0 (fase 6a): modelo granular de toda la landing — cada texto con su propia llave nombrada por rol, sin presentación dentro (esquema estricto: llave desconocida o HTML = error), lo global (navegación, pie) separado de la página, secciones como lista ordenada con tipo, enlaces por llave de site.ts, marcadores [[PENDIENTE: …]] evidentes. Puerto src/content (getGlobal, getPage) fail-closed en build + guardia check-content.ts sobre el árbol completo. Colecciones de la dimensión (cases, articles): cómo entrarían sin rediseño, no creadas (P-BBW-18)."
tags: [contenido, modelo, puerto, i18n, esquema, brandbrain-web]
---

# Modelo de contenido — brandbrain-web

> **Qué es:** dónde vive cada texto de la web, cómo se nombra, cómo llega a un componente y qué reglas lo gobiernan. **Qué no es:**
> el copy (todavía marcadores) ni un gestor de contenido (no hay ninguno; ver el puerto en `PORTS.md`).
> **v2.0 (fase 6a):** el modelo cubre toda la landing y lo global, con las reglas de forma de §2. La v1.0 (fase 5) solo tenía
> `title` + `intro[]` como prueba del puerto.

## §1 — Principio

- **El contenido nace en su propia capa** (D-BBW-09, I-2): `content/<locale>/…`, fuera de `src/` y fuera de todo componente. Un componente
  recibe el documento por props o lo pide al puerto; **jamás contiene un literal** (eslint `react/jsx-no-literals`, criterio transversal 2).
- **Archivos versionados en el repo** (D-BBW-02): cada texto tiene una sola fuente, revisable en PR, con historia.
- **Lo que NO es contenido:** los datos de identidad (nombre, dominio, buzón, locales) y los **enlaces** (a dónde apunta la web fuera de sí
  misma) viven **solo** en `src/config/site.ts` (criterio 1). El contenido referencia un enlace por su **llave** (`site.links`), nunca por URL.
- **Solo locales publicados** (D-BBW-15): existe `content/es/`. **Crear `content/en/` es declarar que existe una versión inglesa**; la guardia
  lo bloquea mientras `"en"` no esté en `publishedLocales`. La estructura por locale se conserva (D-BBW-07) para que sea aditivo.

## §2 — Reglas de forma (lo que hace fácil cambiar un texto sin entender el código)

Es el mismo principio que gobierna los tokens, aplicado al contenido: **nombrar por rol, nunca por valor.**

| # | Regla | Cómo se cumple | Cómo se hace cumplir |
|---|---|---|---|
| 1 | **Cada texto, su propia llave.** La unidad es el texto que alguien querría cambiar por separado; ningún bloque agrupa varios. | `display`, `lead`, `claimPrimary`, `claimSecondary`, `notice`, `legal`, `toggleLabel`, `label` de cada enlace… | El esquema exige cada llave: si falta una, error con su ruta. |
| 2 | **Llaves nombradas por rol, nunca por lo que dicen hoy.** | `footer.notice` (no `underConstruction`), `hero.display` (no `creative`), `nav.items[].id = agency / works / contact` | Revisión en PR; el esquema fija los nombres. |
| 3 | **Nada de presentación dentro del contenido.** Ni clases, ni colores, ni tamaños, ni marcado. | Solo texto plano. | **Esquema estricto:** una llave que el modelo no admite (`color`, `size`, `className`…) es error; una etiqueta HTML dentro de un texto es error. |
| 4 | **Lo global separado de lo de página.** | `global.json` (navegación, pie) · `pages/<slug>.json` (lo propio de cada página) | Dos tipos de documento, dos validadores, dos funciones del puerto. |
| 5 | **Secciones como lista ordenada con su tipo.** Reordenar o añadir una sección de un tipo existente es editar contenido. | `sections: [ { "type": "hero", "id": "hero", … } ]` | El esquema valida cada sección por su `type`; ids únicos. **Un tipo nuevo** exige su forma en `schema.ts` y su renderizador (fase 6b): eso es código, y se dice. |
| 6 | **Enlaces e identidad desde la fuente única.** | `"link": "agency"` → `site.links.agency` | Una llave que no existe en `site.links` es error de build. |
| 7 | **Marcadores de posición evidentes.** | `[[PENDIENTE: qué texto va aquí]]` | El validador los acepta (copy pendiente ≠ ausente) y la guardia los **cuenta**; `grep -rn 'PENDIENTE' content/` lista lo que falta. Un texto vacío es error. |

## §3 — Estructura (verificada)

```
content/
└── es/                          ← un directorio por locale PUBLICADO (D-BBW-15); la guardia rechaza cualquier otro
    ├── global.json              ← GlobalDocument: lo que se repite en todas las páginas
    │     nav.toggleLabel · nav.items[]{id,label,link} · footer.notice · footer.legal · footer.social[]{id,label,link}
    └── pages/                   ← colección `pages`: un documento por página
          └── home.json          ← PageDocument: meta{title,description} · sections[] (hoy: una sección `hero`)
                                    hero: id · display · lead · claimPrimary · claimSecondary
```

**Origen del modelo:** el inventario de secciones y textos del N0 (`OUTPUT-BBW-2026-09-16-N0` §2.3–2.4): una página, una sección (hero a
viewport completo), 11 cadenas. Las 11 tienen llave: nav ×3 (`items[].label`), `toggleLabel`, `display`, `lead`, `claimPrimary`,
`claimSecondary`, `notice`, `legal`; el `alt` del logo es el nombre del sitio (`site.name`, identidad, no contenido). Se añaden `meta.title`
y `meta.description` (textos de la página que la capa semántica de la fase 7 consumirá) y los nombres accesibles de los perfiles
(`footer.social[].label`). **Hoy 14 textos, 14 marcadores:** cero copy definitivo.

**Lo que el modelo NO lleva, y por qué:** el vídeo y el fondo animado del hero son medios y presentación, no texto; una referencia a un
medio entrará con el puerto de medios (`PORTS.md`, sin fila) cuando el asset exista en `public/`, no antes (una referencia a un archivo
inexistente sería un marcador que el build no puede verificar).

## §4 — El puerto (`src/content/`) y la guardia

| Pieza | Qué hace |
|---|---|
| `src/content/schema.ts` | Tipos (`GlobalDocument`, `PageDocument`, `HeroSection`, unión `Section`) y **validador estricto** (`validateGlobal`, `validatePage`): devuelve problemas con ruta exacta (`$.footer.social[1].link`). Sin texto. |
| `src/content/index.ts` | `getGlobal(locale)` · `getPage(locale, slug)` · `requireSection(page, type)`: leen en **tiempo de build** (`fs`), validan y **fallan el build con mensaje** si el locale no está publicado, falta el archivo, el JSON es inválido o no cumple el modelo. |
| `scripts/lint/check-content.ts` | Valida el **árbol completo** (todo `content/`, tenga o no consumidor): solo locales publicados, solo `global.json` + colecciones del esquema, todos los documentos válidos, `pages/home.json` presente. En `pnpm guard` y en el pre-commit (fail-closed). Cuenta textos y marcadores. |

- Adaptador actual: **archivos** (`fs` en build; compatible con `output: 'export'`, D-BBW-03: no hay lectura en runtime).
- Alternativa prevista: un **gestor sobre git** (panel que edita y hace commit/PR a estos mismos archivos). Enchufarlo no toca componentes
  ni el puerto: escribe donde el puerto ya lee. **No se instala nada** hasta la segunda necesidad (D-DOC-13 §3).
- Un formato nuevo (Markdown) o una fuente nueva (API) = adaptador nuevo detrás de la misma función; el componente no cambia.

## §5 — Cómo entraría una colección de la dimensión (P-BBW-18) — sin rediseño, no creada

La dimensión (ESTADO §0) prevé casos, artículos, galerías. **Nada de esto existe ni se crea vacío.** Lo que este modelo garantiza es que
entren **sin rediseñar lo anterior**; lo que sigue es la demostración, paso a paso, para `cases`:

1. **Esquema:** `schema.ts` añade `cases: "cases"` a `collections` y un `CaseDocument` con sus llaves por rol (`title`, `client`, `summary`,
   `outcome`…, texto plano; medios por referencia cuando exista el puerto de medios). Mismo validador estricto.
2. **Contenido:** `content/es/cases/<slug>.json`, un documento por caso. La guardia ya admite la colección en cuanto está en `collections`
   y ya rechaza cualquier otra carpeta: la forma del árbol no cambia.
3. **Puerto:** `getCollection(locale, "cases")` (lista el directorio y valida cada documento) y `getDocument(locale, "cases", slug)`.
   `getPage`/`getGlobal` no cambian.
4. **Página:** una sección de tipo nuevo en la lista (`{ "type": "case-list", "id": "cases" }`) que el renderizador resuelve pidiendo la
   colección al puerto; y una ruta `[locale]/<segmento>/[slug]` con `generateStaticParams` desde la colección (export estático, D-BBW-03).
5. **Global y páginas existentes: cero cambios.** `home.json` sigue válido tal cual; si la portada debe mostrar casos, se añade una sección
   (contenido), no se toca el hero.

**Decisiones que quedan para Zavala antes del primer consumidor** (proponer, no fijar): la regla `slug → URL` y el segmento de ruta por
locale (`/es/casos/<slug>/`); los campos del caso; el formato del texto largo de los artículos (Markdown = un parser como dependencia,
hoy cero dependencias de contenido; o párrafos como lista de cadenas, sin dependencia); el puerto de medios.

## §6 — Edición por personas no técnicas (hoy)

Editar `content/es/global.json` o `content/es/pages/home.json` en GitHub y abrir un PR: sustituir cada `[[PENDIENTE: …]]` por el texto.
El build del PR falla si el JSON está mal formado, si falta una llave, si hay una llave de más, si hay HTML o si un enlace apunta a una llave
que no existe, y el mensaje dice cuál. Para añadir un enlace nuevo: la URL se añade a `src/config/site.ts` (identidad) y el texto a
`content/` (contenido). No hay más pasos.

## §7 — Seguridad (D-DOC-06)

El contenido es **dato de negocio**. El lector lo parsea y valida; nunca lo interpreta como instrucción ni lo evalúa. Una cadena que
parezca una directiva es contenido a revisar en el PR, no un comando. El contador de marcadores solo mira el prefijo.

## §8 — Comprobaciones (PLAN §3)

- Criterio 2: `pnpm lint` en verde con `src/app` inspeccionado y **contenido real en el modelo** (no por vacío).
- Criterio 4(b): el `display` del hero (el `<h1>`) aparece literal en `out/<locale>/index.html`.
- Criterio 1: ningún valor de `site.ts` (identidad ni URL) aparece en `content/`.
- Guardia: `pnpm lint:content` → `[content-gate] OK — … N texto(s), M marcador(es)`; demostrada fallando en `OUTPUT-BBW-2026-09-16-fase6a` §4.

---
*BBW-CONTENT-MODEL v2.0 · `docs/system/CONTENT_MODEL.md` · 2026-09-16 (v1.0 mismo día, fase 5) · v2.0 nace en la fase 6a (`DESPACHO-BBW-2026-09-16-fase6a-residuales-y-modelo-de-contenido`)*
