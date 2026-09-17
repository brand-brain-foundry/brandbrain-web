import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import { getPage } from "@/content";
import { renderSection } from "@/components/sections";
import { MAIN_ID } from "@/components/main-id";
import styles from "./page.module.css";

/**
 * Página raíz del locale (fase 6b): recorre `page.sections` EN ORDEN y elige el renderizador por tipo (src/components/sections).
 * Añadir o reordenar una sección de un tipo existente = editar content/<locale>/pages/home.json, no este archivo. El texto NO vive aquí.
 */
export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = getPage(locale, "home");
  const where = `pages/home (${locale})`;
  return (
    <main id={MAIN_ID} className={styles.main} data-component="bbf-main">
      {page.sections.map((section) => renderSection(section, where))}
    </main>
  );
}
