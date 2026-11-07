/**
 * TIPOS DE PÁGINA — los «músculos» del sistema de posicionamiento (P-BBW-94, S1 §0.2.2).
 *
 * Un tipo declara POR FÓRMULA lo que una página de ese tipo hace de cara a buscadores y agentes, y la página lo HEREDA del
 * registro (`src/config/pages.ts`): ninguna página decide a mano si se indexa, cómo se titula, qué datos estructurados emite,
 * si lleva imagen de compartir o si entra en el mapa del sitio. En términos de un gestor de contenido, un tipo es la PLANTILLA.
 *
 * De `indexable` se DERIVA todo lo que separa una página pública de una oculta (P-BBW-80 §0.1; D-BBW-12 por ruta):
 *   · el `<meta name="robots">` de la página (`src/seo/metadata.ts`);
 *   · su entrada en el mapa del sitio (`src/app/sitemap.ts`);
 *   · el `Disallow` para los agentes de IA en `robots.txt` (`src/app/robots.ts`);
 *   · la cabecera `X-Robots-Tag` en `public/_headers`, que NO se genera (es un manifiesto declarativo, D-BBW-44, y el export estático
 *     no lo escribe) sino que se VERIFICA: R6 (`check-content.ts`) sobre la fuente y R7 (`check-seo.ts`) sobre `out/`.
 *
 * FÓRMULA DEL TÍTULO. El documento de la página lleva su título PROPIO (`meta.title`, sin la marca); el tipo compone el `<title>`.
 * Google (Search Central, «Influencing your title links», act. 2025-12-10) recomienda el nombre del sitio «al principio o al final de cada
 * `<title>`, separado del resto con un delimitador»: la portada lo lleva delante (es la página de la persona) y las demás detrás.
 * S3 (D-BBW-81, D-BBW-87): el título propio de la portada es la CATEGORÍA, referenciada (`{{category}}`) y no escrita, y la categoría se
 * escribe en minúscula y sin poseerla; la mayúscula inicial del `<title>` la pone la fórmula del tipo `home` (una variante por fórmula,
 * I-3), nunca el contenido. Las demás fórmulas no la necesitan: sus títulos propios ya empiezan en mayúscula.
 *
 * EXCEPCIÓN AL RANGO: una página puede registrar en `pages.ts` (`titleLengthException`: longitud exacta + razón + decisión) un `<title>`
 * fuera del rango de su tipo; R7c la lee de allí. Hoy una: la portada, 61 caracteres (D-BBW-87).
 *
 * RANGOS DE LONGITUD — CRITERIO PROPIO, dicho porque no hay cifra oficial: Google declara que «no hay límite de longitud» ni para el
 * `<title>` («Influencing your title links», act. 2025-12-10) ni para la descripción («Control your snippets», act. 2026-04-20), y
 * que ambos «se truncan en los resultados según haga falta, normalmente para caber en el ancho del dispositivo». El rango que se fija aquí
 * es el que cabe sin truncar en la mayoría de resultados de escritorio y móvil según la práctica común del sector (título ≤ 60 caracteres,
 * descripción 50–160), con un suelo que excluye títulos y descripciones vacíos de sentido («Home», «Mechanical pencil»: los contraejemplos
 * de la propia documentación de Google). La guardia R7 lo aplica a las páginas indexables; cambiar el rango es cambiar este archivo y el
 * contrato (`docs/system/SEO.md`), no la guardia.
 */

/**
 * Qué grafo de datos estructurados emite un tipo (constructores en `src/seo/jsonld.ts`; un tipo sin constructor rompe el typecheck).
 * S3c (D-BBW-90): la persona se declara UNA vez en todo el sitio, en la página de perfil (`profile`: `ProfilePage` → `Person` completo); la
 * portada declara el sitio (`website`: `WebSite`, con `publisher` → la persona por su `@id`); las demás páginas no emiten nada propio.
 */
export type StructuredDataKind = "website" | "profile" | "none";

