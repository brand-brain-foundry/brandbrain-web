/**
 * scripts/lint/check-brand-mark-rig.ts — R10 · GUARDIA DEL RIG DEL IMAGOTIPO
 *
 * Verifica que media/masters/brand-icon-rig.json es consistente con brand-icon.svg:
 *   R10a — el JSON parsea y tiene el schema esperado.
 *   R10b — totalArcLen coincide con la longitud calculada del path oficial (tolerancia 1 %).
 *   R10c — cada tentáculo: fromFrac < anchorFrac < tipFrac < toFrac y todas las fracciones en [0, 1].
 *   R10d — los tentáculos no se solapan entre sí.
 *   R10e — el punto en tipFrac de cada tentáculo está a > minTipDist u del centro del viewBox.
 *
 * Uso: pnpm lint:rig
 * --test-fail: altera totalArcLen antes de la comprobación para demostrar el fallo (I-7).
 */

import { readFileSync } from "fs";
import path from "path";

const REPO = path.resolve(process.cwd());
const SVG_PATH = path.join(REPO, "media/masters/brand-icon.svg");
const RIG_PATH = path.join(REPO, "media/masters/brand-icon-rig.json");

// ---- tipos (mínimos para la validación) ----
interface TentaclePhys { a1:number; w1:number; a2:number; w2:number; phase:number; releaseDelay:number; }
interface Tentacle { id:string; label:string; fromFrac:number; anchorFrac:number; tipFrac:number; toFrac:number; phys:TentaclePhys; }
interface RigData { _schema:string; source:string; viewBox:[number,number,number,number]; totalArcLen:number; center:[number,number]; minTipDist:number; tentacles:Tentacle[]; }

type Pt = [number, number];
type Seg = { p0:Pt; p1:Pt; p2:Pt; p3:Pt };

