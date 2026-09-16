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
 *        publishedLocales es error). Todo locale publicado tiene directorio.
 *   R2 · Cada locale contiene exactamente: `global.json` + una carpeta por colección del esquema (`pages/`). Cualquier otra
 *        entrada = colección sin esquema = estructura sin modelo → error.
 *   R3 · `global.json` cumple GlobalDocument; cada `pages/*.json` cumple PageDocument; `pages/home.json` existe (la landing).
 *        Llaves desconocidas, HTML, textos vacíos, ids repetidos, tipos de sección desconocidos y llaves de enlace inexistentes
 *        fallan con la ruta exacta ($.footer.social[1].link …).
 *   R4 · Solo `.json` dentro de las colecciones.
 * Informa además cuántos textos hay y cuántos son marcadores `[[PENDIENTE: …]]` (copy pendiente), sin interpretarlos (D-DOC-06).
 * Uso: `pnpm lint:content` · `pnpm guard` · pre-commit.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { publishedLocales } from '../../src/config/site';
import {
  GLOBAL_DOCUMENT,
  collections,
  collectTexts,
  isPlaceholder,
  validateGlobal,
  validatePage,
  type Problem,
} from '../../src/content/schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_ROOT = path.join(REPO_ROOT, 'content');

type Fail = { rule: string; where: string; detail: string };
const fails: Fail[] = [];
let docs = 0;
let texts = 0;
let pending = 0;

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
}

if (!fs.existsSync(CONTENT_ROOT) || !fs.statSync(CONTENT_ROOT).isDirectory()) {
  console.error('[content-gate] FAIL-CLOSED: falta el directorio content/');
  process.exit(2);
}

// R1 — locales
const published = publishedLocales as readonly string[];
for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    fails.push({ rule: 'R1', where: rel(path.join(CONTENT_ROOT, entry.name)), detail: 'solo se admiten directorios de locale bajo content/' });
    continue;
  }
  if (!published.includes(entry.name)) {
    fails.push({ rule: 'R1', where: `content/${entry.name}/`, detail: `locale NO publicado (D-BBW-15): crear content/${entry.name}/ declara ese idioma; añadir "${entry.name}" a publishedLocales en src/config/site.ts o retirar el directorio` });
  }
}
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

if (fails.length === 0) {
  console.log(`[content-gate] OK — ${published.length} locale(s) publicado(s); ${docs} documento(s) válidos contra el esquema; ${texts} texto(s), ${pending} marcador(es) [[PENDIENTE]] (copy pendiente).`);
  process.exit(0);
}
console.error(`[content-gate] ${fails.length} problema(s) en content/ — build roto.`);
for (const f of fails) console.error(`  ${f.rule} ${f.where}: ${f.detail}`);
console.error('  Regla: cada texto con su llave (por rol), sin presentación ni HTML, enlaces por llave de site.links, solo locales publicados, solo colecciones del esquema.');
process.exit(1);
