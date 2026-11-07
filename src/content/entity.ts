/**
 * EL BLOQUE DE ENTIDAD, LEÍDO Y VALIDADO (S2 · P-BBW-95). La descripción vive en `./entity-fields.ts`; los valores, en `content/site.json`
 * bajo `$.entity`. Este módulo hace cumplir la descripción (validación por clase y por estado) y responde las tres preguntas que el resto del
 * sistema hace a la entidad: ¿qué valor tiene este campo?, ¿se emite en los datos estructurados?, ¿está completa?
 *
 * REGLA DE EMISIÓN (despacho S2 §0.2.2, la de Google y la de `jsonld.ts`; P-BBW-95): un campo entra en los datos estructurados SOLO si está
 * `aprobado` Y es visible en la página que los emite. Lo que YA se emitía antes de S2 y sigue heredado (`emittedWhileInherited`) se sigue
 * emitiendo igual. Lo `pendiente` no se emite: no se inventa ni se rellena con otro texto.
 *
 * LA VISIBILIDAD SE DECIDE AL CONSTRUIR (S3, despacho §0.4). En S2 «aprobado» bastaba para emitir y R7g rompía el build si lo emitido no era
 * visible: valía mientras todo lo aprobado estaba en la página. Desde S3 la sesión C aprueba textos que todavía no tienen sección
 * (`description`, `location`, `motto`…) y la regla de P-BBW-95 se aplica entera: el constructor pregunta a la CAPA DE CONTENIDO si el
 * valor es visible (`visibilityContext`: los textos del cuerpo de la página que emite y del documento global, que es todo lo que los
 * componentes pintan —`react/jsx-no-literals`—, y las llaves de enlace que esos documentos referencian), emite solo lo visible, y R7g lo
 * CONFIRMA sobre el HTML servido (si el contenido dice visible y el HTML no, el build rompe: sería un componente que no pinta lo que lee).
 * Un campo aprobado y no visible no es un error: es un hecho que el informe de la entidad imprime con su motivo (`entityEmissionReport`), y
 * que se resuelve escribiendo el texto en una sección, no tocando el estado. La `meta` de la página no cuenta como visible (una `meta` o un
 * `<title>` no es texto de la página, S2 F8).
 *
 * NO rompe al cargarse a propósito (como `./site.ts`): lo importa también la guardia, y un `throw` en su carga la dejaría sin informe. El
 * PUERTO (`./index.ts`) ejecuta `validateSite` —que incluye `validateEntity`— y falla cerrado.
 *
 * D-DOC-06: el bloque es DATO. Se parsea y se valida; jamás se interpreta ni se ejecuta.
 */
import document from "../../content/site.json";
import { media } from "../media/generated";
import {
  ENTITY_FIELDS,
  ENTITY_FIELD_KEYS,
  ENTITY_STATUSES,
  PROFILE_PAGE_MINIMUM,
  RELATION_KINDS,
  fieldSpec,
  type EntityFieldKey,
  type EntityFieldSpec,
  type EntityStatus,
} from "./entity-fields";
import type { GlobalDocument, PageDocument, Problem } from "./schema";

/** Un campo en los datos: su estado y, si es propio, su valor. */
export type EntityFieldData = { status: EntityStatus; value?: unknown };
export type EntityBlock = Record<EntityFieldKey, EntityFieldData>;

export type Credential = { name: string; issuer?: string; link: string };
export type Relation = { link: string; kind: (typeof RELATION_KINDS)[number] };

const HTML_RE = /<\/?[a-zA-Z!]/;
const MEDIA_IDS: readonly string[] = Object.keys(media);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function checkText(v: unknown, path: string, problems: Problem[]): void {
  if (typeof v !== "string") return void problems.push({ path, message: `debe ser texto` });
  if (v.trim().length === 0) problems.push({ path, message: `texto vacío (si no hay valor, el estado es "pendiente" y no se escribe value)` });
  else if (HTML_RE.test(v)) problems.push({ path, message: `contiene HTML: el contenido es texto plano` });
}

