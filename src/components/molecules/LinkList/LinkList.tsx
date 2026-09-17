import { NavLink, type NavLinkProps } from "@/components/atoms/NavLink";
import styles from "./LinkList.module.css";

export type ResolvedLink = { id: string; label: string; href: string };

/**
 * LinkList — molecule. Lista de enlaces (nav en línea, hoja móvil, perfiles del pie): el MISMO dato se renderiza en varios sitios
 * (N0 §2.3: "una fuente de datos, dos renders"). Los destinos llegan ya resueltos por el organismo (site.links); las etiquetas, del contenido.
 */
export function LinkList({
  items,
  typeRole,
  direction = "row",
}: {
  items: ResolvedLink[];
  typeRole: NavLinkProps["typeRole"];
  direction?: "row" | "column";
}) {
  return (
    <ul className={`${styles.list} ${styles[direction]}`} data-component="bbf-link-list">
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <NavLink href={item.href} label={item.label} typeRole={typeRole} />
        </li>
      ))}
    </ul>
  );
}
