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

/** Documento global (navegación, pie) de un locale publicado. */
export function getGlobal(locale: Locale): GlobalDocument {
  assertPublished(locale);
  const rel = `${locale}/${GLOBAL_DOCUMENT}.json`;
  const doc = readJson(rel);
  failOn(validateGlobal(doc), rel);
  return doc as GlobalDocument;
}

/** Página de la colección `pages` para un locale publicado. */
export function getPage(locale: Locale, slug: string): PageDocument {
  assertPublished(locale);
  const collection: Collection = collections.pages;
  const rel = `${locale}/${collection}/${slug}.json`;
  const doc = readJson(rel);
  failOn(validatePage(doc), rel);
  return doc as PageDocument;
}

/** La primera sección de un tipo; si la página no la tiene, el build falla con mensaje (no se renderiza a medias). */
export function requireSection<T extends SectionType>(page: PageDocument, type: T, where: string): Extract<Section, { type: T }> {
  const found = page.sections.find((s): s is Extract<Section, { type: T }> => s.type === type);
  if (!found) throw new Error(`[content] ${where}: la página no tiene ninguna sección de tipo "${type}"`);
  return found;
}
