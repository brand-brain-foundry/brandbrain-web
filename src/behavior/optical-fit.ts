/**
 * behavior/optical-fit.ts — S7 · AJUSTE ÓPTICO DEL RÓTULO Y PESO POR PUNTERO (fase 6h, portado P1; D-BBW-28 · D-BBW-30 · D-BBW-31).
 * Contrato: docs/system/BEHAVIOR.md. Inventario de origen: N1 doc A §7 (`dc:Lnnn` = `Eye Fish Landing.dc.html`, línea).
 *
 * AJUSTE ÓPTICO (`fitLock`, dc:L596-620 + D-BBW-41): el rótulo cierra al ancho ANCLADO del titular, así el lock cierra como un bloque sólido a
 * cualquier tamaño. Un interletrado escrito a mano no sobrevive a una escala fluida: se mide, con una SONDA (clon del rótulo sin interletrado y
 * a un cuerpo de referencia fijo) contra el ancho anclado por el modulador (por eso la caja del titular no puede reflotar). El interletrado
 * sobrante tras la última letra se recorta con un margen negativo igual al interletrado.
 *
 * QUÉ CAMBIA EN LA FASE 6m (D-BBW-41), y es lo único de fondo: el cierre tiene DOS incógnitas acopladas, el TAMAÑO del rótulo y su
 * INTERLETRADO, y el diseño fijaba el tamaño (proporción 0,40 del titular) y resolvía el interletrado. Con las palabras nuevas esa elección
 * satura: `ecosystem` tiene 8 huecos para un titular 20 % más ancho, pediría 70,4 px por hueco y el tope del diseño eran 40, así que el
 * rótulo se quedaba en el 72,5 % del titular y el bloque dejaba de cerrar. Se INVIERTE cuál es la invariante: se conserva la RAZÓN
 * interletrado/tamaño medida en el export (`--bbf-type-lead-track-ratio`) y se RESUELVE el tamaño. Con r fijo y n letras:
 *     ancho(size) = size · A + r · size · (n − 1)      →      size = objetivo / (A + r · (n − 1))
 * donde A = ancho natural del rótulo por px de cuerpo (medido con la sonda; depende de la palabra y de la familia, nunca se escribe).
 * Cierra con CUALQUIER par de palabras, y por eso el tope de interletrado del diseño (`MAX_TRACK_PX`, dc:L616) se RETIRA: existía para que
 * un rótulo corto no se desparramase, y con la razón fija esa condición la garantiza la propia proporción.
 *
 * PUNTERO (`pointerWeight`, dc:L463-479): el rótulo engorda hacia el peso máximo de su familia cuando el cursor se acerca al lock (más a la
 * derecha, más peso; a la izquierda, menos) y se tiñe de acento; vuelve a su peso de rol al alejarse. El tracking por puntero que el comentario
 * del diseño menciona NO existe en su código (N1 doc A §7.3): el interletrado es fijo, medido.
 *
 * TOKENS QUE LEE (nunca los repite; D-BBW-30): peso de reposo del rótulo tal como el navegador lo aplica (`font-weight` computado =
 * `--bbf-type-lead-weight`) y el rango de la familia de texto por sus madres `--bbf-weight-text-range-min/-max`. El interletrado inicial
 * (antes de la primera medida) es el rol `--bbf-type-lead-tracking` en CSS; el color del acento lo aplica CSS por `data-pull`.
 */

export const OPTICAL_FIT = Object.freeze({
  /** ancho mínimo del titular para ajustar (dc:L601) · estático */
  MIN_TARGET_PX: 20,
  /** cambio mínimo para reescribir interletrado o cuerpo (dc:L617) · estático */
  MIN_DELTA_PX: 0.15,
  /** cuerpo de la sonda, en px: el ancho natural por px de cuerpo es invariante de escala, así que la sonda mide SIEMPRE aquí y la
   *  medida no depende de lo que el rótulo llevara puesto de una pasada anterior · estático (criterio técnico) */
  PROBE_SIZE_PX: 100,
});

export const POINTER_WEIGHT = Object.freeze({
  /** alcance mínimo de la atracción en px; si el lock es más ancho, manda su ancho (dc:L470; cae en ×105 de espaciado, pero ningún estilo lo
   *  consume: constante de algoritmo, no token) · dinámico */
  REACH_MIN_PX: 420,
  /** ganancia radial (cuánto engorda al acercarse) y lateral (cuánto más a la derecha, cuánto menos a la izquierda) (dc:L473) · dinámico */
  PULL_GAIN: 140,
  LATERAL_GAIN: 130,
  /** fracción del ancho del lock que cubre el recorrido lateral completo (dc:L472) · dinámico */
  LATERAL_SPAN: 0.75,
  /** histéresis: se reescribe solo si el peso cambia más de esto o la atracción más de esto (dc:L474) · estático */
  WEIGHT_STEP: 5,
  PULL_STEP: 0.04,
  /** atracción a partir de la cual el rótulo se tiñe de acento (dc:L802) · estático */
  TINT_THRESHOLD: 0.02,
});

