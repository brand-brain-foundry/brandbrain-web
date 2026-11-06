/**
 * PUERTO DE CONTENIDO — adaptador actual: ARCHIVOS versionados en el repo (D-BBW-02), leídos en tiempo de build.
 * Registro: docs/system/PORTS.md (fila "Contenido"). Modelo: docs/system/CONTENT_MODEL.md. Forma: ./schema.ts.
 *
 * · Los textos viven en `content/<locale>/global.json` (lo que se repite) y `content/<locale>/<colección>/<slug>.json`
 *   (un documento por entidad), FUERA de src/ y fuera de los componentes (D-BBW-09, I-2).
 * · Un componente recibe el documento por props o lo pide aquí; nunca escribe un literal (eslint react/jsx-no-literals).
 * · Solo existen los locales PUBLICADOS (D-BBW-15): pedir un locale no publicado es un error de build, no un fallback.
 * · Falta o forma inválida = el build FALLA con mensaje que nombra la llave (fail-closed): ninguna página sale con contenido
 *   vacío ni con una llave que el modelo no admite. La guardia scripts/lint/check-content.ts valida ADEMÁS el árbol completo.
 * · Alternativa prevista (PORTS.md): un gestor sobre git que escriba en estos mismos archivos. Ningún gestor instalado.
 * · SUSTITUCIONES (D-BBW-23, fase 6c): tras validar, el puerto resuelve `{{brand}}` / `{{domain}}` / `{{year}}` desde la fuente única
 *   (./substitutions.ts, conjunto cerrado y declarado). Una no declarada, o cualquier cosa entre llaves que no sea un identificador
 *   declarado (lógica), FALLA el build con la ruta exacta. La guardia check-content.ts lo comprueba además sobre el árbol completo.
 * · EL DOCUMENTO DEL SITIO (D-BBW-78, `content/site.json`: nombre, cargo, buzón y destinos de los enlaces) se valida AQUÍ, al cargar el
 *   puerto, y falla cerrado como todo lo demás: ninguna página sale con la identidad a medias. Se valida en el puerto y no en el módulo
 *   que lo lee porque a ese módulo lo importa también la guardia, y romper en su carga la dejaría sin informe que dar.
 * · D-DOC-06: el contenido es DATO de negocio. Este lector lo parsea y valida; jamás lo interpreta ni lo ejecuta.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { publishedLocales, type Locale } from "../config/site";
import {
  GLOBAL_DOCUMENT,
  collections,
  validateGlobal,
  validatePage,
  type Collection,
  type GlobalDocument,
  type PageDocument,
  type Problem,
  type Section,
  type SectionType,
} from "./schema";
import { siteDocument, validateSite } from "./site";
import { findUndeclaredSubstitutions, resolveDocument, RESTRICTED_SUBSTITUTION_KEYS } from "./substitutions";
import { getLegalIdentity } from "./legal-identity";

export const CONTENT_ROOT = join(process.cwd(), "content");

/** Las etiquetas de las páginas legales de un documento global ya validado: alimentan `resolveRefs` para `{ page }`. */
function legalPageLabels(global: GlobalDocument): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [slug, page] of Object.entries(global.legal.pages)) result[slug] = page.label;
  return result;
}

/** Lee un texto del documento global por su ruta de llaves (`consent.banner.reject`). Solo llega a cadenas; lo demás es error. */
function globalText(global: GlobalDocument, keyPath: string, where: string): string {
  let node: unknown = global;
  for (const key of keyPath.split(".")) {
    if (!node || typeof node !== "object" || Array.isArray(node) || !(key in (node as Record<string, unknown>))) {
      throw new Error(`[content] ${where}: la ruta "${keyPath}" no existe en el documento global (se corta en "${key}")`);
    }
    node = (node as Record<string, unknown>)[key];
  }
  if (typeof node !== "string") throw new Error(`[content] ${where}: la ruta "${keyPath}" del documento global no lleva a un texto`);
  return node;
}

