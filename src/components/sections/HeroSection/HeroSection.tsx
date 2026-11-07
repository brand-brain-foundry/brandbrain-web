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
 *   · el BLOQUE de texto deja el claim de tres líneas y lleva el cuerpo de la home nueva: el `<h1>` en el rol `heading`, el cuerpo en el
 *     rol `body` y dos llamadas a la acción en el rol `button`. Sale `HeroClaim` (I-6). El velo local de legibilidad (D-BBW-25) se queda.
 * Lo que NO cambia: el sombreador, las partículas, la viñeta, la composición por roles de vista, la cabecera y el pie.
 * S3b (D-BBW-89, 2026-11-07): el cuerpo pasa de dos párrafos a UNO (`paragraph`), que sigue siendo la línea de referencia del campo de
 *   puntos (`data-field-line`: S8 lee su interlineado y el centro de su primera línea, BEHAVIOR.md §11). Sale el segundo párrafo con su
 *   retardo de entrada (I-6); nada más cambia.
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
          <p className={styles.body} data-enter="" data-field-line="">
            {section.paragraph}
          </p>
          <div className={styles.ctas} data-enter="">
            {/* 2026-11-02 (orden de Zavala): primero el perfil de LinkedIn y después «Hablemos»; cada botón conserva su estilo.
                S11 (M2, P-BBW-83; M3, P-BBW-84): se MARCAN con su tipo de piel (`data-hover`: hover de color del sistema) y con `data-scatter`
                (desarme, opt-in: los botones del héroe son uno de los dos sitios declarados, R11b). */}
            <a href={identity.links[section.ctaSecondaryLink]} className={`${styles.cta} ${styles.ctaSecondary}`} data-hover="outline" data-scatter="" target="_blank" rel="noopener noreferrer">
              {section.ctaSecondary}
              <Icon name="arrowUpRight" className={styles.arrow} />
            </a>
            <a href={identity.links.contact} className={`${styles.cta} ${styles.ctaPrimary}`} data-hover="fill" data-scatter="">
              {section.ctaPrimary}
              <Icon name="arrowRight" className={styles.arrow} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
