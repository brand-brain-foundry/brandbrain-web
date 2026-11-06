/**
 * behavior/criterio-field.ts — S8 · CAMPO DEL CRITERIO (F2, 2026-11-02; conducta en OUTPUT-BBW-2026-11-01-F0 §4).
 *
 * QUÉ HACE: una rejilla de puntos donde corren carriles de «texto» (tramos de puntos). Una CONSULTA barre una banda de carriles con un
 * cursor, enciende los aciertos que encuentra, cierra la banda con dos corchetes, saca a la derecha una barra por carril con su número de
 * aciertos y se disuelve punto a punto. Es la imagen del método: el criterio escrito, leído y consultado.
 * P-BBW-86 (2026-11-06, firmada por el `!` del despacho de cierre): en vez de UNA consulta cada 4,1 s en una banda al azar, VARIAS A LA VEZ,
 * cada una en su RANURA (un grupo de carriles que no se solapa con los demás) y con su arranque escalonado al azar por la semilla del módulo.
 * Cada consulta conserva su línea de tiempo (barrido, corchetes, barras, disolución) y su periodo. El número de ranuras se DERIVA de la
 * geometría: de los carriles de la ZONA VISIBLE del escenario —dentro de la elipse de la máscara hasta su parada media (al menos la mitad de
 * la tinta), dentro de la ventana y, en el modo amplio, a la derecha del texto—, para que en cualquier instante haya al menos una consulta
 * en curso donde se ve. Dos ranuras escalonadas media vuelta bastan para eso (el hueco muerto entre consultas, 0,72 s, es menor que medio
 * periodo, 2,05 s) y la desviación al azar de cada arranque está acotada para que dos huecos muertos nunca coincidan; más carriles visibles =
 * más ranuras, para que toda la zona tenga vida. Antes, en el teléfono, la banda nacía en el borde izquierdo de la caja —fuera de la ventana
 * o bajo la máscara ya fundida— y el campo parecía quieto.
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
 * `--bbf-text-on-base` (colores, resueltos por el navegador en un elemento sonda; los cuatro del campo son ROLES DE VISTA desde el 2026-11-06
 * —semantic/viewport.css elige el juego de peldaños de cada composición del héroe— y por eso se vuelven a leer en cada `layout()`, es decir, al
 * arrancar, al cambiar el tamaño de la placa y al cargar las fuentes: al cruzar el corte el campo repinta con los colores de la vista nueva), `--bbf-motion-loop-play-state` (quietud: con
 * movimiento reducido vale `paused`, se pinta UN fotograma y el bucle no arranca, I-9) y `--bbf-stage-mask-mid-share` (la parada media de la
 * máscara del escenario: hasta dónde llega su tinta; es la misma madre que recoloca el escenario en el teléfono, primitives/composition.css).
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
  /** fotograma único con movimiento reducido (consultas resueltas) · estático · F0 §4.4 */
  STILL_AT_S: 2.7,
  /** RANURAS MÍNIMAS de consultas simultáneas · plantilla · P-BBW-86: dos ranuras escalonadas media vuelta nunca dejan la zona visible sin una
   *  consulta en curso, porque el hueco muerto de cada una (QUERY_EVERY_S − QUERY_LIFE_S = 0,72 s) es menor que medio periodo (2,05 s). El
   *  número real se deriva de la geometría: ⌈carriles visibles / carriles máximos de una banda⌉, nunca menos que esto ni más que carriles. */
  SLOTS_MIN: 2,
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

/** Lo que la ventana deja ver de la placa, en px de la placa: [x0, x1) × [y0, y1). Lo mide el componente (`readView`); por defecto, toda la placa. */
export type ViewClip = { x0: number; x1: number; y0: number; y1: number };

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
  /** ZONA VISIBLE por carril (P-BBW-86): el intervalo de columnas [c0, c1) donde el escenario SE VE en ese carril: dentro de la elipse de la
   *  máscara hasta su parada media (al menos la mitad de la tinta), dentro de la ventana y, en el modo amplio, a la derecha del texto.
   *  [0, 0) = el carril no se ve (fuera de la elipse o de la ventana). Es lo que las consultas tienen que cubrir. */
  windows: Array<[number, number]>;
};

/** Anchura mínima de ventana (en columnas) para alojar una consulta entera: la banda base, su hueco y la barra mínima. Derivada, no constante. */
const MIN_WINDOW = C.BAND_BASE + C.BAR_GAP + C.BAR_MIN;

