/**
 * IDENTIDAD EDITABLE DEL SITIO — el documento `content/site.json` leído, validado y derivado (D-BBW-78).
 *
 * POR QUÉ EXISTE. Hasta D-BBW-77 el nombre, el cargo, el buzón y los destinos de los enlaces vivían en `src/config/site.ts`, que es
 * código. Era una fuente única —correcta en eso— y era **la fuente equivocada para quien edita**: cambiar a dónde apunta un enlace
 * del menú exigía tocar un archivo de TypeScript. D-BBW-78 los baja a datos y deja en `config/site.ts` solo lo TÉCNICO (dominio
 * canónico, locales, rutas), cuyo cambio es una decisión de despliegue y no de redacción. **La fuente sigue siendo única**: estos
 * valores se escriben UNA vez, en `content/site.json`, y todo lo demás —la canónica no, que es técnica, pero sí los datos
 * estructurados, el manifiesto, el pie, la navegación y las sustituciones— los LEE de aquí. Enmienda el punto de UBICACIÓN de
 * D-BBW-58 («nombre y contacto viven SOLO en src/config/site.ts») y de D-BBW-61 («el cargo vive en la fuente única y no en content/»),
 * no su sustancia: la cadena sigue siendo una sola, completa y sin variantes (biblia v4 §4).
 *
 * POR QUÉ EL DOCUMENTO NO VIVE DENTRO DE UN LOCALE. El nombre de una persona, su buzón y las direcciones a las que apunta el sitio
 * **no se traducen**: ponerlos en `content/<locale>/` obligaría a repetirlos en cuanto se publique el inglés, que es exactamente lo
 * que esta decisión prohíbe. Por eso el documento está en la RAÍZ de `content/` y la guardia admite ese archivo y ningún otro.
 * El `role` viaja con ellos por ahora y es el único de los cuatro que un día podría querer traducirse: cuando exista copy EN, pasa al
 * documento global del locale, y el esquema estricto nombrará la llave en la compilación. Dicho aquí para que no parezca olvido.
 *
 * POR QUÉ LA GARANTÍA DE COMPILACIÓN NO SE DEBILITA AL PASAR A JSON. El documento se importa como MÓDULO (`resolveJsonModule`), así que
 * TypeScript infiere sus llaves: `LinkKey` se deriva de las llaves reales del archivo y una llave de enlace inexistente en el contenido
 * sigue siendo un error de TIPOS, igual que cuando los enlaces eran un `as const`. Encima de eso, `validateSite` comprueba lo que los
 * tipos no pueden —llave de más, texto vacío, HTML, correo mal formado, destino no absoluto ni cifrado— y **el PUERTO lo ejecuta y
 * rompe `next build`** (src/content/index.ts), mientras la GUARDIA lo ejecuta sobre el árbol e informa con ruta exacta. Estricto en los
 * dos sentidos, como el resto del modelo. La validación NO corre aquí al cargar el módulo a propósito: este módulo lo importa la propia
 * guardia, y un `throw` en su carga la mataría antes de que pudiera emitir su informe.
 *
 * D-DOC-06: este documento es DATO. Se parsea y se valida; jamás se interpreta ni se ejecuta.
 */
import document from "../../content/site.json";
import type { Problem } from "./schema";

/** La forma del documento del sitio. Las llaves de `links` NO están fijadas aquí: las pone el archivo, y de ahí sale `LinkKey`. */
export type SiteDocument = {
  /** la cadena del nombre, completa y sin variantes (biblia v4 §4). Es el nombre del sitio y el del sujeto que lo publica. */
  brand: string;
  /** el cargo, capa de la arquitectura de nombres (biblia v4 §4). Misma cadena en el pie y en `jobTitle` por construcción. */
  role: string;
  /** el buzón publicado. El esquema `mailto:` NO se escribe aquí: es técnico y lo pone el código (abajo). */
  email: string;
  /** a dónde apunta la web fuera de sí misma, nombrado por ROL y nunca por lo que muestra. */
  links: Record<string, string>;
};

