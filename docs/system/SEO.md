---
id: BBW-SEO
title: "Sistema de posicionamiento por capas — brandbrain-web"
type: canon
status: VIGENTE
version: 1.0
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-11-07
updated: 2026-11-07
verified_against_code: 2026-11-07@feat/posicionamiento-s1 (v1.0, S1 «huesos y músculos», P-BBW-94: src/config/{pages,page-types}.ts · src/seo/{metadata,jsonld}.ts · src/seo/WithStructuredData.tsx · src/app/[locale]/**/page.tsx · src/app/{sitemap,robots}.ts · src/components/organisms/{Footer,Header} · src/analytics/port.ts · src/content/{index,schema}.ts · scripts/lint/{check-seo,check-content}.ts · package.json `build`)
supersedes: []
superseded_by: null
related: [BBW-CONTENT-MODEL, BBW-DEPLOY-CONTRACT, BBW-PORTS, BBW-MEDIA-CONTRACT, P-BBW-94, P-BBW-80, D-BBW-07, D-BBW-09, D-BBW-12, D-BBW-15, D-BBW-44, D-BBW-55, D-BBW-58, D-BBW-78]
summary: "Todo lo que hace encontrable y citable el sitio (buscadores y agentes de IA: SEO, GEO, LLMO, AEO) se construye por capas: un registro único de páginas con su tipo; tipos de página que declaran por fórmula qué se indexa, cómo se titula, qué datos estructurados lleva y qué entra en el mapa del sitio; constructores únicos de metadatos y de datos estructurados; y una guardia (R7) sobre el sitio compilado que falla si una página no cumple su tipo. Ninguna página escribe a mano sus metadatos ni su ruta. v1.0 (S1): huesos y músculos; la entidad (piel) y los textos llegan en S2/S3 sin tocar esta estructura."
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
| **Piel** | La entidad (quién, cargo, categoría, frase madre, descripción, perfiles, credenciales): una sola fuente para el texto visible, los metadatos y el grafo | `content/site.json` (hoy: nombre, cargo, buzón, enlaces, D-BBW-78) | ⏳ S2 |
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
| Constructor de datos estructurados | `src/seo/jsonld.ts` · `structuredData(locale, id, page)`, `GRAPH_BUILDERS` · `src/seo/WithStructuredData.tsx` | Un constructor por `StructuredDataKind`; la página envuelve su `<main>` con `<WithStructuredData>` y emite lo que su tipo declara (hoy: `entity` = `Person` + `WebSite` en la portada; `none` en las legales) | **R7e** (0/1 bloque, JSON válido, `@context`, tipos esperados, `name`/`jobTitle` en el texto visible, `url` = portada) |
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

**Añadir un tipo** = una entrada en `PAGE_TYPES` (y, si emite un grafo nuevo, su constructor en `GRAPH_BUILDERS`). Ningún constructor ni
derivado cambia.

## §4 — Los tipos (hoy)

| Tipo | `indexable` | `measured` | `share` | `structuredData` | `<title>` | Quién |
|---|---|---|---|---|---|---|
| `home` | sí | sí | sí | `entity` (`Person` + `WebSite`) | `{marca} · {título propio}` | la portada |
| `legal` | sí | sí | sí | `none` | `{título propio} · {marca}` | privacidad, cookies |
| `legal-restricted` | **no** | **no** | **no** | `none` | `{título propio} · {marca}` | aviso legal (datos de identificación, P-BBW-80 §0.1) |

`legal-restricted` es un tipo y no una excepción de `legal` porque la **indexabilidad es del tipo** (S1 §0.2.2): de `indexable: false` se
derivan el `<meta robots>` `noindex, noarchive`, la ausencia en el mapa del sitio, el `Disallow` de su ruta para cada agente de IA de
`robots.txt` (D-BBW-12 por ruta) y la verificación de su `X-Robots-Tag` en `_headers`.

