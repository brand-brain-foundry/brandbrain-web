#!/usr/bin/env tsx
// COPIA POR CONTRATO (D-BBW-06) — origen bbf-web:scripts/lint/check-color-tokens.ts @ e453303 (origin/main 2026-09-15).
// Registro: bbf-command-hub:shared/CONTRATOS_ENTRE_REPOS.md → CONTRATO-04. Se actualiza solo re-pinneando.
/**
 * =============================================================================
 * check-color-tokens.ts — GUARDIA DETERMINISTA de color (D-COLOR-SPACE, forma B)
 * =============================================================================
 * DECISIÓN: D-COLOR-SPACE (FIRMADA 2026-08-09, forma B) + D-DS-AXIOMA-AGNOSTICO.
 * Molde: `check-i3-agnostic.ts` (sivar-brains, D-I3-GATE) — misma estructura,
 * otro dominio (color en vez de agnosticismo de tenant). NO es copia literal.
 *
 * ─── QUÉ HACE ────────────────────────────────────────────────────────────────
 * Rompe el build (exit≠0) si aparece un HEX crudo (`#rrggbb`/`#rgb`/etc.) FUERA
 * de `primitives/colors.css` / `primitives/colors-dark.css` / `primitives/colors-warm.css`
 * — las ÚNICAS fuentes de verdad permitidas para color literal. Corre en
 * `.githooks/pre-commit` (junto a gitleaks, mismo molde fail-closed) y vía
 * `pnpm lint:color` (entrypoint CI-ready).
 *
 * BASELINE ADITIVO (`.colorbaseline`): los HEX conocidos hoy (rampas legacy en
 * `colors.css` marcadas @deprecated, las 5 "pieles" de terceros WhatsApp/Google,
 * hardcodes varios) están baselined → el árbol actual queda VERDE el día 1.
 * Toda regresión NUEVA (un HEX que no está en el baseline) → build roto.
 * Cada corrección futura (migrar un consumidor a un token `-oklch` o semantic)
 * QUEMA su línea del baseline.
 *
 * ─── DERIVACIÓN (no hardcode) ────────────────────────────────────────────────
 * El propio archivo canon (`primitives/colors.css` + hermanos `colors-dark.css`/
 * `colors-warm.css`) está EXENTO por convención de nombre de archivo
 * (`colors*.css` dentro de `primitives/`) — no una ruta hardcodeada por token
 * individual. Un color canon nuevo en esos archivos nunca dispara el gate.
 *
 * ─── ESCAPE HATCH ────────────────────────────────────────────────────────────
 * `// COLOR-ALLOW: <razón>` (TS/TSX) o `/* COLOR-ALLOW: <razón> *\/` (CSS) en la
 * línea suprime todo hit de esa línea (razón OBLIGATORIA, audit-trail). Casos
 * legítimos: SVG data-URI, `#fff` de máscara de gradiente, etc.
 *
 * ─── SCOPE ───────────────────────────────────────────────────────────────────
 * `src/**\/*.{ts,tsx,css}` — cubre componentes, Payload globals/migrations/scripts
 * y todo `src/styles/` (semantic + components + utilities). Excluye
 * `primitives/colors*.css`, `node_modules`, `.next`, y este propio directorio
 * `scripts/lint/` (el gate no se audita a sí mismo).
 *
 * ─── USO ─────────────────────────────────────────────────────────────────────
 *   tsx scripts/lint/check-color-tokens.ts
 *   ... --write-baseline   → regenera `.colorbaseline` desde los hits actuales
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
const BASELINE_PATH = path.join(REPO_ROOT, '.colorbaseline');

const SCOPE_DIRS = ['src'];

// Fuente de verdad canon — únicos archivos donde HEX crudo es legítimo.
const CANON_COLOR_FILES = new Set([
  'src/styles/tokens/primitives/colors.css',
  'src/styles/tokens/primitives/colors-dark.css',
  'src/styles/tokens/primitives/colors-warm.css',
]);

type HitClass = 'deferred-fix' | 'third-party' | 'legacy-ramp';

interface Hit {
  relpath: string;
  line: number;
  ruleId: string;
  cls: HitClass;
  token: string;
  normLine: string;
}

// ─── Regla ───────────────────────────────────────────────────────────────────
// HEX crudo: #rgb / #rgba / #rrggbb / #rrggbbaa. Ancla longitud exacta
// (lookahead negativo) para no capturar sub-strings de tokens más largos
// (p.ej. `#13884` un número de issue, o `#abcdef01` truncado a 6).
const HEX_RE =
  /#(?:[0-9a-fA-F]{8}(?![0-9a-fA-F])|[0-9a-fA-F]{6}(?![0-9a-fA-F])|[0-9a-fA-F]{4}(?![0-9a-fA-F])|[0-9a-fA-F]{3}(?![0-9a-fA-F]))/g;

function classify(relpath: string): HitClass {
  if (/capabilities-(wa|wa-agenda|app-screen|app-integraciones|aprendizaje)\.css$/.test(relpath)) {
    return 'third-party'; // D-COLOR-TERCEROS — las 5 "pieles" (D-INT-01/D-PANTALLA-01/D-WAG-01/D-WA-04/D-APR-01)
  }
  return 'deferred-fix';
}

function matchHex(line: string): string[] {
  const out: string[] = [];
  HEX_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HEX_RE.exec(line)) !== null) out.push(m[0]);
  return out;
}

// ─── Utilidades de archivo ─────────────────────────────────────────────────────
function isExcluded(relpath: string): boolean {
  if (!/\.(ts|tsx|css)$/.test(relpath)) return true;
  if (relpath.endsWith('.d.ts')) return true;
  if (/(^|\/)node_modules\//.test(relpath)) return true;
  if (/(^|\/)\.next\//.test(relpath)) return true;
  if (relpath.startsWith('scripts/lint/')) return true; // el propio gate
  if (CANON_COLOR_FILES.has(relpath)) return true; // fuente de verdad
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

const ALLOW_RE = /(?:\/\/|\/\*)\s*COLOR-ALLOW:\s*(\S.*?)(?:\*\/)?\s*$/;

function normalize(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
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
    // Línea de comentario puro (//, *, /* … */ en una línea) — documentación,
    // no un HEX en código real.
    if (/^(\/\/|\*|\/\*)/.test(trimmed)) continue;

    const allow = ALLOW_RE.exec(raw);
    if (allow && allow[1] && allow[1].trim().length > 0) continue; // escape hatch con razón

    // Strip del comentario trailing ` // …` (requiere espacio antes de `//` —
    // preserva `https://`).
    const codeLine = raw.replace(/\s\/\/.*$/, '');
    const normLine = normalize(codeLine);
    const tokens = matchHex(codeLine);
    for (const token of tokens) {
      hits.push({
        relpath,
        line: i + 1,
        ruleId: 'raw-hex',
        cls: classify(relpath),
        token,
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
    '# .colorbaseline — GUARDIA DE COLOR (D-COLOR-SPACE forma B). Generado por',
    '# scripts/lint/check-color-tokens.ts --write-baseline',
    '# Cada línea = un HEX crudo CONOCIDO hoy (día-1 verde). Una regresión NUEVA',
    '# no listada aquí rompe el build. Una migración futura QUEMA (elimina) su línea.',
    '#',
    '# class:',
    '#   third-party  → colores de terceros en las 5 "pieles" (D-COLOR-TERCEROS) —',
    '#                  deuda TRANSITORIA, se elimina cuando la familia llegue a 0.',
    '#   deferred-fix → hardcode de marca a migrar a un token semantic/-oklch',
    '#                  en un EXEC por-directorio futuro (contract, no este turno).',
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
      `[color-gate] .colorbaseline regenerado: ${new Set(hits.map(fingerprint)).size} sitios.`,
    );
    return 0;
  }

  if (doList) {
    for (const h of hits) {
      console.log(`${h.relpath}:${h.line}\t[${h.ruleId}/${h.cls}]\t${h.token}`);
    }
    console.log(
      `[color-gate] total hits: ${hits.length} (fingerprints únicos: ${new Set(hits.map(fingerprint)).size})`,
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
      `[color-gate] OK — sin HEX nuevo fuera de primitives/colors*.css (${hits.length} sitios conocidos en baseline).`,
    );
    return 0;
  }

  console.error('');
  console.error(
    `[color-gate] S-4: ${fresh.length} HEX NUEVO(s) fuera de primitives/colors*.css — build roto.`,
  );
  console.error(
    '  Todo color literal vive en primitives/colors.css (o colors-dark.css/colors-warm.css).',
  );
  console.error(
    '  El resto del sistema consume var(--bbf-color-*) / var(--bbf-color-*-oklch) — nunca HEX a mano:',
  );
  console.error('');
  for (const h of fresh) {
    console.error(`  ✗ ${h.relpath}:${h.line}  [${h.ruleId}]  «${h.token}»`);
    console.error(`      ${h.normLine}`);
  }
  console.error('');
  console.error(
    '  Arréglalo (usar un token existente, o agregar el color al canon si falta), o si es legítimo:',
  );
  console.error(
    '    · añade  // COLOR-ALLOW: <razón>  (TS/TSX) o  /* COLOR-ALLOW: <razón> */  (CSS), o',
  );
  console.error('    · si es un sitio pre-existente conocido, regenera el baseline con intención:');
  console.error('        pnpm lint:color:baseline');
  console.error('');
  return 1;
}

process.exit(main());
