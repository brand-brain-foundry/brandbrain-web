/**
 * SUSTITUCIONES EN EL CONTENIDO (D-BBW-23, fase 6c; docs/system/CONTENT_MODEL.md §2 regla 8).
 *
 * Un texto del contenido puede escribir `{{brand}}`, `{{domain}}` o `{{year}}` y el puerto lo resuelve AL COMPILAR desde la fuente única
 * (el documento del sitio para lo editable, `src/config/site.ts` para lo técnico) — así ningún texto repite un dato de identidad
 * (criterio transversal 1) y cambiarlo sigue siendo tocar un solo sitio. El conjunto es PEQUEÑO, CERRADO y DECLARADO aquí: añadir una sustitución = añadir una llave a `substitutions` (y su
 * origen en el documento del sitio si es identidad editable, o en `site.ts` si es técnica). Una sustitución no declarada ROMPE la compilación (puerto) y la guardia (check-content R5).
 *
 * SIN LÓGICA (D-BBW-23): la forma admitida es exactamente `{{identificador}}`. Nada más entre llaves: ni condiciones, ni bucles, ni
 * argumentos, ni expresiones. En cuanto el texto admite lógica deja de ser texto y vuelve a necesitar un programador para cambiarlo.
 * Cualquier `{{ … }}` que no sea un identificador declarado es error, con la ruta exacta.
 *
 * D-DOC-06: las sustituciones se resuelven por búsqueda en una tabla; el contenido jamás se evalúa ni se interpreta.
 */
import { site } from "../config/site";
import { CONSENT_MONTHS, CONSENT_STORAGE_KEY } from "../config/consent";
import { identity } from "./site";

/** El registro: llave → valor. Solo texto plano. */
export const substitutions = {
  /**
   * el NOMBRE DEL SITIO (identidad editable, `identity.brand`, desde `content/site.json` por D-BBW-78). Desde D-BBW-58 ese nombre es el de la persona cuya práctica profesional ES el sitio
   * (`Christian Zavala Cubas`): la llave sigue llamándose `brand` porque lo que nombra es «la marca del sitio», y la marca del sitio pasó a
   * ser él. Un texto que quiera nombrar al sujeto escribe `{{brand}}` y NUNCA la cadena: así la consistencia de entidad (biblia v2 §12) se
   * cumple por construcción y no por revisión.
   */
  brand: identity.brand,
  /** dominio canónico (TÉCNICO, `site.domain`: cambiarlo es una decisión de despliegue, no de redacción) */
  domain: site.domain,
  /** el cargo (identidad editable, `identity.role`; la biblia §4 lo declara capa de la arquitectura de nombres, D-BBW-61, bajado a datos por D-BBW-78) */
  role: identity.role,
  /** año de la compilación (el sitio se regenera en cada build; p. ej. para la línea legal) */
  year: String(new Date().getFullYear()),
  /** buzón de contacto publicado (identidad editable, `identity.email`; p. ej. para textos legales que lo mencionan) */
  email: identity.email,
  /**
   * FORMA JURÍDICA (P-BBW-80, L2 §0.3.5): «profesional autónomo» desde `content/site.json`.
   * Vive UNA vez; los textos legales la piden por `{{legalForm}}`.
   */
  legalForm: identity.legalForm,
  /**
   * CONSENTIMIENTO (P-BBW-82, L3 §0.1): el nombre de la preferencia guardada y su validez en meses, desde `src/config/consent.ts`,
   * LA MISMA constante que usa el código que guarda y juzga la elección (`src/behavior/consent.ts`). Así la página de Cookies no
   * puede decir una cosa y el navegador hacer otra (I-1). Técnicas: viven en código.
   */
  consentKey: CONSENT_STORAGE_KEY,
  consentMonths: String(CONSENT_MONTHS),
} as const;
export type SubstitutionKey = keyof typeof substitutions;

/**
 * Sustituciones RESTRINGIDAS: válidas ÚNICAMENTE en `content/es/pages/aviso-legal.json`.
 * Para cualquier otro documento son un error (la guardia y el puerto las rechazan).
 * Sus valores vienen de `src/content/legal-identity.ts` al compilar (P-BBW-78).
 */
