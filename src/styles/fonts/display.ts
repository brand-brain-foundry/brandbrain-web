/**
 * PUERTO DE TIPOGRAFÍA DISPLAY — adaptador actual: Adobe Typekit (D-BBW-14). Registro: docs/system/PORTS.md.
 * Actor externo en runtime: la hoja de estilos y los archivos de fuente los sirve Adobe. El identificador del proyecto
 * web no es un secreto y NO hay lista de dominios: el embed funciona en cualquier sitio (Adobe Fonts, "Domains",
 * 2022-11-16). La política de seguridad de contenido (fase 7) deberá permitir `hosts`. Alternativa prevista: CAMBIAR DE
 * FAMILIA display a una con licencia que permita auto-hospedar → este archivo pasa a un `localFont` como text.ts y el
 * token `--bbf-font-display` cambia de valor; nada más se toca. Auto-hospedar los archivos de Adobe NO es alternativa:
 * su licencia web exige el embed code y prohíbe el alojamiento local (Adobe Fonts, "Web fonts from Adobe Fonts",
 * 2025-11-14). Ver docs/system/PORTS.md.
 * Familias que el kit sirve: las nombra ÚNICAMENTE el token `--bbf-font-display` (primitives/typography.css).
 */
const kitId = "ntm5vqh";

export const displayFont = {
  provider: "typekit",
  kitId,
  stylesheet: `https://use.typekit.net/${kitId}.css`,
  hosts: ["https://use.typekit.net", "https://p.typekit.net"],
} as const;
