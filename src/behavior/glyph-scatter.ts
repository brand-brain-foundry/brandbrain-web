/**
 * behavior/glyph-scatter.ts — S11 · DESARME de enlaces y botones (M2, 2026-11-06; P-BBW-83; docs/system/BEHAVIOR.md §14).
 * El prototipo aprobado por Zavala el 2026-11-06 (`despachos/2026-11/insumos/M2-prototipo-desarme-aprobado-2026-11-06.html`, v2, profundidad
 * activada) es la ESPECIFICACIÓN LITERAL del movimiento; este código es su porte (método de M1d: copia literal + guardia de identidad R11).
 *
 * QUÉ HACE: al pasar el puntero del ratón, recibir foco o tocar, cada glifo del texto (y cada icono) de un enlace o botón se suelta con x, y
 * (em), giro en el plano y profundidad d ∈ [−1, 1] → escala 1 + 0,28·d y opacidad 1 + 0,22·d si d < 0. Sin giros 3D: la letra siempre se lee.
 * Cada glifo flota hacia un objetivo con tres frecuencias por eje y vuelve con muelle propio y desfase; al asentarse se borra la transformación
 * (reposo exacto, D-BBW-28). Dentro de un párrafo, lo lejano (d < −0,05) pasa detrás del texto; fuera, siempre delante. Piel de botón: el contorno
 * se deshace desde un punto al azar hacia los dos lados; el relleno se encoge hacia un punto al azar y se disuelve. Enlace en texto: el subrayado
 * se recoge (CSS, `base/document.css`). Táctil: despierta `WAKE_HOLD_MS` y suelta; el enlace navega (sin `preventDefault`).
 *
 * UNA FUENTE: todas las constantes del movimiento viven aquí (D-BBW-30). Funciones PURAS (`makeGlyph`, `stepGlyph`, `glyphFrame`, `stepSkin`,
 * `skinFrame`) separadas de las que tocan el DOM (`splitGlyphs`, `fitSkin`, `startScatter`, marcadas). Un solo bucle `requestAnimationFrame`
 * para toda la página, que se para cuando nada está activo ni asentándose. El componente cliente (`GlyphScatter`) solo cablea una vez.
 * CABLEADO PUNTUAL: un componente solo se MARCA (`data-scatter="text|icon|outline|fill|prose"`, `data-scatter-skip` en lo que no se parte); el
 * cableador delega los eventos en `document` y hace el resto. Lo que crea lleva sus propias marcas (`data-scatter-word`, `-glyph`, `-name`, `-skin`).
 * HTML SERVIDO (I-4): el texto íntegro y la piel CSS del átomo; el cliente parte el texto en glifos (dejando el texto literal como nombre oculto
 * visualmente, patrón del repo) y solo mueve. Sin JavaScript no cambia nada.
 * TOKENS QUE LEE (nunca repite): `--bbf-motion-scatter-play-state` (quietud, D-BBW-31) y el grosor del contorno de la piel, que el CSS fija en
 * `--bbf-line-sm` (`stroke-width` computado del `rect`). Los ±1 de capa dentro del párrafo son constantes de algoritmo, no capas del sistema.
 * QUIETUD (I-9): con `paused` no se registra ningún oyente ni rAF (ni se parte el texto): quedan los hovers de reposo del CSS. Pestaña oculta: el
 * bucle se cancela y se reanuda al volver. Un host que deja de verse (fuera de pantalla, oculto, retirado) mientras se asienta salta al reposo.
 * CONSTANTES: origen «ref:Lnn» = línea del prototipo aprobado; clase por D-DOC-13 §2 (estático · plantilla · dinámico).
 */

export type Range = readonly [number, number];

