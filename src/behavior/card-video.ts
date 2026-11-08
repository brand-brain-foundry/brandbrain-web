/**
 * behavior/card-video.ts — S14 · VÍDEO DE LAS FICHAS DE PROYECTOS (P4 del perfil, 2026-11-08; D-BBW-102, D-BBW-97; BEHAVIOR.md §17).
 * Mejora progresiva sobre un HTML COMPLETO (D-BBW-09): cada ficha llega servida con su `<video preload="none" poster>`, que en reposo muestra el
 * póster (el fotograma 0 del fragmento) y no descarga el vídeo. Este módulo solo decide CUÁNDO se mueve; sin JavaScript, póster quieto.
 *
 * CONDUCTA (despacho P4 §1.3):
 *   · PUNTERO FINO (rol `--bbf-hover-fine` = 1): reproduce sin sonido y EN BUCLE mientras el puntero está sobre la ficha o la ficha tiene el foco;
 *     al salir (o perder el foco) se pausa y vuelve al fotograma 0, que es el póster.
 *   · TÁCTIL (sin puntero fino): cuando la ficha queda CENTRADA (la franja central `CENTER_BAND` del alto de la ventana), UNA sola pasada de
 *     `TOUCH_PASS_SECONDS` (≤ 5 s: WCAG 2.2.2 no pide control de pausa para lo que se mueve solo menos de 5 s) y vuelta al póster. Una ficha a la
 *     vez (la más cercana al centro). No se repite mientras siga centrada; vuelve a poder pasar cuando sale de la franja y regresa.
 *   · FUERA DE VISTA (D-BBW-97) o PESTAÑA OCULTA: pausa y vuelta al póster.
 *   · MOVIMIENTO REDUCIDO (I-9, D-BBW-31): solo póster. El rol `--bbf-motion-card-play-state` (semantic/motion.css) se LEE antes de cada
 *     reproducción, nunca se repite la consulta; en `paused` no arranca nada (y el vídeo no se descarga).
 * Toda la ficha es el enlace (el `<a>` del componente): el vídeo es decorativo (`aria-hidden` en su ventana) y nunca toma el foco.
 * Ningún bucle propio: eventos del puntero y del foco, dos `IntersectionObserver` y un temporizador por pasada.
 * CONSTANTES: tabla en docs/system/BEHAVIOR.md §17; clase por D-DOC-13 §2.
 */
export const CARD_VIDEO = Object.freeze({
  /** duración de la pasada única en táctil, s · estático · WCAG 2.2.2 (lo que empieza solo y dura más de 5 s exige pausa); despacho P4 §1.3 */
  TOUCH_PASS_SECONDS: 5,
  /** franja central de la ventana en la que una ficha cuenta como centrada, fracción del alto · plantilla · P0 (la ficha más centrada) */
  CENTER_BAND: 0.2,
});

const SELECTOR = "video[data-card-video]";

type Card = { video: HTMLVideoElement; link: HTMLElement; inView: boolean; inBand: boolean; spent: boolean; hover: boolean; focus: boolean; timer: number };

