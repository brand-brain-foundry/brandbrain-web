/**
 * El atributo que marca el control del pie («Configurar cookies»). Vive en su propio módulo, sin `"use client"`, para que el pie
 * (componente de servidor) pueda importarlo como cadena: lo que se exporta desde un módulo de cliente llega a un componente de
 * servidor como referencia de cliente, no como valor.
 */
export const CONSENT_CONFIGURE_ATTR = "data-consent-configure";

/**
 * SELLO SEGÚN SOLAPE (2026-11-06, sigue P-BBW-82; BEHAVIOR.md §13). Dos marcas GENÉRICAS, desacopladas del sello:
 *   · `data-bar-avoid` la lleva en el HTML servido toda pieza que no deba quedar pisada por la barra (hoy, solo el sello del pie,
 *     `Footer.tsx`). Es una marca estática: declara «obsérvame», no un estado (I-4).
 *   · `data-bar-covered` la ESCRIBE el cableado de la barra en cada pieza marcada mientras la barra la tapa, aunque sea en parte, y la retira
 *     al destaparla o al bajar la barra. Es la ÚNICA fuente de ese estado (I-6): la decide un `IntersectionObserver` con la misma medida que la
 *     reserva (`--bbf-consent-reserve`), y la LEE el CSS de la pieza (hoy `Footer.module.css`, selector `.cert[data-bar-covered]`; CSS no puede
 *     importar esta constante, así que el nombre se repite ahí una vez, con este módulo como referencia). El HTML servido nunca la trae:
 *     sin JavaScript o con elección guardada la pieza está visible desde el primer byte.
 * Sustituyen al atributo `data-consent-bar` de `<html>` («barra a la vista → sello oculto», sello y banner): sin lector, se retira (I-6).
 */
export const BAR_AVOID_ATTR = "data-bar-avoid";
export const BAR_COVERED_ATTR = "data-bar-covered";
