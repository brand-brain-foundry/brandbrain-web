/**
 * ÚNICA FUENTE DE VERDAD del sitio (I-2, C-01).
 * Dominio canónico, locales, nombre y contacto viven SOLO aquí.
 * Ningún otro archivo del repo repite estos valores literalmente: los importa.
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
    mailto: `mailto:${contactEmail}`,
  },
} as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
