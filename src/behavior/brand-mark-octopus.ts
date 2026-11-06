/**
 * behavior/brand-mark-octopus.ts — S9 · IMAGOTIPO VIVO (M1c, 2026-11-05; M1d, 2026-11-06: conducta y sorteo idénticos al prototipo).
 * El motor de referencia aprobado por Zavala el 2026-11-05 (`despachos/2026-11/insumos/M1c-motor-referencia-aprobado-2026-11-05.js`)
 * es la ESPECIFICACIÓN LITERAL: conducta, movimiento y anatomía (M1d §0, «igualito»). Este código es su porte; donde difiera, gana el prototipo.
 *
 * MODELO (es la especificación; este código es su porte): varilla inextensible con marco local.
 *   1. ANATOMÍA (al compilar, `scripts/media/brand-icon-rig.ts`; aquí viven las funciones puras que usa): contorno exterior
 *      muestreado cada `STEP` u; puntas = los seis máximos de giro convexo en ±`CAP_SPAN_U` u de arco; desde cada punta, marcha
 *      pareada por los dos bordes hasta que la sección supera `W_STOP`·W (W = mediana de sección) → anclaje; línea central =
 *      puntos medios suavizados remuestreados a `K`. Resultado: el rig v3 (`src/media/generated.ts`, derivado del maestro, sellado
 *      en el lock, verificado por la guardia R10 `scripts/lint/check-brand-mark-rig.ts`).
 *   2. MARCO LOCAL (al arrancar, `prepare`): cada punto del contorno de un tentáculo guarda (k, t, u, v): segmento de la línea
 *      central, posición en él y desplazamiento en el marco (tangente, normal). Con movimiento 0 reconstruye el contorno exacto.
 *   3. DEFORMACIÓN (`deformFrame`, pura): θ(s) = θ₀(s) + A·s^ENV_EXP·g(s,t), g = onda base→punta + tres armónicos de ruido +
 *      vaivén, con frecuencia, fase y velocidad sorteadas por tentáculo en cada carga. La columna se integra con las longitudes
 *      de segmento reales × estiramiento elástico (crece hacia la punta, nunca bajo 1, pulso propio). Los puntos se recolocan
 *      con su (u, v) en el marco deformado: grosor y casquete viajan rígidos.
 *   4. MUELLES por tentáculo con k y ζ sorteados (entrada subamortiguada, salida más amortiguada). Bajo `ENERGY_REST` se
 *      restaura el `d` oficial literal y se para el bucle (D-BBW-28: el reposo es el maestro byte a byte).
 *   5. CUERPO, CABEZA Y HUECO: puntos oficiales fijos; el hueco es el subtrazado original sin tocar.
 *
 * RENDER: el motor cambia el `d` del `<path>` del mismo `<svg>` servido (sin lienzo). Sin JS, el HTML trae el oficial (I-4).
 * CONDUCTA (= prototipo, ref:L173–L185): hover con `pointerType === 'mouse'` (sin condición de media query); foco/blur como hover;
 * `pointerdown` no-ratón despierta y suelta a `WAKE_HOLD_MS` sin `preventDefault` (el enlace navega); el scroll da un impulso acotado
 * por velocidad en TODOS los dispositivos si no hay hover/foco activo. No hay despertar al cargar (M1c lo añadió; M1d lo retira).
 * QUIETUD (D-BBW-31, I-9): con `--bbf-motion-octopus-play-state: paused` no se registra ningún rAF ni oyente; solo cambia el
 * color (CSS). Pestaña oculta o fuera de pantalla: el bucle se detiene y se reanuda al volver si queda energía (ciclo de vida del
 * repo, sin equivalente en el prototipo: no cambia lo que se ve, solo evita trabajo invisible).
 * TOKENS QUE LEE (nunca repite): `--bbf-motion-octopus-play-state`. El color lo pone el CSS (`--bbf-accent` → `--bbf-text-on-base`).
 * CONSTANTES: origen «ref:Lnn» = línea del motor de referencia; clase por D-DOC-13 §2 (estático · plantilla · dinámico).
 * Tabla en docs/system/BEHAVIOR.md §12. Lo que un diseñador tocaría para cambiar el carácter está marcado dinámico.
 */

