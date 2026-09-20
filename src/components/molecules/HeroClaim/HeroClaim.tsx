"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { WEIGHT_MODULATOR, calibrate, frame, readTokens, type Calibration, type Tokens } from "@/behavior/weight-modulator";
import styles from "./HeroClaim.module.css";

/**
 * HeroClaim — molecule CLIENTE (D-BBW-47, héroe rediagramado; sustituye a `HeroLock`): el CLAIM en TRES LÍNEAS alineadas a la
 * izquierda, de las cuales **solo la última respira**. Algoritmo y constantes en src/behavior/weight-modulator.ts (D-BBW-30);
 * aquí solo el cableado con el documento.
 * · QUÉ SE CONSERVA de la 6h/6m/7b, que es casi todo: el MODULADOR DE PESO con su conservación de ancho (Σ avances = presupuesto
 *   al peso de reposo), la caja anclada al fotograma más ancho de la señal real, la medida con `max-content` (D-BBW-45) y el
 *   afinado de la guarda con la medida real (D-BBW-40). Cambia la diagramación, no el sistema.
 * · QUÉ SE RETIRA: el rótulo, su AJUSTE ÓPTICO y su PESO POR PUNTERO (src/behavior/optical-fit.ts, EXC-BBW-02, D-BBW-41). Eran
 *   del lockup de dos líneas que cerraban entre sí; sin segunda línea que cerrar no tienen objeto, y salen en el mismo commit
 *   que entra su sustituto (I-6).
 * · EL ANCHO LO FIJA LA LÍNEA MÁS LARGA (D-BBW-48). Con tres líneas de longitudes distintas y sin cierre entre ellas, la más
 *   larga es la que determina el espacio ocupado, así que el invariante de D-BBW-42 se aplica a ELLA:
 *     - la guarda servida divide entre `--bbf-display-chars`, que es la cuenta de letras de la línea más larga (una MEDIDA del
 *       texto, no el texto), y por tanto vale sin JavaScript;
 *     - el afinado por medida escribe `--bbf-display-fit-measured` con `objetivo × cuerpo ÷ máximo de los TRES anchos reales`,
 *       tomando el de la tercera línea YA ANCLADO por el modulador (que es su ancho máximo en todo el recorrido, no el de reposo).
 *   Sigue siendo punto fijo en un paso: el cociente no depende del cuerpo del que se parta.
 * · LA CONSERVACIÓN DE ANCHO ES POR LÍNEA: la caja anclada es la de la tercera línea y `contain: layout` aísla su relayout. Las
 *   otras dos no se tocan, el encabezado y la firma son hermanos posteriores en una columna: nada de alrededor se recoloca.
 * · UN SOLO BUCLE `requestAnimationFrame` que escribe `font-weight` por letra directo al documento (D-BBW-29), sin estado del marco.
 * · CALIBRACIÓN al montar, con las fuentes listas, cada vez que LLEGA una fuente (`loadingdone`), a 60/700/1800 ms y al cambiar el
 *   tamaño de la ventana. Cada calibración avisa con `bbf:weight-calibrated`: es lo que lee el arnés.
 * · QUIETO con movimiento reducido y con la pestaña oculta (D-BBW-31): el bucle se cancela y las letras vuelven al peso de rol.
 * · HTML COMPLETO (D-BBW-09/28): el servidor emite las tres líneas como TEXTO LITERAL con el peso de reposo por rol; el cliente
 *   parte la tercera en letras DESPUÉS de hidratar (imperativo, fuera del árbol de React: el texto no cambia, React no lo retoca)
 *   y solo mueve. Sin JavaScript queda exactamente lo servido.
 * · ACCESIBILIDAD: la línea partida lleva su texto como nombre accesible y las letras quedan ocultas a la asistencia; al
 *   desmontar se restaura el texto. El claim NO es un encabezado (D-BBW-47): el `<h1>` es el párrafo, y lo pone la sección.
 * Cero texto, cero valores.
 */
