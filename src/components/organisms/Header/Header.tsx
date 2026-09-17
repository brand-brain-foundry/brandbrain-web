import { site, type Locale } from "@/config/site";
import type { GlobalDocument, LinkItem } from "@/content/schema";
import { iconFor } from "@/media";
import { BrandMark } from "@/components/atoms/BrandMark";
import { LinkList, type ResolvedLink } from "@/components/molecules/LinkList";
import { NavPanel } from "@/components/molecules/NavPanel";
import styles from "./Header.module.css";

/** El destino de cada enlace vive SOLO en `site.links` (criterio 1); el contenido solo referencia la llave. Fase 6c: si el puerto de medios
 * tiene un icono de perfil con el `id` del enlace, viaja con él (el organismo resuelve; el átomo solo pinta). */
export function resolveLinks(items: LinkItem[]): ResolvedLink[] {
  return items.map((item) => ({ id: item.id, label: item.label, href: site.links[item.link], icon: iconFor(item.id) }));
}

/**
 * Header — organism (cromo persistente, vive en el layout). Marca + UNA región de navegación con dos renders del mismo dato
 * (N0 §2.3): la lista en línea (vista amplia) y el panel móvil (vista colapsada, `<details>`, con los perfiles del pie además).
 * Qué se ve en cada vista lo deciden los roles de semantic/viewport.css, nunca una media query aquí. Todo texto desde `content/`.
 * Fase 6g: los enlaces en línea entran escalonados al cargar con el paso de la nav (`--bbf-enter-step` en la hoja del organismo).
 */
export function Header({ locale, global }: { locale: Locale; global: GlobalDocument }) {
  const nav = resolveLinks(global.nav.items);
  const social = resolveLinks(global.footer.social);
  return (
    <header className={styles.header} data-component="bbf-header">
      <BrandMark href={`/${locale}/`} name={site.name} />
      <nav className={styles.nav}>
        <div className={styles.inline}>
          <LinkList items={nav} typeRole="label" enter />
        </div>
        <NavPanel toggleLabel={global.nav.toggleLabel}>
          <LinkList items={nav} typeRole="menu" direction="column" />
          <LinkList items={social} typeRole="legal" iconSize="md" />
        </NavPanel>
      </nav>
    </header>
  );
}
