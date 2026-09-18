/**
 * behavior/optical-fit.ts — S7 · AJUSTE ÓPTICO DEL RÓTULO Y PESO POR PUNTERO (fase 6h, portado P1; D-BBW-28 · D-BBW-30 · D-BBW-31).
 * Contrato: docs/system/BEHAVIOR.md. Inventario de origen: N1 doc A §7 (`dc:Lnnn` = `Eye Fish Landing.dc.html`, línea).
 *
 * AJUSTE ÓPTICO (`fitTracking`, dc:L596-620): el rótulo se interletra hasta que su ancho medido iguala el ancho ANCLADO del titular, así el
 * lock cierra como un bloque sólido a cualquier tamaño. Un interletrado escrito a mano no sobrevive a una escala fluida: se mide. Se mide con
 * una SONDA (clon del rótulo sin interletrado) contra el ancho anclado por el modulador (por eso la caja del titular no puede reflotar). El
 * interletrado sobrante tras la última letra se recorta con un margen negativo igual al interletrado.
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
  /** tope del interletrado medido, en px (dc:L616) · estático (evita que un rótulo muy corto se desparrame) */
  MAX_TRACK_PX: 40,
  /** cambio mínimo para reescribir el interletrado (dc:L617) · estático */
  MIN_DELTA_PX: 0.15,
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

/**
 * Interletrado (px) que cierra el rótulo al ancho objetivo, o null si no procede. TOCA EL DOM: añade y retira una sonda dentro del lock.
 * `previous` es el interletrado vigente en px (o null antes de la primera medida) para aplicar la histéresis.
 */
export function fitTracking(lock: HTMLElement, lead: HTMLElement, targetWidth: number, previous: number | null): number | null {
  if (targetWidth < OPTICAL_FIT.MIN_TARGET_PX) return null;
  const probe = lead.cloneNode(true) as HTMLElement;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.letterSpacing = "0px";
  probe.style.marginRight = "0px";
  probe.style.whiteSpace = "nowrap";
  probe.style.width = "auto";
  probe.setAttribute("aria-hidden", "true");
  lock.appendChild(probe);
  const natural = probe.getBoundingClientRect().width;
  lock.removeChild(probe);
  const chars = (lead.textContent ?? "").length;
  if (!natural || chars < 2) return null;
  const per = (targetWidth - natural) / (chars - 1);
  const next = Math.max(0, Math.min(OPTICAL_FIT.MAX_TRACK_PX, per));
  if (previous !== null && Math.abs(previous - next) <= OPTICAL_FIT.MIN_DELTA_PX) return previous;
  return next;
}

/** Aplica un interletrado medido: `letter-spacing` en px y margen derecho negativo que recorta el sobrante tras la última letra. */
export function applyTracking(lead: HTMLElement, track: number): void {
  lead.style.letterSpacing = track.toFixed(2) + "px";
  lead.style.marginRight = (-track).toFixed(2) + "px";
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
