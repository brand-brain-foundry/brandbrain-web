#!/usr/bin/env tsx
// COPIA POR CONTRATO (D-BBW-06) — origen bbf-web:scripts/lint/check-typography-tokens.ts @ e453303 (origin/main 2026-09-15).
// Registro: bbf-command-hub:shared/CONTRATOS_ENTRE_REPOS.md → CONTRATO-04. Se actualiza solo re-pinneando.
/**
 * =============================================================================
 * check-typography-tokens.ts — GUARDIA DETERMINISTA de tipografía
 * =============================================================================
 * DECISIÓN: D-TYPO-RATIO-FIX + D-DS-AXIOMA-AGNOSTICO. Molde: `check-color-tokens.ts`
 * (D-COLOR-SPACE, ya en producción) — misma estructura, otro dominio (font-size/
 * font-weight en vez de HEX). NO es copia literal — incluye el fix de comentarios
 * trailing (`/* ... *\/`) desde el inicio (aprendizaje del color, ver §0.4 del
 * despacho que originó esta guardia).
 *
 * ─── QUÉ HACE ────────────────────────────────────────────────────────────────
 * Rompe el build (exit≠0) si aparece un `font-size`/`fontSize` o `font-weight`/
 * `fontWeight` con valor NUMÉRICO CRUDO fuera de `primitives/typography.css` —
 * el único archivo donde ese literal es legítimo. Corre en `.githooks/pre-commit`
 * (tras la guardia de color) y vía `pnpm lint:typo` (entrypoint CI-ready).
 *
 * BASELINE ADITIVO (`.typographybaseline`): los sitios conocidos hoy (fallbacks
 * de `var(--x, Ypx)`, mockups de terceros, generación de imágenes OG que solo
 * acepta números literales) están baselined → el árbol actual queda VERDE el
 * día 1. Toda regresión NUEVA (un font-size/font-weight crudo que no está en el
 * baseline) → build roto. Cada corrección futura QUEMA su línea del baseline.
 *
 * ─── DERIVACIÓN (no hardcode) ────────────────────────────────────────────────
 * El propio archivo canon (`primitives/typography.css`) está EXENTO por
 * convención de nombre de archivo — un token nuevo en ese archivo nunca
 * dispara el gate.
 *
 * ─── QUÉ SE CONSIDERA "CRUDO" ─────────────────────────────────────────────────
 * font-size: cualquier valor que NO sea `var(--bbf-*)` (en cualquier posición,
 *   incluso dentro de `calc()`/fallback), `inherit`, un porcentaje (`50%`), o un
 *   `em` puro (relativo al padding del padre — `0.875em`). Esto SÍ incluye `rem`
 *   crudo, `px` crudo, número sin unidad, y `clamp(...)` sin var() dentro (un
 *   clamp de intención real se resuelve vía baseline + nota, no exención ciega
 *   del regex — ver §5 del despacho).
 * font-weight: cualquier valor NUMÉRICO crudo (`700`) que no sea `var(--bbf-*)`.
 *   Keywords (`bold`/`normal`/`inherit`) NO se marcan — el despacho pide
 *   "numérico crudo" explícitamente.
 * Cubre tanto CSS kebab-case (`font-size:`) como JS/TSX camelCase (`fontSize:`,
 * objetos de estilo inline / Satori OG-image generation).
 *
 * ─── ALCANCE REAL (nombrado, no inventado) ────────────────────────────────────
 * `typography.css` SÍ define font-weight como tokens (`--bbf-weight-*`) →
 * cubierto. line-height (`--bbf-leading-*`) y letter-spacing (`--bbf-tracking-*`)
 * también son primitivos reales pero el despacho NO pidió su denylist — fuera
 * de alcance este turno, no se inventa cobertura no pedida.
 *
 * ─── ESCAPE HATCH ────────────────────────────────────────────────────────────
 * `// TYPO-ALLOW: <razón>` (TS/TSX) o `/* TYPO-ALLOW: <razón> *\/` (CSS) en la
 * línea suprime todo hit de esa línea (razón OBLIGATORIA, audit-trail).
 *
 * ─── SCOPE ───────────────────────────────────────────────────────────────────
 * `src/**\/*.{ts,tsx,css}` — mismo scope que la guardia de color. Excluye
 * `primitives/typography.css`, `node_modules`, `.next`, y `scripts/lint/`.
 *
 * ─── USO ─────────────────────────────────────────────────────────────────────
 *   tsx scripts/lint/check-typography-tokens.ts
 *   ... --write-baseline   → regenera `.typographybaseline` desde los hits actuales
 *   ... --list             → imprime todos los hits (debug), exit 0
 *   ... --staged           → limita el scan a archivos staged (pre-commit)
 *
 * Exit: 0 = limpio · 1 = violación nueva (build roto) · 2 = error de uso.
 * =============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BASELINE_PATH = path.join(REPO_ROOT, '.typographybaseline');

const SCOPE_DIRS = ['src'];

// Fuente de verdad canon — único archivo donde font-size/font-weight crudo es legítimo.
const CANON_TYPOGRAPHY_FILES = new Set(['src/styles/tokens/primitives/typography.css']);

type PropName = 'font-size' | 'font-weight';
type HitClass = 'deferred-fix' | 'raster-literal' | 'html-email-literal';

interface Hit {
  relpath: string;
  line: number;
  ruleId: PropName;
  cls: HitClass;
  token: string;
  normLine: string;
}

// ─── Reglas de valor ─────────────────────────────────────────────────────────
// CSS kebab-case: `font-size: VALUE;` / `font-weight: VALUE;`
const CSS_PROP_RE = /(font-size|font-weight)\s*:\s*([^;]+);/gi;
// JS/TSX camelCase (inline style objects, Satori OG-image generation):
// `fontSize: VALUE,` / `fontWeight: VALUE}` etc.
const JS_PROP_RE = /(fontSize|fontWeight)\s*:\s*([^,}\n]+)[,}]/g;

function isCrudoFontSize(rawValue: string): boolean {
  const v = rawValue.trim().replace(/^['"]|['"]$/g, ''); // strip JS string quotes
  if (v.length === 0) return false;
  if (/var\(/.test(v)) return false; // consume un token en cualquier posición (incl. calc()/fallback)
  if (v === 'inherit') return false;
  if (/^-?\d+(\.\d+)?%$/.test(v)) return false; // porcentaje relativo
  if (/^-?\d+(\.\d+)?em$/.test(v)) return false; // em puro (NO rem — "rem" no matchea este patrón)
  // rem / px / unitless / clamp() / calc() sin var() → crudo
  return /^-?\d+(\.\d+)?(px|rem)?$/.test(v) || /^clamp\(/.test(v) || /^calc\(/.test(v);
}

function isCrudoFontWeight(rawValue: string): boolean {
  const v = rawValue.trim().replace(/^['"]|['"]$/g, '');
  if (v.length === 0) return false;
  if (/var\(/.test(v)) return false;
  return /^\d+$/.test(v); // solo numérico crudo — despacho lo pide explícito, keywords no
}

function classify(relpath: string): HitClass {
  // Satori/OG-image generation (next/og) solo acepta números literales — no
  // puede consumir CSS custom properties. Deuda estructural distinta a un
  // bypass evitable, mismo patrón que las "pieles" de terceros en color.
  if (/opengraph-image/.test(relpath)) return 'raster-literal';
  // HTML de email (Resend) — clientes de correo no soportan CSS custom
  // properties de forma confiable, el inline `style="..."` literal es el
  // patrón correcto de la industria para email. Misma naturaleza estructural.
  if (/lib\/actions\/newsletter\.ts$/.test(relpath)) return 'html-email-literal';
  return 'deferred-fix';
}

// ─── Utilidades de archivo (idénticas al molde de color) ──────────────────────
function isExcluded(relpath: string): boolean {
  if (!/\.(ts|tsx|css)$/.test(relpath)) return true;
  if (relpath.endsWith('.d.ts')) return true;
  if (/(^|\/)node_modules\//.test(relpath)) return true;
  if (/(^|\/)\.next\//.test(relpath)) return true;
  if (relpath.startsWith('scripts/lint/')) return true; // el propio gate
  if (CANON_TYPOGRAPHY_FILES.has(relpath)) return true; // fuente de verdad
  return false;
}

function walk(dirAbs: string, acc: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dirAbs, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      walk(full, acc);
    } else if (e.isFile()) {
      acc.push(full);
    }
  }
}

function collectFiles(stagedOnly: boolean): string[] {
  if (stagedOnly) {
    let out = '';
    try {
      out = execSync('git diff --cached --name-only --diff-filter=ACM', {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
    } catch {
      return [];
    }
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((rp) => SCOPE_DIRS.some((d) => rp.startsWith(d + '/') || rp === d))
      .filter((rp) => !isExcluded(rp))
      .map((rp) => path.join(REPO_ROOT, rp));
  }
  const acc: string[] = [];
  for (const d of SCOPE_DIRS) walk(path.join(REPO_ROOT, d), acc);
  return acc;
}

const ALLOW_RE = /(?:\/\/|\/\*)\s*TYPO-ALLOW:\s*(\S.*?)(?:\*\/)?\s*$/;

function normalize(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

// §0.4 — fix heredado del aprendizaje del color: quita TODO comentario de bloque
// `/* ... */` contenido en la línea (incluido trailing) ANTES de buscar
// font-size/font-weight, para no capturar valores mencionados en documentación.
function stripInlineBlockComments(line: string): string {
  return line.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function matchProps(codeLine: string): Array<{ prop: PropName; value: string }> {
  const out: Array<{ prop: PropName; value: string }> = [];

  CSS_PROP_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CSS_PROP_RE.exec(codeLine)) !== null) {
    const prop = m[1].toLowerCase() as PropName;
    const value = m[2];
    const crudo = prop === 'font-size' ? isCrudoFontSize(value) : isCrudoFontWeight(value);
    if (crudo) out.push({ prop, value: value.trim() });
  }

  JS_PROP_RE.lastIndex = 0;
  while ((m = JS_PROP_RE.exec(codeLine)) !== null) {
    const camel = m[1];
    const prop: PropName = camel === 'fontSize' ? 'font-size' : 'font-weight';
    const value = m[2];
    const crudo = prop === 'font-size' ? isCrudoFontSize(value) : isCrudoFontWeight(value);
    if (crudo) out.push({ prop, value: value.trim() });
  }

  return out;
}

function scanFile(fileAbs: string, hits: Hit[]): void {
  const relpath = path.relative(REPO_ROOT, fileAbs).split(path.sep).join('/');
  if (isExcluded(relpath)) return;
  let content: string;
  try {
    content = fs.readFileSync(fileAbs, 'utf8');
  } catch {
    return;
  }
  const lines = content.split('\n');
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    if (/^\/\*/.test(trimmed) && !trimmed.includes('*/')) {
      inBlockComment = true;
      continue;
    }
    // Línea de comentario puro — documentación, no código real.
    if (/^(\/\/|\*|\/\*)/.test(trimmed)) continue;

    const allow = ALLOW_RE.exec(raw);
    if (allow && allow[1] && allow[1].trim().length > 0) continue; // escape hatch con razón

    // Strip trailing `//` (JS/TS, requiere espacio antes — preserva `https://`)
    // y CUALQUIER `/* ... */` en la línea (§0.4, incluido trailing) ANTES de
    // buscar font-size/font-weight — no capturar valores documentales.
    const codeLine = stripInlineBlockComments(raw).replace(/\s\/\/.*$/, '');
    const normLine = normalize(codeLine);

    for (const { prop, value } of matchProps(codeLine)) {
      hits.push({
        relpath,
        line: i + 1,
        ruleId: prop,
        cls: classify(relpath),
        token: value,
        normLine,
      });
    }
  }
}