/** Arranca el vídeo de las fichas dentro de `root`. Devuelve la limpieza. */
export function startCardVideos(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!win || typeof win.IntersectionObserver !== "function") return () => {};
  const cards: Card[] = [...root.querySelectorAll<HTMLVideoElement>(SELECTOR)].flatMap((video) => {
    const link = video.closest<HTMLElement>("a");
    return link ? [{ video, link, inView: false, inBand: false, spent: false, hover: false, focus: false, timer: 0 }] : [];
  });
  if (cards.length === 0) return () => {};

  const rootStyle = () => getComputedStyle(doc.documentElement);
  const still = () => rootStyle().getPropertyValue("--bbf-motion-card-play-state").trim() === "paused";
  const fine = rootStyle().getPropertyValue("--bbf-hover-fine").trim() === "1";
  const cleanups: Array<() => void> = [];

  for (const c of cards) {
    // el atributo `muted` no llega en el HTML servido por React (es una propiedad): se fija aquí antes de cualquier reproducción
    c.video.muted = true;
    c.video.defaultMuted = true;
    c.video.loop = fine;
  }

  /** Pausa y vuelta al fotograma 0 (= el póster). Si el vídeo nunca cargó, no toca nada: sigue el póster y no se pide el archivo. */
  const rest = (c: Card) => {
    win.clearTimeout(c.timer);
    c.timer = 0;
    if (!c.video.paused) c.video.pause();
    if (c.video.readyState > 0 && c.video.currentTime !== 0) c.video.currentTime = 0;
  };

  const play = (c: Card) => {
    if (still() || doc.hidden || !c.inView) return rest(c);
    if (!c.video.paused) return;
    c.video.play().catch(() => rest(c)); // bloqueado por el navegador → queda el póster
  };

  // ── puntero fino: bucle mientras el puntero o el foco están en la ficha ─────────────────────────────────────
  if (fine) {
    for (const c of cards) {
      const sync = () => (c.hover || c.focus ? play(c) : rest(c));
      const on = (type: string, fn: () => void) => {
        c.link.addEventListener(type, fn);
        cleanups.push(() => c.link.removeEventListener(type, fn));
      };
      on("pointerenter", () => ((c.hover = true), sync()));
      on("pointerleave", () => ((c.hover = false), sync()));
      on("focusin", () => ((c.focus = true), sync()));
      on("focusout", () => ((c.focus = false), sync()));
    }
  }

  // ── táctil: una pasada de ≤ 5 s de la ficha más centrada ────────────────────────────────────────────────────
  const pickCentered = () => {
    const mid = win.innerHeight / 2;
    let best: Card | undefined;
    let bestDist = Infinity;
    for (const c of cards) {
      // en la franja Y en vista: los dos observadores avisan por separado y en cualquier orden; si la franja llega antes que la vista, la
      // ficha esperaría marcada como ya pasada sin haber corrido (medido en el arnés: 1 de 2 corridas). La vista vuelve a llamar aquí.
      if (!c.inBand || !c.inView) continue;
      const r = c.video.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestDist) {
        best = c;
        bestDist = d;
      }
    }
    for (const c of cards) if (c !== best) rest(c);
    if (best && !best.spent && best.video.paused) {
      const c = best;
      c.spent = true;
      play(c);
    }
  };
  if (!fine) {
    for (const c of cards) {
      // la pasada se mide desde que el vídeo de verdad corre (`playing`), no desde la petición: la carga no se descuenta del tope
      const onPlaying = () => {
        win.clearTimeout(c.timer);
        c.timer = win.setTimeout(() => rest(c), Math.max(0, CARD_VIDEO.TOUCH_PASS_SECONDS - c.video.currentTime) * 1000);
      };
      const onEnded = () => rest(c);
      c.video.addEventListener("playing", onPlaying);
      c.video.addEventListener("ended", onEnded);
      cleanups.push(() => {
        c.video.removeEventListener("playing", onPlaying);
        c.video.removeEventListener("ended", onEnded);
      });
    }
    const inset = `${((1 - CARD_VIDEO.CENTER_BAND) / 2) * 100}%`;
    const band = new win.IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const c = cards.find((k) => k.video === e.target);
          if (!c) continue;
          c.inBand = e.isIntersecting;
          if (!c.inBand) c.spent = false; // salir de la franja la rearma para la próxima vez que quede centrada
        }
        pickCentered();
      },
      { rootMargin: `-${inset} 0px -${inset} 0px`, threshold: 0 },
    );
    cards.forEach((c) => band.observe(c.video));
    cleanups.push(() => band.disconnect());
  }

  // ── fuera de vista (D-BBW-97) y pestaña oculta: pausa y póster ─────────────────────────────────────────────
  const view = new win.IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const c = cards.find((k) => k.video === e.target);
        if (!c) continue;
        c.inView = e.isIntersecting;
        if (!c.inView) rest(c);
        else if (fine && (c.hover || c.focus)) play(c);
      }
      if (!fine) pickCentered();
    },
    { threshold: 0 },
  );
  cards.forEach((c) => view.observe(c.video));
  cleanups.push(() => view.disconnect());

  const onVisibility = () => {
    if (doc.hidden) cards.forEach(rest);
    else if (fine) cards.forEach((c) => (c.hover || c.focus) && play(c));
  };
  doc.addEventListener("visibilitychange", onVisibility);
  cleanups.push(() => doc.removeEventListener("visibilitychange", onVisibility));

  return () => {
    cleanups.forEach((f) => f());
    cards.forEach(rest);
  };
}
