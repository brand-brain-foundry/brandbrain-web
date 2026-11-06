import Link from "next/link";
import type { LegalSection as LegalSectionType, Span } from "@/content/schema";
import { identity } from "@/content/site";
import styles from "./LegalSection.module.css";

/** Resuelve un tramo a un nodo React: texto simple, enlace externo (fuente única) o enlace interno resuelto. S11: el enlace en prosa solo se
 * MARCA (`data-scatter="prose"`); subrayado, hover de reposo y contexto de apilamiento del párrafo los pone el sistema (base/document.css). */
function renderSpan(span: Span, key: number) {
  if (typeof span === "string") return span;
  if ("path" in span) {
    // { text, path } — enlace interno generado por el puerto desde { page: slug }
    return <Link key={key} href={span.path} className={styles.link} data-scatter="prose">{span.text}</Link>;
  }
  if ("page" in span || "global" in span) return null; // nunca llegan aquí: el puerto los resuelve antes de entregar el documento
  const href = identity.links[span.link];
  const isExternal = href.startsWith("https://") || href.startsWith("http://");
  return (
    <a
      key={key}
      href={href}
      className={styles.link}
      data-scatter="prose"
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
              ) : "table" in part ? (
                /* TABLA (P-BBW-82, v3.7): en la vista estrecha cada celda se apila y antepone el rótulo de su columna
                   (`data-label`, desde el contenido) por el rol de vista; la cabecera se oculta. Nada de esto vive aquí. */
                <table key={pi} className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      {part.table.columns.map((column, ci) => (
                        <th key={ci} scope="col" className={styles.tableHeading}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {part.table.rows.map((row, ri) => (
                      <tr key={ri} className={styles.tableRow}>
                        {row.map((cell, ci) => (
                          <td key={ci} className={styles.tableCell} data-label={part.table.columns[ci]}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
