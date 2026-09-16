/**
 * Modelo de contenido — TIPOS (docs/system/CONTENT_MODEL.md). Solo lo que hoy tiene consumidor: la colección `pages`.
 * Las colecciones previstas por la dimensión (global, cases, articles) se DOCUMENTAN en CONTENT_MODEL.md y nacen con su
 * primer consumidor, no antes. Aquí no vive ningún texto: los textos viven en content/<locale>/…
 */
export const collections = {
  pages: "pages",
} as const;

export type Collection = (typeof collections)[keyof typeof collections];

/** Documento de la colección `pages`: una página de la web. Texto plano, sin HTML. */
export type PageDocument = {
  /** Título visible de la página: es su `<h1>` (criterio transversal 4b: aparece literal en el HTML exportado). */
  title: string;
  /** Párrafos de entrada, uno por elemento. */
  intro: string[];
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === "string");
}

export function isPageDocument(v: unknown): v is PageDocument {
  if (typeof v !== "object" || v === null) return false;
  const d = v as Record<string, unknown>;
  return typeof d.title === "string" && d.title.trim().length > 0 && isStringArray(d.intro);
}
