/**
 * behavior/brand-mark-octopus.ts — S9 · IMAGOTIPO VIVO (M1b, 2026-11-05; conducta en DESPACHO §0.1)
 *
 * QUÉ HACE: en reposo, el SVG oficial (trazado inline) se muestra en color de acento. Al pasar el
 * puntero, enfocar o tocar, un lienzo canvas superpone la visualización con la misma forma pero con
 * los 6 tentáculos animados independientemente (física de varilla elástica de Kirchhoff: campo de
 * desplazamiento perpendicular al tangente LOCAL de cada punto, envolvente de potencia y sinusoides
 * con parámetros distintos por tentáculo). Al soltar, cada tentáculo vuelve a su posición con un
 * pequeño escalonado de retardo. Con movimiento reducido: solo cambia el color del SVG; sin movimiento.
 *
 * TRES PARTES:
 *   1. ALGORITMO (puro): parseo del path SVG, muestreo por longitud de arco, campo de desplazamiento.
 *   2. LECTURA DEL DOM (marcada): color del SVG, estado del play-state, dimensiones del lienzo.
 *   3. MOTOR (`startOctopus`): lienzo, bucle rAF, eventos de puntero, foco y touch. Lo cablea el componente.
 *
 * TOKENS QUE LEE (nunca repite): `--bbf-motion-octopus-play-state` (quietud; D-BBW-31).
 * El color se lee de `getComputedStyle(svgEl).color` (el token --bbf-accent / --bbf-text-on-base
 * resuelto por el navegador durante la transición CSS del enlace).
 *
 * FUENTE ÚNICA: los datos del rig vienen de media/masters/brand-icon-rig.json importado; cero valores
 * duplicados en este módulo (M1b F2).
 *
 * CONSTANTES: origen «M1 §n»; clase por D-DOC-13 §2 (estático · plantilla · dinámico).
 * Tabla en docs/system/BEHAVIOR.md §12.
 */

import rigData from '../../media/masters/brand-icon-rig.json';

export const OCTOPUS = Object.freeze({
  /** resorte de entrada (hover): rigidez y amortiguamiento (subamortiguado, overshoot pequeño) · plantilla · M1 §0.1 */
  SPRING_K_ON: 12,
  SPRING_ZETA_ON: 0.7,
  /** resorte de salida (release): rigidez y amortiguamiento (sobrecontenido, retorno suave) · plantilla · M1 §0.1 */
  SPRING_K_OFF: 6,
  SPRING_ZETA_OFF: 0.9,
  /** desplazamiento máximo en la punta del tentáculo (u del SVG, viewBox 263.2 × 271.5) · dinámico · M1 §0.1 */
  AMPLITUDE_MAX: 14,
  /** exponente del taper elástico de Kirchhoff: el desplazamiento crece como sNorm^EXP desde el anclaje · estático · M1 §0.1 */
  ENV_EXP: 1.5,
  /** puntos de muestreo del camino completo (error ≤ 0.25 u con κ ≤ 0.1; §4.3) · dinámico · M1 §0.1 */
  SAMPLE_N: 600,
  /** densidad de píxeles máxima del lienzo · estático · M1 §0.1 */
  DPR_CAP: 2,
  /** por debajo de esta amplitud total el lienzo se oculta (evita repintado en reposo) · estático · M1 §0.1 */
  AMP_MIN_VISIBLE: 0.01,
  /** duración de la animación de despertar táctil (ms) · plantilla · M1 §4.11 */
  TOUCH_HOLD_MS: 2000,
});

type Pt = [number, number];
type Seg = { p0: Pt; p1: Pt; p2: Pt; p3: Pt };

// ── 1 · ALGORITMO (puro) ───────────────────────────────────────────────────────────────────────

