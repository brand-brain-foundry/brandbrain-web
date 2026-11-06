---
id: BBW-CONTENT-MODEL
title: "Modelo de contenido — brandbrain-web"
type: canon
status: VIGENTE
version: 3.8
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-11-06
verified_against_code: 2026-11-06@fix/cierre-legal-y-heroe-movil (v3.8: `consent.footerLink` → `consent.configureButton`; `LegalSection.action?: { kind, label }` con el conjunto cerrado `LEGAL_ACTION_KINDS` = [consent-configure] y el mapa `LEGAL_ACTIONS` en LegalSection.tsx; `kind` estructural en schema/puerto/sustituciones; content/es/global.json · content/es/pages/{cookies,privacidad}.json · src/components/organisms/ConsentBar/ConsentConfigure.tsx) · 2026-11-06@feat/consentimiento (v3.7: global.consent, span { global }, parte { table }, sustituciones consentKey/consentMonths, getGlobal resuelve referencias; content/site.json · content/es/global.json · content/es/pages/{home,aviso-legal,privacidad,cookies}.json · src/content/{site,schema,index,substitutions}.ts · src/config/{site,pages}.ts · scripts/lint/check-content.ts · src/components/sections/index.tsx · src/components/sections/LegalSection/ · src/components/organisms/Footer/Footer.tsx · public/{_headers,_redirects})
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, D-BBW-02, D-BBW-07, D-BBW-09, D-BBW-15, D-BBW-23, D-BBW-74, D-BBW-77, D-BBW-78, P-BBW-82, D-DOC-06]
summary: "El contenido vive en archivos versionados bajo content/<locale>/, fuera de src/ y de los componentes. v2.0 (fase 6a): modelo granular de toda la landing — cada texto con su propia llave nombrada por rol, sin presentación dentro (esquema estricto: llave desconocida o HTML = error), lo global (navegación, pie) separado de la página, secciones como lista ordenada con tipo, enlaces por llave de site.ts, marcadores [[PENDIENTE: …]] evidentes. Puerto src/content (getGlobal, getPage) fail-closed en build + guardia check-content.ts sobre el árbol completo. v2.1 (fase 6b): +1 llave nav.skipLabel (enlace de salto al contenido); renderizado por tipo de sección (SECTION_RENDERERS) con comportamiento definido ante un tipo sin renderizador (§4). v2.2 (fase 6c, D-BBW-23): sustituciones {{brand}} / {{domain}} / {{year}} resueltas al compilar desde la fuente única; conjunto cerrado y declarado (src/content/substitutions.ts); una no declarada o cualquier lógica entre llaves rompe el build y la guardia (R5). Colecciones de la dimensión (cases, articles): cómo entrarían sin rediseño, no creadas (P-BBW-18). v3.2 (D-BBW-78): LO EDITABLE VIVE EN DATOS — nombre, cargo, buzón y destinos de los enlaces bajan de src/config/site.ts a content/site.json (raíz, fuera de los locales); en código se queda solo lo técnico (dominio, locales, rutas). Nace nav.caseLabel (la palabra del caso, una sola vez) y LinkItem.badge pasa a LinkItem.case booleano. v3.3 (2026-11-02): hero nuevo sobre fondo oscuro (heading + paragraph1/2 + ctaPrimary/Secondary). v3.4 (P-BBW-73/74/75, 2026-11-05): primera página secundaria — `content/es/pages/privacidad.json` con `sections[{type:\"legal\"}]`; tipo `Span = string | {text,link}` para prosa con enlaces inline; `LegalSection` completo en schema.ts; sustitución `{{email}}` añadida al registro; `footer.privacy{label}` en GlobalDocument; enlace `aepd` añadido a content/site.json. v3.5 (correcciones, 2026-11-05): CAMBIO NO ADITIVO en LegalBlock — `body: Span[][] + items?: string[]` reemplazado por `parts: Array<{p: Span[]} | {list: string[]}>` para preservar el orden declarado; `updated` vive DENTRO de la sección (SECTION_KEYS.legal) no en la raíz del PageDocument; enlace Privacidad como hijo directo del footer flex, con roles de viewport para orden en móvil. v3.6 (P-BBW-80 L2b, 2026-11-05): CAMBIO NO ADITIVO — `footer.privacy` y `footer.legalLinks` eliminados; `global.legal.{updatedLabel,pages}` clave top-level; `LegalPagesMap = Record<string,{label}>` reemplaza `LegalLinkItem`; `updatedLabel` generado por el puerto desde global (no por página); `{page:slug}` como nuevo span inline resuelto por el puerto a `{text,path}`; sustitución `{{legalForm}}`; tres páginas legales (aviso-legal/privacidad/cookies); `src/config/pages.ts` registro fuente única de páginas legales; R6 guardia coherencia headers/_redirects. v3.8 (P-BBW-82 enmienda 1, 2026-11-06): CAMBIO NO ADITIVO — «Configurar cookies» sale del pie: `consent.footerLink` → `consent.configureButton`; la sección legal admite `action?: { kind, label }` (conjunto cerrado `LEGAL_ACTION_KINDS`, hoy `consent-configure`: el botón que abre el panel, al principio de la página de Cookies; `kind` es llave estructural)."
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