export const SCATTER = Object.freeze({
  /** grados de libertad por glifo: x, y, giro, profundidad · ref:L109 · estático */
  DOF: 4,
  /** alcance del desarme: botón 1 em, enlace 0,75 em · ref:L126 · dinámico */
  REACH_BUTTON: 1,
  REACH_LINK: 0.75,
  /** objetivo base por glifo: radios x e y (× alcance, en una dirección al azar), giro (°) y profundidad · ref:L114 · dinámico */
  BASE_X: [0.3, 0.75] as Range,
  BASE_Y: [0.35, 0.85] as Range,
  BASE_ROT: [-42, 42] as Range,
  BASE_DEPTH: [-1, 1] as Range,
  /** tres frecuencias por eje (rad/s) y sus pesos · ref:L115, L168 · dinámico */
  FREQ: [[0.35, 0.9], [0.9, 1.7], [1.7, 2.6]] as readonly Range[],
  FREQ_WEIGHTS: [0.6, 0.3, 0.1] as readonly number[],
  /** fases iniciales · ref:L116 · estático */
  PHASE: [0, 6.28] as Range,
  /** amplitud de la flotación por eje: x e y × alcance (em), giro (°), profundidad · ref:L117 · dinámico */
  AMP_X: 0.16,
  AMP_Y: 0.2,
  AMP_ROT: 16,
  AMP_DEPTH: 0.45,
  /** muelles por glifo: vivo (subamortiguado) y suelta (más amortiguado) · ref:L118 · plantilla */
  SPRING_K_ON: [70, 110] as Range,
  SPRING_Z_ON: [0.38, 0.52] as Range,
  SPRING_K_OFF: [120, 170] as Range,
  SPRING_Z_OFF: [0.62, 0.78] as Range,
  /** desfase de arranque por glifo (s) y reloj inicial (s) · ref:L119 · plantilla / estático */
  DELAY: [0, 0.07] as Range,
  TIME0: [0, 50] as Range,
  /** profundidad → escala y opacidad; umbral para pasar detrás del texto · ref:L182, L184, L186 · dinámico */
  SCALE_PER_DEPTH: 0.28,
  OPACITY_PER_DEPTH: 0.22,
  BEHIND_DEPTH: -0.05,
  /** energía de reposo Σ|x|·w + |v|·w' y sus pesos por eje · ref:L173, L176 · estático */
  ENERGY_REST: 0.02,
  ENERGY_W_POS: [20, 20, 0.05, 10] as readonly number[],
  ENERGY_W_VEL: [2, 2, 0.01, 2] as readonly number[],
  /** piel del botón: muelle de entrada y de salida, umbral de reposo · ref:L190, L192 · plantilla */
  SKIN_K_ON: 260,
  SKIN_Z_ON: 0.9,
  SKIN_K_OFF: 90,
  SKIN_Z_OFF: 0.75,
  SKIN_REST: 0.002,
  /** relleno: el origen del encogido cae en [0,1; 0,9] del ancho; escala (1 − 0,92·p, 1 − 0,7·p) · ref:L203–L204 · dinámico */
  FILL_ORIGIN_MIN: 0.1,
  FILL_ORIGIN_SPAN: 0.8,
  FILL_SCALE_X: 0.92,
  FILL_SCALE_Y: 0.7,
  /** paso de tiempo: tope y valor por defecto (s) · ref:L155 · estático */
  DT_MAX: 0.033,
  DT_DEFAULT: 0.016,
  /** toque (`pointerdown` no-ratón): cuánto se sostiene antes de soltar · ref:L146 · plantilla */
  WAKE_HOLD_MS: 900,
  /** decimales con que se escriben posición/escala/opacidad, giro y origen · ref:L183, L186, L203–L205 · estático */
  FMT_3: 3,
  FMT_ROT: 1,
  FMT_ORIGIN: 1,
});

export type Glyph = {
  /** estado: x, y (em), giro (°), profundidad · float32 como el prototipo */
  x: Float32Array;
  v: Float32Array;
  layer: number;
  inProse: boolean;
  base: number[];
  fq: number[][];
  ph: number[][];
  amp: number[];
  k: number;
  z: number;
  kOff: number;
  zOff: number;
  delay: number;
  t: number;
};

