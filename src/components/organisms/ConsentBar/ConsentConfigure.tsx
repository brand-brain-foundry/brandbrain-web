"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/atoms/Button";
import { CONSENT_CONFIGURE_ATTR } from "./attr";
import styles from "./ConsentConfigure.module.css";

/** Sin suscripción: la instantánea solo distingue el documento SERVIDO (y la hidratación) del cliente vivo. */
const subscribe = () => () => {};
const live = () => true;
const served = () => false;

/**
 * ConsentConfigure — el botón «Configurar cookies» (P-BBW-82 enmienda 1, 2026-11-06; BEHAVIOR.md §13). Vive al principio de la página de
 * Cookies, tras la introducción, porque la sección legal lo declara (`action: { kind: "consent-configure" }`, modelo v3.8); el texto llega
 * por props desde `content/` (`consent.configureButton`, una sola fuente). Sustituye al enlace del pie: retirar la elección es tan fácil como
 * darla, desde la página que la explica (RGPD art. 7.3).
 *
 * MISMO ÁTOMO Y MISMA VARIANTE que los botones del banner (`Button`): no existe otra que elegir. SOLO CABLEA: lleva la marca
 * `data-consent-configure`, que el organismo del consentimiento escucha por delegación en el documento y con la que abre el panel; el foco
 * vuelve aquí al cerrarlo. Ninguna lógica de preferencia vive aquí.
 *
 * SIN JAVASCRIPT NO SE MUESTRA (el panel no existe sin él): el HTML servido trae el botón con su caja RESERVADA pero `visibility: hidden` —ni se
 * pinta, ni recibe el foco, ni está en el árbol de accesibilidad— y el cliente lo descubre al hidratar (`useSyncExternalStore`: instantánea
 * `false` en el servidor y durante la hidratación, `true` después; sin desajuste de hidratación). Reservar la caja es lo que evita el salto de
 * disposición al aparecer (CLS 0): el precio es un hueco del alto del botón en la página sin JavaScript, dicho aquí.
 */
export function ConsentConfigure({ label }: { label: string }) {
  const hydrated = useSyncExternalStore(subscribe, live, served);
  return (
    <div className={styles.action}>
      <Button className={hydrated ? undefined : styles.served} data-component="bbf-consent-configure" {...{ [CONSENT_CONFIGURE_ATTR]: "" }}>
        {label}
      </Button>
    </div>
  );
}
