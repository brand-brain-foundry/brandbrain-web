/**
 * check-brand-mark-rig.ts — R10 · GUARDIA DEL IMAGOTIPO VIVO QUE EJECUTA EL MOTOR (M1c F4, 2026-11-05; sustituye R10a–R10g)
 *
 * Por qué existe: la guardia anterior medía datos que eran puntos del SVG por construcción y nunca ejecutaba el motor: no podía fallar
 * (M1c §0). Esta llama a las mismas funciones que corren en el navegador (`prepare`, `deformFrame`, `deformPoints`) sobre el rig
 * generado y compara la SALIDA con el maestro. Sin `sharp` (la herramienta de desarrollo queda en `media:build`): el raster es un
 * rasterizador propio de polígonos (par-impar, 4×4 submuestras), suficiente para contar píxeles distintos y situarlos.
 *
 * Reglas (exit 1 si falla, exit 2 si el tool rompe):
 *   R10c · el rig de `src/media/generated.ts` es exactamente el que se deriva del maestro con el perfil del registro (fuente única).
 *   R10a · con amplitud 0, el contorno que produce el motor coincide con el del maestro: Hausdorff BIDIRECCIONAL ≤ 0,25 u en los seis
 *          tentáculos, y en raster a 32 / 48 / 512 px todo píxel distinto está a ≤ 1 px del borde del maestro (solo el suavizado).
 *   R10b · 20 semillas × 200 fotogramas (muelle de entrada desde 0, dt = 1/60 s): la sección de cada tentáculo = la de reposo ± 1 %, y
 *          ningún tentáculo (su parte distal, s ≥ 0,25) a < 1 u de otro tentáculo ni del cuerpo fijo.
 * Umbrales y métricas: M1 §4.2 y M1c §3 F4. Prohibido cambiarlos aquí (I-8): un umbral que falla se escala.
 *
 * VERLA FALLAR (sin bandera que toque el rig): BBW_RIG_SVG=<ruta a un maestro alterado> sustituye el maestro que se compara;
 * BBW_RIG_DEFECT=section-as-tangent reintroduce el defecto real de a4500d0 (integrar la dirección de la sección como si fuera la
 * tangente) en la columna con amplitud 0. Ambos deben dar rojo; el repo tal cual, verde.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { rigs as rigSpecs } from '../../src/media/registry';
import { rigs as generatedRigs } from '../../src/media/generated';
import { deriveRig } from '../media/brand-icon-rig';
import {
  OCTOPUS, deformFrame, deformPoints, flattenPath, makeMotion, parseSVGPath, placePoint, prepare, springStep, splitSubpaths, wrapIndex,
  type Motion, type Pt, type Prepared, type Rig, type TentacleRuntime,
} from '../../src/behavior/brand-mark-octopus';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SVG_PATH = process.env.BBW_RIG_SVG ? path.resolve(process.env.BBW_RIG_SVG) : path.join(ROOT, 'media/masters/brand-icon.svg');
const DEFECT = process.env.BBW_RIG_DEFECT;

// Umbrales (M1 §4.2, M1c F4). No se tocan.
const HAUSDORFF_MAX_U = 0.25;
const RASTER_SIZES = [32, 48, 512];
const EDGE_PX = 1;
const SEEDS = 20;
const FRAMES = 200;
const DT = 1 / 60;
const SECTION_TOL = 0.01;
const CLEARANCE_MIN_U = 1;
const DISTAL_FROM = 0.25;

let errors = 0;
const fail = (id: string, msg: string) => { console.error(`  FALLO ${id}: ${msg}`); errors++; };
const ok = (id: string, msg: string) => console.log(`  OK    ${id}: ${msg}`);

// ── entrada ────────────────────────────────────────────────────────────────────────────────────────────────────
const svgSrc = fs.readFileSync(SVG_PATH, 'utf8');
const dMatch = /\bd="([^"]*)"/.exec(svgSrc);
if (!dMatch) { console.error(`[rig-gate] FAIL-CLOSED: sin d="" en ${SVG_PATH}`); process.exit(2); }
const dMaster = dMatch[1];
const spec = rigSpecs.brandIconRig;
const rig: Rig = generatedRigs.brandIconRig;
if (DEFECT) console.log(`[rig-gate] DEFECTO INYECTADO: ${DEFECT}`);
if (process.env.BBW_RIG_SVG) console.log(`[rig-gate] maestro sustituido: ${SVG_PATH}`);

// ── R10c · fuente única: el rig generado == el derivado del maestro ────────────────────────────────────────────
{
  const derived = deriveRig(dMaster, spec.profile.step, spec.profile.samples);
  const a = JSON.stringify(derived), b = JSON.stringify(rig);
  if (a !== b) {
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    fail('R10c', `el rig generado no es el que se deriva del maestro (primera diferencia en el carácter ${i}: «${b.slice(Math.max(0, i - 30), i + 30)}» vs derivado «${a.slice(Math.max(0, i - 30), i + 30)}»): pnpm media:build`);
  } else ok('R10c', `rig ${rig.schema} = derivado del maestro (${rig.tentacles.length} tentáculos, ${rig.n} muestras, ${a.length} B)`);
}

// ── geometría auxiliar ────────────────────────────────────────────────────────────────────────────────────────
type Loop = Pt[];
function masterLoops(d: string, piecesPerUnit = 32): Loop[] {
  const { d1, dHole } = splitSubpaths(d);
  return [d1, dHole].map(sub => flattenPath(parseSVGPath(sub), piecesPerUnit).pts);
}
function segDist(p: Pt, a: Pt, b: Pt): number {
  const bx = b[0] - a[0], by = b[1] - a[1];
  const l2 = bx * bx + by * by || 1e-18;
  let t = ((p[0] - a[0]) * bx + (p[1] - a[1]) * by) / l2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(a[0] + t * bx - p[0], a[1] + t * by - p[1]);
}
/** Distancia de un punto a una polilínea cerrada (segmentos), con rejilla para no ser cuadrático. */
class LoopIndex {
  private cell: number; private grid = new Map<string, number[]>();
  constructor(private L: Loop, cell = 4) { this.cell = cell; for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length]; for (const k of this.cellsOf(a, b)) { const arr = this.grid.get(k); if (arr) arr.push(i); else this.grid.set(k, [i]); } } }
  private key(x: number, y: number) { return `${Math.floor(x / this.cell)},${Math.floor(y / this.cell)}`; }
  private cellsOf(a: Pt, b: Pt): string[] { const out: string[] = []; const x0 = Math.floor(Math.min(a[0], b[0]) / this.cell), x1 = Math.floor(Math.max(a[0], b[0]) / this.cell), y0 = Math.floor(Math.min(a[1], b[1]) / this.cell), y1 = Math.floor(Math.max(a[1], b[1]) / this.cell); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push(`${x},${y}`); return out; }
  /** `limit`: si nada queda a menos de `limit`, devuelve Infinity sin seguir explorando (solo importa lo que está cerca). */
  dist(p: Pt, limit = Infinity): number {
    let best = Infinity;
    for (let r = 0; r < 64 && (r - 1) * this.cell <= limit; r++) {
      const cx = Math.floor(p[0] / this.cell), cy = Math.floor(p[1] / this.cell);
      for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
        if (r > 0 && Math.abs(x - cx) !== r && Math.abs(y - cy) !== r) continue;
        const arr = this.grid.get(`${x},${y}`); if (!arr) continue;
        for (const i of arr) { const d = segDist(p, this.L[i], this.L[(i + 1) % this.L.length]); if (d < best) best = d; }
      }
      if (best <= r * this.cell) return best; // nada más cerca puede quedar fuera del anillo explorado
    }
    return best;
  }
}

