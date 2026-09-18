/**
 * behavior/subject-tracking.ts — S2 · VÍDEO DEL HÉROE: SEGUIMIENTO DEL SUJETO (fase 6j, portado P3; D-BBW-24 · D-BBW-25 · D-BBW-28 ·
 * D-BBW-30 · D-BBW-31). Contrato: docs/system/BEHAVIOR.md §5. Inventario de origen: N1 doc A §2 (`dc:Lnnn` = `Eye Fish Landing.dc.html`
 * del export, línea) y clasificación en N1 doc D §2.
 *
 * QUÉ HACE, en una frase: cada pocas decenas de milisegundos dibuja el fotograma en un lienzo diminuto, calcula el CENTROIDE DE LUMINANCIA
 * con un exponente que pesa lo claro por encima de lo oscuro (sin él la neblina del fondo arrastra el centroide al centro y el seguimiento
 * deja de perseguir nada, dc:L413), lo suaviza con un filtro exponencial y TRASLADA el encuadre de forma ACOTADA sobre una escala algo mayor
 * que uno: la holgura de la traslación es exactamente la mitad del sobrante del zoom, así la traslación nunca descubre el borde del vídeo.
 * El vídeo es el único que hay: sujeto único y luminoso sobre negro (D-BBW-24); con otro vídeo las constantes de plantilla se recalibran.
 *
 * TOKENS QUE LEE (nunca los repite; D-BBW-30): ninguno por valor. La geometría del escenario y su máscara son roles de composición que
 * consume el CSS del componente (`--bbf-stage-*`, `--bbf-stage-mask`: la máscara va sobre el ESCENARIO, no sobre el vídeo, y sus radios son
 * 50 %/50 %: un radio mayor dejaría la parada transparente fuera de la caja y se vería el borde del rectángulo, N1 doc A §2.7). La quietud
 * (D-BBW-31) la lee el componente por el rol de medio `--bbf-motion-media-display` resuelto en el vídeo (semantic/motion.css): con movimiento
 * reducido el vídeo no se muestra y el bucle NO ARRANCA; con la pestaña oculta se detiene. El REPOSO que trae el HTML servido (D-BBW-28) es
 * `REST_TRANSFORM`: el encuadre centrado al zoom, sin traslación; el póster (primer fotograma exacto, MEDIA.md) lo recibe también, así
 * póster y reposo coinciden y no hay salto al arrancar.
 *
 * CONSTANTES DE ALGORITMO (no son tokens). Clase por D-DOC-13 §2 en cada línea: estático · plantilla · dinámico.
 */

export const SUBJECT_TRACKING = Object.freeze({
  /** escala del vídeo dentro del escenario: «cuánto sobra para poder seguir»; acota la traslación (dc:L391) · dinámico (composición; residual
   *  de la retícula, N1 doc D §2: no cae en ninguna escala de tokens y ningún estilo lo consume) */
  ZOOM: 1.08,
  /** lienzo de muestreo, 16:9 mínimo con precisión suficiente (dc:L401) · estático (criterio técnico) */
  SAMPLE: Object.freeze({ w: 96, h: 54 }),
  /** periodo de muestreo del centroide en el bucle de cuadros (dc:L661); además se muestrea en cada `timeupdate` (dc:L665) · estático
   *  (coste-precisión; periodo de muestreo, no duración de UI: fuera de la retícula de movimiento, N1 doc D §6) */
  PERIOD_MS: 70,
  /** luminancia Rec.709 sobre el valor codificado (dc:L412) · estático (misma fórmula que el sombreador y el modelo de contraste) */
  LUMA: Object.freeze([0.2126, 0.7152, 0.0722] as const),
  /** umbral de luminancia por debajo del cual el píxel no pesa (dc:L414) · plantilla (depende del vídeo: negro con sujeto) */
  THRESHOLD: 0.1,
  /** exponente del peso: pesa lo claro por encima de la neblina (dc:L414) · plantilla */
  EXPONENT: 2.4,
  /** masa mínima del cuadro para actualizar el centroide: evita saltos en cuadros casi negros (dc:L418) · plantilla */
  MIN_MASS: 0.6,
  /** suavizado exponencial por muestra: ~14 muestras (≈ 1 s) para el 71 % del recorrido; la primera muestra fija sin suavizar (dc:L421-423) · plantilla */
  SMOOTHING: 0.085,
  /** cadena de reintentos de reproducción automática: cada `everyMs` hasta `max` intentos o hasta que reproduce (dc:L650) · estático (patrón de autoplay) */
  RETRY: Object.freeze({ everyMs: 350, max: 24 }),
  /** `readyState` mínimo para muestrear: HAVE_CURRENT_DATA (dc:L398) · estático */
  MIN_READY_STATE: 2,
  /** decimales con los que se escribe la traslación (dc:L433) · estático */
  DECIMALS: 3,
});

