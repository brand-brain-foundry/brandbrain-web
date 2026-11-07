/**
 * LA ENTIDAD, DESCRITA UNA SOLA VEZ (S2 · P-BBW-95, «piel» del sistema de posicionamiento; docs/system/SEO.md §1, CONTENT_MODEL.md v3.10).
 *
 * Aquí NO vive ningún valor: los valores viven en `content/site.json` bajo `$.entity` (datos, editables, D-BBW-78). Este archivo dice QUÉ
 * campos hacen citable a la persona, de QUÉ clase es cada uno, DÓNDE vive su valor, QUÉ propiedad de los datos estructurados lo emite,
 * QUÉ sustitución del contenido lo referencia y CÓMO se comprueba que es visible. De esta descripción se DERIVAN, sin escribir nada dos veces:
 *   · la validación del bloque (`./entity.ts` → `validateEntity`, que el puerto ejecuta fail-closed y la guardia informa);
 *   · el esquema exportable que un gestor de contenido puede importar (`./site-schema.ts` → `content/site.schema.json`, regenerado por
 *     `pnpm content:schema`; la guardia R1 falla si el fichero versionado no coincide con esta descripción);
 *   · las sustituciones de entidad del contenido (`./substitutions.ts`: `{{category}}`, `{{motto}}`), BLOQUEADAS mientras el campo no esté aprobado;
 *   · la emisión en los datos estructurados (`src/seo/jsonld.ts`) y su guardia sobre el sitio compilado (R7g, `scripts/lint/check-seo.ts`).
 * Es el patrón declarativo con el que después migrarán los demás documentos (estimación en el output de S2; no entra en S2).
 *
 * ESTADO DE CADA CAMPO (`status`, en los datos, legible por la guardia y NUNCA emitido en el HTML):
 *   · `aprobado`  — el valor está decidido por Zavala. Se emite en los datos estructurados SOLO si además es visible en la página que los
 *                   emite (regla de Google y de `jsonld.ts`: el marcado describe lo visible). Desbloquea su sustitución.
 *   · `heredado`  — el valor existe pero viene de otro sitio (otro documento, otra web, una decisión anterior) y no está aprobado COMO
 *                   DATO DE LA ENTIDAD. No se emite, salvo lo que YA se emitía antes de S2 (`emittedWhileInherited`: excepción finita, para
 *                   que S2 no cambie nada de lo emitido; la sesión C lo resuelve). Su sustitución sigue bloqueada.
 *   · `pendiente` — declarado y vacío hasta la sesión C. No se emite, no se inventa, no se rellena con otro texto. Sustitución bloqueada.
 *
 * NADA SENSIBLE (P-BBW-78): ni domicilio, ni NIF, ni teléfono tienen campo aquí ni lo tendrán. `location` admite solo ciudad o región, y
 * solo si Zavala la aprueba en C.
 *
 * TRADUCCIÓN: el bloque vive en la raíz de `content/` (no se traduce lo que es un nombre, una dirección o una relación). Los campos marcados
 * `translatable` son texto en el idioma publicado (hoy solo ES, D-BBW-15); cuando exista copy EN, esos campos pasan a un mapa por locale y
 * el esquema estricto nombrará la llave en la compilación. Es la misma postura que CONTENT_MODEL.md declara para `role` desde D-BBW-78.
 */