/** Ventana visible de un carril: la cuerda de la elipse (parada media `midShare`) a la altura del centro del carril, recortada por la ventana y
 *  por el arranque de los carriles. Las dos filas del carril tienen que estar dentro de la ventana. */
function laneWindow(r0: number, pitch: number, width: number, height: number, cols: number, start: number, view: ViewClip, midShare: number): [number, number] {
  const cy = (r0 + 1) * pitch; // el centro del carril, entre sus dos filas
  if (r0 * pitch < view.y0 || (r0 + 2) * pitch > view.y1) return [0, 0];
  const rx = width / 2;
  const ry = height / 2;
  const dy = ry * midShare > 0 ? (cy - ry) / (ry * midShare) : 2;
  if (dy * dy >= 1) return [0, 0];
  const half = rx * midShare * Math.sqrt(1 - dy * dy);
  const x0 = Math.max(rx - half, view.x0);
  const x1 = Math.min(rx + half, view.x1);
  const c0 = Math.max(start, Math.ceil(x0 / pitch));
  const c1 = Math.min(cols, Math.floor(x1 / pitch));
  return c1 > c0 ? [c0, c1] : [0, 0];
}

/** Geometría a partir de lo medido. `lineHeight`/`lineOffset` = interlineado del primer párrafo y centro de una de sus líneas,
 *  en px relativos al borde superior de la placa (null si no hay párrafo). `view` = lo que la ventana deja ver de la placa; `midShare` = la
 *  parada media de la máscara (leída del token; 1 = sin máscara: toda la caja cuenta como visible). */
export function geometry(
  width: number,
  height: number,
  lineHeight: number | null,
  lineOffset: number | null,
  textRight = 0,
  view: ViewClip = { x0: 0, x1: width, y0: 0, y1: height },
  midShare = 1,
): Geometry {
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
  const windows = laneRows.map((r0) => laneWindow(r0, pitch, width, height, cols, start, view, midShare));
  return { wide, start, pitch, cols, rows, laneRows, windows };
}

/** Una RANURA (P-BBW-86): un grupo de carriles contiguos de la zona visible, que no se solapa con el de ninguna otra, y el instante de su
 *  primera consulta (`phase`); las siguientes van cada `QUERY_EVERY_S`. */
export type Slot = { firstLane: number; laneCount: number; phase: number };

/**
 * Las ranuras de una geometría (P-BBW-86). Carriles USABLES = los de la zona visible con ventana para una consulta entera (≥ MIN_WINDOW
 * columnas). Número de ranuras k = ⌈usables / carriles máximos de una banda⌉, nunca menos que SLOTS_MIN ni más que usables (0 ranuras si no
 * hay carriles usables: el campo corre sin consultas, como un escenario que no se ve). Los usables se reparten en k grupos contiguos del mismo
 * tamaño (±1). ARRANQUE ESCALONADO AL AZAR: la ranura s arranca en QUERY_FIRST_S + s · periodo / k, más una desviación uniforme sorteada con la
 * semilla del módulo (determinista) y ACOTADA: entre el arranque de una consulta y el de la siguiente —en la ranura que sea, también al dar
 * la vuelta al periodo— nunca pasan más de DISSOLVE_START_S (2,48 s), que es cuando la anterior empieza a disolverse. Cota = (DISSOLVE_START_S −
 * periodo / k) / 2, nunca más de medio paso (las ranuras no se adelantan unas a otras). Con k = 2 (paso 2,05 s) la cota es ±0,215 s; con k = 3
 * (paso 1,37 s), ±0,557. Consecuencia: en cualquier instante hay al menos una consulta que todavía no se disuelve, y por tanto en curso.
 */
export function slotsOf(g: Geometry): Slot[] {
  const usable: number[] = [];
  g.windows.forEach(([c0, c1], lane) => {
    if (c1 - c0 >= MIN_WINDOW) usable.push(lane);
  });
  const n = usable.length;
  if (n === 0) return [];
  const maxLanes = g.wide ? C.BAND_LANES_MAX : C.BAND_LANES_NARROW;
  const k = Math.min(n, Math.max(C.SLOTS_MIN, Math.ceil(n / maxLanes)));
  const step = C.QUERY_EVERY_S / k;
  const jitter = Math.max(0, Math.min(step / 2, (C.DISSOLVE_START_S - step) / 2));
  const rnd = mulberry32(C.SEED ^ 0x51a7);
  const out: Slot[] = [];
  for (let s = 0; s < k; s++) {
    const a = Math.floor((s * n) / k);
    const b = Math.floor(((s + 1) * n) / k);
    out.push({ firstLane: usable[a], laneCount: b - a, phase: C.QUERY_FIRST_S + s * step + (rnd() * 2 - 1) * jitter });
  }
  return out;
}

