import type { ReactNode } from "react";
import { Icon } from "@/components/atoms/Icon";
import styles from "./NavPanel.module.css";

/**
 * NavPanel — molecule. El panel móvil (≤ punto de corte): `<details>/<summary>` nativo, sin JavaScript. El conmutador es enfocable y
 * se abre y cierra con teclado (Enter/Espacio) por sí solo; la navegación que contiene está en el HTML servido (D-BBW-09: HTML completo).
 * Visible solo en la vista colapsada (rol `--bbf-nav-panel-display`, semantic/viewport.css).
 * Fase 6c: el conmutador dibuja los dos brazos ondulados del diseño (maestros por el puerto de medios) y la etiqueta (`nav.toggleLabel`,
 * desde `content/`) queda como nombre accesible; la hoja recibe el velo y el desenfoque de fondo por tokens. La cruz del estado abierto
 * (rotación ±45°) exige un ángulo sin token y una transición: NO se dibuja (reportado); abierto = brazos en acento.
 * Fase 6l: el conmutador entra con el resto del cromo (el retardo de la nav, 380 ms en el diseño, dc:L256).
 */
export function NavPanel({ toggleLabel, children }: { toggleLabel: string; children: ReactNode }) {
  return (
    <details className={styles.panel} data-component="bbf-nav-panel">
      <summary className={styles.toggle} data-enter="">
        <span className={styles.arms} aria-hidden="true">
          <Icon name="toggleArmTop" className={styles.arm} />
          <Icon name="toggleArmBottom" className={styles.arm} />
        </span>
        <span className={styles.hidden}>{toggleLabel}</span>
      </summary>
      <div className={styles.sheet}>{children}</div>
    </details>
  );
}
