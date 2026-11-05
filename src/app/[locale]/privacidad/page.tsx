import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import { identity } from "@/content/site";
import { getPage } from "@/content";
import { media } from "@/media";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";

/**
 * Página de privacidad (P-BBW-73). Columna de lectura legal; sin datos estructurados propios (no es la entidad principal del sitio).
 * El texto NO vive aquí: sale de `content/<locale>/pages/privacidad.json`, con sus sustituciones resueltas por el puerto.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { meta } = getPage(locale, "privacidad");
  const canonical = `${site.url}/${locale}/privacidad/`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: identity.brand,
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: [{ url: media.share.src, width: media.share.width, height: media.share.height, type: media.share.type, alt: identity.brand }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [media.share.src],
    },
  };
}

export default async function PrivacidadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, "privacidad");
  const where = `pages/privacidad (${locale})`;
  return (
    <main id={MAIN_ID} data-component="bbf-main">
      {page.sections.map((section) => renderSection(section, where))}
    </main>
  );
}
