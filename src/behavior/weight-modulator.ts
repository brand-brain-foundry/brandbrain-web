/**
 * behavior/weight-modulator.ts — S5 · MODULADOR DE PESO DEL TITULAR (fase 6h, portado P1; D-BBW-28 · D-BBW-29 · D-BBW-30 · D-BBW-31).
 * Contrato: docs/system/BEHAVIOR.md. Inventario de origen: N1 doc A §5 (`dc:Lnnn` = `Eye Fish Landing.dc.html`, línea).
 *
 * QUÉ HACE, en una frase: la palabra se parte en letras y cada una interpola su peso de forma independiente siguiendo una señal continua
 * sin ciclo, con la restricción de que EL ANCHO TOTAL NUNCA CAMBIA: el grosor se redistribuye, no se añade (Σ avances = presupuesto).
 *
 * TRES PARTES, sin DOM salvo donde se dice:
 *   1. SEÑAL (`signal`): joroba errante + ruido por letra → sigmoide → s_i ∈ (0,1). Pura.
 *   2. CONSERVACIÓN (`waterFill`): water-fill de Newton contra la tabla de avances medida, hasta que Σ adv(i, s_i) = presupuesto ± tolerancia. Pura.
 *      Después, REJILLA Y PULIDO (`quantize`, fase 6i, HAL-BBW-16): los pesos se ajustan a medio punto y un pulido discreto glifo a glifo
 *      devuelve la suma cuantizada al presupuesto. Pura.
 *   3. CALIBRACIÓN (`calibrate`): mide en ejecución la tabla de avances por glifo y peso (SAMPLES pesos × n letras), la REFINA por bisección
 *      donde la medida se aparta de la recta (la fuente tiene discontinuidades de avance por sustitución de glifo según el peso: en
 *      `modulator-vf` el corte está en 224,73 y lo tienen `e`, `s` y `S` —las tres medidas en este repo—, con un salto de 0,02373 em; una
 *      tabla uniforme de 9 muestras no lo ve y la conservación deriva 0,4 %), fija el presupuesto como la suma de avances al PESO DE REPOSO
 *      y ancla la caja al fotograma más ancho
 *      de una muestra de la señal real. Toca el DOM (mide). Todo peso escrito o medido va en la REJILLA de medio punto (HAL-BBW-16, fase 6i).
 *
 * TOKENS QUE LEE (nunca los repite; D-BBW-30): extremos del eje por rol `--bbf-type-display-weight-from` / `-to` (= WMIN/WMAX del diseño,
 * madres `--bbf-weight-display-anim-min/-max`) y el peso de reposo tal como el navegador lo aplica al titular (`font-weight` computado =
 * `--bbf-type-display-weight` = `--bbf-weight-display-rest`, la fórmula (min+max)/2 de la fase 5, que ES el peso de conservación del diseño:
 * `dc:L515` fija el presupuesto en s = 0,5). Ningún número de peso vive aquí.
 *
 * CONSTANTES DE ALGORITMO (no son tokens: ningún estilo las consume). Clase por D-DOC-13 §2 en cada línea.
 */

/** tabla de avances de un glifo: posiciones s ∈ [0,1] del eje (compartidas por todos los glifos, no uniformes tras el refinado) y avance en px */
export type Curve = { readonly xs: readonly number[]; readonly ys: readonly number[] };
export type Tokens = { min: number; max: number; rest: number };

