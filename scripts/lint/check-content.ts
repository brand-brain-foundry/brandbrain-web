#!/usr/bin/env tsx
/**
 * check-content.ts — GUARDIA DEL MODELO DE CONTENIDO (fase 6a, brandbrain-web; docs/system/CONTENT_MODEL.md).
 *
 * Por qué existe: `next build` solo valida los documentos que una página CONSUME (getPage/getGlobal, fail-closed). Esta guardia
 * valida el ÁRBOL COMPLETO de content/ contra el esquema (src/content/schema.ts), incluido lo que hoy no tiene consumidor,
 * para que "el esquema valida el modelo completo" sea verdad mecánica y no intención.
 *
 * Qué comprueba (exit 1 si falla, exit 2 si el tool rompe — fail-closed en .githooks/pre-commit):
 *   R1 · Todo directorio bajo content/ es un locale PUBLICADO (D-BBW-15: crear content/en/ es declarar EN; sin "en" en
 *        publishedLocales es error). Todo locale publicado tiene directorio. Los ÚNICOS archivos admitidos en la raíz de content/ son
 *        `site.json` (D-BBW-78: la identidad editable y los destinos de los enlaces, que no se traducen y por eso no viven en un
 *        locale; desde S2 también el BLOQUE DE ENTIDAD, P-BBW-95) y `site.schema.json` (S2: el esquema exportable de ese documento,
 *        GENERADO por `pnpm content:schema` desde la descripción declarativa; aquí se comprueba que el fichero versionado coincide
 *        carácter a carácter con lo que la descripción produce — editado a mano o desactualizado = error que pide regenerarlo). Tienen
 *        que estar, y cualquier otro archivo suelto en la raíz es estructura sin modelo. `site.json` se valida contra su esquema estricto
 *        (src/content/site.ts + entity.ts): llave desconocida, texto vacío, HTML, correo mal formado, destino no absoluto, campo de
 *        entidad con estado o valor incoherentes, o un valor escrito dos veces, fallan aquí.
 *   R2 · Cada locale contiene exactamente: `global.json` + una carpeta por colección del esquema (`pages/`). Cualquier otra
 *        entrada = colección sin esquema = estructura sin modelo → error.
 *   R3 · `global.json` cumple GlobalDocument; cada `pages/*.json` cumple PageDocument; `pages/home.json` existe (la landing).
 *        Llaves desconocidas, HTML, textos vacíos, ids repetidos, tipos de sección desconocidos y llaves de enlace inexistentes
 *        fallan con la ruta exacta ($.footer.social[1].link …).
 *   R4 · Solo `.json` dentro de las colecciones.
 *   R5 · SUSTITUCIONES (D-BBW-23, fase 6c): todo `{{…}}` de cualquier texto es un identificador DECLARADO en src/content/substitutions.ts
 *        (`{{brand}}`, `{{domain}}`, `{{year}}`…). Uno no declarado, o cualquier expresión entre llaves (lógica), falla con la ruta exacta.
 *        S2 (P-BBW-95): una sustitución DE ENTIDAD BLOQUEADA (`{{category}}`, `{{motto}}` con su campo no aprobado) también falla con la ruta.
 *        Informa cuántas sustituciones declaradas usa el contenido.
 *        P1 (D-BBW-107): cada RUTA RETIRADA (`RETIRED_ROUTES`) tiene su 301 de un salto a la ruta vigente de su sustituta, sin prefijo
 *        (`/quien`) y por cada locale publicado con y sin barra (`/es/quien`, `/es/quien/`); y su slug no vuelve a usarlo ninguna página.
 *   R8 · ETIQUETA ÚNICA DE UN DESTINO (S3c, D-BBW-95): cada etiqueta de `linkLabels` («LinkedIn») se ESCRIBE una sola vez, en `global.json`.
 *        Falla (a) cualquier otro texto del locale igual a ella y (b) cualquier enlace a ese destino (`link: <llave>`, o la llamada secundaria del
 *        héroe con `ctaSecondaryLink: <llave>`) cuya etiqueta sea un texto escrito en vez de la cita `{ global: "linkLabels.<llave>" }`.
 * Informa además cuántos textos hay y cuántos son marcadores `[[PENDIENTE: …]]` (copy pendiente), sin interpretarlos (D-DOC-06), y la
 * COMPLETITUD de la entidad (cuántos campos aprobados, heredados y pendientes; S2): se imprime, no falla.
 * Uso: `pnpm lint:content` · `pnpm guard` · pre-commit.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { publishedLocales, site } from '../../src/config/site';
import { PAGES, RETIRED_ROUTES, pageRoute, pageRules } from '../../src/config/pages';
import {
  GLOBAL_DOCUMENT,
  collections,
  collectTexts,
  isPlaceholder,
  validateGlobal,
  validatePage,
  type Problem,
} from '../../src/content/schema';
import { findBlockedEntitySubstitutions, findUndeclaredSubstitutions, substitutions, RESTRICTED_SUBSTITUTION_KEYS, isRestrictedSubstitutionKey } from '../../src/content/substitutions';
import { validateSite, WRITTEN_LINK_KEYS } from '../../src/content/site';
import { entityCompleteness } from '../../src/content/entity';
import { renderSiteSchema } from '../../src/content/site-schema';
import { MEDIA_IDENTIFIERS } from '../../src/media';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_ROOT = path.join(REPO_ROOT, 'content');

type Fail = { rule: string; where: string; detail: string };
const fails: Fail[] = [];
let docs = 0;
let texts = 0;
let pending = 0;
let substituted = 0;
const DECLARED_RE = new RegExp(`\\{\\{\\s*(?:${Object.keys(substitutions).join('|')})\\s*\\}\\}`, 'g');

function rel(abs: string): string {
  return path.relative(REPO_ROOT, abs).split(path.sep).join('/');
}

function readJson(abs: string): unknown | undefined {
  let raw: string;
  try {
    raw = fs.readFileSync(abs, 'utf8');
  } catch {
    fails.push({ rule: 'R3', where: rel(abs), detail: 'no se puede leer' });
    return undefined;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    fails.push({ rule: 'R3', where: rel(abs), detail: `JSON inválido: ${(e as Error).message}` });
    return undefined;
  }
}

function report(abs: string, problems: Problem[], doc: unknown): void {
  docs += 1;
  for (const p of problems) fails.push({ rule: 'R3', where: rel(abs), detail: `${p.path}: ${p.message}` });
  const all = collectTexts(doc);
  texts += all.length;
  pending += all.filter(isPlaceholder).length;
  // R5: sustituciones — aviso-legal.json acepta las restringidas; cualquier otro documento no.
  const isAvisoLegal = abs.endsWith('aviso-legal.json');
  const allowedExtras = isAvisoLegal ? (RESTRICTED_SUBSTITUTION_KEYS as unknown as ReadonlyArray<string>) : [];
  for (const u of findUndeclaredSubstitutions(doc, "$", [], allowedExtras)) {
    const tokenKey = u.token.replace(/\{\{\s*|\s*\}\}/g, '');
    const detail = isRestrictedSubstitutionKey(tokenKey)
      ? `${u.path}: sustitución restringida "${u.token}" (solo se admite en content/es/pages/aviso-legal.json)`
      : `${u.path}: sustitución no declarada "${u.token}" (declaradas: ${Object.keys(substitutions).join(', ')}; sin lógica, D-BBW-23)`;
    fails.push({ rule: 'R5', where: rel(abs), detail });
  }
  for (const b of findBlockedEntitySubstitutions(doc)) {
    fails.push({ rule: 'R5', where: rel(abs), detail: `${b.path}: sustitución de entidad BLOQUEADA "${b.token}" (entity.${b.key} no está aprobado en content/site.json; S2, P-BBW-95)` });
  }
  for (const t of all) substituted += (t.match(DECLARED_RE) ?? []).length;
}

if (!fs.existsSync(CONTENT_ROOT) || !fs.statSync(CONTENT_ROOT).isDirectory()) {
  console.error('[content-gate] FAIL-CLOSED: falta el directorio content/');
  process.exit(2);
}

// R1 — locales + el documento del sitio + su esquema exportado (S2)
const SITE_DOCUMENT = 'site.json';
const SITE_SCHEMA = 'site.schema.json';
const published = publishedLocales as readonly string[];
let hasSite = false;
let hasSchema = false;
for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    if (entry.isFile() && entry.name === SITE_DOCUMENT) {
      hasSite = true;
      const abs = path.join(CONTENT_ROOT, entry.name);
      const doc = readJson(abs);
      if (doc !== undefined) report(abs, validateSite(doc), doc);
      continue;
    }
    if (entry.isFile() && entry.name === SITE_SCHEMA) {
      hasSchema = true;
      const abs = path.join(CONTENT_ROOT, entry.name);
      const expected = renderSiteSchema(WRITTEN_LINK_KEYS, MEDIA_IDENTIFIERS);
      let actual = '';
      try { actual = fs.readFileSync(abs, 'utf8'); } catch { fails.push({ rule: 'R1', where: rel(abs), detail: 'no se puede leer' }); continue; }
      if (actual !== expected) {
        fails.push({ rule: 'R1', where: rel(abs), detail: `el esquema versionado NO coincide con la descripción declarativa (src/content/{entity-fields,site-schema}.ts, llaves de $.links, medios): no se edita a mano; regenerar con \`pnpm content:schema\`` });
      }
      continue;
    }
    fails.push({ rule: 'R1', where: rel(path.join(CONTENT_ROOT, entry.name)), detail: `en la raíz de content/ solo se admiten directorios de locale, el documento del sitio (${SITE_DOCUMENT}) y su esquema generado (${SITE_SCHEMA})` });
    continue;
  }
  if (!published.includes(entry.name)) {
    fails.push({ rule: 'R1', where: `content/${entry.name}/`, detail: `locale NO publicado (D-BBW-15): crear content/${entry.name}/ declara ese idioma; añadir "${entry.name}" a publishedLocales en src/config/site.ts o retirar el directorio` });
  }
}
if (!hasSite) fails.push({ rule: 'R1', where: `content/${SITE_DOCUMENT}`, detail: 'falta el documento del sitio (nombre, cargo, buzón, destinos de los enlaces y bloque de entidad)' });
if (!hasSchema) fails.push({ rule: 'R1', where: `content/${SITE_SCHEMA}`, detail: 'falta el esquema exportado del documento del sitio (S2): generar con `pnpm content:schema`' });
for (const locale of published) {
  const localeDir = path.join(CONTENT_ROOT, locale);
  if (!fs.existsSync(localeDir)) {
    fails.push({ rule: 'R1', where: `content/${locale}/`, detail: 'locale publicado sin contenido' });
    continue;
  }
  // R2 — forma del locale
  const allowedDirs = new Set<string>(Object.values(collections));
  const entries = fs.readdirSync(localeDir, { withFileTypes: true });
  let hasGlobal = false;
  for (const e of entries) {
    if (e.isFile() && e.name === `${GLOBAL_DOCUMENT}.json`) {
      hasGlobal = true;
      const abs = path.join(localeDir, e.name);
      const doc = readJson(abs);
      if (doc !== undefined) report(abs, validateGlobal(doc), doc);
    } else if (e.isDirectory() && allowedDirs.has(e.name)) {
      const colDir = path.join(localeDir, e.name);
      const files = fs.readdirSync(colDir, { withFileTypes: true });
      if (e.name === collections.pages && !files.some((f) => f.isFile() && f.name === 'home.json')) {
        fails.push({ rule: 'R3', where: `content/${locale}/pages/`, detail: 'falta home.json (la landing)' });
      }
      for (const f of files) {
        const abs = path.join(colDir, f.name);
        if (!f.isFile() || !f.name.endsWith('.json')) {
          fails.push({ rule: 'R4', where: rel(abs), detail: 'solo documentos .json dentro de una colección' });
          continue;
        }
        const doc = readJson(abs);
        if (doc === undefined) continue;
        if (e.name === collections.pages) report(abs, validatePage(doc), doc);
      }
    } else {
      fails.push({ rule: 'R2', where: rel(path.join(localeDir, e.name)), detail: `no es global.json ni una colección del esquema (${[...allowedDirs].join(', ')}): estructura sin modelo` });
    }
  }
  if (!hasGlobal) fails.push({ rule: 'R2', where: `content/${locale}/${GLOBAL_DOCUMENT}.json`, detail: 'falta el documento global (navegación, pie)' });
}

// R6 — COHERENCIA HEADERS + REDIRECTS (§0.3.6, P-BBW-80; sobre el registro general desde S1, P-BBW-94): cada página cuyo TIPO no es
// indexable tiene su X-Robots-Tag en _headers (regla de ruta, no acotada al anfitrión) por cada locale publicado; cada página con slug
// tiene su redirección sin prefijo en _redirects hacia el locale por defecto (D-BBW-55). La cabecera no se genera (manifiesto declarativo,
// D-BBW-44): se verifica aquí sobre la fuente y en R7 (check-seo.ts) sobre out/.
{
  const headersPath = path.join(REPO_ROOT, 'public', '_headers');
  const redirectsPath = path.join(REPO_ROOT, 'public', '_redirects');
  let headersText = '';
  let redirectsText = '';
  try { headersText = fs.readFileSync(headersPath, 'utf8'); } catch { fails.push({ rule: 'R6', where: 'public/_headers', detail: 'no se puede leer el fichero de cabeceras' }); }
  try { redirectsText = fs.readFileSync(redirectsPath, 'utf8'); } catch { fails.push({ rule: 'R6', where: 'public/_redirects', detail: 'no se puede leer el fichero de redirecciones' }); }

  for (const page of PAGES) {
    if (!pageRules(page.id).indexable) {
      for (const locale of publishedLocales) {
        const route = pageRoute(locale, page.id);
        const bare = route.replace(/\/$/, '');
        const lines = headersText.split('\n');
        const idx = lines.findIndex((l) => { const t = l.trim(); return t === bare || t === `${bare}/*`; });
        if (idx < 0) {
          fails.push({ rule: 'R6', where: 'public/_headers', detail: `falta la regla de ruta "${bare}/*" para X-Robots-Tag (§0.3.6, P-BBW-80): la página ${page.id} es de tipo ${page.type} (no indexable) pero no tiene cabecera ${route}` });
          continue;
        }
        const headerLine = lines.slice(idx + 1).find((l) => l.trim().startsWith('X-Robots-Tag:')) ?? '';
        if (!headerLine.includes('noindex') || !headerLine.includes('noarchive')) {
          fails.push({ rule: 'R6', where: 'public/_headers', detail: `la regla para ${bare}/* tiene X-Robots-Tag sin "noindex, noarchive" (P-BBW-80 §0.1)` });
        }
      }
    }
    if (!page.slug) continue;
    const target = pageRoute(site.defaultLocale, page.id);
    const hasRedirect = redirectsText.split('\n').some((line) => {
      const parts = line.trim().split(/\s+/);
      return parts[0] === `/${page.slug}` && parts[1] === target;
    });
    if (!hasRedirect) {
      fails.push({ rule: 'R6', where: 'public/_redirects', detail: `falta la redirección "/${page.slug} → ${target}" (§0.3.6, P-BBW-80; D-BBW-55)` });
    }
  }
  // P1 (D-BBW-107): las rutas retiradas — un 301 de UN salto a la ruta vigente de la sustituta, sin prefijo y con cada locale publicado
  const redirectLines = redirectsText.split('\n').map((l) => l.trim().split(/\s+/)).filter((parts) => parts[0]?.startsWith('/'));
  for (const retired of RETIRED_ROUTES) {
    if ((PAGES as readonly { slug: string }[]).some((p) => p.slug === retired.slug)) {
      fails.push({ rule: 'R6', where: 'src/config/pages.ts', detail: `el slug retirado "${retired.slug}" (${retired.decision}) vuelve a ser el de una página: una ruta retirada no se reutiliza (los enlaces de fuera apuntan a la sustituta)` });
    }
    const expected: [string, string][] = [[`/${retired.slug}`, pageRoute(site.defaultLocale, retired.replacedBy)]];
    for (const locale of publishedLocales) {
      const to = pageRoute(locale, retired.replacedBy);
      expected.push([`/${locale}/${retired.slug}`, to], [`/${locale}/${retired.slug}/`, to]);
    }
    for (const [from, to] of expected) {
      const line = redirectLines.find((parts) => parts[0] === from);
      if (!line) fails.push({ rule: 'R6', where: 'public/_redirects', detail: `falta el 301 de la ruta retirada "${from} → ${to}" (${retired.decision})` });
      else if (line[1] !== to || line[2] !== '301') fails.push({ rule: 'R6', where: 'public/_redirects', detail: `la ruta retirada "${from}" va a "${line[1]}" con ${line[2] ?? 'sin código'}: tiene que ser un 301 de UN salto a "${to}" (${retired.decision})` });
    }
  }
}

// R8 — la etiqueta única de un destino, escrita una vez (S3c)
let labelsChecked = 0;
for (const locale of published) {
  const localeDir = path.join(CONTENT_ROOT, locale);
  const globalAbs = path.join(localeDir, `${GLOBAL_DOCUMENT}.json`);
  const global = fs.existsSync(globalAbs) ? (readJson(globalAbs) as Record<string, unknown> | undefined) : undefined;
  const labels = (global && typeof global.linkLabels === 'object' && global.linkLabels) ? (global.linkLabels as Record<string, unknown>) : {};
  const docsToScan: { abs: string; doc: unknown }[] = global ? [{ abs: globalAbs, doc: global }] : [];
  const pagesDir = path.join(localeDir, collections.pages);
  if (fs.existsSync(pagesDir)) {
    for (const f of fs.readdirSync(pagesDir)) if (f.endsWith('.json')) { const abs = path.join(pagesDir, f); docsToScan.push({ abs, doc: readJson(abs) }); }
  }
  const values = new Map<string, string>(Object.entries(labels).filter(([, v]) => typeof v === 'string').map(([k, v]) => [v as string, k]));
  labelsChecked += values.size;
  const isCitation = (v: unknown, key: string) => !!v && typeof v === 'object' && (v as Record<string, unknown>).global === `linkLabels.${key}`;
  for (const { abs, doc } of docsToScan) {
    const walk = (v: unknown, p: string) => {
      if (typeof v === 'string') {
        if (values.has(v.trim()) && !(abs === globalAbs && p.startsWith('$.linkLabels.'))) {
          fails.push({ rule: 'R8', where: rel(abs), detail: `${p}: la etiqueta "${v.trim()}" se escribe otra vez; vive una sola vez en global.json → linkLabels.${values.get(v.trim())} (citarla con { "global": "linkLabels.${values.get(v.trim())}" })` });
        }
        return;
      }
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${p}[${i}]`));
      if (!v || typeof v !== 'object') return;
      const o = v as Record<string, unknown>;
      const target = typeof o.link === 'string' ? o.link : typeof o.ctaSecondaryLink === 'string' ? o.ctaSecondaryLink : undefined;
      if (target && target in labels) {
        for (const slot of typeof o.link === 'string' ? ['label', 'text'] : ['ctaSecondary']) {
          if (slot in o && !isCitation(o[slot], target)) {
            fails.push({ rule: 'R8', where: rel(abs), detail: `${p}.${slot}: un enlace a "${target}" escribe su propia etiqueta; tiene que citar la única: { "global": "linkLabels.${target}" }` });
          }
        }
      }
      for (const [k, x] of Object.entries(o)) walk(x, `${p}.${k}`);
    };
    walk(doc, '$');
  }
}

if (fails.length === 0) {
  console.log(`[content-gate] OK — ${published.length} locale(s) publicado(s) + el documento del sitio y su esquema; ${docs} documento(s) válidos contra el esquema; ${texts} texto(s), ${pending} marcador(es) [[PENDIENTE]] (copy pendiente), ${substituted} sustitución(es) declarada(s) en uso; ${labelsChecked} etiqueta(s) única(s) de destino escritas una vez (R8).`);
  console.log(entityCompleteness().line);
  process.exit(0);
}
console.error(`[content-gate] ${fails.length} problema(s) en content/ — build roto.`);
for (const f of fails) console.error(`  ${f.rule} ${f.where}: ${f.detail}`);
console.error('  Regla: cada texto con su llave (por rol), sin presentación ni HTML, enlaces por llave del documento del sitio, solo locales publicados, solo colecciones del esquema, sustituciones solo del conjunto declarado.');
process.exit(1);
