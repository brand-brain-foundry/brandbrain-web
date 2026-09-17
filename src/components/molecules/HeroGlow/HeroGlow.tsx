import styles from "./HeroGlow.module.css";

/**
 * HeroGlow — molecule. Los RESPLANDORES del fondo del héroe (fase 6f; el `blob-bg` del diseño, leído del export solo como composición y
 * color de fondo): cuatro lóbulos y dos lavados de color por debajo del escenario del vídeo, con un NÚCLEO OSCURO en el centro para que el
 * sujeto se lea sobre negro y el color viva en los bordes. Es MEDIO en movimiento (deriva lenta, transform en el compositor), no animación
 * de interfaz; con movimiento reducido queda quieto (rol `--bbf-motion-glow-play-state`), como las partículas.
 * Cero valores: geometría, tintes, deriva y núcleo llegan por roles (semantic/composition.css) desde las madres de primitives/composition.css.
 * Sin JavaScript, sin WebGL: el diseño lo resolvía con un sombreador de cuatro pasadas; aquí son seis degradados y una máscara.
 * Decorativo para las tecnologías de asistencia (`aria-hidden`); no recibe eventos.
 */
const LOBES = ["lobe1", "lobe2", "lobe3", "lobe4", "wash1", "wash2"] as const;

export function HeroGlow() {
  return (
    <div className={styles.glow} aria-hidden="true" data-component="bbf-hero-glow">
      {LOBES.map((lobe) => (
        <span key={lobe} className={`${styles.lobe} ${styles[lobe]}`} />
      ))}
    </div>
  );
}
