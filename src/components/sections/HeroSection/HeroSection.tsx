import type { HeroSection as HeroSectionData } from "@/content/schema";
import { identity } from "@/content/site";
import { Icon } from "@/components/atoms/Icon";
import { HeroBackdrop } from "@/components/molecules/HeroBackdrop";
import { HeroParticles } from "@/components/molecules/HeroParticles";
import { CriterioField } from "@/components/molecules/CriterioField";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — section. Capas de profundidad (semantic/layers.css): fondo (el sombreador, `HeroBackdrop`) · medio (el ESCENARIO de la
 * derecha) · velo (la viñeta) · partículas · contenido. Dos zonas (D-BBW-47): texto a la izquierda, escenario a la derecha.
 * 2026-11-02 (orden de Zavala): cambia el CONTENIDO de las dos zonas y nada más.
 *   · el ESCENARIO deja de llevar el vídeo del pez y lleva el campo de puntos S8 (`CriterioField`), con la misma geometría, la misma máscara
 *     radial y la misma entrada que tenía el vídeo. Salen `HeroMedia` y el seguimiento del sujeto (I-6); los maestros del vídeo se conservan.
 *   · el BLOQUE de texto deja el claim de tres líneas y lleva el cuerpo de la home nueva: el `<h1>` en el rol `heading`, dos párrafos en el
 *     rol `body` y dos llamadas a la acción en el rol `button`. Sale `HeroClaim` (I-6). El velo local de legibilidad (D-BBW-25) se queda.
 * Lo que NO cambia: el sombreador, las partículas, la viñeta, la composición por roles de vista, la cabecera y el pie.
 */
export function HeroSection({ section }: { section: HeroSectionData }) {
  const headingId = `${section.id}-heading`;
  return (
    <section id={section.id} className={styles.hero} aria-labelledby={headingId} data-component="bbf-hero">
      <HeroBackdrop />
      <CriterioField className={styles.stage} />
      <div className={styles.veil} aria-hidden="true" />
      <HeroParticles />
      <div className={styles.text}>
        <div className={styles.block}>
          <h1 id={headingId} className={styles.heading} data-enter="">
            {section.heading}
          </h1>
          <p className={`${styles.body} ${styles.bodyFirst}`} data-enter="" data-field-line="">
            {section.paragraph1}
          </p>
          <p className={`${styles.body} ${styles.bodySecond}`} data-enter="">
            {section.paragraph2}
          </p>
          <div className={styles.ctas} data-enter="">
            <a href={identity.links.contact} className={`${styles.cta} ${styles.ctaPrimary}`}>
              {section.ctaPrimary}
              <Icon name="arrowRight" className={styles.arrow} />
            </a>
            <a href={identity.links[section.ctaSecondaryLink]} className={`${styles.cta} ${styles.ctaSecondary}`} target="_blank" rel="noopener noreferrer">
              {section.ctaSecondary}
              <Icon name="arrowUpRight" className={styles.arrow} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