const HTML_RE = /<\/?[a-zA-Z!]/;
const ABSOLUTE_RE = /^https:\/\/[^\s]+$/;
const ROLE_KEY_RE = /^[a-z][a-zA-Z0-9]*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Texto plano no vacío y sin HTML. Mismo criterio que `checkText` del esquema: el contenido dice qué, el sistema dice cómo. */
function checkText(v: unknown, path: string, problems: Problem[]): void {
  if (typeof v !== "string") return void problems.push({ path, message: `falta la llave o no es texto` });
  if (v.trim().length === 0) problems.push({ path, message: `texto vacío` });
  else if (HTML_RE.test(v)) problems.push({ path, message: `contiene HTML: el contenido es texto plano` });
}

/**
 * Validador ESTRICTO del documento del sitio: ni una llave de más (presentación o dato colado), ni una de menos.
 * Los destinos se exigen ABSOLUTOS y cifrados (`https://`): una ruta relativa aquí sería una ruta interna, que es técnica y no vive
 * en datos; y `http://` publicaría un salto sin cifrar (biblia v4 §12, «HTTPS forzado»).
 */
export function validateSite(v: unknown): Problem[] {
  const problems: Problem[] = [];
  if (!isRecord(v)) return [{ path: "$", message: "el documento debe ser un objeto" }];
  const allowed = ["brand", "role", "email", "links"];
  for (const k of Object.keys(v)) {
    if (!allowed.includes(k)) problems.push({ path: `$.${k}`, message: `llave desconocida (el modelo no la admite)` });
  }
  checkText(v.brand, "$.brand", problems);
  checkText(v.role, "$.role", problems);
  checkText(v.email, "$.email", problems);
  if (typeof v.email === "string" && v.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
    problems.push({ path: "$.email", message: `no es una dirección de correo (el esquema "mailto:" lo pone el código, aquí va solo la dirección)` });
  }
  if (!isRecord(v.links)) {
    problems.push({ path: "$.links", message: `debe ser un objeto { rol: dirección }` });
    return problems;
  }
  if (Object.keys(v.links).length === 0) problems.push({ path: "$.links", message: `sin ningún enlace` });
  for (const [k, url] of Object.entries(v.links)) {
    if (!ROLE_KEY_RE.test(k)) problems.push({ path: `$.links.${k}`, message: `nombre de rol inválido (minúsculas y dígitos, empieza por letra)` });
    if (k === "contact") problems.push({ path: `$.links.${k}`, message: `reservada: el código la DERIVA de $.email, y escribirla aquí repetiría el buzón` });
    if (typeof url !== "string" || !ABSOLUTE_RE.test(url)) {
      problems.push({ path: `$.links.${k}`, message: `"${String(url)}" no es una dirección absoluta y cifrada (https://…)` });
    }
  }
  return problems;
}

/** El documento tal cual, para que el puerto lo valide (fail-closed) y la guardia lo informe. */
export const siteDocument: unknown = document;

/**
 * LA IDENTIDAD EDITABLE, ya derivada. `contact` NO está en el archivo: el código la compone con `mailto:` + el buzón, porque el
 * esquema de URL es técnico y porque escribirla en datos guardaría la dirección DOS veces, que es justo lo que D-BBW-78 prohíbe.
 */
export const identity = {
  brand: document.brand,
  role: document.role,
  email: document.email,
  links: { ...document.links, contact: `mailto:${document.email}` },
} as const;

/** Las llaves de enlace admitidas: las del documento (inferidas por TypeScript) más la derivada. Una inexistente es error de tipos. */
export type LinkKey = keyof typeof identity.links;

const LINK_KEYS: readonly string[] = Object.keys(identity.links);

export function isLinkKey(value: string): value is LinkKey {
  return LINK_KEYS.includes(value);
}