## Página de privacidad del asistente (P-BBW-73/74/75, 2026-11-05) — v3.4 del modelo

Primera **página secundaria** del sitio (`/es/privacidad/`): política de privacidad del asistente de llamadas de IA.

### Tipo `Span` — prosa con enlaces inline

Los textos legales necesitan referencias dentro del párrafo (un buzón, un enlace externo). La regla 3 del modelo prohíbe HTML en el contenido; la regla 6 exige que los enlaces vayan por llave. La solución: **`Span = string | { text: string; link: LinkKey }`**. Un párrafo es `Span[]` (antes era `string`). El texto de un span objeto SE resuelven las sustituciones; la llave `link` es estructural y el puerto la deja intacta (igual que `id`/`type`/`case`).

### Sustitución `{{email}}`

Añadida a `src/content/substitutions.ts`: `email → identity.email` (= `christian@zavalacubas.com`). Se declara aquí y en ningún otro sitio (criterio 1). Usada tres veces en `privacidad.json`; la guardia la cuenta y la valida.

### `LegalSection` en el esquema

`schema.ts` añade `LegalSection` (tipo `"legal"`): `id · heading · intro: Span[] · blocks: LegalBlock[] · updatedLabel: string · updated: string`. `LegalBlock = { heading: string; parts: Array<{ p: Span[] } | { list: string[] }> }` — las partes se renderizan en orden de declaración, sin imponer primero los párrafos ni las listas. `Section = HeroSection | LegalSection`; `SectionType` se deriva de la unión (sin literal suelto). `SECTION_RENDERERS` añade `legal: LegalSection` — un tipo sin renderizador sigue rompiendo el typecheck.

> **v3.5 (correcciones, 2026-11-05) — CAMBIO NO ADITIVO.** `LegalBlock.parts` reemplaza `body: Span[][] + items?: string[]`. El esquema viejo imponía párrafos-antes-de-listas; el nuevo respeta el orden de declaración (C1). Un `LegalBlock` con la forma anterior — `body`/`items` en vez de `parts` — rompe la compilación nombrando las llaves. `updated: string` vive **dentro de la sección** (`SECTION_KEYS.legal`), no en la raíz del `PageDocument`; `PageDocument` solo admite `meta` y `sections`.

```
"parts": [
  { "list": ["Telnyx, que gestiona la línea.", "ElevenLabs, que presta el asistente."] },
  { "p": ["Puedes pedir garantías a ", { "text": "{{email}}", "link": "contact" }, "."] }
]
```

### `footer.privacy` en lo global

`GlobalDocument.footer` añade `privacy: { label: string }`. Cambio aditivo: `global.json` con la forma anterior habría fallado por llave faltante (el esquema es estricto en los dos sentidos). El enlace de privacidad del pie llega así al pie, sin URL escrita en el componente: `Footer` recibe `locale: Locale` y construye `/${locale}/privacidad/`.

### Enlace `aepd` en `content/site.json`

`"aepd": "https://www.aepd.es"` añadido al objeto `links`. Usado en `privacidad.json` como `{ "text": "Agencia Española de Protección de Datos", "link": "aepd" }`. La URL vive una sola vez (criterio 1). Cambio aditivo a `SiteDocument`.

### `content/es/pages/privacidad.json`

Documento con 10 bloques, copy verbatim (Q-BBW-021 abierta: CC no reescribe el texto legal). Sustituciones: `{{email}}` ×3, `{{brand}}` ×0 (el nombre del responsable va escrito porque es un dato de otra entidad). `updatedLabel: "Última actualización: 2026-11-05"`. `updated: "2026-11-05"` como campo de la sección (dentro de `sections[0]`, no en la raíz del PageDocument: la raíz solo admite `meta` y `sections`).

