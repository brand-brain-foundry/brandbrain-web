/**
 * El atributo que marca el control del pie («Configurar cookies»). Vive en su propio módulo, sin `"use client"`, para que el pie
 * (componente de servidor) pueda importarlo como cadena: lo que se exporta desde un módulo de cliente llega a un componente de
 * servidor como referencia de cliente, no como valor.
 */
export const CONSENT_CONFIGURE_ATTR = "data-consent-configure";
