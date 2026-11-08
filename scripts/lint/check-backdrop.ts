#!/usr/bin/env tsx
/**
 * check-backdrop.ts — GUARDIA R12 · VARIANTE DE COLOR DEL FONDO SIN TOCAR EL INICIO (R1, D-BBW-96; BEHAVIOR §4.1).
 *
 * La decisión de Zavala es que el inicio NO cambia. El fondo admite una variante por página (giro de tono del color visto), y esta guardia
 * vigila las dos mitades de esa promesa:
 *
 *   R12a · EL PROGRAMA DEL INICIO ES EL DE SIEMPRE. Las cuatro fuentes GLSL que compila una página sin variante (`GLSL_VERT`, `GLSL_BASE`,
 *          `GLSL_BLUR`, `GLSL_FINAL`) tienen la HUELLA fijada abajo (sha256 de las de `main` @ a8576bd, antes de R1). El programa girado es
 *          otro (`GLSL_FINAL_TURNED`) y debe contener `GLSL_FINAL` entero salvo los dos tramos del giro. Cambiar el fondo del inicio exige
 *          cambiar esta huella en el mismo commit, con su razón: no puede pasar sin querer. (Los píxeles: arnés `identidad` del hub, R1 §5.)
 *   R12b · LA PORTADA NO DECLARA VARIANTE. Ninguna página de tipo `home` lleva `backdrop` en el registro.
 *   R12c · CADA VARIANTE ESTÁ COMPLETA Y NINGUNA SOBRA. Para cada nombre de `src/config/backdrops.ts`: su madre derivada
 *          `--bbf-color-backdrop-turn-<v>` en `primitives/colors.css` (por fórmula: un `calc()` sobre tonos primitivos, ningún número) y su
 *          selector `[data-backdrop="<v>"]` en `semantic/colors.css` que fija el rol `--bbf-backdrop-hue-turn` a esa madre. Una madre o un
 *          selector sin nombre declarado es un huérfano.
 *   R12d · (con `--served [dir]`, al final de `pnpm build`) LO SERVIDO. La portada de cada locale no lleva `data-backdrop`; cada página con
 *          variante lleva `data-backdrop="<v>"` exactamente una vez; y una página con variante no lleva partículas (D-BBW-105, D6).
 *
 * Uso: `pnpm lint:backdrop` (en `pnpm guard`) · `pnpm lint:backdrop --served [out]` (al final de `pnpm build`).
 * Exit 0 = limpio. Exit 1 = hallazgos.
 */
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { GLSL_VERT, GLSL_BASE, GLSL_BLUR, GLSL_FINAL, GLSL_FINAL_TURNED } from '../../src/behavior/backdrop-shader';
import { BACKDROP_VARIANTS } from '../../src/config/backdrops';
import { PAGES, pageRoute, type PageEntry } from '../../src/config/pages';
import { site } from '../../src/config/site';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** sha256 de las fuentes GLSL del inicio en `main` @ a8576bd (antes de R1). Se cambian solo si el fondo del INICIO cambia, con su razón. */
const HOME_PROGRAM = {
  GLSL_VERT: '44915aa2289b461af9d8b249f5a29fbcbf9477a6470bef7beb7bd2ca35b2999d',
  GLSL_BASE: 'adc201968f70d639b3f99d1c04da677d1fb34a7539cdb0b3b7037ebcfa13a74d',
  GLSL_BLUR: '07ae27d636334c1f55815d24b3330c62342c279de4799db28a81d35870fa1328',
  GLSL_FINAL: '5528141eb75ba54845faf59a486b5547239bc9350e7a212bcef58f951189163d',
} as const;

const ROLE = '--bbf-backdrop-hue-turn';
const MOTHER = (v: string) => `--bbf-color-backdrop-turn-${v}`;
const PARTICLES_MARK = 'data-component="bbf-hero-particles"';

const findings: string[] = [];
const fail = (rule: string, where: string, msg: string) => findings.push(`  ${rule}  ${where}: ${msg}`);
let inspected = 0;

// ── R12a ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const sources = { GLSL_VERT, GLSL_BASE, GLSL_BLUR, GLSL_FINAL } as const;
for (const [name, want] of Object.entries(HOME_PROGRAM)) {
  inspected++;
  const got = sha(sources[name as keyof typeof sources]);
  if (got !== want) fail('R12a', `src/behavior/backdrop-shader.ts ${name}`, `la huella del programa del INICIO cambió (${got.slice(0, 12)}… ≠ ${want.slice(0, 12)}…): el inicio no cambia (D-BBW-96)`);
}
inspected++;
{
  const finalLines = GLSL_FINAL.split('\n');
  const turnedLines = GLSL_FINAL_TURNED.split('\n');
  const kept = turnedLines.filter((l) => finalLines.includes(l)).length;
  const missing = finalLines.filter((l) => !turnedLines.includes(l));
  if (missing.length > 0 || kept < finalLines.length || !GLSL_FINAL_TURNED.includes('uniform float uHue;') || !GLSL_FINAL_TURNED.includes('hueRotate(col, uHue)'))
    fail('R12a', 'src/behavior/backdrop-shader.ts GLSL_FINAL_TURNED', 'el programa girado no es GLSL_FINAL entero más el giro (uniforme `uHue` y `hueRotate` en la salida)');
}

