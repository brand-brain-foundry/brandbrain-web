import { NavLink, type NavLinkProps } from "@/components/atoms/NavLink";
import type { InlineIconName } from "@/media";
import styles from "./LinkList.module.css";

export type ResolvedLink = { id: string; label: string; href: string; icon?: InlineIconName };

/**
 * LinkList — molecule. Lista de enlaces (nav en línea, hoja móvil, perfiles del pie): el MISMO dato se renderiza en varios sitios
 * (N0 §2.3: "una fuente de datos, dos renders"). Los destinos (y, fase 6c, el icono de perfil si existe) llegan ya resueltos por el
 * organismo (site.links, puerto de medios); las etiquetas, del contenido.
 */
export function LinkList({
  items,
  typeRole,
  direction = "row",
  iconSize,
}: {
  items: ResolvedLink[];
  typeRole: NavLinkProps["typeRole"];
  direction?: "row" | "column";
  iconSize?: NavLinkProps["iconSize"];
}) {
  return (
    <ul className={`${styles.list} ${styles[direction]}`} data-component="bbf-link-list">
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <NavLink href={item.href} label={item.label} typeRole={typeRole} icon={item.icon} iconSize={iconSize} />
        </li>
      ))}
    </ul>
  );
}
