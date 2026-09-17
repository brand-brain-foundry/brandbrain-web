import type { GlobalDocument } from "@/content/schema";
import { LinkList } from "@/components/molecules/LinkList";
import { resolveLinks } from "@/components/organisms/Header";
import type { CSSProperties } from "react";
import styles from "./Footer.module.css";

/** orden de entrada (fase 6g): la barra es la última pieza del escalonado del héroe (marca 0 · titular 1 · rótulo 2 · afirmaciones 3-4 · barra 5) */
const ENTER: CSSProperties = { "--bbf-enter-index": 5 } as CSSProperties;

/**
 * Footer — organism (cromo persistente, vive en el layout). Aviso de estado + línea legal + perfiles. Todo texto desde `content/`.
 * Fase 6c: el punto de estado se dibuja (diámetro 4 = ×1, halo de acento previsto en primitives/shadows.css) SIN pulso: el pulso es
 * movimiento y va al turno siguiente. Los perfiles muestran su icono (puerto de medios) con el texto como nombre accesible.
 * Fase 6f (composición leída del export): BARRA superpuesta al pie del escenario; en la vista amplia, legal + perfiles a la izquierda y el
 * aviso a la derecha; en la colapsada, una fila centrada con legal y aviso, y los perfiles viven en la hoja del panel (roles de vista).
 */
export function Footer({ global }: { global: GlobalDocument }) {
  return (
    <footer className={styles.footer} data-component="bbf-footer" data-enter="" style={ENTER}>
      <p className={styles.notice}>
        <span className={styles.dot} aria-hidden="true" />
        <span>{global.footer.notice}</span>
      </p>
      <div className={styles.legalGroup}>
        <p className={styles.legal}>{global.footer.legal}</p>
        <div className={styles.social}>
          <LinkList items={resolveLinks(global.footer.social)} typeRole="legal" iconSize="sm" />
        </div>
      </div>
    </footer>
  );
}
