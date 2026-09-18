import { NavLink, type NavLinkProps } from "@/components/atoms/NavLink";
import type { InlineIconName } from "@/media";
import type { CSSProperties } from "react";
import styles from "./LinkList.module.css";

const enterIndex = (i: number) => ({ "--bbf-enter-index": i }) as CSSProperties;

export type ResolvedLink = { id: string; label: string; href: string; icon?: InlineIconName };

/**
 * LinkList — molecule. Lista de enlaces (nav en línea, hoja móvil, perfiles del pie): el MISMO dato se renderiza en varios sitios
 * (N0 §2.3: "una fuente de datos, dos renders"). Los destinos (y, fase 6c, el icono de perfil si existe) llegan ya resueltos por el
 * organismo (site.links, puerto de medios); las etiquetas, del contenido. Fase 6g: con `enter`, cada enlace entra escalonado al cargar
 * (`data-enter` + índice de orden; el retardo base y el paso los fija el contenedor, regla del sistema en base/document.css). Fase 6l: la nav
 * es la ÚNICA pieza donde el diseño escalona por índice (380 + 110·i, dc:L695); el resto entra con el retardo de su propia pieza.
 */
export function LinkList({
  items,
  typeRole,
  direction = "row",
  iconSize,
  enter = false,
}: {
  items: ResolvedLink[];
  typeRole: NavLinkProps["typeRole"];
  direction?: "row" | "column";
  iconSize?: NavLinkProps["iconSize"];
  enter?: boolean;
}) {
  return (
    <ul className={`${styles.list} ${styles[direction]}`} data-component="bbf-link-list">
      {items.map((item, i) => (
        <li key={item.id} className={styles.item} data-enter={enter ? "" : undefined} style={enter ? enterIndex(i) : undefined}>
          <NavLink href={item.href} label={item.label} typeRole={typeRole} icon={item.icon} iconSize={iconSize} />
        </li>
      ))}
    </ul>
  );
}