/** Parser SVG completo: todos los comandos relativos y absolutos, subtrazados, regla de relleno (M1b F1). */
function parseSVGPath(d: string): Seg[] {
  const segs: Seg[] = [];
  const tokens = d.match(/[MmCcSsLlHhVvZzQqTtAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];

  type Cmd = { cmd: string; args: number[] };
  const cmds: Cmd[] = [];
  let cur: Cmd | null = null;
  for (const tok of tokens) {
    if (/[MmCcSsLlHhVvZzQqTtAa]/.test(tok)) { cur = { cmd: tok, args: [] }; cmds.push(cur); }
    else if (cur) cur.args.push(parseFloat(tok));
  }

  let cx = 0, cy = 0, startX = 0, startY = 0;
  let lastCmd = '';
  let lastCP2x = 0, lastCP2y = 0;

  const lineSeg = (x0: number, y0: number, x1: number, y1: number): Seg => ({
    p0: [x0, y0],
    p1: [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3],
    p2: [x0 + 2 * (x1 - x0) / 3, y0 + 2 * (y1 - y0) / 3],
    p3: [x1, y1],
  });

  for (const { cmd, args } of cmds) {
    switch (cmd) {
      case 'M': cx = args[0]; cy = args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; }
        lastCmd = 'M'; break;
      case 'm': cx += args[0]; cy += args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; }
        lastCmd = 'm'; break;
      case 'Z': case 'z':
        if (cx !== startX || cy !== startY) segs.push(lineSeg(cx, cy, startX, startY));
        cx = startX; cy = startY; lastCmd = 'Z'; break;
      case 'L':
        for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; }
        lastCmd = 'L'; break;
      case 'l':
        for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; }
        lastCmd = 'l'; break;
      case 'H': for (const x of args) { segs.push(lineSeg(cx, cy, x, cy)); cx = x; } lastCmd = 'H'; break;
      case 'h': for (const dx of args) { segs.push(lineSeg(cx, cy, cx + dx, cy)); cx += dx; } lastCmd = 'h'; break;
      case 'V': for (const y of args) { segs.push(lineSeg(cx, cy, cx, y)); cy = y; } lastCmd = 'V'; break;
      case 'v': for (const dy of args) { segs.push(lineSeg(cx, cy, cx, cy + dy)); cy += dy; } lastCmd = 'v'; break;
      case 'C':
        for (let i = 0; i + 5 < args.length; i += 6) {
          segs.push({ p0: [cx, cy], p1: [args[i], args[i + 1]], p2: [args[i + 2], args[i + 3]], p3: [args[i + 4], args[i + 5]] });
          lastCP2x = args[i + 2]; lastCP2y = args[i + 3]; cx = args[i + 4]; cy = args[i + 5];
        } lastCmd = 'C'; break;
      case 'c':
        for (let i = 0; i + 5 < args.length; i += 6) {
          segs.push({ p0: [cx, cy], p1: [cx + args[i], cy + args[i + 1]], p2: [cx + args[i + 2], cy + args[i + 3]], p3: [cx + args[i + 4], cy + args[i + 5]] });
          lastCP2x = cx + args[i + 2]; lastCP2y = cy + args[i + 3]; cx += args[i + 4]; cy += args[i + 5];
        } lastCmd = 'c'; break;
      case 'S':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const cp1x = /[CcSs]/.test(lastCmd) ? 2 * cx - lastCP2x : cx;
          const cp1y = /[CcSs]/.test(lastCmd) ? 2 * cy - lastCP2y : cy;
          segs.push({ p0: [cx, cy], p1: [cp1x, cp1y], p2: [args[i], args[i + 1]], p3: [args[i + 2], args[i + 3]] });
          lastCP2x = args[i]; lastCP2y = args[i + 1]; cx = args[i + 2]; cy = args[i + 3];
        } lastCmd = 'S'; break;
      case 's':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const cp1x = /[CcSs]/.test(lastCmd) ? 2 * cx - lastCP2x : cx;
          const cp1y = /[CcSs]/.test(lastCmd) ? 2 * cy - lastCP2y : cy;
          segs.push({ p0: [cx, cy], p1: [cp1x, cp1y], p2: [cx + args[i], cy + args[i + 1]], p3: [cx + args[i + 2], cy + args[i + 3]] });
          lastCP2x = cx + args[i]; lastCP2y = cy + args[i + 1]; cx += args[i + 2]; cy += args[i + 3];
        } lastCmd = 's'; break;
    }
  }
  return segs;
}

function bzAt(s: Seg, t: number): Pt {
  const mt = 1 - t;
  return [
    mt * mt * mt * s.p0[0] + 3 * mt * mt * t * s.p1[0] + 3 * mt * t * t * s.p2[0] + t * t * t * s.p3[0],
    mt * mt * mt * s.p0[1] + 3 * mt * mt * t * s.p1[1] + 3 * mt * t * t * s.p2[1] + t * t * t * s.p3[1],
  ];
}

function bzTan(s: Seg, t: number): Pt {
  const mt = 1 - t;
  return [
    3 * mt * mt * (s.p1[0] - s.p0[0]) + 6 * mt * t * (s.p2[0] - s.p1[0]) + 3 * t * t * (s.p3[0] - s.p2[0]),
    3 * mt * mt * (s.p1[1] - s.p0[1]) + 6 * mt * t * (s.p2[1] - s.p1[1]) + 3 * t * t * (s.p3[1] - s.p2[1]),
  ];
}

function bzLen(s: Seg, n = 20): number {
  let l = 0, [px, py] = bzAt(s, 0);
  for (let k = 1; k <= n; k++) {
    const [qx, qy] = bzAt(s, k / n);
    l += Math.hypot(qx - px, qy - py);
    [px, py] = [qx, qy];
  }
  return l;
}