/** Valida un valor PROPIO según la clase del campo. `linkKeys` = las llaves de `$.links` (sin la derivada `contact`). */
function checkValue(spec: EntityFieldSpec, v: unknown, path: string, linkKeys: readonly string[], problems: Problem[]): void {
  const isLink = (k: unknown): k is string => typeof k === "string" && linkKeys.includes(k);
  const notLink = (k: unknown) => `"${String(k)}" no es una llave de $.links (las llaves: ${linkKeys.join(", ")}; "contact" es derivada y no vale aquí)`;
  switch (spec.kind) {
    case "text":
      return checkText(v, path, problems);
    case "textList":
      if (!Array.isArray(v)) return void problems.push({ path, message: `debe ser una lista de textos` });
      return v.forEach((x, i) => checkText(x, `${path}[${i}]`, problems));
    case "credentialList":
      if (!Array.isArray(v)) return void problems.push({ path, message: `debe ser una lista de credenciales { name, issuer?, link }` });
      return v.forEach((c, i) => {
        const p = `${path}[${i}]`;
        if (!isRecord(c)) return void problems.push({ path: p, message: `debe ser un objeto { name, issuer?, link }` });
        for (const k of Object.keys(c)) if (!["name", "issuer", "link"].includes(k)) problems.push({ path: `${p}.${k}`, message: `llave desconocida` });
        checkText(c.name, `${p}.name`, problems);
        if ("issuer" in c) checkText(c.issuer, `${p}.issuer`, problems);
        if (!isLink(c.link)) problems.push({ path: `${p}.link`, message: notLink(c.link) });
      });
    case "media":
      if (typeof v !== "string" || !MEDIA_IDS.includes(v)) {
        problems.push({ path, message: `"${String(v)}" no es un identificador del puerto de medios (src/media; D-BBW-21: nunca una ruta)` });
      }
      return;
    case "linkList":
      if (!Array.isArray(v)) return void problems.push({ path, message: `debe ser una lista de llaves de $.links` });
      return v.forEach((k, i) => { if (!isLink(k)) problems.push({ path: `${path}[${i}]`, message: notLink(k) }); });
    case "relationList":
      if (!Array.isArray(v)) return void problems.push({ path, message: `debe ser una lista de relaciones { link, kind }` });
      return v.forEach((r, i) => {
        const p = `${path}[${i}]`;
        if (!isRecord(r)) return void problems.push({ path: p, message: `debe ser un objeto { link, kind }` });
        for (const k of Object.keys(r)) if (!["link", "kind"].includes(k)) problems.push({ path: `${p}.${k}`, message: `llave desconocida` });
        if (!isLink(r.link)) problems.push({ path: `${p}.link`, message: notLink(r.link) });
        if (typeof r.kind !== "string" || !(RELATION_KINDS as readonly string[]).includes(r.kind)) {
          problems.push({ path: `${p}.kind`, message: `relación desconocida "${String(r.kind)}" (relaciones: ${RELATION_KINDS.join(", ")})` });
        }
      });
  }
}

/**
 * Validador ESTRICTO del bloque: exactamente los campos de la descripción, cada uno con `status` del conjunto cerrado y un `value` coherente
 * con su clase, su fuente y su estado:
 *   · fuente `site`: `value` PROHIBIDO (el valor vive en la llave de primer nivel; escribirlo aquí sería escribirlo dos veces, I-1);
 *   · `pendiente`: sin `value` (o vacío);
 *   · `aprobado`: `value` no vacío y válido para su clase (en fuente `site`, la llave referenciada no vacía);
 *   · `heredado`: con `inheritedFrom`, SIN `value` (se hereda); sin `inheritedFrom`, `value` no vacío y válido.
 */
