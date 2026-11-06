/**
 * check-glyph-scatter.ts — GUARDIA R11 · IDENTIDAD DE S11 CON EL PROTOTIPO APROBADO (M2 F4, P-BBW-83; docs/system/BEHAVIOR.md §14).
 * `scripts/lint/fixtures/glyph-scatter-golden.{json,bin}` guarda lo que escribió el prototipo aprobado en Chrome real (3 semillas × 200
 * fotogramas, `Math.random` = mulberry32(semilla), activación por `pointerenter`, dt = 1/60) para el enlace «los casos» y los dos botones:
 * por glifo y fotograma x, y (em), giro (°) y profundidad (float32 del prototipo), y la p de la piel. La cabecera lleva el sha256 del prototipo
 * de origen y la única sustitución con que se generó (exponer el estado para leerlo). Aquí el módulo del repo sortea los mismos glifos en el
 * mismo orden (los seis elementos del prototipo, en orden de documento, y después el origen de la piel), integra los mismos fotogramas y falla
 * si cualquier valor difiere > 0,001 em (x, y), > 0,1° (giro), > 0,001 (profundidad, piel). Se ve fallar cambiando una sola constante del
 * movimiento (p. ej. `AMP_X`). Un umbral que falla se escala (I-8), no se cambia. En `pnpm guard` y en el pre-commit.
 *
 * R11b · INVENTARIO DE HOSTS EN EL CÓDIGO (2026-11-06, rebase de M2; REESCRITA en M3, P-BBW-84: el desarme es OPT-IN). Dos comprobaciones:
 *   (a) HOVER DE COLOR EN EL 100 %: todo `<a>`, `<Link>` y `<button>` nativo de `src/components/**` y `src/app/**` lleva `data-hover` (su tipo de
 *       piel), salvo los que EXEMPT exime por SELECTOR NOMBRADO con su motivo (BEHAVIOR §14). Una exención que no corresponde a exactamente UN host
 *       también falla: la lista no puede quedar muerta ni tapar dos.
 *   (b) DESARME SOLO DONDE SE DECLARA: `SCATTER_HOSTS` es el ÚNICO sitio que dice dónde se activa S11. Una etiqueta FIJA el desarme si escribe
 *       `data-scatter` (vacío) o la propiedad `scatter` (verdadera) tal cual; un átomo o molécula solo puede REENVIARLO (`={scatter …}`). La guardia
 *       falla si un fichero fuera de la lista fija el desarme, si a uno declarado le falta un host o le sobra, o si aparece una forma que no es
 *       ni fijar ni reenviar. Vista fallar añadiendo `data-scatter=""` a un enlace del pie y quitándolo a un botón del héroe; vista pasar al restaurar.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SCATTER, frameDt, makeGlyph, stepGlyph, stepSkin, type Glyph, type Skin } from '../../src/behavior/glyph-scatter';

const ROOT = path.resolve(import.meta.dirname, '../..');
const GOLDEN_JSON = process.env.BBW_SCATTER_GOLDEN ? path.resolve(process.env.BBW_SCATTER_GOLDEN) : path.join(ROOT, 'scripts/lint/fixtures/glyph-scatter-golden.json');
const TOL_EM = 0.001;
const TOL_DEG = 0.1;
const TOL_UNIT = 0.001;

type Golden = {
  source: string; sourceSha256: string; seeds: number[]; frames: number; dof: number;
  elements: { kind: 'link' | 'outline' | 'fill'; glyphs: number; inProse: boolean; text: string }[];
  runs: { seed: number; target: string; kind: string; element: number; glyphs: number; origin: number; offset: number; skinOffset: number }[];
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const golden: Golden = JSON.parse(fs.readFileSync(GOLDEN_JSON, 'utf8'));
const bin = fs.readFileSync(GOLDEN_JSON.replace(/\.json$/, '.bin'));
const values = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);

console.log(`[R11] prototipo ${golden.source} (sha256 ${golden.sourceSha256.slice(0, 12)}…) · ${golden.seeds.length} semillas × ${golden.frames} fotogramas · enlace y dos botones · ${golden.elements.length} elementos sorteados en orden de documento`);

let errors = 0;
const worst = { em: 0, deg: 0, depth: 0, skin: 0, where: '' };
let compared = 0;

for (const run of golden.runs) {
  const random = mulberry32(run.seed);
  // 1) el prototipo prepara los seis elementos en orden de documento: mismos sorteos, mismo orden
  const all: Glyph[][] = golden.elements.map((el) => {
    const reach = el.kind === 'link' ? SCATTER.REACH_LINK : SCATTER.REACH_BUTTON;
    return Array.from({ length: el.glyphs }, () => makeGlyph(random, reach, el.inProse));
  });
  // 2) activación: el origen de la piel es el siguiente azar
  const origin = random();
  if (Math.abs(origin - run.origin) > 1e-9) {
    console.error(`  FALLO R11: semilla ${run.seed} ${run.target}: el orden de sorteo difiere (origen ${origin} vs ${run.origin} del prototipo)`);
    errors++;
    continue;
  }
  const glyphs = all[run.element];
  const kind = golden.elements[run.element].kind;
  const skin: Skin | null = kind === 'link' ? null : { p: 0, v: 0, origin, outline: kind === 'outline', perim: 0, w: 0, h: 0 };
  // 3) fotogramas: since = 0, last = 0, ts = (f+1)·1000/60
  let last = 0;
  let bad = 0;
  for (let f = 0; f < golden.frames; f++) {
    const ts = (f + 1) * 1000 / 60;
    const dt = frameDt(ts, last);
    last = ts;
    const held = ts / 1000;
    glyphs.forEach((G, gi) => {
      stepGlyph(G, dt, held > G.delay);
      const base = run.offset + (f * glyphs.length + gi) * golden.dof;
      for (let d = 0; d < golden.dof; d++) {
        const got = G.x[d];
        const exp = values[base + d];
        const diff = Math.abs(got - exp);
        const tol = d < 2 ? TOL_EM : d === 2 ? TOL_DEG : TOL_UNIT;
        compared++;
        const key = d < 2 ? 'em' : d === 2 ? 'deg' : 'depth';
        if (diff > worst[key]) { worst[key] = diff; worst.where = `semilla ${run.seed} ${run.target} fotograma ${f} glifo ${gi} eje ${['x', 'y', 'giro', 'profundidad'][d]}`; }
        if (diff > tol) bad++;
      }
    });
    if (skin) {
      stepSkin(skin, dt, true);
      const exp = values[run.skinOffset + f];
      const diff = Math.abs(skin.p - exp);
      compared++;
      if (diff > worst.skin) worst.skin = diff;
      if (diff > TOL_UNIT) bad++;
    }
  }
  if (bad) {
    console.error(`  FALLO R11: semilla ${run.seed} ${run.target}: ${bad} valor(es) fuera de tolerancia frente al prototipo`);
    errors++;
  }
}

// ── R11b · inventario de hosts en el código ──────────────────────────────────────────────────────────────
type Exempt = { file: string; selector: string; reason: string };
/** (a) hosts sin `data-hover`, por selector nombrado */
const EXEMPT: Exempt[] = [
  { file: 'src/components/atoms/SkipLink/SkipLink.tsx', selector: 'a[data-component="bbf-skip-link"]', reason: 'enlace de salto: invisible hasta el foco, no es una pieza de la página (BEHAVIOR §14)' },
  { file: 'src/components/atoms/BrandMark/BrandMarkLive.tsx', selector: 'a[data-component="bbf-brand-mark"]', reason: 'imagotipo: S9, su propio sistema (BEHAVIOR §12, §14)' },
  { file: 'src/app/(root)/page.tsx', selector: 'a', reason: 'defensa de la raíz, fuera del layout del locale: sin hoja de estilos ni cableador (D-BBW-07)' },
];
/** (b) dónde se FIJA el desarme S11: el único sitio que lo dice (BEHAVIOR §14; P-BBW-84: la navegación de la cabecera y los botones del héroe) */
type ScatterHost = { file: string; tag: string; count: number; reason: string };
const SCATTER_HOSTS: ScatterHost[] = [
  { file: 'src/components/organisms/Header/Header.tsx', tag: 'LinkList', count: 3, reason: 'navegación de la cabecera: nav en línea, nav de la hoja y perfiles de la hoja (`scatter` reenviada por LinkList → NavLink)' },
  { file: 'src/components/sections/HeroSection/HeroSection.tsx', tag: 'a', count: 2, reason: 'los dos botones del héroe de la home (`data-scatter=""` literal)' },
];
const HOST_TAGS = new Set(['a', 'Link', 'button']);

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsx(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Quita comentarios de bloque y de línea (en ellos se cita `<a>` como texto) sin mover los números de línea. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/^[ \t]*\/\/[^\n]*/gm, (m) => ' '.repeat(m.length));
}

