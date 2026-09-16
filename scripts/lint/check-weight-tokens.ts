#!/usr/bin/env tsx
/**
 * check-weight-tokens.ts — GUARDIA TIPOGRÁFICA PROPIA DEL REPO: pesos por familia (fase 5) + escala de tamaño contra el suelo
 * (fase 6a-bis, D-BBW-17/D-BBW-18). Complementa la copia por contrato check-typography-tokens.ts, que bloquea `font-size`/
 * `font-weight` crudos fuera de primitivos y NO se modifica (CONTRATO-04): por eso la extensión vive aquí y no allí.
 *
 * Por qué existe: (pesos) las dos familias tienen ejes `wght` incompatibles (display 25–500, text 300–700); un peso fuera del rango
 * de su familia NO falla: el navegador lo recorta en silencio. (tamaños) Un paso de la escala o un rol por debajo del suelo de
 * legibilidad tampoco falla: se renderiza ilegible. Esta guardia hace detectables las dos cosas.
 *
 * Qué comprueba (exit 1 si falla, exit 2 si el tool rompe — fail-closed en .githooks/pre-commit):
 *   R1 · Todo token `--bbf-weight-*` declarado bajo src/styles/tokens/ pertenece a una familia con rango declarado
 *        (`--bbf-weight-<familia>-range-min/max` en primitives/typography.css). Un peso "global", sin familia, es error.
 *   R2 · Todo valor numérico de `--bbf-weight-<familia>-*` cae dentro del rango de su familia (los `calc()`/`var()` se
 *        aceptan: derivan de valores ya comprobados).
 *   R3 · El descriptor `weight: "<min> <max>"` de src/styles/fonts/text.ts coincide con el rango de la familia text
 *        (mismo dato en dos capas: el token es la fuente; el descriptor debe seguirlo).
 *   R4 · Ningún `wght` numérico crudo (font-variation-settings / fontVariationSettings) fuera de primitives/typography.css.
 *        Escape por línea: `// WEIGHT-ALLOW: <razón>` o `/* WEIGHT-ALLOW: <razón> *\/`.
 *   R5 · SUELO (D-BBW-18): la madre `--bbf-text-floor` existe en primitives/typography.css y todo par `--bbf-size-<x>-min/-max`
 *        declarado allí (pasos derivados por fórmula y madres de excepción) resuelve, evaluando sus calc()/pow()/var() con los
 *        valores madre, a un número ≥ suelo en ambos polos. Un paso declarado por debajo del suelo es error aunque nadie lo use:
 *        declararlo invita a usarlo.
 *   R6 · CONSUMO DE LA ESCALA (D-BBW-17): todo `--bbf-type-<rol>-size` bajo src/styles/tokens/ vale exactamente `var(--bbf-size-<x>)`
 *        con `<x>` declarado en el canon (paso o excepción), y ese `<x>` respeta el suelo (R5). Un tamaño escrito a mano en un rol,
 *        o un rol apuntando a un token que no existe, es error.
 * Uso: `pnpm lint:weight` · `pnpm guard` · pre-commit.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CANON_FILE = 'src/styles/tokens/primitives/typography.css';
const TOKENS_DIR = 'src/styles/tokens';
const TEXT_FONT_FILE = 'src/styles/fonts/text.ts';
const SCOPE_DIRS = ['src'];

type Range = { min: number; max: number };
type Problem = { rule: string; where: string; detail: string };

const problems: Problem[] = [];

function rel(abs: string): string {
  return path.relative(REPO_ROOT, abs).split(path.sep).join('/');
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

// ── R1–R2: rangos y pertenencia a familia ────────────────────────────────────────────────────────
const canonAbs = path.join(REPO_ROOT, CANON_FILE);
if (!fs.existsSync(canonAbs)) {
  console.error(`[weight-gate] FAIL-CLOSED: falta ${CANON_FILE}`);
  process.exit(2);
}
const canon = fs.readFileSync(canonAbs, 'utf8');
const ranges = new Map<string, Range>();
const RANGE_RE = /--bbf-weight-([a-z0-9]+)-range-(min|max)\s*:\s*(\d+)\s*;/g;
let m: RegExpExecArray | null;
while ((m = RANGE_RE.exec(canon)) !== null) {
  const fam = m[1];
  const r = ranges.get(fam) ?? { min: NaN, max: NaN };
  if (m[2] === 'min') r.min = Number(m[3]);
  else r.max = Number(m[3]);
  ranges.set(fam, r);
}
for (const [fam, r] of ranges) {
  if (Number.isNaN(r.min) || Number.isNaN(r.max) || r.min > r.max) {
    problems.push({ rule: 'R1', where: CANON_FILE, detail: `familia "${fam}": rango incompleto o invertido (${r.min}–${r.max})` });
  }
}
if (ranges.size === 0) {
  problems.push({ rule: 'R1', where: CANON_FILE, detail: 'ninguna familia declara --bbf-weight-<familia>-range-min/max' });
}

const tokenFiles: string[] = [];
walk(path.join(REPO_ROOT, TOKENS_DIR), tokenFiles);
const DECL_RE = /--bbf-weight-([a-z0-9-]+)\s*:\s*([^;]+);/g;
for (const abs of tokenFiles.filter((f) => f.endsWith('.css'))) {
  const src = fs.readFileSync(abs, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    DECL_RE.lastIndex = 0;
    let d: RegExpExecArray | null;
    while ((d = DECL_RE.exec(line)) !== null) {
      const name = d[1];
      const value = d[2].trim();
      const fam = [...ranges.keys()].find((f) => name === f || name.startsWith(f + '-'));
      if (!fam) {
        problems.push({ rule: 'R1', where: `${rel(abs)}:${i + 1}`, detail: `--bbf-weight-${name}: peso SIN familia (familias con rango: ${[...ranges.keys()].join(', ') || 'ninguna'})` });
        continue;
      }
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        const v = Number(value);
        const r = ranges.get(fam)!;
        if (v < r.min || v > r.max) {
          problems.push({ rule: 'R2', where: `${rel(abs)}:${i + 1}`, detail: `--bbf-weight-${name}: ${v} fuera del rango de "${fam}" (${r.min}–${r.max}); el navegador lo recortaría en silencio` });
        }
      }
    }
  });
}

// ── R3: descriptor de next/font/local coherente con el rango de la familia text ─────────────────
const textAbs = path.join(REPO_ROOT, TEXT_FONT_FILE);
if (fs.existsSync(textAbs) && ranges.has('text')) {
  const src = fs.readFileSync(textAbs, 'utf8');
  const w = /weight\s*:\s*["'](\d+)\s+(\d+)["']/.exec(src);
  const r = ranges.get('text')!;
  if (!w) {
    problems.push({ rule: 'R3', where: TEXT_FONT_FILE, detail: 'no se encontró el descriptor weight: "<min> <max>"' });
  } else if (Number(w[1]) !== r.min || Number(w[2]) !== r.max) {
    problems.push({ rule: 'R3', where: TEXT_FONT_FILE, detail: `descriptor weight "${w[1]} ${w[2]}" ≠ rango del token text (${r.min}–${r.max})` });
  }
}

// ── R4: ningún wght numérico crudo fuera del canon ───────────────────────────────────────────────
const ALLOW_RE = /(?:\/\/|\/\*)\s*WEIGHT-ALLOW:\s*(\S.*?)(?:\*\/)?\s*$/;
const WGHT_RE = /(["']wght["']\s*-?\d|font-variation-settings\s*:\s*[^;]*\d|fontVariationSettings\s*:\s*[^,}\n]*\d)/;
const scanFiles: string[] = [];
for (const d of SCOPE_DIRS) walk(path.join(REPO_ROOT, d), scanFiles);
for (const abs of scanFiles) {
  const rp = rel(abs);
  if (!/\.(ts|tsx|css)$/.test(rp) || rp.endsWith('.d.ts') || rp === CANON_FILE) continue;
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  let inBlock = false;
  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (inBlock) {
      if (t.includes('*/')) inBlock = false;
      return;
    }
    if (/^\/\*/.test(t) && !t.includes('*/')) {
      inBlock = true;
      return;
    }
    if (/^(\/\/|\*|\/\*)/.test(t)) return;
    const allow = ALLOW_RE.exec(raw);
    if (allow && allow[1] && allow[1].trim().length > 0) return;
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s\/\/.*$/, '');
    if (WGHT_RE.test(code) && !/var\(--bbf-/.test(code)) {
      problems.push({ rule: 'R4', where: `${rp}:${i + 1}`, detail: `wght numérico crudo: "${t}" — usar un token de peso de la familia` });
    }
  });
}