export function validateEntity(v: unknown, linkKeys: readonly string[], siteValues: Record<string, unknown>, path = "$.entity"): Problem[] {
  const problems: Problem[] = [];
  if (!isRecord(v)) return [{ path, message: `falta el bloque de entidad o no es un objeto { <campo>: { status, value? } }` }];
  for (const k of Object.keys(v)) {
    if (!(k in ENTITY_FIELDS)) problems.push({ path: `${path}.${k}`, message: `campo desconocido (la entidad se describe en src/content/entity-fields.ts)` });
  }
  for (const key of ENTITY_FIELD_KEYS) {
    const spec = fieldSpec(key);
    const p = `${path}.${key}`;
    const field = v[key];
    if (!isRecord(field)) { problems.push({ path: p, message: `falta el campo o no es un objeto { status, value? }` }); continue; }
    for (const k of Object.keys(field)) if (!["status", "value"].includes(k)) problems.push({ path: `${p}.${k}`, message: `llave desconocida (solo status y value)` });
    const status = field.status;
    if (typeof status !== "string" || !(ENTITY_STATUSES as readonly string[]).includes(status)) {
      problems.push({ path: `${p}.status`, message: `estado desconocido "${String(status)}" (estados: ${ENTITY_STATUSES.join(", ")})` });
      continue;
    }
    const hasValue = "value" in field && !isEmpty(field.value);
    if (spec.source.kind === "site") {
      if ("value" in field) problems.push({ path: `${p}.value`, message: `el valor vive en $.${spec.source.key} y aquí solo se referencia: escribirlo dos veces rompe la fuente única (I-1)` });
      if (status === "aprobado" && isEmpty(siteValues[spec.source.key])) problems.push({ path: p, message: `aprobado pero $.${spec.source.key} está vacío` });
      if (status === "pendiente") problems.push({ path: `${p}.status`, message: `un campo referenciado de $.${spec.source.key} no puede estar pendiente: ese valor existe` });
      continue;
    }
    if (status === "pendiente") {
      if (hasValue) problems.push({ path: `${p}.value`, message: `pendiente con valor: si el valor está decidido, el estado es "aprobado" (o "heredado" si viene de otro sitio)` });
      continue;
    }
    if (status === "heredado" && spec.inheritedFrom) {
      if ("value" in field) problems.push({ path: `${p}.value`, message: `heredado de ${spec.inheritedFrom.page}.${spec.inheritedFrom.path}: no se escribe aquí (sería el valor dos veces); cuando C lo apruebe, pasa a "aprobado" con su valor propio` });
      continue;
    }
    if (!hasValue) { problems.push({ path: `${p}.value`, message: `${status} sin valor: falta value, o el estado es "pendiente"` }); continue; }
    checkValue(spec, field.value, `${p}.value`, linkKeys, problems);
  }
  return problems;
}

// ── Lectura ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** El bloque tal cual está en el documento (ya validado por el puerto al cargar). */
export const entity = (document as { entity: EntityBlock }).entity;

export function entityStatus(key: EntityFieldKey): EntityStatus {
  return entity[key].status;
}

export function isApproved(key: EntityFieldKey): boolean {
  return entityStatus(key) === "aprobado";
}

/**
 * El valor de un campo, resuelto por su fuente: una llave del documento del sitio, el valor propio, o `undefined` si está pendiente o
 * heredado sin valor propio (la herencia de `description` la resuelve quien tiene la página: `src/seo/jsonld.ts`).
 */
export function entityValue(key: EntityFieldKey): unknown {
  const spec = fieldSpec(key);
  if (spec.source.kind === "site") return (document as Record<string, unknown>)[spec.source.key];
  const v = entity[key].value;
  return isEmpty(v) ? undefined : v;
}

export function entityText(key: EntityFieldKey): string | undefined {
  const v = entityValue(key);
  return typeof v === "string" ? v : undefined;
}

export function entityList<T = unknown>(key: EntityFieldKey): T[] {
  const v = entityValue(key);
  return Array.isArray(v) ? (v as T[]) : [];
}

// ── Visibilidad por contenido y emisión (S3) ────────────────────────────────────────────────────────────────────────────────────────

/**
 * Lo que la página que emite los datos estructurados MUESTRA, según la capa de contenido: los textos de su cuerpo y del documento global
 * (navegación, pie, consentimiento: todo lo que el HTML servido trae literal, D-BBW-09) y las llaves de `$.links` que esos documentos
 * referencian. Se construye con los documentos YA RESUELTOS por el puerto (sustituciones y referencias hechas), que es lo que los componentes
 * pintan. Fuera: `meta` (cabecera, no cuerpo) y las llaves estructurales.
 */
