import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/site";
import { pageRules, pageUrl, type PageId } from "@/config/pages";
import { identity } from "@/content/site";
import { getPage } from "@/content";
import { media } from "@/media";

/**
 * CONSTRUCTOR ÚNICO DE METADATOS (P-BBW-94, S1 §0.2.3). Toma el registro (`src/config/pages.ts`), el tipo de página (`page-types.ts`)
 * y el `meta` del documento de contenido, y devuelve TODO el bloque de metadatos de una página. Cada `page.tsx` lo llama en una línea
 * (`export const generateMetadata = pageMetadataFor("<id>")`); ninguna página escribe a mano su canónica, su `robots`, su Open Graph
 * ni su tarjeta. Antes había cuatro copias del mismo bloque, y una página oculta podía olvidar su `robots`.
 *
 * Lo que se emite y por qué (fase 7, verificado en vivo; la auditoría del 2026-11-07 lo midió servido):
 * · `title` — compuesto por la FÓRMULA del tipo a partir del título propio del documento y de la marca (fuente única, D-BBW-78).
 * · `description` — del documento; Google la usa para el fragmento (Search Central, «Control your snippets», act. 2026-04-20).
 *   `keywords` no se emite: Google declara que no tiene efecto (special-tags, act. 2025-12-10).
 * · `robots` — DERIVADO de `indexable`: una página oculta lleva `noindex, noarchive` (P-BBW-80 §0.1); una indexable no lleva nada.
 * · `alternates.canonical` — la dirección absoluta de la página desde la fuente técnica, con la barra final que emite el build.
 * · Open Graph y tarjeta de X — Google Search no los usa; son lo que leen mensajeros y redes para la previsualización del enlace. La
 *   imagen es el derivado `share` que el puerto de medios genera (D-BBW-21) y entra solo si el tipo la declara; sin `twitter`, Next
 *   deriva la tarjeta `summary` del Open Graph, que es lo que una página oculta emite.
 * · NADA declara una versión en inglés (D-BBW-15): sin `alternates.languages`, sin `hreflang`. Existirá cuando exista el copy.
 * · `og:locale` NO se emite: Open Graph lo quiere como idioma_TERRITORIO y el territorio es un hecho que la página no dice. El idioma
 *   ya va declarado en `<html lang>`.
 */
export function pageMetadata(locale: Locale, id: PageId): Metadata {
  const rules = pageRules(id);
  const { meta } = getPage(locale, id);
  const canonical = pageUrl(locale, id);
  const title = rules.title(meta.title, identity.brand);
  const description = meta.description;
  return {
    title,
    description,
    ...(rules.indexable ? {} : { robots: "noindex, noarchive" }),
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: identity.brand,
      title,
      description,
      url: canonical,
      ...(rules.share
        ? { images: [{ url: media.share.src, width: media.share.width, height: media.share.height, type: media.share.type, alt: identity.brand }] }
        : {}),
    },
    ...(rules.share ? { twitter: { card: "summary_large_image", title, description, images: [media.share.src] } } : {}),
  };
}

/** El `generateMetadata` de una página del locale, en una línea: resuelve el locale, falla cerrado si no está publicado y construye. */
export function pageMetadataFor(id: PageId) {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    if (!isLocale(locale)) notFound();
    return pageMetadata(locale, id);
  };
}