export type Pt = [number, number];
/** Punto de solo lectura (el rig generado es `as const`). Un `Pt` es asignable a un `RPt`. */
export type RPt = readonly [number, number];
export type Seg = { p0: Pt; p1: Pt; p2: Pt; p3: Pt };
export type Range = readonly [number, number];

export const OCTOPUS = Object.freeze({
  // ── Anatomía (paso 1) ──
  /** u entre muestras del contorno · ref:L7 · estático */
  STEP: 0.5,
  /** muestras de la línea central · ref:L8 · estático */
  K: 72,
  /** semiventana de arco (u) para medir el giro de un casquete · ref:L28 · estático */
  CAP_SPAN_U: 12,
  /** separación mínima entre puntas, fracción del contorno · ref:L35 · estático */
  CAP_MIN_SEP: 0.05,
  /** alcance máximo de la marcha pareada desde la punta, fracción del contorno · ref:L55 · estático */
  MARCH_MAX_FRAC: 0.2,
  /** ventana hacia delante (muestras) al buscar el par de sección más corta · ref:L57 · estático */
  MARCH_WINDOW: 60,
  /** tramo de pares [desde, hasta) sobre el que se toma la mediana de sección W · ref:L61 · estático */
  W_SAMPLE: [60, 200] as Range,
  /** pares que se saltan antes de buscar el anclaje · ref:L64 · estático */
  W_SKIP: 40,
  /** el anclaje es el último par con sección ≤ W_STOP·W · ref:L64 · estático */
  W_STOP: 1.12,
  /** la punta de la línea central es el primer par con sección > W_START·W · ref:L66 · estático */
  W_START: 0.8,
  /** semiventana (puntos) del suavizado de la línea central · ref:L70 · estático */
  SMOOTH_HALF: 4,

  // ── Movimiento (paso 3) · rangos de sorteo por tentáculo en cada carga; el carácter aprobado · dinámico ──
  /** envolvente de amplitud s^ENV_EXP (≈ 0 en la base, máxima en la punta) · ref:L123 · dinámico */
  ENV_EXP: 1.6,
  /** onda base→punta: número de onda, velocidad, amplitud · ref:L108 · dinámico */
  WAVE_K: [0.8, 1.3] as Range,
  WAVE_W: [2.2, 3.4] as Range,
  WAVE_A: [0.4, 0.55] as Range,
  /** tres armónicos de ruido: número de onda (×(m+1)·NOISE_K_GAIN), velocidad (signo alterno), amplitud (/(m+1)) · ref:L109 · dinámico */
  NOISE_HARMONICS: 3,
  NOISE_K: [0.4, 2.2] as Range,
  NOISE_K_GAIN: 0.6,
  NOISE_W: [0.6, 2.4] as Range,
  NOISE_A: [0.1, 0.22] as Range,
  /** vaivén de todo el tentáculo: velocidad y amplitud (signo al azar) · ref:L110 · dinámico */
  SWAY_W: [0.5, 1.1] as Range,
  SWAY_A: [0.24, 0.38] as Range,
  /** estiramiento elástico: ganancia, velocidad del pulso; pulso = BASE + AMP·sin; crece como s^EXP·GAIN hacia la punta · ref:L112,L128 · dinámico */
  STRETCH_A: [0.1, 0.15] as Range,
  STRETCH_W: [1.4, 2.4] as Range,
  STRETCH_PULSE_BASE: 0.65,
  STRETCH_PULSE_AMP: 0.35,
  STRETCH_EXP: 1.2,
  STRETCH_GAIN: 1.8,
  /** fase inicial del reloj de cada tentáculo (s) · ref:L113 · dinámico */
  TIME0: [0, 100] as Range,
  /** fase de las ondas (rad) · ref:L108 · estático */
  PHASE: [0, 6.28] as Range,

  // ── Muelles (paso 4) · plantilla ──
  /** entrada (puntero/foco): rigidez y amortiguamiento (subamortiguado) · ref:L111 · plantilla */
  SPRING_K_ON: [26, 40] as Range,
  SPRING_Z_ON: [0.42, 0.55] as Range,
  /** salida: rigidez y amortiguamiento (más amortiguado) · ref:L111 · plantilla */
  SPRING_K_OFF: [9, 14] as Range,
  SPRING_Z_OFF: [0.62, 0.78] as Range,
  /** retardo sorteado por el prototipo y nunca leído (ref:L103). Se sortea igual para que la SECUENCIA de `random` sea la del prototipo:
   *  con la misma semilla, ambos motores dan los mismos parámetros (M1d §0 dif. 6). · plantilla */
  SPRING_DELAY: [0, 0.12] as Range,
  /** energía (Σ|x|+|v|) bajo la cual se restaura el oficial y se para el bucle · ref:L167 · estático */
  ENERGY_REST: 0.004,
  /** paso de tiempo máximo y por defecto (s) · ref:L153 · estático */
  DT_MAX: 0.033,
  DT_DEFAULT: 0.016,

  // ── Conducta (= prototipo, M1d F1) ──
  /** impulso de scroll (todos los dispositivos, si no hay hover/foco activo): ganancia sobre px/ms, tope, dispersión por tentáculo · ref:L182–L183 · dinámico */
  SCROLL_GAIN: 0.9,
  SCROLL_IMP_MAX: 2.2,
  SCROLL_JITTER: [0.6, 1.2] as Range,
  /** toque (`pointerdown` no-ratón): tiempo que el muelle se mantiene en 1 antes de soltar (ms) · ref:L177 · plantilla */
  WAKE_HOLD_MS: 1100,
  /** decimales con los que se escribe cada coordenada en el `d` · ref:L136 · estático */
  FMT_DECIMALS: 2,
});

