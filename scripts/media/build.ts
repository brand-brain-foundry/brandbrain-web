#!/usr/bin/env tsx
/**
 * scripts/media/build.ts — GUION DETERMINISTA DEL PUERTO DE MEDIOS (D-BBW-21; contrato docs/system/MEDIA.md; registro src/media/registry.ts).
 *
 * Recibe MAESTROS y PERFILES (del registro) y produce DERIVADOS: los archivos de public/, el módulo `src/media/generated.ts` (vectores
 * inline: viewBox + trazado) y `media/derivatives.lock.json` (hash de cada maestro y de cada derivado, versión de la herramienta, color de
 * superficie resuelto). Es agnóstico del medio concreto: un maestro nuevo = una entrada en el registro, nada aquí.
 *
 * Determinista: mismo maestro + mismo perfil + misma versión de la herramienta ⇒ mismos bytes (sin marcas de tiempo; PNG con parámetros
 * fijos; JSON con claves ordenadas). Se comprueba ejecutándolo dos veces y comparando el lock.
 *
 * HERRAMIENTA DE DESARROLLO (declarada, justificada; NO de producción): `sharp` (libvips: rasteriza SVG con librsvg, compone y codifica PNG).
 *   · Es la misma biblioteca que Next.js declara como dependencia opcional (next@16.3.5 → sharp ^0.35.4): ya estaba instalada en
 *     node_modules por esa vía; declararla en devDependencies con versión EXACTA la hace explícita y reproducible.
 *   · Corre SOLO al ejecutar este guion (`pnpm media:build`). `pnpm build` no la invoca: los derivados ya están en el repo, y
 *     `images.unoptimized: true` (next.config.ts) garantiza que Next tampoco la usa en el export. `dependencies` no cambia.
 *   · El .ico lo empaqueta este guion a mano (cabecera + directorio + PNG por entrada): sin herramienta adicional.
 *
 * Uso: `pnpm media:build`. Regenerar es obligatorio tras cambiar un maestro o un perfil; la guardia lo exige.
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { site } from '../../src/config/site';
import {
  GENERATED_FILE,
  LOCK_FILE,
  MASTERS_DIR,
  PUBLIC_DIR,
  SURFACE_TOKEN,
  derivatives,
  inlineIcons,
  masters,
  type DerivativeId,
  type MasterId,
  type Profile,
} from '../../src/media/registry';
import { REPO_ROOT, sha256, stableJson, type LockFile } from './lock';
import { resolveColorToken } from './tokens';

type SvgMaster = { id: MasterId; file: string; bytes: Buffer; viewBox: { x: number; y: number; w: number; h: number }; inner: string; paint: 'fill' | 'stroke'; d: string };

function loadSvgMaster(id: MasterId): SvgMaster {
  const file = path.join(REPO_ROOT, MASTERS_DIR, masters[id].file);
  const bytes = fs.readFileSync(file);
  const text = bytes.toString('utf8');
  const vb = /viewBox="([^"]+)"/.exec(text);
  if (!vb) throw new Error(`[media] maestro ${masters[id].file}: sin viewBox`);
  const [x, y, w, h] = vb[1].trim().split(/[\s,]+/).map(Number);
  const open = /<svg\b[^>]*>/.exec(text);
  const close = text.lastIndexOf('</svg>');
  if (!open || close < 0) throw new Error(`[media] maestro ${masters[id].file}: no es un SVG completo`);
  // el manifiesto de procedencia (C2PA) no se dibuja y su espacio de nombres vive en la etiqueta raíz: fuera del envoltorio de render
  const inner = text.slice(open.index + open[0].length, close).replace(/<metadata[\s\S]*?<\/metadata>/g, '').trim();
  const pathTag = /<path\b[^>]*>/.exec(inner);
  const d = pathTag ? (/\bd="([^"]+)"/.exec(pathTag[0])?.[1] ?? '') : '';
  const paint: 'fill' | 'stroke' = pathTag && /\bstroke="/.test(pathTag[0]) && /\bfill="none"/.test(pathTag[0]) ? 'stroke' : 'fill';
  return { id, file: masters[id].file, bytes, viewBox: { x, y, w, h }, inner, paint, d };
}

/** Envoltorio de render: lienzo `W×H` (opcionalmente relleno con la superficie) con el maestro anidado y escalado a la caja dada. */
function wrap(master: SvgMaster, W: number, H: number, box: { x: number; y: number; w: number; h: number }, background?: string): string {
  const vb = `${master.viewBox.x} ${master.viewBox.y} ${master.viewBox.w} ${master.viewBox.h}`;
  const rect = background ? `<rect width="${W}" height="${H}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rect}<svg x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${master.inner}</svg></svg>`;
}

/** Caja centrada que contiene el dibujo (proporción del viewBox) dentro de `avail`×`avail` centrado en un lienzo `W×H`. */
function fitBox(master: SvgMaster, W: number, H: number, availW: number, availH: number) {
  const r = master.viewBox.w / master.viewBox.h;
  let w = availW;
  let h = w / r;
  if (h > availH) {
    h = availH;
    w = h * r;
  }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

async function renderPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: false, palette: false, effort: 10 }).toBuffer();
}