// fingerprint estable (sin nº de línea → sobrevive a movimientos de código)
function fingerprint(h: {
  relpath: string;
  ruleId: string;
  token: string;
  normLine: string;
}): string {
  return [h.relpath, h.ruleId, h.token, h.normLine].join('\t');
}

function readBaseline(): Set<string> {
  const set = new Set<string>();
  if (!fs.existsSync(BASELINE_PATH)) return set;
  const content = fs.readFileSync(BASELINE_PATH, 'utf8');
  for (const line of content.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const cols = line.split('\t');
    if (cols.length < 5) continue;
    // cols = [class, relpath, ruleId, token, normLine]
    set.add([cols[1], cols[2], cols[3], cols.slice(4).join('\t')].join('\t'));
  }
  return set;
}

function writeBaseline(hits: Hit[]): void {
  const seen = new Set<string>();
  const rows: string[] = [];
  const sorted = [...hits].sort((a, b) =>
    a.relpath === b.relpath ? a.line - b.line : a.relpath < b.relpath ? -1 : 1,
  );
  for (const h of sorted) {
    const fp = fingerprint(h);
    if (seen.has(fp)) continue;
    seen.add(fp);
    rows.push([h.cls, h.relpath, h.ruleId, h.token, h.normLine].join('\t'));
  }
  const header = [
    '# .typographybaseline — GUARDIA DE TIPOGRAFÍA (D-TYPO-RATIO-FIX). Generado por',
    '# scripts/lint/check-typography-tokens.ts --write-baseline',
    '# Cada línea = un font-size/font-weight crudo CONOCIDO hoy (día-1 verde). Una',
    '# regresión NUEVA no listada aquí rompe el build. Una migración futura QUEMA',
    '# (elimina) su línea.',
    '#',
    '# class:',
    '#   raster-literal    → generación de imágenes OG (Satori/next/og) que solo',
    '#                       acepta números literales, no CSS custom properties —',
    '#                       deuda estructural, no bypass evitable.',
    '#   html-email-literal → HTML de email (Resend) — clientes de correo no',
    '#                       soportan CSS custom properties de forma confiable —',
    '#                       deuda estructural, no bypass evitable.',
    '#   deferred-fix      → hardcode a migrar a un token --bbf-text-*/--bbf-weight-*',
    '#                       en un EXEC por-directorio futuro (contract, no este turno).',
    '#',
    '# Formato TSV: class <TAB> relpath <TAB> ruleId <TAB> token <TAB> normLine',
    '',
  ].join('\n');
  fs.writeFileSync(BASELINE_PATH, header + rows.join('\n') + '\n', 'utf8');
}

