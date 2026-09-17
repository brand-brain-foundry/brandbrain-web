import type { HeroSection as HeroSectionData } from "@/content/schema";
import { media } from "@/media";
import { HeroGlow } from "@/components/molecules/HeroGlow";
import { HeroMedia } from "@/components/molecules/HeroMedia";
import { HeroParticles } from "@/components/molecules/HeroParticles";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — section (bloque de contenido de página, N0 §2.3: el lockup). Titular (`<h1>`, rol display, EXC-BBW-01), rótulo
 * (rol lead, EXC-BBW-02 derivado del titular) y dos afirmaciones (rol claim). Todo texto por props.
 * Fase 6d (D-BBW-24): FONDO por capas de profundidad (semantic/layers.css): medio (el vídeo por el puerto de medios, `HeroMedia`) · velo ·
 * contenido. Fase 6e: partículas (`HeroParticles`) y VELO LOCAL de legibilidad del lockup (D-BBW-25). Guarda de ancho por rol (`-fit`).
 * Fase 6f (composición fiel, export leído solo para disposición y color de fondo): el héroe es el ESCENARIO a toda la ventana (la cabecera y
 * el pie van superpuestos); por debajo del vídeo, los RESPLANDORES (`HeroGlow`, capa de fondo); el vídeo pasa a ser un escenario 16:9 anclado
 * al 43 % con máscara radial; la viñeta es la del diseño; y el bloque de texto se ANCLA AL PIE del héroe (a 14 % del alto), debajo del pez,
 * sobre fondo oscuro: es lo que permite recalibrar el velo local a la baja sin relajar la garantía (medido en el output 6f).
 * Quieto: la animación de peso y la reserva de ancho del estado más grueso son del turno de movimiento.
 */
export function HeroSection({ section }: { section: HeroSectionData }) {
  const headingId = `${section.id}-display`;
  return (
    <section id={section.id} className={styles.hero} aria-labelledby={headingId} data-component="bbf-hero">
      <HeroGlow />
      <HeroMedia sources={[media.heroLoop720]} poster={media.heroLoopPoster} />
      <div className={styles.veil} aria-hidden="true" />
      <HeroParticles />
      <div className={styles.lockup}>
        <div className={styles.block}>
          <h1 id={headingId} className={styles.display}>
            {section.display}
          </h1>
          <p className={styles.lead}>{section.lead}</p>
          <p className={`${styles.claim} ${styles.claimPrimary}`}>{section.claimPrimary}</p>
          <p className={`${styles.claim} ${styles.claimSecondary}`}>{section.claimSecondary}</p>
        </div>
      </div>
    </section>
  );
}
