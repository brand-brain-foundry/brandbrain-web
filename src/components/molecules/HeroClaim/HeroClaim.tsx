"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./HeroClaim.module.css";

/**
 * HeroClaim — molecule CLIENTE. El CLAIM en TRES LÍNEAS alineadas a la izquierda, **en DOS REGISTROS** (D-BBW-64, diagramación de la
 * referencia de Zavala sobre la biblia v4): la PRIMERA en la familia de texto, en mayúsculas y menor (rol `kicker`), y la SEGUNDA y la
 * TERCERA en la display. Cero texto y cero valores aquí.
 *
 * LA ANIMACIÓN DE PESO ESTÁ APAGADA (D-BBW-65). Ninguna línea respira: las tres salen con el peso de reposo de su rol, el mismo que el
 * HTML servido ya traía. **El modulador NO se ha borrado**: `src/behavior/weight-modulator.ts` sigue entero, con su algoritmo, sus
 * constantes y su conservación de ancho, y los roles `--bbf-type-display-weight-from/to` siguen declarados. Lo que se retira es su
 * APLICACIÓN — el reparto en letras, el bucle de `requestAnimationFrame` y el anclaje de la caja. Volver a encenderlo es volver a
 * llamarlo desde aquí, no reconstruirlo: la decisión lo registra como **reversible** y el pendiente dice qué tocar.
 * Lo que se va con la animación, porque solo existía para ella: el reparto en glifos con su `aria-label` y su restauración al desmontar,
 * la quietud por pestaña oculta y por movimiento reducido (sin movimiento no hay nada que detener), y el anclaje de ancho por línea.
 *
 * LO QUE SE QUEDA, porque no era de la animación sino de la COMPOSICIÓN: el afinado del cuerpo con la medida real (D-BBW-40 · D-BBW-42 ·
 * D-BBW-45 · D-BBW-48). El cuerpo de la display es `min(tamaño de rol, guarda)`, y la guarda servida divide entre `--bbf-display-chars`
 * usando el avance MÁXIMO de la familia: es una cota, así que cabe siempre pero casi siempre sobra. El cliente la afina midiendo el texto
 * de verdad. Sin JavaScript queda la cota y el claim cabe igual, solo que más pequeño de lo que podría.
 *
 * EL CUERPO LO FIJA LA MÁS LARGA DE LAS DOS LÍNEAS DISPLAY, no de las tres (D-BBW-64): la primera está en otra familia y a otro cuerpo,
 * así que no tiene voto ni en la cuenta de letras servida ni en la medida del cliente. Meterla falsearía las dos.
 *
 * MEDIDA CON `max-content` (D-BBW-45): una caja que se ajusta queda topada por el disponible, y entonces el cociente del afinado se
 * calcularía a sí mismo y congelaría el cuerpo. La hoja ya pone `width: max-content` en la línea; el ayudante lo fuerza igualmente para
 * no depender de ella.
 *
 * HTML COMPLETO (D-BBW-09/28): el servidor emite las tres líneas como texto literal, con el peso y el cuerpo de reposo de su rol. Ahora
 * el cliente **solo mide**: no parte, no anima y no reemplaza ningún nodo. Sin JavaScript queda exactamente lo servido.
 * ACCESIBILIDAD: sin reparto en letras, las tres líneas son texto normal. El claim NO es un encabezado; el `<h1>` es el párrafo y lo
 * pone la sección.
 */
