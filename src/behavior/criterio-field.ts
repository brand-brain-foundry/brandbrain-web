/**
 * behavior/criterio-field.ts — S8 · CAMPO DEL CRITERIO (F2, 2026-11-02; conducta en OUTPUT-BBW-2026-11-01-F0 §4).
 *
 * QUÉ HACE: una rejilla de puntos donde corren carriles de «texto» (tramos de puntos). Cada 4,1 s una CONSULTA barre una banda de
 * carriles con un cursor, enciende los aciertos que encuentra, cierra la banda con dos corchetes, saca a la derecha una barra por carril
 * con su número de aciertos y se disuelve punto a punto. Es la imagen del método: el criterio escrito, leído y consultado.
 *
 * PROCEDENCIA (C14): implementación PROPIA a partir de la especificación de conducta de F0 §4. El archivo de la referencia
 * (`handoff-diseno/src/criterio-field.js`) no se ha abierto. PRNG mulberry32 y hash entero propios; todo es determinista por semilla.
 *
 * TRES PARTES:
 *   1. ALGORITMO (puro): patrones de carril, ventanas de vida, consultas y su línea de tiempo → lista de puntos por color.
 *   2. LECTURA DEL DOM (marcada): tamaño de la placa, interlineado y posición del primer párrafo, colores de los roles.
 *   3. MOTOR (`startCriterioField`): lienzo, reloj a 10 fps con `setTimeout`, quietud. Lo cablea el componente cliente.
 *
 * TOKENS QUE LEE (nunca repite; BEHAVIOR.md §1.2): `--bbf-field-lane`, `--bbf-field-lane-live`, `--bbf-field-read`, `--bbf-field-hit`,
 * `--bbf-text-on-base` (colores, resueltos por el navegador en un elemento sonda) y `--bbf-motion-loop-play-state` (quietud: con
 * movimiento reducido vale `paused`, se pinta UN fotograma y el bucle no arranca, I-9).
 *
 * CONSTANTES: origen «F0 §4.n»; clase por D-DOC-13 §2 (estático · plantilla · dinámico). Tabla en docs/system/BEHAVIOR.md §11.
 */

export const CRITERIO_FIELD = Object.freeze({
  /** semilla del generador · plantilla: cambiarla cambia la disposición, no la conducta */
  SEED: 0x5a7c_c0b5,
  /** lado del punto en px CSS · dinámico (carácter) · F0 §4.0.1 */
  DOT: 3,
  /** modo amplio: placa mínima y razón paso/interlineado · plantilla · F0 §4.1 */
  WIDE_MIN_W: 480,
  WIDE_MIN_H: 160,
  LINE_DIVISIONS: 7,
  /** separación de carriles en filas (amplio / estrecho) y paso fijo del estrecho · plantilla · F0 §4.0.2, §4.1 */
  LANE_STEP_WIDE: 7,
  LANE_STEP_NARROW: 4,
  NARROW_PITCH: 4,
  NARROW_FIRST_ROW: 1,
  /** densidad de píxel máxima del lienzo · estático · F0 §4.1 */
  DPR_CAP: 2,
  /** borde suave en columnas (amplio: solo izquierda; estrecho: los dos extremos) · dinámico · F0 §4.1 */
  EDGE_WIDE: 28,
  EDGE_NARROW: 14,
  /** patrón de carril · dinámico · F0 §4.2 */
  PATTERN_LENGTH: 2048,
  RUN_MIN: 2,
  RUN_SPAN: 34,
  GAP_MIN: 6,
  GAP_SPAN: 110,
  GAP_EXP: 1.5,
  GAP_GAIN_SHORT: 0.35,
  GAP_GAIN_TALL: 0.75,
  GAP_TALL_ROWS: 40,
  DEPTHS: Object.freeze([0.94, 0.86, 0.74]),
  SPARSE_SHARE: 0.25,
  DEPTH_GROUP: 3,
  STRONG_SHARE: 0.16,
  /** carriles vivos · dinámico · F0 §4.2 */
  LIVE_WINDOW_S: 2.6,
  LIVE_SHARE: 0.34,
  /** reloj: un fotograma = una posición de avance · estático · F0 §4.2, §4.4 */
  FRAME_MS: 100,
  /** consulta · dinámico · F0 §4.3 */
  QUERY_FIRST_S: 1.2,
  QUERY_EVERY_S: 4.1,
  QUERY_LIFE_S: 3.38,
  SWEEP_END_S: 0.76,
  RESULT_END_S: 1.18,
  DISSOLVE_START_S: 2.48,
  BAND_MAX_SHARE: 0.34,
  BAND_BASE: 16,
  BAND_SPAN_SHARE: 0.24,
  BAR_MAX: 30,
  BAR_MIN: 8,
  BAR_SHARE: 0.18,
  BAR_PER_HIT: 4,
  BAR_GAP: 2,
  BAND_START_WIDE: 30,
  BAND_START_NARROW: 4,
  BAND_LANES_MIN: 3,
  BAND_LANES_MAX: 7,
  BAND_LANES_NARROW: 12,
  HIT_EXTRA_SHARE: 0.2,
  TRAMA_EVERY: 3,
  /** fotograma único con movimiento reducido (una consulta resuelta) · estático · F0 §4.4 */
  STILL_AT_S: 2.7,
});