## El cuerpo de la home nueva sobre el héroe oscuro (2026-11-02) — v3.3 del modelo, cambio NO aditivo

| Antes | Ahora | Por qué |
|---|---|---|
| `hero.claimLine1..3` · `hero.heading` (el párrafo como `<h1>`) | `hero.heading` (el titular, `<h1>`) · `paragraph1` · `paragraph2` · `ctaPrimary` · `ctaSecondary` · `ctaSecondaryLink` | Orden de Zavala: el claim sale y entra el cuerpo de la home nueva. Cada texto su llave por rol; el destino secundario es una llave de `site.json`, el primario es el contacto derivado del buzón. |
| `footer.social` con LinkedIn y GitHub | `footer.social` solo con LinkedIn · `footer.cert{label}` | GitHub sale del pie y de la hoja (su destino sigue en `site.json` porque lo usa `sameAs`). El sello enlaza a `links.credly` y no muestra el nivel. |

## «Configurar cookies» pasa del pie a la página de Cookies (P-BBW-82 enmienda 1, 2026-11-06) — v3.8 del modelo, cambio NO aditivo

**Lo firmado (enmienda 1 de P-BBW-82):** «"Configurar cookies" pasa del pie a la página Cookies, como botón al principio de la página, enlazada
desde el pie de todas las páginas. La elección se cambia desde ahí en cualquier momento.» RGPD art. 7.3 (retirar tan fácil como dar) se cumple
desde la página que lo explica; el pie queda en sus tres páginas («Aviso legal · Privacidad · Cookies»), que ya no parten en dos líneas en el teléfono.

### `consent.configureButton` sustituye a `consent.footerLink`
**CAMBIO NO ADITIVO.** Es el nombre del botón («Configurar cookies»), una sola vez. Un `global.json` que todavía traiga `footerLink` **rompe la
compilación nombrando la llave**. Lo consume el botón de la página de Cookies (por la acción de abajo) y lo citan los textos de Cookies y de
Privacidad por `{ global: "consent.configureButton" }` (ninguno escribe la cadena, I-1).

### `LegalSection.action?: { kind, label }` — la acción de una página legal
**Llave ADMITIDA (opcional) de la sección `legal`.** Declara el control que el sistema coloca **tras la introducción**: `kind` es llave
**estructural** (qué control; no se recorre como texto ni admite sustituciones, igual que `id`, `type`, `link`, `case`, `page`, `global`) y
`label` su texto, que el JSON cita del global y el puerto entrega resuelto como cadena. El conjunto de acciones es **cerrado** en
`src/content/schema.ts` (`LEGAL_ACTION_KINDS`, hoy `["consent-configure"]`): un `kind` fuera de él rompe el build con la ruta; una acción
declarada sin componente en el mapa `LEGAL_ACTIONS` de `LegalSection.tsx` rompe el typecheck (el patrón de `SECTION_RENDERERS`, §4).
```json
"action": { "kind": "consent-configure", "label": { "global": "consent.configureButton" } }
```
`consent-configure` = el botón que abre el panel del consentimiento (`ConsentConfigure`, `src/components/organisms/ConsentBar/`, cliente: mismo
átomo y misma variante que los botones del banner; lleva la marca `data-consent-configure` que el organismo escucha por delegación). **Sin
JavaScript no se muestra:** el HTML servido lo trae con la caja reservada y `visibility: hidden` (sin salto de disposición al aparecer), y el
cliente lo descubre al hidratar. Primer y único consumidor: `cookies.json`.

### Textos que cambian (los dos únicos del despacho)
Cookies, «Cómo aceptar, rechazar o cambiar»: «… La elección se puede cambiar cuando se quiera con el botón «{configureButton}» de esta
página. También se puede borrar desde los ajustes del navegador.» Privacidad, «La medición de visitas», base legal: «… Se puede retirar en
cualquier momento desde la página {page:cookies}.» (sale «con la misma facilidad con que se dio»).

### Estructura verificada (añadido a §3)
`global.json`: `consent.footerLink` → `consent.configureButton`. `cookies.json`: `sections[0].action{kind,label}`; la cita `{ global }` del
bloque «Cómo aceptar…» pasa a `consent.configureButton` (cuatro citas siguen). `privacidad.json`: la cita `{ global }` de «La medición de visitas»
sale y entra una referencia `{ page: "cookies" }`.