/** Rasterizador par-impar con 4×4 submuestras; devuelve cobertura [0,1] por píxel. Las aristas se agrupan por fila de submuestra. */
function rasterize(loops: Loop[], size: number, scale: number): Float32Array {
  const cov = new Float32Array(size * size);
  const SS = 4, rows = size * SS;
  const buckets: number[][] = Array.from({ length: rows }, () => []);
  const E: number[] = []; // x0,y0,x1,y1 por arista, en submuestras
  for (const L of loops) for (let i = 0; i < L.length; i++) {
    const a = L[i], b = L[(i + 1) % L.length];
    const x0 = a[0] * scale * SS, y0 = a[1] * scale * SS, x1 = b[0] * scale * SS, y1 = b[1] * scale * SS;
    if (y0 === y1) continue;
    const e = E.length; E.push(x0, y0, x1, y1);
    const r0 = Math.max(0, Math.floor(Math.min(y0, y1) - 0.5)), r1 = Math.min(rows - 1, Math.ceil(Math.max(y0, y1) - 0.5));
    for (let r = r0; r <= r1; r++) buckets[r].push(e);
  }
  const xs: number[] = [];
  for (let sy = 0; sy < rows; sy++) {
    const y = sy + 0.5;
    xs.length = 0;
    for (const e of buckets[sy]) { const x0 = E[e], y0 = E[e + 1], x1 = E[e + 2], y1 = E[e + 3]; if ((y0 <= y) !== (y1 <= y)) xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)); }
    xs.sort((a, b) => a - b);
    const row = Math.floor(sy / SS) * size;
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, xs[k]), xb = Math.min(rows, xs[k + 1]);
      for (let sx = Math.floor(xa); sx < xb; sx++) cov[row + Math.floor(sx / SS)] += 1 / (SS * SS);
    }
  }
  return cov;
}