// ── 1 · PARSER SVG (todos los comandos, relativos y absolutos, subtrazados; M1b F1) ───────────────────────────────

export function parseSVGPath(d: string): Seg[] {
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
    p0: [x0, y0], p1: [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3], p2: [x0 + 2 * (x1 - x0) / 3, y0 + 2 * (y1 - y0) / 3], p3: [x1, y1],
  });
  const cubicSeg = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): Seg => ({ p0: [cx, cy], p1: [x1, y1], p2: [x2, y2], p3: [x3, y3] });
  for (const { cmd, args } of cmds) {
    switch (cmd) {
      case 'M': cx = args[0]; cy = args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; } lastCmd = 'M'; break;
      case 'm': cx += args[0]; cy += args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; } lastCmd = 'm'; break;
      case 'Z': case 'z':
        if (cx !== startX || cy !== startY) segs.push(lineSeg(cx, cy, startX, startY));
        cx = startX; cy = startY; lastCmd = 'Z'; break;
      case 'L': for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; } lastCmd = 'L'; break;
      case 'l': for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; } lastCmd = 'l'; break;
      case 'H': for (const x of args) { segs.push(lineSeg(cx, cy, x, cy)); cx = x; } lastCmd = 'H'; break;
      case 'h': for (const dx of args) { segs.push(lineSeg(cx, cy, cx + dx, cy)); cx += dx; } lastCmd = 'h'; break;
      case 'V': for (const y of args) { segs.push(lineSeg(cx, cy, cx, y)); cy = y; } lastCmd = 'V'; break;
      case 'v': for (const dy of args) { segs.push(lineSeg(cx, cy, cx, cy + dy)); cy += dy; } lastCmd = 'v'; break;
      case 'C': for (let i = 0; i + 5 < args.length; i += 6) { segs.push(cubicSeg(args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], args[i + 5])); lastCpx = args[i + 2]; lastCpy = args[i + 3]; cx = args[i + 4]; cy = args[i + 5]; } lastCmd = 'C'; break;
      case 'c': for (let i = 0; i + 5 < args.length; i += 6) { segs.push(cubicSeg(cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3], cx + args[i + 4], cy + args[i + 5])); lastCpx = cx + args[i + 2]; lastCpy = cy + args[i + 3]; cx += args[i + 4]; cy += args[i + 5]; } lastCmd = 'c'; break;
      case 'S': for (let i = 0; i + 3 < args.length; i += 4) { const r = /[CcSs]/.test(lastCmd); segs.push(cubicSeg(r ? 2 * cx - lastCpx : cx, r ? 2 * cy - lastCpy : cy, args[i], args[i + 1], args[i + 2], args[i + 3])); lastCpx = args[i]; lastCpy = args[i + 1]; cx = args[i + 2]; cy = args[i + 3]; } lastCmd = 'S'; break;
      case 's': for (let i = 0; i + 3 < args.length; i += 4) { const r = /[CcSs]/.test(lastCmd); segs.push(cubicSeg(r ? 2 * cx - lastCpx : cx, r ? 2 * cy - lastCpy : cy, cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3])); lastCpx = cx + args[i]; lastCpy = cy + args[i + 1]; cx += args[i + 2]; cy += args[i + 3]; } lastCmd = 's'; break;
    }
  }
  return segs;
}