const C = CRITERIO_FIELD;

// ── 1 · ALGORITMO (puro) ──────────────────────────────────────────────────────────────────────────────────

/** mulberry32: generador de 32 bits, determinista por semilla. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash entero de tres enteros → [0, 1). Azar fijo por posición (no por fotograma). */
export function hash3(a: number, b: number, c: number): number {
  let h = (Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1) ^ C.SEED) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Patrón cíclico de un carril: 0 vacío · 1 lleno · 2 lleno y candidato fuerte a acierto. */
export function lanePattern(lane: number, depth: number, tall: boolean): Uint8Array {
  const rnd = mulberry32(C.SEED + lane * 7919);
  const out = new Uint8Array(C.PATTERN_LENGTH);
  const gain = tall ? C.GAP_GAIN_TALL : C.GAP_GAIN_SHORT;
  let i = Math.floor(rnd() * C.GAP_MIN * 4);
  while (i < C.PATTERN_LENGTH) {
    const run = C.RUN_MIN + Math.floor(rnd() * rnd() * C.RUN_SPAN);
    for (let k = 0; k < run && i < C.PATTERN_LENGTH; k++, i++) {
      if (rnd() < depth) out[i] = rnd() < C.STRONG_SHARE ? 2 : 1;
    }
    i += C.GAP_MIN + Math.floor(Math.pow(rnd(), C.GAP_EXP) * C.GAP_SPAN * gain);
  }
  return out;
}

/** Profundidad por grupo de tres carriles: 25 % la más rala, el resto mitad y mitad entre las otras dos. */
export function laneDepth(lane: number): number {
  const g = Math.floor(lane / C.DEPTH_GROUP);
  const r = hash3(g, 11, 0);
  if (r < C.SPARSE_SHARE) return C.DEPTHS[2];
  return r < C.SPARSE_SHARE + (1 - C.SPARSE_SHARE) / 2 ? C.DEPTHS[1] : C.DEPTHS[0];
}

export type Geometry = {
  wide: boolean;
  /** primera columna dibujable: en el héroe oscuro el escenario pasa por DEBAJO del bloque de texto, y los carriles nacen a su derecha
   *  (2026-11-02, medido: con el campo bajo los párrafos el contraste caía a 1,67 a 1440). 0 cuando el texto no comparte filas con la placa. */
  start: number;
  pitch: number;
  cols: number;
  rows: number;
  /** fila superior de cada carril (un carril ocupa esa fila y la siguiente) */
  laneRows: number[];
};

/** Geometría a partir de lo medido. `lineHeight`/`lineOffset` = interlineado del primer párrafo y centro de una de sus líneas,
 *  en px relativos al borde superior de la placa (null si no hay párrafo). */
export function geometry(width: number, height: number, lineHeight: number | null, lineOffset: number | null, textRight = 0): Geometry {
  const wide = width >= C.WIDE_MIN_W && height >= C.WIDE_MIN_H && lineHeight !== null && lineOffset !== null;
  const pitch = wide ? (lineHeight as number) / C.LINE_DIVISIONS : C.NARROW_PITCH;
  const cols = Math.max(0, Math.floor(width / pitch));
  const rows = Math.max(0, Math.floor(height / pitch));
  const start = Math.min(cols, Math.max(0, Math.ceil(textRight / pitch)));
  const step = wide ? C.LANE_STEP_WIDE : C.LANE_STEP_NARROW;
  let first = C.NARROW_FIRST_ROW;
  if (wide) {
    // el centro del carril (entre sus dos filas) es (fila + 1) × paso; se alinea con el centro de una línea del párrafo
    const target = Math.round((lineOffset as number) / pitch) - 1;
    first = ((target % step) + step) % step;
  }
  const laneRows: number[] = [];
  for (let r = first; r + 1 < rows; r += step) laneRows.push(r);
  return { wide, start, pitch, cols, rows, laneRows };
}