export type Query = {
  slot: number;
  index: number;
  start: number;
  bandStart: number;
  bandWidth: number;
  barMax: number;
  firstLane: number;
  laneCount: number;
};

/**
 * La consulta número `index` de la ranura `s`, decidida por azar fijo (índice y ranura): cuántos carriles de la ranura y cuáles, y la banda
 * DENTRO de la ventana visible común a esos carriles (la más estrecha manda: la banda, su hueco y sus barras caben enteros en lo que se ve).
 * La posición pedida es la de siempre (BAND_START_* a la derecha del arranque) y se recorta a la ventana. La ranura 0 sortea con las mismas
 * semillas que la consulta única anterior. `phase` = el arranque de la ranura (en quietud, el de la primera consulta para todas).
 */
export function query(slot: Slot, s: number, index: number, g: Geometry, phase = slot.phase): Query | null {
  if (g.cols < C.BAND_BASE || slot.laneCount === 0) return null;
  const maxLanes = g.wide ? C.BAND_LANES_MAX : C.BAND_LANES_NARROW;
  const span = Math.min(slot.laneCount, C.BAND_LANES_MIN + Math.floor(hash3(index, 29 + s * 7, 2) * (maxLanes - C.BAND_LANES_MIN + 1)), maxLanes);
  const firstLane = slot.firstLane + Math.floor(hash3(index, 31 + s * 7, 3) * (slot.laneCount - span + 1));
  let c0 = 0;
  let c1 = g.cols;
  for (let lane = firstLane; lane < firstLane + span; lane++) {
    c0 = Math.max(c0, g.windows[lane][0]);
    c1 = Math.min(c1, g.windows[lane][1]);
  }
  if (c1 - c0 < MIN_WINDOW) return null;
  const a = hash3(index, 23 + s * 7, 1);
  const barMax = Math.min(C.BAR_MAX, Math.max(C.BAR_MIN, Math.round(C.BAR_SHARE * g.cols)));
  const bandWidth = Math.max(1, Math.min(Math.round(Math.min(C.BAND_MAX_SHARE * g.cols, C.BAND_BASE + a * C.BAND_SPAN_SHARE * g.cols)), c1 - c0 - C.BAR_GAP - barMax));
  const wanted = g.start + (g.wide ? C.BAND_START_WIDE : C.BAND_START_NARROW);
  const bandStart = Math.max(c0, Math.min(wanted, c1 - bandWidth - C.BAR_GAP - barMax));
  return { slot: s, index, start: phase + index * C.QUERY_EVERY_S, bandStart, bandWidth, barMax, firstLane, laneCount: span };
}

/** Las consultas activas en el instante `t`, una por ranura (o null). `synchronized`: todas las ranuras con su primera consulta arrancada
 *  en QUERY_FIRST_S, para el fotograma único de la quietud (consultas resueltas que cubren el escenario). */
export function activeQueries(f: Field, t: number, synchronized = false): (Query | null)[] {
  return f.slots.map((slot, s) => {
    const phase = synchronized ? C.QUERY_FIRST_S : slot.phase;
    if (t < phase) return null;
    const index = synchronized ? 0 : Math.floor((t - phase) / C.QUERY_EVERY_S);
    const q = query(slot, s, index, f.g, phase);
    return q && t - q.start < C.QUERY_LIFE_S ? q : null;
  });
}

/** ¿Está vivo el carril en el instante `t`? Ventanas de 2,6 s; un 34 % de los carriles por ventana. */
export function isLive(lane: number, t: number): boolean {
  return hash3(lane, Math.floor(t / C.LIVE_WINDOW_S), 5) < C.LIVE_SHARE;
}

/** El campo: geometría, patrones y desplazamiento por carril, y las ranuras de consultas con el índice de ranura de cada carril (−1 = ninguna). */
export type Field = { g: Geometry; patterns: Uint8Array[]; shift: Int32Array; slots: Slot[]; laneSlot: Int16Array };

