/**
 * scripts/media/brand-icon-rig.ts — PERFIL `rig`: ANATOMÍA DEL IMAGOTIPO VIVO derivada del maestro (M1c F0, D-BBW-21).
 *
 * Es una transformación determinista del maestro vectorial, como cualquier otro perfil del guion: mismo maestro + mismo perfil ⇒ mismos
 * números. Lo que produce (regiones, líneas centrales y sección de los seis tentáculos) se escribe en `src/media/generated.ts` y se
 * sella en el lock; la guardia R10 (`scripts/lint/check-brand-mark-rig.ts`) vuelve a derivarlo y exige que coincida.
 *
 * El algoritmo es el paso 1 del motor de referencia aprobado (M1c §0): las funciones de contorno y marco local viven en
 * `src/behavior/brand-mark-octopus.ts` porque el motor las necesita también al arrancar (mismo código ⇒ misma geometría); aquí solo está
 * lo que se ejecuta al compilar (puntas, marcha pareada, línea central). Sin `getPointAtLength`: nada del DOM.
 */
import { OCTOPUS, sampleContour, splitSubpaths, wrapIndex, type Pt, type Rig, type RigTentacle } from '../../src/behavior/brand-mark-octopus';

export const RIG_SCHEMA = 'brand-icon-rig/v3';

/** Paso 1b: puntas = los seis máximos de giro convexo en ±CAP_SPAN_U u de arco, separadas ≥ CAP_MIN_SEP del contorno. */
export function findCaps(P: Pt[], n: number, step: number): number[] {
  const span = Math.round(OCTOPUS.CAP_SPAN_U / step);
  const ang = (i: number) => { const a = P[wrapIndex(i - 1, n)], b = P[wrapIndex(i + 1, n)]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const turn = new Float64Array(n);
  for (let i = 0; i < n; i++) { let t = 0; for (let m = -span; m < span; m++) { let d = ang(i + m + 1) - ang(i + m); d = Math.atan2(Math.sin(d), Math.cos(d)); t += d; } turn[i] = t; }
  // Signo de la convexidad por el ÁREA ORIENTADA del contorno (shoelace), no por la suma de giros del prototipo (ref:L30): el maestro
  // tiene una horquilla degenerada (`s.5,0,.8,0` en la base del tentáculo BR) cuyas dos cúspides anulan esa suma y dejan el signo al azar
  // de la coma flotante. MEDIDO (M1d F2, 2026-11-06): Chrome Σgiros = −8,5e-13 → −1; Node Σgiros = +1,3e-12 → +1 (el criterio literal
  // del prototipo elegiría aquí las muescas). El área orientada (−26 921 u²) da el signo de Chrome y las seis puntas del prototipo
  // (1946 · 2677 · 3344 · 3863 · 4542 idénticas; TR 558 frente a 559 del prototipo: meseta de giro de 4e-5 rad bajo el ruido float32
  // del muestreador de Chrome, ΔP ≈ 5e-4 u — escalado en el output de M1d). Orden de búsqueda y desempate: los del prototipo
  // (orden estable descendente por giro, separación mínima CAP_MIN_SEP).
  let area = 0;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[wrapIndex(i + 1, n)]; area += a[0] * b[1] - b[0] * a[1]; }
  const sign = Math.sign(area);
  const caps: number[] = [];
  const cand = Array.from(turn, (t, i) => [t * sign, i] as [number, number]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of cand) { if (caps.every(c => Math.min(Math.abs(c - i), n - Math.abs(c - i)) > n * OCTOPUS.CAP_MIN_SEP)) caps.push(i); if (caps.length === 6) break; }
  caps.sort((a, b) => a - b);
  return caps;
}

type Built = { start: number; end: number; w: number; l: number; c: Pt[] };