// ── R12b ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const pages = PAGES as readonly PageEntry[];
for (const p of pages) {
  inspected++;
  if (p.type === 'home' && p.backdrop !== undefined) fail('R12b', `src/config/pages.ts (${p.id})`, `la portada declara la variante "${p.backdrop}": el fondo del inicio no cambia (D-BBW-96)`);
  if (p.backdrop !== undefined && !(BACKDROP_VARIANTS as readonly string[]).includes(p.backdrop)) fail('R12b', `src/config/pages.ts (${p.id})`, `variante "${p.backdrop}" no declarada en src/config/backdrops.ts`);
}

// ── R12c ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const PRIM = 'src/styles/tokens/primitives/colors.css';
const SEM = 'src/styles/tokens/semantic/colors.css';
const prim = fs.readFileSync(path.join(REPO_ROOT, PRIM), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const sem = fs.readFileSync(path.join(REPO_ROOT, SEM), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
for (const v of BACKDROP_VARIANTS) {
  inspected++;
  const m = prim.match(new RegExp(`${MOTHER(v)}\\s*:\\s*([^;]+);`));
  if (!m) fail('R12c', PRIM, `falta la madre ${MOTHER(v)} de la variante "${v}"`);
  else {
    const value = m[1].trim();
    // lo que queda al quitar los tonos primitivos, `calc(`, paréntesis, operadores y factores enteros de una cifra (2·Δ): nada
    const rest = value.replace(/var\(--bbf-color-[a-z]+-h\)/g, '').replace(/calc\(|[()\s*+\-/]/g, ' ').trim().split(/\s+/).filter((t) => t && !/^[1-9]$/.test(t));
    if (!/^calc\(/.test(value) || !/var\(--bbf-color-[a-z]+-h\)/.test(value) || rest.length > 0)
      fail('R12c', PRIM, `${MOTHER(v)} no es una fórmula sobre tonos primitivos (\`calc()\` de \`--bbf-color-<familia>-h\`): «${value}»; si no cae en una fórmula, DESIGN_EXCEPTIONS`);
  }
  const sel = sem.match(new RegExp(`\\[data-backdrop="${v}"\\]\\s*\\{([^}]*)\\}`));
  if (!sel || !new RegExp(`${ROLE}\\s*:\\s*var\\(${MOTHER(v)}\\)\\s*;`).test(sel[1]))
    fail('R12c', SEM, `falta el selector [data-backdrop="${v}"] que fija ${ROLE} a var(${MOTHER(v)})`);
}
for (const m of prim.matchAll(/--bbf-color-backdrop-turn-([a-z0-9-]+)\s*:/g))
  if (!(BACKDROP_VARIANTS as readonly string[]).includes(m[1])) fail('R12c', PRIM, `madre huérfana ${MOTHER(m[1])}: ninguna variante declarada la usa`);
for (const m of sem.matchAll(/\[data-backdrop="([^"]+)"\]/g))
  if (!(BACKDROP_VARIANTS as readonly string[]).includes(m[1])) fail('R12c', SEM, `selector huérfano [data-backdrop="${m[1]}"]: variante no declarada`);
if (!/@property\s+--bbf-backdrop-hue-turn\s*\{[^}]*syntax:\s*"<number>"[^}]*initial-value:\s*0\s*;/.test(sem))
  fail('R12c', SEM, `${ROLE} debe estar registrado como <number> con valor inicial 0 (el inicio)`);

// ── R12d (lo servido) ───────────────────────────────────────────────────────────────────────────────────────────────
const argServed = process.argv.indexOf('--served');
if (argServed > 0) {
  const next = process.argv[argServed + 1];
  const OUT = next && !next.startsWith('--') ? path.resolve(next) : path.join(REPO_ROOT, 'out');
  for (const locale of site.publishedLocales) {
    for (const p of PAGES as readonly (PageEntry & { id: (typeof PAGES)[number]['id'] })[]) {
      const route = pageRoute(locale, p.id);
      const file = path.join(OUT, route, 'index.html');
      const rel = `out${route}index.html`;
      if (!fs.existsSync(file)) { fail('R12d', rel, 'no está servido (¿build incompleto?)'); continue; }
      inspected++;
      const html = fs.readFileSync(file, 'utf8');
      const marks = [...html.matchAll(/data-backdrop="([^"]*)"/g)].map((m) => m[1]);
      if (p.backdrop === undefined) {
        if (marks.length > 0) fail('R12d', rel, `lleva data-backdrop="${marks.join(',')}" y su fila no declara variante${p.type === 'home' ? ' (el inicio no cambia)' : ''}`);
      } else {
        if (marks.length !== 1 || marks[0] !== p.backdrop) fail('R12d', rel, `debe llevar data-backdrop="${p.backdrop}" exactamente una vez (lleva: ${marks.length ? marks.join(',') : 'ninguno'})`);
        if (html.includes(PARTICLES_MARK)) fail('R12d', rel, 'una página con variante de fondo no lleva partículas (D-BBW-105, D6)');
      }
    }
  }
}

if (findings.length === 0) {
  console.log(`[backdrop] OK — R12${argServed > 0 ? 'a–d' : 'a–c'}: ${inspected} comprobaciones, 0 hallazgos (variantes: ${BACKDROP_VARIANTS.join(', ')}).`);
  process.exit(0);
}
console.error(`[backdrop] ${findings.length} hallazgo(s) en ${inspected} comprobaciones (R12, D-BBW-96):`);
for (const f of findings) console.error(f);
process.exit(1);