export function createField(g: Geometry): Field {
  const tall = g.rows >= C.GAP_TALL_ROWS;
  const patterns = g.laneRows.map((_, lane) => lanePattern(lane, laneDepth(lane), tall));
  const shift = new Int32Array(g.laneRows.length);
  for (let lane = 0; lane < shift.length; lane++) shift[lane] = Math.floor(hash3(lane, 37, 4) * C.PATTERN_LENGTH);
  const slots = slotsOf(g);
  const laneSlot = new Int16Array(g.laneRows.length).fill(-1);
  slots.forEach((slot, s) => {
    for (let lane = slot.firstLane; lane < slot.firstLane + slot.laneCount; lane++) laneSlot[lane] = s;
  });
  return { g, patterns, shift, slots, laneSlot };
}

const inBand = (q: Query | null, lane: number) => q !== null && lane >= q.firstLane && lane < q.firstLane + q.laneCount;
const queryOfLane = (f: Field, qs: (Query | null)[], lane: number) => (f.laneSlot[lane] >= 0 ? qs[f.laneSlot[lane]] : null);

/** Un fotograma de avance: cada carril vivo fuera de una banda activa se mueve una posición a la izquierda. */
export function advance(f: Field, t: number): void {
  const qs = activeQueries(f, t);
  for (let lane = 0; lane < f.shift.length; lane++) {
    if (isLive(lane, t) && !inBand(queryOfLane(f, qs, lane), lane)) f.shift[lane] = (f.shift[lane] + 1) % C.PATTERN_LENGTH;
  }
}

/** Colores por rol (índices del dibujo). */
export const INK = { lane: 0, live: 1, read: 2, hit: 3, cursor: 4 } as const;
export type Ink = (typeof INK)[keyof typeof INK];

/** La línea de tiempo de UNA consulta en el instante `t` (la misma de siempre: barrido, resultado, disolución), con su propia disolución
 *  punto a punto sorteada por su índice y su ranura. */
function timeline(q: Query, t: number) {
  const age = t - q.start;
  const salt = q.index * 31 + q.slot * 1009;
  const alive = (col: number, row: number) => age < C.DISSOLVE_START_S || age < C.DISSOLVE_START_S + hash3(col, row, salt + 101) * (C.QUERY_LIFE_S - C.DISSOLVE_START_S);
  const sweep = Math.min(1, age / C.SWEEP_END_S);
  const cursorCol = q.bandStart + Math.round((1 - (1 - sweep) * (1 - sweep)) * q.bandWidth);
  return { age, salt, alive, cursorCol, bandEnd: q.bandStart + q.bandWidth };
}

