import { inlineIcons, type InlineIconName } from "@/media";
import styles from "./Icon.module.css";

/**
 * Icon — atom. Un vector inline del puerto de medios (`src/media/generated.ts`: viewBox + trazado extraídos del maestro por el guion).
 * Pinta con `currentColor` (el color lo decide quien lo compone); las dimensiones y el grosor de trazo llegan por tokens en la clase que
 * recibe (`className`). Decorativo por defecto (`aria-hidden`): el nombre accesible lo pone el enlace o el botón que lo contiene.
 * Trazos: `preserveAspectRatio="none"` + `vector-effect: non-scaling-stroke` para que el trazo conserve su grosor de token aunque la caja
 * se estire (onda del subrayado, brazos del conmutador).
 */
export function Icon({ name, className }: { name: InlineIconName; className?: string }) {
  const icon = inlineIcons[name];
  const stroke = icon.paint === "stroke";
  return (
    <svg
      viewBox={icon.viewBox}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio={stroke ? "none" : undefined}
      className={`${styles.icon} ${stroke ? styles.stroke : styles.fill}${className ? ` ${className}` : ""}`}
      data-component="bbf-icon"
    >
      <path d={icon.d} vectorEffect={stroke ? "non-scaling-stroke" : undefined} />
    </svg>
  );
}