/** Paso 1c: desde la punta, marcha pareada por los dos bordes (sección más corta, ventana hacia delante) hasta sección > W_STOP·W. */
export function buildTentacle(P: Pt[], n: number, cap: number, K: number): Built {
  const O = OCTOPUS;
  const D = (i: number, j: number) => Math.hypot(P[wrapIndex(i, n)][0] - P[wrapIndex(j, n)][0], P[wrapIndex(i, n)][1] - P[wrapIndex(j, n)][1]);
  const pairs: [number, number, number][] = [];
  let j = cap + 1;
  for (let i = cap - 1; i > cap - n * O.MARCH_MAX_FRAC; i--) {
    let bj = j, bd = D(i, j);
    for (let m = j + 1; m <= j + O.MARCH_WINDOW; m++) { const dd = D(i, m); if (dd < bd) { bd = dd; bj = m; } }
    j = bj;
    pairs.push([i, j, D(i, j)]);
  }
  const ws = pairs.slice(O.W_SAMPLE[0], O.W_SAMPLE[1]).map(p => p[2]).sort((a, b) => a - b);
  const w = ws[ws.length >> 1];
  let last = pairs.length - 1;
  for (let k = O.W_SKIP; k < pairs.length; k++) if (pairs[k][2] > w * O.W_STOP) { last = k - 1; break; }
  let first = 0;
  for (let k = 0; k < last; k++) if (pairs[k][2] > w * O.W_START) { first = k; break; }
  const raw: Pt[] = [];
  for (let k = last; k >= first; k--) { const p = P[wrapIndex(pairs[k][0], n)], q = P[wrapIndex(pairs[k][1], n)]; raw.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]); }
  const sm: Pt[] = raw.map((_, k) => { let x = 0, y = 0, cc = 0; for (let m = -O.SMOOTH_HALF; m <= O.SMOOTH_HALF; m++) { const r = raw[Math.min(raw.length - 1, Math.max(0, k + m))]; x += r[0]; y += r[1]; cc++; } return [x / cc, y / cc]; });
  sm[0] = raw[0];
  const acc = [0];
  for (let k = 1; k < sm.length; k++) acc.push(acc[k - 1] + Math.hypot(sm[k][0] - sm[k - 1][0], sm[k][1] - sm[k - 1][1]));
  const l = acc[acc.length - 1];
  const c: Pt[] = [];
  for (let k = 0; k < K; k++) { const s = (l * k) / (K - 1); let m = 1; while (m < acc.length - 1 && acc[m] < s) m++; const t = (s - acc[m - 1]) / ((acc[m] - acc[m - 1]) || 1); c.push([sm[m - 1][0] + t * (sm[m][0] - sm[m - 1][0]), sm[m - 1][1] + t * (sm[m][1] - sm[m - 1][1])]); }
  return { start: pairs[last][0], end: pairs[last][1], w, l, c };
}

/** Etiquetas por orden angular de las puntas alrededor del centro del dibujo, en sentido horario desde arriba (TR, MR, BR, BL, ML, TL). */
const LABELS = ['TR', 'MR', 'BR', 'BL', 'ML', 'TL'] as const;
function labelsFor(tips: Pt[], center: Pt): string[] {
  const ang = tips.map((tip, i) => ({ i, a: ((Math.atan2(tip[1] - center[1], tip[0] - center[0]) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) }));
  ang.sort((p, q) => p.a - q.a);
  const out = new Array<string>(tips.length);
  ang.forEach((e, rank) => { out[e.i] = LABELS[rank] ?? `T${rank}`; });
  return out;
}

/** El rig v3 completo del maestro `d` (viewBox implícito en las coordenadas). */
export function deriveRig(d: string, step: number, K: number): Rig {
  const { d1 } = splitSubpaths(d);
  const { P, n, L } = sampleContour(d1, step);
  const caps = findCaps(P, n, step);
  const built = caps.map(c => buildTentacle(P, n, c, K));
  // dos regiones vecinas no comparten puntos: se corta en la mitad (ref:L38)
  for (let t = 0; t < built.length; t++) {
    const A = built[t], B = built[(t + 1) % built.length], off = t === built.length - 1 ? n : 0;
    if (A.end >= B.start + off) { const mid = Math.floor((A.end + B.start + off) / 2); A.end = mid; B.start = mid + 1 - off; }
  }
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (const p of P) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
  const center: Pt = [(minx + maxx) / 2, (miny + maxy) / 2];
  const labels = labelsFor(built.map(b => b.c[b.c.length - 1]), center);
  // La línea central se guarda EXACTA (doble precisión, M1d F2): el marco de cada punto elige su segmento k por distancia mínima y esa
  // elección es discontinua; redondear `c` a 0,001 u (M1c) cambiaba de segmento a un punto de BL y otro de TR y, en movimiento, los
  // separaba 0,17 u del prototipo (medido, R10d). Con `c` exacta los fotogramas coinciden al 0,0000 u. W y L son informativos (nadie
  // los consume en el motor) y van a 3 decimales.
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  const tentacles: RigTentacle[] = built.map((b, i) => ({ id: labels[i], start: b.start, end: b.end, w: r3(b.w), l: r3(b.l), c: b.c.map(p => [p[0], p[1]] as Pt) }));
  const ids = new Set(tentacles.map(t => t.id));
  if (ids.size !== tentacles.length) throw new Error(`[media] rig: etiquetas repetidas (${tentacles.map(t => t.id).join(',')})`);
  return { schema: RIG_SCHEMA, step, k: K, n, l: r3(L), tentacles };
}