/** Contorno completo que produce el motor en un fotograma dado, como lazos de puntos (región deformada + tramo fijo por tentáculo; hueco literal). */
function frameLoops(prep: Prepared, motions: Motion[], amps: number[], times: number[], column: (T: TentacleRuntime, M: Motion, amp: number, t: number) => void): Loop[] {
  const outer: Pt[] = [];
  const order = prep.tentacles;
  for (let o = 0; o < order.length; o++) {
    const T = order[o];
    column(T, motions[o], amps[o], times[o]);
    for (const p of T.pts) outer.push(placePoint(p, T));
    // tramo fijo: índices entre el fin de esta región y el inicio de la siguiente (mismo cálculo que `prepare`)
    const Tn = rig.tentacles.slice().sort((a, b) => a.start - b.start);
    const a = Tn[o].end + 1, b = Tn[(o + 1) % Tn.length].start + (o === Tn.length - 1 ? prep.n : 0) - 1;
    for (let i = a; i <= b; i++) outer.push(prep.P[wrapIndex(i, prep.n)]);
  }
  return [outer, masterLoops(prep.dRest)[1]];
}

function realColumn(T: TentacleRuntime, M: Motion, amp: number, t: number): void { deformPoints(T, M, amp, t); }
/** El defecto real de a4500d0: la dirección de la sección integrada como tangente (θ = θ₀ + π/2). */
function defectColumn(T: TentacleRuntime): void {
  const K = T.C.length;
  for (let k = 0; k < K; k++) T.th[k] = T.th0[k] + Math.PI / 2;
  T.cx[0] = T.C[0][0]; T.cy[0] = T.C[0][1];
  for (let k = 1; k < K; k++) { T.cx[k] = T.cx[k - 1] + T.ds[k - 1] * Math.cos(T.th[k - 1]); T.cy[k] = T.cy[k - 1] + T.ds[k - 1] * Math.sin(T.th[k - 1]); }
}
const column = DEFECT === 'section-as-tangent' ? defectColumn : realColumn;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── R10a · amplitud 0 ⇒ el maestro ────────────────────────────────────────────────────────────────────────────
const prep = prepare(dMaster, rig);
const loops = masterLoops(dMaster);
const outerIdx = new LoopIndex(loops[0]);
const holeIdx = new LoopIndex(loops[1]);
const zeroMotions = prep.tentacles.map(() => makeMotion(mulberry32(1)));
const zeros = prep.tentacles.map(() => 0);
{
  // el `d` que escribe el motor con amplitud 0 es el que se mide (deformFrame es la función que corre en el navegador)
  const dZero = deformFrame(prep, zeroMotions, zeros, zeros);
  const nums = dZero.match(/-?\d+(?:\.\d+)?/g)?.length ?? 0;
  console.time('R10a');
  console.log(`\n[R10a] amplitud 0 · d del motor: ${dZero.length} B, ${nums / 2} vértices (hueco literal: ${dZero.endsWith(prep.dHole) ? 'sí' : 'NO'})`);
  for (const T of prep.tentacles) {
    column(T, zeroMotions[0], 0, 0);
    const pts = T.pts.map(p => placePoint(p, T));
    // ida: cada vértice del motor al contorno del maestro
    let fwd = 0; for (const p of pts) fwd = Math.max(fwd, outerIdx.dist(p));
    // vuelta: cada punto fino del maestro dentro del tramo de la región, a la polilínea del motor
    const region = new LoopIndex(pts.concat([pts[0]]).slice(0, -1), 2); // polilínea abierta tratada como lazo: el cierre es la base, misma distancia
    let bwd = 0;
    const T0 = rig.tentacles.find(t => t.id === T.id)!;
    const fine = loops[0];
    // el tramo del maestro que corresponde a la región: entre el primer y el último punto de la región (por proyección al contorno fino)
    const near = (q: Pt) => { let bi = 0, bd = Infinity; for (let i = 0; i < fine.length; i++) { const d = Math.hypot(fine[i][0] - q[0], fine[i][1] - q[1]); if (d < bd) { bd = d; bi = i; } } return bi; };
    const i0 = near(prep.P[wrapIndex(T0.start, prep.n)]), i1 = near(prep.P[wrapIndex(T0.end, prep.n)]);
    for (let i = i0; ; i = (i + 1) % fine.length) { bwd = Math.max(bwd, region.dist(fine[i])); if (i === i1) break; }
    const h = Math.max(fwd, bwd);
    if (h > HAUSDORFF_MAX_U) fail('R10a', `${T.id}: Hausdorff bidireccional = ${h.toFixed(4)} u (ida ${fwd.toFixed(4)}, vuelta ${bwd.toFixed(4)}) > ${HAUSDORFF_MAX_U} u`);
    else ok('R10a', `${T.id}: Hausdorff bidireccional = ${h.toFixed(4)} u (ida ${fwd.toFixed(4)}, vuelta ${bwd.toFixed(4)}) ≤ ${HAUSDORFF_MAX_U} u`);
  }
  // raster: el fotograma completo del motor contra el maestro
  const fl = frameLoops(prep, zeroMotions, zeros, zeros, column);
  const rasterLoops = masterLoops(dMaster, 8);
  for (const size of RASTER_SIZES) {
    const scale = size / Math.max(263.2, 271.5);
    const a = rasterize(rasterLoops, size, scale), b = rasterize(fl, size, scale);
    let diff = 0, offEdge = 0, maxDist = 0;
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) <= 0.25) continue;
      diff++;
      const px: Pt = [((i % size) + 0.5) / scale, (Math.floor(i / size) + 0.5) / scale];
      const dU = Math.min(outerIdx.dist(px), holeIdx.dist(px)) * scale;
      maxDist = Math.max(maxDist, dU);
      if (dU > EDGE_PX) offEdge++;
    }
    if (offEdge > 0) fail('R10a', `raster ${size} px: ${diff} píxeles distintos, ${offEdge} a más de ${EDGE_PX} px del borde (máx ${maxDist.toFixed(2)} px)`);
    else ok('R10a', `raster ${size} px: ${diff} píxeles distintos, todos en el borde (máx ${maxDist.toFixed(2)} px ≤ ${EDGE_PX} px)`);
  }
}

