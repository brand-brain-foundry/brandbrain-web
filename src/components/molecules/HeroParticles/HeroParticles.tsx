import type { CSSProperties } from "react";
import { PARTICLE_FIELD, type Particle, type ParticleKind } from "./field";
import styles from "./HeroParticles.module.css";

/**
 * HeroParticles — molecule. El FONDO DE PARTÍCULAS del héroe (fase 6e; N0 §2.3: motas y burbujas, "misma receta con parámetros
 * aleatorizados"). Es MEDIO en movimiento, no animación de interfaz: vive en la capa de partículas (semantic/layers.css), entre el velo
 * global y el contenido, y pasa por debajo del velo local de legibilidad del lockup (D-BBW-25), que es lo que hace medible la garantía.
 * · Cero valores: cada partícula recibe SOLO números normalizados (0..1) como propiedades personalizadas; la hoja los lleva a los rangos
 *   de los tokens (tamaño, desenfoque, opacidad, recorrido, deriva, duración) y a los tintes por rol. Fase 6f: a su escala (tamaños en px
 *   del inventario, opacidad propia por partícula, clases de desenfoque del export, deriva horizontal).
 * · HTML completo (D-BBW-09): el campo se genera en compilación con semilla fija; el navegador solo anima (CSS, sin JavaScript).
 * · Movimiento reducido: quedan QUIETAS (rol `--bbf-motion-particles-play-state`, semantic/motion.css), como el vídeo queda en su póster.
 * · Decorativo para las tecnologías de asistencia (`aria-hidden`); no recibe eventos.
 */
const CLASS_FOR: Readonly<Record<ParticleKind, string>> = {
  moteFine: `${styles.particle} ${styles.mote} ${styles.moteFine}`,
  moteMid: `${styles.particle} ${styles.mote} ${styles.moteMid}`,
  moteSoft: `${styles.particle} ${styles.mote} ${styles.moteSoft}`,
  bubbleS: `${styles.particle} ${styles.bubble} ${styles.bubbleS}`,
  bubbleM: `${styles.particle} ${styles.bubble} ${styles.bubbleM}`,
  bubbleL: `${styles.particle} ${styles.bubble} ${styles.bubbleL}`,
};

function vars(p: Particle): CSSProperties {
  return { "--p-x": p.x, "--p-y": p.y, "--p-u": p.size, "--p-phase": p.phase, "--p-kf": p.k, "--p-o": p.o, "--p-d": p.d } as CSSProperties;
}

export function HeroParticles() {
  return (
    <div className={styles.field} aria-hidden="true" data-component="bbf-hero-particles">
      {PARTICLE_FIELD.map((p) => (
        <span key={p.id} className={CLASS_FOR[p.kind]} style={vars(p)}>
          {p.kind.startsWith("bubble") ? <i className={styles.sphere} /> : null}
        </span>
      ))}
    </div>
  );
}
