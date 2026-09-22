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
import { findUndeclaredSubstitutions, resolveDocument } from "./substitutions";

export const CONTENT_ROOT = join(process.cwd(), "content");

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

/** Documento global (navegación, pie) de un locale publicado. */
export function getGlobal(locale: Locale): GlobalDocument {
  assertPublished(locale);
  const rel = `${locale}/${GLOBAL_DOCUMENT}.json`;
  const doc = readJson(rel);
  failOn(validateGlobal(doc), rel);
  return substitute(doc as GlobalDocument, rel);
}

/** Página de la colección `pages` para un locale publicado. */
export function getPage(locale: Locale, slug: string): PageDocument {
  assertPublished(locale);
  const collection: Collection = collections.pages;
  const rel = `${locale}/${collection}/${slug}.json`;
  const doc = readJson(rel);
  failOn(validatePage(doc), rel);
  return substitute(doc as PageDocument, rel);
}

/** La primera sección de un tipo; si la página no la tiene, el build falla con mensaje (no se renderiza a medias). */
export function requireSection<T extends SectionType>(page: PageDocument, type: T, where: string): Extract<Section, { type: T }> {
  const found = page.sections.find((s): s is Extract<Section, { type: T }> => s.type === type);
  if (!found) throw new Error(`[content] ${where}: la página no tiene ninguna sección de tipo "${type}"`);
  return found;
}
