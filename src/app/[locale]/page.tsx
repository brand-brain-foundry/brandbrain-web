import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import type { PageId } from "@/config/pages";
import { getPage } from "@/content";
import { pageMetadataFor } from "@/seo/metadata";
import { WithStructuredData } from "@/seo/WithStructuredData";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";
import styles from "./page.module.css";

/** La página que este archivo sirve, por su identificador del registro (`src/config/pages.ts`): uno que no esté registrado no compila. */
const PAGE = "home" satisfies PageId;

/**
 * METADATOS DEL DOCUMENTO (fase 7; constructor único desde S1, P-BBW-94): título, descripción, canónica, `robots`, Open Graph y tarjeta
 * salen de `src/seo/metadata.ts` a partir del registro, del tipo de la página y del `meta` de `content/<locale>/pages/home.json`.
 * Cambiar una palabra es editar ese documento; cambiar lo que se emite es editar el constructor o el tipo, nunca este archivo.
 */
export const generateMetadata = pageMetadataFor(PAGE);

/**
 * Página raíz del locale (fase 6b): recorre `page.sections` EN ORDEN y elige el renderizador por tipo (src/components/sections).
 * Añadir o reordenar una sección de un tipo existente = editar content/<locale>/pages/home.json, no este archivo. El texto NO vive aquí.
 * Los DATOS ESTRUCTURADOS los emite `<WithStructuredData>` según el tipo de la página (la portada: el grafo de la entidad), en el HTML SERVIDO (D-BBW-09).
 */
export default async function LocalePage({
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
      <main id={MAIN_ID} className={styles.main} data-component="bbf-main">
        {page.sections.map((section) => renderSection(section, where))}
      </main>
    </WithStructuredData>
  );
}
