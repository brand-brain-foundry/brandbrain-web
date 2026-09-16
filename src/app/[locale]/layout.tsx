import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import { textFont } from "@/styles/fonts/text";
import { displayFont } from "@/styles/fonts/display";
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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
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
      <body>{children}</body>
    </html>
  );
}
