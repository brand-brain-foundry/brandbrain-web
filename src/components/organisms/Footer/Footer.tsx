import type { GlobalDocument } from "@/content/schema";
import { LinkList } from "@/components/molecules/LinkList";
import { resolveLinks } from "@/components/organisms/Header";
import styles from "./Footer.module.css";

/**
 * Footer — organism (cromo persistente, vive en el layout). Firma + línea legal + perfiles. Todo texto desde `content/`.
 * Fase 6f (composición leída del export): BARRA superpuesta al pie del escenario; en la vista amplia, legal + perfiles a la izquierda y la
 * otra pieza a la derecha; en la colapsada, una fila centrada, y los perfiles viven en la hoja del panel (roles de vista). Fase 6l: las dos
 * piezas de la barra entran POR SEPARADO, cada una con el retardo de su rol.
 * D-BBW-49: donde estaba el AVISO de estado («En construcción») va ahora LA FIRMA, desde la misma llave de contenido que consume el héroe —
 * la biblia v2 §12 exige consistencia de entidad, la misma cadena exacta siempre. Con el aviso se retira SU PUNTO DE ESTADO con el pulso de
 * la 6g: el punto era el indicador de ese aviso y junto a un nombre propio no significa nada (I-6: nada sin consumidor).
 * La firma toma aquí el rol tipográfico `legal`, que es el de la barra, y no el rol `signature` del héroe: la decisión obliga a una sola
 * LLAVE (la consistencia es sobre la cadena), no a un solo cuerpo en superficies distintas.
 */
export function Footer({ global }: { global: GlobalDocument }) {
  return (
    <footer className={styles.footer} data-component="bbf-footer">
      <p className={styles.signature} data-enter="">
        {global.signature}
      </p>
      <div className={styles.legalGroup} data-enter="">
        <p className={styles.legal}>{global.footer.legal}</p>
        <div className={styles.social}>
          <LinkList items={resolveLinks(global.footer.social)} typeRole="legal" iconSize="sm" />
        </div>
      </div>
    </footer>
  );
}
