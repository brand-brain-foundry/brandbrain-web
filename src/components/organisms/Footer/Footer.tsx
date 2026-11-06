import { Fragment } from "react";
import Link from "next/link";
import type { Locale } from "@/config/site";
import { LEGAL_PAGES, legalPageRoute } from "@/config/pages";
import type { GlobalDocument } from "@/content/schema";
import { LinkList } from "@/components/molecules/LinkList";
import { resolveLinks } from "@/components/organisms/Header";
import { identity } from "@/content/site";
import { BAR_AVOID_ATTR } from "@/components/organisms/ConsentBar";
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
 * M3 (P-BBW-84): todo enlace del pie se MARCA con su tipo de piel (`data-hover="text"` / el icono `"icon"` por NavLink) y recibe el hover de color del
 * sistema; NINGUNO lleva `data-scatter`: el pie queda sin desarme (solo cabecera y héroe). EL SELLO conserva su efecto propio al pasar —elevación y
 * halo de la insignia (P-BBW-82; Zavala, 2026-11-06: un efecto por pieza)— y su COLOR de hover es ya el del sistema, por la misma marca
 * (docs/system/BEHAVIOR.md §14).
 * P-BBW-82 ENMIENDA 1 (2026-11-06): «Configurar cookies» SALE DEL PIE (I-6: con su marca `data-consent-configure` y su separador) y vive como botón
 * al principio de la página de Cookies (`ConsentConfigure`, BEHAVIOR §13). La fila legal queda en sus tres páginas: «Aviso legal · Privacidad · Cookies»,
 * que ya no parte en dos líneas en el teléfono; la reserva del inicio pierde la línea que esa fila partida había pedido (semantic/viewport.css).
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
            <Link className={styles.legalLinksItem} href={legalPageRoute(locale, page.slug)} data-hover="text">
              {global.legal.pages[page.slug]?.label ?? page.slug}
            </Link>
          </Fragment>
        ))}
      </nav>
      <div className={styles.end}>
        <div className={styles.social} data-enter="">
          <LinkList items={resolveLinks(global.footer.social)} typeRole="legal" iconSize="sm" />
        </div>
        {/* EL SELLO (2026-11-02): enlace a la credencial verificable de Credly (`links.credly`, fuente única). Enlace simple, sin el guion
            de inserción de Credly (JS de terceros + iframe: I-4, I-5). Nombre accesible = su texto; la imagen va con `alt=""`.
            2026-11-06 (P-BBW-82, sello y banner): el enlace lleva la ENTRADA al cargar (`data-enter`) y la VISIBILIDAD; su CUERPO es otro
            elemento porque es el que APARECE, y una pieza con `data-enter` no puede transicionar lo que la entrada deja fijado (opacidad,
            desplazamiento, desenfoque). La INSIGNIA tiene su clase porque es la que se eleva con el halo al pasar.
            2026-11-06 (sello según solape): el enlace lleva la marca genérica `data-bar-avoid` (`ConsentBar/attr.ts`): el cableado de la barra
            del consentimiento lo observa y le pone `data-bar-covered` SOLO MIENTRAS LA BARRA LO TAPA, aunque sea en parte; entero por encima de
            la barra, aparece aunque ella siga abierta. El CSS de aquí solo lee esa marca. El HTML servido lo trae visible (I-4).
            SIN `data-scatter` (S11): un efecto por pieza; el sello ya tiene el suyo (elevación y halo). M3 (P-BBW-84): su COLOR de hover es el del
            sistema (`data-hover="text"`, el mismo rol que todo lo menta), no una regla propia. */}
        <a className={styles.cert} href={identity.links.credly} target="_blank" rel="noopener noreferrer" data-enter="" data-hover="text" {...{ [BAR_AVOID_ATTR]: "" }}>
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