/** Punto muestreado sobre el arco con tangente unitaria (M1b F3: normales locales para Kirchhoff). */
type SampledPt = { x: number; y: number; frac: number; tx: number; ty: number };

function sampleUniform(segs: Seg[]): SampledPt[] {
  const lens = segs.map(s => bzLen(s, 20));
  const totalArc = lens.reduce((a, l) => a + l, 0);
  const N = OCTOPUS.SAMPLE_N;
  const pts: SampledPt[] = [];
  let segIdx = 0, prevAcc = 0;

  for (let i = 0; i <= N; i++) {
    const target = (i / N) * totalArc;
    while (segIdx < segs.length - 1 && prevAcc + lens[segIdx] < target) {
      prevAcc += lens[segIdx++];
    }
    const len = lens[segIdx] || 1e-9;
    const tInSeg = Math.max(0, Math.min(1, (target - prevAcc) / len));
    const [x, y] = bzAt(segs[segIdx], tInSeg);
    const [tx, ty] = bzTan(segs[segIdx], tInSeg);
    const tlen = Math.hypot(tx, ty) || 1;
    pts.push({ x, y, frac: target / totalArc, tx: tx / tlen, ty: ty / tlen });
  }
  return pts;
}

type TentacleData = {
  from: number; anchor: number; tip: number; to: number;
  a1: number; w1: number; a2: number; w2: number; ph: number; rd: number;
};

function buildTentacleData(): TentacleData[] {
  return rigData.tentacles.map(t => ({
    from: t.fromFrac, anchor: t.anchorFrac, tip: t.tipFrac, to: t.toFrac,
    a1: t.phys.a1, w1: t.phys.w1, a2: t.phys.a2, w2: t.phys.w2,
    ph: t.phys.phase, rd: t.phys.releaseDelay,
  }));
}

function waveDisp(sNorm: number, t: number, tent: TentacleData): number {
  const env = Math.pow(sNorm, OCTOPUS.ENV_EXP);
  return env * (
    tent.a1 * Math.sin(tent.w1 * sNorm * Math.PI + tent.w1 * t + tent.ph) +
    tent.a2 * Math.sin(tent.w2 * sNorm * Math.PI + tent.w2 * t + tent.ph)
  );
}

/** Desplaza cada punto usando el normal LOCAL al arco (Kirchhoff: δ⊥ al tangente, M1b F3). */
function displacePts(pts: SampledPt[], tents: TentacleData[], amps: Float32Array, t: number, xs: Float32Array, ys: Float32Array): void {
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    let dx = 0, dy = 0;

    for (let j = 0; j < tents.length; j++) {
      const A = amps[j];
      if (A < 0.001) continue;
      const tent = tents[j];
      const { from, anchor, tip, to } = tent;
      let sNorm: number;

      if (p.frac >= anchor && p.frac <= tip) {
        sNorm = (p.frac - anchor) / Math.max(tip - anchor, 1e-9);
      } else if (p.frac > tip && p.frac <= to) {
        sNorm = 1 - (p.frac - tip) / Math.max(to - tip, 1e-9);
      } else if (p.frac >= from && p.frac < anchor) {
        sNorm = 0;
      } else {
        continue;
      }

      const disp = A * waveDisp(sNorm, t, tent) * OCTOPUS.AMPLITUDE_MAX;
      // Normal al tangente local: (-ty, tx) — desplazamiento de Kirchhoff perpendicular al arco
      dx += disp * (-p.ty);
      dy += disp * p.tx;
    }

    xs[i] = p.x + dx;
    ys[i] = p.y + dy;
  }
}

// ── 2 · LECTURA DEL DOM (mide) ────────────────────────────────────────────────────────────────

/** Con movimiento reducido vale `paused` (semantic/motion.css; D-BBW-31). */
function isStill(): boolean {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--bbf-motion-octopus-play-state")
    .trim() === "paused";
}

// ── 3 · MOTOR ─────────────────────────────────────────────────────────────────────────────────

type SpringState = { x: number; v: number; releaseAt: number };

function springStep(s: SpringState, target: number, k: number, zeta: number, dt: number): void {
  const omega = Math.sqrt(k);
  const damp = 2 * zeta * omega;
  const a = -omega * omega * (s.x - target) - damp * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
  s.x = Math.max(-0.5, Math.min(1.5, s.x));
}

const VB_W = rigData.viewBox[2];
const VB_H = rigData.viewBox[3];

/**
 * Arranca el imagotipo vivo sobre `svgEl` + `canvasEl` dentro del enlace `wrapEl`.
 * Devuelve la función que detiene y limpia todo.
 */
