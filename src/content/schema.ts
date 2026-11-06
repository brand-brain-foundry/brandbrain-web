/**
 * Modelo de contenido — TIPOS Y VALIDADOR (docs/system/CONTENT_MODEL.md). Aquí no vive ningún texto: los textos viven en
 * content/<locale>/… Este archivo dice QUÉ FORMA tiene el contenido y la hace cumplir; el build y la guardia
 * (scripts/lint/check-content.ts) fallan cuando algo no cumple.
 *
 * Héroe rediagramado (D-BBW-47 · D-BBW-49, v3.0 del modelo, cambio NO aditivo): la sección `hero` cambia de forma entera —
 *   `display` + `lead` + `claimPrimary` + `claimSecondary` salen; entran `claimLine1..3` y `heading`— y nace `signature` en lo
 *   global, mientras `footer.notice` sale. El esquema es ESTRICTO en los dos sentidos, así que un documento con la forma vieja
 *   rompe la compilación nombrando cada llave: no hay forma de que un texto retirado siga saliendo publicado en silencio.
 * Enmienda de identidad (D-BBW-60, v3.1 del modelo, cambio NO aditivo): **`signature` SALE**. La creó D-BBW-49 para el héroe y el pie,
 *   D-BBW-50 la dejó con un solo consumidor y PR#26 le quitó también ése: llevaba desde entonces sin ningún consumidor y guardando una
 *   SEGUNDA variante del nombre (con el cargo pegado), que es justo lo que la consistencia de entidad de la biblia v2 §12 prohíbe. El
 *   nombre vuelve a la página por `footer.legal`, leído de la fuente única por sustitución. Un `global.json` que todavía traiga la llave
 *   rompe la compilación nombrándola — que es lo que se quiere.
 * D-BBW-78 (v3.2 del modelo, cambio NO aditivo): nace `nav.caseLabel` —la palabra con la que la navegación marca un caso, UNA sola vez—
 *   y `LinkItem.badge` (una palabra por elemento) se convierte en `LinkItem.case` (una declaración booleana). Un `global.json` con la forma
 *   vieja rompe la compilación nombrando las dos llaves. Además, las llaves de enlace ya no salen de `src/config/site.ts` sino de
 *   `content/site.json`: lo editable vive en datos, lo técnico en código.
 * Fase 6b: +1 llave `nav.skipLabel` (el enlace para saltar al contenido exige un texto y ningún texto vive en un componente). Cambio ADITIVO
 * del modelo (v2.1), propuesto en el PR de la fase 6b: el esquema estricto lo exige en todo locale publicado.
 * Reglas del modelo (fase 6a, DESPACHO-BBW-2026-09-16-fase6a §F3):
 *   1. Cada texto, su propia llave. Ningún bloque agrupa varios textos editables.
 *   2. Llaves nombradas por ROL (display, lead, notice, legal…), nunca por lo que dicen hoy.
 *   3. Nada de presentación dentro del contenido: el esquema es ESTRICTO (una llave desconocida = error) y las cadenas son texto
 *      plano (una etiqueta HTML = error). El contenido dice qué; el sistema dice cómo.
 *   4. Lo global (navegación, pie) separado de lo de página. Un documento `global` por locale; un documento por página en `pages/`.
 *   5. Secciones como LISTA ORDENADA CON TIPO: reordenar o añadir una sección de un tipo existente es editar contenido, no código.
 *      Un tipo nuevo exige su forma aquí y su renderizador (fase 6b): eso sí es código, y es honesto decirlo.
 *   6. Enlaces e identidad vienen del DOCUMENTO DEL SITIO (`content/site.json`, leído por ./site.ts): un documento de contenido
 *      referencia una LLAVE de `identity.links`; una llave inexistente es error de build. Nunca una URL en un documento de texto.
 *      Hasta D-BBW-78 ese documento era `src/config/site.ts`, que es código; la regla no cambia, cambia dónde vive la fuente.
 *   7. Marcadores de posición EVIDENTES mientras no haya copy: `[[PENDIENTE: …]]`. Nadie los confunde con copy final y se cuentan.
 */
