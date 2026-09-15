import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { site, isLocale } from "@/config/site";
import "../globals.css";

// D-BBW-03/07: todos los locales se pre-renderizan en build. Sin params dinámicos.
export const dynamicParams = false;

export function generateStaticParams() {
  return site.locales.map((locale) => ({ locale }));
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
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
