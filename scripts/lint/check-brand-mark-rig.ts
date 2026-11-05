/**
 * scripts/lint/check-brand-mark-rig.ts — R10 · GUARDIA DEL RIG DEL IMAGOTIPO
 *
 * Verifica que media/masters/brand-icon-rig.json es consistente con brand-icon.svg:
 *   R10a — JSON parsea, schema v2, 6 tentáculos, centerline[60] + widths[60] por tentáculo.
 *   R10b — totalArcLen coincide con la longitud calculada del path oficial (tolerancia 1 %).
 *   R10c — cada tentáculo: fromFrac < anchorFrac < tipFrac < toFrac y todas las fracciones en [0, 1].
 *   R10d — los tentáculos no se solapan entre sí.
 *   R10e — el punto en tipFrac de cada tentáculo está a > minTipDist u del centro del viewBox.
 *   R10f — distancia de Hausdorff entre los contornos de reposo del rig y el path SVG ≤ 0.25 u.
 *
 * Uso: pnpm lint:rig
 * --test-fail: desplaza la punta de TR en 0.5 u para demostrar que R10f falla (I-7, M1b).
 */

import { readFileSync } from 'fs';
import path from 'path';

const REPO = path.resolve(process.cwd());
const SVG_PATH = path.join(REPO, 'media/masters/brand-icon.svg');
const RIG_PATH = path.join(REPO, 'media/masters/brand-icon-rig.json');

// ---- tipos ----
interface RigPhys { a1:number; w1:number; a2:number; w2:number; phase:number; releaseDelay:number; }
interface Tentacle {
  id: string; label: string;
  fromFrac: number; anchorFrac: number; tipFrac: number; toFrac: number;
  phys: RigPhys;
  centerline: [number, number][];
  widths: number[];
  arcLength: number;
}
interface RigData {
  _schema: string;
  source: string;
  viewBox: [number, number, number, number];
  totalArcLen: number;
  center: [number, number];
  minTipDist: number;
  tentacles: Tentacle[];
}

type Pt = [number, number];
type Seg = { p0:Pt; p1:Pt; p2:Pt; p3:Pt };

