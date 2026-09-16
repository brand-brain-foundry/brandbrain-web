/**
 * Modelo de contenido — TIPOS Y VALIDADOR (docs/system/CONTENT_MODEL.md). Aquí no vive ningún texto: los textos viven en
 * content/<locale>/… Este archivo dice QUÉ FORMA tiene el contenido y la hace cumplir; el build y la guardia
 * (scripts/lint/check-content.ts) fallan cuando algo no cumple.
 *
 * Reglas del modelo (fase 6a, DESPACHO-BBW-2026-09-16-fase6a §F3):
 *   1. Cada texto, su propia llave. Ningún bloque agrupa varios textos editables.
 *   2. Llaves nombradas por ROL (display, lead, notice, legal…), nunca por lo que dicen hoy.
 *   3. Nada de presentación dentro del contenido: el esquema es ESTRICTO (una llave desconocida = error) y las cadenas son texto
 *      plano (una etiqueta HTML = error). El contenido dice qué; el sistema dice cómo.
 *   4. Lo global (navegación, pie) separado de lo de página. Un documento `global` por locale; un documento por página en `pages/`.
 *   5. Secciones como LISTA ORDENADA CON TIPO: reordenar o añadir una sección de un tipo existente es editar contenido, no código.
 *      Un tipo nuevo exige su forma aquí y su renderizador (fase 6b): eso sí es código, y es honesto decirlo.
 *   6. Enlaces e identidad vienen de src/config/site.ts: el contenido referencia una LLAVE de `site.links`; una llave inexistente
 *      es error de build. Nunca una URL en el contenido.
 *   7. Marcadores de posición EVIDENTES mientras no haya copy: `[[PENDIENTE: …]]`. Nadie los confunde con copy final y se cuentan.
 */
import { isLinkKey, type LinkKey } from "../config/site";

/** Colecciones con un documento por slug (`content/<locale>/<colección>/<slug>.json`). */
export const collections = {
  pages: "pages",
} as const;
export type Collection = (typeof collections)[keyof typeof collections];

/** Documento único por locale (`content/<locale>/global.json`): lo que se repite en todas las páginas. */
export const GLOBAL_DOCUMENT = "global";

/** Prefijo del marcador de posición. Un texto que empieza así es copy PENDIENTE, nunca definitivo. */
export const PLACEHOLDER_PREFIX = "[[PENDIENTE:";
export function isPlaceholder(text: string): boolean {
  return text.startsWith(PLACEHOLDER_PREFIX);
}

// ── Global ─────────────────────────────────────────────────────────────────────────────────────────────
/** Un enlace con texto visible: la etiqueta es contenido; el destino es una llave de `site.links` (identidad). */
export type LinkItem = {
  /** identificador estable por rol (llave de React, ancla en pruebas); único dentro de su lista */
  id: string;
  /** texto visible o nombre accesible del enlace */
  label: string;
  /** llave de `site.links`; el destino nunca se escribe aquí */
  link: LinkKey;
};

export type GlobalDocument = {
  nav: {
    /** nombre accesible del conmutador que abre y cierra el menú (≤ 780 px) */
    toggleLabel: string;
    /** los enlaces de navegación, en orden; el mismo dato se renderiza en escritorio y en la hoja (N0 §2.3) */
    items: LinkItem[];
  };
  footer: {
    /** aviso corto junto al punto de estado */
    notice: string;
    /** línea legal */
    legal: string;
    /** enlaces a perfiles externos, en orden */
    social: LinkItem[];
  };
};

// ── Página ──────────────────────────────────────────────────────────────────────────────────────────────
/** Sección de portada: el lockup de marca (N0 §2.3: display + lead + dos afirmaciones). */
export type HeroSection = {
  type: "hero";
  id: string;
  /** la palabra de marca del titular (animada por peso: tokens en primitives/motion.css). Es el `<h1>`. */
  display: string;
  /** la línea que acompaña al titular */
  lead: string;
  /** primera afirmación del lockup */
  claimPrimary: string;
  /** segunda afirmación del lockup */
  claimSecondary: string;
};

/** Unión de tipos de sección. Un tipo nuevo se añade aquí y en SECTION_KEYS (y su renderizador, fase 6b). */
export type Section = HeroSection;
export type SectionType = Section["type"];

export type PageDocument = {
  meta: {
    /** título del documento (pestaña y buscadores); lo consume la capa semántica (fase 7) */
    title: string;
    /** descripción para buscadores */
    description: string;
  };
  /** lista ordenada de secciones; el orden del array es el orden en la página */
  sections: Section[];
};

// ── Validador estricto ──────────────────────────────────────────────────────────────────────────────────
export type Problem = { path: string; message: string };

const ID_RE = /^[a-z][a-z0-9-]*$/;
const HTML_RE = /<\/?[a-zA-Z!]/;

