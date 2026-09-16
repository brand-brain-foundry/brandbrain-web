import { site, isLocale } from "@/config/site";
import { notFound } from "next/navigation";

// Placeholder de bootstrap: sin diseño, sin copy real. Solo dice de qué repo se trata.
export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text =
    locale === "es"
      ? `${site.repo}: repositorio de la web oficial de ${site.name}. Esqueleto de bootstrap, sin contenido todavía.`
      : `${site.repo}: repository of the official ${site.name} website. Bootstrap skeleton, no content yet.`;
  return (
    <main>
      <h1>{site.repo}</h1>
      <p>{text}</p>
      <p>
        <a href={site.contact.mailto}>{site.contact.email}</a>
      </p>
    </main>
  );
}
