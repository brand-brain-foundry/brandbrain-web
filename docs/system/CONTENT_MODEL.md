---
id: BBW-CONTENT-MODEL
title: "Modelo de contenido — brandbrain-web"
type: canon
status: VIGENTE
version: 3.2
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-22
verified_against_code: 2026-09-22@feat/contenido-editable-y-navegacion (content/site.json · content/es/global.json · content/es/pages/home.json · src/content/{site,schema,index,substitutions}.ts · src/config/site.ts · scripts/lint/check-content.ts · scripts/media/build.ts · src/seo/jsonld.ts · src/components/organisms/Header/Header.tsx)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, D-BBW-02, D-BBW-07, D-BBW-09, D-BBW-15, D-BBW-23, D-BBW-74, D-BBW-77, D-BBW-78, D-DOC-06]
summary: "El contenido vive en archivos versionados bajo content/<locale>/, fuera de src/ y de los componentes. v2.0 (fase 6a): modelo granular de toda la landing — cada texto con su propia llave nombrada por rol, sin presentación dentro (esquema estricto: llave desconocida o HTML = error), lo global (navegación, pie) separado de la página, secciones como lista ordenada con tipo, enlaces por llave de site.ts, marcadores [[PENDIENTE: …]] evidentes. Puerto src/content (getGlobal, getPage) fail-closed en build + guardia check-content.ts sobre el árbol completo. v2.1 (fase 6b): +1 llave nav.skipLabel (enlace de salto al contenido); renderizado por tipo de sección (SECTION_RENDERERS) con comportamiento definido ante un tipo sin renderizador (§4). v2.2 (fase 6c, D-BBW-23): sustituciones {{brand}} / {{domain}} / {{year}} resueltas al compilar desde la fuente única; conjunto cerrado y declarado (src/content/substitutions.ts); una no declarada o cualquier lógica entre llaves rompe el build y la guardia (R5). Colecciones de la dimensión (cases, articles): cómo entrarían sin rediseño, no creadas (P-BBW-18). v3.2 (D-BBW-78): LO EDITABLE VIVE EN DATOS — nombre, cargo, buzón y destinos de los enlaces bajan de src/config/site.ts a content/site.json (raíz, fuera de los locales); en código se queda solo lo técnico (dominio, locales, rutas). Nace nav.caseLabel (la palabra del caso, una sola vez) y LinkItem.badge pasa a LinkItem.case booleano."
tags: [contenido, modelo, puerto, i18n, esquema, brandbrain-web]
---

# Modelo de contenido — brandbrain-web

> **Qué es:** dónde vive cada texto de la web, cómo se nombra, cómo llega a un componente y qué reglas lo gobiernan. **Qué no es:**
> el copy (todavía marcadores) ni un gestor de contenido (no hay ninguno; ver el puerto en `PORTS.md`).
> **v2.0 (fase 6a):** el modelo cubre toda la landing y lo global, con las reglas de forma de §2. La v1.0 (fase 5) solo tenía
> `title` + `intro[]` como prueba del puerto. **v2.1 (fase 6b):** una llave más en lo global (`nav.skipLabel`: el enlace para saltar al
> contenido necesita un texto y ningún texto vive en un componente; cambio aditivo, propuesto en el PR de la fase) y el renderizado por tipo (§4).
> **v2.2 (fase 6c, D-BBW-23):** sustituciones en el contenido (§2 regla 8): un conjunto pequeño, cerrado y declarado, resuelto al compilar.


## Héroe rediagramado (D-BBW-47 · D-BBW-49) — v3.0 del modelo, cambio NO aditivo

La sección `hero` cambia de forma entera y lo global estrena una llave. Es el primer cambio **no aditivo** del modelo, y por eso se
declara aquí: un documento con la forma vieja **rompe la compilación** nombrando cada llave, que es justo lo que se quiere (el esquema
es estricto en los dos sentidos: ni una llave de más, ni una de menos).