export type Query = {
  index: number;
  start: number;
  bandStart: number;
  bandWidth: number;
  barMax: number;
  firstLane: number;
  laneCount: number;
};

/** La consulta número `index`, decidida por azar fijo. */
export function query(index: number, g: Geometry): Query | null {
  const nLanes = g.laneRows.length;
  if (nLanes === 0 || g.cols < C.BAND_BASE) return null;
  const a = hash3(index, 23, 1);
  const bandWidth = Math.max(1, Math.round(Math.min(C.BAND_MAX_SHARE * g.cols, C.BAND_BASE + a * C.BAND_SPAN_SHARE * g.cols)));
  const barMax = Math.min(C.BAR_MAX, Math.max(C.BAR_MIN, Math.round(C.BAR_SHARE * g.cols)));
  const wanted = g.start + (g.wide ? C.BAND_START_WIDE : C.BAND_START_NARROW);
  const bandStart = Math.max(g.start + 1, Math.min(wanted, g.cols - bandWidth - C.BAR_GAP - barMax));
  if (bandStart + bandWidth + C.BAR_GAP >= g.cols) return null;
  const maxLanes = g.wide ? C.BAND_LANES_MAX : C.BAND_LANES_NARROW;
  const span = Math.min(nLanes, C.BAND_LANES_MIN + Math.floor(hash3(index, 29, 2) * (maxLanes - C.BAND_LANES_MIN + 1)), maxLanes);
  const firstLane = Math.floor(hash3(index, 31, 3) * (nLanes - span + 1));
  return { index, start: C.QUERY_FIRST_S + index * C.QUERY_EVERY_S, bandStart, bandWidth, barMax, firstLane, laneCount: span };
}

/** La consulta activa en el instante `t` (o null). */
export function activeQuery(t: number, g: Geometry): Query | null {
  if (t < C.QUERY_FIRST_S) return null;
  const index = Math.floor((t - C.QUERY_FIRST_S) / C.QUERY_EVERY_S);
  const q = query(index, g);
  return q && t - q.start < C.QUERY_LIFE_S ? q : null;
}

/** ¿Está vivo el carril en el instante `t`? Ventanas de 2,6 s; un 34 % de los carriles por ventana. */
export function isLive(lane: number, t: number): boolean {
  return hash3(lane, Math.floor(t / C.LIVE_WINDOW_S), 5) < C.LIVE_SHARE;
}

export type Field = { g: Geometry; patterns: Uint8Array[]; shift: Int32Array };

export function createField(g: Geometry): Field {
  const tall = g.rows >= C.GAP_TALL_ROWS;
  const patterns = g.laneRows.map((_, lane) => lanePattern(lane, laneDepth(lane), tall));
  const shift = new Int32Array(g.laneRows.length);
  for (let lane = 0; lane < shift.length; lane++) shift[lane] = Math.floor(hash3(lane, 37, 4) * C.PATTERN_LENGTH);
  return { g, patterns, shift };
}

const inBand = (q: Query | null, lane: number) => q !== null && lane >= q.firstLane && lane < q.firstLane + q.laneCount;

/** Un fotograma de avance: cada carril vivo fuera de la banda activa se mueve una posición a la izquierda. */
export function advance(f: Field, t: number): void {
  const q = activeQuery(t, f.g);
  for (let lane = 0; lane < f.shift.length; lane++) {
    if (isLive(lane, t) && !inBand(q, lane)) f.shift[lane] = (f.shift[lane] + 1) % C.PATTERN_LENGTH;
  }
}

/** Colores por rol (índices del dibujo). */
export const INK = { lane: 0, live: 1, read: 2, hit: 3, cursor: 4 } as const;
export type Ink = (typeof INK)[keyof typeof INK];