/** Zona segura del icono recortable (web.dev: círculo central de radio 40 %): ningún píxel distinto del fondo fuera de ella. */
async function assertSafeZone(png: Buffer, size: number, bgHex: string, what: string): Promise<{ maxRadius: number; limit: number }> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const bg = [1, 3, 5].map((i) => parseInt(bgHex.slice(i, i + 2), 16));
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const limit = 0.4 * size;
  let maxRadius = 0;
  let outside = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const o = (y * info.width + x) * info.channels;
      const differs = Math.abs(data[o] - bg[0]) > 8 || Math.abs(data[o + 1] - bg[1]) > 8 || Math.abs(data[o + 2] - bg[2]) > 8;
      if (!differs) continue;
      const rr = Math.hypot(x - cx, y - cy);
      if (rr > maxRadius) maxRadius = rr;
      if (rr > limit) outside++;
    }
  }
  if (outside > 0) throw new Error(`[media] ${what}: ${outside} píxel(es) del dibujo fuera de la zona segura (radio ${limit.toFixed(1)} px)`);
  return { maxRadius, limit };
}

function packIco(frames: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = 6 + 16 * frames.length;
  const entries: Buffer[] = [];
  for (const f of frames) {
    const e = Buffer.alloc(16);
    e[0] = f.size >= 256 ? 0 : f.size;
    e[1] = f.size >= 256 ? 0 : f.size;
    e[2] = 0;
    e[3] = 0;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(f.png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += f.png.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...frames.map((f) => f.png)]);
}

function profileLabel(p: Profile): string {
  switch (p.kind) {
    case 'svg-copy':
      return 'svg-copy';
    case 'png':
      return `png ${p.size}×${p.size} ${p.background} padding ${Number(p.padding.toFixed(4))}${p.safeZone ? ' safe-zone' : ''}`;
    case 'ico':
      return `ico ${p.sizes.join('/')}`;
    case 'share':
      return `share ${p.width}×${p.height} icon ${p.iconHeight}`;
    case 'manifest':
      return `manifest ${p.icons.join(',')}`;
  }
}

