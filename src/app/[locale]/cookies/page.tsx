import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import type { PageId } from "@/config/pages";
import { getPage } from "@/content";
import { pageMetadataFor } from "@/seo/metadata";
import { WithStructuredData } from "@/seo/WithStructuredData";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";

/** La página que este archivo sirve, por su identificador del registro (`src/config/pages.ts`): uno que no esté registrado no compila. */
const PAGE = "cookies" satisfies PageId;

/**
 * Página de cookies (P-BBW-80, L2). Tipo `legal`: indexable.
 * Metadatos por el constructor único (`src/seo/metadata.ts`, P-BBW-94): lo que se indexa, cómo se titula y qué lleva lo decide el TIPO
 * de la página en el registro, no este archivo. El texto sale de `content/<locale>/pages/cookies.json`.
 */
export const generateMetadata = pageMetadataFor(PAGE);

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, PAGE);
  const where = `pages/${PAGE} (${locale})`;
  return (
    <WithStructuredData locale={locale} id={PAGE} page={page}>
      <main id={MAIN_ID} data-component="bbf-main">
        {page.sections.map((section) => renderSection(section, where))}
      </main>
    </WithStructuredData>
  );
}
