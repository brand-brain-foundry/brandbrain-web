import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * FICHERO DE ROBOTS — generado en la compilación (ruta de metadatos de Next: el export estático lo emite como `out/robots.txt`).
 * No vive en `public/`: así el dominio del mapa del sitio sale de la fuente única (`src/config/site.ts`) y no se escribe a mano.
 *
 * D-BBW-12 — POLÍTICA DE RASTREADORES: se permiten las TRES categorías (búsqueda, agente y entrenamiento), en todas las rutas,
 * con una EXCEPCIÓN POR RUTA (P-BBW-80): los agentes de entrenamiento y de respuestas de IA no indexan `/es/aviso-legal/`
 * porque esa página contiene datos de identificación legales (NIF, domicilio, teléfono) que no deben entrar en corpus de
 * entrenamiento. La regla general sigue siendo `* Allow /`; los agentes específicos añaden un `Disallow` para esa ruta.
 *
 * DATO VERIFICADO (Google, «Google's common crawlers», actualizado 2026-10-30): «Google-Extended does not impact a site's
 * inclusion in Google Search nor is it used as a ranking signal»; no tiene agente propio, es un token de control. Bloquearlo
 * en una ruta no arrastra a Googlebot. Los agentes de este array se declaran en documentación oficial; uno sin página oficial
 * no entra (ver tabla de fuentes en el output de L2b).
 *
 * La otra mitad de la política vive en el panel de Cloudflare y es [ZAVALA-MANUAL] del cutover: este fichero no puede desactivar
 * un bloqueo que se aplique en el borde.
 */
/**
 * `output: "export"` (D-BBW-03) exige que una ruta de metadatos declare que es ESTÁTICA: sin esto el build para con
 * «export const dynamic … not configured». No es un ajuste de rendimiento, es el contrato del artefacto: este fichero de robots
 * se calcula una vez, al compilar, y se sirve como archivo.
 */
export const dynamic = "force-static";

/**
 * Agentes de entrenamiento y respuestas de IA con documentación oficial de su proveedor.
 * Cada uno tiene `Disallow: /es/aviso-legal/` (P-BBW-80). Ver fuentes en el output de L2b.
 */
const AI_TRAINING_AGENTS = [
  "GPTBot",             // OpenAI entrenamiento
  "ChatGPT-User",       // OpenAI respuestas
  "anthropic-ai",       // Anthropic entrenamiento
  "ClaudeBot",          // Anthropic navegación para Claude
  "Google-Extended",    // Google Gemini (token de control — no arrastra a Googlebot; dato verificado §0)
  "Applebot-Extended",  // Apple Intelligence
  "Meta-ExternalAgent", // Meta AI entrenamiento
  "PerplexityBot",      // Perplexity.ai
  "CCBot",              // Common Crawl
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_TRAINING_AGENTS.map((ua) => ({
        userAgent: ua,
        disallow: "/es/aviso-legal/",
      })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