export type Centroid = { x: number; y: number };
/** estado del seguimiento: centroide suavizado en fracción del cuadro (0,5 · 0,5 = centro) y si ya hubo una muestra (dc:L392) */
export type TrackState = { x: number; y: number; ready: boolean };
export type Framing = { dx: number; dy: number };

export const restState = (): TrackState => ({ x: 0.5, y: 0.5, ready: false });

/** PURA · centroide de luminancia ponderado sobre RGBA (dc:L408-420); `null` si el cuadro no tiene masa suficiente */
export function centroid(data: Uint8ClampedArray, w: number, h: number): Centroid | null {
  const { LUMA, THRESHOLD, EXPONENT, MIN_MASS } = SUBJECT_TRACKING;
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const lum = (data[p] * LUMA[0] + data[p + 1] * LUMA[1] + data[p + 2] * LUMA[2]) / 255;
      const weight = lum > THRESHOLD ? Math.pow(lum, EXPONENT) : 0;
      sx += x * weight;
      sy += y * weight;
      sw += weight;
    }
  }
  if (sw < MIN_MASS) return null;
  return { x: sx / sw / (w - 1), y: sy / sw / (h - 1) };
}

/** PURA · suavizado exponencial hacia la muestra; la primera muestra fija sin suavizar (dc:L421-423). Muta y devuelve el estado. */
export function follow(state: TrackState, c: Centroid): TrackState {
  if (!state.ready) {
    state.x = c.x;
    state.y = c.y;
    state.ready = true;
    return state;
  }
  const k = SUBJECT_TRACKING.SMOOTHING;
  state.x += (c.x - state.x) * k;
  state.y += (c.y - state.y) * k;
  return state;
}

/** PURA · holgura de la traslación en % del vídeo sin escalar: (z − 1) / 2 / z (dc:L430). Con z = 1,08: 3,7037 %; escalada, el 4 % del
 *  escenario = la mitad del sobrante del zoom, así nunca aparece un borde. */
export function slackPercent(z = SUBJECT_TRACKING.ZOOM): number {
  return ((z - 1) / 2 / z) * 100;
}

/** PURA · traslación acotada que lleva el centroide al centro (dc:L431-432) */
export function framing(state: TrackState, z = SUBJECT_TRACKING.ZOOM): Framing {
  const slack = slackPercent(z);
  const clamp = (v: number) => Math.max(-slack, Math.min(slack, v));
  return { dx: clamp((0.5 - state.x) * 100), dy: clamp((0.5 - state.y) * 100) };
}

/** PURA · la cadena de transformación que se escribe en el vídeo (dc:L433): escala y después traslación en % de la caja sin escalar */
export function transformFor({ dx, dy }: Framing, z = SUBJECT_TRACKING.ZOOM): string {
  const d = SUBJECT_TRACKING.DECIMALS;
  return `scale(${z}) translate(${dx.toFixed(d)}%, ${dy.toFixed(d)}%)`;
}

/** el encuadre de REPOSO (D-BBW-28): centrado al zoom, sin traslación; es lo que trae el HTML servido y lo que ve el póster */
export const REST_TRANSFORM = transformFor({ dx: 0, dy: 0 });

export type Sampler = {
  /** MIDE (lee el fotograma actual): centroide del cuadro o `null` si el vídeo no está listo, no se puede leer o no tiene masa */
  sample(video: HTMLVideoElement): Centroid | null;
  dispose(): void;
};

/** MIDE · muestreador sobre un lienzo diminuto creado una vez (dc:L399-407); el vídeo debe ser del mismo origen (`getImageData`) */
export function createSampler(doc: Document): Sampler {
  const { w, h } = SUBJECT_TRACKING.SAMPLE;
  let canvas: HTMLCanvasElement | null = doc.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return {
    sample(video) {
      if (!ctx || video.readyState < SUBJECT_TRACKING.MIN_READY_STATE || !video.videoWidth) return null;
      try {
        ctx.drawImage(video, 0, 0, w, h);
        return centroid(ctx.getImageData(0, 0, w, h).data, w, h);
      } catch {
        return null;
      }
    },
    dispose() {
      canvas = null;
    },
  };
}