export type Skin = {
  p: number;
  v: number;
  origin: number;
  outline: boolean;
  perim: number;
  w: number;
  h: number;
};

export type Random = () => number;

const lerp = (random: Random, r: Range) => r[0] + random() * (r[1] - r[0]);

/** Sortea un glifo en el MISMO orden de llamadas a `random` que el prototipo (ref:L110–L121): con la misma semilla, los mismos parámetros. PURA. */
export function makeGlyph(random: Random, reach: number, inProse: boolean): Glyph {
  const C = SCATTER;
  const R = (a: number, b: number) => a + random() * (b - a);
  const dir = R(0, Math.PI * 2);
  return {
    x: new Float32Array(C.DOF),
    v: new Float32Array(C.DOF),
    layer: 0,
    inProse,
    base: [Math.cos(dir) * lerp(random, C.BASE_X) * reach, Math.sin(dir) * lerp(random, C.BASE_Y) * reach, lerp(random, C.BASE_ROT), lerp(random, C.BASE_DEPTH)],
    fq: Array.from({ length: C.DOF }, () => C.FREQ.map((f) => lerp(random, f))),
    ph: Array.from({ length: C.DOF }, () => [lerp(random, C.PHASE), lerp(random, C.PHASE), lerp(random, C.PHASE)]),
    amp: [C.AMP_X * reach, C.AMP_Y * reach, C.AMP_ROT, C.AMP_DEPTH],
    k: lerp(random, C.SPRING_K_ON),
    z: lerp(random, C.SPRING_Z_ON),
    kOff: lerp(random, C.SPRING_K_OFF),
    zOff: lerp(random, C.SPRING_Z_OFF),
    delay: lerp(random, C.DELAY),
    t: lerp(random, C.TIME0),
  };
}

/** Un paso del muelle de un glifo (ref:L160–L174). `live` = el host está activo y ya pasó el desfase del glifo. Devuelve la energía. PURA. */
export function stepGlyph(G: Glyph, dt: number, live: boolean): number {
  const C = SCATTER;
  G.t += dt;
  const k = live ? G.k : G.kOff;
  const z = live ? G.z : G.zOff;
  const c = 2 * z * Math.sqrt(k);
  let e = 0;
  for (let d = 0; d < C.DOF; d++) {
    let tgt = 0;
    if (live) {
      const f = G.fq[d];
      const p = G.ph[d];
      tgt = G.base[d] + G.amp[d] * (Math.sin(f[0] * G.t + p[0]) * C.FREQ_WEIGHTS[0] + Math.sin(f[1] * G.t + p[1]) * C.FREQ_WEIGHTS[1] + Math.sin(f[2] * G.t + p[2]) * C.FREQ_WEIGHTS[2]);
      if (d === 3) tgt = Math.max(-1, Math.min(1, tgt));
    }
    G.v[d] += (-k * (G.x[d] - tgt) - c * G.v[d]) * dt;
    G.x[d] += G.v[d] * dt;
    e += Math.abs(G.x[d]) * C.ENERGY_W_POS[d] + Math.abs(G.v[d]) * C.ENERGY_W_VEL[d];
  }
  return e;
}

/** El glifo vuelve al reposo exacto (ref:L177). PURA. */
export function restGlyph(G: Glyph): void {
  G.x.fill(0);
  G.v.fill(0);
  G.layer = 0;
}

export type GlyphStyle = { transform: string; layer: number; opacity: string };

/** Lo que se escribe en el glifo este fotograma (ref:L181–L186). PURA. */
export function glyphFrame(G: Glyph): GlyphStyle {
  const C = SCATTER;
  const x = G.x[0];
  const y = G.x[1];
  const r = G.x[2];
  const dep = G.x[3];
  const s = 1 + dep * C.SCALE_PER_DEPTH;
  return {
    transform: `translate3d(${x.toFixed(C.FMT_3)}em,${y.toFixed(C.FMT_3)}em,0) rotate(${r.toFixed(C.FMT_ROT)}deg) scale(${s.toFixed(C.FMT_3)})`,
    layer: G.inProse && dep < C.BEHIND_DEPTH ? -1 : 1,
    opacity: dep < 0 ? (1 + dep * C.OPACITY_PER_DEPTH).toFixed(C.FMT_3) : "",
  };
}

