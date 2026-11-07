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
 *   R7c · PÁGINA INDEXABLE: título y descripción dentro del rango de su tipo; sin `noindex`; en el mapa del sitio; con imagen de compartir
 *         y tarjeta grande si su tipo la declara (y SIN imagen si no).
 *   R7d · PÁGINA OCULTA: `<meta name="robots">` con `noindex` y `noarchive`; regla de ruta en `_headers` con `X-Robots-Tag` equivalente;
 *         fuera del mapa del sitio; sin datos estructurados; sin imagen de compartir; `Disallow` de su ruta para CADA agente de IA de
 *         `robots.txt`.
 *   R7e · DATOS ESTRUCTURADOS: exactamente los que su tipo declara (0 o 1 bloque); JSON parseable; `@context` schema.org; los tipos del
 *         grafo son los esperados; y NO DICEN NADA QUE LA PÁGINA NO DIGA en los campos comprobables: `name` y `jobTitle` aparecen
 *         literales en el texto visible, `url` es la portada del locale.
 *   R7f · MAPA DEL SITIO Y ROBOTS: `sitemap.xml` = exactamente las páginas indexables × locales publicados, en el orden del registro;
 *         `robots.txt` con `User-Agent: *` + `Allow: /`, un grupo por agente de IA declarado y `Disallow` = exactamente las rutas ocultas;
 *         `Sitemap:` apunta al dominio canónico.
 * Uso: `pnpm lint:seo [--out <dir>]` · al final de `pnpm build`. No corre en el pre-commit porque necesita el sitio compilado (14 s).
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { site, publishedLocales, type Locale } from '../../src/config/site';
import { PAGES, pageRoute, pageUrl, pageRules, type PageId } from '../../src/config/pages';
import { AI_AGENTS } from '../../src/app/robots';
import { identity } from '../../src/content/site';
import { getPage } from '../../src/content';
import { media } from '../../src/media';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const argOut = process.argv.indexOf('--out');
const OUT = argOut > 0 ? path.resolve(process.argv[argOut + 1]) : path.join(REPO_ROOT, 'out');

type Fail = { rule: string; where: string; detail: string };
const fails: Fail[] = [];
const fail = (rule: string, where: string, detail: string) => fails.push({ rule, where, detail });

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
const visibleText = (html: string): string =>
  decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

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
      if (h.title.length < min || h.title.length > max) fail('R7c', where, `<title> de ${h.title.length} caracteres fuera del rango [${min}, ${max}] del tipo`);
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
        const want = kind === 'entity' ? ['Person', 'WebSite'] : [];
        if (types.join(',') !== want.join(',')) fail('R7e', where, `tipos del grafo [${types.join(', ')}] ≠ [${want.join(', ')}]`);
        const person = nodes.find((n) => n['@type'] === 'Person');
        if (person) {
          for (const field of ['name', 'jobTitle'] as const) {
            const value = person[field];
            if (typeof value !== 'string' || value.length === 0) fail('R7e', where, `Person.${field} ausente`);
            else if (!h.text.includes(value)) fail('R7e', where, `Person.${field} "${value}" no aparece en el texto visible de la página (los datos estructurados describen la página, no la amplían)`);
          }
          if (person.name !== identity.brand) fail('R7e', where, `Person.name ≠ la marca de la fuente única`);
          if (person.url !== pageUrl(e.locale, 'home')) fail('R7e', where, `Person.url "${String(person.url)}" ≠ la portada del locale`);
        }
        const website = nodes.find((n) => n['@type'] === 'WebSite');
        if (website && website.url !== pageUrl(e.locale, 'home')) fail('R7e', where, `WebSite.url ≠ la portada del locale`);
        if (website && website.name !== identity.brand) fail('R7e', where, `WebSite.name ≠ la marca`);
      }
    }
  }
}

function pageEntryType(id: PageId): string {
  return PAGES.find((p) => p.id === id)?.type ?? '?';
}

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
if (fails.length === 0) {
  const indexable = expected.filter((e) => pageRules(e.id).indexable).length;
  console.log(`[seo-gate] OK — ${checkedPages} página(s) servida(s) = ${PAGES.length} registrada(s) × ${publishedLocales.length} locale(s); ${indexable} indexable(s) en el mapa del sitio, ${expected.length - indexable} oculta(s) con noindex + cabecera + Disallow para ${AI_AGENTS.length} agentes; datos estructurados coherentes con el texto visible.`);
  process.exit(0);
}
console.error(`[seo-gate] ${fails.length} problema(s) en ${path.relative(REPO_ROOT, OUT) || OUT} — el sitio compilado no cumple su registro (R7, docs/system/SEO.md).`);
for (const f of fails) console.error(`  ${f.rule} ${f.where}: ${f.detail}`);
console.error('  Regla: toda página servida está registrada con su tipo, y su tipo decide robots, sitemap, cabeceras, imagen de compartir y datos estructurados.');
process.exit(1);
