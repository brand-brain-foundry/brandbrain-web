import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, site } from "@/config/site";
import { getPage } from "@/content";
import { media } from "@/media";
import { homeGraph, homeUrl } from "@/seo/jsonld";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";
import styles from "./page.module.css";

/**
 * METADATOS DEL DOCUMENTO (fase 7). Título y descripción vienen del CONTENIDO (`meta.title` / `meta.description` de
 * `content/<locale>/pages/home.json`, con sus sustituciones ya resueltas por el puerto): cambiar una palabra es editar ese archivo, no este.
 * Todo lo demás se DERIVA de la fuente única (`src/config/site.ts`) y del puerto de medios: ningún dominio ni nombre literal aquí.
 *
 * Lo que se emite y por qué (industria verificada en vivo, no de memoria):
 * · `description` — Google la usa para el fragmento del resultado (developers.google.com/search/docs/crawling-indexing/special-tags,
 *   actualizada 2025-12-10). Esa misma página declara `keywords` SIN efecto ninguno en indexación ni posición, así que no se emite.
 * · `alternates.canonical` — la portada del locale, con barra final, que es la forma que emite el build (`trailingSlash: true`).
 * · Metadatos para compartir (Open Graph y tarjeta de X) — Google Search NO los usa (no figuran en su página de etiquetas admitidas), pero
 *   son lo que leen los mensajeros y las redes para la previsualización del enlace, que es su efecto demostrado. Imagen: el derivado
 *   `share-1200x630.png` que el puerto de medios YA genera (D-BBW-21).
 * · NADA declara una versión en inglés (D-BBW-15): sin `alternates.languages`, sin `hreflang`. Existirá cuando exista el copy.
 * · `og:locale` NO se emite: Open Graph lo quiere como idioma_TERRITORIO y el territorio es un hecho que la página no dice. El idioma ya va
 *   declarado en `<html lang>`.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { meta } = getPage(locale, "home");
  const canonical = homeUrl(locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: [{ url: media.share.src, width: media.share.width, height: media.share.height, type: media.share.type, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [media.share.src],
    },
  };
}

/**
 * Página raíz del locale (fase 6b): recorre `page.sections` EN ORDEN y elige el renderizador por tipo (src/components/sections).
 * Añadir o reordenar una sección de un tipo existente = editar content/<locale>/pages/home.json, no este archivo. El texto NO vive aquí.
 * Fase 7: además emite los DATOS ESTRUCTURADOS de la portada (`src/seo/jsonld.ts`), derivados de la fuente única y del mismo documento.
 * Van en el HTML SERVIDO (D-BBW-09): un rastreador que no ejecuta JavaScript los lee tal cual.
 */
export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, "home");
  const where = `pages/home (${locale})`;
  return (
    <>
      <script
        type="application/ld+json"
        // JSON serializado desde un objeto construido en build; no hay entrada de usuario. `<` se escapa para que ningún valor pueda
        // cerrar la etiqueta (defensa en profundidad: hoy todos los valores salen de la fuente única y del contenido ya validado).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeGraph(locale, page.meta.description)).replace(/</g, "\\u003c") }}
      />
      <main id={MAIN_ID} className={styles.main} data-component="bbf-main">
        {page.sections.map((section) => renderSection(section, where))}
      </main>
    </>
  );
}
