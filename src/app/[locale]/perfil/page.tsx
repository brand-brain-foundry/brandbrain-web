import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import { pageBackdrop, type PageId } from "@/config/pages";
import { getPage } from "@/content";
import { pageMetadataFor } from "@/seo/metadata";
import { WithStructuredData } from "@/seo/WithStructuredData";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";

/** La página que este archivo sirve, por su identificador del registro (`src/config/pages.ts`): uno que no esté registrado no compila. */
const PAGE = "perfil" satisfies PageId;

/**
 * LA PÁGINA DE PERFIL (S3c, D-BBW-90; ruta `/es/perfil/` desde P1, D-BBW-107). Tipo `profile`: indexable, en el mapa del sitio, y la ÚNICA que declara el `Person` completo
 * (`ProfilePage`, `src/seo/jsonld.ts`). Metadatos por el constructor único; el texto sale de `content/<locale>/pages/perfil.json`, que cita
 * la entidad de `content/site.json`.
 */
export const generateMetadata = pageMetadataFor(PAGE);

export default async function PerfilPage({
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
      {/* R1 (D-BBW-96): la variante de color del fondo sale del registro; la hereda el fondo de cualquier sección de la página */}
      <main id={MAIN_ID} data-component="bbf-main" data-backdrop={pageBackdrop(PAGE)}>
        {page.sections.map((section) => renderSection(section, where, locale))}
      </main>
    </WithStructuredData>
  );
}
