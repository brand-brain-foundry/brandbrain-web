import type { HeroSection as HeroSectionData } from "@/content/schema";
import { media } from "@/media";
import { HeroBackdrop } from "@/components/molecules/HeroBackdrop";
import { HeroMedia } from "@/components/molecules/HeroMedia";
import { HeroParticles } from "@/components/molecules/HeroParticles";
import { HeroLock } from "@/components/molecules/HeroLock";
import type { CSSProperties } from "react";
import styles from "./HeroSection.module.css";

/** orden de entrada de cada pieza del héroe (fase 6g): tras la marca (0), titular (1) y rótulo (2) dentro del lock, afirmaciones 3 y 4; el pie va después */
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
 * Fase 6h (portado P1 del N1, D-BBW-28): titular y rótulo son el LOCK (`HeroLock`, molecule cliente): el titular respira su peso LETRA A LETRA con
 * conservación de ancho (Σ avances = presupuesto al peso de reposo; la caja se ancla al fotograma más ancho de la señal real: nada se recoloca),
 * el rótulo se interletra hasta cerrar al ancho anclado y responde al puntero. El HTML servido trae el texto literal y el peso de reposo; el
 * cliente solo mueve. La copia oculta, la rejilla y el extremo por vista de la 6g quedaron retirados: medían un estado que el diseño nunca
 * renderiza (N1 §4, L-62). Cada pieza del bloque entra escalonada al cargar (`data-enter`, regla del sistema en base/document.css).
 * Fase 6i (portado P2 del N1, D-BBW-33/34/35): el FONDO es el sombreador WebGL2 del diseño (`HeroBackdrop`, molecule cliente): cuatro pasadas,
 * núcleo negro deformado por ruido, tonemapeo y grano; reposo y respaldo = superficie base. `HeroGlow` (seis degradados y una máscara fija: el
 * núcleo se leía como un círculo) y sus 28 madres y 7 roles quedaron retirados en el mismo commit que su sustituto (N1 doc C §4).
 */
export function HeroSection({ section }: { section: HeroSectionData }) {
  const headingId = `${section.id}-display`;
  return (
    <section id={section.id} className={styles.hero} aria-labelledby={headingId} data-component="bbf-hero">
      <HeroBackdrop />
      <HeroMedia sources={[media.heroLoop720]} poster={media.heroLoopPoster} />
      <div className={styles.veil} aria-hidden="true" />
      <HeroParticles />
      <div className={styles.lockup}>
        <div className={styles.block}>
          <HeroLock headingId={headingId} display={section.display} lead={section.lead} />
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
