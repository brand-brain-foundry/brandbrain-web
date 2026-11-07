#!/usr/bin/env tsx
/**
 * check-seo.ts — GUARDIA R7 DEL SISTEMA DE POSICIONAMIENTO (S1, P-BBW-94; docs/system/SEO.md).
 *
 * Por qué existe: `next build` compila cualquier `page.tsx`, esté o no en el registro, con o sin metadatos, oculta o no. Esta guardia
 * mira LO QUE SE SIRVE (`out/`) y lo cruza con lo que el registro (`src/config/pages.ts`), los tipos (`src/config/page-types.ts`), el
 * contenido y la fuente única DICEN que debe servirse, en las dos direcciones. Es el criterio transversal 4 (HTML completo) llevado a
 * cada página, más la coherencia entre página, mapa del sitio, `robots.txt`, cabeceras y entidad.
 *
 * Qué comprueba (exit 1 si falla, exit 2 si el tool rompe — fail-closed; corre al final de `pnpm build`):
 *   R7a · REGISTRO ⇔ SERVIDO. Toda página servida (`out/<locale>/**\/index.html`) está en el registro para un locale publicado, y toda
 *         página registrada × locale publicado está servida. Quedan fuera por construcción: `out/index.html` (defensa de `/`, D-BBW-07)
 *         y las páginas de error de Next (`404`, `_not-found`).
 *   R7b · TODA PÁGINA: `<html lang>` = locale; un solo `<h1>`; `<title>` = la fórmula de su tipo sobre el título propio del documento;
 *         descripción = la del documento; canónica absoluta = dominio + ruta; Open Graph completo (`og:title/description/url/site_name/type`)
 *         coherente con lo anterior; la marca en el `<title>`.
 *   R7c · PÁGINA INDEXABLE: título y descripción dentro del rango de su tipo —o el título con la longitud EXACTA de la excepción que la página
 *         registra en `src/config/pages.ts` (`titleLengthException`, S3 · D-BBW-87: la guardia la LEE, no escribe ningún número)—; sin
 *         `noindex`; en el mapa del sitio; con imagen de compartir y tarjeta grande si su tipo la declara (y SIN imagen si no).
 *   R7d · PÁGINA OCULTA: `<meta name="robots">` con `noindex` y `noarchive`; regla de ruta en `_headers` con `X-Robots-Tag` equivalente;
 *         fuera del mapa del sitio; sin datos estructurados; sin imagen de compartir; `Disallow` de su ruta para CADA agente de IA de
 *         `robots.txt`.
 *   R7e · DATOS ESTRUCTURADOS: exactamente los que su tipo declara (0 o 1 bloque); JSON parseable; `@context` schema.org; los tipos del
 *         grafo son los esperados; y NO DICEN NADA QUE LA PÁGINA NO DIGA en los campos comprobables: `name` y `jobTitle` aparecen
 *         literales en el texto visible, `url` es la portada del locale.
 *   R7f · MAPA DEL SITIO Y ROBOTS: `sitemap.xml` = exactamente las páginas indexables × locales publicados, en el orden del registro;
 *         `robots.txt` con `User-Agent: *` + `Allow: /`, un grupo por agente de IA declarado y `Disallow` = exactamente las rutas ocultas;
 *         `Sitemap:` apunta al dominio canónico.
 *   R7g · LA ENTIDAD (S2, P-BBW-95; el despacho la llamó «R7f», letra ya ocupada por el mapa del sitio). Sobre el `Person` servido y el
 *         bloque de entidad de `content/site.json`: (a) ningún campo sale en los datos estructurados sin estar `aprobado` y VISIBLE en la
 *         página (texto literal, `href`, `mailto:` o `src` según el campo); lo `pendiente` no sale; lo `heredado` solo si ya se emitía antes
 *         de S2, y entonces se informa si no es visible; ninguna propiedad del `Person` que no tenga campo en la entidad; `ProfilePage` solo
 *         con el mínimo emitido. S3: la emisión esperada se calcula como la calcula el constructor —aprobado Y visible según la capa de
 *         contenido (`visibilityContext`)— y después se CONFIRMA sobre el HTML: lo emitido tiene que verse; lo aprobado y no visible no
 *         tiene que emitirse. El texto visible es el CUERPO (`<body>`): ni `<title>` ni `meta` cuentan. (b) Ninguna sustitución queda sin
 *         resolver en el HTML servido (`{{…}}`): una de entidad bloqueada que llegara a lo servido se vería aquí. (c) INFORME de la entidad:
 *         completitud (aprobados · heredados · pendientes) y EMISIÓN (qué aprobados se emiten, cuáles no y por qué; `ProfilePage`): se
 *         imprime, no falla.
 *   R7h · LA PERSONA, UNA VEZ (S3c, D-BBW-90). (a) En TODO el sitio servido, un solo documento declara un `Person` (cualquier objeto con
 *         `@type: Person` a cualquier profundidad del JSON-LD), y es la página de tipo `profile`; las demás solo la REFERENCIAN por su `@id`.
 *         (b) `ProfilePage.dateCreated`/`dateModified` son EXACTAMENTE las fechas del contenido de la página (`published`/`updated`, AAAA-MM-DD):
 *         nunca la hora de la compilación. (c) `Person.image`: cada dirección es un archivo PUBLICADO en `out/` y es un recorte del conjunto que
 *         la entidad referencia con al menos 50 000 píxeles; al menos una aparece como `src` de un `<img>` de la página.
 * Uso: `pnpm lint:seo [--out <dir>]` · al final de `pnpm build`. No corre en el pre-commit porque necesita el sitio compilado (14 s).
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { site, publishedLocales, type Locale } from '../../src/config/site';
import { PAGES, pageRoute, pageUrl, pageRules, pageTitleException, type PageId } from '../../src/config/pages';
import { AI_AGENTS } from '../../src/app/robots';
import { identity } from '../../src/content/site';
import { getGlobal, getPage } from '../../src/content';
import { media, mediaMembers } from '../../src/media';
import { ENTITY_FIELD_KEYS, PROFILE_PAGE_MINIMUM, fieldSpec, type EntityFieldKey } from '../../src/content/entity-fields';
import {
  entityCompleteness,
  entityEmissionReport,
  profileGraphTypesOn,
  visibleStrings,
  entityStatus,
  entityValue,
  isEmittedOn,
  isProfilePageReadyOn,
  missingInText,
  visibilityContext,
  type Credential,
  type VisibilityContext,
} from '../../src/content/entity';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const argOut = process.argv.indexOf('--out');
const OUT = argOut > 0 ? path.resolve(process.argv[argOut + 1]) : path.join(REPO_ROOT, 'out');

type Fail = { rule: string; where: string; detail: string };
const fails: Fail[] = [];
const fail = (rule: string, where: string, detail: string) => fails.push({ rule, where, detail });
/** R7g (c): lo heredado que se emite sin ser visible, para el informe (no falla). */
const inheritedNotVisible: string[] = [];
/** R7g (c): el informe de emisión de la entidad por página que emite el grafo (S3 F9): se imprime, no falla. */
const emissionLines: string[] = [];
/** R7h (a): qué páginas declaran un Person (S3c). */
const personDeclarations: { route: string; type: string; count: number }[] = [];
const PERSON_ID = `${site.url}/#person`;