export const WEIGHT_MODULATOR = Object.freeze({
  /** pesos muestreados por glifo al calibrar, uniformes (dc:L503) · estático */
  SAMPLES: 9,
  /** refinado de la tabla por bisección (fase 6h, medido en el output; el diseño no lo tiene): se subdivide un intervalo cuando el avance medido
   *  en su punto medio se aparta de la recta entre sus extremos más de la tolerancia, hasta que el intervalo mide `minStepWeight` unidades de
   *  peso, con un tope de medidas por calibración · estático (criterio técnico).
   *  LA TOLERANCIA VA EN EM, NO EN PÍXELES (D-BBW-47, medido en este turno). La 6h la fijó en 0,5 px, que es 0,00485 em al cuerpo que el titular
   *  tenía entonces (103,17 px a 1728). Un umbral ABSOLUTO no sirve, y la razón es geométrica: para un ESCALÓN dentro del intervalo, la
   *  desviación del punto medio respecto de la cuerda vale `salto / 2` **en todos los niveles de la bisección** —no decrece al acercarse—, así
   *  que el refinado continúa si y solo si `salto/2 > tolerancia`. Como el salto escala con el cuerpo (0,02373 em en `modulator-vf`), con
   *  0,5 px fijos el refinado solo dispara por encima de ~105 px de cuerpo. Medido con el claim de tres líneas, cuyos cuerpos van de 28,56 a
   *  64,01 px: con 0,5 px la tabla dejaba un hueco de 12,5 unidades de peso SOBRE el corte a 360/780/1000 (19 posiciones) y la conservación
   *  derivaba 0,218–0,258 % con 6–12 excursiones; con la tolerancia en em quedan 27 posiciones y hueco de 1 unidad en los CINCO anchos, sin
   *  acercarse al tope de 64. El valor no cambia: es el mismo 0,00485 em que la 6h validó, dicho en la unidad en la que era cierto.
   *  Sigue por encima del ruido de cuantización del avance (≤ 0,00214 em de error lineal, factor 2,27) y por debajo de medio salto (0,01187 em). */
  REFINE: Object.freeze({ toleranceEm: 0.00485, minStepWeight: 1, maxSamples: 64 }),
  /** cuadros simulados de la señal real para anclar la caja al más ancho, y su paso en segundos (dc:L518-519) · estático */
  PIN_FRAMES: 40,
  PIN_STEP_S: 0.45,
  /** margen bajo el cual dos anchos se consideran EL MISMO, para detectar la medida topada (D-BBW-45) · estático (criterio técnico) */
  CLAMP_EPS_PX: 0.05,
  /** ancho mínimo para aceptar un anclaje (dc:L522) · estático */
  MIN_PIN_PX: 20,
  /** anchura de la joroba: cuántas letras engordan a la vez (dc:L552) · dinámico (carácter de la marca) */
  SIGMA: 0.34,
  /** joroba errante: 0,5 + a1·sin(f1·t) + a2·sin(f2·t + p2); recorre −0,18…1,18 de la palabra (dc:L553) · dinámico; frecuencias en rad/s,
   *  inconmensurables entre sí y con las del ruido: la señal no tiene periodo (comentario dc:L453) */
  BUMP: Object.freeze({ base: 0.5, a1: 0.56, f1: 0.58, a2: 0.12, f2: 1.31, p2: 1.7 }),
  /** gaussiana centrada en la joroba: gain·exp(−d²/2σ²) + offset (dc:L559) · dinámico */
  GAUSS: Object.freeze({ gain: 2.5, offset: -1.1 }),
  /** ruido por letra: Σ a·sin(f·t + φ·i) (dc:L560-562) · dinámico */
  NOISE: Object.freeze([
    Object.freeze({ a: 0.52, f: 0.83, phi: 2.19 }),
    Object.freeze({ a: 0.34, f: 1.27, phi: 0.77 }),
    Object.freeze({ a: 0.21, f: 2.03, phi: 4.11 }),
  ]),
  /** pendiente de la sigmoide 1/(1+e^(−k·v)) (dc:L563) · dinámico; impide alcanzar los extremos exactos (observado 116–492) */
  SIGMOID_K: 1.9,
  /** water-fill de Newton: pasadas máximas, tolerancia en px y pendiente mínima de la tabla (dc:L570-584) · estático */
  NEWTON: Object.freeze({ passes: 14, tolerancePx: 0.04, minSlopePx: 0.001 }),
  /** re-calibraciones tras el montaje, en ms: absorben la llegada tardía de la fuente (dc:L449-451) · estático (patrón de carga de fuente) */
  REFIT_DELAYS_MS: Object.freeze([60, 700, 1800]),
  /** histéresis del afinado de la guarda: cambio mínimo de cuerpo, en px, para dar por bueno que el cuerpo ha cambiado y volver a
   *  calibrar (dc:L617, donde era `OPTICAL_FIT.MIN_DELTA_PX`; el ajuste óptico se retira con el rótulo en D-BBW-47 y la constante
   *  se muda aquí, que es su único consumidor desde entonces) · estático */
  REFIT_MIN_DELTA_PX: 0.15,
  /** REJILLA DE ESCRITURA DEL PESO (fase 6i, HAL-BBW-16; el diseño escribía un decimal, dc:L591): todo peso que se escribe o se mide se ajusta a
   *  medio punto. Por qué: Chrome resuelve `font-weight` en cuartos de punto y, medido en cuatro cuerpos (52,56 · 65,52 · 84 · 124 px), los
   *  cubos 382,25 y 468,75 COLISIONAN entre sí (el segundo que se instancia dibuja con el glifo del primero: −12 px o +12 px de avance en la
   *  palabra durante un cuadro; 11–20 cuadros de cada 7 200 a 360 px). Un barrido de los 1 601 cuartos del eje no encontró otra pareja; con
   *  `font-variation-settings` no ocurre, pero D-BBW-29 escribe `font-weight`. La rejilla de medio punto no contiene ninguno de los dos cubos
   *  y conserva la resolución útil (Chrome ya cuantiza a 0,25): el error de conservación que añade queda medido en el output 6i · estático
   *  (criterio técnico) */
  WEIGHT_GRID: 0.5,
  /** pulido discreto tras la rejilla (fase 6i): pasadas máximas del ajuste glifo a glifo, de un paso de rejilla cada una, que acercan la suma
   *  de avances ya cuantizada al presupuesto (la rejilla sola dejaba ±0,12 % a 360 px, medido; el diseño no cuantizaba y Chrome lo hacía por
   *  él a 0,25 sin corregir) · estático (criterio técnico) */
  POLISH_PASSES: 16,
});