/** Los tres estados, cerrados. */
export const ENTITY_STATUSES = ["aprobado", "heredado", "pendiente"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

/** Clases de valor que el bloque admite. Una clase nueva = su validación en `./entity.ts` y su forma en `./site-schema.ts`. */
export type EntityFieldKind =
  /** una cadena de texto plano */
  | "text"
  /** una lista de textos planos (materias, `knowsAbout`) */
  | "textList"
  /** credenciales: `{ name, issuer?, link }`, con `link` = llave de `$.links` (la credencial verificable) */
  | "credentialList"
  /** un identificador del puerto de medios (`src/media`, D-BBW-21): nunca una ruta ni una dimensión */
  | "media"
  /** llaves de `$.links` que son perfiles de la propia persona (`sameAs`) */
  | "linkList"
  /** otras entidades enlazadas y su relación con la persona: `{ link, kind }` */
  | "relationList";

/**
 * Relaciones admitidas con OTRAS entidades (las que `jsonld.ts` ya distinguía de los perfiles propios). Cerradas y nombradas por lo que la
 * decisión o la biblia dicen, no por lo que suene bien: `construida` = la persona la diseñó y construyó bajo el método («Zavala Cubas
 * construye. Sivar Brains ejecuta», biblia v5 §5 y §8: regla de atribución); `caso` = un caso que la navegación marca como tal;
 * `portafolio-anterior` = el portafolio previo que sigue publicado y se enlaza (D-BBW-80).
 */
export const RELATION_KINDS = ["construida", "caso", "portafolio-anterior"] as const;
export type RelationKind = (typeof RELATION_KINDS)[number];

/** Cómo se comprueba que un campo emitido es VISIBLE en la página que lo emite (R7g). */
export type Visibility =
  /** el texto aparece literal en el texto visible */
  | "text"
  /** el buzón aparece como `href="mailto:…"` */
  | "mailto"
  /** cada dirección aparece como `href="…"` de un enlace */
  | "href"
  /** la imagen aparece como `src` de un `<img>` */
  | "img"
  /** no se emite: nada que comprobar */
  | "none";

/** Tipo de campo en un gestor de contenido (tabla «campo → campo del gestor», CONTENT_MODEL.md). */
export type CmsField = "short-text" | "long-text" | "email" | "tags" | "repeater" | "media" | "multi-reference";

export type EntityFieldSpec = {
  /** clase del valor */
  readonly kind: EntityFieldKind;
  /**
   * dónde vive el valor: `site` = una llave de primer nivel del documento del sitio, que el bloque REFERENCIA y nunca copia (escribir
   * `value` en el bloque rompe la compilación: I-1); `own` = en el propio bloque, bajo `value`.
   */
  readonly source: { readonly kind: "site"; readonly key: "brand" | "role" | "email" } | { readonly kind: "own" };
  /**
   * mientras el estado sea `heredado` y el campo no tenga valor propio, de dónde se toma el valor (hoy solo la descripción, que `Person.description`
   * emite desde la `meta.description` de la portada; la sesión C le da fuente propia). Con `inheritedFrom`, un `value` propio en estado
   * `heredado` rompe la compilación: sería el valor dos veces.
   */
  readonly inheritedFrom?: { readonly page: "home"; readonly path: "meta.description" };
  /** propiedad de `Person` (schema.org) que lo emite, si alguna. Un campo sin `emits` no entra en los datos estructurados. */
  readonly emits?: string;
  /** si ya se emitía antes de S2 aunque esté `heredado` (excepción finita: diferencia cero; C la resuelve) */
  readonly emittedWhileInherited?: boolean;
  /** llave de sustitución del contenido (`{{…}}`) que lo referencia; bloqueada mientras no esté `aprobado` */
  readonly substitution?: string;
  /** si es texto en el idioma publicado (ver cabecera) */
  readonly translatable: boolean;
  /** campo en un gestor de contenido */
  readonly cms: CmsField;
  /** cómo se comprueba su visibilidad cuando se emite */
  readonly visible: Visibility;
  /** para quien edita y para el esquema exportado: qué es el campo. Sin valores de ejemplo (no es copy). */
  readonly doc: string;
};

/**
 * LOS CAMPOS. El orden es el orden del bloque en `content/site.json`, del esquema exportado y del informe de completitud.
 * Existentes (se referencian sin cambiar su valor): `name`, `role`, `email`. Nuevos (declarados; vacíos o heredados hasta C): el resto.
 */
export const ENTITY_FIELDS = {
  name: {
    kind: "text",
    source: { kind: "site", key: "brand" },
    emits: "name",
    substitution: "brand",
    translatable: false,
    cms: "short-text",
    visible: "text",
    doc: "El nombre de la persona: la cadena completa y sin variantes (D-BBW-58, consistencia de entidad). Vive en $.brand; aquí solo su estado.",
  },
  role: {
    kind: "text",
    source: { kind: "site", key: "role" },
    emits: "jobTitle",
    substitution: "role",
    translatable: true,
    cms: "short-text",
    visible: "text",
    doc: "El cargo, capa de la arquitectura de nombres (D-BBW-61). Vive en $.role; aquí solo su estado.",
  },
  email: {
    kind: "text",
    source: { kind: "site", key: "email" },
    emits: "email",
    substitution: "email",
    translatable: false,
    cms: "email",
    visible: "mailto",
    doc: "El buzón publicado (D-BBW-58). Vive en $.email; aquí solo su estado.",
  },
  category: {
    kind: "text",
    source: { kind: "own" },
    substitution: "category",
    translatable: true,
    cms: "short-text",
    visible: "text",
    doc: "La categoría: qué se construye, en minúscula y sin poseerla (biblia v5 §5). El copy la referencia por {{category}}; vacía hasta la sesión C.",
  },
  motto: {
    kind: "text",
    source: { kind: "own" },
    substitution: "motto",
    translatable: true,
    cms: "short-text",
    visible: "text",
    doc: "La frase madre (biblia v5 §6). El copy la referencia por {{motto}}; vacía hasta la sesión C.",
  },
  description: {
    kind: "text",
    source: { kind: "own" },
    inheritedFrom: { page: "home", path: "meta.description" },
    emits: "description",
    emittedWhileInherited: true,
    translatable: true,
    cms: "long-text",
    visible: "text",
    doc: "Descripción corta de la persona (Person.description). Mientras esté heredada, los datos estructurados siguen emitiendo la meta.description de la portada, como antes de S2.",
  },
  descriptionLong: {
    kind: "text",
    source: { kind: "own" },
    translatable: true,
    cms: "long-text",
    visible: "none",
    doc: "Descripción larga de la persona, si hace falta (sección «Quién», biblia v5 §16). No se emite en los datos estructurados.",
  },
  knowsAbout: {
    kind: "textList",
    source: { kind: "own" },
    emits: "knowsAbout",
    translatable: true,
    cms: "tags",
    visible: "text",
    doc: "Materias de la persona (Person.knowsAbout). Cada una tiene que ser visible en la página para emitirse.",
  },
  credentials: {
    kind: "credentialList",
    source: { kind: "own" },
    emits: "hasCredential",
    translatable: false,
    cms: "repeater",
    visible: "href",
    doc: "Credenciales verificables (Person.hasCredential): nombre, emisor y la llave de $.links con la dirección pública de la credencial (la de Credly ya está en $.links.credly).",
  },
  image: {
    kind: "media",
    source: { kind: "own" },
    emits: "image",
    translatable: false,
    cms: "media",
    visible: "img",
    doc: "Imagen de la persona (Person.image), por el puerto de medios: un identificador de src/media, nunca una ruta.",
  },
  location: {
    kind: "text",
    source: { kind: "own" },
    translatable: true,
    cms: "short-text",
    visible: "none",
    doc: "Solo ciudad o región, y solo si Zavala la aprueba en C. Nunca un domicilio (P-BBW-78). No se emite.",
  },
  sameAs: {
    kind: "linkList",
    source: { kind: "own" },
    emits: "sameAs",
    emittedWhileInherited: true,
    translatable: false,
    cms: "multi-reference",
    visible: "href",
    doc: "Las llaves de $.links que son perfiles de la propia persona (Person.sameAs). Las demás llaves son otras entidades o referencias.",
  },
  relations: {
    kind: "relationList",
    source: { kind: "own" },
    translatable: false,
    cms: "repeater",
    visible: "none",
    doc: "Otras entidades enlazadas y su relación con la persona (construida · caso · portafolio-anterior). Vacía hasta la sesión C; no se emite.",
  },
} as const satisfies Record<string, EntityFieldSpec>;

export type EntityFieldKey = keyof typeof ENTITY_FIELDS;
export const ENTITY_FIELD_KEYS = Object.keys(ENTITY_FIELDS) as readonly EntityFieldKey[];

export function fieldSpec(key: EntityFieldKey): EntityFieldSpec {
  return ENTITY_FIELDS[key];
}

/**
 * EL MÍNIMO para que la portada se declare `ProfilePage` (Google, «ProfilePage structured data», act. 2026-09-08: `mainEntity` con `name`
 * obligatorio; recomendados `description`, `sameAs`, `image`). Se activa cuando TODOS estén `aprobado` (y, por R7g, visibles). Hoy no.
 */
export const PROFILE_PAGE_MINIMUM = ["name", "description", "sameAs"] as const satisfies readonly EntityFieldKey[];
