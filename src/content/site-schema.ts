/**
 * EL ESQUEMA EXPORTABLE DEL DOCUMENTO DEL SITIO (S2 · P-BBW-95, §0.2.5): JSON Schema (borrador 2020-12) DERIVADO de la misma descripción
 * que valida el bloque de entidad (`./entity-fields.ts`) y del validador del documento (`./site.ts`). Un gestor de contenido lo importa tal
 * cual; una persona lo lee. Se escribe en `content/site.schema.json` con `pnpm content:schema` y NUNCA a mano: la guardia R1
 * (`scripts/lint/check-content.ts`) falla si el fichero versionado no coincide con lo que esta función devuelve.
 *
 * Sin dependencias: el esquema se construye como objeto y se serializa. Las palabras clave `x-…` son extensiones que un gestor puede leer
 * (tipo de campo, traducible, sustitución, propiedad emitida) y que cualquier validador de JSON Schema ignora.
 *
 * Las llaves de enlace y los identificadores de medios se ENUMERAN desde los datos reales: así el esquema es exacto hoy y, cuando cambie una
 * llave, la guardia pide regenerarlo (una línea), en vez de admitir cualquier cadena.
 */
import { CREDENTIAL_CATEGORIES, ENTITY_FIELDS, ENTITY_FIELD_KEYS, ENTITY_STATUSES, PROFILE_PAGE_MINIMUM, RELATION_KINDS, type EntityFieldSpec } from "./entity-fields";

type Json = Record<string, unknown>;

const TEXT: Json = { type: "string", minLength: 1, pattern: "^(?![\\s\\S]*<\\/?[a-zA-Z!])", description: "Texto plano, no vacío, sin HTML." };

function valueSchema(spec: EntityFieldSpec, linkKeys: readonly string[], mediaIds: readonly string[]): Json {
  const link: Json = { type: "string", enum: [...linkKeys], description: "Una llave de $.links (nunca una dirección)." };
  switch (spec.kind) {
    case "text":
      return TEXT;
    case "textList":
      return { type: "array", items: TEXT };
    case "credentialList":
      return {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "link"],
          properties: { name: TEXT, issuer: TEXT, category: { type: "string", enum: [...CREDENTIAL_CATEGORIES] }, link },
        },
      };
    case "media":
      return { type: "string", enum: [...mediaIds], description: "Un identificador del puerto de medios (src/media: derivado o conjunto de recortes), nunca una ruta." };
    case "place":
      return {
        type: "object",
        additionalProperties: false,
        required: ["locality", "country"],
        properties: { locality: TEXT, country: { type: "string", pattern: "^[A-Z]{2}$", description: "Código de país ISO 3166-1 alfa-2." } },
        description: "Un lugar público: localidad y país. Nunca una dirección.",
      };
    case "linkList":
      return { type: "array", items: link };
    case "relationList":
      return {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["link", "kind"],
          properties: { link, kind: { type: "string", enum: [...RELATION_KINDS] } },
        },
      };
  }
}

