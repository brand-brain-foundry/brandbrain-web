import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { pagesWhere, pageUrl } from "@/config/pages";

/**
 * MAPA DEL SITIO — generado en la compilación (ruta de metadatos de Next: el export estático lo emite como `out/sitemap.xml`).
 *
 * · Solo LOCALES PUBLICADOS (D-BBW-15) y solo las páginas cuyo TIPO es indexable (registro `src/config/pages.ts` × `page-types.ts`,
 *   P-BBW-94): una página oculta no entra; una página nueva entra con su fila del registro sin tocar este archivo. Nada declara una
 *   versión inglesa mientras no exista, así que tampoco hay `xhtml:link` de idioma alterno. Añadir "en" a `publishedLocales` añade sus filas.
 * · Las URL son las CANÓNICAS, con la barra final que emite el build (`trailingSlash: true`) y las mismas que declara `alternates.canonical`.
 * · La raíz `/` NO entra: es la defensa de D-BBW-07 y redirige 301 al locale por defecto. Un mapa del sitio lista destinos finales.
 * · SIN `lastModified`, `changeFrequency` ni `priority`: las dos últimas Google las ignora, y la fecha que este build puede dar es la de la
 *   compilación, no la del cambio de contenido — declararla haría que cada despliegue dijera "cambió todo", que es una señal falsa.
 */
/**
 * `output: "export"` (D-BBW-03) exige que una ruta de metadatos declare que es ESTÁTICA: sin esto el build para con
 * «export const dynamic … not configured». No es un ajuste de rendimiento, es el contrato del artefacto: este mapa del sitio
 * se calcula una vez, al compilar, y se sirve como archivo.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return site.publishedLocales.flatMap((locale) =>
    pagesWhere((rules) => rules.indexable).map((page) => ({ url: pageUrl(locale, page.id) }))
  );
}
