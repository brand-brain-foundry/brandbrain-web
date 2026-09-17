import styles from "./NavLink.module.css";

export type NavLinkProps = {
  href: string;
  /** texto visible / nombre accesible: llega del contenido (`LinkItem.label`) */
  label: string;
  /** rol tipográfico con el que se pinta (label = nav en línea · menu = hoja móvil · legal = pie) */
  typeRole: "label" | "menu" | "legal";
};

/** Un destino saliente (http/https) se abre en pestaña nueva con `rel` seguro (N0 §2.4: los enlaces externos abren en `_blank`). */
function isOutbound(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/**
 * NavLink — atom. Un enlace de navegación. Destino resuelto por el organismo desde `site.links` (fuente única); etiqueta desde `content/`.
 * Área táctil mínima por token. Sin literales.
 */
export function NavLink({ href, label, typeRole }: NavLinkProps) {
  const outbound = isOutbound(href);
  return (
    <a
      href={href}
      className={`${styles.navLink} ${styles[typeRole]}`}
      data-component="bbf-nav-link"
      target={outbound ? "_blank" : undefined}
      rel={outbound ? "noopener noreferrer" : undefined}
    >
      {label}
    </a>
  );
}
