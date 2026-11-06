/**
 * CONSENTIMIENTO — CONFIGURACIÓN TÉCNICA (P-BBW-82, L3 §0.1 «Preferencia»).
 *
 * Tres constantes, UNA sola vez: el nombre de la llave de almacenamiento, la validez de la elección en meses y la versión de las
 * finalidades. Las lee el módulo de comportamiento (`src/behavior/consent.ts`) para guardar y juzgar la preferencia, y las lee el
 * registro de sustituciones (`src/content/substitutions.ts`) para que la página de Cookies escriba `{{consentKey}}` y
 * `{{consentMonths}}` en vez de repetirlas: el texto y el comportamiento no pueden divergir (I-1).
 *
 * Son TÉCNICAS (viven en código, no en `content/`): cambiar el nombre de la llave o la validez no es una decisión de redacción.
 * Requisito 5 del despacho (AEPD, Guía de cookies, mayo de 2024): la elección se conserva con fecha y versión y se vuelve a pedir
 * a los 24 meses o si cambia la versión. Subir `CONSENT_VERSION` es la forma de volver a preguntar a todo el mundo cuando cambien
 * las finalidades descritas en la página de Cookies.
 */

/** Nombre de la preferencia guardada en el navegador (almacenamiento local, técnica y exenta: conserva la elección). */
export const CONSENT_STORAGE_KEY = "bbf-consent";

/** Validez de la elección, en meses. Pasados, se vuelve a preguntar. */
export const CONSENT_MONTHS = 24;

/** Versión de las finalidades. Una preferencia guardada con otra versión no vale: se vuelve a preguntar. */
export const CONSENT_VERSION = "1";
