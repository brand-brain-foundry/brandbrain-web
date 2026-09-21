/**
 * SUSTITUCIONES EN EL CONTENIDO (D-BBW-23, fase 6c; docs/system/CONTENT_MODEL.md §2 regla 8).
 *
 * Un texto del contenido puede escribir `{{brand}}`, `{{domain}}` o `{{year}}` y el puerto lo resuelve AL COMPILAR desde la fuente única
 * (src/config/site.ts) — así el contenido nunca repite un dato de identidad (criterio transversal 1) y cambiarlo sigue siendo tocar un
 * solo archivo. El conjunto es PEQUEÑO, CERRADO y DECLARADO aquí: añadir una sustitución = añadir una llave a `substitutions` (y su
 * origen en `site.ts` si es identidad). Una sustitución no declarada ROMPE la compilación (puerto) y la guardia (check-content R5).
 *
 * SIN LÓGICA (D-BBW-23): la forma admitida es exactamente `{{identificador}}`. Nada más entre llaves: ni condiciones, ni bucles, ni
 * argumentos, ni expresiones. En cuanto el texto admite lógica deja de ser texto y vuelve a necesitar un programador para cambiarlo.
 * Cualquier `{{ … }}` que no sea un identificador declarado es error, con la ruta exacta.
 *
 * D-DOC-06: las sustituciones se resuelven por búsqueda en una tabla; el contenido jamás se evalúa ni se interpreta.
 */
import { site } from "../config/site";

/** El registro: llave → valor. Solo texto plano. */
export const substitutions = {
  /**
   * el NOMBRE DEL SITIO (identidad, `site.name`). Desde D-BBW-58 ese nombre es el de la persona cuya práctica profesional ES el sitio
   * (`Christian Zavala Cubas`): la llave sigue llamándose `brand` porque lo que nombra es «la marca del sitio», y la marca del sitio pasó a
   * ser él. Un texto que quiera nombrar al sujeto escribe `{{brand}}` y NUNCA la cadena: así la consistencia de entidad (biblia v2 §12) se
   * cumple por construcción y no por revisión.
   */
  brand: site.name,
  /** dominio canónico (identidad, `site.domain`) */
  domain: site.domain,
  /** el cargo (identidad, `site.role`; biblia v2 §2 lo declara capa de la arquitectura de nombres, D-BBW-61) */
  role: site.role,
  /** año de la compilación (el sitio se regenera en cada build; p. ej. para la línea legal) */
  year: String(new Date().getFullYear()),
} as const;
export type SubstitutionKey = keyof typeof substitutions;

/** Cualquier cosa entre dobles llaves: lo que se examina. */
const ANY_BRACES_RE = /\{\{([\s\S]*?)\}\}/g;
/** La única forma válida: un identificador declarado, con espacios opcionales alrededor. */
const IDENT_RE = /^\s*([A-Za-z][A-Za-z0-9]*)\s*$/;

export function isSubstitutionKey(v: string): v is SubstitutionKey {
  return Object.prototype.hasOwnProperty.call(substitutions, v);
}

export type UndeclaredSubstitution = { path: string; token: string };

/** Llaves estructurales: identifican o enlazan, no son texto; no se sustituye dentro de ellas. */
const STRUCTURAL_KEYS = new Set(["id", "type", "link"]);

/** Recorre los textos de un documento y lista cada `{{…}}` que no sea una sustitución declarada (con su ruta). */
export function findUndeclaredSubstitutions(doc: unknown, path = "$", acc: UndeclaredSubstitution[] = []): UndeclaredSubstitution[] {
  if (typeof doc === "string") {
    for (const m of doc.matchAll(ANY_BRACES_RE)) {
      const ident = IDENT_RE.exec(m[1]);
      if (!ident || !isSubstitutionKey(ident[1])) acc.push({ path, token: m[0] });
    }
  } else if (Array.isArray(doc)) {
    doc.forEach((x, i) => findUndeclaredSubstitutions(x, `${path}[${i}]`, acc));
  } else if (doc && typeof doc === "object") {
    for (const [k, v] of Object.entries(doc as Record<string, unknown>)) {
      if (!STRUCTURAL_KEYS.has(k)) findUndeclaredSubstitutions(v, `${path}.${k}`, acc);
    }
  }
  return acc;
}

/** Resuelve las sustituciones de un texto ya validado. Lanza si encuentra una no declarada (defensa en profundidad: el puerto valida antes). */
export function resolveText(text: string, path: string): string {
  return text.replace(ANY_BRACES_RE, (whole, inner: string) => {
    const ident = IDENT_RE.exec(inner);
    if (!ident || !isSubstitutionKey(ident[1])) {
      throw new Error(`${path}: sustitución no declarada "${whole}" (declaradas: ${Object.keys(substitutions).join(", ")}; sin lógica, D-BBW-23)`);
    }
    return substitutions[ident[1]];
  });
}

/** Devuelve una copia del documento con las sustituciones resueltas en todos sus textos (las llaves estructurales, intactas). */
export function resolveDocument<T>(doc: T, path = "$"): T {
  if (typeof doc === "string") return resolveText(doc, path) as T;
  if (Array.isArray(doc)) return doc.map((x, i) => resolveDocument(x, `${path}[${i}]`)) as T;
  if (doc && typeof doc === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc as Record<string, unknown>)) out[k] = STRUCTURAL_KEYS.has(k) ? v : resolveDocument(v, `${path}.${k}`);
    return out as T;
  }
  return doc;
}
