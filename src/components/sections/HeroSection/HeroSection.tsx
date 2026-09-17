import type { HeroSection as HeroSectionData } from "@/content/schema";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — section (bloque de contenido de página, N0 §2.3: el lockup). Titular (`<h1>`, rol display, EXC-BBW-01), rótulo
 * (rol lead, EXC-BBW-02 derivado del titular) y dos afirmaciones (rol claim). Quieto: la animación de peso, la reserva de ancho del
 * estado más grueso y la guarda `14.6vw`/`5.9vw` del diseño son de la fase 6c. Fondo, vídeo y partículas: fase 6c. Todo texto por props.
 */
export function HeroSection({ section }: { section: HeroSectionData }) {
  const headingId = `${section.id}-display`;
  return (
    <section id={section.id} className={styles.hero} aria-labelledby={headingId} data-component="bbf-hero">
      <h1 id={headingId} className={styles.display}>
        {section.display}
      </h1>
      <p className={styles.lead}>{section.lead}</p>
      <p className={`${styles.claim} ${styles.claimPrimary}`}>{section.claimPrimary}</p>
      <p className={`${styles.claim} ${styles.claimSecondary}`}>{section.claimSecondary}</p>
    </section>
  );
}
