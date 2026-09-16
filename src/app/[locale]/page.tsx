import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import { getPage, requireSection } from "@/content";

/**
 * Página raíz del locale. SIN DISEÑO NI COMPONENTES todavía (fase 6b los construye). El texto NO vive aquí: llega por el puerto
 * de contenido (src/content → content/<locale>/pages/home.json, secciones como lista tipada). Esta página consume solo la
 * sección `hero` en HTML plano para que el pipeline (contenido → build → HTML completo, criterio 4b) siga demostrado; la
 * fase 6b la sustituye por los renderizadores de sección que recorren `page.sections` en orden. Los datos de identidad
 * (contacto) siguen viniendo de site.ts.
 */
export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, "home");
  const hero = requireSection(page, "hero", `pages/home (${locale})`);
  return (
    <main>
      <h1>{hero.display}</h1>
      <p>{hero.lead}</p>
      <p>{hero.claimPrimary}</p>
      <p>{hero.claimSecondary}</p>
      <p>
        <a href={site.contact.mailto}>{site.contact.email}</a>
      </p>
    </main>
  );
}
