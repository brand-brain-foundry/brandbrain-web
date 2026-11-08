/**
 * behavior/profile-reveal.ts — S13 · APARICIONES Y LÍNEA DE TIEMPO DE LA PÁGINA DE PERFIL (P2 del perfil, 2026-11-08; BEHAVIOR.md §16).
 * Mejora progresiva sobre un HTML COMPLETO (D-BBW-09): el documento servido trae todo visible y quieto, y este módulo solo MUEVE.
 *
 * APARICIONES (P0b §2, D-BBW-96…109): cada bloque marcado con `data-reveal` que todavía está POR DEBAJO de la ventana al montar se ARMA
 * (`data-reveal-armed`: la hoja lo oculta con opacidad y un desplazamiento corto) y entra UNA vez, por tiempo, cuando llega a la vista
 * (`data-reveal-in`). Lo que ya se ve al montar no se arma nunca (sin destello). Los que entran en el mismo aviso del observador se escalonan
 * en orden de documento: índice × el rol `--bbf-motion-reveal-stagger`, con tope `STAGGER_CAP` (un grupo entra en ≤ 480 + 5 × 80 ms).
 * Ningún bucle: un `IntersectionObserver` que se desconecta cuando no queda nada armado.
 *
 * LÍNEA DE TIEMPO («Cómo trabajo», D1): en el contenedor `data-timeline`, el paso cuyo nodo ya cruzó la LÍNEA DE LECTURA (`ACTIVE_LINE` del alto
 * de la ventana) es el activo (`data-active`) y los anteriores quedan leídos (`data-passed`); el relleno de la línea llega a su nodo
 * (`--bbf-timeline-progress`, 0…1, que la hoja aplica como `scaleY`: compositor). Se recalcula solo cuando un paso cruza la línea (observador),
 * nunca en cada desplazamiento. Sin JavaScript la línea está llena (reposo de la hoja).
 *
 * QUIETUD (D-BBW-31): con movimiento reducido (rol `--bbf-motion-reveal-play-state` en `paused`, semantic/motion.css; se LEE, nunca se repite la
 * consulta) no se arma nada y la línea queda llena: todo visible y quieto desde el primer fotograma.
 * CONSTANTES: tabla en docs/system/BEHAVIOR.md §16; clase por D-DOC-13 §2.
 *
 * P4 (S14): este es también el punto de entrada del VÍDEO DE LAS FICHAS (`./card-video`, BEHAVIOR.md §17), un sistema aparte con su quietud propia
 * que viaja en el MISMO trozo diferido: `ProfileMotion` (cliente común a todas las páginas) no cambia y el inicio no descarga ninguno de los dos.
 */
import { startCardVideos } from "./card-video";

export const PROFILE_REVEAL = Object.freeze({
  /** fracción del bloque que tiene que verse para que entre · plantilla · P0b (`threshold` 0,15) */
  THRESHOLD: 0.15,
  /** recorte inferior de la ventana para el observador: entra un poco antes del borde, no en él · plantilla · P0b */
  ROOT_MARGIN_BOTTOM: 0.08,
  /** tope del índice de escalonado dentro de un aviso · plantilla · P0b §1.3 (tope 5) */
  STAGGER_CAP: 5,
  /** línea de lectura del paso activo, fracción del alto de la ventana desde arriba · plantilla · P0b (`paso activo` en el centro) */
  ACTIVE_LINE: 0.5,
});

const ARMED = "data-reveal-armed";
const IN = "data-reveal-in";

/** Arranca las apariciones y la línea de tiempo (S13) y el vídeo de las fichas (S14) dentro de `root`. Devuelve la limpieza de los dos. */
export function startProfileReveal(root: HTMLElement): () => void {
  const stopVideos = startCardVideos(root);
  const stopReveal = startReveal(root);
  return () => {
    stopVideos();
    stopReveal();
  };
}

/** S13: apariciones y línea de tiempo. */
function startReveal(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!win || typeof win.IntersectionObserver !== "function") return () => {};
  const still = getComputedStyle(doc.documentElement).getPropertyValue("--bbf-motion-reveal-play-state").trim() === "paused";
  if (still) return () => {};

  const cleanups: Array<() => void> = [];

  // ── apariciones ─────────────────────────────────────────────────────────────────────────────────────────
  const viewH = win.innerHeight;
  const armed = [...root.querySelectorAll<HTMLElement>("[data-reveal]")].filter((el) => el.getBoundingClientRect().top >= viewH);
  if (armed.length > 0) {
    const io = new win.IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        entering.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        entering.forEach((el, i) => {
          el.style.setProperty("--bbf-reveal-index", String(Math.min(i, PROFILE_REVEAL.STAGGER_CAP)));
          el.setAttribute(IN, "");
          io.unobserve(el);
        });
        if (root.querySelectorAll(`[${ARMED}]:not([${IN}])`).length === 0) io.disconnect();
      },
      { threshold: PROFILE_REVEAL.THRESHOLD, rootMargin: `0px 0px -${PROFILE_REVEAL.ROOT_MARGIN_BOTTOM * 100}% 0px` },
    );
    for (const el of armed) {
      el.setAttribute(ARMED, "");
      io.observe(el);
    }
    cleanups.push(() => io.disconnect());
  }

  // ── línea de tiempo ─────────────────────────────────────────────────────────────────────────────────────
  for (const line of root.querySelectorAll<HTMLElement>("[data-timeline]")) {
    const steps = [...line.querySelectorAll<HTMLElement>("[data-step]")];
    if (steps.length === 0) continue;
    const update = () => {
      const readY = win.innerHeight * PROFILE_REVEAL.ACTIVE_LINE;
      const box = line.getBoundingClientRect();
      let active = -1;
      steps.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= readY) active = i;
      });
      steps.forEach((s, i) => {
        s.toggleAttribute("data-active", i === active);
        s.toggleAttribute("data-passed", i <= active);
      });
      const reach = active < 0 ? 0 : (steps[active].getBoundingClientRect().top - box.top) / Math.max(1, box.height);
      line.style.setProperty("--bbf-timeline-progress", String(Math.min(1, Math.max(0, reach))));
    };
    const io = new win.IntersectionObserver(update, { rootMargin: `0px 0px -${(1 - PROFILE_REVEAL.ACTIVE_LINE) * 100}% 0px`, threshold: [0, 1] });
    steps.forEach((s) => io.observe(s));
    update();
    cleanups.push(() => io.disconnect());
  }

  return () => cleanups.forEach((f) => f());
}
