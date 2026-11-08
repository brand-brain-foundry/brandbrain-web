---
id: BBW-SEO
title: "Sistema de posicionamiento por capas — brandbrain-web"
type: canon
status: VIGENTE
version: 1.4
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-11-07
updated: 2026-11-08
verified_against_code: 2026-11-08@feat/perfil-p1 (v1.4, P1 «contenido y rutas del perfil», D-BBW-107/109: la página de perfil pasa a `perfil` (`/es/perfil/`) y `quien` a `RETIRED_ROUTES` en src/config/pages.ts, con R6 de rutas retiradas en scripts/lint/check-content.ts · `hasCredential` exige nombre y emisor visibles en src/content/entity.ts y en R7g de scripts/lint/check-seo.ts · `Person.image` = recortes de 1200 del maestro nuevo) · 2026-11-07@feat/posicionamiento-s3c (v1.3, S3c «página de perfil», D-BBW-90…95: tipo `profile` y fila `quien` en src/config/{page-types,pages}.ts · `StructuredDataKind` = website | profile | none · src/seo/jsonld.ts (`websiteGraph`, `profileGraph`, `personNode` en el orden del insumo) · src/content/{entity-fields,entity,schema,index}.ts (`place`, `fundada`, `category` de credencial, `{ entity }`, `ProfileSection`) · src/media/{registry,index,generated}.ts (`portrait`, `jpeg-crop`, `mediaSets`) · scripts/lint/{check-seo (R7h),check-content (R8)}.ts) · 2026-11-07@feat/posicionamiento-s3 (v1.2, S3 «contenido de la entidad y portada», D-BBW-81…88: content/site.json `$.entity` con valores · content/es/pages/home.json `meta.title` = `{{category}}` · src/config/{pages,page-types}.ts (`titleLengthException`, `pageTitleException`, mayúscula por fórmula en `home`) · src/content/{entity-fields,entity}.ts (`alternateName`, `visibilityContext`, `isEmittedOn`, `missingInText`, `entityEmissionReport`) · src/seo/jsonld.ts · scripts/lint/check-seo.ts) · 2026-11-07@feat/posicionamiento-s2 (v1.1, S2 «piel», P-BBW-95: content/site.json `$.entity` · content/site.schema.json (generado) · src/content/{entity-fields,entity,site-schema,site,substitutions,index}.ts · src/seo/jsonld.ts · scripts/content/export-schema.ts · scripts/lint/{check-seo,check-content}.ts · package.json `content:schema`) · 2026-11-07@feat/posicionamiento-s1 (v1.0, S1 «huesos y músculos», P-BBW-94: src/config/{pages,page-types}.ts · src/seo/{metadata,jsonld}.ts · src/seo/WithStructuredData.tsx · src/app/[locale]/**/page.tsx · src/app/{sitemap,robots}.ts · src/components/organisms/{Footer,Header} · src/analytics/port.ts · src/content/{index,schema}.ts · scripts/lint/{check-seo,check-content}.ts · package.json `build`)
supersedes: []
superseded_by: null
related: [BBW-CONTENT-MODEL, BBW-DEPLOY-CONTRACT, BBW-PORTS, BBW-MEDIA-CONTRACT, P-BBW-95, P-BBW-94, P-BBW-80, D-BBW-07, D-BBW-09, D-BBW-12, D-BBW-15, D-BBW-44, D-BBW-55, D-BBW-58, D-BBW-78]
summary: "Todo lo que hace encontrable y citable el sitio (buscadores y agentes de IA: SEO, GEO, LLMO, AEO) se construye por capas: un registro único de páginas con su tipo; tipos de página que declaran por fórmula qué se indexa, cómo se titula, qué datos estructurados lleva y qué entra en el mapa del sitio; constructores únicos de metadatos y de datos estructurados; y una guardia (R7) sobre el sitio compilado que falla si una página no cumple su tipo. Ninguna página escribe a mano sus metadatos ni su ruta. v1.0 (S1): huesos y músculos. v1.1 (S2, P-BBW-95): la piel — el bloque de entidad en content/site.json con estado por campo (aprobado · heredado · pendiente), descrito una vez (entity-fields.ts) y de ahí su validación, su esquema exportable (content/site.schema.json, regenerado por pnpm content:schema y vigilado por R1), las sustituciones de entidad bloqueadas ({{category}}, {{motto}}), la emisión condicionada en el Person (solo aprobado y visible; lo heredado solo si ya se emitía), ProfilePage prevista y la guardia R7g vista fallar. Nada de lo emitido cambia; los textos llegan en S3. v1.2 (S3, D-BBW-81…88): los valores de la entidad entran (10 aprobados de 14; `alternateName` nuevo); la portada referencia la categoría (`{{category}}`) y la fórmula del tipo pone la mayúscula; la excepción del título (61) se registra una vez en el registro de páginas y R7c la lee; la emisión se decide al construir como «aprobado Y visible según la capa de contenido» y R7g la confirma sobre el HTML (lo aprobado sin sección no se emite y se informa); el texto visible es el cuerpo."
tags: [seo, geo, posicionamiento, registro, tipos-de-pagina, metadatos, json-ld, sitemap, robots, guardia, brandbrain-web]
---

