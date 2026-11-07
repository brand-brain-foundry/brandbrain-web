import type { ComponentType } from "react";
import type { Locale } from "@/config/site";
import type { Section, SectionType } from "@/content/schema";
import { HeroSection } from "./HeroSection";
import { LegalSection } from "./LegalSection";
import { ProfileSection } from "./ProfileSection";

/**
 * D-BBW-60 — el reparto de lo GLOBAL a las secciones SE RETIRA. Existía para una sola llave, la firma (D-BBW-49), que el héroe y el pie
 * consumían de la misma fuente; PR#26 dejó al héroe sin pintarla y la enmienda de identidad retira la llave entera. Una sección vuelve a
 * ser una función de SUS datos, sin nada global de por medio (I-6: nada sin consumidor). El día que una sección necesite un dato global,
 * el parámetro vuelve — con su consumidor delante, no antes.
 */
/** S3c: la sección recibe también el locale (los destinos internos se resuelven con `pageRoute`); la que no lo necesita lo ignora. */
type RendererFor<T extends SectionType> = ComponentType<{ section: Extract<Section, { type: T }>; locale: Locale }>;

/**
 * MAPA tipo de sección → renderizador (fase 6b). Tipado sobre `SectionType`: añadir un tipo a la unión `Section` de schema.ts sin
 * añadir aquí su renderizador rompe el typecheck nombrando este mapa. Añadir un tipo de sección = su forma en schema.ts + su componente
 * en sections/ + su entrada aquí. Nada más (docs/system/CONTENT_MODEL.md §4).
 */
export const SECTION_RENDERERS: { [T in SectionType]: RendererFor<T> } = {
  hero: HeroSection,
  legal: LegalSection,
  profile: ProfileSection,
};

/**
 * Elige el renderizador por el tipo declarado en el contenido. Un tipo sin renderizador NUNCA se omite en silencio: el validador del
 * puerto ya lo rechaza en build (primera barrera); si esquema y mapa se desalinearan, este error rompe `next build` nombrando página,
 * id y tipo (segunda barrera). Coherente con el puerto de contenido: falla cerrado (D-BBW-09).
 */
export function renderSection(section: Section, where: string, locale: Locale) {
  const Renderer = SECTION_RENDERERS[section.type] as ComponentType<{ section: Section; locale: Locale }> | undefined;
  if (!Renderer) {
    throw new Error(`[sections] ${where}: la sección "${section.id}" es de tipo "${section.type}" y no tiene renderizador en SECTION_RENDERERS`);
  }
  return <Renderer key={section.id} section={section} locale={locale} />;
}
