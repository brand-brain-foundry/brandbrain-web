/**
 * S10 · CONSENTIMIENTO — la preferencia y su juicio (P-BBW-82, L3 §0.1 «Preferencia»; docs/system/BEHAVIOR.md §13).
 *
 * Qué hace: guarda y lee la elección sobre la medición de visitas como preferencia TÉCNICA del navegador (almacenamiento local,
 * exenta del consentimiento: solo conserva la elección), con FECHA y VERSIÓN; juzga si una elección guardada sigue valiendo
 * (misma versión y menos de `CONSENT_MONTHS` meses). Sin JSX, sin CSS, sin texto (BEHAVIOR.md §1.1). El componente cliente
 * (`src/components/organisms/ConsentBar/`) solo cablea.
 *
 * Constantes: las TRES (llave, meses, versión) viven en `src/config/consent.ts` y este módulo las importa; no las repite.
 * El texto de la página de Cookies las lee por sustitución del mismo módulo (I-1).
 *
 * Fail-safe (requisito 1 del despacho): toda lectura y escritura va en `try/catch`. Si el navegador no deja guardar (modo
 * privado, almacenamiento bloqueado, cuota), la preferencia se comporta como «sin decidir»: el banner vuelve a salir y NO se
 * carga nada. El estado por defecto, sin JavaScript y sin preferencia, es «sin analítica».
 *
 * D-DOC-06: lo que se lee del almacenamiento es DATO. Se parsea y se valida campo a campo; jamás se interpreta ni se ejecuta.
 */
import { CONSENT_MONTHS, CONSENT_STORAGE_KEY, CONSENT_VERSION } from "../config/consent";

/** La elección guardada: versión de las finalidades, instante (ISO 8601) y si la medición se aceptó. */
export type ConsentRecord = {
  v: string;
  t: string;
  analytics: boolean;
};

/** Qué sabe el documento de la preferencia: nada válido (hay que preguntar) o una elección vigente. */
export type ConsentState = { status: "undecided" } | { status: "decided"; analytics: boolean };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Milisegundos de validez: meses × días medios del mes. La cota es la que importa, no el calendario exacto. */
const MS_PER_MONTH = 30.44 * 24 * 60 * 60 * 1000;

/**
 * Juzga un registro: vale si trae la versión vigente, una fecha legible y no ha pasado la validez. Función PURA (sin DOM) para
 * que se pueda comprobar con registros de versión antigua o con fecha pasada (F5.6 del despacho).
 */
export function isValidRecord(raw: unknown, now: Date = new Date()): raw is ConsentRecord {
  if (!isRecord(raw)) return false;
  if (raw.v !== CONSENT_VERSION) return false;
  if (typeof raw.analytics !== "boolean") return false;
  if (typeof raw.t !== "string") return false;
  const t = Date.parse(raw.t);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  if (age < 0) return false; // una fecha futura es un registro que no se escribió aquí
  return age < CONSENT_MONTHS * MS_PER_MONTH;
}

/** Lee la preferencia del navegador. Cualquier fallo (sin almacenamiento, JSON roto, registro inválido o caducado) = sin decidir. */
export function readConsent(now: Date = new Date()): ConsentState {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === null) return { status: "undecided" };
    const parsed: unknown = JSON.parse(raw);
    if (!isValidRecord(parsed, now)) return { status: "undecided" };
    return { status: "decided", analytics: parsed.analytics };
  } catch {
    return { status: "undecided" };
  }
}

/**
 * Guarda la elección con la versión vigente y la fecha de ahora. Devuelve si se pudo guardar: si no, quien llama sabe que en la
 * próxima visita se volverá a preguntar (y, por el fail-safe, que nada se cargará por su cuenta).
 */
export function writeConsent(analytics: boolean, now: Date = new Date()): boolean {
  const record: ConsentRecord = { v: CONSENT_VERSION, t: now.toISOString(), analytics };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** Borra la preferencia (vuelve a «sin decidir»). Silencioso si no hay almacenamiento. */
export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* sin almacenamiento: no había nada que borrar */
  }
}