# Sistema de posicionamiento por capas — brandbrain-web

> **Qué es:** cómo se decide, por construcción y no por memoria, lo que cada página dice a buscadores y a agentes de IA. **Qué no es:** el
> copy (vive en `content/`, `CONTENT_MODEL.md`), la política de rastreadores del panel (D-BBW-12, cutover) ni las cabeceras de seguridad
> (`DEPLOY_CONTRACT.md`). **Cuándo leerlo:** al añadir una página, un tipo de página, un metadato o un grafo de datos estructurados; al tocar
> `src/seo/`, `src/config/{pages,page-types}.ts`, `src/app/{sitemap,robots}.ts` o la guardia R7.

## §1 — Principio: huesos → músculos → piel → custom (P-BBW-94)

| Capa | Qué es | Dónde vive | Estado |
|---|---|---|---|
| **Huesos** | Estructura agnóstica: registro único de páginas, ruta por función única, constructores únicos de metadatos y datos estructurados, mapa del sitio / `robots.txt` / pie / medición derivados del registro | `src/config/pages.ts` · `src/seo/` · `src/app/{sitemap,robots}.ts` | ✅ S1 |
| **Músculos** | Reglas por TIPO de página: indexable, fórmula del título, rangos, imagen de compartir, datos estructurados, medición. Una página hereda; no decide | `src/config/page-types.ts` | ✅ S1 |
| **Piel** | La entidad (quién, cargo, categoría, frase madre, descripción, materias, credenciales, imagen, perfiles, relaciones): una sola fuente para el texto visible, los metadatos y el grafo, **cada campo con su estado** (`aprobado` · `heredado` · `pendiente`) | `content/site.json` `$.entity` (D-BBW-78; descrito en `src/content/entity-fields.ts`, leído por `entity.ts`; esquema exportado `content/site.schema.json`) | ✅ S2 (P-BBW-95): estructura, estados y guardia · ✅ S3 (D-BBW-81…88): **los valores** (10 aprobados de 14); lo aprobado sin sección (descripción, frase madre, ubicación, variante del nombre) espera la sección «Quién» (S3b) |
| **Custom** | Los textos de cada página | `content/<locale>/pages/<id>.json` (`meta` + `sections`) | ✅ (copy: fase de contenido) |

**Reglas que mandan:** una fuente por dato y variantes por fórmula (I-1, I-3); HTML completo sin JavaScript (I-4, D-BBW-09); datos sensibles
fuera (P-BBW-78: esta capa nunca los toca); cada capa con su guardia vista fallar (I-7); los datos estructurados **describen** la página y no
añaden hechos que la página no dice (fase 7, regla reafirmada en `src/seo/jsonld.ts`).