// ─── Main ──────────────────────────────────────────────────────────────────────
function main(): number {
  const args = process.argv.slice(2);
  const doWrite = args.includes('--write-baseline');
  const doList = args.includes('--list');
  const stagedOnly = args.includes('--staged');

  const files = collectFiles(stagedOnly);

  const hits: Hit[] = [];
  for (const f of files) scanFile(f, hits);

  if (doWrite) {
    writeBaseline(hits);
    console.log(
      `[typo-gate] .typographybaseline regenerado: ${new Set(hits.map(fingerprint)).size} sitios.`,
    );
    return 0;
  }

  if (doList) {
    for (const h of hits) {
      console.log(`${h.relpath}:${h.line}\t[${h.ruleId}/${h.cls}]\t${h.token}`);
    }
    console.log(
      `[typo-gate] total hits: ${hits.length} (fingerprints únicos: ${new Set(hits.map(fingerprint)).size})`,
    );
    return 0;
  }

  const baseline = readBaseline();
  const fresh: Hit[] = [];
  const seenFresh = new Set<string>();
  for (const h of hits) {
    const fp = fingerprint(h);
    if (baseline.has(fp)) continue;
    if (seenFresh.has(fp)) continue;
    seenFresh.add(fp);
    fresh.push(h);
  }

  if (fresh.length === 0) {
    console.log(
      `[typo-gate] OK — sin font-size/font-weight nuevo fuera de primitives/typography.css (${hits.length} sitios conocidos en baseline).`,
    );
    return 0;
  }

  console.error('');
  console.error(
    `[typo-gate] S-4: ${fresh.length} font-size/font-weight NUEVO(s) fuera de primitives/typography.css — build roto.`,
  );
  console.error('  Todo tamaño/peso literal vive en primitives/typography.css.');
  console.error(
    '  El resto del sistema consume var(--bbf-text-*) / var(--bbf-weight-*) — nunca un número a mano:',
  );
  console.error('');
  for (const h of fresh) {
    console.error(`  ✗ ${h.relpath}:${h.line}  [${h.ruleId}]  «${h.token}»`);
    console.error(`      ${h.normLine}`);
  }
  console.error('');
  console.error(
    '  Arréglalo (usar un token existente, o agregar el tamaño/peso al canon si falta), o si es legítimo:',
  );
  console.error(
    '    · añade  // TYPO-ALLOW: <razón>  (TS/TSX) o  /* TYPO-ALLOW: <razón> */  (CSS), o',
  );
  console.error('    · si es un sitio pre-existente conocido, regenera el baseline con intención:');
  console.error('        pnpm lint:typo:baseline');
  console.error('');
  return 1;
}

process.exit(main());
