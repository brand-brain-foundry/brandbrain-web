import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * FICHERO DE ROBOTS — generado en la compilación (ruta de metadatos de Next: el export estático lo emite como `out/robots.txt`).
 * No vive en `public/`: así el dominio del mapa del sitio sale de la fuente única (`src/config/site.ts`) y no se escribe a mano.
 *
 * D-BBW-12 — POLÍTICA DE RASTREADORES: se permiten las TRES categorías (búsqueda, agente y entrenamiento), en todas las rutas. Una sola
 * regla `*` con `allow: "/"` lo consigue sin enumerar agentes: enumerarlos solo añade la posibilidad de olvidar uno, y cualquier olvido en
 * una lista de permitidos es un bloqueo. Aquí NO hay, ni puede haber, ninguna línea `Disallow` ni ningún `Google-Extended` excluido: eso
 * arrastraría a Googlebot, que es el argumento firmado de la decisión.
 *
 * La otra mitad de la política vive en el panel de Cloudflare y es [ZAVALA-MANUAL] del cutover: este fichero no puede desactivar un bloqueo
 * que se aplique en el borde.
 */
/**
 * `output: "export"` (D-BBW-03) exige que una ruta de metadatos declare que es ESTÁTICA: sin esto el build para con
 * «export const dynamic … not configured». No es un ajuste de rendimiento, es el contrato del artefacto: este fichero de robots
 * se calcula una vez, al compilar, y se sirve como archivo.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
