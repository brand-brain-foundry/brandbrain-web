import type { ComponentType } from "react";
import type { Section, SectionType } from "@/content/schema";
import { HeroSection } from "./HeroSection";

/**
 * Lo GLOBAL que una sección puede necesitar. Hoy una sola llave: la FIRMA (D-BBW-49), que el héroe y el pie consumen de la misma
 * fuente porque la biblia v2 §12 exige consistencia de entidad. Se pasa como props y no se lee dentro del componente para que la
 * sección siga siendo una función de sus datos y el puerto de contenido siga siendo el único lector de archivos.
 */
export type SectionGlobals = { signature: string };

type RendererFor<T extends SectionType> = ComponentType<{ section: Extract<Section, { type: T }> } & SectionGlobals>;

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
export function renderSection(section: Section, globals: SectionGlobals, where: string) {
  const Renderer = SECTION_RENDERERS[section.type] as ComponentType<{ section: Section } & SectionGlobals> | undefined;
  if (!Renderer) {
    throw new Error(`[sections] ${where}: la sección "${section.id}" es de tipo "${section.type}" y no tiene renderizador en SECTION_RENDERERS`);
  }
  return <Renderer key={section.id} section={section} {...globals} />;
}