/**
 * Resuelve las REFERENCIAS de un documento antes de entregarlo (I-1: una sola fuente para cada texto):
 *   · `{ page: slug }`  → `{ text: label, path: "/${locale}/${slug}/" }` (P-BBW-80). Un slug sin etiqueta rompe el build.
 *   · `{ global: ruta }` → la cadena del documento global en esa ruta (P-BBW-82). Una ruta sin texto rompe el build.
 * Un tramo `{ global }` se convierte en una cadena suelta dentro de la lista de tramos: el componente lo pinta como texto normal.
 */
function resolveRefs<T>(doc: T, locale: Locale, global: GlobalDocument, pageLabels: Record<string, string>, path = "$"): T {
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    const r = doc as Record<string, unknown>;
    if ('global' in r && typeof r.global === 'string' && Object.keys(r).length === 1) {
      return globalText(global, r.global, path) as unknown as T;
    }
    if ('page' in r && typeof r.page === 'string' && !('text' in r) && !('link' in r) && !('path' in r)) {
      const slug = r.page as string;
      const label = pageLabels[slug];
      if (!label) throw new Error(`[content] ${path}: referencia a página desconocida "${slug}" (¿falta en global.legal.pages?)`);
      return { text: label, path: `/${locale}/${slug}/` } as unknown as T;
    }
    const out: Record<string, unknown> = {};
    const SKIP = new Set(["id", "type", "link", "case"]);
    for (const [k, v] of Object.entries(r)) {
      out[k] = SKIP.has(k) ? v : resolveRefs(v, locale, global, pageLabels, `${path}.${k}`);
    }
    return out as T;
  }
  if (Array.isArray(doc)) {
    return doc.map((x, i) => resolveRefs(x, locale, global, pageLabels, `${path}[${i}]`)) as unknown as T;
  }
  return doc;
}

/** Genera `updatedLabel` en las secciones legales combinando la etiqueta del global con la fecha formateada. */
function addUpdatedLabels<T>(doc: T, updatedLabel: string, locale: Locale): T {
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    const r = doc as Record<string, unknown>;
    if (r.type === 'legal' && typeof r.updated === 'string') {
      const date = new Date(r.updated);
      const formatted = date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
      return { ...r, updatedLabel: `${updatedLabel}: ${formatted}` } as unknown as T;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      out[k] = addUpdatedLabels(v, updatedLabel, locale);
    }
    return out as T;
  }
  if (Array.isArray(doc)) {
    return doc.map((x) => addUpdatedLabels(x, updatedLabel, locale)) as unknown as T;
  }
  return doc;
}

function assertPublished(locale: Locale): void {
  if (!(publishedLocales as readonly string[]).includes(locale)) {
    throw new Error(`[content] locale "${locale}" no está publicado (D-BBW-15): no existe content/${locale}/`);
  }
}

function readJson(relPath: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(join(CONTENT_ROOT, relPath), "utf8");
  } catch {
    throw new Error(`[content] falta el documento content/${relPath}`);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    throw new Error(`[content] JSON inválido en content/${relPath}: ${(e as Error).message}`);
  }
}

function failOn(problems: Problem[], relPath: string): void {
  if (problems.length === 0) return;
  const lines = problems.map((p) => `  ${p.path}: ${p.message}`).join("\n");
  throw new Error(`[content] content/${relPath} no cumple el modelo (${problems.length} problema(s)):\n${lines}`);
}

// FAIL-CLOSED del documento del sitio, al cargar el puerto: es la identidad, y la usan todas las páginas.
failOn(validateSite(siteDocument), "site.json");

/** Sustituciones: primero se rechaza cualquier `{{…}}` no declarado (con ruta), después se resuelve el documento entero. */
function substitute<T>(doc: T, relPath: string): T {
  const undeclared = findUndeclaredSubstitutions(doc);
  if (undeclared.length > 0) {
    const lines = undeclared.map((u) => `  ${u.path}: sustitución no declarada "${u.token}"`).join("\n");
    throw new Error(`[content] content/${relPath}: ${undeclared.length} sustitución(es) no declarada(s) (D-BBW-23: conjunto cerrado, sin lógica):\n${lines}`);
  }
  return resolveDocument(doc);
}