/** Dibujo de un fotograma: llama a `dot(col, row, ink)` por cada punto visible. Puro. */
export function frame(f: Field, t: number, dot: (col: number, row: number, ink: Ink) => void): void {
  const { g, patterns, shift } = f;
  const L = C.PATTERN_LENGTH;
  const edge = g.wide ? C.EDGE_WIDE : C.EDGE_NARROW;
  const soft = (col: number, row: number) => {
    if (col < g.start) return false;
    const fromLeft = col - g.start < edge ? (col - g.start) / edge : 1;
    const fromRight = !g.wide && g.cols - 1 - col < edge ? (g.cols - 1 - col) / edge : 1;
    const p = Math.min(fromLeft, fromRight);
    return p >= 1 || hash3(col, row, 7) < p;
  };
  const q = activeQuery(t, g);
  const age = q ? t - q.start : 0;
  const alive = (col: number, row: number) => !q || age < C.DISSOLVE_START_S || age < C.DISSOLVE_START_S + hash3(col, row, q.index + 101) * (C.QUERY_LIFE_S - C.DISSOLVE_START_S);
  const sweep = q ? Math.min(1, age / C.SWEEP_END_S) : 0;
  const cursorCol = q ? q.bandStart + Math.round((1 - (1 - sweep) * (1 - sweep)) * q.bandWidth) : -1;
  const bandEnd = q ? q.bandStart + q.bandWidth : -1;

  for (let lane = 0; lane < g.laneRows.length; lane++) {
    const r0 = g.laneRows[lane];
    const ink: Ink = isLive(lane, t) ? INK.live : INK.lane;
    const banded = inBand(q, lane);
    let hits = 0;
    for (let col = 0; col < g.cols; col++) {
      const v = patterns[lane][(shift[lane] + col) % L];
      if (v === 0) continue;
      let k: Ink = ink;
      if (banded && q && col >= q.bandStart && col < bandEnd) {
        const strong = v === 2 || hash3(lane, (shift[lane] + col) % L, q.index + 53) < C.HIT_EXTRA_SHARE;
        if (strong) {
          hits++;
          if (col <= cursorCol && alive(col, r0)) k = INK.read;
        }
      }
      if (soft(col, r0)) dot(col, r0, k);
      if (soft(col, r0 + 1)) dot(col, r0 + 1, k);
    }
    if (!banded || !q || age < C.SWEEP_END_S || hits === 0) continue;
    // barras: aparecen de arriba abajo durante la fase de resultado y crecen hacia la derecha
    const order = (lane - q.firstLane) / Math.max(1, q.laneCount);
    const local = (age - C.SWEEP_END_S) / (C.RESULT_END_S - C.SWEEP_END_S) - order;
    const grow = Math.max(0, Math.min(1, local * q.laneCount));
    const len = Math.round(Math.min(q.barMax, C.BAR_PER_HIT * hits) * grow);
    for (let i = 0; i < len; i++) {
      const col = bandEnd + C.BAR_GAP + i;
      if (col >= g.cols) break;
      for (const row of [r0, r0 + 1]) if (alive(col, row)) dot(col, row, i === 0 ? INK.hit : INK.read);
    }
  }

  if (!q) return;
  const top = g.laneRows[q.firstLane];
  const bottom = g.laneRows[q.firstLane + q.laneCount - 1] + 1;
  // trama tenue tras el cursor, en la fila intermedia entre carriles
  for (let lane = q.firstLane; lane < q.firstLane + q.laneCount - 1; lane++) {
    const mid = Math.round((g.laneRows[lane] + 1 + g.laneRows[lane + 1]) / 2);
    for (let col = q.bandStart; col <= cursorCol; col += C.TRAMA_EVERY) if (alive(col, mid)) dot(col, mid, INK.lane);
  }
  // cursor durante el barrido; corchetes en la fase de resultado y después
  for (let row = top; row <= bottom; row++) {
    if (alive(cursorCol, row)) dot(Math.min(cursorCol, g.cols - 1), row, INK.cursor);
    if (age >= C.SWEEP_END_S && alive(q.bandStart - 1, row)) dot(q.bandStart - 1, row, INK.live);
  }
}

// ── 2 · LECTURA DEL DOM (mide) ────────────────────────────────────────────────────────────────────────────

const ROLES = ["--bbf-field-lane", "--bbf-field-lane-live", "--bbf-field-read", "--bbf-field-hit", "--bbf-text-on-base"] as const;