export type VisibilityContext = {
  /** el texto del cuerpo, normalizado en espacios, para buscar valores literales */
  readonly text: string;
  /** las llaves de `$.links` referenciadas (`link`, `ctaSecondaryLink`…): un perfil o un buzón es visible si su llave está aquí */
  readonly linkKeys: ReadonlySet<string>;
  /** todas las cadenas, para los identificadores (medios) */
  readonly strings: ReadonlySet<string>;
};

/** Llaves que no son texto visible: identifican, enlazan, referencian o declaran un control (las mismas del puerto y del esquema). */
const STRUCTURAL_KEYS = new Set(["id", "type", "case", "page", "global", "kind", "path"]);
const LINK_KEY_RE = /link$/i;

function walk(node: unknown, acc: { texts: string[]; linkKeys: Set<string>; strings: Set<string> }, key?: string): void {
  if (typeof node === "string") {
    acc.strings.add(node);
    if (key !== undefined && LINK_KEY_RE.test(key)) return void acc.linkKeys.add(node);
    if (key === undefined || !STRUCTURAL_KEYS.has(key)) acc.texts.push(node);
    return;
  }
  if (Array.isArray(node)) return void node.forEach((x) => walk(x, acc, key));
  if (node && typeof node === "object") for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, acc, k);
}

export function visibilityContext(page: PageDocument, global: GlobalDocument): VisibilityContext {
  const acc = { texts: [] as string[], linkKeys: new Set<string>(), strings: new Set<string>() };
  walk(page.sections, acc);
  walk(global, acc);
  return { text: acc.texts.join(" ").replace(/\s+/g, " "), linkKeys: acc.linkKeys, strings: acc.strings };
}

/**
 * Qué valores de texto de un campo NO aparecen en un texto dado (vacío = todos aparecen). Un valor que es SUBCADENA de otro valor de la entidad
 * (`alternateName` «Zavala Cubas» dentro de `name` «Christian Zavala Cubas») solo cuenta como visible FUERA de las apariciones de ese otro
 * valor: la página que escribe el nombre completo no está escribiendo la variante. Misma función para el contenido (aquí) y para el HTML (R7g).
 */
export function missingInText(key: EntityFieldKey, text: string): string[] {
  const value = entityValue(key);
  if (value === undefined) return [`sin valor`];
  const list = Array.isArray(value) ? value.map(String) : [String(value)];
  const containers = ENTITY_FIELD_KEYS.filter((k) => k !== key && fieldSpec(k).visible === "text")
    .map((k) => entityValue(k))
    .flatMap((v) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : []));
  return list.filter((v) => {
    let haystack = text;
    for (const c of containers) if (c !== v && c.includes(v)) haystack = haystack.split(c).join(" ");
    return !haystack.includes(v);
  });
}

/**
 * Qué parte del valor de un campo NO es visible según el contenido (vacío = todo visible), por la clase de comprobación que declara la
 * descripción: `text` = literal en el cuerpo (`missingInText`); `mailto` = la llave `contact` referenciada; `href` = cada llave referenciada;
 * `img` = el identificador del medio escrito en el contenido; `none` = nada que comprobar (el campo no se emite).
 */
export function notVisibleInContent(key: EntityFieldKey, ctx: VisibilityContext): string[] {
  const spec = fieldSpec(key);
  const value = entityValue(key);
  if (value === undefined) return [`sin valor`];
  const list = Array.isArray(value) ? value.map(String) : [String(value)];
  switch (spec.visible) {
    case "text":
      return missingInText(key, ctx.text);
    case "mailto":
      return ctx.linkKeys.has("contact") ? [] : [`contact`];
    case "href": {
      // una lista de llaves (`sameAs`) o de credenciales (`{ link }`): lo que debe estar referenciado es la llave de enlace
      const keys = spec.kind === "credentialList" ? entityList<Credential>(key).map((c) => c.link) : list;
      return keys.filter((k) => !ctx.linkKeys.has(k));
    }
    case "img":
      return list.filter((v) => !ctx.strings.has(v));
    case "none":
      return [];
  }
}

/**
 * ¿Se emite este campo en los datos estructurados de la página descrita por `ctx`? Aprobado → sí, si es visible según el contenido (R7g lo
 * confirma sobre el HTML). Heredado → solo lo que ya se emitía antes de S2. Pendiente → nunca.
 */
