import { Icon } from "@/components/atoms/Icon";
import styles from "./BrandMark.module.css";

/**
 * BrandMark — atom. La marca en la esquina, enlazada a la portada del locale. F3 (P-BBW-69): vector inline en color de tinta,
 * sin halo ni filtro (el fondo es claro). El nombre es el accessible name del enlace (aria-label). Sin literales.
 * Fase 6g: entra al cargar (`data-enter`). Fase 6l: retardo del rol `enter-delay-brand`.
 */
export function BrandMark({ href, name }: { href: string; name: string }) {
  return (
    <a href={href} className={styles.brandMark} data-component="bbf-brand-mark" data-enter="" aria-label={name}>
      <Icon name="brandIcon" className={styles.icon} />
    </a>
  );
}