## §2 — Capa → módulo → guardia

| Capa | Módulo | Qué hace | Guardia que lo vigila |
|---|---|---|---|
| Registro de páginas | `src/config/pages.ts` · `PAGES`, `PageId`, `pageEntry`, `pageRules`, `pageRoute`, `pageUrl`, `pagesWhere`, `FOOTER_PAGES`, `isPageId` | Una fila por página: `id` (= nombre de su documento), `slug`, `type`, `footerOrder?`. Única función que escribe una ruta | typecheck (`PageId`: un `page.tsx` con un id no registrado no compila) · **R7a** (registro ⇔ `out/`) · R6 (`_headers`/`_redirects`) |
| Tipos de página | `src/config/page-types.ts` · `PAGE_TYPES`, `PageTypeRules`, `StructuredDataKind` | Por tipo: `indexable`, `measured`, `share`, `structuredData`, `title(own, brand)`, `titleLength`, `descriptionLength` | typecheck (`satisfies Record<string, PageTypeRules>`; un `StructuredDataKind` sin constructor no compila) · **R7c/R7d** (lo servido cumple el tipo) |
| Constructor de metadatos | `src/seo/metadata.ts` · `pageMetadata(locale, id)`, `pageMetadataFor(id)` | Título por fórmula, descripción, `robots` derivado de `indexable`, canónica absoluta, Open Graph, tarjeta e imagen según `share` | **R7b** (título, descripción, canónica, OG) · **R7c** (rangos, sitemap, imagen) · **R7d** (`noindex, noarchive`) |
| Constructor de datos estructurados | `src/seo/jsonld.ts` · `structuredData(locale, id, page)`, `GRAPH_BUILDERS` · `src/seo/WithStructuredData.tsx` | Un constructor por `StructuredDataKind`; la página envuelve su `<main>` con `<WithStructuredData>` y emite lo que su tipo declara (hoy: `entity` = `Person` + `WebSite` en la portada, **+ `ProfilePage` cuando la entidad tenga el mínimo aprobado**; `none` en las legales). Las propiedades del `Person` salen del bloque de entidad según su estado (S2) | **R7e** (0/1 bloque, JSON válido, `@context`, tipos esperados, `name`/`jobTitle` en el texto visible, `url` = portada) · **R7g** (la entidad, §6) |
| **La entidad (piel, S2)** | `src/content/entity-fields.ts` (descripción declarativa: clase, fuente, propiedad emitida, sustitución, visibilidad, campo del gestor) · `src/content/entity.ts` (`validateEntity`, `entityValue`, `isEmitted`, `isProfilePageReady`, `entitySubstitutions`, `entityCompleteness`) · `src/content/site-schema.ts` + `scripts/content/export-schema.ts` → `content/site.schema.json` | Una descripción → validación del bloque (puerto, fail-closed) + esquema exportable para un gestor + sustituciones `{{category}}`/`{{motto}}` **bloqueadas** mientras el campo no esté aprobado + emisión condicionada en el `Person` | R1 (`check-content.ts`: bloque válido; esquema versionado = descripción) · R5 (sustitución bloqueada en el contenido) · **R7g** |
| Derivados | `src/app/sitemap.ts` · `src/app/robots.ts` (`AI_AGENTS` exportado) · `Footer` (`FOOTER_PAGES`) · `src/analytics/port.ts` (`measured`) · `src/content/index.ts` (`{page}` → `pageRoute`) | Todo se calcula desde el registro y los tipos; nada se escribe | **R7f** (sitemap = indexables en orden; `robots.txt` = `*` Allow + un grupo por agente con Disallow = ocultas; `Sitemap:` canónico) |
| Manifiestos de entrega | `public/_headers` (X-Robots-Tag de las ocultas, D-BBW-44) · `public/_redirects` (sin prefijo → locale por defecto, D-BBW-55) | **No se generan** (el export estático no los escribe y son política declarativa versionada): se VERIFICAN | R6 sobre la fuente (`check-content.ts`) · **R7d** sobre `out/_headers` |
| Página | `src/app/[locale]/<slug>/page.tsx` | `const PAGE = "<id>" satisfies PageId` · `export const generateMetadata = pageMetadataFor(PAGE)` · `<WithStructuredData>` alrededor del `<main>` | typecheck · R7a |

