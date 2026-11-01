import type { CriterioSection } from "@/content/schema";
import { identity } from "@/content/site";
import styles from "./CriterioSection.module.css";

/**
 * CriterioSection — sección de portada (C1 · F5, 2026-11-01).
 * Tres áreas de rejilla: `title` (encabezado h1) / `field` (contenedor del campo S8) / `text` (cuerpo + CTAs).
 * El campo tiene placa (espacio reservado para S8, P-BBW-67) y lectura (zona de contador).
 * Layout sin @media: los roles de vista de semantic/viewport.css conmutan la rejilla.
 */
export function CriterioSection({ section }: { section: CriterioSection }) {
  const ctaPrimaryHref = identity.links.contact;
  const ctaSecondaryHref = identity.links[section.ctaSecondaryLink];

  return (
    <section id={section.id} className={styles.criterio}>
      {/* Área title: solo el h1, sin compañía */}
      <div className={styles.title} data-enter="">
        <h1 className={styles.heading}>{section.heading}</h1>
      </div>

      {/* Área text: cuerpo y llamadas a la acción */}
      <div className={styles.text} data-enter="">
        <p className={styles.body}>{section.paragraph1}</p>
        <p className={styles.body}>{section.paragraph2}</p>
        <div className={styles.ctas}>
          <a href={ctaPrimaryHref} className={styles.ctaPrimary}>
            {section.ctaPrimary}
          </a>
          <a
            href={ctaSecondaryHref}
            className={styles.ctaSecondary}
            target="_blank"
            rel="noopener noreferrer"
          >
            {section.ctaSecondary}
          </a>
        </div>
      </div>

      {/* Área field: contenedor del campo de puntos (S8, P-BBW-67). Sin canvas todavía. */}
      <div className={styles.field} aria-hidden="true">
        <div className={styles.placa} />
        <div className={styles.lectura} />
      </div>
    </section>
  );
}