import { isLinkKey, type LinkKey } from "./site";

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
/**
 * Un tramo de texto en la capa legal (D-BBW-DESPACHO-2026-11-05, §0.1 b, modelo v3.4; extendido v3.6 con `{ page }` y v3.7 con `{ global }`).
 * - Cadena simple: texto plano, sin URL ni correo literal.
 * - Objeto `{ text, link }`: texto visible + llave de `content/site.json`. Los destinos nunca se escriben aquí.
 * - Objeto `{ page: slug }`: referencia a otra página del sitio por su slug (P-BBW-80, L2 §0.3.3). El texto visible
 *   es la etiqueta del registro (`global.legal.pages.<slug>.label`); no lleva `text`. El puerto resuelve esto antes
 *   de devolver el documento: el componente nunca recibe `{ page }`, recibe `{ text, path }`.
 * - Objeto `{ text, path }`: enlace interno resuelto (lo que el componente ve después de que el puerto resolvió `{ page }`).
 * - Objeto `{ global: "ruta.de.llaves" }` (P-BBW-82, v3.7): cita un TEXTO del documento global del mismo locale por su ruta de
 *   llaves (p. ej. `consent.banner.reject`, el nombre del botón «Rechazar»). El puerto lo resuelve a la cadena ANTES de entregar el
 *   documento, así que el componente nunca lo ve. Es lo que permite que la página de Cookies nombre los botones del banner y el
 *   enlace del pie SIN repetir el texto (I-1): una sola fuente, la llave del global. Una ruta que no lleve a un texto rompe el build.
 */
export type Span =
  | string
  | { text: string; link: LinkKey }
  | { page: string }
  | { text: string; path: string }
  | { global: string };

/**
 * Una tabla dentro de un bloque legal (P-BBW-82, v3.7): columnas con rótulo y filas de celdas de texto plano. Cada fila tiene
 * EXACTAMENTE tantas celdas como columnas (el validador lo exige). Las celdas admiten sustituciones (`{{consentKey}}`). Sin
 * presentación: cómo se lee en una pantalla estrecha lo decide el sistema (roles de vista), no el contenido.
 */
export type LegalTable = { columns: string[]; rows: string[][] };

/** Un bloque de la página legal: rótulo `<h2>` y partes ordenadas. Cada parte es un párrafo `{ p }`, una lista `{ list }` o una tabla `{ table }`. El orden del array es el orden de la página. */
export type LegalBlock = {
  heading: string;
  /** partes en orden: `{ p: Span[] }` (párrafo), `{ list: string[] }` (lista `<ul>`) o `{ table: LegalTable }` (tabla). El renderizador respeta el orden. */
  parts: Array<{ p: Span[] } | { list: string[] } | { table: LegalTable }>;
};

/**
 * Sección de lectura legal (P-BBW-73/75, D-BBW-DESPACHO-2026-11-05).
 * Un `<h1>`, párrafo de introducción, bloques `<h2>` y fecha.
 *
 * v3.6 (P-BBW-80, L2 §0.3.4): `updatedLabel` ya NO vive en el JSON de contenido (lo generaba el editor
 * y se copiaba en cada página). Ahora vive UNA vez en `global.json → legal.updatedLabel` y el puerto lo
 * combina con `updated` antes de devolver el documento. El componente sigue recibiendo `updatedLabel`
 * (cadena ya resuelta), pero el JSON no la escribe: una llave `updatedLabel` en el JSON rompe la compilación.
 */
export type LegalSection = {
  type: "legal";
  id: string;
  /** único `<h1>` de la página */
  heading: string;
  /** párrafo introductorio: lista de tramos (puede llevar enlace al correo o referencia a otra página) */
  intro: Span[];
  /** bloques h2 en orden: encabezado + párrafos + lista opcional */
  blocks: LegalBlock[];
  /**
   * Etiqueta resuelta de la fecha de actualización, p. ej. «Última actualización: 5 de noviembre de 2026».
   * El JSON solo tiene `updated` (AAAA-MM-DD); el puerto combina `global.legal.updatedLabel` + fecha formateada
   * y la escribe aquí antes de devolver el documento. El componente no sabe de dónde vino.
   */
  updatedLabel: string;
  /** fecha de última actualización en formato AAAA-MM-DD (el JSON la escribe; el puerto la formatea en `updatedLabel`) */
  updated: string;
};

