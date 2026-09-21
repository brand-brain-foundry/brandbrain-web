/**
 * PUERTO DE MEDIOS — lo que consumen los componentes (D-BBW-21, docs/system/MEDIA.md). Adaptador actual: los derivados se sirven
 * desde el propio sitio (`public/`, rutas absolutas). La alternativa prevista (almacenamiento externo) cambiaría el prefijo de `src`
 * aquí, no los componentes. `generated.ts` lo escribe `scripts/media/build.ts`; no se edita a mano (guardia check-media).
 */
export { media, surfaceColor, inlineIcons } from "./generated";
import { inlineIcons as icons } from "./generated";

export type InlineIconName = keyof typeof icons;

/** Icono de perfil para un `id` del contenido (`footer.social[].id`): si existe un icono de perfil con ese nombre, se usa; si no, el enlace es texto. */
export function iconFor(id: string): InlineIconName | undefined {
  if (!Object.prototype.hasOwnProperty.call(icons, id)) return undefined;
  const name = id as InlineIconName;
  return icons[name].use === "profile" ? name : undefined;
}