// ── R5–R6: escala de tamaño contra el suelo de legibilidad y consumo obligatorio de la escala ──────
// Evaluador mínimo de los valores unitless del canon: resuelve var(--bbf-*) con las madres numéricas del propio archivo,
// traduce pow(a, b) y evalúa una expresión aritmética cerrada (solo dígitos, punto, + - * / y paréntesis). Nada más se acepta.
const CANON_DECL_RE = /(--bbf-[a-z0-9-]+)\s*:\s*([^;]+);/g;
const canonDecls = new Map<string, string>();
for (const line of canon.split('\n')) {
  const code = line.replace(/\/\*[\s\S]*?\*\//g, ' ');
  CANON_DECL_RE.lastIndex = 0;
  let d: RegExpExecArray | null;
  while ((d = CANON_DECL_RE.exec(code)) !== null) canonDecls.set(d[1], d[2].trim());
}
function evalUnitless(name: string, depth = 0): number {
  if (depth > 20) return NaN;
  const raw = canonDecls.get(name);
  if (raw === undefined) return NaN;
  const expr = raw
    .replace(/var\((--bbf-[a-z0-9-]+)\)/g, (_m, ref: string) => String(evalUnitless(ref, depth + 1)))
    .replace(/calc\(/g, '(')
    .replace(/pow\(([^,()]+),([^()]+)\)/g, (_m, a: string, b: string) => `Math.pow(${a},${b})`);
  if (!/^[\d.\s+\-*/()NaMathpow,]+$/.test(expr)) return NaN;
  try {
    const v = Function(`"use strict"; return (${expr});`)() as unknown;
    return typeof v === 'number' ? v : NaN;
  } catch {
    return NaN;
  }
}
const floor = evalUnitless('--bbf-text-floor');
if (!Number.isFinite(floor)) {
  problems.push({ rule: 'R5', where: CANON_FILE, detail: 'falta la madre --bbf-text-floor (D-BBW-18) o no es numérica' });
}
const sizeIds = new Set<string>();
for (const name of canonDecls.keys()) {
  const mm = /^--bbf-size-([a-z0-9]+)-(min|max)$/.exec(name);
  if (mm) sizeIds.add(mm[1]);
}
const sizeOk = new Map<string, boolean>();
for (const id of [...sizeIds].sort()) {
  const mn = evalUnitless(`--bbf-size-${id}-min`);
  const mx = evalUnitless(`--bbf-size-${id}-max`);
  let ok = true;
  if (!Number.isFinite(mn) || !Number.isFinite(mx)) {
    problems.push({ rule: 'R5', where: CANON_FILE, detail: `--bbf-size-${id}-min/-max: no evaluable con las madres del canon (calc/pow/var de otra forma)` });
    ok = false;
  } else if (Number.isFinite(floor) && (mn < floor || mx < floor)) {
    problems.push({ rule: 'R5', where: CANON_FILE, detail: `--bbf-size-${id}: ${mn.toFixed(2)} → ${mx.toFixed(2)} px baja del suelo de ${floor} px (D-BBW-18) en ${mn < floor ? 'el polo pequeño' : 'el polo grande'}` });
    ok = false;
  }
  if (!canonDecls.has(`--bbf-size-${id}`)) {
    problems.push({ rule: 'R5', where: CANON_FILE, detail: `--bbf-size-${id}-min/-max declarados sin su clamp --bbf-size-${id}` });
    ok = false;
  }
  sizeOk.set(id, ok);
}
const ROLE_SIZE_RE = /--bbf-type-([a-z0-9-]+)-size\s*:\s*([^;]+);/g;
let rolesChecked = 0;
for (const abs of tokenFiles.filter((f) => f.endsWith('.css'))) {
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\*[\s\S]*?\*\//g, ' ');
    ROLE_SIZE_RE.lastIndex = 0;
    let d: RegExpExecArray | null;
    while ((d = ROLE_SIZE_RE.exec(code)) !== null) {
      rolesChecked++;
      const role = d[1];
      const value = d[2].trim();
      const ref = /^var\(--bbf-size-([a-z0-9]+)\)$/.exec(value);
      if (!ref) {
        problems.push({ rule: 'R6', where: `${rel(abs)}:${i + 1}`, detail: `--bbf-type-${role}-size: "${value}" no es var(--bbf-size-<paso|excepción>) — ningún tamaño escrito a mano fuera de la escala (D-BBW-17)` });
        continue;
      }
      if (!sizeIds.has(ref[1])) {
        problems.push({ rule: 'R6', where: `${rel(abs)}:${i + 1}`, detail: `--bbf-type-${role}-size apunta a --bbf-size-${ref[1]}, que no existe en ${CANON_FILE}` });
        continue;
      }
      if (sizeOk.get(ref[1]) === false) {
        problems.push({ rule: 'R6', where: `${rel(abs)}:${i + 1}`, detail: `--bbf-type-${role}-size consume --bbf-size-${ref[1]}, que baja del suelo (R5)` });
      }
    }
  });
}

