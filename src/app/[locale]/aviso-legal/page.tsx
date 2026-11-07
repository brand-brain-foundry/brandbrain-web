import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import type { PageId } from "@/config/pages";
import { getPage } from "@/content";
import { pageMetadataFor } from "@/seo/metadata";
import { WithStructuredData } from "@/seo/WithStructuredData";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";

/** La página que este archivo sirve, por su identificador del registro (`src/config/pages.ts`): uno que no esté registrado no compila. */
const PAGE = "aviso-legal" satisfies PageId;

/**
 * Página de aviso legal (P-BBW-80, L2). Tipo `legal-restricted`: sin indexar ni archivar, fuera del sitemap, de los datos estructurados y de las imágenes de compartir (§0.1 del despacho L2).
 * Metadatos por el constructor único (`src/seo/metadata.ts`, P-BBW-94): lo que se indexa, cómo se titula y qué lleva lo decide el TIPO
 * de la página en el registro, no este archivo. El texto sale de `content/<locale>/pages/aviso-legal.json`.
 */
export const generateMetadata = pageMetadataFor(PAGE);

export default async function AvisoLegalPage({
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