/** Un paso del muelle de la piel (ref:L190–L192). Devuelve si sigue ocupada; si no, la deja exacta en su objetivo. PURA. */
export function stepSkin(S: Skin, dt: number, active: boolean): boolean {
  const C = SCATTER;
  const tgt = active ? 1 : 0;
  const k = active ? C.SKIN_K_ON : C.SKIN_K_OFF;
  const z = active ? C.SKIN_Z_ON : C.SKIN_Z_OFF;
  S.v += (-k * (S.p - tgt) - 2 * z * Math.sqrt(k) * S.v) * dt;
  S.p += S.v * dt;
  if (Math.abs(S.p - tgt) + Math.abs(S.v) > C.SKIN_REST) return true;
  S.p = tgt;
  S.v = 0;
  return false;
}

export type SkinStyle =
  | { kind: "outline"; strokeDasharray: string; strokeDashoffset: string }
  | { kind: "fill"; transformOrigin: string; transform: string; opacity: string };

/** Lo que se escribe en el `rect` de la piel este fotograma (ref:L193–L207). PURA. */
export function skinFrame(S: Skin): SkinStyle {
  const C = SCATTER;
  const p = Math.min(1, Math.max(0, S.p));
  if (S.outline) {
    const L = S.perim;
    const vis = L * (1 - p);
    return {
      kind: "outline",
      strokeDasharray: p <= 0 ? "" : `${vis} ${L}`,
      strokeDashoffset: p <= 0 ? "" : `${-(S.origin * L + (L - vis) / 2)}`,
    };
  }
  if (p <= 0) return { kind: "fill", transformOrigin: "", transform: "", opacity: "" };
  return {
    kind: "fill",
    transformOrigin: `${((S.origin * C.FILL_ORIGIN_SPAN + C.FILL_ORIGIN_MIN) * S.w).toFixed(C.FMT_ORIGIN)}px ${(S.h / 2).toFixed(C.FMT_ORIGIN)}px`,
    transform: `scale(${(1 - p * C.FILL_SCALE_X).toFixed(C.FMT_3)},${(1 - p * C.FILL_SCALE_Y).toFixed(C.FMT_3)})`,
    opacity: (1 - p).toFixed(C.FMT_3),
  };
}

/** Paso de tiempo entre dos fotogramas (ref:L155). PURA. */
export function frameDt(ts: number, last: number): number {
  return Math.min(SCATTER.DT_MAX, (ts - last) / 1000 || SCATTER.DT_DEFAULT);
}

// ───────────────────────────── DOM (impuro desde aquí) ─────────────────────────────

/** Marcas del sistema: el host las declara (`data-scatter`), el cableador escribe las demás. */
export const SCATTER_ATTR = "data-scatter";
export const SCATTER_SKIP_ATTR = "data-scatter-skip";
export const SCATTER_ON_ATTR = "data-scatter-on";
export const SCATTER_SKIN_LIVE_ATTR = "data-scatter-skin-live";
const WORD_ATTR = "data-scatter-word";
const GLYPH_ATTR = "data-scatter-glyph";
const NAME_ATTR = "data-scatter-name";
const TEXT_ATTR = "data-scatter-text";
const SKIN_ATTR = "data-scatter-skin";
const SPLIT_ATTR = "data-scatter-split";
const ICON_SELECTOR = 'svg[data-component="bbf-icon"]';
const PLAY_STATE_ROLE = "--bbf-motion-scatter-play-state";
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * AJUSTE ENTRE GLIFOS (diferencia con el prototipo, medida): un glifo por caja (`inline-block`) rompe la conformación del texto corrido
 * (kerning entre pares, también con el espacio y a través del borde del enlace), y «Trayectoria» o un correo se ensanchaban hasta 1,7 px
 * (F1), lo que refluía líneas. Se compensa POR GLIFO con la medida del propio texto en reposo: antes de partir, el avance de cada carácter
 * (`Range`, en la línea ya conformada); después, el margen del glifo = avance − anchura de su caja. Es una MEDIDA en tiempo de ejecución,
 * no un valor de diseño (como la reserva del consentimiento). Una lectura de disposición antes y otra después, una sola vez por host. DOM.
 */