export type PageTypeRules = {
  /** si la página existe para buscadores y agentes: de aquí se derivan robots, sitemap, Disallow y la verificación de `_headers` */
  readonly indexable: boolean;
  /** si la página entra en la medición de visitas cuando hay consentimiento (P-BBW-82 requisito 6; `src/analytics/port.ts`) */
  readonly measured: boolean;
  /** si lleva la imagen de compartir (Open Graph + tarjeta grande); sin ella, las redes muestran solo título y descripción */
  readonly share: boolean;
  /** qué datos estructurados emite */
  readonly structuredData: StructuredDataKind;
  /** compone el `<title>` a partir del título propio de la página y de la marca (ninguno de los dos se escribe aquí) */
  readonly title: (own: string, brand: string) => string;
  /** rango admitido de longitud del `<title>` compuesto, en caracteres [mín, máx] (criterio propio, arriba) */
  readonly titleLength: readonly [number, number];
  /** rango admitido de longitud de la descripción, en caracteres [mín, máx] (criterio propio, arriba) */
  readonly descriptionLength: readonly [number, number];
};

/** Delimitador entre el título propio y la marca (Google: «hyphen, colon, or pipe» u otro delimitador; aquí el punto medio del sistema). */
const TITLE_SEPARATOR = " · ";

const TITLE_LENGTH = [20, 60] as const;
const DESCRIPTION_LENGTH = [50, 160] as const;

/** Mayúscula inicial (y nada más): la variante por fórmula de un título propio que el contenido escribe en minúscula (la categoría, D-BBW-81). */
const sentenceCase = (s: string): string => s.charAt(0).toLocaleUpperCase("es") + s.slice(1);

export const PAGE_TYPES = {
  /** la portada: declara el sitio (`WebSite`, editor = la persona por referencia) y lleva la marca delante del título */
  home: {
    indexable: true,
    measured: true,
    share: true,
    structuredData: "website",
    title: (own, brand) => `${brand}${TITLE_SEPARATOR}${sentenceCase(own)}`,
    titleLength: TITLE_LENGTH,
    descriptionLength: DESCRIPTION_LENGTH,
  },
  /**
   * LA PÁGINA DE PERFIL (S3c, D-BBW-90): la única página centrada en la persona (Google, «ProfilePage structured data»: una persona afiliada al
   * sitio, como una página «Sobre mí»). Emite `ProfilePage` con el `Person` COMPLETO, y es la única que lo declara (R7h). Indexable, en el mapa
   * del sitio, con imagen de compartir; el título propio va delante y la marca detrás, como las páginas de texto.
   */
  profile: {
    indexable: true,
    measured: true,
    share: true,
    structuredData: "profile",
    title: (own, brand) => `${own}${TITLE_SEPARATOR}${brand}`,
    titleLength: TITLE_LENGTH,
    descriptionLength: DESCRIPTION_LENGTH,
  },
  /** página legal pública (privacidad, cookies): indexable, sin datos estructurados propios (no es la entidad del sitio) */
  legal: {
    indexable: true,
    measured: true,
    share: true,
    structuredData: "none",
    title: (own, brand) => `${own}${TITLE_SEPARATOR}${brand}`,
    titleLength: TITLE_LENGTH,
    descriptionLength: DESCRIPTION_LENGTH,
  },
  /**
   * página legal con DATOS DE IDENTIFICACIÓN (aviso legal, P-BBW-80 §0.1): fuera de buscadores (`noindex, noarchive`), del mapa del sitio,
   * de los agentes de IA (`Disallow`), de la imagen de compartir y de la medición de visitas. Es un tipo propio y no una excepción de
   * `legal` porque la indexabilidad es del TIPO (S1 §0.2.2): una página hereda, no decide.
   */
  "legal-restricted": {
    indexable: false,
    measured: false,
    share: false,
    structuredData: "none",
    title: (own, brand) => `${own}${TITLE_SEPARATOR}${brand}`,
    titleLength: TITLE_LENGTH,
    descriptionLength: DESCRIPTION_LENGTH,
  },
} as const satisfies Record<string, PageTypeRules>;

export type PageType = keyof typeof PAGE_TYPES;

export function rulesOf(type: PageType): PageTypeRules {
  return PAGE_TYPES[type];
}