## Consentimiento y medición de visitas (P-BBW-82, L3, 2026-11-06) — v3.7 del modelo, cambio NO aditivo

### `global.consent` — los textos del banner, del panel y del enlace del pie
**CAMBIO NO ADITIVO.** `GlobalDocument` gana `consent: ConsentDocument`; un `global.json` sin `consent` **rompe la compilación nombrando la llave**.
Es global porque el banner (primera capa) y el enlace «Configurar cookies» del pie salen en TODAS las páginas. Cada texto, su llave por rol:

| Llave | Qué es |
|---|---|
| `consent.banner.label` · `text: Span[]` · `reject` · `accept` · `configure` | La barra inferior: nombre accesible de la región (`aria-label`, sin rótulo visible desde 2026-11-06), texto (con `{ page: "cookies" }`) y los tres botones al mismo nivel |
| `consent.panel.title` · `necessary{label,status,text}` · `measurement{label,text}` · `rejectAll` · `acceptAll` · `save` | El panel (`<dialog>` nativo): la categoría técnica siempre activa, la medición con su interruptor, y sus tres botones |
| `consent.footerLink` | El enlace permanente del pie: en el HTML lleva a la página de Cookies; con JavaScript abre el panel. **v3.8: sustituida por `consent.configureButton`** (el botón de la página de Cookies) |

El consumidor es `src/components/organisms/ConsentBar/` (cliente: solo cablea; la preferencia es de `src/behavior/consent.ts` y la medición del
puerto `src/analytics/port.ts`, `PORTS.md` fila «Analítica»). El pie consume `consent.footerLink`.

### `{ global: "ruta.de.llaves" }` — citar un texto del global sin repetirlo
**Nuevo span.** La página de Cookies tiene que nombrar los botones del banner («Rechazar», «Aceptar», «Configurar») y el enlace del pie
(«Configurar cookies»). Copiarlos sería tener dos cadenas que conciliar; por eso el texto los **cita por su llave**:
```json
["La primera vez aparece un aviso con «", { "global": "consent.banner.reject" }, "», «", { "global": "consent.banner.accept" }, "»…"]
```
El puerto (`resolveRefs`) sustituye el tramo por la cadena del documento global **del mismo locale** antes de entregar el documento: el
componente solo ve texto. Una ruta que no exista o no lleve a un texto **rompe el build** con la ruta exacta. El validador exige la forma
`a.b.c` (identificadores separados por punto). Se resuelve también dentro del propio `global.json` (el banner cita la página de Cookies con
`{ page }`): `getGlobal` resuelve sus referencias contra sus propias etiquetas.

### `{ table: { columns, rows } }` — una tabla dentro de un bloque legal
**Nueva parte de `LegalBlock.parts`**, junto a `{ p }` y `{ list }`. `columns: string[]` (rótulos) y `rows: string[][]`; **cada fila tiene
exactamente tantas celdas como columnas** (el validador lo exige con la ruta de la fila). Las celdas son texto plano con sustituciones.
Cómo se lee en un teléfono lo decide el sistema (roles `--bbf-legal-table-*` de `semantic/viewport.css`: la cabecera se oculta y cada celda
antepone el rótulo de su columna), no el contenido. Primer consumidor: la tabla «Lo que usa esta web» de `cookies.json`.

### Sustituciones `{{consentKey}}` y `{{consentMonths}}`
Dos llaves más en el registro cerrado (`src/content/substitutions.ts`), leídas de `src/config/consent.ts`: **la misma constante** que usa el
código que guarda y juzga la preferencia (`CONSENT_STORAGE_KEY`, `CONSENT_MONTHS`). Así la página de Cookies no puede decir «24 meses» y el
navegador hacer otra cosa (I-1). Son técnicas: viven en código.

### Estructura verificada (añadido a §3)
`global.json` suma `consent.banner{label,text[],reject,accept,configure} · consent.panel{title,necessary{label,status,text},measurement{label,text},rejectAll,acceptAll,save} · consent.footerLink`.
`cookies.json` reescrito (insumo TEXTOS-CONSENTIMIENTO-L3 §4): cinco bloques, una tabla, cuatro citas `{ global }`, dos sustituciones nuevas.
`privacidad.json`: intro «tres partes» y bloque nuevo «La medición de visitas» (insumo §5), con una cita `{ global }`.

## Tres páginas legales y registro de páginas (P-BBW-80 L2b, 2026-11-05) — v3.6 del modelo, cambio NO aditivo