/** Dibujo de un fotograma: llama a `dot(col, row, ink)` por cada punto visible. Puro. `synchronized` = el fotograma de la quietud. */
export function frame(f: Field, t: number, dot: (col: number, row: number, ink: Ink) => void, synchronized = false): void {
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
  const qs = activeQueries(f, t, synchronized);
  const lines = qs.map((q) => (q ? timeline(q, t) : null));

  for (let lane = 0; lane < g.laneRows.length; lane++) {
    const r0 = g.laneRows[lane];
    const ink: Ink = isLive(lane, t) ? INK.live : INK.lane;
    const q = queryOfLane(f, qs, lane);
    const tl = q ? lines[q.slot] : null;
    const banded = inBand(q, lane);
    let hits = 0;
    for (let col = 0; col < g.cols; col++) {
      const v = patterns[lane][(shift[lane] + col) % L];
      if (v === 0) continue;
      let k: Ink = ink;
      if (banded && q && tl && col >= q.bandStart && col < tl.bandEnd) {
        const strong = v === 2 || hash3(lane, (shift[lane] + col) % L, tl.salt + 53) < C.HIT_EXTRA_SHARE;
        if (strong) {
          hits++;
          if (col <= tl.cursorCol && tl.alive(col, r0)) k = INK.read;
        }
      }
      if (soft(col, r0)) dot(col, r0, k);
      if (soft(col, r0 + 1)) dot(col, r0 + 1, k);
    }
    if (!banded || !q || !tl || tl.age < C.SWEEP_END_S || hits === 0) continue;
    // barras: aparecen de arriba abajo durante la fase de resultado y crecen hacia la derecha
    const order = (lane - q.firstLane) / Math.max(1, q.laneCount);
    const local = (tl.age - C.SWEEP_END_S) / (C.RESULT_END_S - C.SWEEP_END_S) - order;
    const grow = Math.max(0, Math.min(1, local * q.laneCount));
    const len = Math.round(Math.min(q.barMax, C.BAR_PER_HIT * hits) * grow);
    for (let i = 0; i < len; i++) {
      const col = tl.bandEnd + C.BAR_GAP + i;
      if (col >= g.cols) break;
      for (const row of [r0, r0 + 1]) if (tl.alive(col, row)) dot(col, row, i === 0 ? INK.hit : INK.read);
    }
  }

  for (let s = 0; s < qs.length; s++) {
    const q = qs[s];
    const tl = lines[s];
    if (!q || !tl) continue;
    const top = g.laneRows[q.firstLane];
    const bottom = g.laneRows[q.firstLane + q.laneCount - 1] + 1;
    // trama tenue tras el cursor, en la fila intermedia entre carriles
    for (let lane = q.firstLane; lane < q.firstLane + q.laneCount - 1; lane++) {
      const mid = Math.round((g.laneRows[lane] + 1 + g.laneRows[lane + 1]) / 2);
      for (let col = q.bandStart; col <= tl.cursorCol; col += C.TRAMA_EVERY) if (tl.alive(col, mid)) dot(col, mid, INK.lane);
    }
    // cursor durante el barrido; corchetes en la fase de resultado y después
    for (let row = top; row <= bottom; row++) {
      if (tl.alive(tl.cursorCol, row)) dot(Math.min(tl.cursorCol, g.cols - 1), row, INK.cursor);
      if (tl.age >= C.SWEEP_END_S && tl.alive(q.bandStart - 1, row)) dot(q.bandStart - 1, row, INK.live);
    }
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

/** La parada media de la máscara del escenario (`--bbf-stage-mask-mid-share`, primitives/composition.css), leída y nunca repetida. Si el
 *  token no está o no es una proporción, 1: toda la caja cuenta como visible (se dice; no se inventa el 0,74 aquí). */
export function readMidShare(): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bbf-stage-mask-mid-share"));
  return Number.isFinite(v) && v > 0 && v <= 1 ? v : 1;
}

/** Lo que la ventana deja ver de la placa, en px de la placa, con el documento SIN DESPLAZAR (la zona visible es la del primer visor, no la
 *  del instante: la placa es absoluta en el héroe y no se recalcula al desplazarse). Lo recorta por los cuatro lados. */
export function readView(plate: HTMLElement): ViewClip {
  const r = plate.getBoundingClientRect();
  const top = r.top + window.scrollY;
  return {
    x0: Math.max(0, -r.left),
    x1: Math.min(r.width, window.innerWidth - r.left),
    y0: Math.max(0, -top),
    y1: Math.min(r.height, window.innerHeight - top),
  };
}

/** Interlineado del párrafo y centro de su primera línea respecto de la placa (o null si no hay párrafo). */
export function readLine(
  plate: HTMLElement,
  line: HTMLElement | null,
): { lineHeight: number | null; lineOffset: number | null; textRight: number } {
  if (!line) return { lineHeight: null, lineOffset: null, textRight: 0 };
  const p = plate.getBoundingClientRect();
  // el BLOQUE de texto (el padre de la línea de referencia): si está AL LADO del escenario —comparte filas con su mitad superior, que es la
  // composición de dos zonas— los carriles empiezan a su derecha. Si está DEBAJO (una zona; desde el 2026-11-06, héroe móvil, su borde superior
  // solapa el borde fundido de la caja) no se recorta: recortar ahí apagaba el campo entero (la addenda del despacho lo prohíbe), y lo que
  // protege la legibilidad bajo el titular es la medida de contraste (I-8), no un recorte. «Amplio» (el paso por el interlineado) es cosa del
  // tamaño de la placa, no de la vista: a 390 la placa ya mide más de 480 px, así que no vale como criterio de dónde está el texto.
  const block = (line.parentElement ?? line).getBoundingClientRect();
  const beside = block.bottom > p.top && block.top < p.top + p.height / 2;
  const textRight = beside ? Math.max(0, block.right - p.left) : 0;
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
    field = createField(geometry(w, h, lineHeight, lineOffset, textRight, readView(plate), readMidShare()));
    colors = readColors(plate);
  };

  const paint = (t: number, synchronized = false) => {
    if (!field) return;
    const f = field;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const inset = (f.g.pitch - C.DOT) / 2;
    let current = -1;
    frame(
      f,
      t,
      (col, row, ink) => {
        if (ink !== current) {
          ctx.fillStyle = colors[ink];
          current = ink;
        }
        ctx.fillRect(col * f.g.pitch + inset, row * f.g.pitch + inset, C.DOT, C.DOT);
      },
      synchronized,
    );
  };

  const still = () => {
    // un solo fotograma con las consultas RESUELTAS de todas las ranuras (F0 §4.4; P-BBW-86): el bucle no arranca
    layout();
    paint(C.STILL_AT_S, true);
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