/** Un enlace con texto visible: la etiqueta es contenido; el destino es una llave del documento del sitio (identidad editable). */
export type LinkItem = {
  /** identificador estable por rol (llave de React, ancla en pruebas); único dentro de su lista */
  id: string;
  /** texto visible o nombre accesible del enlace */
  label: string;
  /** llave de `identity.links` (content/site.json); el destino nunca se escribe aquí */
  link: LinkKey;
  /**
   * ¿ESTE DESTINO ES UN CASO? (D-BBW-78, sobre D-BBW-74/77). El elemento **declara su condición**; NO escribe la palabra.
   * La palabra vive una sola vez, en `nav.caseLabel`, y el organismo la reparte a los elementos que la declaran: si mañana «Caso»
   * pasa a ser otra palabra, se cambia en UN sitio y cambia en todos los enlaces que la llevan.
   * Antes esta llave era `badge: string` y cada elemento escribía su propia palabra: con un solo caso no se notaba, con dos se
   * convertía en dos cadenas que conciliar — exactamente lo que la consistencia de entidad de la biblia v4 §4 evita en los nombres.
   * Es CONTENIDO y no presentación: que un destino sea un caso lo decide quien escribe, no la hoja de estilos.
   * **Entra en el NOMBRE ACCESIBLE** del enlace por construcción: la palabra se pinta dentro del `<a>` como texto normal, así que un
   * lector de pantalla anuncia «Sivar Brains Caso» sin ningún `aria-label` que pudiera desincronizarse del texto visible.
   */
  case?: boolean;
};

/**
 * Mapa de etiquetas de páginas legales (P-BBW-80, L2 §0.3.2, v3.6).
 * Cada llave es el slug de una página legal; el valor es su etiqueta visible (nombre de la página).
 * El slug y el orden de aparición en el pie vienen del registro de código (`src/config/pages.ts`);
 * aquí solo vive el texto: una llave por slug, una llave, un texto.
 */
export type LegalPagesMap = Record<string, { label: string }>;

export type GlobalDocument = {
  nav: {
    /** texto del enlace para saltar al contenido principal (primer elemento enfocable de la página; fase 6b) */
    skipLabel: string;
    /** nombre accesible del conmutador que abre y cierra el menú (≤ 790 px, la madre `--bbf-bp-nav`) */
    toggleLabel: string;
    /**
     * LA PALABRA CON LA QUE LA NAVEGACIÓN MARCA UN CASO, y vive aquí UNA SOLA VEZ (D-BBW-78). Los elementos no la escriben: declaran
     * `case: true` y el organismo se la reparte. La llave nombra el ROL (la etiqueta de los casos), no lo que dice hoy («Caso»).
     */
    caseLabel: string;
    /** los enlaces de navegación, en orden; el mismo dato se renderiza en escritorio y en la hoja (N0 §2.3) */
    items: LinkItem[];
  };
  footer: {
    /**
     * LÍNEA LEGAL, y desde D-BBW-60 también **la única aparición visible del nombre** en toda la página. No escribe la cadena: la pide por
     * sustitución (`© {{year}} {{brand}}`, D-BBW-23), así que el nombre sigue viniendo de la fuente única y el año del momento de compilar.
     * Por qué el nombre vive aquí y no en una llave propia: la regla de los datos estructurados exige que lo declarado se VEA en la página,
     * y el pie es la superficie que quedaba. Una llave, un consumidor.
     */
    legal: string;
    /** enlaces a perfiles externos, en orden (2026-11-02: solo LinkedIn; GitHub sale del pie y de la hoja) */
    social: LinkItem[];
    /**
     * SELLO DE CERTIFICACIÓN (2026-11-02). `label` es el nombre de la credencial tal como se lee en el pie («Google Cloud Certified»).
     * Sin nivel visible por orden de Zavala. El destino (la credencial verificable) es `links.credly` en content/site.json.
     */
    cert: { label: string };
  };
  /**
   * DATOS LEGALES GLOBALES (P-BBW-80, L2 §0.3.2 y §0.3.4, v3.6, cambio NO aditivo).
   * - `updatedLabel`: la etiqueta de «Última actualización», una vez, para todas las páginas legales.
   *   El puerto la combina con la fecha de la sección para generar `LegalSection.updatedLabel`.
   * - `pages`: etiquetas de las páginas legales, por slug. Los slugs y el orden en el pie vienen en el
   *   registro de código (`src/config/pages.ts`); aquí solo vive el texto visible.
   *   Un `global.json` sin `legal` rompe la compilación nombrando la llave (cambio NO aditivo).
   */
  legal: {
    /** texto «Última actualización» — sin fecha: la fecha la pone el puerto al combinar con `LegalSection.updated` */
    updatedLabel: string;
    /** nombre de cada página legal por slug; el slug y el orden de aparición vienen de `src/config/pages.ts` */
    pages: LegalPagesMap;
  };
  /**
   * CONSENTIMIENTO (P-BBW-82, L3; v3.7 del modelo, cambio NO ADITIVO: un `global.json` sin `consent` rompe la compilación).
   * Todos los textos del banner (primera capa), del panel (segunda capa) y del enlace permanente del pie, cada uno con su llave
   * por rol. Es global porque el banner y el enlace salen en TODAS las páginas. Los nombres de los botones se citan desde la
   * página de Cookies con `{ global: "consent.banner.reject" }`, nunca copiados (I-1).
   */
  consent: ConsentDocument;
};

