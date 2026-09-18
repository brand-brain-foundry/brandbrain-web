/**
 * behavior/particle-field.ts — S3/S4 · PARTÍCULAS DEL FONDO: BURBUJAS Y NIEVE MARINA (fase 6k, portado P4; D-BBW-09 · D-BBW-16 · D-BBW-25 ·
 * D-BBW-28 · D-BBW-30 · D-BBW-31 · D-BBW-36 · D-BBW-37). Contrato: docs/system/BEHAVIOR.md §7. Inventario de origen: N1 doc A §3 (burbujas,
 * `dc:L109-215`) y §4 (nieve marina, `dc:L76-108`) de `Eye Fish Landing.dc.html`; clasificación en N1 doc D §3.
 *
 * QUÉ HACE, en una frase: GENERA el campo (D-BBW-36: se porta el generador, no la tirada). El export trae los 52 valores concretos, pero son
 * una tirada aleatoria del generador del original, no un diseño; lo que es diseño son los RECUENTOS (21 burbujas en tres planos de foco
 * 11/7/3 y 31 motas en tres planos 16/10/5), los RANGOS de cada plano (madres en primitives/particles.css y primitives/motion.css) y la
 * DISTRIBUCIÓN: la posición horizontal se centra promediando TRES muestras uniformes (la media de tres uniformes concentra el campo hacia el
 * centro en vez de repartirlo plano; el export lo muestra: burbujas 29–90 %, motas 12–77 %, medias ≈ 55 % y 51 %); el resto es uniforme dentro
 * de su rango. SEMILLA FIJA: una compilación produce siempre el mismo campo (HTML completo y medida repetible, D-BBW-09/28); cambiarla cambia
 * la disposición y obliga a re-medir el contraste (D-BBW-25).
 *
 * TOKENS QUE LEE (nunca los repite; D-BBW-30): ninguno. El módulo emite SOLO números normalizados 0..1; la hoja del componente los lleva a
 * los rangos de las madres: tamaño, opacidad, deriva, duración del ascenso / de la mota / de la oscilación y desenfoque por plano.
 *
 * CONSTANTES DE ALGORITMO (no son tokens). Clase por D-DOC-13 §2 en cada línea: estático · plantilla · dinámico.
 */

export type ParticleKind = "moteFine" | "moteMid" | "moteSoft" | "bubbleS" | "bubbleM" | "bubbleL";

export const PARTICLE_FIELD = Object.freeze({
  /** semilla del generador: fija para que cada compilación produzca el mismo campo (fase 6e; D-BBW-36) · plantilla (cualquier valor sirve; cambiarla obliga a re-medir) */
  SEED: 0x6e5f4b3a,
  /** recuentos por plano de foco: nieve marina fina/media/suave y burbujas S/M/L (N1 doc A §3.3, §4.3) · dinámico (composición de esta marca) */
  COUNTS: Object.freeze({ moteFine: 16, moteMid: 10, moteSoft: 5, bubbleS: 11, bubbleM: 7, bubbleL: 3 } as const satisfies Record<ParticleKind, number>),
  /** muestras uniformes que se PROMEDIAN para la posición horizontal: centra el campo (media de tres uniformes) en vez de repartirlo plano · dinámico (distribución de esta composición) */
  X_SAMPLES: 3,
  /** decimales con los que se escribe cada número normalizado en el HTML · estático */
  DECIMALS: 3,
});

export type Particle = {
  readonly id: string;
  readonly kind: ParticleKind;
  /** posición horizontal: fracción del ancho del campo (promedio de `X_SAMPLES` uniformes) */
  readonly x: number;
  /** posición vertical inicial de la mota: fracción de la altura del campo (las burbujas nacen bajo el campo y no la usan) */
  readonly y: number;
  /** tamaño dentro del rango de su plano (fracción) */
  readonly size: number;
  /** fase inicial del ascenso: fracción del ciclo (retardo negativo; el campo arranca repartido, no apilado en el origen) */
  readonly phase: number;
  /** duración del ascenso (burbuja) o del recorrido (mota) dentro del rango de su sistema (fracción entre k-min y k-max) */
  readonly k: number;
  /** opacidad dentro del rango de su plano (fracción) */
  readonly o: number;
  /** deriva horizontal (fracción: 0 = −máx, 1 = +máx) */
  readonly d: number;
  /** burbujas: periodo de la oscilación interna dentro de su rango (fracción); inconmensurable con el ascenso: la subida nunca es regular */
  readonly wobble?: number;
};

/** PURA · generador determinista (mulberry32): misma semilla → misma secuencia en Node y en cualquier navegador */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KINDS: readonly ParticleKind[] = ["moteFine", "moteMid", "moteSoft", "bubbleS", "bubbleM", "bubbleL"];
export const isBubble = (kind: ParticleKind): boolean => kind.startsWith("bubble");

/** PURA · el campo entero para una semilla: cada partícula consume el mismo número de muestras, en el mismo orden, así el campo es estable */
export function generate(seed: number = PARTICLE_FIELD.SEED): readonly Particle[] {
  const { COUNTS, X_SAMPLES, DECIMALS } = PARTICLE_FIELD;
  const next = seeded(seed);
  const scale = 10 ** DECIMALS;
  const round = (v: number) => Math.round(v * scale) / scale;
  const centered = () => {
    let sum = 0;
    for (let i = 0; i < X_SAMPLES; i++) sum += next();
    return sum / X_SAMPLES;
  };
  const out: Particle[] = [];
  for (const kind of KINDS) {
    for (let i = 0; i < COUNTS[kind]; i++) {
      const x = round(centered());
      const y = round(next());
      const size = round(next());
      const phase = round(next());
      const k = round(next());
      const o = round(next());
      const d = round(next());
      const wobble = round(next());
      out.push(isBubble(kind) ? { id: `${kind}-${i}`, kind, x, y, size, phase, k, o, d, wobble } : { id: `${kind}-${i}`, kind, x, y, size, phase, k, o, d });
    }
  }
  return Object.freeze(out);
}

/** el campo de esta compilación (semilla fija) */
export const PARTICLES: readonly Particle[] = generate();
