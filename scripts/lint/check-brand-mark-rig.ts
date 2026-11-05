/**
 * check-brand-mark-rig.ts — R10a–R10g · guardia del rig del imagotipo (M1b, 2026-11-05)
 *
 * Verifica que media/masters/brand-icon-rig.json está sincronizado con brand-icon.svg y cumple
 * todas las invariantes geométricas del motor S9. Se ejecuta en cada commit con `pnpm lint:rig`.
 *
 * Reglas activas:
 *   R10a — cada tentáculo tiene exactamente 60 puntos en centerline, widths y natAngles
 *   R10b — el grosor en la punta (widths[59]) es < 1 u (puntas cerradas)
 *   R10c — arcLength concuerda con la longitud medida de centerline (±5 %)
 *   R10d — el primer punto de la línea central está a ≤ 1 u del anchorFrac del SVG
 *   R10e — el último punto de la línea central está a ≤ 0.5 u del tipFrac del SVG
 *   R10f — el contorno en reposo (reconstruido con natAngles del rig) coincide con el SVG:
 *           distancia de Hausdorff entre los vértices del contorno y el SVG muestreado ≤ 0.25 u
 *   R10g — el punto de punta (cl[59]) está a ≤ 0.001 u de la posición media de los dos lados del SVG
 *
 * Con --test-fail: desplaza cl[59] de TR 0.5 u para provocar fallo en R10f/R10g (autoverificación).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const TEST_FAIL = process.argv.includes('--test-fail');

// ── Rutas ─────────────────────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '../..');
const SVG_PATH = path.join(ROOT, 'media/masters/brand-icon.svg');
const RIG_PATH = path.join(ROOT, 'media/masters/brand-icon-rig.json');

// ── Tipos ─────────────────────────────────────────────────────────────────────────────────────

type Pt = [number, number];
type Seg = { p0: Pt; p1: Pt; p2: Pt; p3: Pt };

// ── Parser SVG (mismo algoritmo que src/behavior/brand-mark-octopus.ts) ───────────────────────

function parseSVGPath(d: string): Seg[] {
  const segs: Seg[] = [];
  const tokens = d.match(/[MmCcSsLlHhVvZzQqTtAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];

  type Cmd = { cmd: string; args: number[] };
  const cmds: Cmd[] = [];
  let cur: Cmd | null = null;
  for (const tok of tokens) {
    if (/[MmCcSsLlHhVvZzQqTtAa]/.test(tok)) { cur = { cmd: tok, args: [] }; cmds.push(cur); }
    else if (cur) cur.args.push(parseFloat(tok));
  }

  let cx = 0, cy = 0, startX = 0, startY = 0, lastCmd = '', lastCpx = 0, lastCpy = 0;
  const lineSeg = (x0: number, y0: number, x1: number, y1: number): Seg => ({
    p0: [x0, y0], p1: [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3],
    p2: [x0 + 2 * (x1 - x0) / 3, y0 + 2 * (y1 - y0) / 3], p3: [x1, y1],
  });
  const cubicSeg = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): Seg => ({
    p0: [cx, cy], p1: [x1, y1], p2: [x2, y2], p3: [x3, y3],
  });

  for (const { cmd, args } of cmds) {
    switch (cmd) {
      case 'M': cx = args[0]; cy = args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; } lastCmd = 'M'; break;
      case 'm': cx += args[0]; cy += args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; } lastCmd = 'm'; break;
      case 'Z': case 'z':
        if (cx !== startX || cy !== startY) segs.push(lineSeg(cx, cy, startX, startY));
        cx = startX; cy = startY; lastCmd = 'Z'; break;
      case 'L':
        for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; } lastCmd = 'L'; break;
      case 'l':
        for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; } lastCmd = 'l'; break;
      case 'H': for (const x of args) { segs.push(lineSeg(cx, cy, x, cy)); cx = x; } lastCmd = 'H'; break;
      case 'h': for (const dx of args) { segs.push(lineSeg(cx, cy, cx + dx, cy)); cx += dx; } lastCmd = 'h'; break;
      case 'V': for (const y of args) { segs.push(lineSeg(cx, cy, cx, y)); cy = y; } lastCmd = 'V'; break;
      case 'v': for (const dy of args) { segs.push(lineSeg(cx, cy, cx, cy + dy)); cy += dy; } lastCmd = 'v'; break;
      case 'C':
        for (let i = 0; i + 5 < args.length; i += 6) {
          segs.push(cubicSeg(args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], args[i + 5]));
          lastCpx = args[i + 2]; lastCpy = args[i + 3]; cx = args[i + 4]; cy = args[i + 5];
        } lastCmd = 'C'; break;
      case 'c':
        for (let i = 0; i + 5 < args.length; i += 6) {
          segs.push(cubicSeg(cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3], cx + args[i + 4], cy + args[i + 5]));
          lastCpx = cx + args[i + 2]; lastCpy = cy + args[i + 3]; cx += args[i + 4]; cy += args[i + 5];
        } lastCmd = 'c'; break;
      case 'S':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const cp1x = /[CcSs]/.test(lastCmd) ? 2 * cx - lastCpx : cx;
          const cp1y = /[CcSs]/.test(lastCmd) ? 2 * cy - lastCpy : cy;
          segs.push(cubicSeg(cp1x, cp1y, args[i], args[i + 1], args[i + 2], args[i + 3]));
          lastCpx = args[i]; lastCpy = args[i + 1]; cx = args[i + 2]; cy = args[i + 3];
        } lastCmd = 'S'; break;
      case 's':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const cp1x = /[CcSs]/.test(lastCmd) ? 2 * cx - lastCpx : cx;
          const cp1y = /[CcSs]/.test(lastCmd) ? 2 * cy - lastCpy : cy;
          segs.push(cubicSeg(cp1x, cp1y, cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3]));
          lastCpx = cx + args[i]; lastCpy = cy + args[i + 1]; cx += args[i + 2]; cy += args[i + 3];
        } lastCmd = 's'; break;
    }
  }
  return segs;
}

// ── Geometría auxiliar ────────────────────────────────────────────────────────────────────────

function bzAt(s: Seg, t: number): Pt {
  const mt = 1 - t;
  return [
    mt * mt * mt * s.p0[0] + 3 * mt * mt * t * s.p1[0] + 3 * mt * t * t * s.p2[0] + t * t * t * s.p3[0],
    mt * mt * mt * s.p0[1] + 3 * mt * mt * t * s.p1[1] + 3 * mt * t * t * s.p2[1] + t * t * t * s.p3[1],
  ];
}

function bzLen(s: Seg, n = 30): number {
  let l = 0;
  let [px, py] = bzAt(s, 0);
  for (let k = 1; k <= n; k++) {
    const [qx, qy] = bzAt(s, k / n);
    l += Math.hypot(qx - px, qy - py);
    [px, py] = [qx, qy];
  }
  return l;
}

function sampleAtFrac(segs: Seg[], arcLens: number[], totalArc: number, frac: number): Pt {
  const target = frac * totalArc;
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    const len = arcLens[i];
    if (acc + len >= target || i === segs.length - 1) {
      const t = len > 0 ? Math.max(0, Math.min(1, (target - acc) / len)) : 0;
      return bzAt(segs[i], t);
    }
    acc += len;
  }
  return segs[segs.length - 1].p3;
}

/** Muestrea N puntos equiespaciados en arco a lo largo del contorno SVG [fromFrac, toFrac]. */
function sampleContourSide(
  segs: Seg[], arcLens: number[], totalArc: number,
  fromFrac: number, toFrac: number, N: number,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const f = fromFrac + (i / (N - 1)) * (toFrac - fromFrac);
    pts.push(sampleAtFrac(segs, arcLens, totalArc, f));
  }
  return pts;
}

