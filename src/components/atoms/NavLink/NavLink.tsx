import { Icon } from "@/components/atoms/Icon";
import type { InlineIconName } from "@/media";
import styles from "./NavLink.module.css";

export type NavLinkProps = {
  href: string;
  /** texto visible / nombre accesible: llega del contenido (`LinkItem.label`) */
  label: string;
  /** rol tipográfico con el que se pinta (label = nav en línea · menu = hoja móvil · legal = pie) */
  typeRole: "label" | "menu" | "legal";
  /** icono de perfil del puerto de medios (fase 6c): si llega, se muestra el icono y la etiqueta queda como nombre accesible */
  icon?: InlineIconName;
  /** tamaño del icono por rol de vista: sm = barra del pie · md = hoja del panel */
  iconSize?: "sm" | "md";
  /**
   * ETIQUETA que califica el destino (D-BBW-74), desde el contenido. **El texto NO se escribe aquí**: llega por `LinkItem.badge`.
   * Se pinta como texto normal dentro del `<a>`, así que **entra en el nombre accesible por construcción** —«Sivar Brains Caso»— sin
   * ningún `aria-label` que pudiera desincronizarse de lo visible. No lleva `aria-hidden` justamente por eso.
   */
  badge?: string;
};

/** Un destino saliente (http/https) se abre en pestaña nueva con `rel` seguro (N0 §2.4: los enlaces externos abren en `_blank`). */
function isOutbound(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/**
 * NavLink — atom. Un enlace de navegación. Destino resuelto por el organismo desde `site.links` (fuente única); etiqueta desde `content/`.
 * Fase 6c: onda de subrayado (maestros del diseño por el puerto de medios) bajo los roles `label` (base en reposo, tinta al pasar el
 * ratón o recibir el foco; sin transición) y `menu` (siempre visible); iconos de perfil con el texto como nombre accesible.
 * Área táctil mínima por token. Sin literales, sin valores.
 */
export function NavLink({ href, label, typeRole, icon, iconSize = "sm", badge }: NavLinkProps) {
  const outbound = isOutbound(href);
  const sizeClass = iconSize === "md" ? styles.sizeMd : styles.sizeSm;
  return (
    <a
      href={href}
      className={`${styles.navLink} ${styles[typeRole]}${icon ? ` ${iconSize === "md" ? styles.touchMd : styles.touchSm}` : ""}`}
      data-component="bbf-nav-link"
      target={outbound ? "_blank" : undefined}
      rel={outbound ? "noopener noreferrer" : undefined}
    >
      {icon ? (
        <>
          <Icon name={icon} className={`${styles.profileIcon} ${sizeClass}`} />
          <span className={styles.hidden}>{label}</span>
        </>
      ) : (
        <span className={styles.text}>
          {label}
          {/* El espacio es LITERAL y no decorativo: el nombre accesible se calcula concatenando los nodos de texto, y sin él un lector de
              pantalla anuncia «Sivar BrainsCaso» de corrido. El margen de la hoja separa a la vista, no al oído. Medido sobre el HTML
              generado antes de añadirlo. */}
          {badge ? <> <span className={styles.badge}>{badge}</span></> : null}
          {typeRole === "label" ? (
            <span className={styles.underline} aria-hidden="true">
              <Icon name="underlineWaveNav" className={`${styles.wave} ${styles.waveNav} ${styles.waveBase}`} />
              <Icon name="underlineWaveNav" className={`${styles.wave} ${styles.waveNav} ${styles.waveInk}`} />
            </span>
          ) : null}
          {typeRole === "menu" ? (
            <span className={styles.underline} aria-hidden="true">
              <Icon name="underlineWaveMenu" className={`${styles.wave} ${styles.waveMenu}`} />
            </span>
          ) : null}
        </span>
      )}
    </a>
  );
}