## §3 — El registro y cómo se añade una página

```
PAGES = [
  { id: "home",        slug: "",            type: "home" },
  { id: "aviso-legal", slug: "aviso-legal", type: "legal-restricted", footerOrder: 0 },
  { id: "privacidad",  slug: "privacidad",  type: "legal",            footerOrder: 1 },
  { id: "cookies",     slug: "cookies",     type: "legal",            footerOrder: 2 },
]
```

El orden del array es el orden del mapa del sitio. `id` es el nombre del documento (`content/<locale>/pages/<id>.json`) y, en las páginas
legales, la llave de su etiqueta en `global.legal.pages`. `slug` vacío = la portada del locale (`/es/`).

**Añadir una página** (verificado en S1 con un tipo nuevo de prueba, output §6): (1) una fila en `PAGES` con su `type`; (2) su documento
en `content/<locale>/pages/<id>.json` con `meta.title` (título PROPIO, sin la marca) y `meta.description`; (3) `src/app/[locale]/<slug>/page.tsx`
con las tres líneas de §2 («Página»); (4) su redirección sin prefijo en `public/_redirects` (R6) y, si su tipo no es indexable, su regla en
`public/_headers` (R6/R7d). Con eso sale con metadatos completos, en el mapa del sitio y con sus datos estructurados **sin escribir nada
más**. Lo que se olvida, rompe: sin fila → el `page.tsx` no compila (`PageId`); sin documento → el build falla (puerto de contenido);
sin `page.tsx` → R7a; sin redirección o cabecera → R6; descripción fuera de rango → R7c.

**Cambiar la ruta de una página (P1, D-BBW-107):** su slug nuevo en `PAGES` y el viejo en `RETIRED_ROUTES` (`slug`, `replacedBy`, `decision`),
con un 301 de UN salto a la ruta vigente sin prefijo y por cada locale publicado, con y sin barra (`/quien`, `/es/quien`, `/es/quien/` →
`/es/perfil/`). R6 exige esas líneas (y el código 301, y el destino final, nunca otra ruta retirada) y prohíbe que una página vuelva a usar
el slug; R7a rompe si `out/` sirve algo en la ruta retirada. La canónica, el mapa del sitio, `Person.url` y `ProfilePage.url` se derivan solos.

**Añadir un tipo** = una entrada en `PAGE_TYPES` (y, si emite un grafo nuevo, su constructor en `GRAPH_BUILDERS`). Ningún constructor ni
derivado cambia.

## §4 — Los tipos (hoy)

| Tipo | `indexable` | `measured` | `share` | `structuredData` | `<title>` | Quién |
|---|---|---|---|---|---|---|
| `home` | sí | sí | sí | `website` (`WebSite`, `publisher` → `{"@id": …/#person}`; S3c) | `{marca} · {Título propio}` (mayúscula inicial por fórmula, S3) | la portada |
| `profile` | sí | sí | sí | `profile` (`ProfilePage` → `Person` COMPLETO; S3c) | `{título propio} · {marca}` | la página de perfil `/es/perfil/` (exactamente una: `PROFILE_PAGE`; `/es/quien/` retirada con 301, P1) |
| `legal` | sí | sí | sí | `none` | `{título propio} · {marca}` | privacidad, cookies |
| `legal-restricted` | **no** | **no** | **no** | `none` | `{título propio} · {marca}` | aviso legal (datos de identificación, P-BBW-80 §0.1) |

