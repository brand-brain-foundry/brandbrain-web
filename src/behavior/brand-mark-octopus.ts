/**
 * behavior/brand-mark-octopus.ts — S9 · IMAGOTIPO VIVO (M1b, 2026-11-05; conducta en DESPACHO §0.1)
 *
 * QUÉ HACE: en reposo, el SVG oficial (trazado inline) se muestra en color de acento. Al pasar el
 * puntero, enfocar o entrar en viewport, un lienzo canvas superpone SOLO LOS TENTÁCULOS con el
 * modelo de varilla elástica de Kirchhoff: perturba κ(s) con sinusoide × envolvente × amplitud de
 * resorte; integra ángulos para obtener la columna deformada; traza ±w/2 en la normal LOCAL. El SVG
 * permanece siempre visible (el cuerpo nunca desaparece). El canvas borra la posición de reposo con
 * --bbf-base antes de dibujar la deformada. Con movimiento reducido: solo cambia el color; sin motor.
 *
 * TRES PARTES:
 *   1. PARSER SVG (exportado para guardia y verificación).
 *   2. MODELO DE KIRCHHOFF (puro): precalcula normales / Δs / κ-escala por tentáculo; integra por cuadro.
 *   3. MOTOR (`startOctopus`): lienzo, bucle rAF, eventos puntero, foco, IntersectionObserver y scroll.
 *
 * TOKENS QUE LEE (nunca repite): `--bbf-motion-octopus-play-state` (quietud; D-BBW-31), `--bbf-base`
 * (borrado de reposo). El color del icono se lee de `getComputedStyle(svgEl).color`.
 *
 * FUENTE ÚNICA: geometría en media/masters/brand-icon-rig.json (schema v2, M1b F2).
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
  /** exponente del taper elástico de Kirchhoff: κ crece como sNorm^EXP desde el anclaje · estático · M1 §0.1 */
  ENV_EXP: 1.5,
  /** densidad de píxeles máxima del lienzo · estático · M1 §0.1 */
  DPR_CAP: 2,
  /** por debajo de esta amplitud total el lienzo se oculta (evita repintado en reposo) · estático · M1 §0.1 */
  AMP_MIN_VISIBLE: 0.01,
  /** duración de la animación de despertar táctil / por viewport (ms) · plantilla · M1 §4.11 */
  TOUCH_HOLD_MS: 2000,
  /** velocidad de scroll a la que la amplitud scroll = 1 (px/s) · dinámico · M1b §F5 */
  SCROLL_VEL_MAX: 300,
});

type Pt = [number, number];
type Seg = { p0: Pt; p1: Pt; p2: Pt; p3: Pt };

// ── 1 · PARSER SVG COMPLETO (exportado para uso en scripts de guardia y verificación) ──────────

