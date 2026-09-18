"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { WEIGHT_MODULATOR, calibrate, frame, readTokens, type Calibration, type Tokens } from "@/behavior/weight-modulator";
import { OPTICAL_FIT, POINTER_WEIGHT, applyLockFit, fitLock, pointerChanged, pointerWeight, readLeadTokens, readTrackRatio, type LockFit, type PointerState } from "@/behavior/optical-fit";
import styles from "./HeroLock.module.css";

/**
 * HeroLock — molecule CLIENTE (D-BBW-28, fase 6h): el LOCK de marca, titular + rótulo, con los tres comportamientos del diseño que dependen
 * uno de otro: el MODULADOR DE PESO del titular (S5), el AJUSTE ÓPTICO del rótulo al ancho anclado (S7) y el PESO POR PUNTERO del rótulo.
 * Algoritmos y constantes en src/behavior/ (D-BBW-30); aquí solo el cableado con el documento.
 * · HTML COMPLETO (D-BBW-09/28): el servidor emite el titular como TEXTO LITERAL con su peso de reposo por rol (CSS) y el rótulo con su
 *   interletrado de rol; el cliente parte la palabra en letras DESPUÉS de hidratar (imperativo, fuera del árbol de React: el texto no cambia,
 *   React no vuelve a tocarlo) y solo mueve. Sin JavaScript queda exactamente lo servido.
 * · UN SOLO BUCLE `requestAnimationFrame` que escribe directo al documento (`font-weight` por letra, D-BBW-29), sin estado del marco de trabajo.
 *   Reloj continuo desde el montaje; la señal no tiene periodo (behavior/weight-modulator.ts).
 * · CALIBRACIÓN al montar, cuando las fuentes están listas, cada vez que LLEGA una fuente (`loadingdone`: si la display llega tarde, la primera
 *   tabla es de la de respaldo y la conservación sería falsa), a 60/700/1800 ms (patrón del diseño) y al cambiar el tamaño de la ventana.
 *   Cada calibración avisa con `bbf:weight-calibrated` (detalle: presupuesto, caja anclada, estado de la fuente): es lo que el arnés lee.
 * · QUIETO con movimiento reducido y con la pestaña oculta (D-BBW-31): el bucle se cancela y queda el reposo (las letras vuelven al peso de rol).
 *   La preferencia se lee por el ROL `--bbf-motion-loop-play-state` (semantic/motion.css), como los bucles CSS, no repitiendo la consulta.
 * · Accesibilidad: el titular partido lleva su texto como nombre accesible y las letras quedan ocultas a la asistencia; al desmontar se
 *   restaura el texto. El rótulo se tiñe por `data-pull` (CSS), nunca con un color desde aquí.
 * Fase 6m (D-BBW-40 · D-BBW-41), dos cosas y las dos por MEDIDA, no por número:
 *   · LAS DOS GUARDAS DE ANCHO necesitan saber cuántas letras hay, y esa es la única cosa del contenido que la presentación puede
 *     preguntar: el componente publica `--bbf-display-chars` y `--bbf-lead-chars` (una CUENTA, no el texto) y la hoja deriva el tope
 *     del margen de seguridad. Van en el HTML servido, así que la guarda vale también sin JavaScript.
 *   · LA GUARDA DEL TITULAR SE AFINA CON LA MEDIDA: la de la hoja usa el avance del glifo más ancho de la familia, que es una COTA y
 *     por eso sobra (con `DEEPBRAND`, un 22 %). En cuanto el modulador ha anclado la caja se conoce el ancho real, y el componente
 *     escribe `--bbf-display-fit-measured` con el cuerpo exacto que llena el ancho disponible. Es punto fijo en UN paso
 *     (`exacto = disponible × cuerpo ÷ anclado` no depende del cuerpo del que se parta), así que se recalibra una vez y para.
 *   · EL LOCK CIERRA RESOLVIENDO EL TAMAÑO del rótulo con la razón de interletrado fija (D-BBW-41): el componente solo cablea; la
 *     resolución vive en behavior/optical-fit.ts.
 * Fase 6l: el contenido trae la palabra EN MINÚSCULAS (el modelo de contenido prohíbe presentación dentro del contenido) y la mayúscula la
 *   aplica el estilo. Mientras el titular es texto entero basta `capitalize`; partido en letras, `capitalize` pondría TODAS en mayúscula
 *   (cada letra es una palabra para el navegador, medido), así que el componente marca el estado con `data-split` y la hoja pone la mayúscula
 *   solo en la primera letra. La tabla de avances se mide sobre los glifos YA transformados: la conservación no se entera.
 * Cero texto, cero valores.
 */