const KERN_EPS = 0.005;
function charAdvances(textNode: Text): number[] {
  const doc = textNode.ownerDocument;
  const out: number[] = [];
  const range = doc.createRange();
  const n = textNode.length;
  for (let i = 0; i < n; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    out.push(range.getBoundingClientRect().width);
  }
  return out;
}
/** U+2060 WORD JOINER: pega el primer y el último glifo a lo que los toca fuera del host sin espacio (un paréntesis, un punto), para que una
 *  caja atómica no abra una oportunidad de corte de línea que el texto no tenía (medido: con cajas atómicas Chrome cortaba entre «(» y
 *  «www.aepd.es» y antes de un «.», y un párrafo de privacidad pasaba de 10 líneas a 9). Carácter de formato, ancho cero, fuera del nombre. */
const WORD_JOINER = "\u2060";
/** Último carácter de texto antes de un nodo (o primero después), mirando como mucho hasta los hermanos del host. */
function charBeside(start: Node, host: Element, after: boolean): string {
  let n: Node | null = start;
  while (n && n !== host.parentNode) {
    const sib: Node | null = after ? n.nextSibling : n.previousSibling;
    if (sib) {
      const t = sib.textContent ?? "";
      if (t.length) return after ? t[0] : t[t.length - 1];
      n = sib;
      continue;
    }
    n = n.parentNode;
  }
  return "";
}

export type SkinKind = "outline" | "fill";
export type HostKind = "text" | "icon" | SkinKind | "prose";

/**
 * Parte el contenido del host en glifos sin cambiar el corte de línea (ref:L83–L107, con las diferencias del repo): cada nodo de texto deja en
 * su sitio un `<span data-scatter-name>` con el texto literal (oculto visualmente: es el nombre accesible, patrón de `NavLink`) y después sus
 * palabras (`aria-hidden`, un glifo por carácter); un icono del puerto se envuelve entero como un glifo; lo marcado `data-scatter-skip` y la
 * piel no se tocan. En un host flex (botones) el texto directo se envuelve antes en un `<span data-scatter-text>` en línea para que las palabras
 * no pasen a ser elementos del flex (perderían sus espacios). DOM.
 */
