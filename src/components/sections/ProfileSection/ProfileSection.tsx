import Link from "next/link";
import type { Locale } from "@/config/site";
import { splitEmphasis, type ProfileSection as ProfileSectionType, type ProfileSpan } from "@/content/schema";
import { identity } from "@/content/site";
import { mediaMembers } from "@/media";
import { hrefOf } from "@/components/link-target";
import { renderSpan } from "../LegalSection/LegalSection";
import legal from "../LegalSection/LegalSection.module.css";
import styles from "./ProfileSection.module.css";

/** Un destino saliente se abre en pestaña nueva con `rel` seguro (N0 §2.4), como en el resto del sitio. */
const outbound = (href: string) => (/^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});

/** Los tramos de un texto de «Cómo trabajo», con la misma pieza que pinta los de las páginas legales. */
const spans = (list: readonly ProfileSpan[]) => list.map((span, i) => renderSpan(span, i));

/**
 * LA PÁGINA DE PERFIL (S3c, D-BBW-90; insumo CONTENIDO-PERFIL-WEB v1.0 §3). Maqueta de las páginas de TEXTO, sin diseño nuevo: la misma
 * columna de lectura, los mismos roles de encabezado, cuerpo y lista que la sección legal (su hoja se reutiliza tal cual: una maqueta, una
 * hoja). Lo propio de esta sección —la línea del cargo, el retrato y el cierre— está en su hoja y solo consume tokens.
 * Todo texto llega resuelto del contenido; los textos de la persona vienen CITADOS de la entidad (`{ entity }`, sustituciones), nunca escritos.
 * EL RETRATO es un `<img>` real (Google no indexa imágenes de CSS): el primer recorte del conjunto que la entidad referencia, con sus
 * dimensiones intrínsecas y el `alt` del contenido. Si el conjunto no tiene derivados publicados no hay `<img>` (y la entidad no emite `image`).
 * Los enlaces se MARCAN con su tipo de piel (`data-hover`, hover de color del sistema); ninguno se desarma (S11: solo cabecera y héroe).
 * P1 (D-BBW-109, D-BBW-104): «Cómo trabajo» se pinta como la entrada, las tarjetas (lista ordenada: el número es el orden) y la trayectoria, en
 * bloques de texto simples hasta la maqueta de P2; sale el bloque «Certificación» (la credencial se lee, enlazada, en la trayectoria); el cierre
 * parte la frase madre por la palabra que el contenido declara y la segunda parte va en el color de acento del texto.
 */
export function ProfileSection({ section, locale }: { section: ProfileSectionType; locale: Locale }) {
  const portrait = mediaMembers(section.portrait.media)[0];
  // el puerto ya comprobó que la palabra del énfasis está una vez (D-BBW-104); si no, ni siquiera llega aquí
  const closing = splitEmphasis(section.closing.text, section.closing.emphasisFrom) ?? [section.closing.text, ""];
  return (
    <section className={legal.section} data-component="bbf-profile">
      <div className={legal.column}>
        <h1 className={legal.heading}>{section.heading}</h1>
        <p className={styles.role}>{section.role}</p>
        {portrait && (
          <img
            className={styles.portrait}
            src={portrait.src}
            width={portrait.width}
            height={portrait.height}
            alt={section.portrait.alt}
          />
        )}
        <p className={legal.intro}>{section.lead}</p>

        <div className={legal.block}>
          <h2 className={legal.blockHeading}>{section.approach.heading}</h2>
          <p className={legal.para}>{spans(section.approach.intro)}</p>
          <ol className={styles.steps}>
            {section.approach.steps.map((step) => (
              <li key={step.id}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={legal.para}>{spans(step.text)}</p>
              </li>
            ))}
          </ol>
          <h3 className={styles.stepTitle}>{section.approach.background.title}</h3>
          <p className={legal.para}>{spans(section.approach.background.text)}</p>
        </div>

        <div className={legal.block}>
          <h2 className={legal.blockHeading}>{section.specialties.heading}</h2>
          <ul className={legal.list}>
            {section.specialties.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={legal.block}>
          <h2 className={legal.blockHeading}>{section.projects.heading}</h2>
          <ul className={legal.list}>
            {section.projects.items.map((project) => {
              const href = identity.links[project.link];
              return (
                <li key={project.id}>
                  <a href={href} className={`${legal.link} ${styles.projectName}`} data-hover="prose" {...outbound(href)}>
                    {project.name}
                  </a>{" "}
                  {project.text}
                </li>
              );
            })}
          </ul>
        </div>

        <div className={legal.block}>
          <h2 className={legal.blockHeading}>{section.contact.heading}</h2>
          <ul className={styles.contactLinks}>
            {section.contact.links.map((item) => {
              const href = hrefOf(item, locale);
              const external = item.page === undefined ? outbound(href) : {};
              return (
                <li key={item.id}>
                  {item.page !== undefined ? (
                    <Link href={href} className={legal.link} data-hover="prose">{item.label}</Link>
                  ) : (
                    <a href={href} className={legal.link} data-hover="prose" {...external}>{item.label}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <p className={styles.closing}>
          <span>{closing[0]}</span> <span className={styles.emphasis}>{closing[1]}</span>
        </p>
      </div>
    </section>
  );
}
