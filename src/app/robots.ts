import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { pagesWhere, pageRoute } from "@/config/pages";

/**
 * FICHERO DE ROBOTS — generado en la compilación (ruta de metadatos de Next: el export estático lo emite como `out/robots.txt`).
 * No vive en `public/`: así el dominio del mapa del sitio sale de la fuente única (`src/config/site.ts`) y no se escribe a mano.
 *
 * D-BBW-12 — POLÍTICA DE RASTREADORES: se permiten las TRES categorías (búsqueda, agente y entrenamiento), en todas las rutas,
 * con una EXCEPCIÓN POR RUTA (P-BBW-80): los agentes de IA no indexan las páginas cuyo TIPO no es indexable (registro
 * `src/config/pages.ts` × `page-types.ts`, P-BBW-94) porque contienen datos de identificación legales que no deben entrar en corpus de entrenamiento.
 * La regla general sigue siendo `* Allow /`; los agentes específicos añaden un Disallow calculado desde el registro.
 *
 * DATO VERIFICADO (Google, «Google's common crawlers»): «Google-Extended does not impact a site's inclusion in Google Search
 * nor is it used as a ranking signal»; es un token de control, no un rastreador independiente. Bloquearlo en una ruta no arrastra
 * a Googlebot. Todos los agentes de este fichero tienen documentación oficial de su proveedor; uno sin página oficial no entra
 * (tabla verificada en OUTPUT-BBW-2026-11-05-L2c-cerrar-l2).
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
 * Agentes de IA (rastreadores, tokens de control y de usuario) con documentación oficial de su proveedor.
 * Cada uno tiene Disallow para las rutas de las páginas de tipo no indexable (datos de identificación legales).
 * Las rutas se calculan desde el registro (`src/config/pages.ts`) y los locales publicados, no se escriben.
 * Exportado para que la guardia R7 (`scripts/lint/check-seo.ts`) compruebe el `robots.txt` compilado contra esta misma lista.
 * Fuentes verificadas en tabla de OUTPUT-BBW-2026-11-05-L2c-cerrar-l2.
 */
export const AI_AGENTS = [
  "GPTBot",             // OpenAI · entrenamiento de modelos
  "OAI-SearchBot",      // OpenAI · resultados de búsqueda en ChatGPT (no entrena)
  "ChatGPT-User",       // OpenAI · acciones de usuario en ChatGPT
  "ClaudeBot",          // Anthropic · entrenamiento de modelos
  "Claude-SearchBot",   // Anthropic · búsqueda web para resultados de Claude
  "Claude-User",        // Anthropic · peticiones de usuario en Claude
  "Google-Extended",    // Google · token de control para corpus de Gemini/Vertex AI (no arrastra a Googlebot)
  "Applebot-Extended",  // Apple · token de control para modelos de Apple Intelligence (no arastra a Applebot)
  "Meta-ExternalAgent", // Meta · entrenamiento de modelos fundacionales y productos Meta
  "PerplexityBot",      // Perplexity · rastreo para resultados de búsqueda
  "CCBot",              // Common Crawl · corpus de datos web abiertos
] as const;

/** Rutas de tipo no indexable × locales publicados: las que los agentes tienen Disallow. */
const RESTRICTED_PATHS = site.publishedLocales.flatMap((locale) =>
  pagesWhere((rules) => !rules.indexable).map((p) => pageRoute(locale, p.id))
);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_AGENTS.map((ua) => ({
        userAgent: ua,
        disallow: RESTRICTED_PATHS,
      })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