export function splitGlyphs(host: HTMLElement): HTMLElement[] {
  const doc = host.ownerDocument;
  const glyphs: HTMLElement[] = [];
  const fit: { g: HTMLElement; advance: number }[] = [];
  const display = getComputedStyle(host).display;
  const flexHost = display === "flex" || display === "inline-flex";
  const walk = (node: Element) => {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === Node.TEXT_NODE) {
        const text = ch.textContent ?? "";
        if (!text.trim()) continue;
        const advances = charAdvances(ch as Text);
        const glueBefore = !/^\s/.test(text) && /\S/.test(charBeside(ch, host, false));
        const glueAfter = !/\s$/.test(text) && /\S/.test(charBeside(ch, host, true));
        const words: HTMLElement[] = [];
        const frag = doc.createDocumentFragment();
        const name = doc.createElement("span");
        name.setAttribute(NAME_ATTR, "");
        name.textContent = text;
        frag.appendChild(name);
        let offset = 0;
        text.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) {
            offset += tok.length;
            frag.appendChild(doc.createTextNode(tok));
            return;
          }
          const w = doc.createElement("span");
          w.setAttribute(WORD_ATTR, "");
          w.setAttribute("aria-hidden", "true");
          const chars = [...tok];
          chars.forEach((c) => {
            const g = doc.createElement("span");
            g.setAttribute(GLYPH_ATTR, "");
            g.textContent = c;
            let advance = 0;
            for (let u = 0; u < c.length; u++) advance += advances[offset + u] ?? 0; // un carácter puede ocupar dos unidades UTF-16
            offset += c.length;
            fit.push({ g, advance });
            w.appendChild(g);
            glyphs.push(g);
          });
          frag.appendChild(w);
          words.push(w);
        });
        if (words.length && glueBefore) words[0].prepend(doc.createTextNode(WORD_JOINER));
        if (words.length && glueAfter) words[words.length - 1].append(doc.createTextNode(WORD_JOINER));
        if (flexHost && node === host) {
          const wrap = doc.createElement("span");
          wrap.setAttribute(TEXT_ATTR, "");
          wrap.appendChild(frag);
          ch.replaceWith(wrap);
        } else {
          ch.replaceWith(frag);
        }
      } else if (ch.nodeType === Node.ELEMENT_NODE) {
        const el = ch as Element;
        if (el.hasAttribute(SCATTER_SKIP_ATTR) || el.hasAttribute(SKIN_ATTR) || el.hasAttribute(NAME_ATTR)) continue;
        if (el.matches(ICON_SELECTOR)) {
          const g = doc.createElement("span");
          g.setAttribute(GLYPH_ATTR, "");
          g.setAttribute("aria-hidden", "true");
          el.replaceWith(g);
          g.appendChild(el);
          glyphs.push(g);
        } else {
          walk(el);
        }
      }
    }
  };
  walk(host);
  // segunda lectura: cada glifo recupera el avance que tenía su carácter en el texto corrido
  for (const { g, advance } of fit) {
    const k = advance - g.getBoundingClientRect().width;
    if (Math.abs(k) > KERN_EPS) g.style.marginRight = `${k.toFixed(3)}px`;
  }
  host.setAttribute(SPLIT_ATTR, "");
  return glyphs;
}

type HostState = {
  el: HTMLElement;
  kind: HostKind;
  glyphs: { node: HTMLElement; G: Glyph }[];
  active: boolean;
  since: number;
  skin: Skin | null;
  rect: SVGRectElement | null;
  wake: number;
  visible: boolean;
  busy: boolean;
};

/** Dimensiona la piel como `fit()` del prototipo (ref:L131–L137): inset = mitad del grosor de trazo (el CSS lo fija por rol). DOM. */
export function fitSkin(S: HostState): void {
  if (!S.skin || !S.rect) return;
  const b = S.el.getBoundingClientRect();
  const stroke = S.skin.outline ? parseFloat(getComputedStyle(S.rect).strokeWidth) || 0 : 0;
  const o = stroke / 2;
  S.rect.setAttribute("x", String(o));
  S.rect.setAttribute("y", String(o));
  S.rect.setAttribute("width", String(b.width - o * 2));
  S.rect.setAttribute("height", String(b.height - o * 2));
  S.rect.setAttribute("rx", String((b.height - o * 2) / 2));
  S.skin.perim = S.rect.getTotalLength();
  S.skin.w = b.width;
  S.skin.h = b.height;
}

/**
 * Cablea S11 sobre un documento: delegación en `document` (`pointerenter`/`pointerleave` en captura, `focusin`/`focusout`, `pointerdown`), un solo
 * bucle rAF, pestaña oculta, hosts fuera de pantalla u ocultos. Devuelve la función que lo desmonta. Si el rol de reproducción está en `paused`
 * (movimiento reducido) devuelve antes de registrar nada (I-9). DOM.
 */