function bzAt(s: Seg, t: number): Pt {
  const mt = 1 - t;
  return [
    mt * mt * mt * s.p0[0] + 3 * mt * mt * t * s.p1[0] + 3 * mt * t * t * s.p2[0] + t * t * t * s.p3[0],
    mt * mt * mt * s.p0[1] + 3 * mt * mt * t * s.p1[1] + 3 * mt * t * t * s.p2[1] + t * t * t * s.p3[1],
  ];
}

export type Flat = { pts: Pt[]; acc: number[]; total: number };

/** Polilínea fina con longitudes acumuladas: el equivalente determinista de getTotalLength/getPointAtLength (M1c F0: sin DOM). */
export function flattenPath(segs: Seg[], piecesPerUnit = 16): Flat {
  const pts: Pt[] = [];
  const acc: number[] = [];
  let total = 0;
  for (const s of segs) {
    const est = Math.hypot(s.p1[0] - s.p0[0], s.p1[1] - s.p0[1]) + Math.hypot(s.p2[0] - s.p1[0], s.p2[1] - s.p1[1]) + Math.hypot(s.p3[0] - s.p2[0], s.p3[1] - s.p2[1]);
    const m = Math.max(8, Math.min(1024, Math.ceil(est * piecesPerUnit)));
    let prev = bzAt(s, 0);
    if (pts.length === 0) { pts.push(prev); acc.push(0); }
    for (let k = 1; k <= m; k++) {
      const q = bzAt(s, k / m);
      total += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      pts.push(q); acc.push(total); prev = q;
    }
  }
  return { pts, acc, total };
}

export function pointAtLength(fl: Flat, s: number): Pt {
  const { pts, acc } = fl;
  if (s <= 0) return pts[0];
  if (s >= fl.total) return pts[pts.length - 1];
  let lo = 0, hi = acc.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (acc[mid] <= s) lo = mid; else hi = mid; }
  const t = (s - acc[lo]) / ((acc[hi] - acc[lo]) || 1);
  return [pts[lo][0] + t * (pts[hi][0] - pts[lo][0]), pts[lo][1] + t * (pts[hi][1] - pts[lo][1])];
}

export const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;

/** El trazado oficial tiene dos subtrazados: el contorno exterior (se anima por regiones) y el hueco de la cabeza (literal). */
export function splitSubpaths(dFull: string): { d1: string; dHole: string } {
  const cut = dFull.slice(1).search(/[Mm]/) + 1;
  return { d1: dFull.slice(0, cut), dHole: dFull.slice(cut) };
}

/** Paso 1a: contorno exterior muestreado cada `step` u (n = round(L/step), P[i] = punto en L·i/n). Mismo código al compilar y al arrancar. */
export function sampleContour(d1: string, step: number): { P: Pt[]; n: number; L: number } {
  const fl = flattenPath(parseSVGPath(d1));
  const L = fl.total;
  const n = Math.round(L / step);
  const P: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) P[i] = pointAtLength(fl, (L * i) / n);
  return { P, n, L };
}

// ── 2 · MARCO LOCAL ───────────────────────────────────────────────────────────────────────────────────────────────

/** Rig v3: lo que se deriva del maestro al compilar (anatomía). Las longitudes, θ₀ y el marco de cada punto se derivan de aquí. */
export type RigTentacle = { readonly id: string; readonly start: number; readonly end: number; readonly w: number; readonly l: number; readonly c: readonly RPt[] };
export type Rig = { readonly schema: string; readonly step: number; readonly k: number; readonly n: number; readonly l: number; readonly tentacles: readonly RigTentacle[] };

export type FramePt = { k: number; t: number; u: number; v: number };

export function th0Of(C: readonly RPt[]): Float64Array {
  const th0 = new Float64Array(C.length);
  for (let k = 0; k < C.length - 1; k++) th0[k] = Math.atan2(C[k + 1][1] - C[k][1], C[k + 1][0] - C[k][0]);
  th0[C.length - 1] = th0[C.length - 2];
  return th0;
}

