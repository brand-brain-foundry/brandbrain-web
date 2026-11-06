"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ConsentDocument, Span } from "@/content/schema";
import { identity } from "@/content/site";
import { analytics, shouldMeasure } from "@/analytics/port";
import { readConsent, writeConsent } from "@/behavior/consent";
import { Button } from "@/components/atoms/Button";
import { CONSENT_BAR_ATTR, CONSENT_CONFIGURE_ATTR } from "./attr";
import styles from "./ConsentBar.module.css";

/** El rol que el cableado rellena con la altura medida de la barra para que el pie quede alcanzable (base/document.css). */
const RESERVE_ROLE = "--bbf-consent-reserve";

/** Evento propio que avisa de un cambio de preferencia en esta pestaña (el evento `storage` solo llega a las otras). */
const CONSENT_EVENT = "bbf-consent-change";

/**
 * La preferencia como ALMACÉN EXTERNO (`useSyncExternalStore`): el navegador es la fuente, no el estado de React. En el servidor y
 * durante la hidratación la instantánea es `unknown` (la barra sale oculta en el HTML, I-4); en el cliente, lo que diga el almacén.
 */
type Snapshot = "unknown" | "undecided" | "accepted" | "rejected";
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}
function getSnapshot(): Snapshot {
  const state = readConsent();
  if (state.status === "undecided") return "undecided";
  return state.analytics ? "accepted" : "rejected";
}
const getServerSnapshot = (): Snapshot => "unknown";

/** Un tramo del texto del banner, ya resuelto por el puerto: texto, enlace interno `{ path }` o externo `{ link }`. */
function renderSpan(span: Span, key: number) {
  if (typeof span === "string") return span;
  if ("path" in span) {
    return (
      <a key={key} href={span.path} className={styles.link} data-scatter="prose">
        {span.text}
      </a>
    );
  }
  if ("link" in span) {
    return (
      <a key={key} href={identity.links[span.link]} className={styles.link} data-scatter="prose" target="_blank" rel="noopener noreferrer">
        {span.text}
      </a>
    );
  }
  return null; // `{ page }` y `{ global }` nunca llegan: el puerto los resuelve antes de entregar el documento
}

/**
 * ConsentBar — organism cliente (P-BBW-82, L3 §0.1 «Banner» y «Preferencia»). Vive en el layout: sale en todas las páginas.
 *
 * I-4 · HTML COMPLETO Y REPOSO: el documento servido trae la barra y el panel ENTEROS, con todo su texto, y la barra OCULTA
 * (`hidden`). Sin JavaScript no se ve nada y no se carga nada: el estado por defecto es «sin analítica» (requisito 1). El cableado
 * solo la muestra si no hay una elección válida guardada (`readConsent`, con fecha y versión; requisito 5).
 *
 * LO QUE CABLEA, y nada más (BEHAVIOR.md §1.4): la preferencia es de `src/behavior/consent.ts`; la medición, del puerto
 * `src/analytics/port.ts`; los textos, de `content/` por props.
 *   · «Rechazar» / «Aceptar» / «Configurar» en la barra, al mismo nivel (mismo átomo, misma variante); sin X; seguir navegando no decide.
 *   · El panel es un `<dialog>` nativo abierto con `showModal()`: foco dentro al abrir, Esc cierra SIN aceptar y el foco vuelve
 *     al control que lo abrió. El interruptor de la medición arranca apagado (o en la elección vigente, si la hay).
 *   · El control del pie (`[data-consent-configure]`): un enlace a la página de Cookies en el HTML; con JavaScript, `preventDefault`
 *     y abre el panel. Se escucha por delegación en el documento para no convertir el pie en cliente.
 *   · Retirar: si había aceptación y pasa a rechazo, el puerto cierra la puerta (`block()`) y la página se recarga para que el
 *     fragmento desaparezca; a partir de ahí, cero peticiones (requisito 3, F5.4).
 *   · La barra es FIJA abajo y no bloquea (región con nombre, no un diálogo). SIN RÓTULO VISIBLE (2026-11-06, orden de Zavala): la llave
 *     `banner.label` sigue en `content/` y es el NOMBRE ACCESIBLE de la región (`aria-label`); el texto empieza en la primera frase.
 *   · Va en la capa más alta del sistema (`--bbf-layer-toggle`): nada asoma por encima de ella (el sello del pie lo hacía) y, con la hoja de
 *     navegación del teléfono abierta, sus enlaces siguen alcanzables porque quedan por encima de la barra (medido a 360 y 390).
 *   · Para que no tape el pie sin forma de alcanzarlo
 *     (F5.8), su altura medida se escribe en el rol `--bbf-consent-reserve`, que `body` consume como margen inferior: el documento
 *     crece justo lo que la barra ocupa y el pie queda a la vista al desplazarse.
 *   · EL ESTADO «BARRA A LA VISTA» SE EXPONE UNA SOLA VEZ (2026-11-06, P-BBW-82, sello y banner): el mismo efecto que escribe la reserva pone
 *     `data-consent-bar` en `<html>` mientras la barra se muestra y lo quita al bajar. Quien tenga que reaccionar (el sello del pie) lo LEE en
 *     CSS; nadie vuelve a calcular si la barra está visible (I-6). Sin JavaScript o con elección guardada el atributo no existe (I-4).
 *   · Sin animación de entrada, con o sin movimiento reducido (I-9).
 */
