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
 *                   S3 (P-BBW-95 aplicada entera): la visibilidad se decide AL CONSTRUIR, desde la capa de contenido (`./entity.ts`,
 *                   `visibilityContext`: los textos del cuerpo de la página y del documento global, las llaves de enlace que referencian),
 *                   y R7g la confirma sobre el HTML servido. Un campo aprobado y todavía no visible NO se emite y el informe de la entidad
 *                   lo dice con su motivo; se emitirá el día que una sección lo escriba (la sección «Quién», S3b).
 *   · `heredado`  — el valor existe pero viene de otro sitio (otro documento, otra web, una decisión anterior) y no está aprobado COMO
 *                   DATO DE LA ENTIDAD. No se emite, salvo lo que YA se emitía antes de S2 (`emittedWhileInherited`: excepción finita, para
 *                   que S2 no cambiara nada de lo emitido). Desde S3 ningún campo está heredado; el estado y su mecánica se conservan
 *                   para el día en que un valor vuelva a venir de fuera. Su sustitución sigue bloqueada.
 *   · `pendiente` — declarado y vacío. No se emite, no se inventa, no se rellena con otro texto. Sustitución bloqueada.
 *
 * LOS VALORES (S3, sesión C del 2026-11-07, decisiones D-BBW-81…88): PERFIL-CZC es la fuente editorial del perfil (Drive); para la web
 * mandan las decisiones registradas en el hub y el valor en ejecución vive UNA vez en `content/site.json` `$.entity`. La biblia v5 dejó de ser
 * fuente de cadenas donde choca con ellas (nota de supersesión al principio de la biblia).
 *
 * NADA SENSIBLE (P-BBW-78): ni domicilio, ni NIF, ni teléfono tienen campo aquí ni lo tendrán. `location` admite solo ciudad y país
 * (D-BBW-86), nunca un domicilio.
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
  /** credenciales: `{ name, issuer?, category?, link }`, con `link` = llave de `$.links` (la credencial verificable) */
  | "credentialList"
  /**
   * un identificador del puerto de medios (`src/media`, D-BBW-21): un derivado o un CONJUNTO de recortes del mismo maestro (`mediaSets`, S3c);
   * nunca una ruta ni una dimensión
   */
  | "media"
  /** un lugar público: `{ locality, country }` (localidad y código de país ISO 3166-1 alfa-2), nunca una dirección (P-BBW-78; S3c, D-BBW-93) */
  | "place"
  /** llaves de `$.links` que son perfiles de la propia persona (`sameAs`) */
  | "linkList"
  /** otras entidades enlazadas y su relación con la persona: `{ link, kind }` */
  | "relationList";

/**
 * Relaciones admitidas con OTRAS entidades (las que `jsonld.ts` ya distinguía de los perfiles propios). Cerradas y nombradas por lo que la
 * decisión o la biblia dicen, no por lo que suene bien: `construida` = la persona la diseñó y construyó bajo el método («Zavala Cubas
 * construye. Sivar Brains ejecuta», biblia v5 §5 y §8: regla de atribución); `caso` = un caso que la navegación marca como tal;
 * `portafolio-anterior` = el portafolio previo que sigue publicado y se enlaza (D-BBW-80); `fundada` = la persona la fundó (S3c, D-BBW-92:
 * el estudio). Ninguna relación se emite hasta que existan los nodos de organización (fase 2 del insumo de la página de perfil, §6.2).
 */
export const RELATION_KINDS = ["construida", "fundada", "caso", "portafolio-anterior"] as const;
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

/**
 * Las FÓRMULAS de los campos derivados, cerradas (P1). `profileApproach` = «Cómo trabajo» de la página de perfil (la del tipo `profile`,
 * `PROFILE_PAGE`): entrada + tarjetas en orden + trayectoria, por `deriveApproachText` (`./schema.ts`).
 */
export const DERIVATION_RULES = ["profileApproach"] as const;
export type DerivationRule = (typeof DERIVATION_RULES)[number];

