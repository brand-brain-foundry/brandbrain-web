import { site, type Locale } from "@/config/site";
import { media } from "@/media";

/**
 * DATOS ESTRUCTURADOS (fase 7). Se DERIVAN de la fuente única (`src/config/site.ts`) y del documento de la página; ningún dominio, buzón
 * ni nombre se escribe literal aquí (criterio transversal 1). Salen como un solo `<script type="application/ld+json">` con un `@graph`.
 *
 * REGLA QUE MANDA (despacho fase 7 §F3): los datos estructurados DESCRIBEN la página; no añaden hechos que la página no dice. Por eso:
 *
 * · `ProfessionalService` (y cualquier otro `LocalBusiness`) NO se emite: Google exige `address` con la localidad física
 *   (developers.google.com/search/docs/appearance/structured-data/local-business, "Required properties", actualizada 2026-09-08) y este
 *   sitio no tiene dirección publicada. Inventarla sería el dato falso que §5 del despacho prohíbe. Cuando exista dirección real y visible
 *   en la página, el tipo entra aquí y no antes.
 * · `sameAs` NO se emite: los perfiles del pie (`site.links.linkedin`, `site.links.github`) son cuentas personales y la página NO dice de
 *   quién son (sus nombres accesibles son "Perfil de LinkedIn" y "Perfil de GitHub", deliberadamente sin atribuir). `sameAs` afirmaría que
 *   esos perfiles SON la organización. Si Zavala confirma que lo son, es una línea: añadir `sameAs: [site.links.linkedin, site.links.github]`
 *   a `organization`.
 * · `site.links.agency` y `site.links.works` tampoco entran en `sameAs`: son OTRAS entidades (la agencia hermana y un portafolio), no esta
 *   organización con otra dirección.
 * · `aggregateRating`, `review`, `priceRange`, `telephone`, `foundingDate`: no existen en la página. No se emiten.
 *
 * LÍMITE CONOCIDO de `WebSite` (verificado en vivo): el nombre de sitio de Google NO se admite a nivel de subdirectorio —
 * un sitio en subdirectorio (`/es/`) figura explícitamente como NO admitido (developers.google.com/search/docs/appearance/site-names,
 * actualizada 2025-12-10). La portada canónica de este sitio es `/es/` por D-BBW-07 (prefijo de ruta en ambos locales), así que la
 * característica de nombre de sitio queda fuera de alcance mientras `/` redirija. El tipo se emite igualmente: es válido, lo leen los
 * agentes de IA y declara idioma y editor. Cerrarlo exigiría servir el español sin prefijo, que D-BBW-07 descartó por firma.
 */

/** Absolutiza una ruta del puerto de medios contra el dominio canónico (la fuente única pone el origen; aquí solo se concatena). */
function absolute(path: string): string {
  return new URL(path, site.url).toString();
}

/** URL canónica de la portada de un locale publicado. Misma forma que emite el build (`trailingSlash: true`). */
export function homeUrl(locale: Locale): string {
  return `${site.url}/${locale}/`;
}

export function homeGraph(locale: Locale, description: string): object {
  const home = homeUrl(locale);
  const organizationId = `${site.url}/#organization`;
  const websiteId = `${site.url}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: site.name,
        url: home,
        // El MISMO dibujo de marca que la cabecera muestra (mismo maestro, puerto de medios, D-BBW-21), pero el derivado OPACO de 180 px y no
        // `icon.svg`: Google exige que el logo sea raster de al menos 112 px y que «se vea correctamente sobre fondo blanco»
        // (developers.google.com/search/docs/appearance/structured-data/logo, actualizada 2026-09-08), y el trazo del icono es casi blanco
        // sobre transparencia — sobre blanco desaparecería. El derivado de 180 lleva su propia superficie. Queda dicho que el registro de
        // medios no tiene todavía un derivado cuyo ROL sea «logo de datos estructurados»: añadirlo es un cambio del puerto, no de esta capa.
        logo: absolute(media.appleTouchIcon.src),
        // el buzón oficial (D-BBW-13(a)); la página lo lleva literal en el `href` del enlace de contacto
        email: site.contact.email,
        description,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: site.name,
        url: home,
        inLanguage: locale,
        publisher: { "@id": organizationId },
      },
    ],
  };
}
