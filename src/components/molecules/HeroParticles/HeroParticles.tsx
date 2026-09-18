import type { CSSProperties } from "react";
import { isBubble, PARTICLES, type Particle, type ParticleKind } from "@/behavior/particle-field";
import { HeroParticlesClock } from "./HeroParticlesClock";
import styles from "./HeroParticles.module.css";

/**
 * HeroParticles — molecule. Los DOS SISTEMAS DE PARTÍCULAS del héroe (fase 6k, portado P4 del N1; D-BBW-36/37): la NIEVE MARINA (31 motas en
 * tres planos con desenfoques distintos: la profundidad de campo) DEBAJO de las BURBUJAS (21 esferas en tres planos de foco, con reflejo
 * especular descentrado, reflejo interior, sombra interna y borde atenuado, y DOS animaciones anidadas: el ascenso del envoltorio más una
 * oscilación interna con su propio periodo, de modo que la subida nunca es regular). Es MEDIO en movimiento, no animación de interfaz: vive en
 * la capa de partículas (semantic/layers.css), entre el velo global y el contenido, y pasa por debajo del velo local del lockup (D-BBW-25).
 * · El campo lo GENERA src/behavior/particle-field.ts con semilla fija (D-BBW-30/36: el generador es el sistema, la tirada es dato); cada
 *   partícula recibe SOLO números normalizados (0..1) como propiedades personalizadas y la hoja los lleva a los rangos de las madres.
 * · Dos planos en el orden del documento: la nieve va antes que las burbujas y queda debajo (el diseño las apila en dos capas contiguas; la
 *   escala de apilamiento no tiene medio paso y no hace falta: el orden del árbol apila igual, N1 doc D §3).
 * · Cada burbuja son TRES elementos anidados como en el diseño: envoltorio (ascenso: traslación, escala y opacidad) → oscilador (vaivén
 *   horizontal) → esfera (aspecto). La escala del envoltorio escala también el vaivén, como en el original.
 * · HTML completo (D-BBW-09/28): el campo viaja en el HTML con su reposo (cada partícula en su fase); el navegador anima por CSS.
 * · Quietud (D-BBW-31): con movimiento reducido el rol `--bbf-motion-particles-play-state` es `paused` desde la raíz y las animaciones NO
 *   ARRANCAN (quedan en su fase); con la pestaña oculta el reloj cliente (`HeroParticlesClock`) fija el mismo rol en el campo y lo retira al volver.
 * · Decorativo para las tecnologías de asistencia (`aria-hidden`); no recibe eventos. Cero texto, cero valores.
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
  const v: Record<string, number> = { "--p-x": p.x, "--p-y": p.y, "--p-u": p.size, "--p-phase": p.phase, "--p-kf": p.k, "--p-o": p.o, "--p-d": p.d };
  if (p.wobble !== undefined) v["--p-kw"] = p.wobble;
  return v as CSSProperties;
}

const SNOW = PARTICLES.filter((p) => !isBubble(p.kind));
const BUBBLES = PARTICLES.filter((p) => isBubble(p.kind));

export function HeroParticles() {
  return (
    <div className={styles.field} aria-hidden="true" data-component="bbf-hero-particles">
      <div className={styles.plane} data-plane="snow">
        {SNOW.map((p) => (
          <span key={p.id} className={CLASS_FOR[p.kind]} style={vars(p)} />
        ))}
      </div>
      <div className={styles.plane} data-plane="bubbles">
        {BUBBLES.map((p) => (
          <span key={p.id} className={CLASS_FOR[p.kind]} style={vars(p)}>
            <span className={styles.wobble}>
              <span className={styles.sphere} />
            </span>
          </span>
        ))}
      </div>
      <HeroParticlesClock />
    </div>
  );
}