export function dsOf(C: readonly RPt[]): Float64Array {
  const ds = new Float64Array(C.length);
  for (let k = 0; k < C.length - 1; k++) ds[k] = Math.hypot(C[k + 1][0] - C[k][0], C[k + 1][1] - C[k][1]);
  return ds;
}

/** Cada punto de la región: segmento k de la línea central, posición t en él y desplazamiento (u, v) en el marco (tangente, normal). */
export function projectPoints(P: readonly RPt[], region: number[], C: readonly RPt[]): FramePt[] {
  const th0 = th0Of(C);
  return region.map(pi => {
    const p = P[pi];
    let bk = 0, bt = 0, bd = 1e9;
    for (let k = 0; k < C.length - 1; k++) {
      const ax = C[k][0], ay = C[k][1], bx = C[k + 1][0] - ax, by = C[k + 1][1] - ay;
      let t = ((p[0] - ax) * bx + (p[1] - ay) * by) / (bx * bx + by * by); t = Math.max(0, Math.min(1, t));
      const dd = (ax + t * bx - p[0]) ** 2 + (ay + t * by - p[1]) ** 2;
      if (dd < bd) { bd = dd; bk = k; bt = t; }
    }
    const th = th0[bk], cx = C[bk][0] + bt * (C[bk + 1][0] - C[bk][0]), cy = C[bk][1] + bt * (C[bk + 1][1] - C[bk][1]);
    const dx = p[0] - cx, dy = p[1] - cy;
    return { k: bk, t: bt, u: dx * Math.cos(th) + dy * Math.sin(th), v: -dx * Math.sin(th) + dy * Math.cos(th) };
  });
}

export type TentacleRuntime = {
  id: string;
  C: readonly RPt[]; th0: Float64Array; ds: Float64Array; pts: FramePt[];
  /** el marco de cada punto en columnas tipadas (el bucle caliente no toca objetos): k · t · u · v */
  pk: Int32Array; pt: Float64Array; pu: Float64Array; pv: Float64Array;
  th: Float64Array; cx: Float64Array; cy: Float64Array; // columna deformada (scratch, reutilizado por fotograma)
  staticAfter: string; // tramo fijo del contorno que sigue a esta región, como texto
};

export type Prepared = { dRest: string; dHole: string; n: number; P: Pt[]; tentacles: TentacleRuntime[] };

const FMT_SCALE = 10 ** OCTOPUS.FMT_DECIMALS;
/** Coordenada a texto con FMT_DECIMALS decimales por aritmética entera (la conversión de coma flotante era el coste dominante del fotograma). */
function fmt(x: number): string {
  let v = (x * FMT_SCALE + (x < 0 ? -0.5 : 0.5)) | 0;
  const neg = v < 0; if (neg) v = -v;
  const ip = (v / FMT_SCALE) | 0, fp = v - ip * FMT_SCALE;
  return (neg ? '-' : '') + ip + (fp === 0 ? '' : fp < 10 ? '.0' + fp : '.' + fp);
}

/** Al arrancar: vuelve a muestrear el contorno con el MISMO código que derivó el rig, proyecta las regiones y precalcula los tramos fijos. */
export function prepare(dRest: string, rig: Rig): Prepared {
  const { d1, dHole } = splitSubpaths(dRest);
  const { P, n } = sampleContour(d1, rig.step);
  const order = [...rig.tentacles].sort((a, b) => a.start - b.start);
  const tentacles = order.map((T, o) => {
    const region: number[] = [];
    for (let i = T.start; i <= T.end; i++) region.push(wrapIndex(i, n));
    const Tn = order[(o + 1) % order.length];
    const a = T.end + 1, b = Tn.start + (o === order.length - 1 ? n : 0) - 1;
    let s = '';
    for (let i = a; i <= b; i++) { const p = P[wrapIndex(i, n)]; s += 'L' + fmt(p[0]) + ' ' + fmt(p[1]); }
    const K = T.c.length;
    const pts = projectPoints(P, region, T.c);
    const pk = Int32Array.from(pts, p => p.k), pt = Float64Array.from(pts, p => p.t), pu = Float64Array.from(pts, p => p.u), pv = Float64Array.from(pts, p => p.v);
    return { id: T.id, C: T.c, th0: th0Of(T.c), ds: dsOf(T.c), pts, pk, pt, pu, pv, th: new Float64Array(K), cx: new Float64Array(K), cy: new Float64Array(K), staticAfter: s };
  });
  return { dRest, dHole, n, P, tentacles };
}