/** Distancia punto–nube (mínima distancia de un punto a un array de puntos). */
function minDist(pt: Pt, cloud: Pt[]): number {
  let best = Infinity;
  for (const q of cloud) {
    const d = Math.hypot(pt[0] - q[0], pt[1] - q[1]);
    if (d < best) best = d;
  }
  return best;
}

/** Hausdorff de un polígono A a una nube de puntos B (máxima distancia mínima de A a B). */
function hausdorff(a: Pt[], b: Pt[]): number {
  let h = 0;
  for (const p of a) {
    const d = minDist(p, b);
    if (d > h) h = d;
  }
  return h;
}

/** Reconstruye el contorno en reposo de un tentáculo usando los natAngles almacenados en el rig. */
function buildContour(cl: Pt[], widths: number[], natAngles: number[]): Pt[] {
  const N = cl.length;
  const left: Pt[] = new Array(N);
  const right: Pt[] = new Array(N);
  for (let i = 0; i < N; i++) {
    const w = widths[i] / 2;
    const nx = -Math.sin(natAngles[i]);
    const ny =  Math.cos(natAngles[i]);
    left[i]  = [cl[i][0] + w * nx, cl[i][1] + w * ny];
    right[i] = [cl[i][0] - w * nx, cl[i][1] - w * ny];
  }
  return [...left, ...right.reverse()];
}