/** Parser SVG completo: todos los comandos relativos y absolutos, subtrazados, curvas suaves (M1b F1). */
export function parseSVGPath(d: string): Seg[] {
  const segs: Seg[] = [];
  const tokens = d.match(/[MmCcSsLlHhVvZzQqTtAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];

  type Cmd = { cmd: string; args: number[] };
  const cmds: Cmd[] = [];
  let cur: Cmd | null = null;
  for (const tok of tokens) {
    if (/[MmCcSsLlHhVvZzQqTtAa]/.test(tok)) { cur = { cmd: tok, args: [] }; cmds.push(cur); }
    else if (cur) cur.args.push(parseFloat(tok));
  }

  let cx = 0, cy = 0, startX = 0, startY = 0, lastCmd = '', lastCpx = 0, lastCpy = 0;
  const lineSeg = (x0: number, y0: number, x1: number, y1: number): Seg => ({
    p0: [x0, y0], p1: [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3],
    p2: [x0 + 2 * (x1 - x0) / 3, y0 + 2 * (y1 - y0) / 3], p3: [x1, y1],
  });
  const cubicSeg = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): Seg => ({
    p0: [cx, cy], p1: [x1, y1], p2: [x2, y2], p3: [x3, y3],
  });

  for (const { cmd, args } of cmds) {
    switch (cmd) {
      case 'M': cx = args[0]; cy = args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; } lastCmd = 'M'; break;
      case 'm': cx += args[0]; cy += args[1]; startX = cx; startY = cy;
        for (let i = 2; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; } lastCmd = 'm'; break;
      case 'Z': case 'z':
        if (cx !== startX || cy !== startY) segs.push(lineSeg(cx, cy, startX, startY));
        cx = startX; cy = startY; lastCmd = 'Z'; break;
      case 'L':
        for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, args[i], args[i + 1])); cx = args[i]; cy = args[i + 1]; } lastCmd = 'L'; break;
      case 'l':
        for (let i = 0; i + 1 < args.length; i += 2) { segs.push(lineSeg(cx, cy, cx + args[i], cy + args[i + 1])); cx += args[i]; cy += args[i + 1]; } lastCmd = 'l'; break;
      case 'H': for (const x of args) { segs.push(lineSeg(cx, cy, x, cy)); cx = x; } lastCmd = 'H'; break;
      case 'h': for (const dx of args) { segs.push(lineSeg(cx, cy, cx + dx, cy)); cx += dx; } lastCmd = 'h'; break;
      case 'V': for (const y of args) { segs.push(lineSeg(cx, cy, cx, y)); cy = y; } lastCmd = 'V'; break;
      case 'v': for (const dy of args) { segs.push(lineSeg(cx, cy, cx, cy + dy)); cy += dy; } lastCmd = 'v'; break;
      case 'C':
        for (let i = 0; i + 5 < args.length; i += 6) {
          segs.push(cubicSeg(args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], args[i + 5]));
          lastCpx = args[i + 2]; lastCpy = args[i + 3]; cx = args[i + 4]; cy = args[i + 5];
        } lastCmd = 'C'; break;
      case 'c':
        for (let i = 0; i + 5 < args.length; i += 6) {
          segs.push(cubicSeg(cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3], cx + args[i + 4], cy + args[i + 5]));
          lastCpx = cx + args[i + 2]; lastCpy = cy + args[i + 3]; cx += args[i + 4]; cy += args[i + 5];
        } lastCmd = 'c'; break;
      case 'S':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const cp1x = /[CcSs]/.test(lastCmd) ? 2 * cx - lastCpx : cx;
          const cp1y = /[CcSs]/.test(lastCmd) ? 2 * cy - lastCpy : cy;
          segs.push(cubicSeg(cp1x, cp1y, args[i], args[i + 1], args[i + 2], args[i + 3]));
          lastCpx = args[i]; lastCpy = args[i + 1]; cx = args[i + 2]; cy = args[i + 3];
        } lastCmd = 'S'; break;
      case 's':
        for (let i = 0; i + 3 < args.length; i += 4) {
          const cp1x = /[CcSs]/.test(lastCmd) ? 2 * cx - lastCpx : cx;
          const cp1y = /[CcSs]/.test(lastCmd) ? 2 * cy - lastCpy : cy;
          segs.push(cubicSeg(cp1x, cp1y, cx + args[i], cy + args[i + 1], cx + args[i + 2], cy + args[i + 3]));
          lastCpx = cx + args[i]; lastCpy = cy + args[i + 1]; cx += args[i + 2]; cy += args[i + 3];
        } lastCmd = 's'; break;
    }
  }
  return segs;
}

// ── 2 · MODELO DE KIRCHHOFF ──────────────────────────────────────────────────────────────────

type RigPhys = { a1: number; w1: number; a2: number; w2: number; phase: number; releaseDelay: number };
type RigTemplate = {
  id: string; cl: [number, number][]; widths: number[]; arcLength: number;
  kappaScale: number; natAngles: Float32Array; deltaS: Float32Array;
  restingContour: Pt[]; phys: RigPhys;
};
type TentacleState = RigTemplate & { _angles: Float32Array; _spine: Pt[] };
type SpringState = { x: number; v: number; releaseAt: number };

function buildContour(spine: [number, number][] | Pt[], widths: number[], angles: Float32Array | number[]): Pt[] {
  const N = spine.length;
  const left: Pt[] = new Array(N);
  const right: Pt[] = new Array(N);
  for (let i = 0; i < N; i++) {
    const w = widths[i] / 2;
    const nx = -Math.sin(angles[i]);
    const ny =  Math.cos(angles[i]);
    left[i]  = [spine[i][0] + w * nx, spine[i][1] + w * ny];
    right[i] = [spine[i][0] - w * nx, spine[i][1] - w * ny];
  }
  return [...left, ...right.reverse()];
}

