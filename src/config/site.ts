/**
 * ÚNICA FUENTE DE VERDAD del sitio (I-2, C-01).
 * Dominio canónico, locales, nombre y contacto viven SOLO aquí.
 * Ningún otro archivo del repo repite estos valores literalmente: los importa.
 */
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

const domain = "brandbrainfoundry.com";
const contactEmail = "contacto@brandbrainfoundry.com";

export const site = {
  name: "Brand Brain Foundry",
  repo: "brandbrain-web",
  domain,
  url: `https://${domain}`,
  locales,
  defaultLocale: "es" satisfies Locale as Locale,
  contact: {
    email: contactEmail,
    mailto: `mailto:${contactEmail}`,
  },
} as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
