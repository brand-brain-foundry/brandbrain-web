import type { GlobalDocument } from "@/content/schema";
import { LinkList } from "@/components/molecules/LinkList";
import { resolveLinks } from "@/components/organisms/Header";
import styles from "./Footer.module.css";

/**
 * Footer — organism (cromo persistente, vive en el layout). Línea legal + perfiles. Todo texto desde `content/`.
 * Fase 6f (composición leída del export): BARRA superpuesta al pie del escenario; en la vista colapsada, una fila centrada, y los perfiles
 * viven en la hoja del panel (roles de vista). Las dos piezas entran POR SEPARADO, cada una con el retardo de su rol (fase 6l).
 * D-BBW-51 · LA BARRA QUEDA EN DOS PIEZAS: la línea legal a la IZQUIERDA y los perfiles a la DERECHA. Se invierte el orden que la 6f había
 * leído del export (allí el aviso iba a la derecha y legal + perfiles juntos a la izquierda) porque ya no hay tres piezas sino dos: sin el
 * aviso, agrupar la legal con los perfiles dejaba el extremo derecho vacío. El orden del DOM es el visual y la fila deja de estar invertida.
 * LO QUE SALE, en el mismo commit (I-6): el aviso de estado con su punto y su pulso (Q-BBW-010, confirmada por Zavala) y la FIRMA
 * (D-BBW-50), que pasa a tener una sola aparición en toda la página, bajo el encabezado del héroe.
 */
export function Footer({ global }: { global: GlobalDocument }) {
  return (
    <footer className={styles.footer} data-component="bbf-footer">
      <p className={styles.legal} data-enter="">
        {global.footer.legal}
      </p>
      <div className={styles.social} data-enter="">
        <LinkList items={resolveLinks(global.footer.social)} typeRole="legal" iconSize="sm" />
      </div>
    </footer>
  );
}
