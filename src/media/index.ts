/**
 * PUERTO DE MEDIOS — lo que consumen los componentes (D-BBW-21, docs/system/MEDIA.md). Adaptador actual: los derivados se sirven
 * desde el propio sitio (`public/`, rutas absolutas). La alternativa prevista (almacenamiento externo) cambiaría el prefijo de `src`
 * aquí, no los componentes. `generated.ts` lo escribe `scripts/media/build.ts`; no se edita a mano (guardia check-media).
 */
export { media, surfaceColor, inlineIcons, rigs } from "./generated";
export { mediaSets } from "./generated";
// los conjuntos llegan GENERADOS (no del registro): este índice lo importan componentes cliente y el registro no debe viajar al navegador
import { inlineIcons as icons, media as derived, mediaSets as sets, fieldBatches as batches } from "./generated";

/** Los identificadores que la entidad puede referenciar: los derivados y los conjuntos de recortes (S3c). */
export const MEDIA_IDENTIFIERS: readonly string[] = [...Object.keys(derived), ...Object.keys(sets)];

/** Los derivados que nombra un identificador: el conjunto en su orden, o el derivado solo. `[]` si no existe. */
export function mediaMembers(id: string): { src: string; width?: number; height?: number }[] {
  if (Object.prototype.hasOwnProperty.call(sets, id)) return sets[id as keyof typeof sets].map((m) => derived[m]);
  if (Object.prototype.hasOwnProperty.call(derived, id)) return [derived[id as keyof typeof derived]];
  return [];
}

export type InlineIconName = keyof typeof icons;

/** Un medio de un lote del campo (S12): cuadrado de `side` px, ya recortado por su punto focal; imagen o vídeo sin audio. */
export type FieldMediaItem = { readonly id: string; readonly kind: "image" | "video"; readonly src: string; readonly type: string; readonly side: number };
/** Los usos que tienen lote declarado (`fieldBatches` del registro): lo que un documento de contenido puede citar en `fieldMedia`. */
export const FIELD_BATCH_IDS: readonly string[] = Object.keys(batches);
/** Los medios del lote de un uso, en orden de nombre; `[]` si el lote está vacío o el uso no existe (lote vacío = el campo de hoy). */
export function fieldBatch(id: string): readonly FieldMediaItem[] {
  return Object.prototype.hasOwnProperty.call(batches, id) ? (batches[id as keyof typeof batches] as readonly FieldMediaItem[]) : [];
}

/** Icono de perfil para un `id` del contenido (`footer.social[].id`): si existe un icono de perfil con ese nombre, se usa; si no, el enlace es texto. */
export function iconFor(id: string): InlineIconName | undefined {
  if (!Object.prototype.hasOwnProperty.call(icons, id)) return undefined;
  const name = id as InlineIconName;
  return icons[name].use === "profile" ? name : undefined;
}
