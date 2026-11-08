/**
 * behavior/field-media.ts — S12 · CAPA DE MEDIOS DEL CAMPO (R2 del perfil, 2026-11-08; BEHAVIOR.md §15). Capa OPCIONAL sobre el campo S8: cada
 * CONSULTA del campo puede llevar un medio del lote (foto o vídeo) que se ARMA por bloques tras el cursor del barrido y se DESARMA con la
 * disolución de la consulta. Conducta aprobada en P0/P0b (D-BBW-96: «armado, nítido, sin pixelar, con textura mínima»; `hold` 1, P0b §0).
 *
 * QUÉ CAMBIA FRENTE AL PROTOTIPO DE P0b (ajuste de Zavala de las 11:04: en escritorio los medios salían demasiado grandes, se solapaban y
 * formaban siempre la misma línea):
 *   · RECORTE COMÚN: los medios llegan del puerto ya cuadrados (una sola proporción, recortados por su punto focal; MEDIA §11). El medio llena
 *     su caja cuadrada entera («cover» sin pérdida: la caja tiene la proporción del medio).
 *   · TOPE: el lado del medio es el menor entre su CAJA ESCANEADA (la banda de la consulta, tan alta como ancha y centrada en sus carriles) y el
 *     TOPE de la vista `--bbf-field-media-cap` (la mitad del alcance visible de la zona a lo largo del lado corto de la ventana; se lee por una
 *     sonda, nunca se repite aquí).
 *   · VARIACIÓN: el lado se sortea por consulta entre (1 − SIZE_SPREAD) y 1 de ese máximo, y la posición se desplaza al azar DENTRO de la caja
 *     escaneada; si choca con otro medio vivo o con el texto se prueban otras posiciones (TRIES) antes de dejar la consulta sin medio. Así dos
 *     medios no se solapan y no forman una línea fija. Todo el azar es FIJO por consulta (hash del índice y la ranura de S8): determinista.
 *   · RESERVA DEL TEXTO (P0 §2, I-8): ningún punto en las celdas bajo el texto (más un aire de `--bbf-space-3`) y ningún medio que lo toque; si el
 *     texto llega encima al desplazarse (la cabecera es fija), el medio se desarma en el acto.
 *
 * NO HAY RELOJ NUEVO: la capa vive del reloj de S8 (lo llama `paint` en cada tick) y de sus tiempos (`SWEEP_END_S`, `RESULT_END_S`,
 * `DISSOLVE_START_S`, `QUERY_LIFE_S`, `QUERY_EVERY_S`). Con lote vacío el componente no crea la capa y el campo es el de hoy.
 * VÍDEO: sin sonido, en bucle, `playsinline`, precalentado al cargar (el primer `drawImage` de un vídeo costaba una tarea larga de ~580 ms, R §5.3);
 * se reproduce SOLO mientras un medio armado lo usa y el campo corre (pestaña visible, sección en vista, sin movimiento reducido).
 * Cada asignación avisa con `bbf:field-media` en la placa (detalle: medio, caja en px de la placa, tope, motivo si se omite): es lo que el arnés lee.
 *
 * TOKENS QUE LEE (nunca repite; BEHAVIOR.md §1.2): `--bbf-field-media-cap` (tope) y `--bbf-space-3` (aire de la reserva), resueltos en px por una
 * sonda en cada `layout()`. CONSTANTES: tabla en docs/system/BEHAVIOR.md §15; clase por D-DOC-13 §2.
 */
import { CRITERIO_FIELD as C, hash3, mulberry32, type Field, type FieldLayer, type Query } from "./criterio-field";

export const FIELD_MEDIA = Object.freeze({
  /** lado del bloque de armado, en celdas del campo · dinámico (carácter) · P0b `block` 2 */
  BLOCK: 2,
  /** tiempo en que un bloque crece de nada a entero (y encoge al desarmarse), s · dinámico · P0/P0b `grow` 0,24 (aprobado, D-BBW-96) */
  GROW_S: 0.24,
  /** cuánto retrasa la disolución del medio hacia el hueco muerto de su ranura (0…1) · dinámico · P0b §0, decisión de Zavala: 1 */
  HOLD: 1,
  /** lado mínimo del medio en celdas: la banda base de S8 (por debajo la consulta sale sin medio) · plantilla · P-BBW-98 §7.3 */
  MIN_CELLS: C.BAND_BASE,
  /** variación del lado cuando manda el tope: entre (1 − SIZE_SPREAD) y 1 del tope · dinámico · R2 (ajuste de Zavala 11:04) */
  SIZE_SPREAD: 0.4,
  /** posiciones probadas dentro de la caja antes de dejar la consulta sin medio · plantilla · R2 */
  TRIES: 4,
  /** semilla del ciclo del lote (bolsa barajada) · plantilla */
  SEED: C.SEED ^ 0x6d1a,
  /** selectores del texto que reserva celdas: el de la sección y la navegación de la cabecera (fija) · estático */
  TEXT_IN_SECTION: "h1, h2, h3, p, li, a, button",
  TEXT_IN_HEADER: '[data-component="bbf-header"] a, [data-component="bbf-header"] summary',
});

