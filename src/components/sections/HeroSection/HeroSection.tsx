import type { HeroSection as HeroSectionData } from "@/content/schema";
import { media } from "@/media";
import { HeroMedia } from "@/components/molecules/HeroMedia";
import { HeroParticles } from "@/components/molecules/HeroParticles";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — section (bloque de contenido de página, N0 §2.3: el lockup). Titular (`<h1>`, rol display, EXC-BBW-01), rótulo
 * (rol lead, EXC-BBW-02 derivado del titular) y dos afirmaciones (rol claim). Todo texto por props.
 * Fase 6d (D-BBW-24): FONDO por capas de profundidad (semantic/layers.css): medio (el vídeo por el puerto de medios, `HeroMedia`) · velo
 * (viñeta + degradados de transición, en la hoja) · contenido. El vídeo es medio, no animación de interfaz.
 * Fase 6e: el fondo se COMPLETA con las partículas (`HeroParticles`, capa de partículas, medio en movimiento) y el lockup lleva su VELO
 * LOCAL de legibilidad (D-BBW-25, en la hoja): tinta calibrada bajo el bloque de texto, por encima de vídeo, velo global y partículas.
 * La guarda de ajuste al ancho del diseño (14,6vw / 5,9vw) entra por rol (`--bbf-type-*-fit`): el titular cabe en una línea a 360 px.
 * Quieto: la animación de peso y la reserva de ancho del estado más grueso son del turno de movimiento.
 */
export function HeroSection({ section }: { section: HeroSectionData }) {
  const headingId = `${section.id}-display`;
  return (
    <section id={section.id} className={styles.hero} aria-labelledby={headingId} data-component="bbf-hero">
      <HeroMedia sources={[media.heroLoop720]} poster={media.heroLoopPoster} />
      <div className={styles.veil} aria-hidden="true" />
      <HeroParticles />
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