// ── 3 · DEFORMACIÓN (pura) ────────────────────────────────────────────────────────────────────────────────────────

export type Motion = {
  wave: { k: number; w: number; ph: number; a: number };
  noise: { k: number; w: number; ph: number; a: number }[];
  sway: { w: number; ph: number; a: number };
  stretch: { a: number; w: number; ph: number };
  spring: { x: number; v: number; kOn: number; zOn: number; kOff: number; zOff: number; delay: number };
  time: number;
};

/** Sorteo por tentáculo (una vez por carga): no hay dos hovers iguales. `random` ∈ [0,1): el navegador usa Math.random; la guardia, una semilla.
 *  El ORDEN de las llamadas a `random` es el del prototipo (ref:L100–L105), `spring.delay` incluido: misma semilla ⇒ mismos parámetros (R10d). */
export function makeMotion(random: () => number): Motion {
  const rnd = (r: Range) => r[0] + random() * (r[1] - r[0]);
  const O = OCTOPUS;
  return {
    wave: { k: rnd(O.WAVE_K), w: rnd(O.WAVE_W), ph: rnd(O.PHASE), a: rnd(O.WAVE_A) },
    noise: Array.from({ length: O.NOISE_HARMONICS }, (_, m) => ({ k: rnd(O.NOISE_K) * (m + 1) * O.NOISE_K_GAIN, w: rnd(O.NOISE_W) * (m % 2 ? -1 : 1), ph: rnd(O.PHASE), a: rnd(O.NOISE_A) / (m + 1) })),
    sway: { w: rnd(O.SWAY_W), ph: rnd(O.PHASE), a: rnd(O.SWAY_A) * (random() < 0.5 ? -1 : 1) },
    spring: { x: 0, v: 0, kOn: rnd(O.SPRING_K_ON), zOn: rnd(O.SPRING_Z_ON), kOff: rnd(O.SPRING_K_OFF), zOff: rnd(O.SPRING_Z_OFF), delay: rnd(O.SPRING_DELAY) },
    stretch: { a: rnd(O.STRETCH_A), w: rnd(O.STRETCH_W), ph: rnd(O.PHASE) },
    time: rnd(O.TIME0),
  };
}

/** Columna deformada de un tentáculo en (th, cx, cy): θ(s) = θ₀(s) + amp·s^ENV_EXP·g(s,t); integración con estiramiento elástico. */
export function deformColumn(T: TentacleRuntime, M: Motion, amp: number, t: number): void {
  const { C, th0, ds, th, cx, cy } = T;
  const K1 = C.length;
  const O = OCTOPUS;
  for (let k = 0; k < K1; k++) {
    const s = k / (K1 - 1);
    const env = Math.pow(s, O.ENV_EXP);
    let g = M.wave.a * Math.sin(2 * Math.PI * M.wave.k * s - M.wave.w * t + M.wave.ph);
    for (const q of M.noise) g += q.a * Math.sin(2 * Math.PI * q.k * s + q.w * t + q.ph);
    g += M.sway.a * Math.sin(M.sway.w * t + M.sway.ph);
    th[k] = th0[k] + amp * env * g;
  }
  cx[0] = C[0][0]; cy[0] = C[0][1];
  const st = M.stretch, pulse = O.STRETCH_PULSE_BASE + O.STRETCH_PULSE_AMP * Math.sin(st.w * t + st.ph);
  for (let k = 1; k < K1; k++) {
    const e = 1 + Math.max(0, amp) * st.a * pulse * Math.pow((k - 1) / (K1 - 1), O.STRETCH_EXP) * O.STRETCH_GAIN;
    cx[k] = cx[k - 1] + ds[k - 1] * e * Math.cos(th[k - 1]);
    cy[k] = cy[k - 1] + ds[k - 1] * e * Math.sin(th[k - 1]);
  }
}