/** Construye las plantillas inmutables (una vez en el módulo; sin scratch). */
function buildRigTemplates(): RigTemplate[] {
  return rigData.tentacles.map(t => {
    const cl = (t as unknown as { centerline: [number, number][] }).centerline;
    const widths = (t as unknown as { widths: number[] }).widths;
    const arcLength = (t as unknown as { arcLength: number }).arcLength;
    const rigNatAngles = (t as unknown as { natAngles: number[] }).natAngles;
    const N = cl.length;

    const natAngles = new Float32Array(rigNatAngles);
    const deltaS = new Float32Array(N);
    for (let i = 0; i < N - 1; i++) {
      const dx = cl[i + 1][0] - cl[i][0];
      const dy = cl[i + 1][1] - cl[i][1];
      deltaS[i] = Math.hypot(dx, dy) || 1e-9;
    }
    deltaS[N - 1] = deltaS[N - 2] ?? 0;

    const kappaScale = (2 * OCTOPUS.AMPLITUDE_MAX) / (arcLength * arcLength);
    const restingContour = buildContour(cl, widths, natAngles);

    return { id: t.id, cl, widths, arcLength, kappaScale, natAngles, deltaS, restingContour, phys: t.phys as RigPhys };
  });
}

const rigTemplates = buildRigTemplates();

/**
 * Integración de Kirchhoff: perturba κ(s) = κ_nat(s) + springAmp × kappaScale × env × sinusoide;
 * integra ángulos tangentes → columna deformada con acotación al viewBox (M1b F4).
 */
function kirchhoffDeform(state: TentacleState, springAmp: number, time: number): void {
  const { cl, natAngles, deltaS, kappaScale, phys, _angles, _spine } = state;
  const N = cl.length;
  const VW = rigData.viewBox[2] as number;
  const VH = rigData.viewBox[3] as number;
  _angles[0] = natAngles[0];

  for (let i = 1; i < N; i++) {
    const sNorm = i / (N - 1);
    const env = sNorm ** OCTOPUS.ENV_EXP;
    const dkappa = springAmp * kappaScale * env * (
      phys.a1 * Math.sin(phys.w1 * sNorm * Math.PI + phys.w1 * time + phys.phase) +
      phys.a2 * Math.sin(phys.w2 * sNorm * Math.PI + phys.w2 * time + phys.phase)
    );
    _angles[i] = _angles[i - 1] + (natAngles[i] - natAngles[i - 1]) + dkappa * deltaS[i - 1];
  }

  _spine[0][0] = cl[0][0];
  _spine[0][1] = cl[0][1];
  for (let i = 1; i < N; i++) {
    _spine[i][0] = Math.max(0, Math.min(VW, _spine[i - 1][0] + deltaS[i - 1] * Math.cos(_angles[i - 1])));
    _spine[i][1] = Math.max(0, Math.min(VH, _spine[i - 1][1] + deltaS[i - 1] * Math.sin(_angles[i - 1])));
  }
}

