/**
 * ÚNICA FUENTE DE VERDAD del sitio (I-2, C-01).
 * Dominio canónico, locales, nombre, contacto y ENLACES DE IDENTIDAD viven SOLO aquí.
 * Ningún otro archivo del repo repite estos valores literalmente: los importa. El contenido (`content/`) nunca
 * escribe una URL: referencia una llave de `links` y el puerto de contenido valida que exista (fase 6a).
 *
 * D-BBW-58 — ENMIENDA DE IDENTIDAD (2026-09-21). El sitio es la PRÁCTICA PROFESIONAL de Christian Zavala Cubas, no la web de una marca
 * llamada Brand Brain Foundry: la biblia estratégica v2 §2 convierte «Brand Brain Foundry» en el nombre del MÉTODO. Cambian tres constantes
 * —dominio, nombre y buzón— y con ellas cambia TODO lo que se deriva: la canónica, el mapa del sitio, el fichero de robots, el manifiesto,
 * los datos estructurados, los metadatos para compartir y la línea legal del pie. Es exactamente lo que esta fuente única promete desde el
 * principio: la identidad se cambia en un archivo. Enmienda D-BBW-05 (canónico) y D-BBW-13(a) (buzón oficial).
 *
 * CONSISTENCIA DE ENTIDAD (biblia v2 §12): `name` es la cadena del nombre y es SIEMPRE LA MISMA, completa y sin variantes. Ni abreviaturas,
 * ni iniciales, ni el cargo pegado en unas superficies y no en otras. Quien necesite nombrar al sujeto del sitio lee esta constante.
 */
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

/**
 * D-BBW-15 — lanzamiento SOLO en español. `locales` es la ESTRUCTURA (D-BBW-07: rutas por locale con prefijo, se conserva);
 * `publishedLocales` es lo que el build EMITE. Nada declara una versión EN mientras no exista copy: ni rutas, ni alternates,
 * ni sitemap. Añadir "en" aquí es aditivo, no una migración.
 */
export const publishedLocales = ["es"] as const satisfies readonly Locale[];

const domain = "zavalacubas.com";
const contactEmail = "christian@zavalacubas.com";
const contactMailto = `mailto:${contactEmail}`;

/**
 * Enlaces de identidad (a dónde apunta la web fuera de sí misma), nombrados por ROL, nunca por lo que muestran.
 * Destinos salientes: NO son actores externos (ninguna petición en runtime desde la página) → no son puertos (PORTS.md §"Enlaces salientes").
 * Valores tomados del inventario del N0 (OUTPUT-BBW-2026-09-16-N0 §2.4) y CONFIRMADOS COMO DEFINITIVOS por Zavala el 2026-09-16 (P-BBW-19, fase 6a-bis).
 */
const links = {
  /** la agencia hermana (hoy: sivarbrains.com) */
  agency: "https://sivarbrains.com",
  /** portafolio de trabajos con IA */
  works: "https://branddesignerpro.com/proyectos-ia/",
  linkedin: "https://www.linkedin.com/in/zavalacubas/",
  github: "https://github.com/zavala-brander",
  /** contacto = el buzón oficial (D-BBW-13(a), reapuntado al dominio canónico nuevo por D-BBW-58); misma fuente que `contact.mailto` */
  contact: contactMailto,
} as const;

export type LinkKey = keyof typeof links;

export const site = {
  /** la cadena del nombre, completa y sin variantes (D-BBW-58). Es el NOMBRE DEL SITIO y el del sujeto que lo publica: son el mismo. */
  name: "Christian Zavala Cubas",
  /**
   * EL CARGO (D-BBW-61). La biblia estratégica v2 §2 lo declara como una CAPA de la arquitectura de nombres —igual que el nombre, la
   * categoría o el método—, no como copy: por eso vive aquí y no en `content/`. Verbatim de §2, y la misma cadena exacta en las dos
   * superficies que lo usan: la línea del pie (por sustitución `{{role}}`) y el `jobTitle` de los datos estructurados (por `site.role`).
   * Es lo que hace que «lo declarado se ve en la página» sea cierto POR CONSTRUCCIÓN y no por revisión.
   */
  role: "Director creativo de sistemas de marca",
  repo: "brandbrain-web",
  domain,
  url: `https://${domain}`,
  locales,
  publishedLocales,
  defaultLocale: "es" satisfies Locale as Locale,
  contact: {
    email: contactEmail,
    mailto: contactMailto,
  },
  links,
} as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isLinkKey(value: string): value is LinkKey {
  return Object.prototype.hasOwnProperty.call(links, value);
}