/** Etiquetas de apertura `<Nombre …>` de cualquier elemento o componente, con su texto completo (llaves y cadenas de JSX pueden contener `>`). */
function openingTags(src: string): { name: string; text: string; line: number }[] {
  const tags: { name: string; text: string; line: number }[] = [];
  const re = /<([A-Za-z][\w.]*)(?=[\s/>])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let depth = 0;
    let quote: string | null = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) { if (c === quote) quote = null; continue; }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    tags.push({ name: m[1], text: src.slice(m.index, i + 1), line: src.slice(0, m.index).split('\n').length });
  }
  return tags;
}

/** Selector mínimo nombrado: `tag`, `tag.clase` (className={styles.clase} o className="clase"), `tag[attr="valor"]`. */
function matches(selector: string, tag: { name: string; text: string }): boolean {
  const sel = /^([a-zA-Z]+)(?:\.([\w-]+))?(?:\[([\w-]+)="([^"]*)"\])?$/.exec(selector);
  if (!sel) throw new Error(`R11b: selector no reconocido: ${selector}`);
  const [, name, cls, attr, val] = sel;
  if (name !== tag.name) return false;
  if (cls && !new RegExp(`className=(\\{styles\\.${cls}\\}|"${cls}")`).test(tag.text)) return false;
  if (attr && !tag.text.includes(`${attr}="${val}"`)) return false;
  return true;
}

