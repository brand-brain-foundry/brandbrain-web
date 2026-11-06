import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import { legalPageRoute } from "@/config/pages";
import { identity } from "@/content/site";
import { getPage } from "@/content";
import { media } from "@/media";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";

/**
 * Página de cookies (P-BBW-80, L2). Indexable.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { meta } = getPage(locale, "cookies");
  const canonical = `${site.url}${legalPageRoute(locale, "cookies")}`;
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

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, "cookies");
  const where = `pages/cookies (${locale})`;
  return (
    <main id={MAIN_ID} data-component="bbf-main">
      {page.sections.map((section) => renderSection(section, where))}
    </main>
  );
}