`legal-restricted` es un tipo y no una excepción de `legal` porque la **indexabilidad es del tipo** (S1 §0.2.2): de `indexable: false` se
derivan el `<meta robots>` `noindex, noarchive`, la ausencia en el mapa del sitio, el `Disallow` de su ruta para cada agente de IA de
`robots.txt` (D-BBW-12 por ruta) y la verificación de su `X-Robots-Tag` en `_headers`.

**Fórmula del título.** El documento lleva el título PROPIO (`meta.title`); escribir `{{brand}}` en él rompe la compilación (modelo v3.9).
Google recomienda el nombre del sitio «al principio o al final de cada `<title>`, separado con un delimitador» (Search Central, «Influencing
your title links», act. 2025-12-10): la portada lo lleva delante, las demás detrás, con el punto medio del sistema. **S3 (D-BBW-81, D-BBW-87):**
el título propio de la portada es la **categoría referenciada** (`"title": "{{category}}"`, modelo v3.11), que se escribe en minúscula y sin
poseerla; la **mayúscula inicial la pone la fórmula del tipo `home`** (`sentenceCase`, una variante por fórmula, I-3), nunca el contenido. La
cadena de la categoría vive una vez (`$.entity.category`).

**Variante de color del fondo (R1, D-BBW-96).** La fila puede declarar `backdrop` (un nombre de `src/config/backdrops.ts`); no es posicionamiento: el contrato es BEHAVIOR §4.1 y la guardia R12.

**Excepción al rango del título (D-BBW-87).** Una página puede registrar en `src/config/pages.ts` una `titleLengthException` con **longitud
exacta + razón + decisión** (la forma de D-BBW-16 llevada a esta capa). R7c la lee (`pageTitleException`); la guardia no escribe ningún número, y
**una excepción es un valor, no un rango más ancho**: si el título cambia de longitud deja de coincidir y R7c vuelve a romper. Hoy una:

| Página | Longitud | Razón | Decisión |
|---|---|---|---|
| `home` | 61 | el título propio es la repetición exacta de la categoría (D-BBW-81) tras la marca; no se acorta | D-BBW-87 |

**Rangos — criterio propio, dicho porque no hay cifra oficial.** Google declara que no hay límite de longitud ni para el `<title>` (misma
página) ni para la descripción («Control your snippets», act. 2026-04-20): ambos «se truncan según haga falta, normalmente para caber en el
ancho del dispositivo». El rango fijado es el que cabe sin truncar en la mayoría de resultados según la práctica común del sector, con un suelo
que excluye títulos y descripciones vacíos de sentido (los contraejemplos de la propia documentación): **título 20–60 caracteres, descripción
50–160**. R7c lo aplica a las páginas indexables. Cambiar el rango = cambiar `page-types.ts` y esta sección, no la guardia.

## §5 — Lo que se emite y lo que no (y por qué)

Se emite: `<title>`, `description`, `<link rel="canonical">` absoluta con barra final (`trailingSlash`), `og:title/description/url/site_name/type`,
`og:image` (1200×630 del puerto de medios, D-BBW-21) + `twitter:card=summary_large_image` si `share`, `<meta robots>` solo en las ocultas,
`<script type="application/ld+json">` solo donde el tipo lo declara, `manifest` e iconos desde el layout (puerto de medios).

No se emite: `keywords` (Google: sin efecto, special-tags act. 2025-12-10); `og:locale` (exige territorio y la página no lo dice);
`hreflang`/`alternates.languages` (D-BBW-15: nada declara una versión inglesa hasta que exista copy); `lastmod` en el sitemap (la fecha
de compilación no es la del contenido); `alumniOf`, `ProfessionalService`, `BreadcrumbList`, `FAQPage` (P-BBW-53: entran con su sección).