function fieldSchema(key: string, spec: EntityFieldSpec, linkKeys: readonly string[], mediaIds: readonly string[]): Json {
  const status: Json = { type: "string", enum: [...ENTITY_STATUSES], description: "aprobado: decidido por Zavala · heredado: existe pero viene de otro sitio · pendiente: declarado y vacío." };
  const base: Json = {
    type: "object",
    description: spec.doc,
    additionalProperties: false,
    required: ["status"],
    "x-kind": spec.kind,
    "x-cms": spec.cms,
    "x-translatable": spec.translatable,
    ...(spec.emits ? { "x-emits": `Person.${spec.emits}` } : {}),
    ...(spec.substitution ? { "x-substitution": `{{${spec.substitution}}}` } : {}),
  };
  if (spec.source.kind === "site") {
    return {
      ...base,
      "x-source": `$.${spec.source.key}`,
      properties: { status: { ...status, enum: ENTITY_STATUSES.filter((s) => s !== "pendiente") } },
    };
  }
  if (spec.source.kind === "derived") {
    return {
      ...base,
      "x-source": `derived:${spec.source.rule}`,
      "x-derived-from": "pages/<página de perfil>.sections[profile].approach (intro + steps[].text + background.text)",
      readOnly: true,
      properties: { status: { ...status, enum: ENTITY_STATUSES.filter((s) => s !== "heredado") } },
    };
  }
  const value = valueSchema(spec, linkKeys, mediaIds);
  const conditions: Json[] = [
    { if: { properties: { status: { const: "pendiente" } } }, then: { not: { required: ["value"] } } },
    { if: { properties: { status: { const: "aprobado" } } }, then: { required: ["value"] } },
  ];
  if (spec.inheritedFrom) {
    conditions.push({ if: { properties: { status: { const: "heredado" } } }, then: { not: { required: ["value"] } } });
    base["x-inherited-from"] = `pages/${spec.inheritedFrom.page}.${spec.inheritedFrom.path}`;
  } else {
    conditions.push({ if: { properties: { status: { const: "heredado" } } }, then: { required: ["value"] } });
  }
  return { ...base, "x-source": "$.entity." + key + ".value", properties: { status, value }, allOf: conditions };
}

/** El esquema del documento entero (`content/site.json`): identidad editable (D-BBW-78) + bloque de entidad (S2). */
export function buildSiteSchema(linkKeys: readonly string[], mediaIds: readonly string[]): Json {
  const entityProperties: Json = {};
  for (const key of ENTITY_FIELD_KEYS) entityProperties[key] = fieldSchema(key, ENTITY_FIELDS[key], linkKeys, mediaIds);
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Documento del sitio — brandbrain-web (content/site.json)",
    description:
      "La identidad editable (nombre, cargo, buzón, forma jurídica, destinos de los enlaces; D-BBW-78) y el bloque de entidad (S2, P-BBW-95). " +
      "Generado desde src/content/{site,entity-fields,site-schema}.ts por `pnpm content:schema`; no se edita a mano.",
    type: "object",
    additionalProperties: false,
    required: ["brand", "role", "email", "legalForm", "links", "entity"],
    properties: {
      brand: { ...TEXT, description: "El nombre: una sola cadena, completa y sin variantes (D-BBW-58).", "x-cms": "short-text" },
      role: { ...TEXT, description: "El cargo (D-BBW-61).", "x-cms": "short-text", "x-translatable": true },
      email: { type: "string", format: "email", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", description: "El buzón publicado, sin «mailto:» (lo pone el código).", "x-cms": "email" },
      legalForm: { ...TEXT, description: "La forma jurídica, para los textos legales por {{legalForm}} (P-BBW-80).", "x-cms": "short-text", "x-translatable": true },
      links: {
        type: "object",
        description: "A dónde apunta la web fuera de sí misma, por ROL. Destinos absolutos y cifrados. «contact» es reservada: el código la deriva de $.email.",
        minProperties: 1,
        propertyNames: { pattern: "^[a-z][a-zA-Z0-9]*$", not: { const: "contact" } },
        additionalProperties: { type: "string", pattern: "^https://[^\\s]+$" },
        "x-cms": "repeater",
      },
      entity: {
        type: "object",
        description:
          "Lo que hace citable a la persona. Cada campo con su estado; un campo entra en los datos estructurados solo si está aprobado y es visible en la página. " +
          `ProfilePage se activa cuando están aprobados: ${PROFILE_PAGE_MINIMUM.join(", ")}.`,
        additionalProperties: false,
        required: [...ENTITY_FIELD_KEYS],
        properties: entityProperties,
      },
    },
  };
}

/** El texto exacto que se versiona (determinista: mismo código y mismos datos ⇒ mismo fichero). */
export function renderSiteSchema(linkKeys: readonly string[], mediaIds: readonly string[]): string {
  return JSON.stringify(buildSiteSchema(linkKeys, mediaIds), null, 2) + "\n";
}