const C = WEIGHT_MODULATOR;

/** Peso ajustado a la rejilla de escritura (HAL-BBW-16). */
export function snapWeight(weight: number): number {
  return Math.round(weight / C.WEIGHT_GRID) * C.WEIGHT_GRID;
}

/** Lee los tokens del titular donde el navegador los resuelve: extremos por rol en :root, reposo en el propio elemento. */
export function readTokens(word: HTMLElement): Tokens | null {
  const root = getComputedStyle(word.ownerDocument.documentElement);
  const min = parseFloat(root.getPropertyValue("--bbf-type-display-weight-from"));
  const max = parseFloat(root.getPropertyValue("--bbf-type-display-weight-to"));
  const rest = parseFloat(getComputedStyle(word).fontWeight);
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(rest) || max <= min) return null;
  return { min, max, rest };
}

/** Señal en el instante t (s) para n letras: joroba + ruido → sigmoide. Devuelve s_i ∈ (0,1). */
export function signal(t: number, n: number): number[] {
  const bump = C.BUMP.base + C.BUMP.a1 * Math.sin(t * C.BUMP.f1) + C.BUMP.a2 * Math.sin(t * C.BUMP.f2 + C.BUMP.p2);
  const s = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) : 0.5;
    const d = u - bump;
    let v = C.GAUSS.gain * Math.exp(-(d * d) / (2 * C.SIGMA * C.SIGMA)) + C.GAUSS.offset;
    for (const k of C.NOISE) v += k.a * Math.sin(t * k.f + i * k.phi);
    s[i] = 1 / (1 + Math.exp(-v * C.SIGMOID_K));
  }
  return s;
}

/** índice del intervalo [xs[k], xs[k+1]] que contiene s (búsqueda binaria sobre posiciones no uniformes) */
function segment(xs: readonly number[], s: number): number {
  let lo = 0;
  let hi = xs.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (xs[mid] <= s) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Avance interpolado linealmente en la tabla del glifo para s ∈ [0,1] (dc:L528-534, sobre posiciones no uniformes). */
export function advance(curve: Curve, s: number): number {
  const x = Math.max(0, Math.min(1, s));
  const k = segment(curve.xs, x);
  const x0 = curve.xs[k];
  const x1 = curve.xs[k + 1];
  return curve.ys[k] + ((curve.ys[k + 1] - curve.ys[k]) * (x - x0)) / (x1 - x0);
}

/** Pendiente local de la tabla (px por unidad de s), acotada por abajo (dc:L536-542). */
export function slope(curve: Curve, s: number): number {
  const k = segment(curve.xs, Math.max(0, Math.min(1, s)));
  return Math.max(C.NEWTON.minSlopePx, (curve.ys[k + 1] - curve.ys[k]) / (curve.xs[k + 1] - curve.xs[k]));
}

/** Suma de avances de todas las letras para un vector s. */
export function totalAdvance(curves: readonly Curve[], s: readonly number[]): number {
  let total = 0;
  for (let i = 0; i < curves.length; i++) total += advance(curves[i], s[i]);
  return total;
}

/**
 * Water-fill de Newton (dc:L569-587): lleva Σ avances al presupuesto moviendo cada letra en proporción a su margen (cuánto puede
 * engordar o adelgazar) y a su sensibilidad (pendiente de su tabla). Muta `s`. Devuelve el residuo |presupuesto − total| en px.
 */
export function waterFill(s: number[], curves: readonly Curve[], budget: number): number {
  const n = s.length;
  let diff = 0;
  for (let pass = 0; pass < C.NEWTON.passes; pass++) {
    diff = budget - totalAdvance(curves, s);
    if (Math.abs(diff) < C.NEWTON.tolerancePx) return Math.abs(diff);
    let H = 0;
    const head = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const room = diff > 0 ? 1 - s[i] : s[i];
      head[i] = room * slope(curves[i], s[i]);
      H += head[i];
    }
    if (H < 1e-9) break;
    for (let i = 0; i < n; i++) s[i] = Math.max(0, Math.min(1, s[i] + ((diff * head[i]) / H) / slope(curves[i], s[i])));
  }
  return Math.abs(budget - totalAdvance(curves, s));
}

