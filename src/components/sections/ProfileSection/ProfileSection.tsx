import Link from "next/link";
import type { Locale } from "@/config/site";
import { splitEmphasis, type ProfileSection as ProfileSectionType, type ProfileSpan } from "@/content/schema";
import { identity } from "@/content/site";
import { media, mediaMembers } from "@/media";
import { hrefOf } from "@/components/link-target";
import { Icon } from "@/components/atoms/Icon";
import { ProfileMotion } from "@/components/organisms/ProfileMotion";
import { HeroSection } from "../HeroSection";
import { renderSpan } from "../LegalSection/LegalSection";
import styles from "./ProfileSection.module.css";

/** Un destino saliente se abre en pestaña nueva con `rel` seguro (N0 §2.4), como en el resto del sitio. */
const outbound = (href: string) => (/^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});

/** Los tramos de un texto de «Cómo trabajo», con la misma pieza que pinta los de las páginas legales. */
const spans = (list: readonly ProfileSpan[]) => list.map((span, i) => renderSpan(span, i));

/** El número de una tarjeta: su ORDEN en el contenido, a dos cifras (no es texto del contenido: lo pone el sistema, como el `<ol>`). */
const stepNumber = (i: number) => String(i + 1).padStart(2, "0");

/**
 * LA PÁGINA DE PERFIL (S3c, D-BBW-90; maqueta definitiva en P2, D-BBW-96…109). Una sección de contenido, cinco piezas en pantalla:
 *   1. LA APERTURA = el héroe del inicio REUTILIZADO (`HeroSection`, no una copia; D-BBW-98): `<h1>` = el cargo, párrafo = la frase definitoria
 *      (línea de referencia del campo), el lote del campo que declara el contenido (`fieldMedia`, S12), fondo verde por el registro (D-BBW-96),
 *      sin botones ni partículas (D-BBW-105) y EN FLUJO (sin el hueco del pie superpuesto en el teléfono; su final se funde con el negro).
 *   2. «CÓMO TRABAJO» (D-BBW-99): la entrada y la línea de tiempo centradas en la columna de lectura; nodos 01–04 y «De dónde vengo»; el
 *      rótulo queda fijo mientras se recorre en la vista amplia (rol de vista). Las tarjetas con sus tramos enlazados (D-BBW-109).
 *   3. ESPECIALIDADES (D-BBW-100): pastillas a todo lo ancho; hueco del icono a la izquierda con su tamaño final (vacío hasta P3: nunca un
 *      icono dibujado aquí, MEDIA §1), `knowsAbout` literal a la derecha, toda la pastilla enlaza a la llave común; nombre accesible = su texto.
 *   4. PROYECTOS (D-BBW-102): tres fichas estrechas, ventana 4:3 de radio moderado (vacía, superficie tenue, hasta P4) y el texto DEBAJO.
 *   5. EL CIERRE B (D-BBW-103/104): retrato en círculo (`<img>` real con `alt`; el recorte 1:1 servido al tamaño mostrado por `srcset`, 1× y
 *      2×; el de 1200 queda de `src` porque `Person.image` lo cita y R7g lo busca), la frase madre a escala de titular con la segunda parte en
 *      acento (dos tramos EN LÍNEA: el `innerText` no se parte) y los botones de contacto sin título.
 * Todo el texto llega resuelto del contenido; los de la persona CITADOS de la entidad. Las apariciones (una vez, por tiempo) y la línea de tiempo
 * las mueve `ProfileMotion` (S13, BEHAVIOR.md §16) sobre un HTML completo: sin JavaScript todo está visible y quieto.
 * Los enlaces se MARCAN con su tipo de piel (`data-hover`, hover de color del sistema); ninguno se desarma (S11: solo cabecera y héroe del inicio).
 * Sale la maqueta de texto de S3c (I-6): la columna y la hoja de la sección legal ya no se usan aquí.
 */