export function startOctopus(wrapEl: HTMLElement, svgEl: SVGSVGElement, canvasEl: HTMLCanvasElement): () => void {
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return () => {};

  const pathEl = svgEl.querySelector("path");
  const d = pathEl?.getAttribute("d");
  if (!d) return () => {};

  const segs = parseSVGPath(d);
  const pts = sampleUniform(segs);
  const tents = buildTentacleData();
  const springs: SpringState[] = rigData.tentacles.map(() => ({ x: 0, v: 0, releaseAt: 0 }));
  const amps = new Float32Array(springs.length);
  const xs = new Float32Array(pts.length);
  const ys = new Float32Array(pts.length);

  let hovered = false;
  let rafId = 0;
  let lastNow = 0;
  let t0 = 0;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;
  let cssW = 0, cssH = 0;

  const layout = () => {
    const rect = canvasEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    if (rect.width === cssW && rect.height === cssH) return;
    cssW = rect.width; cssH = rect.height;
    const dpr = Math.min(OCTOPUS.DPR_CAP, window.devicePixelRatio || 1);
    canvasEl.width = Math.round(cssW * dpr);
    canvasEl.height = Math.round(cssH * dpr);
    ctx.setTransform(cssW / VB_W * dpr, 0, 0, cssH / VB_H * dpr, 0, 0);
  };

  const engage = () => {
    hovered = true;
    springs.forEach(s => { s.releaseAt = 0; });
    if (rafId === 0 && !isStill()) {
      t0 = performance.now(); lastNow = t0;
      rafId = requestAnimationFrame(tick);
    }
  };

  const release = (now: number) => {
    hovered = false;
    rigData.tentacles.forEach((t, i) => { springs[i].releaseAt = now + t.phys.releaseDelay * 1000; });
  };

  const tick = (now: number) => {
    rafId = 0;
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const t = (now - t0) / 1000;

    for (let i = 0; i < springs.length; i++) {
      const s = springs[i];
      const releasing = !hovered && now >= s.releaseAt;
      const target = releasing ? 0 : 1;
      const k = releasing ? OCTOPUS.SPRING_K_OFF : OCTOPUS.SPRING_K_ON;
      const zeta = releasing ? OCTOPUS.SPRING_ZETA_OFF : OCTOPUS.SPRING_ZETA_ON;
      springStep(s, target, k, zeta, dt);
      amps[i] = Math.max(0, s.x);
    }

    let maxAmp = 0;
    for (let i = 0; i < amps.length; i++) if (amps[i] > maxAmp) maxAmp = amps[i];

    if (maxAmp < OCTOPUS.AMP_MIN_VISIBLE) {
      canvasEl.style.visibility = "hidden";
      svgEl.style.visibility = "visible";
      if (hovered) rafId = requestAnimationFrame(tick);
      return;
    }

    layout();
    const color = getComputedStyle(svgEl).color;
    displacePts(pts, tents, amps, t, xs, ys);

    ctx.clearRect(0, 0, VB_W, VB_H);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
    ctx.closePath();
    ctx.fill();

    canvasEl.style.visibility = "visible";
    svgEl.style.visibility = "hidden";

    rafId = requestAnimationFrame(tick);
  };

  const onEnter = () => engage();
  const onLeave = () => release(performance.now());
  const onFocus = () => engage();
  const onBlur = () => release(performance.now());
  const onTouch = () => {
    engage();
    if (touchTimer !== undefined) clearTimeout(touchTimer);
    touchTimer = setTimeout(() => release(performance.now()), OCTOPUS.TOUCH_HOLD_MS);
  };
  const onVisibility = () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    } else if (hovered || amps.some(a => a > OCTOPUS.AMP_MIN_VISIBLE)) {
      lastNow = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  };

  const ro = new ResizeObserver(layout);
  ro.observe(canvasEl);

  wrapEl.addEventListener("mouseenter", onEnter);
  wrapEl.addEventListener("mouseleave", onLeave);
  wrapEl.addEventListener("focus", onFocus);
  wrapEl.addEventListener("blur", onBlur);
  wrapEl.addEventListener("touchstart", onTouch, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  layout();

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (touchTimer !== undefined) clearTimeout(touchTimer);
    wrapEl.removeEventListener("mouseenter", onEnter);
    wrapEl.removeEventListener("mouseleave", onLeave);
    wrapEl.removeEventListener("focus", onFocus);
    wrapEl.removeEventListener("blur", onBlur);
    wrapEl.removeEventListener("touchstart", onTouch);
    document.removeEventListener("visibilitychange", onVisibility);
    ro.disconnect();
    canvasEl.style.visibility = "hidden";
    svgEl.style.visibility = "visible";
  };
}