function drawPolygon(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

// ── 3 · LECTURA DEL DOM ─────────────────────────────────────────────────────────────────────

function isStill(): boolean {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--bbf-motion-octopus-play-state').trim() === 'paused';
}

function getBaseColor(el: HTMLElement): string {
  return getComputedStyle(el).getPropertyValue('--bbf-base').trim() || '#000'; // COLOR-ALLOW: fallback opaco cuando el token no resuelve en script (canvas en SSR)
}

function springStep(s: SpringState, target: number, k: number, zeta: number, dt: number): void {
  const omega = Math.sqrt(k);
  const f = -k * (s.x - target) - 2 * zeta * omega * s.v;
  s.v += f * dt;
  s.x += s.v * dt;
}

// ── 4 · MOTOR ──────────────────────────────────────────────────────────────────────────────

export function startOctopus(wrapEl: HTMLElement, svgEl: SVGSVGElement, canvasEl: HTMLCanvasElement): () => void {
  if (isStill()) return () => {};

  const N = rigTemplates[0].cl.length;

  const states: TentacleState[] = rigTemplates.map(tmpl => ({
    ...tmpl,
    _angles: new Float32Array(N),
    _spine: Array.from({ length: N }, () => [0, 0] as Pt),
  }));

  const springs: SpringState[] = rigData.tentacles.map(() => ({ x: 0, v: 0, releaseAt: 0 }));

  let rafId = 0;
  let active = false;
  let activeTime = 0;
  let lastTime = 0;
  let scale = 1;
  let touching = false;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;
  let lastScrollY = window.scrollY;
  let lastScrollTime = Date.now();

  function layout() {
    const rect = svgEl.getBoundingClientRect();
    const vbW = rigData.viewBox[2] as number;
    const dpr = Math.min(devicePixelRatio || 1, OCTOPUS.DPR_CAP);
    canvasEl.width  = Math.round(rect.width  * dpr);
    canvasEl.height = Math.round(rect.height * dpr);
    canvasEl.style.width  = rect.width  + 'px';
    canvasEl.style.height = rect.height + 'px';
    scale = (rect.width / vbW) * dpr;
  }

  function getTotalAmp(): number {
    return springs.reduce((s, sp) => s + Math.abs(sp.x), 0);
  }

  function loop(ts: number) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    if (active) activeTime += dt;

    for (let j = 0; j < springs.length; j++) {
      const releasing = !active || (springs[j].releaseAt > 0 && ts > springs[j].releaseAt);
      const target = active && !releasing ? 1 : 0;
      const k = releasing ? OCTOPUS.SPRING_K_OFF : OCTOPUS.SPRING_K_ON;
      const zeta = releasing ? OCTOPUS.SPRING_ZETA_OFF : OCTOPUS.SPRING_ZETA_ON;
      springStep(springs[j], target, k, zeta, dt);
    }

    const totalAmp = getTotalAmp();
    const ctx = canvasEl.getContext('2d');
    if (ctx && totalAmp > OCTOPUS.AMP_MIN_VISIBLE) {
      canvasEl.style.visibility = 'visible';
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.save();
      ctx.scale(scale, scale);

      const baseColor = getBaseColor(wrapEl);
      const fgColor = getComputedStyle(svgEl).color;

      for (let j = 0; j < states.length; j++) {
        const state = states[j];
        const springAmp = springs[j].x;

        // Erase resting contour with --bbf-base (M1b D3/D6)
        ctx.fillStyle = baseColor;
        drawPolygon(ctx, state.restingContour);

        // Draw deformed contour with currentColor
        kirchhoffDeform(state, springAmp, activeTime);
        const deformed = buildContour(state._spine, state.widths, state._angles);
        ctx.fillStyle = fgColor;
        drawPolygon(ctx, deformed);
      }

      ctx.restore();
    } else {
      canvasEl.style.visibility = 'hidden';
    }

    rafId = requestAnimationFrame(loop);
  }

  function enter() {
    if (isStill()) return;
    active = true;
    springs.forEach((s, i) => { s.releaseAt = 0; if (rigTemplates[i]) s.releaseAt = 0; });
    if (!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(loop); }
  }

  function leave() {
    active = false;
    const now = performance.now();
    springs.forEach((s, i) => { s.releaseAt = now + (rigTemplates[i]?.phys.releaseDelay ?? 0) * 1000; });
  }

  function onFocusIn() { enter(); }
  function onFocusOut() { leave(); }

  function onScroll() {
    if (isStill()) return;
    const now = Date.now();
    const dy = Math.abs(window.scrollY - lastScrollY);
    const dt = (now - lastScrollTime) || 1;
    const vel = dy / dt * 1000;
    lastScrollY = window.scrollY;
    lastScrollTime = now;
    if (vel > 20) {
      const amp = Math.min(vel / OCTOPUS.SCROLL_VEL_MAX, 1);
      springs.forEach(s => { if (Math.abs(s.x) < amp) { s.x = amp; } });
      if (!active) {
        active = true;
        setTimeout(leave, OCTOPUS.TOUCH_HOLD_MS / 2);
      }
      if (!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(loop); }
    }
  }

  function onVisibility() {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    } else if (active || getTotalAmp() > OCTOPUS.AMP_MIN_VISIBLE) {
      if (!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(loop); }
    }
  }

  // IntersectionObserver: despertar táctil al entrar en viewport, con ciclo único (M1b D8/F5)
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !touching) {
      touching = true;
      enter();
      touchTimer = setTimeout(() => { leave(); touching = false; }, OCTOPUS.TOUCH_HOLD_MS);
    }
  }, { threshold: 0.5 });
  io.observe(wrapEl);

  // Eventos: mouseenter/leave, focusin/out (burbujea al link; M1b D7), scroll, visibilidad
  wrapEl.addEventListener('mouseenter', enter);
  wrapEl.addEventListener('mouseleave', leave);
  wrapEl.addEventListener('focusin', onFocusIn);
  wrapEl.addEventListener('focusout', onFocusOut);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  const ro = new ResizeObserver(layout);
  ro.observe(svgEl);
  layout();
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);

  return () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (touchTimer !== undefined) clearTimeout(touchTimer);
    io.disconnect();
    ro.disconnect();
    wrapEl.removeEventListener('mouseenter', enter);
    wrapEl.removeEventListener('mouseleave', leave);
    wrapEl.removeEventListener('focusin', onFocusIn);
    wrapEl.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    canvasEl.style.visibility = 'hidden';
  };
}
