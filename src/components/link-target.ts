import type { Locale } from "@/config/site";
import { isPageId, pageRoute } from "@/config/pages";
import type { LinkItem } from "@/content/schema";
import { identity } from "@/content/site";

/**
 * EL DESTINO DE UN ENLACE DEL CONTENIDO (S3c, D-BBW-94): la ruta de su página del registro (interno, `page`) o la dirección de su llave del
 * documento del sitio (externo, `link`). El esquema garantiza que lleva exactamente uno. Vive fuera de los organismos a propósito: lo usan la
 * cabecera y la página de perfil, y si la sección lo importara de la cabecera, el mapa de secciones (que importan todas las páginas) arrastraría
 * la cabecera y sus piezas cliente al grupo de cada página (medido en S3c: el fragmento compartido se partía en dos).
 */
export function hrefOf(item: LinkItem, locale: Locale): string {
  if (item.page !== undefined && isPageId(item.page)) return pageRoute(locale, item.page);
  if (item.link !== undefined) return identity.links[item.link];
  throw new Error(`[link-target] el enlace "${item.id}" no tiene destino (el esquema exige link o page)`);
}