/** Los textos del consentimiento (insumo TEXTOS-CONSENTIMIENTO-L3 §1–§3). */
export type ConsentDocument = {
  /** primera capa: la barra inferior que no bloquea */
  banner: {
    /** nombre accesible de la barra como región (`aria-label`); sin rótulo visible desde 2026-11-06 */
    label: string;
    /** el texto, con la referencia a la página de Cookies por `{ page }` */
    text: Span[];
    /** los tres botones, al mismo nivel */
    reject: string;
    accept: string;
    configure: string;
  };
  /** segunda capa: el panel (`<dialog>` nativo) */
  panel: {
    title: string;
    /** la categoría técnica, siempre activa: nombre, estado y explicación */
    necessary: { label: string; status: string; text: string };
    /** la medición de visitas: nombre y explicación (el interruptor arranca apagado) */
    measurement: { label: string; text: string };
    rejectAll: string;
    acceptAll: string;
    save: string;
  };
  /** el enlace permanente del pie («Configurar cookies»): en el HTML lleva a la página de Cookies; con JavaScript abre el panel */
  footerLink: string;
};

// ── Página ──────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Sección de portada. 2026-11-02 (orden de Zavala), cambio NO aditivo, modelo v3.3: el CLAIM de tres líneas sale y entra el CUERPO de la
 * home nueva sobre el héroe oscuro: el titular (`<h1>`), dos párrafos y dos llamadas a la acción. Cada texto su llave, nombrada por rol.
 * El destino de la llamada primaria es el contacto (derivado del buzón); el de la secundaria, una llave de `content/site.json`.
 */
export type HeroSection = {
  type: "hero";
  id: string;
  /** el encabezado de la página: el único `<h1>` */
  heading: string;
  /** primer párrafo del cuerpo; sus líneas marcan los carriles del campo de puntos */
  paragraph1: string;
  /** segundo párrafo del cuerpo */
  paragraph2: string;
  /** etiqueta de la llamada primaria (→ contacto) */
  ctaPrimary: string;
  /** etiqueta de la llamada secundaria */
  ctaSecondary: string;
  /** llave del destino de la llamada secundaria; el destino vive en content/site.json, nunca aquí */
  ctaSecondaryLink: LinkKey;
};