export type LeadTokens = { rest: number; min: number; max: number };

/** Lee el peso de reposo del rótulo donde el navegador lo resuelve y el rango de su familia por sus madres. */
export function readLeadTokens(lead: HTMLElement): LeadTokens | null {
  const root = getComputedStyle(lead.ownerDocument.documentElement);
  const rest = parseFloat(getComputedStyle(lead).fontWeight);
  const min = parseFloat(root.getPropertyValue("--bbf-weight-text-range-min"));
  const max = parseFloat(root.getPropertyValue("--bbf-weight-text-range-max"));
  if (!Number.isFinite(rest) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;
  return { rest, min, max };
}

export type LockFit = { size: number; track: number };

/** Razón invariante interletrado/tamaño del rol del rótulo (`--bbf-type-lead-track-ratio`), o null si no es legible. */
export function readTrackRatio(lead: HTMLElement): number | null {
  const v = parseFloat(getComputedStyle(lead.ownerDocument.documentElement).getPropertyValue("--bbf-type-lead-track-ratio"));
  return Number.isFinite(v) && v >= 0 ? v : null;
}

/**
 * Cuerpo e interletrado (px) que cierran el rótulo al ancho objetivo conservando la razón `ratio` (D-BBW-41), o null si no procede.
 * TOCA EL DOM: añade y retira una sonda dentro del lock, a un cuerpo de referencia fijo.
 * `previous` es el par vigente (o null antes de la primera medida) para aplicar la histéresis.
 */
export function fitLock(lock: HTMLElement, lead: HTMLElement, targetWidth: number, ratio: number, previous: LockFit | null): LockFit | null {
  if (targetWidth < OPTICAL_FIT.MIN_TARGET_PX) return null;
  const probe = lead.cloneNode(true) as HTMLElement;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.letterSpacing = "0px";
  probe.style.marginRight = "0px";
  probe.style.whiteSpace = "nowrap";
  probe.style.width = "auto";
  probe.style.fontSize = OPTICAL_FIT.PROBE_SIZE_PX + "px";
  /* la sonda hereda la clase del rótulo, y con ella su tope de ancho: sin esto el ancho natural se MIDE RECORTADO al ancho del
     bloque en cuanto el cuerpo de referencia lo supera (a 360 px daba 328 en vez de 646) y el cierre resolvería un cuerpo enorme */
  probe.style.maxWidth = "none";
  probe.setAttribute("aria-hidden", "true");
  lock.appendChild(probe);
  const natural = probe.getBoundingClientRect().width;
  lock.removeChild(probe);
  const chars = (lead.textContent ?? "").length;
  if (!natural || chars < 2) return null;
  /** ancho natural por px de cuerpo: invariante de escala, propio de la palabra y de la familia */
  const perPx = natural / OPTICAL_FIT.PROBE_SIZE_PX;
  const denom = perPx + ratio * (chars - 1);
  if (denom <= 0) return null;
  const size = targetWidth / denom;
  const next = { size, track: ratio * size };
  if (previous && Math.abs(previous.size - next.size) <= OPTICAL_FIT.MIN_DELTA_PX && Math.abs(previous.track - next.track) <= OPTICAL_FIT.MIN_DELTA_PX) {
    return previous;
  }
  return next;
}

/** Aplica el par medido: cuerpo, `letter-spacing` en px y margen derecho negativo que recorta el sobrante tras la última letra. */
export function applyLockFit(lead: HTMLElement, fit: LockFit): void {
  lead.style.fontSize = fit.size.toFixed(2) + "px";
  lead.style.letterSpacing = fit.track.toFixed(2) + "px";
  lead.style.marginRight = (-fit.track).toFixed(2) + "px";
}

export type PointerState = { weight: number; pull: number };

/** Peso y atracción del rótulo para una posición del puntero respecto a la caja del lock. Pura. */
export function pointerWeight(x: number, y: number, lock: DOMRect, tokens: LeadTokens): PointerState {
  const cx = lock.left + lock.width / 2;
  const cy = lock.top + lock.height / 2;
  const d = Math.hypot(x - cx, y - cy);
  const reach = Math.max(lock.width, POINTER_WEIGHT.REACH_MIN_PX);
  const pull = Math.max(0, 1 - d / reach);
  const lateral = Math.max(-1, Math.min(1, (x - cx) / (lock.width * POINTER_WEIGHT.LATERAL_SPAN || 1)));
  const raw = Math.round(tokens.rest + pull * (POINTER_WEIGHT.PULL_GAIN + lateral * POINTER_WEIGHT.LATERAL_GAIN));
  return { weight: Math.max(tokens.min, Math.min(tokens.max, raw)), pull };
}

/** ¿Merece reescribir el rótulo? Histéresis del diseño sobre peso y atracción. */
export function pointerChanged(prev: PointerState, next: PointerState): boolean {
  return Math.abs(next.weight - prev.weight) > POINTER_WEIGHT.WEIGHT_STEP || Math.abs(next.pull - prev.pull) > POINTER_WEIGHT.PULL_STEP;
}