// ---- parser SVG completo (mismo que src/behavior/brand-mark-octopus.ts) ----
function parsePath(d: string): Seg[] {
  const segs: Seg[] = [];
  const tokens = d.match(/[MmCcSsLlHhVvZzQqTtAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];

  type Cmd = { cmd: string; args: number[] };
  const cmds: Cmd[] = [];
  let cur: Cmd | null = null;
  for (const tok of tokens) {
    if (/[MmCcSsLlHhVvZzQqTtAa]/.test(tok)) { cur = { cmd: tok, args: [] }; cmds.push(cur); }
    else if (cur) cur.args.push(parseFloat(tok));
  }

  let cx = 0, cy = 0, startX = 0, startY = 0;
  let lastCmd = '';
  let lastCP2x = 0, lastCP2y = 0;

  const lineSeg = (x0: number, y0: number, x1: number, y1: number): Seg => ({
    p0: [x0, y0], p1: [x0+(x1-x0)/3, y0+(y1-y0)/3], p2: [x0+2*(x1-x0)/3, y0+2*(y1-y0)/3], p3: [x1, y1],
  });

  for (const { cmd, args } of cmds) {
    switch (cmd) {
      case 'M': cx=args[0]; cy=args[1]; startX=cx; startY=cy;
        for (let i=2;i+1<args.length;i+=2){segs.push(lineSeg(cx,cy,args[i],args[i+1]));cx=args[i];cy=args[i+1];} lastCmd='M'; break;
      case 'm': cx+=args[0]; cy+=args[1]; startX=cx; startY=cy;
        for (let i=2;i+1<args.length;i+=2){segs.push(lineSeg(cx,cy,cx+args[i],cy+args[i+1]));cx+=args[i];cy+=args[i+1];} lastCmd='m'; break;
      case 'Z': case 'z':
        if (cx!==startX||cy!==startY) segs.push(lineSeg(cx,cy,startX,startY));
        cx=startX; cy=startY; lastCmd='Z'; break;
      case 'L': for(let i=0;i+1<args.length;i+=2){segs.push(lineSeg(cx,cy,args[i],args[i+1]));cx=args[i];cy=args[i+1];} lastCmd='L'; break;
      case 'l': for(let i=0;i+1<args.length;i+=2){segs.push(lineSeg(cx,cy,cx+args[i],cy+args[i+1]));cx+=args[i];cy+=args[i+1];} lastCmd='l'; break;
      case 'H': for(const x of args){segs.push(lineSeg(cx,cy,x,cy));cx=x;} lastCmd='H'; break;
      case 'h': for(const dx of args){segs.push(lineSeg(cx,cy,cx+dx,cy));cx+=dx;} lastCmd='h'; break;
      case 'V': for(const y of args){segs.push(lineSeg(cx,cy,cx,y));cy=y;} lastCmd='V'; break;
      case 'v': for(const dy of args){segs.push(lineSeg(cx,cy,cx,cy+dy));cy+=dy;} lastCmd='v'; break;
      case 'C':
        for(let i=0;i+5<args.length;i+=6){segs.push({p0:[cx,cy],p1:[args[i],args[i+1]],p2:[args[i+2],args[i+3]],p3:[args[i+4],args[i+5]]});lastCP2x=args[i+2];lastCP2y=args[i+3];cx=args[i+4];cy=args[i+5];}lastCmd='C';break;
      case 'c':
        for(let i=0;i+5<args.length;i+=6){segs.push({p0:[cx,cy],p1:[cx+args[i],cy+args[i+1]],p2:[cx+args[i+2],cy+args[i+3]],p3:[cx+args[i+4],cy+args[i+5]]});lastCP2x=cx+args[i+2];lastCP2y=cy+args[i+3];cx+=args[i+4];cy+=args[i+5];}lastCmd='c';break;
      case 'S':
        for(let i=0;i+3<args.length;i+=4){const p1x=/[CcSs]/.test(lastCmd)?2*cx-lastCP2x:cx,p1y=/[CcSs]/.test(lastCmd)?2*cy-lastCP2y:cy;segs.push({p0:[cx,cy],p1:[p1x,p1y],p2:[args[i],args[i+1]],p3:[args[i+2],args[i+3]]});lastCP2x=args[i];lastCP2y=args[i+1];cx=args[i+2];cy=args[i+3];}lastCmd='S';break;
      case 's':
        for(let i=0;i+3<args.length;i+=4){const p1x=/[CcSs]/.test(lastCmd)?2*cx-lastCP2x:cx,p1y=/[CcSs]/.test(lastCmd)?2*cy-lastCP2y:cy;segs.push({p0:[cx,cy],p1:[p1x,p1y],p2:[cx+args[i],cy+args[i+1]],p3:[cx+args[i+2],cy+args[i+3]]});lastCP2x=cx+args[i];lastCP2y=cy+args[i+1];cx+=args[i+2];cy+=args[i+3];}lastCmd='s';break;
    }
  }
  return segs;
}

function sample(s: Seg, t: number): Pt {
  const mt = 1 - t;
  return [
    mt*mt*mt*s.p0[0]+3*mt*mt*t*s.p1[0]+3*mt*t*t*s.p2[0]+t*t*t*s.p3[0],
    mt*mt*mt*s.p0[1]+3*mt*mt*t*s.p1[1]+3*mt*t*t*s.p2[1]+t*t*t*s.p3[1],
  ];
}

function segLen(s: Seg, n = 30): number {
  let l = 0, p = sample(s, 0);
  for (let i = 1; i <= n; i++) { const q = sample(s, i/n); l += Math.hypot(q[0]-p[0], q[1]-p[1]); p = q; }
  return l;
}

function buildArcIndex(segs: Seg[]): { cumLens: number[]; totalArc: number } {
  const lens = segs.map(s => segLen(s, 30));
  const cumLens: number[] = new Array(segs.length + 1);
  cumLens[0] = 0;
  for (let i = 0; i < lens.length; i++) cumLens[i+1] = cumLens[i] + lens[i];
  return { cumLens, totalArc: cumLens[segs.length] };
}

function sampleAtFrac(segs: Seg[], cumLens: number[], totalArc: number, frac: number): Pt {
  const target = Math.max(0, Math.min(1, frac)) * totalArc;
  let lo = 0, hi = segs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumLens[mid+1] < target) lo = mid + 1; else hi = mid;
  }
  const len = cumLens[lo+1] - cumLens[lo] || 1e-9;
  const t = Math.max(0, Math.min(1, (target - cumLens[lo]) / len));
  return sample(segs[lo], t);
}