### `src/config/pages.ts` — registro fuente única de páginas legales

`LEGAL_PAGES` es la única fuente de verdad para los slugs legales, sus flags de indexación y el orden en el pie. No vive en `content/`
(no es texto editable) ni en `schema.ts` (no es validador): es configuración de enrutamiento y se importa por `Footer`, `sitemap.ts`,
`robots.ts` y la guardia R6. `SITEMAP_LEGAL_SLUGS` se deriva de él filtrando `inSitemap: true`.

### `global.legal` — labels y `updatedLabel` en lo global, no por página

**CAMBIO NO ADITIVO.** `footer.privacy` y `footer.legalLinks` desaparecen; aparece `global.legal` con dos llaves:

| Llave | Contenido | Quién la usa |
|---|---|---|
| `global.legal.updatedLabel` | La etiqueta de fecha (`"Última actualización"`) | El puerto la inyecta al llamar `addUpdatedLabels()` |
| `global.legal.pages` | `LegalPagesMap = Record<string, { label: string }>` — un label por slug | `Footer` para renderizar los enlaces |

Un `global.json` con `footer.privacy` o `footer.legalLinks` **rompe la compilación** (el esquema lo nombra). Un `global.json` sin `global.legal` también.

### `{page: slug}` — referencias cruzadas entre páginas legales

**Nuevo span en el contenido.** Junto a `string` y `{ text: string; link: LinkKey }`, los documentos legales pueden escribir
`{ "page": "<slug>" }` para hacer referencia a otra página por su slug (sin escribir la URL). El puerto llama `resolvePageRefs()`
antes de entregar el documento y convierte cada `{page}` en `{text: label, path: "/${locale}/${slug}/"}` —
el componente nunca ve `{page}`, solo `{path}`. Un slug desconocido falla en build. `LegalSection.renderSpan` maneja `{path}` como `<Link>`.

```json
["El tratamiento de datos se explica en ", {"page": "privacidad"}, "."]
```

### Sustitución `{{legalForm}}` y `content/site.json`

`"legalForm": "profesional autónomo"` añadido a `SiteDocument`. La sustitución la leen los documentos legales donde antes iban
literales. Cambio aditivo a `SiteDocument`; `validateSite` actualizado.

### `updatedLabel` fuera de cada sección

**CAMBIO NO ADITIVO.** `LegalSection` ya no tiene la llave `updatedLabel`. La genera el puerto (`addUpdatedLabels`) combinando
`global.legal.updatedLabel` + el valor `updated` de cada sección. Un `pages/*.json` que traiga `updatedLabel` en una sección
**rompe la compilación** (llave desconocida). Las tres páginas legales no lo traen.

### R6 — guardia de coherencia headers/_redirects

`check-content.ts` añade R6: comprueba que cada página con `indexed: false` tenga la regla `X-Robots-Tag: noindex, noarchive` en
`public/_headers`, y que cada slug de `LEGAL_PAGES` tenga su 301 en `public/_redirects`. Una discordancia falla la guardia (exit 1).

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
│                                  brand · role · email · legalForm · links{ agency, studio, works, linkedin, github, credly, aepd }
│                                  (`contact` NO se escribe: el código la deriva de `email`)
└── es/                          ← un directorio por locale PUBLICADO (D-BBW-15); la guardia rechaza cualquier otro
    ├── global.json              ← GlobalDocument: lo que se repite en todas las páginas
    │     nav.skipLabel · nav.toggleLabel · nav.caseLabel · nav.items[]{id,label,link,case?} ·
    │     footer.legal · footer.social[]{id,label,link} · footer.cert{label} ·
    │     legal.updatedLabel · legal.pages{ aviso-legal{label}, privacidad{label}, cookies{label} } ·
    │     consent.banner{label,text[],reject,accept,configure} · consent.panel{…} · consent.configureButton (v3.8)
    └── pages/                   ← colección `pages`: un documento por página
          ├── home.json          ← PageDocument: meta{title,description} · sections[] (una sección `hero`)
          │                         hero: id · heading · paragraph1 · paragraph2 · ctaPrimary · ctaSecondary · ctaSecondaryLink
          ├── privacidad.json    ← PageDocument: meta{title,description} · sections[] (una sección `legal`)
          │                         legal: id · heading · intro: Span[] · blocks: LegalBlock[] · updated
          ├── aviso-legal.json   ← PageDocument igual · secciones legales · {{nif}}/{{domicilio}}/{{telefono}} (restringidas)
          └── cookies.json       ← PageDocument igual · secciones legales · action{kind: consent-configure, label} (v3.8)
