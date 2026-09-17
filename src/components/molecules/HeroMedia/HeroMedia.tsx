"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroMedia.module.css";

export type HeroMediaSource = { src: string; type: string };
export type HeroMediaStill = { src: string; width: number; height: number };

/**
 * HeroMedia — molecule. El VÍDEO DE FONDO del héroe (D-BBW-24, fase 6d) por el puerto de medios: derivados sin audio, póster del primer
 * fotograma, dimensiones intrínsecas declaradas (`width`/`height`: la caja no salta). Es MEDIO, no animación de interfaz.
 * · Reproducción automática (MDN, verificado 2026-09-17): `muted` (sin ella ningún navegador arranca solo) + `playsInline` (Safari) + `loop`
 *   + `autoPlay`; sin controles, sin pantalla completa ni imagen-en-imagen. `preload="metadata"` es lo que la especificación aconseja.
 * · Decorativo para las tecnologías de asistencia (`aria-hidden`, fuera del orden de tabulación): toda la información está en el texto.
 * · Movimiento reducido: el rol `--bbf-motion-*-display` (semantic/motion.css) esconde el vídeo y muestra la imagen fija. Sin JavaScript.
 * · Pestaña oculta: se PAUSA (Page Visibility API) y se reanuda al volver — batería y datos de quien no lo está viendo. Es lo único que hace el
 *   cliente; el HTML servido ya trae el vídeo entero (D-BBW-09). El mismo oyente respeta la preferencia de movimiento (no arranca el vídeo
 *   escondido) leyendo el rol de display resuelto, sin repetir la consulta de medios aquí.
 * Cero texto, cero valores.
 */
export function HeroMedia({ sources, poster }: { sources: readonly HeroMediaSource[]; poster: HeroMediaStill }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sync = () => {
      const shown = getComputedStyle(video).display !== "none";
      if (document.hidden || !shown) {
        video.pause();
        return;
      }
      void video.play().catch(() => undefined);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    sync();
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div className={styles.media} aria-hidden="true" data-component="bbf-hero-media">
      <video
        ref={ref}
        className={styles.video}
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
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático con images.unoptimized (D-BBW-03); el póster llega por el puerto de medios con sus dimensiones */}
      <img className={styles.still} src={poster.src} width={poster.width} height={poster.height} alt="" />
    </div>
  );
}
