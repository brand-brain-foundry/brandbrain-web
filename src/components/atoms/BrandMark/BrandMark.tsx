import { media } from "@/media";
import styles from "./BrandMark.module.css";

/**
 * BrandMark — atom. La marca en la esquina, enlazada a la portada del locale. Fase 6c: muestra el ICONO de marca por el puerto de medios
 * (derivado `icon.svg` del maestro `brand-icon.svg`, D-BBW-21) con sus dimensiones intrínsecas declaradas (no provoca saltos de
 * composición; el tamaño en pantalla lo pone el token). El nombre (`site.name`, identidad) es el texto alternativo. Sin literales.
 * Fase 6g: entra al cargar (`data-enter`, regla del sistema en base/document.css). Fase 6l: con el retardo de SU pieza en la jerarquía del
 * diseño (rol `enter-delay-brand`, 260 ms: la marca abre el cromo, después del fondo y del escenario), no con un índice de orden.
 */
export function BrandMark({ href, name }: { href: string; name: string }) {
  return (
    <a href={href} className={styles.brandMark} data-component="bbf-brand-mark" data-enter="">
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático con images.unoptimized (D-BBW-03): next/image no optimiza nada aquí; el SVG llega por el puerto de medios con sus dimensiones intrínsecas */}
      <img src={media.icon.src} width={media.icon.width} height={media.icon.height} alt={name} className={styles.icon} />
    </a>
  );
}
