/**
 * REGISTRO GENERAL DE PÁGINAS — fuente única de las páginas del sitio y de sus rutas (P-BBW-80, L2 §0.3.1; generalizado por P-BBW-94, S1 §0.2.1).
 *
 * Una entrada por página: `id` (= el nombre de su documento en `content/<locale>/pages/<id>.json`), `slug` (segmento de ruta; vacío
 * para la portada), `type` (el tipo de página del que HEREDA sus reglas, `./page-types.ts`) y, si aparece en el grupo legal del pie,
 * su orden. En términos de un gestor de contenido: este registro es la COLECCIÓN de páginas; `type` elige la plantilla.
 *
 * Las rutas son TÉCNICAS (una URL es una dirección de despliegue, no copy), por eso viven en código y no en `content/`. De aquí
 * derivan el mapa del sitio, el `robots.txt`, el pie, la exclusión de la medición, los metadatos y los datos estructurados de cada
 * página. Ningún componente ni página escribe una ruta: la pide por `pageRoute(locale, id)`. Ningún archivo de contenido escribe un slug.
 * Las ETIQUETAS visibles de las páginas legales viven en `content/<locale>/global.json` bajo `legal.pages.<id>.label`.
 *
 * Sustituye a `LEGAL_PAGES` (S1, I-6): el registro anterior solo conocía páginas legales (`LegalPage`, `legalNavOrder`), así que
 * `/metodo` o `/casos` no tenían sitio en él; y sus banderas (`indexed`, `inSitemap`, `measured`) eran por página y no gobernaban el
 * `<meta robots>`. Ahora todo eso lo declara el tipo, una vez.
 *
 * AÑADIR UNA PÁGINA = una fila aquí + su documento en `content/` + un `page.tsx` de dos líneas (`src/seo/metadata.ts`) + su redirección
 * sin prefijo en `public/_redirects` (R6). Una fila sin documento rompe el build; un `page.tsx` sin fila rompe el typecheck (`PageId`)
 * y la guardia R7 sobre `out/` (`scripts/lint/check-seo.ts`).
 */
import { site, type Locale } from "./site";
import { PAGE_TYPES, type PageType, type PageTypeRules } from "./page-types";

export type PageEntry = {
  /** identificador de la página = nombre de su documento de contenido; para las legales coincide con el slug */
  readonly id: string;
  /** segmento de ruta sin barras ni locale; VACÍO para la portada del locale */
  readonly slug: string;
  /** tipo de página del que hereda sus reglas */
  readonly type: PageType;
  /** orden en el grupo legal del pie (menor primero); ausente = no aparece en el pie */
  readonly footerOrder?: number;
  /**
   * EXCEPCIÓN AL RANGO DEL `<title>` de su tipo (S3, C-7 → D-BBW-87): una longitud EXACTA admitida fuera del rango, con su razón y la
   * decisión que la firma. Es la forma que D-BBW-16 fija para cualquier excepción (valor + razón + registro) llevada al sistema de
   * posicionamiento: el rango sigue siendo del TIPO (`page-types.ts`, `SEO.md` §4) y la excepción es de UNA página y de UN valor. Si el
   * título cambia de longitud, deja de coincidir y R7c vuelve a romper: una excepción no es un rango más ancho. R7c la LEE de aquí
   * (`pageTitleException`); la guardia no escribe ningún número.
   */
  readonly titleLengthException?: { readonly length: number; readonly reason: string; readonly decision: string };
};

/** Las páginas del sitio. El orden de este array es el orden del mapa del sitio. */
export const PAGES = [
  {
    id: "home",
    slug: "",
    type: "home",
    // la marca + la categoría EXACTA de D-BBW-81 (que no se acorta) suman 61 caracteres; el valor no se escribe aquí: sale del contenido
    titleLengthException: { length: 61, reason: "el título propio de la portada es la repetición exacta de la categoría (D-BBW-81)", decision: "D-BBW-87" },
  },
  { id: "aviso-legal", slug: "aviso-legal", type: "legal-restricted", footerOrder: 0 },
  { id: "privacidad",  slug: "privacidad",  type: "legal",            footerOrder: 1 },
  { id: "cookies",     slug: "cookies",     type: "legal",            footerOrder: 2 },
] as const satisfies readonly PageEntry[];

/** Una fila del registro, con su `id` como literal. */
export type RegisteredPage = (typeof PAGES)[number];

/** Los identificadores registrados: un `page.tsx` que pida otro no compila. */
export type PageId = RegisteredPage["id"];

const PAGE_IDS: readonly string[] = PAGES.map((p) => p.id);

/** Si una cadena (p. ej. un slug citado desde el contenido) es el identificador de una página registrada. */
export function isPageId(value: string): value is PageId {
  return PAGE_IDS.includes(value);
}

export function pageEntry(id: PageId): RegisteredPage {
  const entry = PAGES.find((p) => p.id === id);
  if (!entry) throw new Error(`[pages] la página "${id}" no está en el registro (src/config/pages.ts)`);
  return entry;
}

/** Las reglas que la página hereda de su tipo. */
export function pageRules(id: PageId): PageTypeRules {
  return PAGE_TYPES[pageEntry(id).type];
}

/** La excepción registrada al rango del `<title>` de una página, si la tiene (S3, D-BBW-87). R7c la lee; nadie más la necesita. */
export function pageTitleException(id: PageId): PageEntry["titleLengthException"] {
  const entry: PageEntry = pageEntry(id);
  return entry.titleLengthException;
}

/** Ruta canónica de una página para un locale, con la barra final que emite el build: `/es/` · `/es/privacidad/`. */
export function pageRoute(locale: Locale, id: PageId): string {
  const { slug } = pageEntry(id);
  return slug ? `/${locale}/${slug}/` : `/${locale}/`;
}

/** Dirección canónica absoluta de una página: el dominio de la fuente técnica (`site.url`) + la ruta. */
export function pageUrl(locale: Locale, id: PageId): string {
  return `${site.url}${pageRoute(locale, id)}`;
}

/** Las páginas cuyo tipo cumple la condición, en el orden del registro. */
export function pagesWhere(predicate: (rules: PageTypeRules) => boolean): readonly RegisteredPage[] {
  return PAGES.filter((p) => predicate(PAGE_TYPES[p.type]));
}

/** Las páginas del grupo legal del pie, en su orden. */
export const FOOTER_PAGES: readonly RegisteredPage[] = (PAGES as readonly (RegisteredPage & Pick<PageEntry, "footerOrder">)[])
  .filter((p): p is RegisteredPage & { footerOrder: number } => typeof p.footerOrder === "number")
  .sort((a, b) => a.footerOrder - b.footerOrder);