/** Posición de un punto del marco sobre la columna deformada. */
export function placePoint(p: FramePt, T: TentacleRuntime): Pt {
  const k0 = p.k;
  const a = T.th[k0], x0 = T.cx[k0] + p.t * (T.cx[k0 + 1] - T.cx[k0]), y0 = T.cy[k0] + p.t * (T.cy[k0 + 1] - T.cy[k0]);
  const c = Math.cos(a), s = Math.sin(a);
  return [x0 + p.u * c - p.v * s, y0 + p.u * s + p.v * c];
}

/** Contorno deformado de un tentáculo (puntos). Para la guardia y las medidas. */
export function deformPoints(T: TentacleRuntime, M: Motion, amp: number, t: number): Pt[] {
  deformColumn(T, M, amp, t);
  return T.pts.map(p => placePoint(p, T));
}

/**
 * Un fotograma completo como `d`: por cada tentáculo (en orden de contorno) su región deformada y el tramo fijo que le sigue; cierra
 * y añade el hueco literal. Pura: misma entrada ⇒ mismo texto, en Node y en el navegador.
 * M1d F5 (medido en el artefacto, Chrome 120 Hz, 3 ciclos de hover): esta concatenación da mediana 0,6 ms · p95 0,7 ms por fotograma;
 * un búfer de cadenas reutilizado + `join` dio mediana 0,6 · p95 0,8. Sin mejora ⇒ se conserva la forma simple.
 */
export function deformFrame(prep: Prepared, motions: Motion[], amps: number[], times: number[]): string {
  let d = '';
  for (let o = 0; o < prep.tentacles.length; o++) {
    const T = prep.tentacles[o];
    deformColumn(T, motions[o], amps[o], times[o]);
    const { th, cx, cy, pk, pt, pu, pv } = T;
    const K = th.length;
    const cs = COS_SCRATCH.length >= K ? COS_SCRATCH : new Float64Array(K), sn = SIN_SCRATCH.length >= K ? SIN_SCRATCH : new Float64Array(K);
    for (let k = 0; k < K; k++) { cs[k] = Math.cos(th[k]); sn[k] = Math.sin(th[k]); }
    let seg = o === 0 ? 'M' : 'L';
    for (let q = 0; q < pk.length; q++) {
      const k0 = pk[q], t = pt[q], u = pu[q], v = pv[q];
      const x0 = cx[k0] + t * (cx[k0 + 1] - cx[k0]), y0 = cy[k0] + t * (cy[k0 + 1] - cy[k0]);
      seg += (q === 0 ? '' : 'L') + fmt(x0 + u * cs[k0] - v * sn[k0]) + ' ' + fmt(y0 + u * sn[k0] + v * cs[k0]);
    }
    d += seg + T.staticAfter;
  }
  return d + 'Z' + prep.dHole;
}
const COS_SCRATCH = new Float64Array(OCTOPUS.K), SIN_SCRATCH = new Float64Array(OCTOPUS.K);

export function springStep(S: Motion['spring'], target: number, k: number, z: number, dt: number): void {
  S.v += (-k * (S.x - target) - 2 * z * Math.sqrt(k) * S.v) * dt;
  S.x += S.v * dt;
}

// ── 4 · LECTURA DEL DOM ──────────────────────────────────────────────────────────────────────────────────────────

/** Quietud por el rol del sistema (D-BBW-31): con movimiento reducido el rol vale `paused`. */
function isStill(): boolean {
  return getComputedStyle(document.documentElement).getPropertyValue('--bbf-motion-octopus-play-state').trim() === 'paused';
}

// ── 5 · MOTOR (solo cablea; el componente cliente solo llama a esto) ─────────────────────────────────────────────

