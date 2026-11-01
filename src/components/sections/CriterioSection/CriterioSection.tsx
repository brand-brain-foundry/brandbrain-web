import type { CriterioSection } from "@/content/schema";
import { identity } from "@/content/site";
import styles from "./CriterioSection.module.css";

export function CriterioSection({ section }: { section: CriterioSection }) {
  const ctaPrimaryHref = identity.links.contact;
  const ctaSecondaryHref = identity.links[section.ctaSecondaryLink];

  return (
    <section id={section.id} className={styles.criterio}>
      <div className={styles.content}>
        <h1 className={styles.heading}>{section.heading}</h1>
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
      {/* contenedor del campo de puntos (S8): existe vacío; S8 llega en su propio despacho */}
      <div className={styles.field} aria-hidden="true" />
    </section>
  );
}