export function startScatter(doc: Document, random: Random = Math.random): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};
  if (getComputedStyle(doc.documentElement).getPropertyValue(PLAY_STATE_ROLE).trim() === "paused") return () => {};

  const hosts = new Map<HTMLElement, HostState>();
  let raf = 0;
  let last = 0;
  let stopped = false;

  const observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
        for (const en of entries) {
          const S = hosts.get(en.target as HTMLElement);
          if (S) S.visible = en.isIntersecting;
        }
      })
    : null;

  const hostOf = (t: EventTarget | null): HTMLElement | null => {
    if (!(t instanceof Element)) return null;
    return t.closest<HTMLElement>(`[${SCATTER_ATTR}]`);
  };

  /** Prepara un host la primera vez que hace falta: parte el texto, sortea los glifos y, si es botón, crea la piel. */
  const ensure = (el: HTMLElement): HostState => {
    let S = hosts.get(el);
    if (S) return S;
    const kind = (el.getAttribute(SCATTER_ATTR) || "text") as HostKind;
    const isBtn = kind === "outline" || kind === "fill";
    const inProse = kind === "prose";
    const nodes = el.hasAttribute(SPLIT_ATTR) ? ([...el.querySelectorAll<HTMLElement>(`[${GLYPH_ATTR}]`)]) : splitGlyphs(el);
    const reach = isBtn ? SCATTER.REACH_BUTTON : SCATTER.REACH_LINK;
    S = { el, kind, glyphs: nodes.map((node) => ({ node, G: makeGlyph(random, reach, inProse) })), active: false, since: 0, skin: null, rect: null, wake: 0, visible: true, busy: false };
    if (isBtn) {
      let svg = el.querySelector<SVGSVGElement>(`svg[${SKIN_ATTR}]`);
      if (!svg) {
        svg = doc.createElementNS(SVG_NS, "svg");
        svg.setAttribute(SKIN_ATTR, "");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        svg.appendChild(doc.createElementNS(SVG_NS, "rect"));
        el.appendChild(svg);
      }
      S.rect = svg.querySelector("rect");
      S.skin = { p: 0, v: 0, origin: 0, outline: kind === "outline", perim: 0, w: 0, h: 0 };
      fitSkin(S);
    }
    hosts.set(el, S);
    observer?.observe(el);
    return S;
  };

  const kick = () => {
    if (!raf && !stopped && !doc.hidden) {
      last = performance.now();
      raf = win.requestAnimationFrame(frame);
    }
  };

  const on = (el: HTMLElement) => {
    const S = ensure(el);
    if (S.active) return;
    S.active = true;
    el.setAttribute(SCATTER_ON_ATTR, "");
    if (S.skin) {
      S.skin.origin = random();
      el.setAttribute(SCATTER_SKIN_LIVE_ATTR, "");
    } else {
      random();
    }
    S.since = performance.now();
    S.busy = true; // el bucle lo visita al menos una vez aunque se suelte en el mismo instante (toque, salida inmediata)
    kick();
  };

  const off = (el: HTMLElement) => {
    const S = hosts.get(el);
    if (!S) return;
    S.active = false;
    el.removeAttribute(SCATTER_ON_ATTR);
    kick();
  };

  /** Reposo inmediato de un host (fuera de la vista o ya no renderizado): sin fotogramas intermedios, que nadie vería. */
  const snap = (S: HostState) => {
    for (const { node, G } of S.glyphs) {
      restGlyph(G);
      const st = node.style;
      if (st.transform) {
        st.transform = "";
        st.zIndex = "";
        st.opacity = "";
      }
    }
    if (S.skin && S.rect) {
      S.skin.p = 0;
      S.skin.v = 0;
      const r = S.rect.style;
      r.strokeDasharray = "";
      r.strokeDashoffset = "";
      r.transform = "";
      r.transformOrigin = "";
      r.opacity = "";
      S.el.removeAttribute(SCATTER_SKIN_LIVE_ATTR);
    }
    S.busy = false;
  };

  const rendered = (el: HTMLElement) => el.isConnected && el.getClientRects().length > 0;

  const frame = (ts: number) => {
    raf = 0;
    if (stopped) return;
    const dt = frameDt(ts, last);
    last = ts;
    let busy = false;
    for (const S of hosts.values()) {
      if (S.active && !rendered(S.el)) {
        S.active = false;
        S.el.removeAttribute(SCATTER_ON_ATTR);
      }
      if (!S.active && !S.busy) continue;
      if (!S.active && !S.visible) {
        snap(S);
        continue;
      }
      let hostBusy = false;
      const held = S.active ? (ts - S.since) / 1000 : 0;
      for (const { node, G } of S.glyphs) {
        const live = S.active && held > G.delay;
        const e = stepGlyph(G, dt, live);
        const st = node.style;
        if (!S.active && e < SCATTER.ENERGY_REST) {
          restGlyph(G);
          if (st.transform) {
            st.transform = "";
            st.zIndex = "";
            st.opacity = "";
          }
        } else {
          hostBusy = true;
          const f = glyphFrame(G);
          st.transform = f.transform;
          if (f.layer !== G.layer) {
            st.zIndex = String(f.layer);
            G.layer = f.layer;
          }
          st.opacity = f.opacity;
        }
      }
      if (S.skin && S.rect) {
        if (stepSkin(S.skin, dt, S.active)) hostBusy = true;
        const f = skinFrame(S.skin);
        const r = S.rect.style;
        if (f.kind === "outline") {
          r.strokeDasharray = f.strokeDasharray;
          r.strokeDashoffset = f.strokeDashoffset;
        } else {
          r.transformOrigin = f.transformOrigin;
          r.transform = f.transform;
          r.opacity = f.opacity;
        }
        if (!S.active && S.skin.p <= 0) S.el.removeAttribute(SCATTER_SKIN_LIVE_ATTR);
      }
      S.busy = hostBusy;
      if (hostBusy) busy = true;
    }
    if (busy) raf = win.requestAnimationFrame(frame);
  };

  const onEnter = (e: Event) => {
    const h = hostOf(e.target);
    if (h && e.target === h && (e as PointerEvent).pointerType === "mouse") on(h);
  };
  const onLeave = (e: Event) => {
    const h = hostOf(e.target);
    if (h && e.target === h && (e as PointerEvent).pointerType === "mouse") off(h);
  };
  const onFocusIn = (e: Event) => {
    const h = hostOf(e.target);
    if (h && e.target === h) on(h);
  };
  const onFocusOut = (e: Event) => {
    const h = hostOf(e.target);
    if (h && e.target === h) off(h);
  };
  const onDown = (e: Event) => {
    if ((e as PointerEvent).pointerType === "mouse") return;
    const h = hostOf(e.target);
    if (!h) return;
    on(h);
    const S = hosts.get(h);
    if (!S) return;
    win.clearTimeout(S.wake);
    S.wake = win.setTimeout(() => {
      off(h);
      h.blur();
    }, SCATTER.WAKE_HOLD_MS);
  };
  const onVisibility = () => {
    if (doc.hidden) {
      if (raf) {
        win.cancelAnimationFrame(raf);
        raf = 0;
      }
    } else {
      for (const S of hosts.values()) if (S.active || S.busy) return kick();
    }
  };
  const onResize = () => {
    for (const S of hosts.values()) if (S.skin) fitSkin(S);
  };

  doc.addEventListener("pointerenter", onEnter, true);
  doc.addEventListener("pointerleave", onLeave, true);
  doc.addEventListener("focusin", onFocusIn);
  doc.addEventListener("focusout", onFocusOut);
  doc.addEventListener("pointerdown", onDown, { passive: true });
  doc.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("resize", onResize);

  return () => {
    stopped = true;
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
    doc.removeEventListener("pointerenter", onEnter, true);
    doc.removeEventListener("pointerleave", onLeave, true);
    doc.removeEventListener("focusin", onFocusIn);
    doc.removeEventListener("focusout", onFocusOut);
    doc.removeEventListener("pointerdown", onDown);
    doc.removeEventListener("visibilitychange", onVisibility);
    win.removeEventListener("resize", onResize);
    observer?.disconnect();
    for (const S of hosts.values()) {
      win.clearTimeout(S.wake);
      S.active = false;
      S.el.removeAttribute(SCATTER_ON_ATTR);
      snap(S);
    }
    hosts.clear();
  };
}