export function HeroLock({ headingId, display, lead }: { headingId: string; display: string; lead: string }) {
  const lockRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const lock = lockRef.current;
    const word = wordRef.current;
    const leadEl = leadRef.current;
    if (!lock || !word || !leadEl) return;
    const doc = word.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;

    // ── partir la palabra en letras (después de hidratar; el HTML servido trae el texto literal) ──
    const text = word.textContent ?? "";
    const original = Array.from(word.childNodes);
    const glyphs: HTMLElement[] = Array.from(text).map((ch) => {
      const g = doc.createElement("span");
      g.className = styles.glyph;
      g.setAttribute("aria-hidden", "true");
      g.textContent = ch;
      return g;
    });
    word.setAttribute("aria-label", text);
    word.replaceChildren(...glyphs);
    word.setAttribute("data-split", "");

    let tokens: Tokens | null = null;
    let cal: Calibration | null = null;
    let lockFit: LockFit | null = null;
    let pointer: PointerState | null = null;
    let raf = 0;
    let stopped = true;
    const t0 = win.performance.now();
    const clock = () => (win.performance.now() - t0) / 1000;

    const rest = () => {
      for (const g of glyphs) g.style.removeProperty("font-weight");
    };
    const stillness = () => getComputedStyle(doc.documentElement).getPropertyValue("--bbf-motion-loop-play-state").trim() === "paused";

    const fit = () => {
      const ratio = readTrackRatio(leadEl);
      if (ratio === null) return;
      const target = cal?.pinned || word.getBoundingClientRect().width;
      const next = fitLock(lock, leadEl, target, ratio, lockFit);
      if (next !== null && next !== lockFit) {
        lockFit = next;
        applyLockFit(leadEl, next);
      }
    };

    /**
     * Afina la guarda de ancho del titular con la medida real y devuelve si el cuerpo ha cambiado de verdad (lo lee del documento,
     * no del cálculo: si la guarda no estaba mandando, `min()` se queda con el tamaño del rol y no hay nada que recalibrar).
     */
    const refit = () => {
      if (!cal || cal.pinned <= 0) return false;
      const cs = getComputedStyle(word);
      const size = parseFloat(cs.fontSize);
      const avail = parseFloat(cs.getPropertyValue("--bbf-lockup-avail"));
      if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(avail) || avail <= 0) return false;
      lock.style.setProperty("--bbf-display-fit-measured", ((avail * size) / cal.pinned).toFixed(3) + "px");
      return Math.abs(parseFloat(getComputedStyle(word).fontSize) - size) > OPTICAL_FIT.MIN_DELTA_PX;
    };

    let refitPass = 0;
    const recalibrate = () => {
      tokens = readTokens(word);
      if (!tokens) return;
      const fontFace = getComputedStyle(word);
      cal = calibrate(word, glyphs, tokens, clock());
      if (refitPass < 2 && refit()) {
        refitPass += 1;
        recalibrate();
        return;
      }
      refitPass = 0;
      if (stopped) rest();
      fit();
      word.dispatchEvent(
        new CustomEvent("bbf:weight-calibrated", {
          detail: {
            budget: cal?.budget ?? 0,
            pinned: cal?.pinned ?? 0,
            samples: cal?.samples ?? 0,
            avail: parseFloat(getComputedStyle(word).getPropertyValue("--bbf-lockup-avail")),
            size: parseFloat(getComputedStyle(word).fontSize),
            leadSize: lockFit?.size ?? 0,
            leadTrack: lockFit?.track ?? 0,
            fontsStatus: doc.fonts.status,
            displayLoaded: doc.fonts.check(`${fontFace.fontWeight} ${fontFace.fontSize} ${fontFace.fontFamily.split(",")[0]}`),
          },
        }),
      );
    };

    const step = () => {
      raf = win.requestAnimationFrame(step);
      if (!tokens || !cal) return;
      frame(clock(), glyphs, cal.curves, cal.budget, tokens);
    };
    const start = () => {
      if (!stopped) return;
      stopped = false;
      raf = win.requestAnimationFrame(step);
    };
    const stop = () => {
      if (stopped) return;
      stopped = true;
      win.cancelAnimationFrame(raf);
      rest();
    };
    /** una sola política para las dos causas de quietud: pestaña oculta y movimiento reducido (D-BBW-31) */
    const sync = () => {
      if (doc.hidden || stillness()) stop();
      else start();
    };

    // ── puntero: peso y tinte del rótulo (S7.3) ──
    let leadTokens = readLeadTokens(leadEl);
    const onPointer = (e: PointerEvent) => {
      if (!leadTokens) leadTokens = readLeadTokens(leadEl);
      if (!leadTokens) return;
      const next = pointerWeight(e.clientX, e.clientY, lock.getBoundingClientRect(), leadTokens);
      if (pointer && !pointerChanged(pointer, next)) return;
      pointer = next;
      leadEl.style.fontWeight = String(next.weight);
      if (next.pull > POINTER_WEIGHT.TINT_THRESHOLD) leadEl.dataset.pull = "near";
      else delete leadEl.dataset.pull;
    };

    // ── calibración: montaje, fuentes, retardos del diseño, tamaño de ventana ──
    let queued = 0;
    const queue = () => {
      if (queued) return;
      queued = win.requestAnimationFrame(() => {
        queued = 0;
        recalibrate();
      });
    };
    recalibrate();
    sync();
    const timers = WEIGHT_MODULATOR.REFIT_DELAYS_MS.map((ms) => win.setTimeout(queue, ms));
    void doc.fonts.ready.then(queue);
    doc.fonts.addEventListener("loadingdone", queue);
    win.addEventListener("resize", queue);
    doc.addEventListener("visibilitychange", sync);
    const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener("change", sync);
    win.addEventListener("pointermove", onPointer);

    return () => {
      stop();
      for (const id of timers) win.clearTimeout(id);
      if (queued) win.cancelAnimationFrame(queued);
      doc.fonts.removeEventListener("loadingdone", queue);
      win.removeEventListener("resize", queue);
      doc.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      win.removeEventListener("pointermove", onPointer);
      word.replaceChildren(...original);
      word.removeAttribute("data-split");
      word.removeAttribute("aria-label");
      word.style.removeProperty("width");
      lock.style.removeProperty("--bbf-display-fit-measured");
      leadEl.style.removeProperty("font-size");
      leadEl.style.removeProperty("letter-spacing");
      leadEl.style.removeProperty("margin-right");
      leadEl.style.removeProperty("font-weight");
      delete leadEl.dataset.pull;
    };
  }, []);

  return (
    <div
      ref={lockRef}
      className={styles.lock}
      data-component="bbf-hero-lock"
      style={{ "--bbf-display-chars": display.length, "--bbf-lead-chars": lead.length } as CSSProperties}
    >
      <h1 ref={wordRef} id={headingId} className={styles.display} data-enter="">
        {display}
      </h1>
      <p ref={leadRef} className={styles.lead} data-enter="">
        {lead}
      </p>
    </div>
  );
}