/**
 * Cuantiza el vector s a la rejilla de escritura (HAL-BBW-16) y PULE el resultado: mueve de un paso de rejilla, glifo a glifo, el que más
 * acerque Σ avances al presupuesto, hasta que ningún paso mejore o se agoten las pasadas. Pura. Devuelve el residuo final (px).
 */
export function quantize(s: number[], curves: readonly Curve[], budget: number, tokens: Tokens): number {
  const span = tokens.max - tokens.min;
  const step = C.WEIGHT_GRID / span;
  const n = s.length;
  for (let i = 0; i < n; i++) s[i] = (snapWeight(tokens.min + span * s[i]) - tokens.min) / span;
  let diff = budget - totalAdvance(curves, s);
  for (let pass = 0; pass < C.POLISH_PASSES; pass++) {
    let best = -1;
    let bestDiff = diff;
    let bestS = 0;
    for (let i = 0; i < n; i++) {
      const dir = diff > 0 ? step : -step;
      const cand = s[i] + dir;
      if (cand < 0 || cand > 1) continue;
      const d = diff - (advance(curves[i], cand) - advance(curves[i], s[i]));
      if (Math.abs(d) < Math.abs(bestDiff)) {
        bestDiff = d;
        best = i;
        bestS = cand;
      }
    }
    if (best < 0) break;
    s[best] = bestS;
    diff = bestDiff;
  }
  return Math.abs(diff);
}

/** Escribe el peso de cada glifo con la propiedad estándar (D-BBW-29): un solo eje, `font-weight` numérico por letra, ya en la rejilla. */
export function paint(glyphs: readonly HTMLElement[], s: readonly number[], tokens: Tokens): void {
  const span = tokens.max - tokens.min;
  for (let i = 0; i < glyphs.length; i++) glyphs[i].style.fontWeight = String(snapWeight(tokens.min + span * s[i]));
}

/** Un cuadro completo: señal → conservación → rejilla y pulido → pintado. Devuelve el residuo tras el pulido (px). */
export function frame(t: number, glyphs: readonly HTMLElement[], curves: readonly Curve[], budget: number, tokens: Tokens): number {
  const s = signal(t, glyphs.length);
  waterFill(s, curves, budget);
  const residual = quantize(s, curves, budget, tokens);
  paint(glyphs, s, tokens);
  return residual;
}

export type Calibration = { curves: Curve[]; budget: number; pinned: number; samples: number; clamped: boolean };

/**
 * Calibración (dc:L492-525), TOCA EL DOM: (1) mide la tabla de avances de cada glifo en SAMPLES pesos uniformes del eje y la refina por
 * bisección donde se aparta de la recta (REFINE; un relayout por peso medido, compartido por todos los glifos); (2) presupuesto = Σ avances
 * al peso de reposo (el de conservación); (3) simula PIN_FRAMES cuadros de la señal real y ancla la caja de la palabra al más ancho (`width`
 * en px); (4) deja pintado el cuadro del reloj actual. Se llama al montar, cuando las fuentes están listas, cuando
 * llega una fuente (una tabla medida sobre la de respaldo produce una conservación falsa) y al cambiar el tamaño de la ventana.
 */
