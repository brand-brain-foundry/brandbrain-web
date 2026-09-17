/**
 * Campo de partículas del héroe (fase 6e): la LISTA de partículas con sus parámetros NORMALIZADOS (0..1). Los valores reales (tamaños,
 * desenfoques, opacidades, recorridos, duraciones, tintes) viven en tokens (primitives/particles.css · semantic/particles.css ·
 * primitives/motion.css); aquí solo hay azar REPRODUCIBLE: una semilla fija produce siempre el mismo campo, así el HTML servido es el
 * mismo en cada compilación (D-BBW-09: HTML completo, sin depender del cliente) y la medida de contraste del output es repetible.
 * Recuentos del inventario (N0 §2.2/§2.3): 31 motas y 21 burbujas. Clases y recuentos tal como el N0 los deja leer: motas 14 nítidas ·
 * 7 con desenfoque 0,3 px · 10 grandes con desenfoque 0,8 px (los recuentos 7 y 10 son los de esos desenfoques en el inventario);
 * burbujas 11 pequeñas · 7 medianas · 3 grandes (los recuentos de sus tres brillos). Lo que el N0 NO registra (qué partícula concreta
 * lleva qué valor dentro de cada rango) es composición de este componente y se reporta como tal en el output.
 */
export type ParticleKind = "moteFine" | "moteFineSoft" | "moteSoft" | "bubbleS" | "bubbleM" | "bubbleL";

export type Particle = {
  readonly id: string;
  readonly kind: ParticleKind;
  /** posición horizontal (fracción del ancho de la caja) */
  readonly x: number;
  /** posición vertical inicial (fracción de la altura; las burbujas nacen bajo la caja y no la usan) */
  readonly y: number;
  /** tamaño dentro del rango de su clase (fracción) */
  readonly size: number;
  /** fase inicial de la animación (fracción del ciclo) */
  readonly phase: number;
  /** duración dentro del rango (fracción entre k-min y k-max) */
  readonly k: number;
};

const COUNTS: Readonly<Record<ParticleKind, number>> = {
  moteFine: 14,
  moteFineSoft: 7,
  moteSoft: 10,
  bubbleS: 11,
  bubbleM: 7,
  bubbleL: 3,
};

/** Generador determinista (mulberry32): misma semilla → misma secuencia en Node y en cualquier navegador. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (v: number) => Math.round(v * 1000) / 1000;

function build(): readonly Particle[] {
  const next = seeded(0x6e5f4b3a); // semilla fija de la fase 6e: cambiarla cambia el campo (y obliga a re-medir el contraste)
  const out: Particle[] = [];
  for (const kind of Object.keys(COUNTS) as ParticleKind[]) {
    for (let i = 0; i < COUNTS[kind]; i++) {
      out.push({ id: `${kind}-${i}`, kind, x: round(next()), y: round(next()), size: round(next()), phase: round(next()), k: round(next()) });
    }
  }
  return out;
}

export const PARTICLE_FIELD: readonly Particle[] = build();