function die(msg: string): never {
  console.error(`[seo-gate] FAIL-CLOSED: ${msg}`);
  process.exit(2);
}
function readText(abs: string): string | undefined {
  try { return fs.readFileSync(abs, 'utf8'); } catch { return undefined; }
}

if (!fs.existsSync(OUT)) die(`no existe ${path.relative(REPO_ROOT, OUT) || OUT}: la guardia mira el sitio compilado (ejecuta pnpm build)`);

// ── Lectura del HTML (expresiones regulares: el HTML es el que emite Next, no entrada libre) ──────────────────────────────────────
const attr = (tag: string, name: string): string | null => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};
const decode = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'");
/** El texto VISIBLE: el cuerpo sin guiones ni estilos. La cabecera entera queda fuera (S3): un `<title>` o una `meta` no es texto de la página. */
const visibleText = (html: string): string =>
  decode(html.replace(/<head[\s\S]*?<\/head>/, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

type Head = {
  lang: string | null;
  title: string | null;
  metas: Map<string, string[]>;
  canonical: string | null;
  ldjson: string[];
  h1: number;
  text: string;
};
function parse(html: string): Head {
  const metas = new Map<string, string[]>();
  for (const m of html.matchAll(/<meta\s[^>]*>/g)) {
    const key = attr(m[0], 'name') ?? attr(m[0], 'property');
    if (!key) continue;
    const content = attr(m[0], 'content');
    metas.set(key, [...(metas.get(key) ?? []), content === null ? '' : decode(content)]);
  }
  const canonicalTag = [...html.matchAll(/<link\s[^>]*>/g)].map((m) => m[0]).find((l) => attr(l, 'rel') === 'canonical');
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  return {
    lang: (html.match(/<html[^>]*\slang="([^"]*)"/) ?? [])[1] ?? null,
    title: titleMatch ? decode(titleMatch[1]) : null,
    metas,
    canonical: canonicalTag ? attr(canonicalTag, 'href') : null,
    ldjson: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    h1: (html.match(/<h1[\s>]/g) ?? []).length,
    text: visibleText(html),
  };
}
const one = (h: Head, key: string): string | null => {
  const v = h.metas.get(key);
  return v && v.length === 1 ? v[0] : null;
};

// ── Lo servido ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NEXT_ERROR_DIRS = new Set(['404', '_not-found']);
function servedRoutes(): string[] {
  const acc: string[] = [];
  const walk = (dir: string, rel: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name === '_next') continue;
      if (rel === '' && NEXT_ERROR_DIRS.has(e.name)) continue;
      const sub = `${rel}/${e.name}`;
      if (fs.existsSync(path.join(dir, e.name, 'index.html'))) acc.push(`${sub}/`);
      walk(path.join(dir, e.name), sub);
    }
  };
  walk(OUT, '');
  return acc.sort();
}

