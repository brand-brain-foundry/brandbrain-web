import type { GlobalDocument } from "@/content/schema";
import { LinkList } from "@/components/molecules/LinkList";
import { resolveLinks } from "@/components/organisms/Header";
import styles from "./Footer.module.css";

/**
 * Footer — organism (cromo persistente, vive en el layout). Aviso de estado + línea legal + perfiles. Todo texto desde `content/`.
 * El punto de estado pulsante del diseño no se dibuja: su diámetro no existe como token (reportado) y la fase 6b no anima nada.
 */
export function Footer({ global }: { global: GlobalDocument }) {
  return (
    <footer className={styles.footer} data-component="bbf-footer">
      <p className={styles.notice}>{global.footer.notice}</p>
      <p className={styles.legal}>{global.footer.legal}</p>
      <LinkList items={resolveLinks(global.footer.social)} typeRole="legal" />
    </footer>
  );
}