/** Lee los colores de los roles tal como el navegador los resuelve (un elemento sonda: los tokens llevan `calc()` dentro). */
export function readColors(host: HTMLElement): string[] {
  const probe = document.createElement("span");
  probe.style.display = "none";
  host.appendChild(probe);
  const out = ROLES.map((role) => {
    probe.style.color = `var(${role})`;
    return getComputedStyle(probe).color;
  });
  probe.remove();
  return out;
}

/** Quietud del sistema: el rol de bucles vale `paused` con movimiento reducido (semantic/motion.css). */
export function isStill(): boolean {
  return getComputedStyle(document.documentElement).getPropertyValue("--bbf-motion-loop-play-state").trim() === "paused";
}

/** Interlineado del párrafo y centro de su primera línea respecto de la placa (o null si no hay párrafo). */
export function readLine(
  plate: HTMLElement,
  line: HTMLElement | null,
): { lineHeight: number | null; lineOffset: number | null; textRight: number } {
  if (!line) return { lineHeight: null, lineOffset: null, textRight: 0 };
  const p = plate.getBoundingClientRect();
  // el BLOQUE de texto (el padre de la línea de referencia): si comparte filas con la placa, los carriles empiezan a su derecha
  const block = (line.parentElement ?? line).getBoundingClientRect();
  const overlaps = block.bottom > p.top && block.top < p.bottom;
  const textRight = overlaps ? Math.max(0, block.right - p.left) : 0;
  const lh = parseFloat(getComputedStyle(line).lineHeight);
  if (!Number.isFinite(lh)) return { lineHeight: null, lineOffset: null, textRight };
  return { lineHeight: lh, lineOffset: line.getBoundingClientRect().top + lh / 2 - p.top, textRight };
}

// ── 3 · MOTOR ─────────────────────────────────────────────────────────────────────────────────────────────

/** Arranca el campo sobre `canvas` (que llena `plate`). Devuelve la función que lo detiene y limpia. */
export function startCriterioField(canvas: HTMLCanvasElement, plate: HTMLElement, line: HTMLElement | null): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let field: Field | null = null;
  let colors = readColors(plate);
  let t0 = performance.now();
  let pausedAt: number | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastT = 0;

  const layout = () => {
    const w = plate.clientWidth;
    const h = plate.clientHeight;
    const dpr = Math.min(C.DPR_CAP, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { lineHeight, lineOffset, textRight } = readLine(plate, line);
    field = createField(geometry(w, h, lineHeight, lineOffset, textRight));
    colors = readColors(plate);
  };

  const paint = (t: number) => {
    if (!field) return;
    const f = field;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const inset = (f.g.pitch - C.DOT) / 2;
    let current = -1;
    frame(f, t, (col, row, ink) => {
      if (ink !== current) {
        ctx.fillStyle = colors[ink];
        current = ink;
      }
      ctx.fillRect(col * f.g.pitch + inset, row * f.g.pitch + inset, C.DOT, C.DOT);
    });
  };

  const still = () => {
    // un solo fotograma, la consulta resuelta (F0 §4.4): el bucle no arranca
    layout();
    paint(C.STILL_AT_S);
  };

  const tick = () => {
    if (!field) return;
    const t = (performance.now() - t0) / 1000;
    // un fotograma = una posición; si el reloj se retrasa, se avanza lo que toca sin saltar consultas
    const steps = Math.min(10, Math.max(1, Math.round((t - lastT) / (C.FRAME_MS / 1000))));
    for (let i = 0; i < steps; i++) advance(field, t);
    lastT = t;
    paint(t);
    timer = setTimeout(tick, C.FRAME_MS);
  };

  const start = () => {
    if (isStill()) return still();
    layout();
    if (timer === undefined) tick();
  };
  const stop = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const onVisibility = () => {
    if (document.hidden) {
      pausedAt = performance.now();
      stop();
    } else if (pausedAt !== null) {
      t0 += performance.now() - pausedAt;
      pausedAt = null;
      if (!isStill()) tick();
    }
  };

  const resize = new ResizeObserver(() => {
    if (isStill()) still();
    else layout();
  });
  resize.observe(plate);
  document.addEventListener("visibilitychange", onVisibility);
  document.fonts?.ready.then(() => (isStill() ? still() : layout()));

  start();

  return () => {
    stop();
    resize.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