const SECTION_KEYS: Record<SectionType, readonly string[]> = {
  hero: ["type", "id", "display", "lead", "claimPrimary", "claimSecondary"],
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Objeto con EXACTAMENTE las llaves permitidas: ni una de más (presentación colada), ni una de menos (texto sin llave). */
function checkKeys(v: Record<string, unknown>, allowed: readonly string[], path: string, problems: Problem[]): void {
  for (const k of Object.keys(v)) {
    if (!allowed.includes(k)) problems.push({ path: `${path}.${k}`, message: `llave desconocida (el modelo no la admite; ¿presentación dentro del contenido?)` });
  }
  for (const k of allowed) {
    if (!(k in v)) problems.push({ path: `${path}.${k}`, message: `falta la llave` });
  }
}

/** Texto plano no vacío, sin HTML. Un marcador `[[PENDIENTE: …]]` es válido: es copy pendiente, no ausente. */
function checkText(v: unknown, path: string, problems: Problem[]): void {
  if (v === undefined) return; // la llave que falta ya la reportó checkKeys
  if (typeof v !== "string") return void problems.push({ path, message: `debe ser texto` });
  if (v.trim().length === 0) return void problems.push({ path, message: `texto vacío (si no hay copy, usar ${PLACEHOLDER_PREFIX} …]])` });
  if (HTML_RE.test(v)) problems.push({ path, message: `contiene HTML: el contenido es texto plano, la presentación la pone el sistema` });
}

function checkId(v: unknown, path: string, seen: Set<string>, problems: Problem[]): void {
  if (typeof v !== "string" || !ID_RE.test(v)) return void problems.push({ path, message: `id inválido (minúsculas, dígitos y guiones; empieza por letra)` });
  if (seen.has(v)) problems.push({ path, message: `id repetido "${v}"` });
  seen.add(v);
}

function checkLinkItems(v: unknown, path: string, problems: Problem[]): void {
  if (!Array.isArray(v)) return void problems.push({ path, message: `debe ser una lista` });
  const seen = new Set<string>();
  v.forEach((item, i) => {
    const p = `${path}[${i}]`;
    if (!isRecord(item)) return void problems.push({ path: p, message: `debe ser un objeto { id, label, link }` });
    checkKeys(item, ["id", "label", "link"], p, problems);
    checkId(item.id, `${p}.id`, seen, problems);
    checkText(item.label, `${p}.label`, problems);
    if (typeof item.link !== "string" || !isLinkKey(item.link)) {
      problems.push({ path: `${p}.link`, message: `"${String(item.link)}" no es una llave de site.links (los destinos viven solo en src/config/site.ts)` });
    }
  });
}

export function validateGlobal(v: unknown): Problem[] {
  const problems: Problem[] = [];
  if (!isRecord(v)) return [{ path: "$", message: "el documento debe ser un objeto" }];
  checkKeys(v, ["nav", "footer"], "$", problems);
  if (isRecord(v.nav)) {
    checkKeys(v.nav, ["toggleLabel", "items"], "$.nav", problems);
    checkText(v.nav.toggleLabel, "$.nav.toggleLabel", problems);
    checkLinkItems(v.nav.items, "$.nav.items", problems);
  } else if ("nav" in v) problems.push({ path: "$.nav", message: "debe ser un objeto" });
  if (isRecord(v.footer)) {
    checkKeys(v.footer, ["notice", "legal", "social"], "$.footer", problems);
    checkText(v.footer.notice, "$.footer.notice", problems);
    checkText(v.footer.legal, "$.footer.legal", problems);
    checkLinkItems(v.footer.social, "$.footer.social", problems);
  } else if ("footer" in v) problems.push({ path: "$.footer", message: "debe ser un objeto" });
  return problems;
}

function checkSection(v: unknown, path: string, seen: Set<string>, problems: Problem[]): void {
  if (!isRecord(v)) return void problems.push({ path, message: `debe ser un objeto con "type"` });
  const type = v.type;
  if (typeof type !== "string" || !(type in SECTION_KEYS)) {
    return void problems.push({ path: `${path}.type`, message: `tipo de sección desconocido "${String(type)}" (tipos: ${Object.keys(SECTION_KEYS).join(", ")})` });
  }
  const keys = SECTION_KEYS[type as SectionType];
  checkKeys(v, keys, path, problems);
  checkId(v.id, `${path}.id`, seen, problems);
  for (const k of keys) {
    if (k === "type" || k === "id") continue;
    checkText(v[k], `${path}.${k}`, problems);
  }
}

export function validatePage(v: unknown): Problem[] {
  const problems: Problem[] = [];
  if (!isRecord(v)) return [{ path: "$", message: "el documento debe ser un objeto" }];
  checkKeys(v, ["meta", "sections"], "$", problems);
  if (isRecord(v.meta)) {
    checkKeys(v.meta, ["title", "description"], "$.meta", problems);
    checkText(v.meta.title, "$.meta.title", problems);
    checkText(v.meta.description, "$.meta.description", problems);
  } else if ("meta" in v) problems.push({ path: "$.meta", message: "debe ser un objeto" });
  if (Array.isArray(v.sections)) {
    if (v.sections.length === 0) problems.push({ path: "$.sections", message: "una página sin secciones no es una página" });
    const seen = new Set<string>();
    v.sections.forEach((s, i) => checkSection(s, `$.sections[${i}]`, seen, problems));
  } else if ("sections" in v) problems.push({ path: "$.sections", message: "debe ser una lista ordenada de secciones" });
  return problems;
}

export function isGlobalDocument(v: unknown): v is GlobalDocument {
  return validateGlobal(v).length === 0;
}
export function isPageDocument(v: unknown): v is PageDocument {
  return validatePage(v).length === 0;
}

/** Llaves estructurales: identifican o enlazan, no son texto editable. */
const STRUCTURAL_KEYS = new Set(["id", "type", "link"]);

/** Recorre los TEXTOS EDITABLES de un documento (para contar textos y marcadores; nunca para interpretarlos, D-DOC-06). */
export function collectTexts(v: unknown, acc: string[] = []): string[] {
  if (typeof v === "string") acc.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectTexts(x, acc));
  else if (isRecord(v)) {
    for (const [k, x] of Object.entries(v)) if (!STRUCTURAL_KEYS.has(k)) collectTexts(x, acc);
  }
  return acc;
}