export function calibrate(word: HTMLElement, glyphs: readonly HTMLElement[], tokens: Tokens, clock: number): Calibration | null {
  const n = glyphs.length;
  if (!n) return null;
  /**
   * D-BBW-45 — SE MIDE CON `max-content`, NO CON `auto`.
   * Con `auto` esta caja ENCOGE PARA AJUSTARSE, y una caja así queda TOPADA por el ancho disponible: en cuanto la palabra pide más
   * de lo que cabe, la medida devuelve el disponible en vez del ancho real. Como el cuerpo se corrige con `objetivo × cuerpo / medido`,
   * ese tope vuelve el lazo DEGENERADO justo cuando hace falta —la corrección se calcula a sí misma— y el cuerpo equivocado se congela
   * hasta que se recarga (HAL-BBW-22: con la fuente de respaldo el cuerpo salía 60,28 px en vez de 46,02 y la palabra se recortaba
   * 34,8 px por lado a 360, sin corregirse nunca). `max-content` es el ancho intrínseco: no lo topa el contenedor.
   * Además impide que los glifos, que son elementos flexibles, ENCOJAN durante la medida y corrompan la tabla de avances.
   */
  word.style.width = "max-content";
  /** la tolerancia del refinado es una fracción del CUERPO (ver REFINE): se resuelve aquí, donde el cuerpo se conoce */
  const tolerancePx = C.REFINE.toleranceEm * parseFloat(getComputedStyle(word).fontSize);
  const span = tokens.max - tokens.min;
  const measured = new Map<number, number[]>();
  const measure = (x: number): number[] => {
    const w = snapWeight(tokens.min + span * x);
    const xs = (w - tokens.min) / span;
    const hit = measured.get(xs);
    if (hit) return hit;
    for (const g of glyphs) g.style.fontWeight = String(w);
    const ys = glyphs.map((g) => g.getBoundingClientRect().width);
    measured.set(xs, ys);
    return ys;
  };
  const queue: [number, number][] = [];
  for (let k = 0; k < C.SAMPLES; k++) {
    const x = k / (C.SAMPLES - 1);
    measure(x);
    if (k > 0) queue.push([(k - 1) / (C.SAMPLES - 1), x]);
  }
  const minStep = C.REFINE.minStepWeight / span;
  while (queue.length && measured.size < C.REFINE.maxSamples) {
    const [a, b] = queue.shift()!;
    if (b - a <= minStep) continue;
    const m = (a + b) / 2;
    const ya = measure(a);
    const yb = measure(b);
    const ym = measure(m);
    let bent = false;
    for (let i = 0; i < n && !bent; i++) bent = Math.abs(ym[i] - (ya[i] + yb[i]) / 2) > tolerancePx;
    if (bent) queue.push([a, m], [m, b]);
  }
  const xs = [...measured.keys()].sort((p, q) => p - q);
  const curves: Curve[] = glyphs.map((_, i) => ({ xs, ys: xs.map((x) => measured.get(x)![i]) }));
  const sRest = (tokens.rest - tokens.min) / (tokens.max - tokens.min);
  let budget = 0;
  for (let i = 0; i < n; i++) budget += advance(curves[i], sRest);
  let pinned = 0;
  for (let i = 0; i < C.PIN_FRAMES; i++) {
    frame(i * C.PIN_STEP_S, glyphs, curves, budget, tokens);
    const v = word.getBoundingClientRect().width;
    if (v > pinned) pinned = v;
  }
  /**
   * GUARDIA DEL TOPE (D-BBW-45). `topado` es lo que habría medido el método anterior. Si es MENOR que el ancho real, la palabra no cabe
   * y aquella medida estaba topada; y su firma es delatora: coincide EXACTAMENTE con el ancho disponible. Se comprueba para que la
   * regresión no pueda volver en silencio — es barato (un reflujo) frente a las decenas que ya cuesta la calibración.
   */
  word.style.width = "auto";
  const topado = word.getBoundingClientRect().width;
  const clamped = topado + C.CLAMP_EPS_PX < pinned;
  if (process.env.NODE_ENV !== "production" && clamped) {
    const avail = parseFloat(getComputedStyle(word).getPropertyValue("--bbf-lockup-avail"));
    const firma = Number.isFinite(avail) && Math.abs(topado - avail) < C.CLAMP_EPS_PX;
    console.error(
      "[weight-modulator] la palabra NO CABE: ancho real " + pinned.toFixed(2) + " px contra " + topado.toFixed(2) + " px de caja encogida" +
        (firma ? " (= el disponible, " + avail.toFixed(2) + " px: la firma del tope)" : "") +
        ". Se mide con max-content, así que la corrección converge; si alguien vuelve a medir con auto, se congela.",
    );
  }
  if (pinned > C.MIN_PIN_PX) word.style.width = pinned.toFixed(2) + "px";
  else pinned = 0;
  frame(clock, glyphs, curves, budget, tokens);
  return { curves, budget, pinned, samples: xs.length, clamped };
}
