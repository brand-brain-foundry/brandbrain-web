/**
 * CONFIGURACIÓN TÉCNICA DEL SITIO (I-2, C-01). Dominio canónico, locales y locales publicados: lo que cambiarlo es una decisión de
 * DESPLIEGUE, no de redacción. Ningún otro archivo del repo repite estos valores: los importa.
 *
 * D-BBW-78 — LO EDITABLE BAJÓ A DATOS (2026-09-22). Este archivo llevaba también el nombre, el cargo, el buzón y los destinos de los
 * enlaces. Eran una fuente única —correcta en eso— pero **la fuente equivocada para quien edita**: un archivo de TypeScript no lo
 * cambia alguien no técnico sin riesgo, y el objetivo declarado del proyecto incluye que equipos no técnicos mantengan el sitio.
 * Esos cuatro se fueron a `content/site.json` y se leen por `src/content/site.ts`; **la fuente sigue siendo única**, solo que ahora
 * está donde vive quien la mantiene. Aquí se queda lo que NO es editable en ese sentido. Enmienda el punto de UBICACIÓN de D-BBW-58
 * y D-BBW-61; la regla de consistencia de entidad (biblia v4 §4) no cambia: una sola cadena, completa y sin variantes.
 *
 * D-BBW-58 — ENMIENDA DE IDENTIDAD (2026-09-21). El sitio es la PRÁCTICA PROFESIONAL de Christian Zavala Cubas, no la web de una marca
 * llamada Brand Brain Foundry: la biblia estratégica §2 convierte «Brand Brain Foundry» en el nombre del MÉTODO. De las tres constantes
 * que cambió entonces, aquí queda el DOMINIO; el nombre y el buzón viven ahora en el documento del sitio. Lo que se deriva del dominio
 * —la canónica, el mapa del sitio, el fichero de robots, las direcciones de los datos estructurados— sigue saliendo de aquí.
 * Enmienda D-BBW-05 (canónico) y D-BBW-13(a) (buzón oficial).
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

export const site = {
  repo: "brandbrain-web",
  domain,
  url: `https://${domain}`,
  locales,
  publishedLocales,
  defaultLocale: "es" satisfies Locale as Locale,
} as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
