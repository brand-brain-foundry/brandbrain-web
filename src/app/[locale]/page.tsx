import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import { getPage } from "@/content";

/**
 * Página raíz del locale. Sin diseño todavía (fase 6). El texto NO vive aquí: llega por el puerto de contenido
 * (src/content → content/<locale>/pages/home.json). Los datos de identidad (contacto) siguen viniendo de site.ts.
 */
export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, "home");
  return (
    <main>
      <h1>{page.title}</h1>
      {page.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p>
        <a href={site.contact.mailto}>{site.contact.email}</a>
      </p>
    </main>
  );
}
