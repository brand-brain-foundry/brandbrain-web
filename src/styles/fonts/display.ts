/**
 * PUERTO DE TIPOGRAFÍA DISPLAY — adaptador actual: Adobe Typekit (D-BBW-14). Registro: docs/system/PORTS.md.
 * Actor externo en runtime: la hoja de estilos y los archivos de fuente los sirve Adobe. El identificador del kit no es un
 * secreto, pero el kit está atado a una lista de dominios: el dominio de producción debe darse de alta en el kit
 * [ZAVALA-MANUAL] o la fuente no cargará aunque todo lo demás esté bien. La política de seguridad de contenido (fase 7)
 * deberá permitir `hosts`. Alternativa prevista: auto-hospedar el display si un día se licencia → este archivo cambia a un
 * `localFont` como text.ts y el token `--bbf-font-display` deja de nombrar familias de Typekit; nada más se toca.
 * Familias que el kit sirve: las nombra ÚNICAMENTE el token `--bbf-font-display` (primitives/typography.css).
 */
const kitId = "ntm5vqh";

export const displayFont = {
  provider: "typekit",
  kitId,
  stylesheet: `https://use.typekit.net/${kitId}.css`,
  hosts: ["https://use.typekit.net", "https://p.typekit.net"],
} as const;