export function startOctopus(host: HTMLElement, path: SVGPathElement, rig: Rig): () => void {
  if (isStill()) return () => {};
  const dRest = path.getAttribute('d') ?? '';
  const O = OCTOPUS;
  let prep: Prepared | null = null;
  const motions: Motion[] = rig.tentacles.map(() => makeMotion(Math.random));
  const amps = new Array<number>(motions.length).fill(0);
  const times = new Array<number>(motions.length).fill(0);
  let active = false, raf = 0, last = 0, onScreen = true;
  let wakeTimer: ReturnType<typeof setTimeout> | undefined;

  const ensure = () => (prep ??= prepare(dRest, rig));

  function frame(ts: number) {
    const p = ensure();
    const dt = Math.min(O.DT_MAX, (ts - last) / 1000 || O.DT_DEFAULT); last = ts;
    let energy = 0;
    for (let j = 0; j < motions.length; j++) {
      const M = motions[j], S = M.spring;
      M.time += dt;
      springStep(S, active ? 1 : 0, active ? S.kOn : S.kOff, active ? S.zOn : S.zOff, dt);
      energy += Math.abs(S.x) + Math.abs(S.v);
      amps[j] = S.x; times[j] = M.time;
    }
    if (!active && energy < O.ENERGY_REST) {
      path.setAttribute('d', dRest);
      raf = 0;
      for (const M of motions) { M.spring.x = 0; M.spring.v = 0; }
      return;
    }
    path.setAttribute('d', deformFrame(p, motions, amps, times));
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !document.hidden && onScreen) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function enter() { active = true; kick(); }
  function leave() { active = false; kick(); }
  const hasEnergy = () => motions.some(M => Math.abs(M.spring.x) + Math.abs(M.spring.v) >= O.ENERGY_REST);

  // = prototipo ref:L174–L177: hover solo con ratón; foco/blur; el toque (cualquier puntero que no sea ratón) despierta y suelta a
  // WAKE_HOLD_MS. Sin `preventDefault`: el enlace navega igual que en el prototipo.
  const onPointerEnter = (e: PointerEvent) => { if (e.pointerType === 'mouse') enter(); };
  const onPointerLeave = (e: PointerEvent) => { if (e.pointerType === 'mouse') leave(); };
  const onPointerDown = (e: PointerEvent) => { if (e.pointerType !== 'mouse') { enter(); clearTimeout(wakeTimer); wakeTimer = setTimeout(leave, O.WAKE_HOLD_MS); } };
  const onFocus = () => enter();
  const onBlur = () => leave();
  // = prototipo ref:L178–L185: impulso de scroll en todos los dispositivos si no hay hover/foco activo (y, del ciclo de vida del repo,
  // solo con el logo en pantalla: fuera de ella nada se ve y el bucle no debe arrancar).
  let lastY = window.scrollY, lastT = performance.now();
  const onScroll = () => {
    const now = performance.now(), v = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT); lastY = window.scrollY; lastT = now;
    if (active || !onScreen) return;
    const imp = Math.min(v * O.SCROLL_GAIN, O.SCROLL_IMP_MAX);
    for (const M of motions) M.spring.v += imp * (O.SCROLL_JITTER[0] + Math.random() * (O.SCROLL_JITTER[1] - O.SCROLL_JITTER[0]));
    kick();
  };
  const onVisibility = () => { if (document.hidden) halt(); else if (active || hasEnergy()) kick(); };
  const io = new IntersectionObserver(entries => {
    onScreen = entries[0]?.isIntersecting ?? true;
    if (!onScreen) halt(); else if (active || hasEnergy()) kick();
  });

  host.addEventListener('pointerenter', onPointerEnter, { passive: true });
  host.addEventListener('pointerleave', onPointerLeave, { passive: true });
  host.addEventListener('pointerdown', onPointerDown, { passive: true });
  host.addEventListener('focus', onFocus, { passive: true });
  host.addEventListener('blur', onBlur, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  // La anatomía se prepara en un hueco ocioso tras el primer pintado (no en el primer fotograma del hover). El observador solo gobierna
  // el ciclo de vida (parar fuera de pantalla): no despierta nada por sí mismo.
  const hasIdle = 'requestIdleCallback' in window;
  const idle: number | ReturnType<typeof setTimeout> = hasIdle ? window.requestIdleCallback(() => { ensure(); io.observe(host); }) : setTimeout(() => { ensure(); io.observe(host); }, 0);

  return () => {
    halt();
    clearTimeout(wakeTimer);
    if (hasIdle) window.cancelIdleCallback(idle as number); else clearTimeout(idle as ReturnType<typeof setTimeout>);
    io.disconnect();
    host.removeEventListener('pointerenter', onPointerEnter);
    host.removeEventListener('pointerleave', onPointerLeave);
    host.removeEventListener('pointerdown', onPointerDown);
    host.removeEventListener('focus', onFocus);
    host.removeEventListener('blur', onBlur);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    path.setAttribute('d', dRest);
  };
}