| Antes | Ahora | Por qué |
|---|---|---|
| `hero.display` (la palabra de marca, era el `<h1>`) | `hero.claimLine1` · `claimLine2` · `claimLine3` | El claim son **tres líneas** y **no son intercambiables**: la última es la que respira. Tres llaves y no una lista, por la regla 1 (cada texto su llave). La llave nombra la POSICIÓN, que aquí es el rol. |
| `hero.lead` | — | El rótulo desaparece con el lockup de dos líneas. |
| `hero.claimPrimary` · `claimSecondary` | `hero.heading` | El `<h1>` pasa a ser **el párrafo**: solo puede haber un encabezado principal por página, y el claim no lo es (biblia v2 §10/§12). |
| `footer.notice` | `signature` (en la raíz de lo global) | La firma vive en lo global y no en la página porque es un dato de identidad de la marca, no copy de la portada. **Una sola llave y —desde D-BBW-50— un solo consumidor**: el héroe, bajo el encabezado. Así la consistencia de entidad que exige la biblia v2 §12 se cumple por la vía limpia: con una sola aparición no hay dos cadenas que conciliar. Cierra Q-BBW-009. |

> **Superado por la v3.1 (abajo):** `signature` ya no existe. Esta fila se conserva sin reescribir porque explica de dónde venía la llave.

Nada de esto cambia las siete reglas del modelo. La regla 2 (llaves por rol, nunca por lo que dicen hoy) es la que decide los nombres:
`claimLine1..3` nombra posición, no contenido; `heading` nombra el papel en el documento, no la frase; `signature` nombra la pieza.

## Enmienda de identidad (D-BBW-58 · D-BBW-60) — v3.1 del modelo, cambio NO aditivo

Una llave menos en lo global y un texto reescrito. No aditivo por la misma razón que la v3.0: el esquema es estricto en los dos sentidos,
así que un `global.json` que todavía traiga `signature` **rompe la compilación nombrando la llave**.