/** Hausdorff unilateral: cada vértice del contorno de reposo → distancia mínima al path SVG muestreado. */
function computeHausdorff(rig: RigData, segs: Seg[], cumLens: number[], totalArc: number): number {
  const M = 20000;
  const svgPts: Pt[] = new Array(M + 1);
  for (let i = 0; i <= M; i++) svgPts[i] = sampleAtFrac(segs, cumLens, totalArc, i / M);

  let maxMinDist = 0;

  for (const t of rig.tentacles) {
    const cl = t.centerline;
    const widths = t.widths;
    const N = cl.length;

    const angles: number[] = new Array(N);
    for (let i = 0; i < N - 1; i++) angles[i] = Math.atan2(cl[i+1][1]-cl[i][1], cl[i+1][0]-cl[i][0]);
    angles[N-1] = angles[N-2] ?? 0;

    for (let i = 0; i < N; i++) {
      const w = widths[i] / 2;
      const nx = -Math.sin(angles[i]);
      const ny =  Math.cos(angles[i]);
      const left:  Pt = [cl[i][0] + w * nx, cl[i][1] + w * ny];
      const right: Pt = [cl[i][0] - w * nx, cl[i][1] - w * ny];

      for (const v of [left, right] as Pt[]) {
        let minDist = Infinity;
        for (let k = 0; k <= M; k++) {
          const d = Math.hypot(v[0] - svgPts[k][0], v[1] - svgPts[k][1]);
          if (d < minDist) minDist = d;
          if (d < 0.001) break;
        }
        if (minDist > maxMinDist) maxMinDist = minDist;
      }
    }
  }

  return maxMinDist;
}

// ---- lectura de archivos ----
function loadRig(): RigData {
  const raw = readFileSync(RIG_PATH, 'utf-8');
  const rig = JSON.parse(raw) as RigData;
  if (rig._schema !== 'brand-icon-rig/v2') throw new Error(`schema desconocido: ${rig._schema} (se espera v2)`);
  if (!Array.isArray(rig.tentacles) || rig.tentacles.length !== 6) throw new Error('se esperan exactamente 6 tentáculos');
  for (const t of rig.tentacles) {
    if (!Array.isArray(t.centerline) || t.centerline.length !== 60) throw new Error(`${t.id}: centerline debe tener 60 puntos`);
    if (!Array.isArray(t.widths) || t.widths.length !== 60) throw new Error(`${t.id}: widths debe tener 60 valores`);
    if (typeof t.arcLength !== 'number') throw new Error(`${t.id}: arcLength ausente`);
  }
  return rig;
}

// ---- comprobaciones ----
let errors = 0;
function fail(msg: string) { console.error(`  ✗ ${msg}`); errors++; }
function pass(msg: string) { console.log(`  ✓ ${msg}`); }