/** Resuelve `{{nif}}`, `{{domicilio}}` y `{{telefono}}` en el documento del aviso legal. Segunda pasada tras la global. */
function resolveLegalDoc<T>(doc: T, extras: Record<string, string>, path = "$"): T {
  if (typeof doc === "string") {
    return doc.replace(/\{\{\s*(nif|domicilio|telefono)\s*\}\}/g, (_, k: string) => extras[k] ?? '') as T;
  }
  if (Array.isArray(doc)) return doc.map((x, i) => resolveLegalDoc(x, extras, `${path}[${i}]`)) as T;
  if (doc && typeof doc === "object") {
    const SKIP = new Set(["id", "type", "link", "case"]);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc as Record<string, unknown>)) {
      out[k] = SKIP.has(k) ? v : resolveLegalDoc(v, extras, `${path}.${k}`);
    }
    return out as T;
  }
  return doc;
}

/** Variante de `substitute` para aviso-legal.json: acepta {{nif}}/{{domicilio}}/{{telefono}} y los resuelve. */
function substituteLegal<T>(doc: T, relPath: string): T {
  const undeclared = findUndeclaredSubstitutions(doc, "$", [], RESTRICTED_SUBSTITUTION_KEYS);
  if (undeclared.length > 0) {
    const lines = undeclared.map((u) => `  ${u.path}: sustitución no declarada "${u.token}"`).join("\n");
    throw new Error(`[content] content/${relPath}: ${undeclared.length} sustitución(es) no declarada(s) (D-BBW-23: conjunto cerrado, sin lógica):\n${lines}`);
  }
  const withGlobal = resolveDocument(doc, "$", new Set<string>(RESTRICTED_SUBSTITUTION_KEYS));
  const legal = getLegalIdentity();
  return resolveLegalDoc(withGlobal, legal);
}

/**
 * Documento global (navegación, pie, consentimiento) de un locale publicado. Sus propias referencias `{ page }` (el banner del
 * consentimiento cita la página de Cookies) se resuelven contra sus propias etiquetas.
 */
export function getGlobal(locale: Locale): GlobalDocument {
  assertPublished(locale);
  const rel = `${locale}/${GLOBAL_DOCUMENT}.json`;
  const doc = readJson(rel);
  failOn(validateGlobal(doc), rel);
  const substituted = substitute(doc as GlobalDocument, rel);
  return resolveRefs(substituted, locale, substituted, legalPageLabels(substituted));
}

/** Página de la colección `pages` para un locale publicado. */
export function getPage(locale: Locale, slug: string): PageDocument {
  assertPublished(locale);
  const collection: Collection = collections.pages;
  const rel = `${locale}/${collection}/${slug}.json`;
  const doc = readJson(rel);
  failOn(validatePage(doc), rel);

  // Paso 1: sustituir (con variante según el documento)
  const substituted = slug === 'aviso-legal'
    ? substituteLegal(doc as PageDocument, rel)
    : substitute(doc as PageDocument, rel);

  // Paso 2: resolver referencias { page: slug } → { text, path } y { global: ruta } → texto, contra el documento global validado
  const global = getGlobal(locale);
  const withRefs = resolveRefs(substituted, locale, global, legalPageLabels(global));

  // Paso 3: generar updatedLabel en las secciones legales desde global.legal.updatedLabel + updated formateado
  return addUpdatedLabels(withRefs, global.legal.updatedLabel.trim(), locale);
}

/** La primera sección de un tipo; si la página no la tiene, el build falla con mensaje (no se renderiza a medias). */
export function requireSection<T extends SectionType>(page: PageDocument, type: T, where: string): Extract<Section, { type: T }> {
  const found = page.sections.find((s): s is Extract<Section, { type: T }> => s.type === type);
  if (!found) throw new Error(`[content] ${where}: la página no tiene ninguna sección de tipo "${type}"`);
  return found;
}