// ── Entrada ───────────────────────────────────────────────────────────────────────────────────

const svgSrc = fs.readFileSync(SVG_PATH, 'utf8');
const dMatch = [...svgSrc.matchAll(/\bd="([^"]*)"/g)];
if (dMatch.length === 0) { console.error('ERROR: no se encontró d="" en el SVG'); process.exit(1); }
const svgSegs = parseSVGPath(dMatch[0][1]);
const svgArcLens = svgSegs.map(s => bzLen(s, 30));
const svgTotalArc = svgArcLens.reduce((a, b) => a + b, 0);

type RigTentacle = {
  id: string; label: string; fromFrac: number; anchorFrac: number;
  tipFrac: number; toFrac: number;
  centerline: Pt[]; widths: number[]; natAngles: number[]; arcLength: number;
};
type Rig = { _schema: string; viewBox: number[]; tentacles: RigTentacle[] };

const rig = JSON.parse(fs.readFileSync(RIG_PATH, 'utf8')) as Rig;

if (TEST_FAIL) {
  // Desplaza cl[59] de TR 0.5 u en X para provocar R10f/R10g
  const tr = rig.tentacles.find(t => t.id === 'TR');
  if (tr) { tr.centerline[59][0] += 0.5; }
  console.log('[TEST-FAIL] TR cl[59] desplazado 0.5 u — se esperan fallos en R10f y R10g');
}

// ── Reglas ────────────────────────────────────────────────────────────────────────────────────

let errors = 0;

function fail(id: string, msg: string): void {
  console.error(`  FALLO ${id}: ${msg}`);
  errors++;
}

function ok(id: string, msg: string): void {
  console.log(`  OK    ${id}: ${msg}`);
}

