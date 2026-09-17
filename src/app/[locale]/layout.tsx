import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import { getGlobal } from "@/content";
import { textFont } from "@/styles/fonts/text";
import { displayFont } from "@/styles/fonts/display";
import { SkipLink } from "@/components/atoms/SkipLink";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { MAIN_ID } from "@/components/main-id";
import "../globals.css";

// D-BBW-03/07: los locales se pre-renderizan en build. Sin params dinámicos.
// D-BBW-15: solo se emiten los locales PUBLICADOS (hoy: es). La estructura [locale] se conserva para que EN sea aditivo.
export const dynamicParams = false;

export function generateStaticParams() {
  return site.publishedLocales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.name,
  description: `${site.name} — ${site.repo}`,
};

/**
 * Layout del locale (fase 6b): cromo persistente (Eje B, organisms) desde lo global del contenido (`getGlobal`, falla cerrado en build) +
 * enlace de salto al contenido como primer elemento enfocable. La página pone el `<main>`.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const global = getGlobal(locale);
  return (
    <html lang={locale} className={textFont.variable}>
      <head>
        {/* Puerto de tipografía display (D-BBW-14, docs/system/PORTS.md): hoja de estilos del kit, servida por Adobe.
            HTML completo sin ella (D-BBW-09): el respaldo es la familia de texto auto-hospedada. */}
        {displayFont.hosts.map((host) => (
          <link key={host} rel="preconnect" href={host} crossOrigin="anonymous" />
        ))}
        <link rel="stylesheet" href={displayFont.stylesheet} />
      </head>
      <body>
        <SkipLink href={`#${MAIN_ID}`} label={global.nav.skipLabel} />
        <Header locale={locale} global={global} />
        {children}
        <Footer global={global} />
      </body>
    </html>
  );
}
