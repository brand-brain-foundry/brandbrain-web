import type { ComponentType } from "react";
import type { Section, SectionType } from "@/content/schema";
import { HeroSection } from "./HeroSection";

type RendererFor<T extends SectionType> = ComponentType<{ section: Extract<Section, { type: T }> }>;

/**
 * MAPA tipo de sección → renderizador (fase 6b). Tipado sobre `SectionType`: añadir un tipo a la unión `Section` de schema.ts sin
 * añadir aquí su renderizador rompe el typecheck nombrando este mapa. Añadir un tipo de sección = su forma en schema.ts + su componente
 * en sections/ + su entrada aquí. Nada más (docs/system/CONTENT_MODEL.md §4).
 */
export const SECTION_RENDERERS: { [T in SectionType]: RendererFor<T> } = {
  hero: HeroSection,
};

/**
 * Elige el renderizador por el tipo declarado en el contenido. Un tipo sin renderizador NUNCA se omite en silencio: el validador del
 * puerto ya lo rechaza en build (primera barrera); si esquema y mapa se desalinearan, este error rompe `next build` nombrando página,
 * id y tipo (segunda barrera). Coherente con el puerto de contenido: falla cerrado (D-BBW-09).
 */
export function renderSection(section: Section, where: string) {
  const Renderer = SECTION_RENDERERS[section.type] as ComponentType<{ section: Section }> | undefined;
  if (!Renderer) {
    throw new Error(`[sections] ${where}: la sección "${section.id}" es de tipo "${section.type}" y no tiene renderizador en SECTION_RENDERERS`);
  }
  return <Renderer key={section.id} section={section} />;
}