export function isEmittedOn(key: EntityFieldKey, ctx: VisibilityContext): boolean {
  const spec = fieldSpec(key);
  if (!spec.emits) return false;
  const status = entityStatus(key);
  if (status === "aprobado") return notVisibleInContent(key, ctx).length === 0;
  if (status === "heredado") return spec.emittedWhileInherited === true;
  return false;
}

/** La portada se declara `ProfilePage` cuando el mínimo se EMITE (aprobado y visible). Hoy no: `description` espera la sección «Quién». */
export function isProfilePageReadyOn(ctx: VisibilityContext): boolean {
  return PROFILE_PAGE_MINIMUM.every((k) => isEmittedOn(k, ctx));
}

/** Los tipos del grafo que la portada emite, en orden alfabético (lo que R7e compara). */
export function entityGraphTypesOn(ctx: VisibilityContext): string[] {
  return isProfilePageReadyOn(ctx) ? ["Person", "ProfilePage", "WebSite"] : ["Person", "WebSite"];
}

/**
 * EL INFORME DE EMISIÓN (S3 F9): qué campos aprobados se emiten, cuáles no y por qué. No falla nada: un campo aprobado que espera su
 * sección es un hecho, no un error. Lo imprime la guardia al final del build.
 */
export function entityEmissionReport(ctx: VisibilityContext): { emitted: EntityFieldKey[]; approvedNotVisible: { key: EntityFieldKey; why: string }[]; approvedNotEmitting: EntityFieldKey[] } {
  const emitted: EntityFieldKey[] = [];
  const approvedNotVisible: { key: EntityFieldKey; why: string }[] = [];
  const approvedNotEmitting: EntityFieldKey[] = [];
  for (const key of ENTITY_FIELD_KEYS) {
    const spec = fieldSpec(key);
    if (isEmittedOn(key, ctx)) { emitted.push(key); continue; }
    if (entityStatus(key) !== "aprobado") continue;
    if (!spec.emits) { approvedNotEmitting.push(key); continue; }
    const missing = notVisibleInContent(key, ctx);
    const how = spec.visible === "text" ? "no aparece en el texto del cuerpo" : spec.visible === "img" ? "ningún contenido referencia el medio" : "ningún contenido referencia la llave de enlace";
    approvedNotVisible.push({ key, why: `${how}: ${missing.map((m) => `«${m.length > 60 ? m.slice(0, 57) + "…" : m}»`).join(", ")}` });
  }
  return { emitted, approvedNotVisible, approvedNotEmitting };
}

/** Las sustituciones de entidad: llave → valor si el campo está aprobado, `null` si está BLOQUEADA (pendiente o heredado). */
export function entitySubstitutions(): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const key of ENTITY_FIELD_KEYS) {
    const spec = fieldSpec(key);
    if (!spec.substitution || spec.source.kind === "site") continue; // las de fuente `site` ya existen como sustituciones globales
    out[spec.substitution] = isApproved(key) ? (entityText(key) ?? null) : null;
  }
  return out;
}

/**
 * El informe de completitud (R7g (c) y la guardia de contenido): cuenta por estado y lista lo que no está aprobado. No falla nada.
 * Si `ProfilePage` está activa depende de la página (visibilidad): lo dice el informe de emisión de la guardia R7, no esta línea.
 */
export function entityCompleteness(): { aprobados: number; heredados: number; pendientes: number; byStatus: Record<EntityStatus, EntityFieldKey[]>; line: string } {
  const byStatus: Record<EntityStatus, EntityFieldKey[]> = { aprobado: [], heredado: [], pendiente: [] };
  for (const key of ENTITY_FIELD_KEYS) byStatus[entityStatus(key)].push(key);
  const aprobados = byStatus.aprobado.length;
  const heredados = byStatus.heredado.length;
  const pendientes = byStatus.pendiente.length;
  const line =
    `[entidad] ${ENTITY_FIELD_KEYS.length} campo(s): ${aprobados} aprobado(s) [${byStatus.aprobado.join(", ")}] · ` +
    `${heredados} heredado(s) [${byStatus.heredado.join(", ")}] · ${pendientes} pendiente(s) [${byStatus.pendiente.join(", ")}]`;
  return { aprobados, heredados, pendientes, byStatus, line };
}