// ── Lo esperado ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Expected = { locale: Locale; id: PageId; route: string; url: string };
const expected: Expected[] = publishedLocales.flatMap((locale) =>
  PAGES.map((p) => ({ locale, id: p.id, route: pageRoute(locale, p.id), url: pageUrl(locale, p.id) })),
);
const byRoute = new Map(expected.map((e) => [e.route, e]));

// R7a — registro ⇔ servido
const served = servedRoutes();
for (const route of served) if (!byRoute.has(route)) fail('R7a', `out${route}index.html`, 'página SERVIDA sin fila en el registro (src/config/pages.ts) o en un locale no publicado (D-BBW-15)');
for (const e of expected) if (!served.includes(e.route)) fail('R7a', `out${e.route}index.html`, `página REGISTRADA (${e.id}) sin HTML servido para el locale ${e.locale}`);

// sitemap, robots, _headers (se leen una vez)
const sitemapText = readText(path.join(OUT, 'sitemap.xml')) ?? '';
const robotsText = readText(path.join(OUT, 'robots.txt')) ?? '';
const headersText = readText(path.join(OUT, '_headers')) ?? '';
if (!sitemapText) fail('R7f', 'out/sitemap.xml', 'no existe o está vacío');
if (!robotsText) fail('R7f', 'out/robots.txt', 'no existe o está vacío');
if (!headersText) fail('R7d', 'out/_headers', 'no existe o está vacío (manifiesto de cabeceras, D-BBW-44)');
const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

/** Los grupos de robots.txt: agente → directivas. */
function robotsGroups(text: string): Map<string, { allow: string[]; disallow: string[] }> {
  const groups = new Map<string, { allow: string[]; disallow: string[] }>();
  let current: { allow: string[]; disallow: string[] } | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const ua = line.match(/^User-Agent:\s*(.+)$/i);
    if (ua) { current = { allow: [], disallow: [] }; groups.set(ua[1].trim(), current); continue; }
    const d = line.match(/^(Allow|Disallow):\s*(.*)$/i);
    if (d && current) (d[1].toLowerCase() === 'allow' ? current.allow : current.disallow).push(d[2].trim());
  }
  return groups;
}
const groups = robotsGroups(robotsText);

/** La cabecera X-Robots-Tag declarada en `_headers` para una ruta (regla `/ruta` o `/ruta/*`), o null. */
function headerRuleFor(route: string): string | null {
  const bare = route.replace(/\/$/, '');
  const lines = headersText.split('\n');
  const idx = lines.findIndex((l) => { const t = l.trim(); return t === bare || t === `${bare}/*`; });
  if (idx < 0) return null;
  for (let i = idx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '' || !lines[i].startsWith(' ')) break;
    const m = t.match(/^X-Robots-Tag:\s*(.+)$/i);
    if (m) return m[1];
  }
  return '';
}