function run(rig: RigData) {
  const svgSrc = readFileSync(SVG_PATH, 'utf-8');
  const dMatch = svgSrc.match(/ d="([^"]+)"/);
  if (!dMatch) { fail('R10a: no se encontró el path en brand-icon.svg'); return; }

  const segs = parsePath(dMatch[1]);
  const { cumLens, totalArc } = buildArcIndex(segs);
  const [cx, cy] = rig.center;

  pass('R10a: schema brand-icon-rig/v2 ✓, centerline[60] + widths[60] por tentáculo ✓');

  const arcErr = Math.abs(totalArc - rig.totalArcLen) / totalArc;
  if (arcErr > 0.01) {
    fail(`R10b: totalArcLen en rig = ${rig.totalArcLen.toFixed(1)} vs calculado = ${totalArc.toFixed(1)} (error ${(arcErr*100).toFixed(2)} % > 1 %)`);
  } else {
    pass(`R10b: totalArcLen ${rig.totalArcLen.toFixed(1)} u ≈ calculado ${totalArc.toFixed(1)} u (Δ ${(arcErr*100).toFixed(2)} %)`);
  }

  const ranges = rig.tentacles.map(t => ({ id:t.id, from:t.fromFrac, anchor:t.anchorFrac, tip:t.tipFrac, to:t.toFrac }));
  for (const r of ranges) {
    if (!(r.from >= 0 && r.from < r.anchor && r.anchor < r.tip && r.tip < r.to && r.to <= 1)) {
      fail(`R10c: ${r.id} — orden inválido: from=${r.from} anchor=${r.anchor} tip=${r.tip} to=${r.to}`);
    } else {
      pass(`R10c: ${r.id} orden OK [${r.from}…${r.to}]`);
    }
  }

  const sorted = [...ranges].sort((a, b) => a.from - b.from);
  let overlapFound = false;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].to > sorted[i+1].from) {
      fail(`R10d: solapamiento entre ${sorted[i].id} (to=${sorted[i].to}) y ${sorted[i+1].id} (from=${sorted[i+1].from})`);
      overlapFound = true;
    }
  }
  if (!overlapFound) pass('R10d: sin solapamientos entre tentáculos');

  for (const t of rig.tentacles) {
    const [tx, ty] = sampleAtFrac(segs, cumLens, totalArc, t.tipFrac);
    const dist = Math.hypot(tx - cx, ty - cy);
    if (dist < rig.minTipDist) {
      fail(`R10e: ${t.id} tipFrac=${t.tipFrac} → (${tx.toFixed(1)}, ${ty.toFixed(1)}) dist=${dist.toFixed(1)} u < ${rig.minTipDist} u del centro`);
    } else {
      pass(`R10e: ${t.id} tipFrac=${t.tipFrac} → (${tx.toFixed(1)}, ${ty.toFixed(1)}) dist=${dist.toFixed(1)} u > ${rig.minTipDist} u ✓`);
    }
  }

  const HAUSDORFF_MAX = 0.25;
  console.log('  [R10f] calculando Hausdorff (20 000 muestras SVG × 720 vértices contorno)…');
  const h = computeHausdorff(rig, segs, cumLens, totalArc);
  if (h > HAUSDORFF_MAX) {
    fail(`R10f: Hausdorff = ${h.toFixed(3)} u > ${HAUSDORFF_MAX} u — rig no coincide con el path SVG`);
  } else {
    pass(`R10f: Hausdorff = ${h.toFixed(3)} u ≤ ${HAUSDORFF_MAX} u ✓`);
  }
}

// ---- main ----
const testFail = process.argv.includes('--test-fail');
console.log(`\n=== check-brand-mark-rig${testFail ? ' [--test-fail]' : ''} ===\n`);

try {
  const rig = loadRig();
  if (testFail) {
    const tip = rig.tentacles[0].centerline[59];
    tip[0] += 0.5; tip[1] += 0.5;
    console.log(`  [--test-fail] punta TR desplazada 0.5 u: [${tip[0].toFixed(3)}, ${tip[1].toFixed(3)}]`);
  }
  run(rig);
} catch (e) {
  fail(`R10a: ${(e as Error).message}`);
}

console.log();
if (errors > 0) {
  console.error(`FALLO: ${errors} error${errors > 1 ? 'es' : ''}`);
  process.exit(1);
} else {
  console.log('OK: todas las comprobaciones del rig pasaron');
}