export function HeroClaim({ lines }: { lines: readonly [string, string, string] }) {
  const rootRef = useRef<HTMLParagraphElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const still1Ref = useRef<HTMLSpanElement>(null);
  const still2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const live = liveRef.current;
    const still1 = still1Ref.current;
    const still2 = still2Ref.current;
    if (!root || !live || !still1 || !still2) return;
    const stillEls: HTMLElement[] = [still1, still2];
    const doc = live.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;

    // ── partir la ÚLTIMA línea en letras (después de hidratar; el HTML servido trae el texto literal) ──
    // El espacio y el punto son glifos como cualquier otro: tienen avance y entran en la conservación. Que el espacio conserve
    // el suyo lo garantiza `white-space: pre` en la hoja (un glifo es elemento flexible, y un espacio en una caja de bloque se
    // colapsa y se recorta al principio y al final de su línea: mediría cero y la frase saldría sin espacios).
    const text = live.textContent ?? "";
    const original = Array.from(live.childNodes);
    const glyphs: HTMLElement[] = Array.from(text).map((ch) => {
      const g = doc.createElement("span");
      g.className = styles.glyph;
      g.setAttribute("aria-hidden", "true");
      g.textContent = ch;
      return g;
    });
    live.setAttribute("aria-label", text);
    live.replaceChildren(...glyphs);
    live.setAttribute("data-split", "");

    let tokens: Tokens | null = null;
    let cal: Calibration | null = null;
    let raf = 0;
    let stopped = true;
    const t0 = win.performance.now();
    const clock = () => (win.performance.now() - t0) / 1000;

    const rest = () => {
      for (const g of glyphs) g.style.removeProperty("font-weight");
    };
    const stillness = () => getComputedStyle(doc.documentElement).getPropertyValue("--bbf-motion-loop-play-state").trim() === "paused";

    /**
     * Ancho intrínseco de una línea que NO se anima. Se mide con `max-content` por la misma razón que la calibración
     * (D-BBW-45): una caja que se ajusta queda TOPADA por el disponible, y entonces el cociente del afinado se calcularía a
     * sí mismo y congelaría el cuerpo. Se restaura el valor de la hoja al terminar.
     */
    const naturalWidth = (el: HTMLElement): number => {
      const had = el.style.width;
      el.style.width = "max-content";
      const w = el.getBoundingClientRect().width;
      if (had) el.style.width = had;
      else el.style.removeProperty("width");
      return w;
    };

    /**
     * Afina la guarda de ancho con la medida real (D-BBW-40) generalizada a tres líneas (D-BBW-48): el objetivo lo ocupa la
     * línea MÁS ANCHA de las tres, contando la tercera por su caja YA ANCLADA (su máximo en todo el recorrido) y no por su
     * reposo. Devuelve si el cuerpo ha cambiado de verdad, leyéndolo del documento y no del cálculo: si la guarda no estaba
     * mandando, `min()` se queda con el tamaño del rol y no hay nada que recalibrar.
     */
    const refit = () => {
      if (!cal || cal.pinned <= 0) return false;
      const cs = getComputedStyle(live);
      const size = parseFloat(cs.fontSize);
      const target = parseFloat(cs.getPropertyValue("--bbf-lockup-target"));
      if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(target) || target <= 0) return false;
      const widest = Math.max(cal.pinned, ...stillEls.map(naturalWidth));
      root.style.setProperty("--bbf-display-fit-measured", ((target * size) / widest).toFixed(3) + "px");
      return Math.abs(parseFloat(getComputedStyle(live).fontSize) - size) > WEIGHT_MODULATOR.REFIT_MIN_DELTA_PX;
    };

    let refitPass = 0;
    const recalibrate = () => {
      tokens = readTokens(live);
      if (!tokens) return;
      const fontFace = getComputedStyle(live);
      cal = calibrate(live, glyphs, tokens, clock());
      if (refitPass < 2 && refit()) {
        refitPass += 1;
        recalibrate();
        return;
      }
      refitPass = 0;
      if (stopped) rest();
      live.dispatchEvent(
        new CustomEvent("bbf:weight-calibrated", {
          bubbles: true,
          detail: {
            budget: cal?.budget ?? 0,
            pinned: cal?.pinned ?? 0,
            samples: cal?.samples ?? 0,
            clamped: cal?.clamped ?? false,
            still: stillEls.map(naturalWidth),
            avail: parseFloat(getComputedStyle(live).getPropertyValue("--bbf-lockup-avail")),
            target: parseFloat(getComputedStyle(live).getPropertyValue("--bbf-lockup-target")),
            size: parseFloat(getComputedStyle(live).fontSize),
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

    return () => {
      stop();
      for (const id of timers) win.clearTimeout(id);
      if (queued) win.cancelAnimationFrame(queued);
      doc.fonts.removeEventListener("loadingdone", queue);
      win.removeEventListener("resize", queue);
      doc.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      live.replaceChildren(...original);
      live.removeAttribute("data-split");
      live.removeAttribute("aria-label");
      live.style.removeProperty("width");
      root.style.removeProperty("--bbf-display-fit-measured");
    };
  }, []);

  // La cuenta que la guarda necesita es la de la línea MÁS LARGA (D-BBW-48): es una MEDIDA del texto, no el texto, y es lo
  // único del contenido que la presentación puede preguntar. Va en el HTML servido, así que la guarda vale sin JavaScript.
  const chars = Math.max(...lines.map((l) => l.length));
  return (
    <p
      ref={rootRef}
      className={styles.claim}
      data-component="bbf-hero-claim"
      style={{ "--bbf-display-chars": chars } as CSSProperties}
    >
      <span ref={still1Ref} className={styles.line} data-enter="">
        {lines[0]}
      </span>
      <span ref={still2Ref} className={styles.line} data-enter="">
        {lines[1]}
      </span>
      <span ref={liveRef} className={`${styles.line} ${styles.live}`} data-enter="">
        {lines[2]}
      </span>
    </p>
  );
}