export type EntityFieldSpec = {
  /** clase del valor */
  readonly kind: EntityFieldKind;
  /**
   * dónde vive el valor: `site` = una llave de primer nivel del documento del sitio, que el bloque REFERENCIA y nunca copia (escribir
   * `value` en el bloque rompe la compilación: I-1); `own` = en el propio bloque, bajo `value`.
   */
  readonly source:
    | { readonly kind: "site"; readonly key: "brand" | "role" | "email" }
    | { readonly kind: "own" }
    /**
     * `derived` (P1, D-BBW-109): el valor NO se escribe en ningún sitio; se CALCULA por una fórmula declarada sobre el contenido de una página
     * (`rule`). Escribir `value` en el bloque rompe la compilación (sería el texto dos veces, I-1). La calcula el PUERTO (servidor, lee el
     * documento de la página: `src/content/index.ts` → `getDerivedEntityText`) y la guardia de contenido la imprime; este módulo y el de la
     * entidad no la calculan porque viajan al navegador (la barra del consentimiento importa el documento del sitio) y no leen archivos.
     */
    | { readonly kind: "derived"; readonly rule: DerivationRule };
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
 * Referenciados (su valor vive en una llave de primer nivel): `name`, `role`, `email`. Propios: el resto. `alternateName` entra en S3 (D-BBW-85).
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
  alternateName: {
    kind: "text",
    source: { kind: "own" },
    emits: "alternateName",
    translatable: false,
    cms: "short-text",
    visible: "text",
    doc: "La ÚNICA variante admitida del nombre (D-BBW-85, enmienda de D-BBW-58): la marca y el logotipo. Person.alternateName; se emite solo cuando aparece escrita en la página. Ninguna otra abreviatura ni inicial tiene campo.",
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
    doc: "La categoría: qué se construye, en minúscula y sin poseerla (D-BBW-81). El copy la referencia por {{category}}: hoy, el título propio de la portada (la fórmula del tipo pone la mayúscula). No se emite como propiedad: es copy, no un hecho del Person.",
  },
  motto: {
    kind: "text",
    source: { kind: "own" },
    substitution: "motto",
    translatable: true,
    cms: "short-text",
    visible: "text",
    doc: "La frase madre (D-BBW-83). El copy la referencia por {{motto}}; su lugar visible en la página es decisión de Zavala (S3b). No se emite como propiedad.",
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
    doc: "La frase definitoria de la persona (Person.description; PERFIL-CZC §2.1, D-BBW-81/82/84/86): en tercera persona, la que un buscador o un modelo puede extraer tal cual. Desde D-BBW-116 ninguna página la muestra (la entrada del perfil es copy propio en primera persona), así que `Person.description` no se emite; su ausencia no suprime ProfilePage. Si volviera a heredarse, tomaría la meta.description de la portada, como antes de S2.",
  },
  descriptionLong: {
    kind: "text",
    source: { kind: "derived", rule: "profileApproach" },
    translatable: true,
    cms: "long-text",
    visible: "none",
    doc: "Descripción larga de la persona, en primera persona (PERFIL-CZC §5.3; D-BBW-84, D-BBW-88). DERIVADA (P1, D-BBW-109): es la unión, por fórmula, de la entrada, las tarjetas y la trayectoria de «Cómo trabajo» en la página de perfil, que son su fuente; aquí no se escribe. No se emite en los datos estructurados.",
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
    doc: "Credenciales verificables (Person.hasCredential): nombre, emisor, categoría (credentialCategory, opcional) y la llave de $.links con la dirección pública de la credencial.",
  },
  image: {
    kind: "media",
    source: { kind: "own" },
    emits: "image",
    translatable: false,
    cms: "media",
    visible: "img",
    doc: "Imagen de la persona (Person.image), por el puerto de medios: un identificador de src/media (derivado o conjunto de recortes), nunca una ruta. Se emite solo si el retrato está publicado y la página lo muestra en un <img>.",
  },
  location: {
    kind: "place",
    source: { kind: "own" },
    emits: "workLocation",
    translatable: false,
    cms: "short-text",
    visible: "text",
    doc: "La base pública de trabajo: localidad y código de país (D-BBW-86, enmendada por D-BBW-93), nunca un domicilio (P-BBW-78). Person.workLocation (no homeLocation: el texto visible dice dónde trabaja, no dónde reside). Se emite si la localidad es visible en la página.",
  },
  sameAs: {
    kind: "linkList",
    source: { kind: "own" },
    emits: "sameAs",
    emittedWhileInherited: true,
    translatable: false,
    cms: "multi-reference",
    visible: "href",
    doc: "Las llaves de $.links que son perfiles de la propia persona (Person.sameAs). Solo las visibles en la página (D-BBW-86: GitHub sale mientras no se enlace). Las demás llaves son otras entidades o referencias.",
  },
  relations: {
    kind: "relationList",
    source: { kind: "own" },
    translatable: false,
    cms: "repeater",
    visible: "none",
    doc: "Otras entidades enlazadas y su relación con la persona (construida · fundada · caso · portafolio-anterior; S3c, D-BBW-92). No se emite hasta que existan sus nodos de organización (fase 2).",
  },
} as const satisfies Record<string, EntityFieldSpec>;

export type EntityFieldKey = keyof typeof ENTITY_FIELDS;
export const ENTITY_FIELD_KEYS = Object.keys(ENTITY_FIELDS) as readonly EntityFieldKey[];

export function fieldSpec(key: EntityFieldKey): EntityFieldSpec {
  return ENTITY_FIELDS[key];
}

/**
 * EL MÍNIMO para que la página de perfil se declare `ProfilePage` (D-BBW-116: nombre, URL e imagen visibles; la URL es la de la página, siempre
 * presente). `description` y `sameAs` son opcionales: se emiten si están visibles y su ausencia no suprime `ProfilePage` (Google, «ProfilePage
 * structured data», act. 2026-09-08: `name` obligatorio). Se activa cuando TODOS se EMITAN (aprobados y visibles en esa página); sin él, la
 * página emite solo el `Person`.
 */
export const PROFILE_PAGE_MINIMUM = ["name", "image"] as const satisfies readonly EntityFieldKey[];

/** Categorías de credencial admitidas (`EducationalOccupationalCredential.credentialCategory`), cerradas. S3c: la de la credencial de la página de perfil. */
export const CREDENTIAL_CATEGORIES = ["certification"] as const;
export type CredentialCategory = (typeof CREDENTIAL_CATEGORIES)[number];