/** Cómo aparece el desarme en una etiqueta: la FIJA (`data-scatter` vacío, `scatter` verdadera), lo REENVÍA (`={…scatter…}`) o no lo nombra. */
function scatterUse(text: string): 'set' | 'forward' | 'other' | null {
  const attrs = [...text.matchAll(/\s(data-scatter|scatter)(?:=("[^"]*"|\{[^}]*\}))?(?=[\s/>])/g)];
  if (!attrs.length) return null;
  const kinds = attrs.map(([, name, value]) => {
    if (value === undefined || value === '""' || value === '{true}') return 'set';
    if (name === 'data-scatter' && /^\{scatter\s*\?\s*""\s*:\s*undefined\}$/.test(value)) return 'forward';
    if (name === 'scatter' && value === '{scatter}') return 'forward';
    return 'other';
  });
  return kinds.includes('other') ? 'other' : kinds.includes('set') ? 'set' : 'forward';
}

const files = [...listTsx(path.join(ROOT, 'src/components')), ...listTsx(path.join(ROOT, 'src/app'))].sort();
let hosts = 0;
let hovered = 0;
let forwarded = 0;
const exemptHits = new Map<Exempt, string[]>(EXEMPT.map((e) => [e, []]));
const unhovered: string[] = [];
const setHits = new Map<string, string[]>(); // `${file}::${tag}` → líneas que FIJAN el desarme
const odd: string[] = [];
for (const file of files) {
  const rel = path.relative(ROOT, file);
  for (const tag of openingTags(stripComments(fs.readFileSync(file, 'utf8')))) {
    const use = scatterUse(tag.text);
    if (use === 'set') { const k = `${rel}::${tag.name}`; setHits.set(k, [...(setHits.get(k) ?? []), `${rel}:${tag.line} <${tag.name}>`]); }
    else if (use === 'forward') forwarded++;
    else if (use === 'other') odd.push(`${rel}:${tag.line} <${tag.name}>`);
    if (!HOST_TAGS.has(tag.name)) continue;
    hosts++;
    if (/\sdata-hover=/.test(tag.text)) { hovered++; continue; }
    const ex = EXEMPT.filter((e) => e.file === rel && matches(e.selector, tag));
    if (ex.length) { for (const e of ex) exemptHits.get(e)!.push(`${rel}:${tag.line}`); continue; }
    unhovered.push(`${rel}:${tag.line} <${tag.name}>`);
  }
}
let errorsB = 0;
for (const u of unhovered) { console.error(`  FALLO R11b(a): host sin \`data-hover\` y sin exención nombrada: ${u}`); errorsB++; }
for (const [e, hits] of exemptHits) {
  if (hits.length !== 1) { console.error(`  FALLO R11b(a): la exención \`${e.selector}\` (${e.file}) corresponde a ${hits.length} host(s), no a uno: ${hits.join(', ') || 'ninguno'}`); errorsB++; }
}
const declared = new Set(SCATTER_HOSTS.map((h) => `${h.file}::${h.tag}`));
for (const h of SCATTER_HOSTS) {
  const hits = setHits.get(`${h.file}::${h.tag}`) ?? [];
  if (hits.length !== h.count) { console.error(`  FALLO R11b(b): el desarme declarado en ${h.file} <${h.tag}> ×${h.count} aparece ×${hits.length}: ${hits.join(', ') || 'ninguno'}`); errorsB++; }
}
for (const [k, hits] of setHits) {
  if (!declared.has(k)) { for (const hit of hits) console.error(`  FALLO R11b(b): desarme FIJADO fuera de la lista declarada (SCATTER_HOSTS): ${hit}`); errorsB += hits.length; }
}
for (const o of odd) { console.error(`  FALLO R11b(b): forma de \`data-scatter\`/\`scatter\` que no es ni fijar (\`data-scatter=""\`, \`scatter\`) ni reenviar (\`={scatter …}\`): ${o}`); errorsB++; }
const setTotal = [...setHits.values()].reduce((n, v) => n + v.length, 0);
console.log(`[R11b] inventario en el código: ${hosts} hosts (<a>, <Link>, <button>) en ${files.length} ficheros · ${hovered} con data-hover · ${EXEMPT.length} exentos por selector nombrado (${EXEMPT.map((e) => e.selector).join(' · ')}) · ${unhovered.length} sin marcar · desarme fijado en ${setTotal} etiqueta(s) de ${setHits.size} sitio(s) (declarados: ${SCATTER_HOSTS.map((h) => `${path.basename(h.file)} <${h.tag}> ×${h.count}`).join(' · ')}) · ${forwarded} reenvío(s)`);
if (errorsB) {
  console.error(`✗ check-glyph-scatter: ${errorsB} error(es) R11b`);
  process.exit(1);
}
console.log('  OK    R11b: todo host lleva `data-hover` o una exención nombrada; el desarme se fija exactamente en los hosts declarados (BEHAVIOR §14)');

const summary = `máximo: ${worst.em.toExponential(2)} em (x, y) · ${worst.deg.toExponential(2)}° (giro) · ${worst.depth.toExponential(2)} (profundidad) · ${worst.skin.toExponential(2)} (piel)${worst.where ? ` — peor en ${worst.where}` : ''}`;
if (errors) {
  console.error(`  FALLO R11: ${errors} corrida(s) difieren del prototipo (${summary})`);
  console.error('✗ check-glyph-scatter: 1 error(es)');
  process.exit(1);
}
console.log(`  OK    R11: ${compared} valores comparados en ${golden.runs.length} corridas, 0 fuera de tolerancia (≤ ${TOL_EM} em · ≤ ${TOL_DEG}° · ≤ ${TOL_UNIT}); ${summary}`);
console.log('✓ check-glyph-scatter: R11 OK');
