import type { HeroSection as HeroSectionData } from "@/content/schema";
import { media } from "@/media";
import { HeroMedia } from "@/components/molecules/HeroMedia";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — section (bloque de contenido de página, N0 §2.3: el lockup). Titular (`<h1>`, rol display, EXC-BBW-01), rótulo
 * (rol lead, EXC-BBW-02 derivado del titular) y dos afirmaciones (rol claim). Todo texto por props.
 * Fase 6d (D-BBW-24): FONDO por capas de profundidad (semantic/layers.css): medio (el vídeo por el puerto de medios, `HeroMedia`) · velo
 * (viñeta + degradados de transición, en la hoja) · contenido. El vídeo es medio, no animación de interfaz.
 * Quieto: la animación de peso, la reserva de ancho del estado más grueso y la guarda `14.6vw`/`5.9vw` del diseño son del turno de movimiento.
 */
export function HeroSection({ section }: { section: HeroSectionData }) {
  const headingId = `${section.id}-display`;
  return (
    <section id={section.id} className={styles.hero} aria-labelledby={headingId} data-component="bbf-hero">
      <HeroMedia sources={[media.heroLoop720]} poster={media.heroLoopPoster} />
      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.lockup}>
        <h1 id={headingId} className={styles.display}>
          {section.display}
        </h1>
        <p className={styles.lead}>{section.lead}</p>
        <p className={`${styles.claim} ${styles.claimPrimary}`}>{section.claimPrimary}</p>
        <p className={`${styles.claim} ${styles.claimSecondary}`}>{section.claimSecondary}</p>
      </div>
    </section>
  );
}
