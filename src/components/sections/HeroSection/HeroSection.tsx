import type { HeroSection as HeroSectionData } from "@/content/schema";
import { media } from "@/media";
import { HeroGlow } from "@/components/molecules/HeroGlow";
import { HeroMedia } from "@/components/molecules/HeroMedia";
import { HeroParticles } from "@/components/molecules/HeroParticles";
import type { CSSProperties } from "react";
import styles from "./HeroSection.module.css";

/** orden de entrada de cada pieza del héroe (fase 6g): tras la marca (0), titular, rótulo y afirmaciones; el pie va después */
const enterIndex = (i: number) => ({ "--bbf-enter-index": i }) as CSSProperties;

/**
 * HeroSection — section (bloque de contenido de página, N0 §2.3: el lockup). Titular (`<h1>`, rol display, EXC-BBW-01), rótulo
 * (rol lead, EXC-BBW-02 derivado del titular) y dos afirmaciones (rol claim). Todo texto por props.
 * Fase 6d (D-BBW-24): FONDO por capas de profundidad (semantic/layers.css): medio (el vídeo por el puerto de medios, `HeroMedia`) · velo ·
 * contenido. Fase 6e: partículas (`HeroParticles`) y VELO LOCAL de legibilidad del lockup (D-BBW-25). Guarda de ancho por rol (`-fit`).
 * Fase 6f (composición fiel, export leído solo para disposición y color de fondo): el héroe es el ESCENARIO a toda la ventana (la cabecera y
 * el pie van superpuestos); por debajo del vídeo, los RESPLANDORES (`HeroGlow`, capa de fondo); el vídeo pasa a ser un escenario 16:9 anclado
 * al 43 % con máscara radial; la viñeta es la del diseño; y el bloque de texto se ANCLA AL PIE del héroe (a 14 % del alto), debajo del pez,
 * sobre fondo oscuro: es lo que permite recalibrar el velo local a la baja sin relajar la garantía (medido en el output 6f).
 * Fase 6g (movimiento de interfaz): el titular RESPIRA su peso entre los extremos de la fase 5 (`--bbf-type-display-weight-from/-to`) y
 * RESERVA EL ANCHO del estado más grueso con la palabra real: una copia oculta (`aria-hidden`, `visibility: hidden`) del mismo texto al peso
 * máximo ocupa la misma celda que la palabra animada, así que la caja del titular mide siempre lo que mide la palabra a 500, en cualquier
 * ancho y sin JavaScript (TYPOGRAPHY_WEIGHTS.md §3: medir, no suponer). Con movimiento reducido ambos extremos valen el reposo y la copia
 * mide lo mismo que la palabra. Cada pieza del bloque entra escalonada al cargar (`data-enter`, regla del sistema en base/document.css).
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
          <h1 id={headingId} className={styles.display} data-enter="" style={enterIndex(1)}>
            <span className={styles.displayWord}>{section.display}</span>
            <span className={styles.displayReserve} aria-hidden="true">
              {section.display}
            </span>
          </h1>
          <p className={styles.lead} data-enter="" style={enterIndex(2)}>
            {section.lead}
          </p>
          <p className={`${styles.claim} ${styles.claimPrimary}`} data-enter="" style={enterIndex(3)}>
            {section.claimPrimary}
          </p>
          <p className={`${styles.claim} ${styles.claimSecondary}`} data-enter="" style={enterIndex(4)}>
            {section.claimSecondary}
          </p>
        </div>
      </div>
    </section>
  );
}