// ── Por página ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let checkedPages = 0;
for (const e of expected) {
  const file = path.join(OUT, e.route, 'index.html');
  const html = readText(file);
  if (html === undefined) continue; // ya cayó en R7a
  checkedPages++;
  const where = `out${e.route}index.html`;
  const rules = pageRules(e.id);
  const doc = getPage(e.locale, e.id);
  const expectedTitle = rules.title(doc.meta.title, identity.brand);
  const h = parse(html);
  // lo que esta página muestra según la capa de contenido: la misma pregunta que se hace el constructor del grafo (S3)
  const ctx = visibilityContext(doc, getGlobal(e.locale));

  // R7b — toda página
  if (h.lang !== e.locale) fail('R7b', where, `<html lang> = "${h.lang}" y la página es del locale "${e.locale}"`);
  if (h.h1 !== 1) fail('R7b', where, `${h.h1} <h1> (debe haber exactamente uno)`);
  if (h.title !== expectedTitle) fail('R7b', where, `<title> "${h.title}" ≠ fórmula del tipo ${pageEntryType(e.id)} "${expectedTitle}"`);
  if (h.title && !h.title.includes(identity.brand)) fail('R7b', where, `el <title> no lleva la marca (entidad)`);
  const description = one(h, 'description');
  if (description === null) fail('R7b', where, 'sin <meta name="description"> (o más de una)');
  else if (description !== doc.meta.description) fail('R7b', where, `description ≠ meta.description del documento`);
  if (h.canonical !== e.url) fail('R7b', where, `canónica "${h.canonical}" ≠ "${e.url}"`);
  const og = { title: one(h, 'og:title'), description: one(h, 'og:description'), url: one(h, 'og:url'), site: one(h, 'og:site_name'), type: one(h, 'og:type') };
  if (og.title !== expectedTitle) fail('R7b', where, `og:title "${og.title}" ≠ <title>`);
  if (og.description !== doc.meta.description) fail('R7b', where, 'og:description ≠ description');
  if (og.url !== e.url) fail('R7b', where, `og:url "${og.url}" ≠ canónica`);
  if (og.site !== identity.brand) fail('R7b', where, `og:site_name "${og.site}" ≠ la marca`);
  if (og.type !== 'website') fail('R7b', where, `og:type "${og.type}" ≠ website`);

  const robots = one(h, 'robots');
  const inSitemap = sitemapUrls.includes(e.url);
  const ogImage = one(h, 'og:image');
  const card = one(h, 'twitter:card');
  const shareUrl = `${site.url}${media.share.src}`;

  if (rules.indexable) {
    // R7c — indexable
    if (h.title) {
      const [min, max] = rules.titleLength;
      const exception = pageTitleException(e.id);
      if (h.title.length < min || h.title.length > max) {
        if (!exception) fail('R7c', where, `<title> de ${h.title.length} caracteres fuera del rango [${min}, ${max}] del tipo (sin excepción registrada en src/config/pages.ts)`);
        else if (h.title.length !== exception.length) fail('R7c', where, `<title> de ${h.title.length} caracteres fuera del rango [${min}, ${max}] del tipo y distinto de la excepción registrada (${exception.length}, ${exception.decision}): una excepción es un valor, no un rango más ancho`);
      }
    }
    if (description !== null) {
      const [min, max] = rules.descriptionLength;
      if (description.length < min || description.length > max) fail('R7c', where, `description de ${description.length} caracteres fuera del rango [${min}, ${max}] del tipo`);
    }
    if (robots && /noindex/i.test(robots)) fail('R7c', where, `página indexable con <meta robots> "${robots}"`);
    if (!inSitemap) fail('R7c', where, 'página indexable ausente de sitemap.xml');
    if (rules.share) {
      if (ogImage !== shareUrl) fail('R7c', where, `og:image "${ogImage}" ≠ la imagen de compartir del puerto de medios "${shareUrl}"`);
      if (card !== 'summary_large_image') fail('R7c', where, `twitter:card "${card}" ≠ summary_large_image`);
    } else if (ogImage !== null) fail('R7c', where, 'el tipo no declara imagen de compartir y la página emite og:image');
  } else {
    // R7d — oculta
    if (!robots || !/noindex/i.test(robots) || !/noarchive/i.test(robots)) fail('R7d', where, `página oculta sin <meta robots> "noindex, noarchive" (tiene "${robots}")`);
    const header = headerRuleFor(e.route);
    if (header === null) fail('R7d', 'out/_headers', `sin regla de ruta para ${e.route} (X-Robots-Tag de la página oculta ${e.id})`);
    else if (!/noindex/i.test(header) || !/noarchive/i.test(header)) fail('R7d', 'out/_headers', `la regla de ${e.route} tiene X-Robots-Tag "${header}" sin noindex y noarchive`);
    if (inSitemap) fail('R7d', 'out/sitemap.xml', `página oculta ${e.route} presente en el mapa del sitio`);
    if (h.ldjson.length > 0) fail('R7d', where, 'página oculta con datos estructurados');
    if (ogImage !== null) fail('R7d', where, 'página oculta con imagen de compartir');
    for (const agent of AI_AGENTS) {
      const g = groups.get(agent);
      if (!g) fail('R7d', 'out/robots.txt', `falta el grupo del agente ${agent}`);
      else if (!g.disallow.includes(e.route)) fail('R7d', 'out/robots.txt', `el agente ${agent} no tiene Disallow: ${e.route}`);
    }
  }

  // R7e — datos estructurados según el tipo
  const kind = rules.structuredData;
  if (kind === 'none') {
    if (h.ldjson.length !== 0 && rules.indexable) fail('R7e', where, `el tipo no emite datos estructurados y la página lleva ${h.ldjson.length} bloque(s)`);
  } else {
    if (h.ldjson.length !== 1) { fail('R7e', where, `${h.ldjson.length} bloque(s) ld+json (el tipo emite exactamente uno)`); }
    else {
      let graph: unknown;
      try { graph = JSON.parse(h.ldjson[0]); } catch (err) { fail('R7e', where, `ld+json no parseable: ${(err as Error).message}`); }
      if (graph && typeof graph === 'object') {
        const g = graph as { '@context'?: unknown; '@graph'?: unknown };
        if (g['@context'] !== 'https://schema.org') fail('R7e', where, `@context "${String(g['@context'])}" ≠ https://schema.org`);
        const nodes = Array.isArray(g['@graph']) ? (g['@graph'] as Record<string, unknown>[]) : [];
        const types = nodes.map((n) => String(n['@type'])).sort();
        const want = kind === 'website' ? ['WebSite'] : profileGraphTypesOn(ctx);
        if (types.join(',') !== want.join(',')) fail('R7e', where, `tipos del grafo [${types.join(', ')}] ≠ [${want.join(', ')}]`);
        const profileNode = nodes.find((n) => n['@type'] === 'ProfilePage');
        const person = nodes.find((n) => n['@type'] === 'Person') ?? (profileNode?.mainEntity as Record<string, unknown> | undefined);
        if (kind === 'profile' && !person) fail('R7e', where, 'la página de perfil no declara el Person');
        if (kind === 'profile' && person) {
          for (const field of ['name', 'jobTitle'] as const) {
            const value = person[field];
            if (typeof value !== 'string' || value.length === 0) fail('R7e', where, `Person.${field} ausente`);
            else if (!h.text.includes(value)) fail('R7e', where, `Person.${field} "${value}" no aparece en el texto visible de la página (los datos estructurados describen la página, no la amplían)`);
          }
          if (person.name !== identity.brand) fail('R7e', where, `Person.name ≠ la marca de la fuente única`);
          if (person['@id'] !== PERSON_ID) fail('R7e', where, `Person.@id "${String(person['@id'])}" ≠ ${PERSON_ID}`);
          // S3c §0.3.2: la dirección canónica de la persona es la de su página de perfil (la portada redirige)
          if (person.url !== e.url) fail('R7e', where, `Person.url "${String(person.url)}" ≠ la canónica de la página de perfil "${e.url}"`);
          // R7g (a) — la entidad: cada propiedad del Person contra el estado de su campo y su visibilidad
          checkEntityEmission(person, nodes, html, h, where, ctx, e);
        }
        const website = nodes.find((n) => n['@type'] === 'WebSite');
        if (kind === 'website') {
          if (!website) fail('R7e', where, 'la portada no declara el WebSite');
          else {
            if (website.url !== pageUrl(e.locale, 'home')) fail('R7e', where, `WebSite.url ≠ la portada del locale`);
            if (website.name !== identity.brand) fail('R7e', where, `WebSite.name ≠ la marca`);
            if (!h.text.includes(String(website.name))) fail('R7e', where, `WebSite.name no aparece en el texto visible`);
            const pub = website.publisher as Record<string, unknown> | undefined;
            if (!pub || pub['@id'] !== PERSON_ID || Object.keys(pub).length !== 1) fail('R7h', where, `WebSite.publisher debe ser SOLO la referencia {"@id": "${PERSON_ID}"} (la persona se declara en la página de perfil)`);
          }
        }
      }
    }
    // R7g (c) — informe de emisión de la entidad en la página que la declara (S3 F9; desde S3c, la página de perfil)
    if (kind === 'profile') {
    const report = entityEmissionReport(ctx);
    emissionLines.push(`[entidad] ${e.route}: se emiten ${report.emitted.length} campo(s) [${report.emitted.join(', ')}] · ProfilePage: ${isProfilePageReadyOn(ctx) ? 'activa' : `no (mínimo emitido: ${PROFILE_PAGE_MINIMUM.join(', ')})`}`);
    for (const a of report.approvedNotVisible) emissionLines.push(`[entidad] ${e.route}: entity.${a.key} aprobado y NO visible → no se emite (${a.why})`);
    if (report.approvedNotEmitting.length) emissionLines.push(`[entidad] ${e.route}: aprobados sin propiedad en el Person (no se emiten por diseño): ${report.approvedNotEmitting.join(', ')}`);
    }
  }

  // R7h (a) — quién declara un Person (a cualquier profundidad del JSON-LD de la página)
  for (const block of h.ldjson) {
    let parsed: unknown;
    try { parsed = JSON.parse(block); } catch { continue; } // ya lo informó R7e
    const found: Record<string, unknown>[] = [];
    const walk = (v: unknown) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (o['@type'] === 'Person') found.push(o);
        Object.values(o).forEach(walk);
      }
    };
    walk(parsed);
    if (found.length > 0) personDeclarations.push({ route: e.route, type: pageEntryType(e.id), count: found.length });
  }

  // R7g (b) — ninguna sustitución sin resolver en lo servido
  const unresolved = html.match(/\{\{\s*[A-Za-z][A-Za-z0-9]*\s*\}\}/g);
  if (unresolved) fail('R7g', where, `sustitución sin resolver en el HTML servido: ${[...new Set(unresolved)].join(', ')} (una de entidad bloqueada nunca llega aquí: el puerto rompe el build)`);
}

