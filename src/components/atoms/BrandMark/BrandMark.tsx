import { media } from "@/media";
import styles from "./BrandMark.module.css";

/**
 * BrandMark — atom. La marca en la esquina, enlazada a la portada del locale. Fase 6c: muestra el ICONO de marca por el puerto de medios
 * (derivado `icon.svg` del maestro `brand-icon.svg`, D-BBW-21) con sus dimensiones intrínsecas declaradas (no provoca saltos de
 * composición; el tamaño en pantalla lo pone el token). El nombre (`site.name`, identidad) es el texto alternativo. Sin literales.
 */
export function BrandMark({ href, name }: { href: string; name: string }) {
  return (
    <a href={href} className={styles.brandMark} data-component="bbf-brand-mark">
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático con images.unoptimized (D-BBW-03): next/image no optimiza nada aquí; el SVG llega por el puerto de medios con sus dimensiones intrínsecas */}
      <img src={media.icon.src} width={media.icon.width} height={media.icon.height} alt={name} className={styles.icon} />
    </a>
  );
}
