/**
 * ÚNICA FUENTE DE VERDAD del sitio (I-2, C-01).
 * Dominio canónico, locales, nombre, contacto y ENLACES DE IDENTIDAD viven SOLO aquí.
 * Ningún otro archivo del repo repite estos valores literalmente: los importa. El contenido (`content/`) nunca
 * escribe una URL: referencia una llave de `links` y el puerto de contenido valida que exista (fase 6a).
 */
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

/**
 * D-BBW-15 — lanzamiento SOLO en español. `locales` es la ESTRUCTURA (D-BBW-07: rutas por locale con prefijo, se conserva);
 * `publishedLocales` es lo que el build EMITE. Nada declara una versión EN mientras no exista copy: ni rutas, ni alternates,
 * ni sitemap. Añadir "en" aquí es aditivo, no una migración.
 */
export const publishedLocales = ["es"] as const satisfies readonly Locale[];

const domain = "brandbrainfoundry.com";
const contactEmail = "contacto@brandbrainfoundry.com";
const contactMailto = `mailto:${contactEmail}`;

/**
 * Enlaces de identidad (a dónde apunta la web fuera de sí misma), nombrados por ROL, nunca por lo que muestran.
 * Destinos salientes: NO son actores externos (ninguna petición en runtime desde la página) → no son puertos (PORTS.md §"Enlaces salientes").
 * Valores tomados del inventario del N0 (OUTPUT-BBW-2026-09-16-N0 §2.4, export de diseño): pendientes de confirmación por Zavala (P-BBW-19).
 */
const links = {
  /** la agencia hermana (hoy: sivarbrains.com) */
  agency: "https://sivarbrains.com",
  /** portafolio de trabajos con IA */
  works: "https://branddesignerpro.com/proyectos-ia/",
  linkedin: "https://www.linkedin.com/in/zavalacubas/",
  github: "https://github.com/zavala-brander",
  /** contacto = el buzón oficial (D-BBW-13(a)); misma fuente que `contact.mailto` */
  contact: contactMailto,
} as const;

export type LinkKey = keyof typeof links;

export const site = {
  name: "Brand Brain Foundry",
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
