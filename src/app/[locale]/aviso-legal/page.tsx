import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import { legalPageRoute } from "@/config/pages";
import { identity } from "@/content/site";
import { getPage } from "@/content";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";

/**
 * Página de aviso legal (P-BBW-80, L2). Sin indexar ni archivar (§0.1 del despacho L2).
 * Fuera del sitemap, de los datos estructurados y de las imágenes de compartir.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { meta } = getPage(locale, "aviso-legal");
  const canonical = `${site.url}${legalPageRoute(locale, "aviso-legal")}`;
  return {
    title: meta.title,
    description: meta.description,
    robots: "noindex, noarchive",
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: identity.brand,
      title: meta.title,
      description: meta.description,
      url: canonical,
    },
  };
}

export default async function AvisoLegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, "aviso-legal");
  const where = `pages/aviso-legal (${locale})`;
  return (
    <main id={MAIN_ID} data-component="bbf-main">
      {page.sections.map((section) => renderSection(section, where))}
    </main>
  );
}
