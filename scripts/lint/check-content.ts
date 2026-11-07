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
 *        publishedLocales es error). Todo locale publicado tiene directorio. El ÚNICO archivo admitido en la raíz de content/ es
 *        `site.json` (D-BBW-78: la identidad editable y los destinos de los enlaces, que no se traducen y por eso no viven en un
 *        locale); tiene que estar, y cualquier otro archivo suelto en la raíz es estructura sin modelo. Se valida contra su esquema
 *        estricto (src/content/site.ts): llave desconocida, texto vacío, HTML, correo mal formado o destino no absoluto fallan aquí.
 *   R2 · Cada locale contiene exactamente: `global.json` + una carpeta por colección del esquema (`pages/`). Cualquier otra
 *        entrada = colección sin esquema = estructura sin modelo → error.
 *   R3 · `global.json` cumple GlobalDocument; cada `pages/*.json` cumple PageDocument; `pages/home.json` existe (la landing).
 *        Llaves desconocidas, HTML, textos vacíos, ids repetidos, tipos de sección desconocidos y llaves de enlace inexistentes
 *        fallan con la ruta exacta ($.footer.social[1].link …).
 *   R4 · Solo `.json` dentro de las colecciones.
 *   R5 · SUSTITUCIONES (D-BBW-23, fase 6c): todo `{{…}}` de cualquier texto es un identificador DECLARADO en src/content/substitutions.ts
 *        (`{{brand}}`, `{{domain}}`, `{{year}}`…). Uno no declarado, o cualquier expresión entre llaves (lógica), falla con la ruta exacta.
 *        Informa cuántas sustituciones declaradas usa el contenido.
 * Informa además cuántos textos hay y cuántos son marcadores `[[PENDIENTE: …]]` (copy pendiente), sin interpretarlos (D-DOC-06).
 * Uso: `pnpm lint:content` · `pnpm guard` · pre-commit.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { publishedLocales, site } from '../../src/config/site';
import { PAGES, pageRoute, pageRules } from '../../src/config/pages';
import {
  GLOBAL_DOCUMENT,
  collections,
  collectTexts,
  isPlaceholder,
  validateGlobal,
  validatePage,
  type Problem,
} from '../../src/content/schema';
import { findUndeclaredSubstitutions, substitutions, RESTRICTED_SUBSTITUTION_KEYS, isRestrictedSubstitutionKey } from '../../src/content/substitutions';
import { validateSite } from '../../src/content/site';

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
  for (const t of all) substituted += (t.match(DECLARED_RE) ?? []).length;
}

if (!fs.existsSync(CONTENT_ROOT) || !fs.statSync(CONTENT_ROOT).isDirectory()) {
  console.error('[content-gate] FAIL-CLOSED: falta el directorio content/');
  process.exit(2);
}

// R1 — locales + el documento del sitio
const SITE_DOCUMENT = 'site.json';
const published = publishedLocales as readonly string[];
let hasSite = false;
for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    if (entry.isFile() && entry.name === SITE_DOCUMENT) {
      hasSite = true;
      const abs = path.join(CONTENT_ROOT, entry.name);
      const doc = readJson(abs);
      if (doc !== undefined) report(abs, validateSite(doc), doc);
      continue;
    }
    fails.push({ rule: 'R1', where: rel(path.join(CONTENT_ROOT, entry.name)), detail: `en la raíz de content/ solo se admiten directorios de locale y el documento del sitio (${SITE_DOCUMENT})` });
    continue;
  }
  if (!published.includes(entry.name)) {
    fails.push({ rule: 'R1', where: `content/${entry.name}/`, detail: `locale NO publicado (D-BBW-15): crear content/${entry.name}/ declara ese idioma; añadir "${entry.name}" a publishedLocales en src/config/site.ts o retirar el directorio` });
  }
}
if (!hasSite) fails.push({ rule: 'R1', where: `content/${SITE_DOCUMENT}`, detail: 'falta el documento del sitio (nombre, cargo, buzón y destinos de los enlaces)' });
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
}

if (fails.length === 0) {
  console.log(`[content-gate] OK — ${published.length} locale(s) publicado(s) + el documento del sitio; ${docs} documento(s) válidos contra el esquema; ${texts} texto(s), ${pending} marcador(es) [[PENDIENTE]] (copy pendiente), ${substituted} sustitución(es) declarada(s) en uso.`);
  process.exit(0);
}
console.error(`[content-gate] ${fails.length} problema(s) en content/ — build roto.`);
for (const f of fails) console.error(`  ${f.rule} ${f.where}: ${f.detail}`);
console.error('  Regla: cada texto con su llave (por rol), sin presentación ni HTML, enlaces por llave del documento del sitio, solo locales publicados, solo colecciones del esquema, sustituciones solo del conjunto declarado.');
process.exit(1);