**La entidad en el `Person` (S2, P-BBW-95; S3).** Cada propiedad del `Person` tiene un campo en el bloque de entidad (`content/site.json` `$.entity`,
descrito en `src/content/entity-fields.ts`) y sale según su ESTADO **y su visibilidad**: `aprobado` → se emite **solo si es visible en la página
que emite el grafo**, visibilidad que el constructor decide al construir desde la **capa de contenido** (`visibilityContext`: los textos del cuerpo
de la página y del documento global, que es todo lo que los componentes pintan, y las llaves de enlace que esos documentos referencian; `meta` y
`<title>` no cuentan) y que R7g **confirma sobre el HTML servido** (texto literal, `href`, `mailto:` o `src`, según el campo). Un valor que es
subcadena de otro valor de la entidad (`alternateName` dentro de `name`) solo cuenta fuera de las apariciones de ese otro (`missingInText`).
Lo aprobado y todavía sin sección **no se emite y no es un error**: el informe de la entidad lo imprime con su motivo (S3 F9), y entra el día que
una sección lo escriba, sin tocar código. `heredado` → NO se emite, salvo lo que ya se emitía antes de S2 (hoy ningún campo está heredado);
`pendiente` → no se emite nunca. Una propiedad sin campo en la entidad rompe R7g. `ProfilePage` (`mainEntity` → la `Person`; Google, act.
2026-09-08) se añade al grafo cuando `name`, `description` y `sameAs` **se emiten** (`PROFILE_PAGE_MINIMUM`, aprobados y visibles); hoy no:
`description` está aprobada y espera la sección «Quién» (S3b). S2 lo verificó con el mínimo aprobado en una copia; S3 lo vio fallar con la
descripción aprobada y no visible (arnés `s3/r7-ver-fallar-s3.cjs`).

**S3c — LA PERSONA, UNA VEZ (D-BBW-90; insumo CONTENIDO-PERFIL-WEB v1.0 §6).** El `Person` completo lo declara SOLO la página de perfil
(`ProfilePage` → `mainEntity`); la portada declara el `WebSite` con `publisher` = la referencia `{"@id": "…/#person"}` y nada más; las páginas
legales no emiten nada. Orden del nodo: `name, alternateName, jobTitle, description, url, image, email, workLocation, knowsAbout, hasCredential,
sameAs`. Ajustes de §0.3 del despacho: `Person.url` = la canónica de la página de perfil (la portada redirige); `email` sin `mailto:` (la forma
de siempre); **`workLocation`** (no `homeLocation`: el texto visible dice dónde trabaja) con `Place` → `PostalAddress` de solo localidad y país,
nunca una dirección (P-BBW-78, D-BBW-93). `image` = los TRES recortes del retrato (1:1, 4:3, 16:9 de 600 px de ancho, ≥ 50 000 píxeles cada uno;
`mediaSets.portrait`), en direcciones absolutas; la página muestra el 1:1 en un `<img>` real. `hasCredential` = un objeto (una credencial) con
`credentialCategory` y `recognizedBy`. `ProfilePage` lleva `name` (= su `<title>`), `inLanguage`, `isPartOf` → `WebSite`, y `dateCreated` /
`dateModified` = las fechas que la sección escribe en el contenido (`published`/`updated`), nunca la hora de la compilación.

**Hoy se emite (S3c; desde P1 en `/es/perfil/`):** `name`, `jobTitle`, `description`, `image`, `email`, `workLocation`, `knowsAbout`, `hasCredential`, `sameAs`.
**Aprobado y no visible (no se emite):** `alternateName` (la página no muestra la variante: despacho S3c §6). **Aprobados sin propiedad:**
`category`, `motto`, `descriptionLong`, `relations` (los nodos de organización son la fase 2 del insumo, §6.2). **Pendientes:** ninguno.

## §6 — Guardia R7 (`scripts/lint/check-seo.ts`, `pnpm lint:seo`)