async function main(): Promise<void> {
  const surface = resolveColorToken(SURFACE_TOKEN);
  const loaded = new Map<MasterId, SvgMaster>();
  const master = (id: MasterId) => loaded.get(id) ?? (loaded.set(id, loadSvgMaster(id)), loaded.get(id)!);

  const publicDir = path.join(REPO_ROOT, PUBLIC_DIR);
  fs.mkdirSync(publicDir, { recursive: true });

  const lock: LockFile = {
    generatedBy: 'scripts/media/build.ts (pnpm media:build)',
    tool: { sharp: sharp.versions.sharp, vips: sharp.versions.vips },
    surface: { token: SURFACE_TOKEN, srgb: surface.srgb },
    masters: {},
    derivatives: {},
    generated: { path: GENERATED_FILE, sha256: '' },
  };
  for (const id of Object.keys(masters) as MasterId[]) lock.masters[id] = { file: masters[id].file, sha256: sha256(master(id).bytes) };

  const outputs = new Map<DerivativeId, { bytes: Buffer; width?: number; height?: number }>();
  const notes: string[] = [];

  // orden fijo: primero todo lo que el manifiesto referencia
  const ids = Object.keys(derivatives) as DerivativeId[];
  const ordered = [...ids.filter((id) => derivatives[id].profile.kind !== 'manifest'), ...ids.filter((id) => derivatives[id].profile.kind === 'manifest')];

  for (const id of ordered) {
    const d = derivatives[id];
    const m = master(d.master);
    const p: Profile = d.profile;
    if (p.kind === 'svg-copy') {
      outputs.set(id, { bytes: m.bytes, width: Math.round(m.viewBox.w), height: Math.round(m.viewBox.h) });
    } else if (p.kind === 'png') {
      const pad = p.padding * p.size;
      let avail = p.size - 2 * pad;
      if (p.safeZone) avail = (0.4 * p.size * 2) / Math.SQRT2; // cuadrado inscrito en el círculo de radio 40 %
      const box = fitBox(m, p.size, p.size, avail, avail);
      const png = await renderPng(wrap(m, p.size, p.size, box, p.background === 'surface' ? surface.srgb : undefined));
      if (p.safeZone) {
        const z = await assertSafeZone(png, p.size, surface.srgb, d.path);
        notes.push(`${d.path}: dibujo hasta radio ${z.maxRadius.toFixed(1)} px ≤ zona segura ${z.limit.toFixed(1)} px`);
      }
      outputs.set(id, { bytes: png, width: p.size, height: p.size });
    } else if (p.kind === 'ico') {
      const frames = [];
      for (const size of p.sizes) frames.push({ size, png: await renderPng(wrap(m, size, size, fitBox(m, size, size, size, size))) });
      outputs.set(id, { bytes: packIco(frames) });
    } else if (p.kind === 'share') {
      const availH = p.height * p.iconHeight;
      const box = fitBox(m, p.width, p.height, p.width, availH);
      outputs.set(id, { bytes: await renderPng(wrap(m, p.width, p.height, box, surface.srgb)), width: p.width, height: p.height });
    } else if (p.kind === 'manifest') {
      const icons = p.icons.map((ref) => {
        const dd = derivatives[ref as DerivativeId];
        const out = outputs.get(ref as DerivativeId);
        if (!dd || !out) throw new Error(`[media] manifiesto: el derivado "${ref}" no existe o no se ha generado`);
        const entry: Record<string, string> = { src: `/${dd.path}`, sizes: `${out.width}x${out.height}`, type: 'image/png' };
        const prof: Profile = dd.profile;
        if (prof.kind === 'png' && prof.safeZone) entry.purpose = 'maskable';
        return entry;
      });
      const manifest = {
        name: site.name,
        lang: site.defaultLocale,
        start_url: `/${site.defaultLocale}/`,
        display: 'browser',
        background_color: surface.srgb,
        theme_color: surface.srgb,
        icons,
      };
      outputs.set(id, { bytes: Buffer.from(JSON.stringify(manifest, null, 2) + '\n') });
    }
  }

  // escritura de derivados + lock
  for (const id of ordered) {
    const d = derivatives[id];
    const out = outputs.get(id)!;
    fs.writeFileSync(path.join(publicDir, d.path), out.bytes);
    lock.derivatives[id] = { path: `${PUBLIC_DIR}/${d.path}`, master: d.master, profile: profileLabel(d.profile), sha256: sha256(out.bytes), ...(out.width ? { width: out.width, height: out.height } : {}) };
  }

  // módulo generado: rutas + dimensiones intrínsecas de los derivados y vectores inline
  const mediaEntries = ordered.map((id) => {
    const d = derivatives[id];
    const out = outputs.get(id)!;
    const type =
      d.profile.kind === 'svg-copy' ? 'image/svg+xml' : d.profile.kind === 'ico' ? 'image/x-icon' : d.profile.kind === 'manifest' ? 'application/manifest+json' : 'image/png';
    const fields = [`src: "/${d.path}"`, `type: "${type}"`];
    if (out.width && out.height) fields.push(`width: ${out.width}`, `height: ${out.height}`, `sizes: "${out.width}x${out.height}"`);
    if (d.profile.kind === 'ico') fields.push(`sizes: "${d.profile.sizes.map((s) => `${s}x${s}`).join(' ')}"`);
    return `  ${id}: { ${fields.join(', ')} },`;
  });
  const iconEntries = (Object.keys(inlineIcons) as (keyof typeof inlineIcons)[]).map((name) => {
    const spec = inlineIcons[name];
    const m = master(spec.master);
    if (!m.d) throw new Error(`[media] icono inline "${name}": el maestro ${m.file} no tiene <path d>`);
    const vb = `${m.viewBox.x} ${m.viewBox.y} ${m.viewBox.w} ${m.viewBox.h}`;
    return `  ${name}: { viewBox: "${vb}", paint: "${spec.paint}", use: "${spec.use}", d: "${m.d}" },`;
  });
  const generated = [
    '/**',
    ' * GENERADO por scripts/media/build.ts (pnpm media:build) desde media/masters/ + src/media/registry.ts. NO EDITAR: la guardia',
    ' * scripts/lint/check-media.ts compara este archivo con media/derivatives.lock.json. Rutas absolutas de los derivados servidos desde',
    ' * el propio sitio (adaptador actual, docs/system/MEDIA.md), con sus dimensiones intrínsecas (se declaran en <img> para no provocar',
    ' * saltos de composición), y los vectores inline (viewBox + trazado; pintan con currentColor y se dimensionan por tokens).',
    ' */',
    'export const media = {',
    ...mediaEntries,
    '} as const;',
    '',
    'export const inlineIcons = {',
    ...iconEntries,
    '} as const;',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPO_ROOT, GENERATED_FILE), generated);
  lock.generated = { path: GENERATED_FILE, sha256: sha256(generated) };
  fs.writeFileSync(path.join(REPO_ROOT, LOCK_FILE), stableJson(lock));

  console.log(`[media-build] OK — ${Object.keys(lock.masters).length} maestro(s) → ${ordered.length} derivado(s) en ${PUBLIC_DIR}/ + ${GENERATED_FILE} (${iconEntries.length} vectores inline); superficie ${SURFACE_TOKEN} = ${surface.srgb} (oklch ${surface.oklch.L} ${surface.oklch.C} ${surface.oklch.H}); sharp ${lock.tool.sharp} / vips ${lock.tool.vips}; lock → ${LOCK_FILE}`);
  for (const n of notes) console.log(`  · ${n}`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(2);
});