// ---- parseo del path SVG (solo M + c) ----
function parsePath(d: string): Seg[] {
  const segs: Seg[] = [];
  const tokens = d.match(/[MmCcZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  let cx = 0, cy = 0, cmd = "", args: number[] = [];

  function flush() {
    if (cmd === "M" || cmd === "m") { cx = args[0]; cy = args[1]; return; }
    if (cmd === "c") {
      for (let i = 0; i + 5 < args.length; i += 6) {
        const x0 = cx, y0 = cy;
        segs.push({ p0:[x0,y0], p1:[cx+args[i],cy+args[i+1]], p2:[cx+args[i+2],cy+args[i+3]], p3:[cx+args[i+4],cy+args[i+5]] });
        cx += args[i+4]; cy += args[i+5];
      }
    }
  }

  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (/[MmCcZz]/i.test(tok)) { flush(); cmd = tok; args = []; i++; }
    else {
      args.push(parseFloat(tok)); i++;
      if (cmd === "c" && args.length >= 6 && args.length % 6 === 0) {
        flush(); args = []; cx = segs[segs.length-1].p3[0]; cy = segs[segs.length-1].p3[1];
      }
    }
  }
  flush();
  return segs;
}

function sample(s: Seg, t: number): Pt {
  const mt = 1 - t;
  return [
    mt*mt*mt*s.p0[0] + 3*mt*mt*t*s.p1[0] + 3*mt*t*t*s.p2[0] + t*t*t*s.p3[0],
    mt*mt*mt*s.p0[1] + 3*mt*mt*t*s.p1[1] + 3*mt*t*t*s.p2[1] + t*t*t*s.p3[1],
  ];
}

function segLen(s: Seg, n = 30): number {
  let l = 0, p = sample(s, 0);
  for (let i = 1; i <= n; i++) { const q = sample(s, i/n); l += Math.hypot(q[0]-p[0], q[1]-p[1]); p = q; }
  return l;
}

function computeTotalArc(segs: Seg[]): number {
  return segs.reduce((a, s) => a + segLen(s, 30), 0);
}

/** muestrea el path en la fracción dada (0..1) de longitud de arco; devuelve la posición */
function sampleAtFrac(segs: Seg[], totalArc: number, frac: number): Pt {
  const target = frac * totalArc;
  let acc = 0;
  for (const seg of segs) {
    const len = segLen(seg, 30);
    if (acc + len >= target) {
      const t = (target - acc) / len;
      return sample(seg, Math.max(0, Math.min(1, t)));
    }
    acc += len;
  }
  return segs[segs.length-1].p3;
}

// ---- lectura de archivos ----
function loadRig(): RigData {
  const raw = readFileSync(RIG_PATH, "utf-8");
  const rig = JSON.parse(raw) as RigData;
  if (rig._schema !== "brand-icon-rig/v1") throw new Error(`schema desconocido: ${rig._schema}`);
  if (!Array.isArray(rig.tentacles) || rig.tentacles.length !== 6) throw new Error("se esperan exactamente 6 tentáculos");
  return rig;
}

// ---- comprobaciones ----
let errors = 0;
function fail(msg: string) { console.error(`  ✗ ${msg}`); errors++; }
function pass(msg: string) { console.log(`  ✓ ${msg}`); }

function run(rig: RigData) {
  const svgSrc = readFileSync(SVG_PATH, "utf-8");
  const dMatch = svgSrc.match(/ d="([^"]+)"/);
  if (!dMatch) { fail("R10a: no se encontró el path en brand-icon.svg"); return; }

  const segs = parsePath(dMatch[1]);
  const computedArc = computeTotalArc(segs);
  const [cx, cy] = rig.center;

  // R10a: schema ya validado en loadRig()
  pass("R10a: schema brand-icon-rig/v1 ✓");

  // R10b: longitud de arco ± 1 %
  const arcErr = Math.abs(computedArc - rig.totalArcLen) / computedArc;
  if (arcErr > 0.01) {
    fail(`R10b: totalArcLen en rig = ${rig.totalArcLen.toFixed(1)} vs calculado = ${computedArc.toFixed(1)} (error ${(arcErr*100).toFixed(2)} % > 1 %)`);
  } else {
    pass(`R10b: totalArcLen ${rig.totalArcLen.toFixed(1)} u ≈ calculado ${computedArc.toFixed(1)} u (Δ ${(arcErr*100).toFixed(2)} %)`);
  }

  // R10c + R10d: orden y no solapamiento
  const ranges = rig.tentacles.map(t => ({ id: t.id, from: t.fromFrac, anchor: t.anchorFrac, tip: t.tipFrac, to: t.toFrac }));
  for (const r of ranges) {
    if (!(r.from >= 0 && r.from < r.anchor && r.anchor < r.tip && r.tip < r.to && r.to <= 1)) {
      fail(`R10c: ${r.id} — orden inválido: from=${r.from} anchor=${r.anchor} tip=${r.tip} to=${r.to}`);
    } else {
      pass(`R10c: ${r.id} orden OK [${r.from}…${r.to}]`);
    }
  }
  // solapamiento: sort por fromFrac
  const sorted = [...ranges].sort((a, b) => a.from - b.from);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].to > sorted[i+1].from) {
      fail(`R10d: solapamiento entre ${sorted[i].id} (to=${sorted[i].to}) y ${sorted[i+1].id} (from=${sorted[i+1].from})`);
    }
  }
  pass("R10d: sin solapamientos entre tentáculos");

  // R10e: cada tipFrac apunta a un punto lejano del centro (> minTipDist u)
  for (const t of rig.tentacles) {
    const [tx, ty] = sampleAtFrac(segs, computedArc, t.tipFrac);
    const dist = Math.hypot(tx - cx, ty - cy);
    if (dist < rig.minTipDist) {
      fail(`R10e: ${t.id} tipFrac=${t.tipFrac} → (${tx.toFixed(1)}, ${ty.toFixed(1)}) dist=${dist.toFixed(1)} u < ${rig.minTipDist} u del centro`);
    } else {
      pass(`R10e: ${t.id} tipFrac=${t.tipFrac} → (${tx.toFixed(1)}, ${ty.toFixed(1)}) dist=${dist.toFixed(1)} u > ${rig.minTipDist} u ✓`);
    }
  }
}

// ---- main ----
const testFail = process.argv.includes("--test-fail");
console.log(`\n=== check-brand-mark-rig${testFail ? " [--test-fail]" : ""} ===\n`);

try {
  const rig = loadRig();
  if (testFail) {
    console.log("  [--test-fail] alterando totalArcLen de", rig.totalArcLen, "→ 1234.5");
    (rig as { totalArcLen: number }).totalArcLen = 1234.5;
  }
  run(rig);
} catch (e) {
  fail(`R10a: ${(e as Error).message}`);
}

console.log();
if (errors > 0) {
  console.error(`FALLO: ${errors} error${errors > 1 ? "es" : ""}`);
  process.exit(1);
} else {
  console.log("OK: todas las comprobaciones del rig pasaron");
}