/** Unión de tipos de sección. Un tipo nuevo se añade aquí y en SECTION_KEYS (y su renderizador, fase 6b). */
export type Section = HeroSection | LegalSection;
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
const URL_IN_TEXT_RE = /https?:\/\//;
const EMAIL_IN_TEXT_RE = /\S+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SECTION_KEYS: Record<SectionType, readonly string[]> = {
  hero: ["type", "id", "heading", "paragraph1", "paragraph2", "ctaPrimary", "ctaSecondary", "ctaSecondaryLink"],
  legal: ["type", "id", "heading", "intro", "blocks", "updated"],
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Objeto con EXACTAMENTE las llaves permitidas: ni una de más (presentación colada), ni una de menos (texto sin llave). */
/**
 * `allowed` = llaves OBLIGATORIAS (tienen que estar) · `optional` = llaves ADMITIDAS (pueden estar o no).
 * El esquema sigue siendo estricto en los dos sentidos para las obligatorias: ni una de más, ni una de menos. Las opcionales existen
 * desde D-BBW-74 —y desde D-BBW-78 con la forma de una declaración booleana— para lo que solo tienen algunos enlaces; declararlas aquí
 * es lo que impide que «opcional» acabe significando «cualquier llave vale».
 */
function checkKeys(v: Record<string, unknown>, allowed: readonly string[], path: string, problems: Problem[], optional: readonly string[] = []): void {
  for (const k of Object.keys(v)) {
    if (!allowed.includes(k) && !optional.includes(k)) problems.push({ path: `${path}.${k}`, message: `llave desconocida (el modelo no la admite; ¿presentación dentro del contenido?)` });
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

/** Texto de un tramo: como checkText, pero también rechaza URLs y correos literales (van por llave, nunca por valor). */
function checkSpanString(v: string, path: string, problems: Problem[]): void {
  if (v.trim().length === 0) return void problems.push({ path, message: `texto vacío (si no hay copy, usar ${PLACEHOLDER_PREFIX} …]])` });
  if (HTML_RE.test(v)) problems.push({ path, message: `contiene HTML: el contenido es texto plano` });
  if (URL_IN_TEXT_RE.test(v)) problems.push({ path, message: `contiene una URL: los destinos van por llave de content/site.json, nunca como dirección` });
  if (EMAIL_IN_TEXT_RE.test(v)) problems.push({ path, message: `contiene un correo literal: usar la sustitución {{email}} o la llave "contact"` });
}

const GLOBAL_PATH_RE = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/;

/**
 * Valida un tramo: cadena, { text, link }, { page: slug } (P-BBW-80, L2 §0.3.3, v3.6) o { global: ruta } (P-BBW-82, v3.7).
 * - { text, link }: enlace externo (llave de content/site.json).
 * - { page: slug }: referencia interna a otra página; el slug se verifica en el puerto. No lleva `text`.
 * - { global: ruta }: cita de un texto del documento global por su ruta de llaves; la ruta se verifica en el puerto.
 */
function checkSpan(v: unknown, path: string, problems: Problem[]): void {
  if (typeof v === "string") {
    checkSpanString(v, path, problems);
  } else if (isRecord(v)) {
    if ("global" in v) {
      // { global: "a.b.c" } — cita de un texto del global
      checkKeys(v, ["global"], path, problems);
      if (typeof v.global !== "string" || !GLOBAL_PATH_RE.test(v.global)) {
        problems.push({ path: `${path}.global`, message: `ruta de llaves inválida (p. ej. "consent.banner.reject")` });
      }
    } else if ("page" in v && !("text" in v) && !("link" in v)) {
      // { page: slug } — referencia interna
      checkKeys(v, ["page"], path, problems);
      if (typeof v.page !== "string" || v.page.trim().length === 0) {
        problems.push({ path: `${path}.page`, message: `el slug de la página no puede estar vacío` });
      } else if (!/^[a-z][a-z0-9-]*$/.test(v.page.trim())) {
        problems.push({ path: `${path}.page`, message: `slug inválido (minúsculas, dígitos y guiones; empieza por letra)` });
      }
    } else {
      checkKeys(v, ["text", "link"], path, problems);
      if (typeof v.text === "string") checkSpanString(v.text, `${path}.text`, problems);
      else if ("text" in v) problems.push({ path: `${path}.text`, message: `debe ser texto` });
      if (typeof v.link !== "string" || !isLinkKey(v.link as string)) {
        problems.push({ path: `${path}.link`, message: `"${String(v.link)}" no es una llave de enlace (los destinos viven solo en content/site.json)` });
      }
    }
  } else {
    problems.push({ path, message: `un tramo debe ser texto, { text, link }, { page: slug } o { global: ruta }` });
  }
}

/** Valida un párrafo (lista de tramos). */
function checkSpans(v: unknown, path: string, problems: Problem[]): void {
  if (!Array.isArray(v)) return void problems.push({ path, message: `debe ser una lista de tramos` });
  v.forEach((span, i) => checkSpan(span, `${path}[${i}]`, problems));
}

/** Valida un bloque legal: { heading, parts[] } donde cada parte es { p: Span[] } o { list: string[] }. El orden del array es el orden de la página. */
function checkLegalBlock(v: unknown, path: string, problems: Problem[]): void {
  if (!isRecord(v)) return void problems.push({ path, message: `debe ser un objeto { heading, parts }` });
  checkKeys(v, ["heading", "parts"], path, problems);
  checkText(v.heading, `${path}.heading`, problems);
  if (!Array.isArray(v.parts)) {
    if ("parts" in v) problems.push({ path: `${path}.parts`, message: `debe ser una lista de partes ({ p } o { list })` });
  } else {
    (v.parts as unknown[]).forEach((part: unknown, i: number) => {
      const pp = `${path}.parts[${i}]`;
      if (!isRecord(part)) {
        problems.push({ path: pp, message: `una parte debe ser { p: Span[] } o { list: string[] }` });
      } else if ("p" in part && !("list" in part)) {
        checkKeys(part, ["p"], pp, problems);
        checkSpans(part.p, `${pp}.p`, problems);
      } else if ("table" in part && !("p" in part) && !("list" in part)) {
        checkKeys(part, ["table"], pp, problems);
        checkLegalTable(part.table, `${pp}.table`, problems);
      } else if ("list" in part && !("p" in part)) {
        checkKeys(part, ["list"], pp, problems);
        if (!Array.isArray(part.list)) {
          problems.push({ path: `${pp}.list`, message: `debe ser una lista de cadenas` });
        } else {
          (part.list as unknown[]).forEach((item: unknown, j: number) => {
            if (typeof item === "string") checkSpanString(item, `${pp}.list[${j}]`, problems);
            else problems.push({ path: `${pp}.list[${j}]`, message: `debe ser texto` });
          });
        }
      } else {
        problems.push({ path: pp, message: `una parte debe ser exactamente { p: Span[] }, { list: string[] } o { table }, no varias ni ninguna` });
      }
    });
  }
}


/** Valida una tabla legal: columnas con texto, filas con EXACTAMENTE tantas celdas de texto como columnas. */
function checkLegalTable(v: unknown, path: string, problems: Problem[]): void {
  if (!isRecord(v)) return void problems.push({ path, message: `debe ser un objeto { columns, rows }` });
  checkKeys(v, ["columns", "rows"], path, problems);
  if (!Array.isArray(v.columns) || v.columns.length === 0) {
    if ("columns" in v) problems.push({ path: `${path}.columns`, message: `debe ser una lista de rótulos de columna, no vacía` });
    return;
  }
  (v.columns as unknown[]).forEach((c, i) => {
    if (typeof c === "string") checkSpanString(c, `${path}.columns[${i}]`, problems);
    else problems.push({ path: `${path}.columns[${i}]`, message: `debe ser texto` });
  });
  if (!Array.isArray(v.rows) || v.rows.length === 0) {
    if ("rows" in v) problems.push({ path: `${path}.rows`, message: `debe ser una lista de filas, no vacía` });
    return;
  }
  const n = v.columns.length;
  (v.rows as unknown[]).forEach((row, r) => {
    const rp = `${path}.rows[${r}]`;
    if (!Array.isArray(row)) return void problems.push({ path: rp, message: `una fila debe ser una lista de celdas` });
    if (row.length !== n) problems.push({ path: rp, message: `tiene ${row.length} celda(s) y la tabla ${n} columna(s)` });
    (row as unknown[]).forEach((cell, c) => {
      if (typeof cell === "string") checkSpanString(cell, `${rp}[${c}]`, problems);
      else problems.push({ path: `${rp}[${c}]`, message: `debe ser texto` });
    });
  });
}

function checkLinkItems(v: unknown, path: string, problems: Problem[]): void {
  if (!Array.isArray(v)) return void problems.push({ path, message: `debe ser una lista` });
  const seen = new Set<string>();
  v.forEach((item, i) => {
    const p = `${path}[${i}]`;
    if (!isRecord(item)) return void problems.push({ path: p, message: `debe ser un objeto { id, label, link }` });
    checkKeys(item, ["id", "label", "link"], p, problems, ["case"]);
    if (item.case !== undefined && typeof item.case !== "boolean") {
      problems.push({ path: `${p}.case`, message: `debe ser true o false (la PALABRA del caso vive una sola vez, en $.nav.caseLabel)` });
    }
    checkId(item.id, `${p}.id`, seen, problems);
    checkText(item.label, `${p}.label`, problems);
    if (typeof item.link !== "string" || !isLinkKey(item.link)) {
      problems.push({ path: `${p}.link`, message: `"${String(item.link)}" no es una llave de enlace (los destinos viven solo en content/site.json; aquí va la llave, nunca la dirección)` });
    }
  });
}

function checkLegalPages(v: unknown, path: string, problems: Problem[]): void {
  if (!isRecord(v)) return void problems.push({ path, message: `debe ser un objeto { <slug>: { label } }` });
  for (const [slug, entry] of Object.entries(v)) {
    const p = `${path}.${slug}`;
    if (!isRecord(entry)) { problems.push({ path: p, message: `debe ser { label }` }); continue; }
    checkKeys(entry, ["label"], p, problems);
    checkText(entry.label, `${p}.label`, problems);
  }
}

export function validateGlobal(v: unknown): Problem[] {
  const problems: Problem[] = [];
  if (!isRecord(v)) return [{ path: "$", message: "el documento debe ser un objeto" }];
  checkKeys(v, ["nav", "footer", "legal", "consent"], "$", problems);
  if (isRecord(v.nav)) {
    checkKeys(v.nav, ["skipLabel", "toggleLabel", "caseLabel", "items"], "$.nav", problems);
    checkText(v.nav.skipLabel, "$.nav.skipLabel", problems);
    checkText(v.nav.toggleLabel, "$.nav.toggleLabel", problems);
    checkText(v.nav.caseLabel, "$.nav.caseLabel", problems);
    checkLinkItems(v.nav.items, "$.nav.items", problems);
  } else if ("nav" in v) problems.push({ path: "$.nav", message: "debe ser un objeto" });
  if (isRecord(v.footer)) {
    checkKeys(v.footer, ["legal", "social", "cert"], "$.footer", problems);
    checkText(v.footer.legal, "$.footer.legal", problems);
    checkLinkItems(v.footer.social, "$.footer.social", problems);
    if (isRecord(v.footer.cert)) {
      checkKeys(v.footer.cert, ["label"], "$.footer.cert", problems);
      checkText(v.footer.cert.label, "$.footer.cert.label", problems);
    } else if ("cert" in v.footer) problems.push({ path: "$.footer.cert", message: "debe ser un objeto { label }" });
  } else if ("footer" in v) problems.push({ path: "$.footer", message: "debe ser un objeto" });
  if (isRecord(v.legal)) {
    checkKeys(v.legal, ["updatedLabel", "pages"], "$.legal", problems);
    checkText(v.legal.updatedLabel, "$.legal.updatedLabel", problems);
    checkLegalPages(v.legal.pages, "$.legal.pages", problems);
  } else if ("legal" in v) problems.push({ path: "$.legal", message: "debe ser un objeto { updatedLabel, pages }" });
  if (isRecord(v.consent)) {
    checkConsent(v.consent, "$.consent", problems);
  } else if ("consent" in v) problems.push({ path: "$.consent", message: "debe ser un objeto { banner, panel, footerLink }" });
  return problems;
}

/** Valida los textos del consentimiento (P-BBW-82): cada texto su llave, estrictas en los dos sentidos. */
function checkConsent(v: Record<string, unknown>, path: string, problems: Problem[]): void {
  checkKeys(v, ["banner", "panel", "footerLink"], path, problems);
  checkText(v.footerLink, `${path}.footerLink`, problems);
  if (isRecord(v.banner)) {
    const b = v.banner;
    const bp = `${path}.banner`;
    checkKeys(b, ["label", "text", "reject", "accept", "configure"], bp, problems);
    checkText(b.label, `${bp}.label`, problems);
    if (Array.isArray(b.text)) checkSpans(b.text, `${bp}.text`, problems);
    else if ("text" in b) problems.push({ path: `${bp}.text`, message: `debe ser una lista de tramos` });
    checkText(b.reject, `${bp}.reject`, problems);
    checkText(b.accept, `${bp}.accept`, problems);
    checkText(b.configure, `${bp}.configure`, problems);
  } else if ("banner" in v) problems.push({ path: `${path}.banner`, message: "debe ser un objeto" });
  if (isRecord(v.panel)) {
    const p = v.panel;
    const pp = `${path}.panel`;
    checkKeys(p, ["title", "necessary", "measurement", "rejectAll", "acceptAll", "save"], pp, problems);
    checkText(p.title, `${pp}.title`, problems);
    if (isRecord(p.necessary)) {
      checkKeys(p.necessary, ["label", "status", "text"], `${pp}.necessary`, problems);
      checkText(p.necessary.label, `${pp}.necessary.label`, problems);
      checkText(p.necessary.status, `${pp}.necessary.status`, problems);
      checkText(p.necessary.text, `${pp}.necessary.text`, problems);
    } else if ("necessary" in p) problems.push({ path: `${pp}.necessary`, message: "debe ser un objeto { label, status, text }" });
    if (isRecord(p.measurement)) {
      checkKeys(p.measurement, ["label", "text"], `${pp}.measurement`, problems);
      checkText(p.measurement.label, `${pp}.measurement.label`, problems);
      checkText(p.measurement.text, `${pp}.measurement.text`, problems);
    } else if ("measurement" in p) problems.push({ path: `${pp}.measurement`, message: "debe ser un objeto { label, text }" });
    checkText(p.rejectAll, `${pp}.rejectAll`, problems);
    checkText(p.acceptAll, `${pp}.acceptAll`, problems);
    checkText(p.save, `${pp}.save`, problems);
  } else if ("panel" in v) problems.push({ path: `${path}.panel`, message: "debe ser un objeto" });
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
  if (type === "legal") {
    checkText(v.heading, `${path}.heading`, problems);
    if (Array.isArray(v.intro)) {
      checkSpans(v.intro, `${path}.intro`, problems);
    } else if ("intro" in v) {
      problems.push({ path: `${path}.intro`, message: `debe ser una lista de tramos` });
    }
    if (Array.isArray(v.blocks)) {
      (v.blocks as unknown[]).forEach((block: unknown, i: number) => checkLegalBlock(block, `${path}.blocks[${i}]`, problems));
    } else if ("blocks" in v) {
      problems.push({ path: `${path}.blocks`, message: `debe ser una lista de bloques` });
    }
    // updatedLabel ya NO vive en el JSON (v3.6): el puerto lo genera desde global.legal.updatedLabel + updated.
    // Si el JSON lo trae, checkKeys ya lo habrá rechazado como llave desconocida.
    checkText(v.updated, `${path}.updated`, problems);
    if (typeof v.updated === "string" && v.updated.trim().length > 0 && !DATE_RE.test(v.updated.trim())) {
      problems.push({ path: `${path}.updated`, message: `debe tener formato AAAA-MM-DD` });
    }
    return;
  }
  for (const k of keys) {
    if (k === "type" || k === "id") continue;
    if (k === "ctaSecondaryLink") {
      if (typeof v[k] !== "string" || !isLinkKey(v[k] as string)) {
        problems.push({ path: `${path}.${k}`, message: `"${String(v[k])}" no es una llave de enlace (los destinos viven solo en content/site.json)` });
      }
      continue;
    }
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

/** Llaves estructurales: identifican, enlazan, referencian (`page`, `global`) o declaran una condición; no son texto editable. */
const STRUCTURAL_KEYS = new Set(["id", "type", "link", "case", "page", "global"]);

/** Recorre los TEXTOS EDITABLES de un documento (para contar textos y marcadores; nunca para interpretarlos, D-DOC-06). */
export function collectTexts(v: unknown, acc: string[] = []): string[] {
  if (typeof v === "string") acc.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectTexts(x, acc));
  else if (isRecord(v)) {
    for (const [k, x] of Object.entries(v)) if (!STRUCTURAL_KEYS.has(k)) collectTexts(x, acc);
  }
  return acc;
}