export function ConsentBar({ consent }: { consent: ConsentDocument }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Si el navegador no deja guardar, la instantánea sigue en «sin decidir»: la barra se retira solo en esta vista y nada se carga.
  const [dismissed, setDismissed] = useState(false);
  const [measurement, setMeasurement] = useState(false);
  const visible = snapshot === "undecided" && !dismissed;
  const bar = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const switchId = useId();

  /** Guarda la elección, cierra la barra y aplica la consecuencia: cargar la medición, o cerrarle la puerta y recargar. */
  const decide = useCallback(
    (analyticsAllowed: boolean) => {
      const wasAccepted = snapshot === "accepted";
      writeConsent(analyticsAllowed);
      window.dispatchEvent(new Event(CONSENT_EVENT));
      setDismissed(true);
      setMeasurement(analyticsAllowed);
      if (analyticsAllowed) {
        if (shouldMeasure(window.location.pathname)) analytics.load();
        return;
      }
      if (wasAccepted) {
        analytics.block();
        window.location.reload();
      }
    },
    [snapshot],
  );

  const openPanel = useCallback(
    (from: HTMLElement | null) => {
      const d = dialog.current;
      if (!d || d.open) return;
      opener.current = from;
      setMeasurement(snapshot === "accepted");
      d.showModal();
    },
    [snapshot],
  );

  const closePanel = useCallback(() => {
    dialog.current?.close();
  }, []);

  // Con una aceptación vigente, la medición entra (solo en rutas medidas). El puerto es idempotente: repetirlo no carga dos veces.
  useEffect(() => {
    if (snapshot === "accepted" && shouldMeasure(window.location.pathname)) analytics.load();
  }, [snapshot]);

  // El control del pie abre el panel (delegación en el documento; el pie sigue siendo un componente de servidor).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(`[${CONSENT_CONFIGURE_ATTR}]`) : null;
      if (!target) return;
      event.preventDefault();
      openPanel(target);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openPanel]);

  // Al cerrar el panel (botón, Esc o clic fuera), el foco vuelve al control que lo abrió.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      opener.current?.focus();
      opener.current = null;
    };
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === d) d.close();
    };
    d.addEventListener("close", onClose);
    d.addEventListener("click", onBackdropClick);
    return () => {
      d.removeEventListener("close", onClose);
      d.removeEventListener("click", onBackdropClick);
    };
  }, []);

  // La reserva y el estado, del mismo efecto: la altura real de la barra, medida, al rol que `body` consume, y el atributo `data-consent-bar`
  // en `<html>` mientras la barra está a la vista. Al bajar (o sin barra) se retiran los dos.
  useEffect(() => {
    const root = document.documentElement;
    const el = bar.current;
    const clear = () => {
      root.style.removeProperty(RESERVE_ROLE);
      root.removeAttribute(CONSENT_BAR_ATTR);
    };
    if (!visible || !el) {
      clear();
      return;
    }
    root.setAttribute(CONSENT_BAR_ATTR, "");
    const apply = () => root.style.setProperty(RESERVE_ROLE, `${Math.ceil(el.getBoundingClientRect().height)}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      clear();
    };
  }, [visible]);

  return (
    <>
      <section ref={bar} className={styles.bar} hidden={!visible} aria-label={consent.banner.label} data-component="bbf-consent-bar">
        <p className={styles.text}>{consent.banner.text.map((span, i) => renderSpan(span, i))}</p>
        <div className={styles.actions}>
          <Button onClick={() => decide(false)}>{consent.banner.reject}</Button>
          <Button onClick={() => decide(true)}>{consent.banner.accept}</Button>
          <Button onClick={(event) => openPanel(event.currentTarget)}>{consent.banner.configure}</Button>
        </div>
      </section>

      <dialog ref={dialog} className={styles.panel} aria-labelledby={titleId} data-component="bbf-consent-panel">
        <div className={styles.panelBody}>
          <h2 id={titleId} className={styles.title}>
            {consent.panel.title}
          </h2>
          <div className={styles.option}>
            <div className={styles.optionText}>
              <span className={styles.optionLabel}>{consent.panel.necessary.label}</span>
              <span className={styles.optionStatus}>{consent.panel.necessary.status}</span>
              <span className={styles.optionDetail}>{consent.panel.necessary.text}</span>
            </div>
            <input type="checkbox" role="switch" className={styles.switch} checked disabled readOnly aria-label={consent.panel.necessary.label} />
          </div>
          <div className={styles.option}>
            <label htmlFor={switchId} className={styles.optionText}>
              <span className={styles.optionLabel}>{consent.panel.measurement.label}</span>
              <span className={styles.optionDetail}>{consent.panel.measurement.text}</span>
            </label>
            <input
              id={switchId}
              type="checkbox"
              role="switch"
              className={styles.switch}
              checked={measurement}
              onChange={(event) => setMeasurement(event.target.checked)}
            />
          </div>
          <div className={styles.panelActions}>
            <Button
              onClick={() => {
                decide(false);
                closePanel();
              }}
            >
              {consent.panel.rejectAll}
            </Button>
            <Button
              onClick={() => {
                decide(true);
                closePanel();
              }}
            >
              {consent.panel.acceptAll}
            </Button>
            <Button
              onClick={() => {
                decide(measurement);
                closePanel();
              }}
            >
              {consent.panel.save}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