| Antes | Ahora | Por qué |
|---|---|---|
| `signature` (en la raíz de lo global) | — | **Se retira.** La creó D-BBW-49 para el héroe y el pie; D-BBW-50 la dejó con un solo consumidor y `fix(hero): la firma sale del héroe` (PR#26) le quitó también ése. Llevaba desde entonces **sin ningún consumidor** (I-6) y, peor, guardando una **segunda variante del nombre** —el nombre con el cargo pegado— que es justo lo que la consistencia de entidad de la biblia v2 §12 prohíbe. |
| `footer.legal` = `© All rights reserved` | `footer.legal` = `© {{year}} {{brand}}` | El texto era inglés en un sitio en español y **no tenía sujeto**. Ahora nombra al sujeto del sitio y lleva el año, **los dos por sustitución** (D-BBW-23): el contenido no escribe ni el nombre ni la fecha. Es, además, **la única aparición visible del nombre** en la página, que es lo que la regla de los datos estructurados exige (D-BBW-60). |

La regla 2 sigue mandando: `legal` nombra el ROL de la línea (la nota legal del pie), no lo que dice hoy — por eso la llave no se llama
`name` ni `copyright` aunque hoy lleve el nombre y el símbolo de copia.


## Lo editable en datos (D-BBW-78) — v3.2 del modelo, cambio NO aditivo

**La pregunta que lo origina** (Zavala, 2026-09-22): *¿por qué no están todos los textos y enlaces en `global.json` y `home.json`, si todo
debería tener su fuente de verdad?* La respuesta honesta era: tenían una sola fuente, pero **no estaba en la capa de contenido**. El nombre,
el cargo, el buzón y las direcciones vivían en `src/config/site.ts`, y los JSON llevaban solo una llave que apuntaba allí. Era correcto para
la fuente única y **equivocado para quien edita**: un archivo de TypeScript no lo cambia alguien no técnico sin riesgo.

**La regla, ahora:** lo **editable** vive en datos; lo **técnico** vive en código.

| | Qué es | Dónde vive | Por qué |
|---|---|---|---|
| **Editable** | nombre de marca · cargo · buzón publicado · destinos de los enlaces · todos los textos | `content/site.json` y `content/<locale>/…` | Lo cambia quien redacta, en un PR, sin tocar código |
| **Técnico** | dominio canónico · locales · locales publicados · rutas internas · el esquema `mailto:` | `src/config/site.ts` y los componentes | Cambiarlo es una decisión de **despliegue**, no de redacción |

**Por qué `content/site.json` está en la RAÍZ y no dentro de un locale.** Un nombre propio, un buzón y una dirección web **no se traducen**.
Dentro de `content/<locale>/` habría que repetirlos el día que se publique el inglés, que es justo lo que esta decisión prohíbe. La guardia
(R1) admite **ese archivo y ningún otro** suelto en la raíz. El `role` viaja con ellos y es el único de los cuatro que un día podría querer
traducirse: cuando exista copy EN pasa al documento global del locale, y el esquema estricto nombrará la llave en la compilación.

**Por qué pasar a JSON no debilita nada.** El documento se importa como **módulo** (`resolveJsonModule`), así que TypeScript infiere sus
llaves: `LinkKey` se deriva de las llaves reales del archivo y una llave de enlace inexistente en el contenido **sigue siendo error de
tipos**, igual que cuando los enlaces eran un `as const`. Encima, `validateSite` (en `src/content/site.ts`) comprueba lo que los tipos no
pueden y **el puerto lo ejecuta**, rompiendo `next build`, mientras la guardia lo ejecuta sobre el árbol e informa con ruta exacta:

| Lo que rechaza | Mensaje |
|---|---|
| llave de más | `$.tagline: llave desconocida (el modelo no la admite)` |
| texto vacío o con HTML | `$.role: texto vacío` |
| correo mal formado | `$.email: no es una dirección de correo` |
| destino relativo o sin cifrar | `$.links.works: "http://…" no es una dirección absoluta y cifrada (https://…)` |
| `contact` escrito a mano | `$.links.contact: reservada: el código la DERIVA de $.email, y escribirla aquí repetiría el buzón` |

**`contact` es llave RESERVADA.** El buzón se escribe UNA vez, en `$.email`; el código compone `mailto:` + esa dirección. Escribir
`links.contact` en datos guardaría el buzón dos veces, que es exactamente lo que la decisión prohíbe.

**La palabra del caso vive una sola vez.** Cambio de forma en lo global:

| Antes (D-BBW-74/77) | Ahora (D-BBW-78) | Por qué |
|---|---|---|
| `LinkItem.badge: string` — cada elemento escribía su palabra | `LinkItem.case: boolean` — el elemento **declara su condición** | Con un caso no se notaba; con dos serían **dos cadenas que conciliar**, que es lo que la consistencia de entidad evita en los nombres |
| — | `nav.caseLabel: string` — la palabra, **una sola vez** | Si mañana «Caso» pasa a ser otra palabra, se cambia en un sitio y cambia en todos los enlaces que la llevan |

El organismo (`Header.resolveLinks`) reparte la palabra a los elementos que la declaran. Se pinta dentro del `<a>` como texto normal, así que
**entra en el nombre accesible por construcción** —«Sivar Brains Caso», «Pura kaSaka Caso»— sin ningún `aria-label` que pudiera desincronizarse.
Un `global.json` con la forma vieja **rompe la compilación nombrando las dos llaves**.

## §1 — Principio

- **El contenido nace en su propia capa** (D-BBW-09, I-2): `content/<locale>/…`, fuera de `src/` y fuera de todo componente. Un componente
  recibe el documento por props o lo pide al puerto; **jamás contiene un literal** (eslint `react/jsx-no-literals`, criterio transversal 2).
- **Archivos versionados en el repo** (D-BBW-02): cada texto tiene una sola fuente, revisable en PR, con historia.
- **Lo que NO es contenido:** solo lo **técnico** — dominio canónico, locales, locales publicados y rutas internas — vive en
  `src/config/site.ts` (criterio 1). El nombre, el cargo, el buzón y los **enlaces** (a dónde apunta la web fuera de sí misma) son editables y
  viven en `content/site.json` desde D-BBW-78. Un documento de texto referencia un enlace por su **llave** (`identity.links`), nunca por URL.
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
| 6 | **Enlaces e identidad desde la fuente única.** Desde D-BBW-78 esa fuente es un archivo de **datos**, no de código; la regla no cambia, cambia dónde vive. | `"link": "agency"` → `content/site.json` `$.links.agency` | Una llave que no existe es **error de tipos** (el JSON se importa como módulo) **y** error del validador y de la guardia, con la ruta exacta. |
| 7 | **Marcadores de posición evidentes.** | `[[PENDIENTE: qué texto va aquí]]` | El validador los acepta (copy pendiente ≠ ausente) y la guardia los **cuenta**; `grep -rn 'PENDIENTE' content/` lista lo que falta. Un texto vacío es error. |
| 8 | **Sustituciones: pequeñas, cerradas, declaradas; sin lógica** (D-BBW-23, fase 6c). Un texto puede escribir `{{brand}}`, `{{domain}}` o `{{year}}` y el puerto lo resuelve **al compilar** desde la fuente única (`site.ts`): el contenido no repite datos de identidad (criterio 1). | `"legal": "© {{year}} {{brand}}"` → `© 2026 Christian Zavala Cubas` en el HTML (D-BBW-60: ése es hoy el contenido real de la llave, y la única aparición visible del nombre) | El registro es `src/content/substitutions.ts` (llave → valor). La única forma válida es `{{identificador}}`: **una llave no declarada, o cualquier otra cosa entre llaves (condición, bucle, argumento), rompe el build** (puerto) y la guardia (`check-content.ts` R5) con la ruta exacta. Ampliar el conjunto = añadir una llave al registro (y su origen en `site.ts` si es identidad), nunca lógica en el texto. |

## §3 — Estructura (verificada)

```
content/
├── site.json                    ← SiteDocument (D-BBW-78): la identidad EDITABLE, fuera de los locales porque no se traduce
│                                  brand · role · email · links{ agency, studio, works, linkedin, github }
│                                  (`contact` NO se escribe: el código la deriva de `email`)
└── es/                          ← un directorio por locale PUBLICADO (D-BBW-15); la guardia rechaza cualquier otro
    ├── global.json              ← GlobalDocument: lo que se repite en todas las páginas
    │     nav.skipLabel · nav.toggleLabel · nav.caseLabel · nav.items[]{id,label,link,case?} ·
    │     footer.legal · footer.social[]{id,label,link}
    └── pages/                   ← colección `pages`: un documento por página
          └── home.json          ← PageDocument: meta{title,description} · sections[] (hoy: una sección `hero`)
                                    hero: id · claimLine1..3 · heading
```

**Origen del modelo:** el inventario de secciones y textos del N0 (`OUTPUT-BBW-2026-09-16-N0` §2.3–2.4): una página, una sección (hero a
viewport completo), 11 cadenas. Las 11 tienen llave: nav ×3 (`items[].label`), `toggleLabel`, `display`, `lead`, `claimPrimary`,
`claimSecondary`, `notice`, `legal`; el `alt` del logo es el nombre del sitio (`site.name`, identidad, no contenido). Se añaden `meta.title`
y `meta.description` (textos de la página que la capa semántica de la fase 7 consumirá) y los nombres accesibles de los perfiles
(`footer.social[].label`) y, en la fase 6b, el texto del enlace de salto (`nav.skipLabel`). **Hoy 15 textos, 15 marcadores:** cero copy definitivo.

**Lo que el modelo NO lleva, y por qué:** el vídeo y el fondo animado del hero son medios y presentación, no texto; una referencia a un
medio entrará con el puerto de medios (`PORTS.md`, sin fila) cuando el asset exista en `public/`, no antes (una referencia a un archivo
inexistente sería un marcador que el build no puede verificar).

## §4 — El puerto (`src/content/`) y la guardia

| Pieza | Qué hace |
|---|---|
| `src/content/site.ts` | El **documento del sitio** (D-BBW-78): lo importa como módulo (de ahí sale `LinkKey`, con la fuerza de los tipos), lo valida (`validateSite`, estricto en los dos sentidos) y expone `identity` con `contact` **derivada** del buzón. No rompe al cargarse a propósito: lo importa también la guardia, y un `throw` en su carga la dejaría sin informe. |
| `src/content/schema.ts` | Tipos (`GlobalDocument`, `PageDocument`, `HeroSection`, unión `Section`) y **validador estricto** (`validateGlobal`, `validatePage`): devuelve problemas con ruta exacta (`$.footer.social[1].link`). Sin texto. |
| `src/content/index.ts` | `getGlobal(locale)` · `getPage(locale, slug)` · `requireSection(page, type)`: leen en **tiempo de build** (`fs`), validan, **resuelven las sustituciones** (v2.2) y **fallan el build con mensaje** si el locale no está publicado, falta el archivo, el JSON es inválido, no cumple el modelo o usa una sustitución no declarada. |
| `src/content/substitutions.ts` | Registro cerrado de sustituciones (`brand`, `domain`, `year`) con sus valores desde la fuente única; `findUndeclaredSubstitutions` (lista cada `{{…}}` inválido con su ruta) y `resolveDocument` (copia del documento con los textos resueltos; las llaves estructurales `id`/`type`/`link`, intactas). Búsqueda en tabla: nada se evalúa (D-DOC-06). |
| `scripts/lint/check-content.ts` | Valida el **árbol completo** (todo `content/`, tenga o no consumidor): solo locales publicados, solo `global.json` + colecciones del esquema, todos los documentos válidos, `pages/home.json` presente, **solo sustituciones declaradas (R5)**. En `pnpm guard` y en el pre-commit (fail-closed). Cuenta textos, marcadores y sustituciones en uso. |

- Adaptador actual: **archivos** (`fs` en build; compatible con `output: 'export'`, D-BBW-03: no hay lectura en runtime).
- Alternativa prevista: un **gestor sobre git** (panel que edita y hace commit/PR a estos mismos archivos). Enchufarlo no toca componentes
  ni el puerto: escribe donde el puerto ya lee. **No se instala nada** hasta la segunda necesidad (D-DOC-13 §3).
- Un formato nuevo (Markdown) o una fuente nueva (API) = adaptador nuevo detrás de la misma función; el componente no cambia.

**Renderizado por tipo (fase 6b, `src/components/sections/index.tsx`).** La página recorre `page.sections` en orden y elige el renderizador por
`section.type` en el mapa `SECTION_RENDERERS`, tipado como `{ [T in SectionType]: … }`: **añadir un tipo de sección = su forma en `schema.ts`
(unión `Section` + `SECTION_KEYS`) + su componente en `sections/` + su entrada en el mapa.** Si falta la entrada, el typecheck falla nombrando
el mapa. Reordenar o repetir una sección de un tipo existente es editar `home.json`: cero código (demostrado en el output de la fase 6b).
**Tipo desconocido:** nunca se omite en silencio. Primera barrera: el validador del puerto y la guardia rechazan el documento en build con la
ruta exacta (`$.sections[i].type`). Segunda barrera (defensa en profundidad, por si el esquema y el mapa se desalinean): `renderSection` lanza
un error que nombra la página, el `id` y el `type` de la sección, y `next build` falla. Coherente con el puerto: falla cerrado.

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

Editar `content/site.json`, `content/es/global.json` o `content/es/pages/home.json` en GitHub y abrir un PR: sustituir cada `[[PENDIENTE: …]]` por el texto.
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
*BBW-CONTENT-MODEL v3.2 · `docs/system/CONTENT_MODEL.md` · 2026-09-22 (v3.2: D-BBW-78, lo editable en datos y la palabra del caso una sola vez) · 2026-09-17 (v1.0 y v2.0/v2.1 el 2026-09-16: fase 5; fase 6a `DESPACHO-BBW-2026-09-16-fase6a-residuales-y-modelo-de-contenido`; fase 6b `skipLabel` y renderizado por tipo) · v2.2 fase 6c (sustituciones, D-BBW-23)*
