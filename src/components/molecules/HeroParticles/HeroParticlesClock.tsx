"use client";

import { useEffect, useRef } from "react";

/**
 * HeroParticlesClock — cliente mínimo del campo de partículas (fase 6k, D-BBW-31): con la PESTAÑA OCULTA fija en el campo el mismo rol de
 * reproducción que el CSS ya lee (`--bbf-motion-particles-play-state: paused`) y lo retira al volver, así el valor vuelve a ser el de la raíz
 * (`running`, o `paused` si el usuario ha pedido menos movimiento: ahí las animaciones no arrancan desde el primer fotograma y este reloj no
 * las toca). Una sola política para las dos causas de quietud, como HeroMedia, HeroBackdrop y HeroLock. No mide, no anima, no escribe valores:
 * solo el nombre del rol. Cada cambio avisa con `bbf:particles` (detalle: estado y rol resuelto), que es lo que el arnés lee.
 */
export function HeroParticlesClock() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const anchor = ref.current;
    const field = anchor?.parentElement;
    if (!anchor || !field) return;
    const doc = field.ownerDocument;
    const role = "--bbf-motion-particles-play-state";

    const sync = () => {
      if (doc.hidden) field.style.setProperty(role, "paused");
      else field.style.removeProperty(role);
      const resolved = getComputedStyle(field).getPropertyValue(role).trim();
      field.dispatchEvent(new CustomEvent("bbf:particles", { detail: { state: doc.hidden ? "hidden" : resolved, role: resolved } }));
    };

    doc.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      doc.removeEventListener("visibilitychange", sync);
      field.style.removeProperty(role);
    };
  }, []);

  return <span ref={ref} hidden />;
}
