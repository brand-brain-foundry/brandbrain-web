import type { LegalSection as LegalSectionType, Span } from "@/content/schema";
import { identity } from "@/content/site";
import styles from "./LegalSection.module.css";

/** Resuelve un tramo a un nodo React: texto simple o enlace con destino de la fuente única. */
function renderSpan(span: Span, key: number) {
  if (typeof span === "string") return span;
  const href = identity.links[span.link];
  const isExternal = href.startsWith("https://") || href.startsWith("http://");
  return (
    <a
      key={key}
      href={href}
      className={styles.link}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {span.text}
    </a>
  );
}

/**
 * Sección de lectura legal (P-BBW-73/75). Columna de lectura centrada con `<h1>`, párrafo de introducción,
 * bloques `<h2>` y fecha de actualización. Todo texto desde el contenido; ningún literal en el componente.
 * Los destinos de los enlaces salen de `identity.links` (fuente única): `contact` y `aepd` resuelven al
 * mailto del buzón y a la URL de la AEPD respectivamente.
 */
export function LegalSection({ section }: { section: LegalSectionType }) {
  return (
    <section className={styles.section}>
      <div className={styles.column}>
        <h1 className={styles.heading}>{section.heading}</h1>
        <p className={styles.intro}>
          {section.intro.map((span, i) => renderSpan(span, i))}
        </p>
        {section.blocks.map((block, bi) => (
          <div key={bi} className={styles.block}>
            <h2 className={styles.blockHeading}>{block.heading}</h2>
            {block.parts.map((part, pi) =>
              "p" in part ? (
                <p key={pi} className={styles.para}>
                  {part.p.map((span, si) => renderSpan(span, si))}
                </p>
              ) : (
                <ul key={pi} className={styles.list}>
                  {part.list.map((item, ii) => (
                    <li key={ii}>{item}</li>
                  ))}
                </ul>
              )
            )}
          </div>
        ))}
        <p className={styles.updated}>{section.updatedLabel}</p>
      </div>
    </section>
  );
}