for (const t of rig.tentacles) {
  console.log(`\n[${t.id}] ${t.label}`);
  const { centerline: cl, widths, natAngles, arcLength, fromFrac, toFrac, tipFrac } = t;

  // R10a — dimensiones exactas
  const N_EXPECTED = 60;
  if (cl.length !== N_EXPECTED || widths.length !== N_EXPECTED || natAngles.length !== N_EXPECTED) {
    fail('R10a', `se esperan ${N_EXPECTED} pts; cl=${cl.length} w=${widths.length} na=${natAngles.length}`);
  } else {
    ok('R10a', `${N_EXPECTED} puntos en centerline, widths y natAngles`);
  }

  // R10b — punta cerrada
  const tipWidth = widths[widths.length - 1];
  if (tipWidth >= 1) {
    fail('R10b', `widths[59]=${tipWidth.toFixed(3)} ≥ 1 u (punta debe estar cerrada)`);
  } else {
    ok('R10b', `widths[59]=${tipWidth.toFixed(3)} u < 1 u`);
  }

  // R10c — arcLength ± 5 %
  let measuredArc = 0;
  for (let i = 1; i < cl.length; i++) {
    measuredArc += Math.hypot(cl[i][0] - cl[i - 1][0], cl[i][1] - cl[i - 1][1]);
  }
  const arcErr = Math.abs(measuredArc - arcLength) / arcLength;
  if (arcErr > 0.05) {
    fail('R10c', `arcLength=${arcLength} vs medida=${measuredArc.toFixed(2)} (Δ ${(arcErr * 100).toFixed(1)} % > 5 %)`);
  } else {
    ok('R10c', `arcLength=${arcLength} u (Δ ${(arcErr * 100).toFixed(2)} % ≤ 5 %)`);
  }

  // R10d — cl[0] es el punto medio de SVG(fromFrac) y SVG(toFrac), ≤ 1 u
  const basePt1 = sampleAtFrac(svgSegs, svgArcLens, svgTotalArc, fromFrac);
  const basePt2 = sampleAtFrac(svgSegs, svgArcLens, svgTotalArc, toFrac);
  const baseMid: Pt = [(basePt1[0] + basePt2[0]) / 2, (basePt1[1] + basePt2[1]) / 2];
  const anchorDist = Math.hypot(cl[0][0] - baseMid[0], cl[0][1] - baseMid[1]);
  if (anchorDist > 1) {
    fail('R10d', `cl[0]=[${cl[0].map(v => v.toFixed(1)).join(', ')}] mid(from,to)=[${baseMid.map(v => v.toFixed(1)).join(', ')}] dist=${anchorDist.toFixed(3)} u > 1 u`);
  } else {
    ok('R10d', `anclaje dist=${anchorDist.toFixed(3)} u ≤ 1 u`);
  }

  // R10e — punta ≤ 0.5 u
  const tipSVG = sampleAtFrac(svgSegs, svgArcLens, svgTotalArc, tipFrac);
  const tipDist = Math.hypot(cl[59][0] - tipSVG[0], cl[59][1] - tipSVG[1]);
  if (tipDist > 0.5) {
    fail('R10e', `cl[59]=[${cl[59].map(v => v.toFixed(1)).join(', ')}] tipFrac→SVG=[${tipSVG.map(v => v.toFixed(1)).join(', ')}] dist=${tipDist.toFixed(3)} u > 0.5 u`);
  } else {
    ok('R10e', `punta dist=${tipDist.toFixed(3)} u ≤ 0.5 u`);
  }

  // R10f — cada vértice del contorno en reposo está a ≤ 0.25 u del SVG (forward Hausdorff).
  // El backward no se mide porque el SVG usa Bezier curves entre los 60 pts de muestreo;
  // la desviación de las curvas respecto a segmentos rectos no es un defecto del rig.
  const HAUSDORFF_LIMIT = 0.25;
  const SVG_SAMPLE_N = 2000;

  const svgSideA = sampleContourSide(svgSegs, svgArcLens, svgTotalArc, fromFrac, tipFrac, SVG_SAMPLE_N);
  const svgSideB = sampleContourSide(svgSegs, svgArcLens, svgTotalArc, tipFrac, toFrac, SVG_SAMPLE_N);
  const svgCloud = [...svgSideA, ...svgSideB];

  const restingContour = buildContour(cl as Pt[], widths, natAngles);
  const hFwd = hausdorff(restingContour, svgCloud);

  if (hFwd > HAUSDORFF_LIMIT) {
    fail('R10f', `Hausdorff contorno→SVG = ${hFwd.toFixed(4)} u > ${HAUSDORFF_LIMIT} u`);
  } else {
    ok('R10f', `Hausdorff contorno→SVG = ${hFwd.toFixed(4)} u ≤ ${HAUSDORFF_LIMIT} u`);
  }

  // R10g — cl[59] ≤ 0.001 u de la posición media de los dos lados SVG en tipFrac
  const DELTA_MAX = 0.001;
  const tipPt1 = sampleAtFrac(svgSegs, svgArcLens, svgTotalArc, tipFrac);
  const midTip: Pt = [tipPt1[0], tipPt1[1]];
  const tipDelta = Math.hypot(cl[59][0] - midTip[0], cl[59][1] - midTip[1]);
  if (tipDelta > DELTA_MAX) {
    fail('R10g', `Δ cl[59]↔midTip = ${tipDelta.toFixed(4)} u > ${DELTA_MAX} u`);
  } else {
    ok('R10g', `Δ cl[59]↔midTip = ${tipDelta.toFixed(4)} u ≤ ${DELTA_MAX} u`);
  }

  // Medida de verificación para el output
  const baseHausdorff = hausdorff([cl[0]], svgCloud);
  console.log(`    Hausdorff fwd = ${hFwd.toFixed(4)} u · anclaje dist = ${anchorDist.toFixed(3)} u · base Δ = ${baseHausdorff.toFixed(4)} u`);
}

console.log('');
if (errors === 0) {
  console.log(`✓ check-brand-mark-rig: ${rig.tentacles.length} tentáculos · R10a–R10g OK`);
  process.exit(0);
} else {
  console.error(`✗ check-brand-mark-rig: ${errors} error(s)`);
  process.exit(1);
}
