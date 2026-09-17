import type { ReactNode } from "react";
import styles from "./NavPanel.module.css";

/**
 * NavPanel — molecule. El panel móvil (≤ punto de corte): `<details>/<summary>` nativo, sin JavaScript. El conmutador es enfocable y
 * se abre y cierra con teclado (Enter/Espacio) por sí solo; la navegación que contiene está en el HTML servido (D-BBW-09: HTML completo),
 * no aparece al ejecutar código. Visible solo en la vista colapsada (rol `--bbf-nav-panel-display`, semantic/viewport.css).
 * Etiqueta del conmutador desde `content/` (`nav.toggleLabel`). El icono de hamburguesa (dos ondas) del diseño necesita dimensiones que no
 * existen como token → no se dibuja: la etiqueta se ve como etiqueta (fase 6b).
 */
export function NavPanel({ toggleLabel, children }: { toggleLabel: string; children: ReactNode }) {
  return (
    <details className={styles.panel} data-component="bbf-nav-panel">
      <summary className={styles.toggle}>{toggleLabel}</summary>
      <div className={styles.sheet}>{children}</div>
    </details>
  );
}