Corre **al final de `pnpm build`** (`next build && pnpm lint:seo`): un sitio que no cumple su registro no se construye, ni en local ni en el
anfitrión. No va en el pre-commit porque necesita el sitio compilado (14 s medidos); `pnpm check` no la incluye por la misma razón. Exit 0
verde · 1 incumplimiento (nombra regla, fichero y detalle) · 2 error del tool (p. ej. sin `out/`). Acepta `--out <dir>` para auditar una copia.

| Regla | Comprueba |
|---|---|
| R7a | Toda página servida está en el registro para un locale publicado, y viceversa (fuera: la defensa de `/`, `404`, `_not-found`) |
| R7b | Toda página: `lang` = locale; un `<h1>`; `<title>` = fórmula del tipo; `description` = documento; canónica = dominio + ruta; OG completo y coherente; la marca en el `<title>` |
| R7c | Indexable: título y descripción en su rango —o el título con la longitud EXACTA de la excepción registrada en `pages.ts` (S3, D-BBW-87)—; sin `noindex`; en el sitemap; `og:image` + tarjeta grande si `share` (y sin imagen si no) |
| R7d | Oculta: `noindex` + `noarchive`; regla en `_headers`; fuera del sitemap; sin datos estructurados; sin imagen; `Disallow` para **cada** agente de `AI_AGENTS` |
| R7e | Datos estructurados = los del tipo (0/1); JSON válido; `@context` schema.org; tipos esperados; `Person.name` y `jobTitle` literales en el texto visible (el CUERPO: la cabecera no cuenta, S3); `Person.url` = la canónica de la página de perfil y `@id` = `…/#person` (S3c); `WebSite` en la portada con `url` = portada |
| R7f | `sitemap.xml` = indexables × locales en el orden del registro; `robots.txt` con `*` Allow, un grupo por agente, Disallow = ocultas, `Sitemap:` canónico |
| **R7g** | **La entidad (S2, S3):** (a) ninguna propiedad del `Person` sin campo en la entidad; lo `pendiente` no sale; lo `aprobado` sale **solo si es visible según la capa de contenido** (la misma pregunta que el constructor) **y entonces tiene que verse en el HTML** (texto, `href`, `mailto:`, `src`; regla de subcadena); lo `heredado` solo si ya se emitía antes de S2; `hasCredential` con la dirección de su llave; `ProfilePage` solo con el mínimo emitido y apuntando a la `Person`. (b) Ninguna sustitución sin resolver (`{{…}}`) en el HTML servido. (c) Informe de la entidad: completitud (aprobados · heredados · pendientes) y emisión por página (qué se emite, qué está aprobado y no visible y por qué, `ProfilePage`): se imprime, no falla |

| **R7h** | **La persona, una vez (S3c):** (a) en todo el sitio servido, un solo documento declara un `Person` (a cualquier profundidad del JSON-LD) y es la página `profile`; `WebSite.publisher` es solo la referencia por `@id`; (b) `dateCreated`/`dateModified` = las fechas del contenido; (c) cada dirección de `Person.image` es un archivo publicado en `out/`, recorte del conjunto que la entidad referencia y ≥ 50 000 píxeles, y al menos una es el `src` de un `<img>` |

**S3c:** 9 mutaciones más de R7 (materia fuera del cuerpo, recorte no publicado, retrato sin `<img>`, `dateModified` con la hora de compilar,
`dateCreated` distinta, segundo `Person` en la portada, `Person.url` = portada, localidad distinta, variante emitida) + 1 de R7h (a) con un `Person`
anidado en otra página, y 8 de contenido (R8 etiqueta única ×2, destino doble, página desconocida, referencia de clase equivocada, referencia a un
campo no aprobado, fechas invertidas, ubicación con dirección): arnés `repos/brandbrain-web/outputs/2026-11/s3c/arnes/r7-ver-fallar-s3c.cjs`.