export function HeroClaim({ lines }: { lines: readonly [string, string, string] }) {
  const rootRef = useRef<HTMLParagraphElement>(null);
  const display1Ref = useRef<HTMLSpanElement>(null);
  const display2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const d1 = display1Ref.current;
    const d2 = display2Ref.current;
    if (!root || !d1 || !d2) return;
    const displayEls: HTMLElement[] = [d1, d2];
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;

    /** Ancho intrínseco de una línea, forzando `max-content` para que el disponible no la tope (D-BBW-45). */
    const naturalWidth = (el: HTMLElement): number => {
      const had = el.style.width;
      el.style.width = "max-content";
      const w = el.getBoundingClientRect().width;
      if (had) el.style.width = had;
      else el.style.removeProperty("width");
      return w;
    };

    /**
     * Afina la guarda con la medida real: `objetivo × cuerpo ÷ ancho de la línea display más ancha`. Punto fijo en un paso — el
     * cociente no depende del cuerpo del que se parta—, pero se repite mientras el cuerpo cambie de verdad, porque al cambiar el
     * cuerpo cambia el ancho medido. Se lee el resultado del documento y no del cálculo: si la guarda no estaba mandando, `min()`
     * se queda con el tamaño del rol y no hay nada que afinar.
     */
    const fit = (): boolean => {
      const cs = getComputedStyle(d1);
      const size = parseFloat(cs.fontSize);
      const target = parseFloat(cs.getPropertyValue("--bbf-lockup-target"));
      if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(target) || target <= 0) return false;
      const widest = Math.max(...displayEls.map(naturalWidth));
      if (!(widest > 0)) return false;
      root.style.setProperty("--bbf-display-fit-measured", ((target * size) / widest).toFixed(3) + "px");
      return Math.abs(parseFloat(getComputedStyle(d1).fontSize) - size) > REFIT_MIN_DELTA_PX;
    };

    let pass = 0;
    const measure = () => {
      if (pass < 2 && fit()) {
        pass += 1;
        measure();
        return;
      }
      pass = 0;
      root.dispatchEvent(
        new CustomEvent("bbf:claim-fitted", {
          bubbles: true,
          detail: {
            display: displayEls.map(naturalWidth),
            avail: parseFloat(getComputedStyle(d1).getPropertyValue("--bbf-lockup-avail")),
            target: parseFloat(getComputedStyle(d1).getPropertyValue("--bbf-lockup-target")),
            size: parseFloat(getComputedStyle(d1).fontSize),
            fontsStatus: doc.fonts.status,
          },
        }),
      );
    };

    let queued = 0;
    const queue = () => {
      if (queued) return;
      queued = win.requestAnimationFrame(() => {
        queued = 0;
        measure();
      });
    };
    measure();
    // La medida depende de la FUENTE: con la de respaldo el texto mide otra cosa. Se rehace al llegar cada fuente y en los tres
    // instantes en los que el kit suele haber resuelto, más al cambiar el tamaño de la ventana (cambia el objetivo).
    const timers = REFIT_DELAYS_MS.map((ms) => win.setTimeout(queue, ms));
    void doc.fonts.ready.then(queue);
    doc.fonts.addEventListener("loadingdone", queue);
    win.addEventListener("resize", queue);

    return () => {
      for (const id of timers) win.clearTimeout(id);
      if (queued) win.cancelAnimationFrame(queued);
      doc.fonts.removeEventListener("loadingdone", queue);
      win.removeEventListener("resize", queue);
      root.style.removeProperty("--bbf-display-fit-measured");
    };
  }, []);

  // La cuenta que la guarda servida necesita es la de la línea DISPLAY más larga (D-BBW-48, acotado a las dos por D-BBW-64): es una
  // MEDIDA del texto, no el texto, y es lo único del contenido que la presentación puede preguntar. Va en el HTML servido, así que la
  // guarda vale sin JavaScript.
  const chars = Math.max(lines[1].length, lines[2].length);
  return (
    <p
      ref={rootRef}
      className={styles.claim}
      data-component="bbf-hero-claim"
      style={{ "--bbf-display-chars": chars } as CSSProperties}
    >
      <span className={styles.kicker} data-enter="">
        {lines[0]}
      </span>
      <span ref={display1Ref} className={styles.line} data-enter="">
        {lines[1]}
      </span>
      <span ref={display2Ref} className={styles.line} data-enter="">
        {lines[2]}
      </span>
    </p>
  );
}

/** Cuándo se rehace la medida (ms). Mismos instantes que usaba el afinado del modulador: no son del movimiento, son de la carga de fuentes. */
const REFIT_DELAYS_MS = [60, 700, 1800] as const;
/** Por debajo de esta diferencia de cuerpo, repetir el afinado no cambia nada visible y solo gasta un fotograma. */
const REFIT_MIN_DELTA_PX = 0.1;