export const RESTRICTED_SUBSTITUTION_KEYS = ['nif', 'domicilio', 'telefono'] as const;
export type RestrictedSubstitutionKey = (typeof RESTRICTED_SUBSTITUTION_KEYS)[number];

export function isRestrictedSubstitutionKey(v: string): v is RestrictedSubstitutionKey {
  return (RESTRICTED_SUBSTITUTION_KEYS as readonly string[]).includes(v);
}

/** Cualquier cosa entre dobles llaves: lo que se examina. */
const ANY_BRACES_RE = /\{\{([\s\S]*?)\}\}/g;
/** La única forma válida: un identificador declarado, con espacios opcionales alrededor. */
const IDENT_RE = /^\s*([A-Za-z][A-Za-z0-9]*)\s*$/;

export function isSubstitutionKey(v: string): v is SubstitutionKey {
  return Object.prototype.hasOwnProperty.call(substitutions, v);
}

export type UndeclaredSubstitution = { path: string; token: string };

/** Llaves estructurales: identifican, enlazan o referencian (`page`, `global`), no son texto; no se sustituye dentro de ellas. */
const STRUCTURAL_KEYS = new Set(["id", "type", "link", "case", "page", "global"]);

/**
 * Recorre los textos de un documento y lista cada `{{…}}` que no sea una sustitución declarada (con su ruta).
 * `allowedExtraKeys`: claves adicionales que se aceptan en este documento (p.ej. las restringidas en aviso-legal.json).
 */
export function findUndeclaredSubstitutions(
  doc: unknown,
  path = "$",
  acc: UndeclaredSubstitution[] = [],
  allowedExtraKeys: ReadonlyArray<string> = [],
): UndeclaredSubstitution[] {
  if (typeof doc === "string") {
    for (const m of doc.matchAll(ANY_BRACES_RE)) {
      const ident = IDENT_RE.exec(m[1]);
      if (!ident) { acc.push({ path, token: m[0] }); continue; }
      const key = ident[1];
      if (isSubstitutionKey(key) || allowedExtraKeys.includes(key)) continue;
      acc.push({ path, token: m[0] });
    }
  } else if (Array.isArray(doc)) {
    doc.forEach((x, i) => findUndeclaredSubstitutions(x, `${path}[${i}]`, acc, allowedExtraKeys));
  } else if (doc && typeof doc === "object") {
    for (const [k, v] of Object.entries(doc as Record<string, unknown>)) {
      if (!STRUCTURAL_KEYS.has(k)) findUndeclaredSubstitutions(v, `${path}.${k}`, acc, allowedExtraKeys);
    }
  }
  return acc;
}

/**
 * Resuelve las sustituciones de un texto ya validado. Lanza si encuentra una no declarada.
 * `skipKeys`: claves que se dejan sin resolver (para una segunda pasada posterior, p. ej. las restringidas).
 */
export function resolveText(text: string, path: string, skipKeys?: ReadonlySet<string>): string {
  return text.replace(ANY_BRACES_RE, (whole, inner: string) => {
    const ident = IDENT_RE.exec(inner);
    if (!ident || !isSubstitutionKey(ident[1])) {
      if (skipKeys?.has(ident?.[1] ?? "")) return whole; // deja el token para la segunda pasada
      throw new Error(`${path}: sustitución no declarada "${whole}" (declaradas: ${Object.keys(substitutions).join(", ")}; sin lógica, D-BBW-23)`);
    }
    return substitutions[ident[1]];
  });
}

/** Devuelve una copia del documento con las sustituciones resueltas en todos sus textos (las llaves estructurales, intactas). */
export function resolveDocument<T>(doc: T, path = "$", skipKeys?: ReadonlySet<string>): T {
  if (typeof doc === "string") return resolveText(doc, path, skipKeys) as T;
  if (Array.isArray(doc)) return doc.map((x, i) => resolveDocument(x, `${path}[${i}]`, skipKeys)) as T;
  if (doc && typeof doc === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc as Record<string, unknown>)) out[k] = STRUCTURAL_KEYS.has(k) ? v : resolveDocument(v, `${path}.${k}`, skipKeys);
    return out as T;
  }
  return doc;
}