```

**Tipos de Span** (prosa con referencias inline):

| Forma | Qué hace |
|---|---|
| `"texto plano"` | Texto sin más |
| `{ "text": "…", "link": "aepd" }` | Enlace externo por llave de `site.json` |
| `{ "page": "privacidad" }` | Referencia cruzada a otra página; el puerto la resuelve a `{text, path}` antes de entregar |
| `{ "global": "consent.banner.reject" }` | Cita de un texto del documento global por su ruta de llaves; el puerto la resuelve a la cadena (v3.7). También vale como `action.label` (v3.8) |

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
| `src/content/index.ts` | `getGlobal(locale)` · `getPage(locale, slug)` · `requireSection(page, type)`: leen en **tiempo de build** (`fs`), validan, resuelven las sustituciones, **resuelven las referencias `{page:}` y `{global:}`** (`resolveRefs`, contra el documento global validado del mismo locale; `getGlobal` resuelve las suyas contra sí mismo), **inyectan `updatedLabel`** (`addUpdatedLabels`) y fallan el build con mensaje si el locale no está publicado, falta el archivo, el JSON es inválido, no cumple el modelo, usa una sustitución no declarada o cita una página o una ruta del global que no existen. |
| `src/content/substitutions.ts` | Registro cerrado de sustituciones (`brand`, `domain`, `year`, `email`, `legalForm`, **`consentKey`**, **`consentMonths`**) con sus valores desde la fuente única; `findUndeclaredSubstitutions` (lista cada `{{…}}` inválido con su ruta) y `resolveDocument(doc, path, skipKeys?)` (copia del documento con los textos resueltos; `skipKeys` omite llaves restringidas sin lanzar — usado por `substituteLegal` para la primera pasada; las sustituciones restringidas `{{nif}}/{{domicilio}}/{{telefono}}` las resuelve la segunda pasada). Búsqueda en tabla: nada se evalúa (D-DOC-06). |
| `src/config/pages.ts` | `LEGAL_PAGES: readonly LegalPage[]` — registro fuente única de páginas legales (slug, indexed, inSitemap, legalNavOrder). `SITEMAP_LEGAL_SLUGS` derivado. Importado por `Footer`, `sitemap.ts`, `robots.ts` y la guardia R6. |
| `scripts/lint/check-content.ts` | Valida el **árbol completo** (todo `content/`, tenga o no consumidor): solo locales publicados, solo `global.json` + colecciones del esquema, todos los documentos válidos, `pages/home.json` presente, **solo sustituciones declaradas (R5)**, **R6** (coherencia `_headers`/`_redirects` contra `LEGAL_PAGES`). En `pnpm guard` y en el pre-commit (fail-closed). Cuenta textos, marcadores y sustituciones en uso. |

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
*BBW-CONTENT-MODEL v3.8 · `docs/system/CONTENT_MODEL.md` · 2026-11-06 (v3.8: P-BBW-82 enmienda 1 — `consent.configureButton` sustituye a `footerLink`, `LegalSection.action` con `LEGAL_ACTION_KINDS` cerrado, `kind` estructural) · 2026-11-06 (v3.7: P-BBW-82 L3 — global.consent, span { global }, parte { table }, sustituciones consentKey/consentMonths) · 2026-11-05 (v3.6: P-BBW-80 L2b — LegalPagesMap, global.legal, updatedLabel en puerto, {page:} referencias cruzadas, legalForm, src/config/pages.ts, R6 guardia; v3.5: correcciones P-BBW-73/74/75 — LegalBlock.parts NO aditivo, updated dentro de la sección, Privacidad como hijo directo del footer; v3.4: P-BBW-73/74/75 — tipo Span, LegalSection, sustitución email, footer.privacy, aepd, privacidad.json) · 2026-11-02 (v3.3: hero nuevo sobre fondo oscuro) · 2026-09-22 (v3.2: D-BBW-78, lo editable en datos y la palabra del caso una sola vez) · 2026-09-17 (v1.0 y v2.0/v2.1 el 2026-09-16: fase 5; fase 6a `DESPACHO-BBW-2026-09-16-fase6a-residuales-y-modelo-de-construccion`; fase 6b `skipLabel` y renderizado por tipo) · v2.2 fase 6c (sustituciones, D-BBW-23)*
