import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import type { PageId } from "@/config/pages";
import { getPage } from "@/content";
import { pageMetadataFor } from "@/seo/metadata";
import { WithStructuredData } from "@/seo/WithStructuredData";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";

/** La página que este archivo sirve, por su identificador del registro (`src/config/pages.ts`): uno que no esté registrado no compila. */
const PAGE = "privacidad" satisfies PageId;

/**
 * Página de privacidad (P-BBW-73). Tipo `legal`: columna de lectura legal, indexable, sin datos estructurados propios (no es la entidad principal del sitio).
 * Metadatos por el constructor único (`src/seo/metadata.ts`, P-BBW-94): lo que se indexa, cómo se titula y qué lleva lo decide el TIPO
 * de la página en el registro, no este archivo. El texto sale de `content/<locale>/pages/privacidad.json`.
 */
export const generateMetadata = pageMetadataFor(PAGE);

export default async function PrivacidadPage({
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
        {page.sections.map((section) => renderSection(section, where, locale))}
      </main>
    </WithStructuredData>
  );
}