// ── Salida ───────────────────────────────────────────────────────────────────────────────────────
const famSummary = [...ranges].map(([f, r]) => `${f} ${r.min}–${r.max}`).join(' · ');
if (problems.length === 0) {
  console.log(`[weight-gate] OK — ${ranges.size} familia(s) con rango (${famSummary}); ${tokenFiles.filter((f) => f.endsWith('.css')).length} ficheros de tokens y ${scanFiles.length} ficheros de src inspeccionados; 0 pesos sin familia, fuera de rango o crudos; escala: ${sizeIds.size} tamaño(s) del canon ≥ suelo ${floor} px en ambos polos, ${rolesChecked} rol(es) consumen la escala.`);
  process.exit(0);
}
console.error(`[weight-gate] ${problems.length} problema(s) de peso — build roto.`);
for (const p of problems) console.error(`  ${p.rule} ${p.where}: ${p.detail}`);
console.error('  Regla: todo peso lleva familia (--bbf-weight-<familia>-*), dentro de su rango declarado; ningún wght crudo fuera de primitives/typography.css.');
console.error('  Regla: ningún paso, excepción ni rol de tamaño baja de --bbf-text-floor (D-BBW-18); todo --bbf-type-<rol>-size consume var(--bbf-size-*) del canon (D-BBW-17).');
process.exit(1);