**Fórmula del título.** El documento lleva el título PROPIO (`meta.title`); escribir `{{brand}}` en él rompe la compilación (modelo v3.9).
Google recomienda el nombre del sitio «al principio o al final de cada `<title>`, separado con un delimitador» (Search Central, «Influencing
your title links», act. 2025-12-10): la portada lo lleva delante, las demás detrás, con el punto medio del sistema.

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
de compilación no es la del contenido); `ProfilePage`, `hasCredential`, `alumniOf`, `ProfessionalService`, `BreadcrumbList`, `FAQPage`
(S2 y P-BBW-53: entran con su fuente y su sección, no antes).

## §6 — Guardia R7 (`scripts/lint/check-seo.ts`, `pnpm lint:seo`)

Corre **al final de `pnpm build`** (`next build && pnpm lint:seo`): un sitio que no cumple su registro no se construye, ni en local ni en el
anfitrión. No va en el pre-commit porque necesita el sitio compilado (14 s medidos); `pnpm check` no la incluye por la misma razón. Exit 0
verde · 1 incumplimiento (nombra regla, fichero y detalle) · 2 error del tool (p. ej. sin `out/`). Acepta `--out <dir>` para auditar una copia.

| Regla | Comprueba |
|---|---|
| R7a | Toda página servida está en el registro para un locale publicado, y viceversa (fuera: la defensa de `/`, `404`, `_not-found`) |
| R7b | Toda página: `lang` = locale; un `<h1>`; `<title>` = fórmula del tipo; `description` = documento; canónica = dominio + ruta; OG completo y coherente; la marca en el `<title>` |
| R7c | Indexable: título y descripción en su rango; sin `noindex`; en el sitemap; `og:image` + tarjeta grande si `share` (y sin imagen si no) |
| R7d | Oculta: `noindex` + `noarchive`; regla en `_headers`; fuera del sitemap; sin datos estructurados; sin imagen; `Disallow` para **cada** agente de `AI_AGENTS` |
| R7e | Datos estructurados = los del tipo (0/1); JSON válido; `@context` schema.org; tipos esperados; `Person.name` y `jobTitle` literales en el texto visible; `url` = portada |
| R7f | `sitemap.xml` = indexables × locales en el orden del registro; `robots.txt` con `*` Allow, un grupo por agente, Disallow = ocultas, `Sitemap:` canónico |

**Vista fallar** regla a regla (31 mutaciones sobre una copia de `out/`, S1 F4): arnés `r7-ver-fallar.cjs` y tabla en el hub,
`repos/brandbrain-web/outputs/2026-11/s1/`. Volcado normalizado antes/después (`dump-seo.cjs`) y comparación del HTML crudo con los hashes de
compilación normalizados (`diff-html.cjs`) en la misma carpeta: son el instrumento de «diferencia cero» para cualquier despacho que toque esta capa.

## §7 — Correspondencia con un gestor de contenido

| Aquí | En un gestor |
|---|---|
| `PAGES` (registro) | la **colección** de páginas: una entrada por página, con su plantilla |
| `type` → `PAGE_TYPES` | la **plantilla**: decide lo que la entrada no tiene que decidir |
| `meta` del documento | el **grupo de campos SEO** de cada entrada (título propio, descripción); los rangos son su validación |
| `content/site.json` (S2: bloque de entidad) | el **bloque único** de la entidad, referenciado y nunca copiado |
| `sections[]` | el cuerpo de la entrada, por tipo de sección |

El esquema es exportable porque es explícito: `PageTypeRules`, `PageEntry`, `PageDocument` (`schema.ts`) y `SiteDocument` (`site.ts`) se leen
sin ejecutar nada. Un gestor sobre git (PORTS.md, puerto de contenido) escribiría los mismos archivos.

## §8 — Lo que esta capa no cubre todavía

- **La entidad** (categoría, frase madre, descripción de la persona, credenciales): S2. Hoy `Person.description` lleva la `meta.description` de la portada.
- **`_headers` y `_redirects` se verifican, no se generan**: generarlos exigiría un paso de build propio y toca el contrato de despliegue; R6 + R7d los vigilan.
- **Locales:** todo está multiplicado por `publishedLocales`; EN entra con su copy (D-BBW-15) y, entonces, `hreflang` con su decisión (P-BBW-54).
- **El panel** (políticas de bots, Search Console, ofuscación de correo, `www`): P-BBW-87/88/93, fuera del repo.
