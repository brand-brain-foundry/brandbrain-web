"use client";

import { useEffect, useRef } from "react";
import { createBackdrop, type Backdrop } from "@/behavior/backdrop-shader";
import styles from "./HeroBackdrop.module.css";

/**
 * HeroBackdrop — molecule CLIENTE (D-BBW-28, fase 6i, portado P2 del N1): el FONDO del héroe, el sombreador WebGL2 de cuatro pasadas del diseño
 * (`<blob-bg>`), con el NÚCLEO NEGRO DEFORMADO POR RUIDO bajo el sujeto y el color en los bordes. Algoritmo, constantes y procedencia en
 * src/behavior/backdrop-shader.ts (D-BBW-30, Q-BBW-008); aquí solo el cableado con el documento.
 * · HTML COMPLETO y REPOSO (D-BBW-09/28/33): el servidor emite el contenedor con la SUPERFICIE BASE (CSS, rol `--bbf-surface-base`) y un lienzo
 *   vacío; sin JavaScript, sin WebGL2, con el contexto perdido, con movimiento reducido o con la pestaña oculta se ve exactamente eso: la
 *   superficie base. La página nunca queda rota si el fondo no arranca (el lienzo se oculta y no queda un mecanismo de respaldo: D-BBW-33).
 * · UN SOLO BUCLE `requestAnimationFrame` con reloj continuo desde el montaje (el módulo aplica `speed`); sin estado del marco de trabajo.
 * · TAMAÑO: el lienzo sigue al contenedor (ResizeObserver) y a la ventana (`resize`, también cambios de `devicePixelRatio`); el tope de
 *   resolución es el presupuesto del módulo (D-BBW-34). El diseño re-medía en cada cuadro (bb:L260); el resultado es el mismo sin forzar
 *   una disposición por cuadro junto al modulador de peso.
 * · QUIETO con movimiento reducido y con la pestaña oculta (D-BBW-31): el bucle se cancela y queda la superficie base (el lienzo se oculta);
 *   la preferencia se lee por el ROL `--bbf-motion-glow-play-state` (semantic/motion.css), no repitiendo la consulta.
 * · Cada cambio de estado avisa con `bbf:backdrop` (detalle: estado, tamaños, reloj de arranque): es lo que el arnés lee.
 * · Decorativo para las tecnologías de asistencia (`aria-hidden`); no recibe eventos. Cero texto, cero valores.
 */
export function HeroBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const doc = canvas.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;
    const host = canvas.parentElement ?? canvas;

    let gpu: Backdrop | null = null;
    let raf = 0;
    let stopped = true;
    let lost = false;
    const t0 = win.performance.now();
    const clock = () => (win.performance.now() - t0) / 1000;

    const emit = (state: "running" | "stopped" | "unsupported" | "lost") =>
      canvas.dispatchEvent(new CustomEvent("bbf:backdrop", { detail: { state, t0, ...(gpu?.size ?? {}) } }));

    const measure = () => {
      if (!gpu) return;
      const r = host.getBoundingClientRect();
      gpu.resize(r.width, r.height, win.devicePixelRatio);
    };
    const stillness = () => getComputedStyle(doc.documentElement).getPropertyValue("--bbf-motion-glow-play-state").trim() === "paused";

    const step = () => {
      raf = win.requestAnimationFrame(step);
      gpu?.draw(clock());
    };
    const start = () => {
      if (!stopped || !gpu || lost) return;
      stopped = false;
      canvas.hidden = false;
      measure();
      raf = win.requestAnimationFrame(step);
      emit("running");
    };
    const stop = (state: "stopped" | "lost" = "stopped") => {
      if (stopped) return;
      stopped = true;
      win.cancelAnimationFrame(raf);
      canvas.hidden = true;
      emit(state);
    };
    /** una sola política para las dos causas de quietud: pestaña oculta y movimiento reducido (D-BBW-31) */
    const sync = () => {
      if (doc.hidden || stillness()) stop();
      else start();
    };

    gpu = createBackdrop(canvas);
    if (!gpu) {
      // respaldo (D-BBW-33): sin contexto gráfico queda la superficie base del contenedor; nada más que hacer
      canvas.hidden = true;
      emit("unsupported");
      return;
    }

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      stop("lost");
    };
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    canvas.addEventListener("webglcontextlost", onLost);
    win.addEventListener("resize", measure);
    doc.addEventListener("visibilitychange", sync);
    const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener("change", sync);
    sync();

    return () => {
      stop();
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      win.removeEventListener("resize", measure);
      doc.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      gpu?.dispose();
      gpu = null;
    };
  }, []);

  return (
    <div className={styles.backdrop} aria-hidden="true" data-component="bbf-hero-backdrop" data-enter="">
      <canvas ref={ref} className={styles.canvas} hidden />
    </div>
  );
}