const M = FIELD_MEDIA;

/** Un medio del lote, tal como llega del puerto (`src/media`, `FieldMediaItem`). */
export type FieldMediaSource = { readonly id: string; readonly kind: "image" | "video"; readonly src: string; readonly side: number };

type Loaded = { src: FieldMediaSource; el: HTMLImageElement | HTMLVideoElement; ready: boolean };
type Rect = { c0: number; r0: number; s: number };
type Assignment = Rect & { key: string; q: Query; item: Loaded; salt: number; dissolveStart: number; lifeEnd: number };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Resuelve un token de longitud a px con una sonda dentro de `host` (los tokens llevan `calc()`/unidades de vista dentro). */
function readLength(host: HTMLElement, token: string): number {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.width = `var(${token})`;
  host.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return Number.isFinite(px) ? px : 0;
}

/**
 * La capa de medios. `plate` = la placa del campo (sus px son los de la capa) · `section` = la sección cuyo texto se reserva · `items` = el lote
 * (no vacío: con lote vacío no se crea). Los medios se cargan la primera vez que el campo ARRANCA (con movimiento reducido nunca se cargan).
 */
export function createFieldMediaLayer(plate: HTMLElement, section: HTMLElement, items: readonly FieldMediaSource[]): FieldLayer & { dispose(): void } {
  const loaded: Loaded[] = [];
  const live = new Map<string, Assignment>();
  const seen = new Set<string>();
  const rnd = mulberry32(M.SEED);
  let bag: number[] = [];
  let last = -1;
  let running = false;
  let cap = 0;
  let pad = 0;
  let textRects: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  let textDirty = true;
  let reserveCells: Uint8Array | null = null;
  let reserveFor: Field | null = null;

  const emit = (detail: Record<string, unknown>) => plate.dispatchEvent(new CustomEvent("bbf:field-media", { detail }));

  // ── carga (perezosa) y precalentado ──
  const load = () => {
    if (loaded.length) return;
    for (const src of items) {
      if (src.kind === "image") {
        const el = new Image();
        el.decoding = "async";
        const it: Loaded = { src, el, ready: false };
        el.src = src.src;
        void el.decode().then(() => (it.ready = true), () => {});
        loaded.push(it);
      } else {
        const el = document.createElement("video");
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.preload = "auto";
        const it: Loaded = { src, el, ready: false };
        el.addEventListener(
          "loadeddata",
          () => {
            // precalentar: un primer dibujo fuera de pantalla saca del camino la inicialización del decodificador
            const warm = document.createElement("canvas");
            warm.width = warm.height = 1;
            warm.getContext("2d")?.drawImage(el, 0, 0, 1, 1);
            it.ready = true;
          },
          { once: true },
        );
        el.src = src.src;
        loaded.push(it);
      }
    }
  };

  /** Ciclo del lote: bolsa barajada sin repetir hasta agotarla y sin repetir al cruzar de ciclo; con un medio, siempre el mismo. */
  const next = (): Loaded | null => {
    const n = loaded.length;
    if (n === 0) return null;
    if (bag.length === 0) {
      bag = loaded.map((_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // la bolsa se saca por el final: el último sacado del ciclo anterior no puede ser el primero de este
      if (n > 1 && bag[n - 1] === last) {
        const j = Math.floor(rnd() * (n - 1));
        [bag[n - 1], bag[j]] = [bag[j], bag[n - 1]];
      }
    }
    const i = bag.pop() as number;
    last = i;
    return loaded[i];
  };

  // ── texto: rects en px de la placa ──
  const measureText = () => {
    const p = plate.getBoundingClientRect();
    const els = [...section.querySelectorAll<HTMLElement>(M.TEXT_IN_SECTION), ...document.querySelectorAll<HTMLElement>(M.TEXT_IN_HEADER)];
    textRects = els
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ left: r.left - p.left, right: r.right - p.left, top: r.top - p.top, bottom: r.bottom - p.top }));
    textDirty = false;
    reserveFor = null;
  };
  const markDirty = () => {
    textDirty = true;
  };
  addEventListener("scroll", markDirty, { passive: true });
  addEventListener("resize", markDirty);
  // el texto ENTRA con su animación (S6: desplazamiento + enfoque): medido a mitad de entrada queda desplazado, así que se vuelve a medir
  // cuando termina cada animación o transición de la sección (medido en R2 a 768: un medio llegó a tocar el titular con la medida vieja)
  section.addEventListener("animationend", markDirty);
  section.addEventListener("transitionend", markDirty);

  const blocked = (f: Field, r: Rect) => {
    if (textDirty) measureText();
    const p = f.g.pitch;
    const x = r.c0 * p, y = r.r0 * p, w = r.s * p;
    for (const t of textRects) if (x < t.right + pad && x + w > t.left - pad && y < t.bottom + pad && y + w > t.top - pad) return true;
    return false;
  };
  const overlaps = (r: Rect) => {
    for (const a of live.values()) {
      if (r.c0 < a.c0 + a.s + M.BLOCK && r.c0 + r.s + M.BLOCK > a.c0 && r.r0 < a.r0 + a.s + M.BLOCK && r.r0 + r.s + M.BLOCK > a.r0) return true;
    }
    return false;
  };

  /** Cuándo llega el cursor del barrido a la columna `col` (la curva de S8: 1 − (1 − s)²). */
  const reachAge = (q: Query, col: number) => {
    const frac = Math.min(1, Math.max(0, (col - q.bandStart) / Math.max(1, q.bandWidth)));
    return (1 - Math.sqrt(1 - frac)) * C.SWEEP_END_S;
  };

  const assign = (f: Field, q: Query): Assignment | null => {
    const g = f.g;
    const p = g.pitch;
    // la CAJA ESCANEADA: la banda de la consulta, tan alta como ancha y centrada en sus carriles, dentro de la placa
    const W = q.bandWidth;
    const H = Math.min(W, g.rows);
    const t0 = g.laneRows[q.firstLane];
    const b0 = g.laneRows[q.firstLane + q.laneCount - 1] + 1;
    const top = Math.max(0, Math.min(g.rows - H, Math.round((t0 + b0) / 2 - H / 2)));
    const capCells = Math.floor(cap / p);
    const s0 = Math.min(W, H, capCells);
    const base = { slot: q.slot, index: q.index, boxPx: { x: q.bandStart * p, y: top * p, w: W * p, h: H * p }, capPx: cap, pitch: p };
    if (s0 < M.MIN_CELLS) return emit({ ...base, type: "skip", reason: "small" }), null;
    // la variación solo cuando MANDA EL TOPE: si manda la caja, su ancho ya varía por consulta (la banda de S8 se sortea) y encogerla más
    // empeoraba el teléfono (medido en R2 a 390: mediana 62 px frente a 120 de P0b)
    const s = s0 < capCells ? s0 : Math.max(M.MIN_CELLS, Math.round(s0 * (1 - M.SIZE_SPREAD * hash3(q.index, 41 + q.slot * 7, 9))));
    let reason = "";
    for (let k = 0; k < M.TRIES; k++) {
      const r: Rect = {
        c0: q.bandStart + Math.floor(hash3(q.index, 43 + q.slot * 7 + k * 101, 10) * (W - s + 1)),
        r0: top + Math.floor(hash3(q.index, 47 + q.slot * 7 + k * 101, 11) * (H - s + 1)),
        s,
      };
      if (overlaps(r)) { reason = "overlap"; continue; }
      if (blocked(f, r)) { reason = "text"; continue; }
      const item = next();
      if (!item) return null;
      if (!item.ready) return emit({ ...base, type: "skip", reason: "loading", item: item.src.id }), null;
      if (item.src.kind === "video" && running) void (item.el as HTMLVideoElement).play().catch(() => {});
      const dissolveStart = C.DISSOLVE_START_S + M.HOLD * (C.QUERY_EVERY_S - C.QUERY_LIFE_S);
      emit({ ...base, type: "arm", item: item.src.id, kind: item.src.kind, x: r.c0 * p, y: r.r0 * p, side: s * p, try: k });
      return { ...r, key: `${q.slot}:${q.index}`, q, item, salt: q.index * 31 + q.slot * 1009, dissolveStart, lifeEnd: dissolveStart + (C.QUERY_LIFE_S - C.DISSOLVE_START_S) };
    }
    emit({ ...base, type: "skip", reason });
    return null;
  };

  const syncVideos = () => {
    for (const it of loaded) {
      if (it.src.kind !== "video") continue;
      const v = it.el as HTMLVideoElement;
      const used = running && [...live.values()].some((a) => a.item === it);
      if (used && v.paused) void v.play().catch(() => {});
      else if (!used && !v.paused) v.pause();
    }
  };

  return {
    layout(f: Field) {
      live.clear();
      cap = readLength(plate, "--bbf-field-media-cap");
      pad = readLength(plate, "--bbf-space-3");
      textDirty = true;
      reserveFor = null;
      void f;
      syncVideos();
    },

    reserve(f: Field) {
      if (textDirty) measureText();
      if (reserveFor === f && reserveCells) return reserveCells;
      const g = f.g, p = g.pitch;
      const m = new Uint8Array(g.cols * g.rows);
      for (const r of textRects) {
        const c0 = Math.max(0, Math.floor((r.left - pad) / p)), c1 = Math.min(g.cols - 1, Math.ceil((r.right + pad) / p));
        const r0 = Math.max(0, Math.floor((r.top - pad) / p)), r1 = Math.min(g.rows - 1, Math.ceil((r.bottom + pad) / p));
        if (c1 < c0 || r1 < r0) continue;
        for (let y = r0; y <= r1; y++) m.fill(1, y * g.cols + c0, y * g.cols + c1 + 1);
      }
      reserveCells = m;
      reserveFor = f;
      return m;
    },

    paint(ctx: CanvasRenderingContext2D, f: Field, t: number, qs: (Query | null)[]) {
      const g = f.g, p = g.pitch, k = M.BLOCK;
      // primero salen los que ya terminaron (la siguiente consulta de su ranura llega justo cuando el anterior acaba: hold 1)
      for (const [key, a] of live) if (t - a.q.start >= a.lifeEnd) live.delete(key);
      for (const q of qs) {
        if (!q) continue;
        const key = `${q.slot}:${q.index}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const a = assign(f, q);
        if (a) live.set(key, a);
      }
      if (live.size === 0) {
        syncVideos();
        return null;
      }
      const covered = new Uint8Array(g.cols * g.rows);
      const jitterSpan = C.RESULT_END_S - C.SWEEP_END_S;
      // TEXTURA MÍNIMA DERIVADA DE LA TRAMA DEL CAMPO: la junta que separa dos puntos del campo (paso − punto) REPARTIDA entre las celdas que
      // agrupa un bloque. Con la junta entera (medido en R2 a 1440/1920) la rejilla oscurecía las fotos de fondo claro como un tamiz.
      const seam = (p - C.DOT) / k;
      for (const [key, a] of live) {
        const age = t - a.q.start;
        // reserva del texto: si el texto ha llegado encima (cabecera fija al desplazar), el medio se desarma ya, a media duración
        if (age < a.dissolveStart && blocked(f, a)) {
          a.dissolveStart = age;
          a.lifeEnd = age + (C.QUERY_LIFE_S - C.DISSOLVE_START_S) / 2;
          emit({ type: "forced-out", slot: a.q.slot, index: a.q.index, item: a.item.src.id });
        }
        if (age >= a.lifeEnd) { live.delete(key); continue; }
        const path = new Path2D();
        let any = false;
        const outSpan = a.lifeEnd - a.dissolveStart;
        for (let j = 0; j < a.s; j += k) {
          for (let i = 0; i < a.s; i += k) {
            const col = a.c0 + i, row = a.r0 + j;
            const appear = reachAge(a.q, col) + hash3(col, row, a.salt + 7) * jitterSpan;
            const leave = a.dissolveStart + hash3(col, row, a.salt + 101) * Math.max(0, outSpan - M.GROW_S);
            const sc = smooth((age - appear) / M.GROW_S) * (1 - smooth((age - leave) / M.GROW_S));
            if (sc <= 0) continue;
            const bw = Math.min(k, a.s - i) * p, bh = Math.min(k, a.s - j) * p;
            const w = (bw - seam) * sc, h = (bh - seam) * sc;
            path.rect(col * p + (bw - w) / 2, row * p + (bh - h) / 2, w, h);
            any = true;
            if (sc >= 0.5) for (let jj = 0; jj < k && j + jj < a.s; jj++) covered.fill(1, (row + jj) * g.cols + col, (row + jj) * g.cols + col + Math.min(k, a.s - i));
          }
        }
        if (!any) continue;
        // el medio entero, a resolución real, recortado por los bloques vivos: nítido, sin pixelar (P0 §2)
        const X = a.c0 * p, Y = a.r0 * p, S = a.s * p;
        ctx.save();
        ctx.clip(path);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(a.item.el, X, Y, S, S);
        ctx.restore();
      }
      syncVideos();
      return covered;
    },

    running(on: boolean) {
      running = on;
      if (on) load();
      syncVideos();
    },

    dispose() {
      running = false;
      syncVideos();
      removeEventListener("scroll", markDirty);
      removeEventListener("resize", markDirty);
      section.removeEventListener("animationend", markDirty);
      section.removeEventListener("transitionend", markDirty);
      for (const it of loaded) if (it.src.kind === "video") (it.el as HTMLVideoElement).removeAttribute("src");
    },
  };
}
