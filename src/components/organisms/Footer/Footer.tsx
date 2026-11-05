import Link from "next/link";
import type { Locale } from "@/config/site";
import type { GlobalDocument } from "@/content/schema";
import { LinkList } from "@/components/molecules/LinkList";
import { resolveLinks } from "@/components/organisms/Header";
import { identity } from "@/content/site";
import { media } from "@/media";
import styles from "./Footer.module.css";

/**
 * Footer — organism en el flujo del documento (UX1, P-BBW-79). Tres grupos: legal (enlaces), identidad (sello + LinkedIn),
 * crédito (© text). Filete superior. Layout por roles de vista: fila en escritorio, columna en móvil (sin @media en el componente).
 * `currentHref` permite marcar el enlace activo con `aria-current="page"` en el HTML servido (I-4).
 */
export function Footer({ global, locale, currentHref }: { global: GlobalDocument; locale: Locale; currentHref?: string }) {
  const privacyHref = `/${locale}/privacidad/`;
  return (
    <footer className={styles.footer} data-component="bbf-footer">
      <nav className={styles.nav} data-enter="">
        <Link
          className={styles.privacy}
          href={privacyHref}
          aria-current={currentHref === privacyHref ? "page" : undefined}
        >
          {global.footer.privacy.label}
        </Link>
      </nav>
      <div className={styles.identity} data-enter="">
        <div className={styles.social}>
          <LinkList items={resolveLinks(global.footer.social)} typeRole="legal" iconSize="sm" />
        </div>
        {/* Sello: enlace simple a la credencial verificable de Credly (no el guion de inserción). */}
        <a className={styles.cert} href={identity.links.credly} target="_blank" rel="noopener noreferrer">
          <img
            src={media.gcFoundational72.src}
            srcSet={`${media.gcFoundational72.src} 1x, ${media.gcFoundational144.src} 2x`}
            width={media.gcFoundational72.width}
            height={media.gcFoundational72.height}
            alt=""
          />
          <span className={styles.certText}>{global.footer.cert.label}</span>
        </a>
      </div>
      <p className={styles.credit} data-enter="">
        {global.footer.legal}
      </p>
    </footer>
  );
}
