import { Fragment } from "react";
import Link from "next/link";
import type { Locale } from "@/config/site";
import { LEGAL_PAGES, legalPageRoute } from "@/config/pages";
import type { GlobalDocument } from "@/content/schema";
import { LinkList } from "@/components/molecules/LinkList";
import { resolveLinks } from "@/components/organisms/Header";
import { identity } from "@/content/site";
import { CONSENT_CONFIGURE_ATTR } from "@/components/organisms/ConsentBar";
import { media } from "@/media";
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
 * S11 (M2, P-BBW-83): los enlaces legales del pie solo se MARCAN (`data-scatter="text"`). EL SELLO NO SE MARCA (Zavala, 2026-11-06: UN efecto
 * por pieza): conserva su propio efecto al pasar —elevación y halo de la insignia, tinte del texto (P-BBW-82)— y la guardia R11 lo exime por
 * su selector nombrado (`a.cert`), no por un hueco del inventario (docs/system/BEHAVIOR.md §14).
 */
export function Footer({ global, locale }: { global: GlobalDocument; locale: Locale }) {
  return (
    <footer className={styles.footer} data-component="bbf-footer">
      <p className={styles.legal} data-enter="">
        {global.footer.legal}
      </p>
      <nav className={styles.legalLinks} data-enter="" aria-label="Páginas legales">
        {LEGAL_PAGES.map((page, i) => (
          <Fragment key={page.slug}>
            {i > 0 && <span className={styles.legalLinksSep} aria-hidden="true" />}
            <Link className={styles.legalLinksItem} href={legalPageRoute(locale, page.slug)} data-scatter="text">
              {global.legal.pages[page.slug]?.label ?? page.slug}
            </Link>
          </Fragment>
        ))}
        {/* «CONFIGURAR COOKIES» (P-BBW-82, requisito 3: retirar igual de fácil que dar): en la misma fila legal, en todas las páginas.
            En el HTML es un enlace a la página de Cookies (la segunda capa, sin JavaScript); con JavaScript, el organismo del
            consentimiento lo intercepta por `data-consent-configure` y abre el panel. Es un `<a>` y no un `<Link>` a propósito: la
            navegación de cliente de Next se dispararía antes que la intercepción. */}
        <span className={styles.legalLinksSep} aria-hidden="true" />
        <a className={styles.legalLinksItem} href={legalPageRoute(locale, "cookies")} data-scatter="text" {...{ [CONSENT_CONFIGURE_ATTR]: "" }}>
          {global.consent.footerLink}
        </a>
      </nav>
      <div className={styles.end}>
        <div className={styles.social} data-enter="">
          <LinkList items={resolveLinks(global.footer.social)} typeRole="legal" iconSize="sm" />
        </div>
        {/* EL SELLO (2026-11-02): enlace a la credencial verificable de Credly (`links.credly`, fuente única). Enlace simple, sin el guion
            de inserción de Credly (JS de terceros + iframe: I-4, I-5). Nombre accesible = su texto; la imagen va con `alt=""`.
            2026-11-06 (P-BBW-82, sello y banner): el enlace lleva la ENTRADA al cargar (`data-enter`) y la VISIBILIDAD (oculto mientras la barra
            del consentimiento está a la vista, por `data-consent-bar` en `<html>`); su CUERPO es otro elemento porque es el que APARECE al bajar la
            barra, y una pieza con `data-enter` no puede transicionar lo que la entrada deja fijado (opacidad, desplazamiento, desenfoque). La
            INSIGNIA tiene su clase porque es la que se eleva con el halo al pasar. El HTML servido lo trae visible (I-4).
            SIN `data-scatter` (S11): un efecto por pieza; el sello ya tiene el suyo. Exento en R11 como `a.cert`. */}
        <a className={styles.cert} href={identity.links.credly} target="_blank" rel="noopener noreferrer" data-enter="">
          <span className={styles.certBody}>
            <img
              className={styles.certBadge}
              src={media.gcFoundational72.src}
              srcSet={`${media.gcFoundational72.src} 1x, ${media.gcFoundational144.src} 2x`}
              width={media.gcFoundational72.width}
              height={media.gcFoundational72.height}
              alt=""
            />
            <span className={styles.certText}>{global.footer.cert.label}</span>
          </span>
        </a>
      </div>
    </footer>
  );
}
