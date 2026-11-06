/**
 * El atributo que marca el control del pie («Configurar cookies»). Vive en su propio módulo, sin `"use client"`, para que el pie
 * (componente de servidor) pueda importarlo como cadena: lo que se exporta desde un módulo de cliente llega a un componente de
 * servidor como referencia de cliente, no como valor.
 */
export const CONSENT_CONFIGURE_ATTR = "data-consent-configure";

/**
 * El atributo con el que el cableado del consentimiento EXPONE EN EL DOCUMENTO (`<html>`) que la barra está a la vista: presente mientras
 * se muestra, ausente en cuanto baja (elección tomada), con una elección guardada y sin JavaScript. Es la ÚNICA fuente de ese estado (I-6):
 * lo escribe el mismo efecto que mide la reserva (`--bbf-consent-reserve`) y lo LEE el CSS de quien tenga que reaccionar (hoy, el sello del
 * pie en `Footer.module.css`, que lo cita como selector `:root[data-consent-bar]`; CSS no puede importar esta constante, así que el nombre se
 * repite ahí una vez, con este módulo como referencia). El HTML servido no lo trae (I-4): el sello nace visible y solo el script lo oculta.
 */
export const CONSENT_BAR_ATTR = "data-consent-bar";