export function ProfileSection({ section, locale }: { section: ProfileSectionType; locale: Locale }) {
  const portrait = mediaMembers(section.portrait.media)[0];
  // el puerto ya comprobó que la palabra del énfasis está una vez (D-BBW-104); si no, ni siquiera llega aquí
  const closing = splitEmphasis(section.closing.text, section.closing.emphasisFrom) ?? [section.closing.text, ""];
  const id = section.id;
  const skills = identity.links[section.specialties.link];
  return (
    <>
      <HeroSection
        section={{ id, heading: section.heading, paragraph: section.lead, ...(section.fieldMedia ? { fieldMedia: section.fieldMedia } : {}) }}
        particles={false}
        flow
      />
      <ProfileMotion className={styles.flow}>
        <section className={styles.how} aria-labelledby={`${id}-how`} data-component="bbf-profile-how">
          <h2 id={`${id}-how`} className={`${styles.kicker} ${styles.howKicker}`} data-reveal="">
            {section.approach.heading}
          </h2>
          <p className={styles.intro} data-reveal="">
            {spans(section.approach.intro)}
          </p>
          <div className={styles.timeline} data-timeline="">
            <ol className={styles.steps}>
              {section.approach.steps.map((step, i) => (
                <li key={step.id} className={styles.step} data-step="" data-reveal="">
                  <span className={styles.node} aria-hidden="true" />
                  <span className={styles.stepNumber} aria-hidden="true">
                    {stepNumber(i)}
                  </span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{spans(step.text)}</p>
                </li>
              ))}
            </ol>
            <div className={`${styles.step} ${styles.origin}`} data-step="" data-reveal="">
              <span className={`${styles.node} ${styles.nodeOrigin}`} aria-hidden="true" />
              <h3 className={styles.stepTitle}>{section.approach.background.title}</h3>
              <p className={styles.stepText}>{spans(section.approach.background.text)}</p>
            </div>
          </div>
        </section>

        <section className={styles.wide} aria-labelledby={`${id}-specialties`} data-component="bbf-profile-specialties">
          <h2 id={`${id}-specialties`} className={styles.kicker} data-reveal="">
            {section.specialties.heading}
          </h2>
          <ul className={styles.chips}>
            {section.specialties.items.map((item) => (
              <li key={item} data-reveal="">
                <a href={skills} className={styles.chip} data-hover="text" {...outbound(skills)}>
                  {/* el hueco del icono con su tamaño final; vacío hasta P3 (los maestros los exporta el diseño, D-BBW-101) */}
                  <span className={styles.chipSlot} aria-hidden="true" data-icon-slot="" />
                  <span className={styles.chipLabel}>{item}</span>
                  <Icon name="arrowUpRight" className={styles.chipArrow} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.wide} aria-labelledby={`${id}-projects`} data-component="bbf-profile-projects">
          <h2 id={`${id}-projects`} className={styles.kicker} data-reveal="">
            {section.projects.heading}
          </h2>
          <ul className={styles.cards}>
            {section.projects.items.map((project) => {
              const href = identity.links[project.link];
              return (
                <li key={project.id} data-reveal="">
                  <a href={href} className={styles.card} data-hover="text" {...outbound(href)}>
                    {/* la ventana 4:3 del vídeo de la ficha: superficie tenue hasta P4 (póster + vídeo por el puerto de medios) */}
                    <span className={styles.cardWindow} aria-hidden="true" data-card-window="" />
                    <span className={styles.cardName}>
                      {project.name}
                      <Icon name="arrowUpRight" className={styles.cardArrow} />
                    </span>
                    <span className={styles.cardLine}>{project.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.closing} aria-labelledby={`${id}-closing`} data-component="bbf-profile-closing">
          {portrait && (
            <img
              className={styles.portrait}
              src={portrait.src}
              srcSet={`${media.portraitDisc1x.src} 1x, ${media.portraitDisc2x.src} 2x`}
              width={media.portraitDisc1x.width}
              height={media.portraitDisc1x.height}
              alt={section.portrait.alt}
              loading="lazy"
              decoding="async"
              data-reveal=""
            />
          )}
          <div className={styles.closingBody}>
            <h2 id={`${id}-closing`} className={styles.statement} data-reveal="">
              <span>{closing[0]}</span> <span className={styles.emphasis}>{closing[1]}</span>
            </h2>
            <div className={styles.buttons} data-reveal="">
              {section.contact.links.map((item, i) => {
                const href = hrefOf(item, locale);
                // el primero (el correo) es el primario relleno; los demás, de contorno: la pareja de botones del héroe del inicio
                const className = `${styles.button} ${i === 0 ? styles.buttonPrimary : styles.buttonSecondary}`;
                const skin = i === 0 ? "fill" : "outline";
                const arrow = <Icon name={item.page === undefined && /^https?:\/\//.test(href) ? "arrowUpRight" : "arrowRight"} className={styles.buttonArrow} />;
                return item.page !== undefined ? (
                  <Link key={item.id} href={href} className={className} data-hover={skin}>
                    {item.label}
                    {arrow}
                  </Link>
                ) : (
                  <a key={item.id} href={href} className={className} data-hover={skin} {...outbound(href)}>
                    {item.label}
                    {arrow}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </ProfileMotion>
    </>
  );
}
