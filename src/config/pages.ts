/**
 * REGISTRO DE PÁGINAS — fuente única de las rutas internas (P-BBW-80, L2 §0.3.1).
 *
 * Las rutas de las páginas del sitio son TÉCNICAS: una URL es una dirección de despliegue, no copy.
 * Por eso viven aquí (en código, no en content/) y de aquí derivan el sitemap, el robots.txt,
 * las redirecciones sin prefijo, el pie y los metadatos de cada página.
 *
 * Ningún componente escribe una ruta a mano. Ningún archivo de contenido escribe un slug.
 * Las ETIQUETAS visibles (los nombres de las páginas) viven en content/<locale>/global.json,
 * bajo legal.pages.<slug>.label — un solo sitio por texto.
 */

export type LegalPage = {
  /** segmento de ruta sin barra ni locale: `aviso-legal`, `privacidad`, `cookies` */
  slug: string;
  /** si la página entra en el sitemap y la rastrean los buscadores */
  indexed: boolean;
  /** si aparece en el sitemap.xml */
  inSitemap: boolean;
  /** orden de aparición en el grupo legal del pie (menor primero) */
  legalNavOrder: number;
  /**
   * si la página entra en la medición de visitas cuando hay consentimiento (P-BBW-82, requisito 6 del despacho L3).
   * El aviso legal queda FUERA: lleva datos de identificación y no se mide nunca, aunque se haya aceptado. El puerto de
   * analítica (`src/analytics/port.ts`) calcula las rutas excluidas de aquí; ningún otro archivo las escribe.
   */
  measured: boolean;
};

/** Páginas legales del sitio, en orden de pie. */
export const LEGAL_PAGES: readonly LegalPage[] = [
  { slug: "aviso-legal", indexed: false, inSitemap: false, legalNavOrder: 0, measured: false },
  { slug: "privacidad",  indexed: true,  inSitemap: true,  legalNavOrder: 1, measured: true },
  { slug: "cookies",     indexed: true,  inSitemap: true,  legalNavOrder: 2, measured: true },
] as const;

/** Los slugs de las páginas que entran en el sitemap. */
export const SITEMAP_LEGAL_SLUGS: readonly string[] = LEGAL_PAGES
  .filter((p) => p.inSitemap)
  .sort((a, b) => a.legalNavOrder - b.legalNavOrder)
  .map((p) => p.slug);

/** Ruta canónica de una página para un locale: `/${locale}/${slug}/` */
export function legalPageRoute(locale: string, slug: string): `/${string}/${string}/` {
  return `/${locale}/${slug}/`;
}