**Vista fallar** regla a regla (31 mutaciones sobre una copia de `out/`, S1 F4; **39 con las 8 de R7g, S2 F5**; **9 más de S3**: excepción del título como valor
exacto, título sin la mayúscula de la fórmula, descripción y variante del nombre aprobadas pero no visibles, GitHub en `sameAs`, `ProfilePage` sin el
mínimo emitido, cargo emitido y no pintado, nombre solo en la cabecera): arneses y tablas en el hub, `repos/brandbrain-web/outputs/2026-11/s1/`
(`r7-ver-fallar.cjs`), `s2/` (`r7-ver-fallar-s2.cjs`, `entidad-ver-fallar.ts`) y `s3/` (`r7-ver-fallar-s3.cjs`, `entidad-ver-fallar-s3.ts`; de las 39 de S2,
la mutación «`Person.description` heredada ausente» ya no aplica porque ningún campo está heredado). Volcado normalizado antes/después (`dump-seo.cjs`) y
comparación del HTML crudo con los hashes de compilación normalizados (`diff-html.cjs`) en `s1/`: son el instrumento de «diferencia cero» (o de
«diferencias exactamente las esperadas», S3 F7) para cualquier despacho que toque esta capa.

## §7 — Correspondencia con un gestor de contenido

| Aquí | En un gestor |
|---|---|
| `PAGES` (registro) | la **colección** de páginas: una entrada por página, con su plantilla |
| `type` → `PAGE_TYPES` | la **plantilla**: decide lo que la entrada no tiene que decidir |
| `meta` del documento | el **grupo de campos SEO** de cada entrada (título propio, descripción); los rangos son su validación |
| `content/site.json` `$.entity` (S2) | el **bloque único** de la entidad, referenciado y nunca copiado; cada campo con su estado; su esquema es `content/site.schema.json` (JSON Schema 2020-12 con `x-cms`, `x-translatable`, `x-emits`, `x-substitution`, `x-source`), importable tal cual |
| `sections[]` | el cuerpo de la entrada, por tipo de sección |

El esquema es exportable porque es explícito: `PageTypeRules`, `PageEntry`, `PageDocument` (`schema.ts`) y `SiteDocument` (`site.ts`) se leen
sin ejecutar nada. Un gestor sobre git (PORTS.md, puerto de contenido) escribiría los mismos archivos.

## §8 — Lo que esta capa no cubre todavía

- **Lo aprobado que espera su sección (S3b):** la frase definitoria (`description`), la descripción larga, la ubicación y las materias quieren la sección «Quién»; la frase madre quiere un lugar visible que decide Zavala; `alternateName` quiere la variante escrita (el logotipo no es texto). Con la sección, `description` se emite y `ProfilePage` se activa sin tocar código. Siguen pendientes `knowsAbout` (las 8 materias de PERFIL-CZC §4.2 están propuestas, no aprobadas: el modelo no admite «pendiente con valor»), `credentials` (nombre visible junto al sello), `image` (retrato) y `relations` (tipo para Pura kaSaka).
- **Residuales de S3:** `$.links.github` queda registrado sin consumidor (D-BBW-86 lo saca de `sameAs`; el enlace no se retira sin decisión); el sello del pie enlaza `credly` desde el componente y no desde el contenido, así que la visibilidad por contenido no lo vería cuando `credentials` se apruebe (S3b: `footer.cert` referencia la entidad y la llave); la descripción de la portada repite la categoría con mayúscula inicial como copy (no hay sustitución con mayúscula; una variante derivada `{{Category}}` sería la forma I-1 si Zavala la quiere).
- **Migrar los demás documentos al patrón declarativo** (global, páginas): estimado en el output de S2 §8, despacho propio.
- **`_headers` y `_redirects` se verifican, no se generan**: generarlos exigiría un paso de build propio y toca el contrato de despliegue; R6 + R7d los vigilan.
- **Locales:** todo está multiplicado por `publishedLocales`; EN entra con su copy (D-BBW-15) y, entonces, `hreflang` con su decisión (P-BBW-54).
- **El panel** (políticas de bots, Search Console, ofuscación de correo, `www`): P-BBW-87/88/93, fuera del repo.