/**
 * R7g (a). Visibilidad por clase de comprobación declarada en la descripción de la entidad: `text` = literal en el texto visible; `mailto` =
 * `href="mailto:<valor>"`; `href` = cada dirección como `href`; `img` = la imagen como `src`. Devuelve qué NO es visible (vacío = todo visible).
 */
function notVisible(key: EntityFieldKey, emitted: unknown, html: string, h: Head): string[] {
  const spec = fieldSpec(key);
  const missing: string[] = [];
  const hasHref = (url: string) => html.includes(`href="${url}"`);
  switch (spec.visible) {
    case 'text': {
      // la misma regla que el constructor aplica al contenido: un valor contenido en otro valor de la entidad solo cuenta fuera de él (S3)
      // un lugar se ve por su localidad (S3c); el resto, por su texto o cada elemento de su lista
      const values = spec.kind === 'place'
        ? [String(((emitted as { address?: { addressLocality?: unknown } }).address ?? {}).addressLocality)]
        : Array.isArray(emitted) ? emitted.map(String) : [String(emitted)];
      if (spec.kind === 'place' && values[0] !== visibleStrings(key)[0]) missing.push(`localidad emitida "${values[0]}" ≠ la de la entidad`);
      const declared = missingInText(key, h.text);
      for (const v of values) if (declared.includes(v) || !h.text.includes(v)) missing.push(v);
      break;
    }
    case 'mailto':
      if (!hasHref(`mailto:${String(emitted)}`)) missing.push(`mailto:${String(emitted)}`);
      break;
    case 'href': {
      // una lista de direcciones (`sameAs`) o de credenciales, o una credencial sola (S3c): de cada una, su dirección
      const urls = (Array.isArray(emitted) ? emitted : [emitted]).map((x) => (typeof x === 'string' ? x : String((x as { url?: unknown }).url)));
      for (const u of urls) if (!hasHref(u)) missing.push(u);
      break;
    }
    case 'img': {
      // S3c: una o varias direcciones; basta con que UNA se vea como `src` de un <img> (los demás recortes son la misma imagen); que cada
      // una exista publicada y sea un recorte del conjunto lo comprueba R7h (c)
      const srcs = (Array.isArray(emitted) ? emitted : [emitted]).map((u) => String(u).replace(site.url, ''));
      if (!srcs.some((src) => new RegExp(`<img\\b[^>]*\\ssrc="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html))) missing.push(`ningún <img> con src en [${srcs.join(', ')}]`);
      break;
    }
    case 'none':
      break;
  }
  return missing;
}

function checkEntityEmission(person: Record<string, unknown>, nodes: Record<string, unknown>[], html: string, h: Head, where: string, ctx: VisibilityContext, e: Expected): void {
  const FIXED = new Set(['@type', '@id', 'url']);
  const byProperty = new Map<string, EntityFieldKey>();
  for (const key of ENTITY_FIELD_KEYS) { const p = fieldSpec(key).emits; if (p) byProperty.set(p, key); }
  for (const prop of Object.keys(person)) {
    if (!FIXED.has(prop) && !byProperty.has(prop)) fail('R7g', where, `Person.${prop} no corresponde a ningún campo de la entidad (src/content/entity-fields.ts): no se emite lo que la entidad no describe`);
  }
  for (const [prop, key] of byProperty) {
    const status = entityStatus(key);
    const present = person[prop] !== undefined;
    const emitted = isEmittedOn(key, ctx);
    if (!emitted && present) {
      const why = status === 'aprobado'
        ? 'aprobado pero NO visible según el contenido de la página: solo se emite lo aprobado y visible (P-BBW-95)'
        : `en estado "${status}": solo sale lo aprobado${fieldSpec(key).emittedWhileInherited ? '' : ' (y no se emitía antes de S2)'}`;
      fail('R7g', where, `Person.${prop} emitido con el campo entity.${key} ${why}`);
      continue;
    }
    if (emitted && !present) { fail('R7g', where, `entity.${key} está "${status}", es visible según el contenido y se emite, pero Person.${prop} no está en lo servido`); continue; }
    if (!present) continue;
    const missing = notVisible(key, person[prop], html, h);
    if (missing.length === 0) continue;
    if (status === 'aprobado') fail('R7g', where, `Person.${prop} (entity.${key}, aprobado) es visible según el contenido pero NO en el HTML servido: ${missing.join(', ')} (un componente no pinta lo que lee; los datos estructurados describen la página, no la amplían)`);
    else inheritedNotVisible.push(`entity.${key} (Person.${prop}, heredado): no visible ${missing.join(', ')}`);
  }
  // credenciales emitidas (un objeto o una lista): su dirección es la de la llave declarada
  if (person.hasCredential !== undefined) {
    const declared = (entityValue('credentials') as Credential[] | undefined) ?? [];
    for (const c of (Array.isArray(person.hasCredential) ? person.hasCredential : [person.hasCredential]) as { url?: unknown }[]) {
      if (!declared.some((d) => identity.links[d.link as keyof typeof identity.links] === c.url)) fail('R7g', where, `hasCredential con url "${String(c.url)}" que no es la de ninguna credencial declarada en la entidad`);
    }
  }
  // ProfilePage: solo con el mínimo aprobado, y apuntando a la persona
  const profile = nodes.find((n) => n['@type'] === 'ProfilePage');
  if (profile && !isProfilePageReadyOn(ctx)) fail('R7g', where, 'ProfilePage emitida sin el mínimo de la entidad aprobado y visible');
  if (profile && (profile.mainEntity as { '@id'?: unknown } | undefined)?.['@id'] !== person['@id']) fail('R7g', where, 'ProfilePage.mainEntity no apunta a la Person del grafo');
  // R7h (b) — las fechas de la página son las de su contenido (las edita una persona), nunca la hora de la compilación
  if (profile) {
    const section = getPage(e.locale, e.id).sections.find((s) => s.type === 'profile');
    const want = section && section.type === 'profile' ? { dateCreated: section.published, dateModified: section.updated } : null;
    if (!want) fail('R7h', where, 'ProfilePage sin sección de perfil en su documento');
    else for (const k of ['dateCreated', 'dateModified'] as const) {
      if (profile[k] !== want[k]) fail('R7h', where, `ProfilePage.${k} "${String(profile[k])}" ≠ la fecha del contenido "${want[k]}" (una fecha la escribe una persona en el documento; nunca la hora de la compilación)`);
    }
  }
  // R7h (c) — el retrato: cada dirección publicada en out/, recorte del conjunto de la entidad, ≥ 50 000 píxeles
  if (person.image !== undefined) {
    const members = mediaMembers(String(entityValue('image') ?? ''));
    for (const url of (Array.isArray(person.image) ? person.image : [person.image]).map(String)) {
      const rel = url.startsWith(site.url) ? url.slice(site.url.length) : null;
      const m = members.find((x) => x.src === rel);
      if (!rel || !fs.existsSync(path.join(OUT, rel))) fail('R7h', where, `Person.image "${url}" no es un archivo publicado del sitio (sin retrato publicado no se escribe la propiedad)`);
      if (!m) fail('R7h', where, `Person.image "${url}" no es un recorte del conjunto que la entidad referencia`);
      else if ((m.width ?? 0) * (m.height ?? 0) < 50_000) fail('R7h', where, `Person.image "${url}" mide ${m.width}×${m.height}, por debajo de 50 000 píxeles (Google, ProfilePage)`);
    }
  }
}

function pageEntryType(id: PageId): string {
  return PAGES.find((p) => p.id === id)?.type ?? '?';
}

// R7h (a) — la persona se declara en UN documento del sitio, el de la página de perfil
if (personDeclarations.length !== 1 || personDeclarations[0].type !== 'profile') {
  fail('R7h', 'out/', `el Person se declara en [${personDeclarations.map((d) => `${d.route} (${d.type}, ×${d.count})`).join(', ') || 'ninguna página'}]: tiene que declararse una sola vez, en la página de perfil; las demás lo referencian por su @id`);
} else if (personDeclarations[0].count !== 1) fail('R7h', `out${personDeclarations[0].route}index.html`, `${personDeclarations[0].count} declaraciones del Person en la página de perfil (una)`);

// R7f — mapa del sitio y robots, en conjunto
const expectedSitemap = expected.filter((e) => pageRules(e.id).indexable).map((e) => e.url);
if (sitemapUrls.join('\n') !== expectedSitemap.join('\n')) {
  fail('R7f', 'out/sitemap.xml', `las URL [${sitemapUrls.join(', ')}] ≠ las indexables del registro en su orden [${expectedSitemap.join(', ')}]`);
}
const hidden = expected.filter((e) => !pageRules(e.id).indexable).map((e) => e.route).sort();
const star = groups.get('*');
if (!star) fail('R7f', 'out/robots.txt', 'falta el grupo User-Agent: *');
else {
  if (!star.allow.includes('/')) fail('R7f', 'out/robots.txt', 'el grupo * no tiene Allow: / (D-BBW-12)');
  if (star.disallow.length > 0) fail('R7f', 'out/robots.txt', `el grupo * tiene Disallow [${star.disallow.join(', ')}]: la excepción es por agente de IA, no general (D-BBW-12)`);
}
for (const [agent, g] of groups) {
  if (agent === '*') continue;
  if (!(AI_AGENTS as readonly string[]).includes(agent)) fail('R7f', 'out/robots.txt', `grupo de un agente no declarado: ${agent}`);
  const dis = [...g.disallow].sort();
  if (dis.join('\n') !== hidden.join('\n')) fail('R7f', 'out/robots.txt', `Disallow de ${agent} [${dis.join(', ')}] ≠ rutas ocultas [${hidden.join(', ')}]`);
}
const sitemapLine = robotsText.match(/^Sitemap:\s*(.+)$/im)?.[1]?.trim();
if (sitemapLine !== `${site.url}/sitemap.xml`) fail('R7f', 'out/robots.txt', `Sitemap: "${sitemapLine}" ≠ ${site.url}/sitemap.xml`);

// ── Informe ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// R7g (c) — completitud de la entidad: se imprime siempre (pase o falle la guardia), no falla
const completeness = entityCompleteness();
console.log(completeness.line);
for (const line of emissionLines) console.log(line);
for (const line of inheritedNotVisible) console.log(`[entidad] heredado y emitido sin ser visible: ${line}`);
if (fails.length === 0) {
  const indexable = expected.filter((e) => pageRules(e.id).indexable).length;
  console.log(`[seo-gate] OK — ${checkedPages} página(s) servida(s) = ${PAGES.length} registrada(s) × ${publishedLocales.length} locale(s); ${indexable} indexable(s) en el mapa del sitio, ${expected.length - indexable} oculta(s) con noindex + cabecera + Disallow para ${AI_AGENTS.length} agentes; datos estructurados coherentes con el texto visible y con la entidad.`);
  process.exit(0);
}
console.error(`[seo-gate] ${fails.length} problema(s) en ${path.relative(REPO_ROOT, OUT) || OUT} — el sitio compilado no cumple su registro (R7, docs/system/SEO.md).`);
for (const f of fails) console.error(`  ${f.rule} ${f.where}: ${f.detail}`);
console.error('  Regla: toda página servida está registrada con su tipo, y su tipo decide robots, sitemap, cabeceras, imagen de compartir y datos estructurados.');
process.exit(1);