console.timeEnd('R10a');
// ── R10b · 20 semillas × 200 fotogramas: sección y separación ─────────────────────────────────────────────────
{
  console.time('R10b');
  console.log(`\n[R10b] ${SEEDS} semillas × ${FRAMES} fotogramas (dt ${DT.toFixed(4)} s)`);
  // sección de reposo por tentáculo y por segmento k: distancia mínima entre los puntos de un lado (v > 0) y del otro (v < 0) con el mismo k
  const sectionOf = (T: TentacleRuntime, pts: Pt[]): Map<number, number> => {
    const byK = new Map<number, { l: Pt[]; r: Pt[] }>();
    T.pts.forEach((p, q) => { const g = byK.get(p.k) ?? { l: [], r: [] }; (p.v > 0 ? g.l : g.r).push(pts[q]); byK.set(p.k, g); });
    const out = new Map<number, number>();
    for (const [k, g] of byK) { if (!g.l.length || !g.r.length) continue; let m = Infinity; for (const a of g.l) for (const b of g.r) m = Math.min(m, Math.hypot(a[0] - b[0], a[1] - b[1])); out.set(k, m); }
    return out;
  };
  const rest = prep.tentacles.map(T => { column(T, zeroMotions[0], 0, 0); return sectionOf(T, T.pts.map(p => placePoint(p, T))); });
  // puntos fijos del cuerpo (fuera de toda región)
  const inRegion = new Uint8Array(prep.n);
  for (const t of rig.tentacles) for (let i = t.start; i <= t.end; i++) inRegion[wrapIndex(i, prep.n)] = 1;
  const body: Pt[] = []; for (let i = 0; i < prep.n; i++) if (!inRegion[i]) body.push(prep.P[i]);
  const bodyIdx = new LoopIndex(body.concat([body[0]]).slice(0, -1), 2);
  let worstSection = 0, worstSectionWhere = '', worstClear = Infinity, worstClearWhere = '';
  for (let seed = 1; seed <= SEEDS; seed++) {
    const rnd = mulberry32(seed * 7919);
    const motions = prep.tentacles.map(() => makeMotion(rnd));
    const amps = prep.tentacles.map(() => 0), times = motions.map(M => M.time);
    for (let f = 0; f < FRAMES; f++) {
      for (let j = 0; j < motions.length; j++) { const M = motions[j]; M.time += DT; springStep(M.spring, 1, M.spring.kOn, M.spring.zOn, DT); amps[j] = M.spring.x; times[j] = M.time; }
      const ptsAll = prep.tentacles.map((T, j) => { column(T, motions[j], amps[j], times[j]); return T.pts.map(p => placePoint(p, T)); });
      for (let j = 0; j < prep.tentacles.length; j++) {
        const T = prep.tentacles[j];
        const sec = sectionOf(T, ptsAll[j]);
        for (const [k, s0] of rest[j]) { const s1 = sec.get(k); if (s1 === undefined) continue; const dev = Math.abs(s1 - s0) / s0; if (dev > worstSection) { worstSection = dev; worstSectionWhere = `${T.id} k=${k} semilla ${seed} fotograma ${f} (${s1.toFixed(3)} vs ${s0.toFixed(3)} u)`; } }
      }
      // separación: rejilla por fotograma (celda 1 u): cada punto distal busca en 3×3 celdas puntos de OTRO tentáculo; el cuerpo, por su índice
      const cell = CLEARANCE_MIN_U;
      const grid = new Map<number, number[]>(); // clave → [j, q, j, q, …]
      const keyOf = (p: Pt) => Math.floor(p[0] / cell) * 100003 + Math.floor(p[1] / cell);
      for (let j = 0; j < ptsAll.length; j++) for (let q = 0; q < ptsAll[j].length; q++) { const k = keyOf(ptsAll[j][q]); const arr = grid.get(k); if (arr) arr.push(j, q); else grid.set(k, [j, q]); }
      for (let j = 0; j < prep.tentacles.length; j++) {
        const T = prep.tentacles[j], K = T.C.length;
        for (let q = 0; q < T.pts.length; q++) {
          if (T.pts[q].k / (K - 1) < DISTAL_FROM) continue;
          const p = ptsAll[j][q];
          const db = bodyIdx.dist(p, worstClear);
          if (db < worstClear) { worstClear = db; worstClearWhere = `${T.id}↔cuerpo semilla ${seed} fotograma ${f}`; }
          const gx = Math.floor(p[0] / cell), gy = Math.floor(p[1] / cell);
          for (let x = gx - 1; x <= gx + 1; x++) for (let y = gy - 1; y <= gy + 1; y++) {
            const arr = grid.get(x * 100003 + y); if (!arr) continue;
            for (let r = 0; r < arr.length; r += 2) { const m = arr[r]; if (m === j) continue; const o = ptsAll[m][arr[r + 1]]; const d = Math.hypot(o[0] - p[0], o[1] - p[1]); if (d < worstClear) { worstClear = d; worstClearWhere = `${T.id}↔${prep.tentacles[m].id} semilla ${seed} fotograma ${f}`; } }
          }
        }
      }
    }
  }
  console.timeEnd('R10b');
  if (worstSection > SECTION_TOL) fail('R10b', `sección: desviación máxima ${(worstSection * 100).toFixed(3)} % > ${SECTION_TOL * 100} % en ${worstSectionWhere}`);
  else ok('R10b', `sección: desviación máxima ${(worstSection * 100).toFixed(3)} % ≤ ${SECTION_TOL * 100} % (${worstSectionWhere})`);
  if (worstClear < CLEARANCE_MIN_U) fail('R10b', `separación mínima ${worstClear.toFixed(3)} u < ${CLEARANCE_MIN_U} u en ${worstClearWhere}`);
  else ok('R10b', `separación mínima ${worstClear.toFixed(3)} u ≥ ${CLEARANCE_MIN_U} u (${worstClearWhere})`);
}

console.log('');
if (errors === 0) { console.log(`✓ check-brand-mark-rig: R10a · R10b · R10c OK (motor ejecutado: ${OCTOPUS.K} muestras/línea central, ${rig.n} muestras de contorno)`); process.exit(0); }
console.error(`✗ check-brand-mark-rig: ${errors} error(es)`);
process.exit(1);
