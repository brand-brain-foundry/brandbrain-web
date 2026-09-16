/**
 * PUERTO DE CONTENIDO — adaptador actual: ARCHIVOS versionados en el repo (D-BBW-02), leídos en tiempo de build.
 * Registro: docs/system/PORTS.md (fila "Contenido"). Modelo: docs/system/CONTENT_MODEL.md.
 *
 * · Los textos viven en `content/<locale>/<colección>/<slug>.json`, FUERA de src/ y fuera de los componentes (D-BBW-09, I-2).
 * · Un componente recibe el documento por props o lo pide aquí; nunca escribe un literal (eslint react/jsx-no-literals).
 * · Solo existen los locales PUBLICADOS (D-BBW-15): pedir un locale no publicado es un error de build, no un fallback.
 * · Falta o forma inválida = el build FALLA con mensaje (fail-closed): ninguna página sale con contenido vacío.
 * · Alternativa prevista (PORTS.md): un gestor sobre git que escriba en estos mismos archivos. Ningún gestor instalado.
 * · D-DOC-06: el contenido es DATO de negocio. Este lector lo parsea y valida; jamás lo interpreta ni lo ejecuta.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { publishedLocales, type Locale } from "@/config/site";
import { collections, isPageDocument, type Collection, type PageDocument } from "./schema";

const CONTENT_ROOT = join(process.cwd(), "content");

function documentPath(locale: Locale, collection: Collection, slug: string): string {
  return join(CONTENT_ROOT, locale, collection, `${slug}.json`);
}

function readDocument(locale: Locale, collection: Collection, slug: string): unknown {
  if (!(publishedLocales as readonly string[]).includes(locale)) {
    throw new Error(`[content] locale "${locale}" no está publicado (D-BBW-15): no existe content/${locale}/`);
  }
  const file = documentPath(locale, collection, slug);
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    throw new Error(`[content] falta el documento content/${locale}/${collection}/${slug}.json`);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    throw new Error(`[content] JSON inválido en content/${locale}/${collection}/${slug}.json: ${(e as Error).message}`);
  }
}

/** Página de la colección `pages` para un locale publicado. */
export function getPage(locale: Locale, slug: string): PageDocument {
  const doc = readDocument(locale, collections.pages, slug);
  if (!isPageDocument(doc)) {
    throw new Error(`[content] content/${locale}/pages/${slug}.json no cumple el modelo PageDocument (title: string, intro: string[])`);
  }
  return doc;
}
