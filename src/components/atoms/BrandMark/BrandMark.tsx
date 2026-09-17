import styles from "./BrandMark.module.css";

/**
 * BrandMark — atom. La marca en la esquina, enlazada a la portada del locale. Hoy muestra el NOMBRE (identidad, `site.name`, llega por
 * props): el icono `bb-icon.svg` del diseño es un medio y el puerto de medios no tiene fila (PORTS.md) → no se incorpora en la fase 6b.
 */
export function BrandMark({ href, name }: { href: string; name: string }) {
  return (
    <a href={href} className={styles.brandMark} data-component="bbf-brand-mark">
      {name}
    </a>
  );
}
