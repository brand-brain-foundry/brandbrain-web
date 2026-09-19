"use client";

import { useEffect, useRef } from "react";
import { createSampler, follow, framing, restState, REST_TRANSFORM, SUBJECT_TRACKING, transformFor } from "@/behavior/subject-tracking";
import styles from "./HeroMedia.module.css";

/**
 * Una fuente del vídeo. `media` es la CONDICIÓN DE PANTALLA con la que el navegador elige (D-BBW-46): sin ella, la primera fuente gana
 * siempre y un teléfono se descarga el derivado grande existiendo el pequeño. Las fuentes se declaran de la MÁS RESTRICTIVA a la más
 * general, porque el navegador se queda con la PRIMERA cuya condición se cumple y no vuelve a mirar.
 */
export type HeroMediaSource = { src: string; type: string; media?: string };
export type HeroMediaStill = { src: string; width: number; height: number };

/**
 * HeroMedia — molecule CLIENTE. El VÍDEO DE FONDO del héroe (D-BBW-24, fase 6d) por el puerto de medios: derivados sin audio, póster del primer
 * fotograma, dimensiones intrínsecas declaradas (`width`/`height`: la caja no salta). Es MEDIO, no animación de interfaz.
 * · UNA FUENTE POR TAMAÑO DE PANTALLA (D-BBW-46, fase 8a-bis): el elegido se decide UNA VEZ, al cargar, y no cambia al girar el teléfono
 *   ni al redimensionar —así lo define la especificación—, que es justo lo que se quiere: nadie se descarga dos vídeos.
 * · Reproducción automática (MDN, verificado 2026-09-17): `muted` (sin ella ningún navegador arranca solo) + `playsInline` (Safari) + `loop`
 *   + `autoPlay`; sin controles, sin pantalla completa ni imagen-en-imagen. `preload="metadata"` es lo que la especificación aconseja.
 * · Decorativo para las tecnologías de asistencia (`aria-hidden`, fuera del orden de tabulación): toda la información está en el texto.
 * · Movimiento reducido: el rol `--bbf-motion-*-display` (semantic/motion.css) esconde el vídeo y muestra la imagen fija. Sin JavaScript.
 * Fase 6j (portado P3 del N1, D-BBW-28): el encuadre PERSIGUE AL SUJETO. Algoritmo y constantes en src/behavior/subject-tracking.ts
 * (D-BBW-30); aquí solo el cableado:
 * · REPOSO en el HTML servido (D-BBW-28): vídeo e imagen fija llevan el encuadre centrado al zoom (`REST_TRANSFORM`); el póster lo recibe
 *   con el vídeo, así póster y reposo coinciden y no hay salto al arrancar. El cliente solo mueve.
 * · UN bucle `requestAnimationFrame`: muestrea el centroide cada `PERIOD_MS` y en cada `timeupdate`, aplica la traslación acotada cada cuadro.
 * · CADENA DE REINTENTOS de reproducción (dc:L642-655): las tres formas de `muted` (React no serializa la propiedad), `play()` al arrancar, en
 *   `loadeddata`, en `canplay`, cada `RETRY.everyMs` hasta `RETRY.max` intentos o hasta que reproduce, al volver visible y en el primer gesto
 *   (`pointerdown`/`keydown`). Si nada arranca queda el póster: la página no se rompe.
 * · QUIETO (D-BBW-31): con movimiento reducido el vídeo está oculto por el rol y el bucle NO ARRANCA (ni reintentos ni cuadros); con la pestaña
 *   oculta se detiene y el vídeo se PAUSA (Page Visibility; batería y datos de quien no lo ve); al volver, arranca de nuevo. La preferencia
 *   se lee por el rol resuelto (`display` computado del vídeo), no repitiendo la consulta de medios.
 * · Cada cambio de estado avisa con `bbf:tracking` (detalle: estado): es lo que el arnés lee. Cero texto, cero valores.
 */
export function HeroMedia({ sources, poster }: { sources: readonly HeroMediaSource[]; poster: HeroMediaStill }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const doc = video.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;
    const { PERIOD_MS, RETRY } = SUBJECT_TRACKING;
    const sampler = createSampler(doc);
    const state = restState();
    let running = false;
    let raf = 0;
    let last = 0;
    let retry = 0;

    const emit = (s: "running" | "stopped") => video.dispatchEvent(new CustomEvent("bbf:tracking", { detail: { state: s } }));
    const shown = () => getComputedStyle(video).display !== "none";
    const track = () => {
      const c = sampler.sample(video);
      if (c) follow(state, c);
    };
    const apply = () => {
      if (!state.ready) return;
      video.style.transform = transformFor(framing(state));
    };
    const step = (ts: number) => {
      raf = win.requestAnimationFrame(step);
      if (ts - last > PERIOD_MS) {
        last = ts;
        track();
      }
      apply();
    };
    const onTime = () => {
      if (!running) return;
      track();
      apply();
    };
    const kick = () => {
      if (!running) return;
      void video.play().catch(() => undefined);
    };
    const start = () => {
      if (running) return;
      running = true;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      kick();
      let tries = 0;
      win.clearInterval(retry);
      retry = win.setInterval(() => {
        if (!video.paused || ++tries > RETRY.max) win.clearInterval(retry);
        else kick();
      }, RETRY.everyMs);
      raf = win.requestAnimationFrame(step);
      emit("running");
    };
    const stop = () => {
      if (!running) return;
      running = false;
      win.cancelAnimationFrame(raf);
      win.clearInterval(retry);
      video.pause();
      emit("stopped");
    };
    /** una sola política para las dos causas de quietud: pestaña oculta y movimiento reducido (D-BBW-31) */
    const sync = () => {
      if (doc.hidden || !shown()) stop();
      else start();
    };

    const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
    video.addEventListener("loadeddata", kick);
    video.addEventListener("canplay", kick);
    video.addEventListener("timeupdate", onTime);
    win.addEventListener("pointerdown", kick);
    win.addEventListener("keydown", kick);
    doc.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    sync();

    return () => {
      stop();
      video.removeEventListener("loadeddata", kick);
      video.removeEventListener("canplay", kick);
      video.removeEventListener("timeupdate", onTime);
      win.removeEventListener("pointerdown", kick);
      win.removeEventListener("keydown", kick);
      doc.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      sampler.dispose();
      video.style.transform = REST_TRANSFORM;
    };
  }, []);

  return (
    <div className={styles.media} aria-hidden="true" data-component="bbf-hero-media" data-enter="">
      <video
        ref={ref}
        className={styles.video}
        style={{ transform: REST_TRANSFORM }}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        preload="metadata"
        poster={poster.src}
        width={poster.width}
        height={poster.height}
        tabIndex={-1}
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} media={s.media} />
        ))}
      </video>
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático con images.unoptimized (D-BBW-03); el póster llega por el puerto de medios con sus dimensiones */}
      <img className={styles.still} style={{ transform: REST_TRANSFORM }} src={poster.src} width={poster.width} height={poster.height} alt="" />
    </div>
  );
}
