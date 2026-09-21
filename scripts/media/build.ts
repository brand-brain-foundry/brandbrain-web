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
 * HERRAMIENTA DE DESARROLLO Nº 2 (fase 6d, D-BBW-24; declarada y justificada en docs/system/MEDIA.md §4): `ffmpeg` (CLI, instalado en la
 *   máquina; en este turno 8.1.2 de Homebrew con libx264 y SVT-AV1). Solo para los perfiles de VÍDEO y de PÓSTER, solo en este guion.
 *   · Determinista: parámetros fijos, UN hilo (`-threads 1` / `lp=1`: el multihilo cambia la salida de x264/SVT entre máquinas), sin
 *     metadatos ni marcas de tiempo (`-map_metadata -1 -fflags +bitexact`). Comprobado: dos ejecuciones ⇒ mismo hash.
 *   · Su versión queda en el lock (`tool.ffmpeg`) y la guardia R5 la compara con la instalada: otra versión ⇒ regenerar y revisar.
 *   · NO va en package.json: no existe como paquete sin descargar un binario en la instalación (`ffmpeg-static` ≈ 70 MB por plataforma,
 *     postinstall que pnpm 10 bloquea por defecto, y sin garantía de traer SVT-AV1). Cero dependencias de producción: `pnpm build` no la toca.
 * Uso: `pnpm media:build`. Regenerar es obligatorio tras cambiar un maestro o un perfil; la guardia lo exige.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { site } from '../../src/config/site';
import {
  GENERATED_FILE,
  LOCK_FILE,
  MASTERS_DIR,
  PUBLIC_DIR,
  SURFACE_TOKEN,
  MASTER_PAINT_TOKENS,
  derivatives,
  inlineIcons,
  masters,
  type Derivative,
  type DerivativeId,
  type MasterId,
  type Profile,
} from '../../src/media/registry';
import { REPO_ROOT, sha256, stableJson, type LockFile } from './lock';
import { resolveColorToken } from './tokens';

type SvgMaster = { id: MasterId; file: string; bytes: Buffer; painted: Buffer; paintColor?: string; viewBox: { x: number; y: number; w: number; h: number }; inner: string; paint: 'fill' | 'stroke'; d: string };

/**
 * D-BBW-70 — EL COLOR DEL MAESTRO SALE DEL TOKEN, NO DEL ARCHIVO. Un maestro que dibuja marca declara `currentColor` y aquí se sustituye
 * por el rol que `MASTER_PAINT_TOKENS` le asigne, resuelto a sRGB por el mismo camino que la superficie de los derivados opacos. La
 * sustitución se hace sobre el TEXTO COMPLETO antes de partirlo, para que la alcancen las tres vías por las que un maestro sale:
 * el `inner` que se rasteriza, la copia literal del perfil `svg-copy` y el `d` que se emite como vector inline.
 * Un maestro SIN token asignado no se toca: su `currentColor` queda sin resolver, que es justo lo que necesitan los vectores que se
 * pintan por CSS (ondas, brazos del conmutador, iconos de perfil), porque ésos heredan el color del texto donde se insertan.
 */
function loadSvgMaster(id: MasterId): SvgMaster {
  const file = path.join(REPO_ROOT, MASTERS_DIR, masters[id].file);
  const raw = fs.readFileSync(file);
  const token = MASTER_PAINT_TOKENS[id];
  if (token && !raw.toString('utf8').includes('currentColor')) {
    throw new Error(`[media] maestro ${masters[id].file}: tiene token de pintura "${token}" y no declara currentColor — el color no puede venir del archivo`);
  }
  const paintColor = token ? resolveColorToken(token).srgb : undefined;
  const text = paintColor ? raw.toString('utf8').replace(/currentColor/g, paintColor) : raw.toString('utf8');
  // `bytes` son los CRUDOS del archivo: es lo que el lock sella y lo que la guardia vuelve a hashear del disco. `painted` es lo que sale.
  const bytes = raw;
  const painted = paintColor ? Buffer.from(text, 'utf8') : raw;
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
  return { id, file: masters[id].file, bytes, painted, paintColor, viewBox: { x, y, w, h }, inner, paint, d };
}

type VideoMaster = { id: MasterId; file: string; abs: string; bytes: Buffer };

function loadVideoMaster(id: MasterId): VideoMaster {
  const abs = path.join(REPO_ROOT, MASTERS_DIR, masters[id].file);
  return { id, file: masters[id].file, abs, bytes: fs.readFileSync(abs) };
}

/** ffmpeg instalado: versión (primera línea de `ffmpeg -version`, p. ej. "8.1.2"). Falla con mensaje si no está: sin herramienta no hay derivado. */
function ffmpegVersion(): string {
  let out: string;
  try {
    out = execFileSync('ffmpeg', ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    throw new Error('[media] ffmpeg no está instalado o no está en el PATH: los perfiles de vídeo y póster lo exigen (docs/system/MEDIA.md §4)');
  }
  const m = /^ffmpeg version (\S+)/.exec(out);
  if (!m) throw new Error(`[media] no se pudo leer la versión de ffmpeg: "${out.split('\n')[0]}"`);
  return m[1];
}

/** Pistas de un archivo de medios según ffprobe ("video:h264 1280x720" · "audio:aac"); el guion exige que un derivado de vídeo no lleve audio. */
function probeStreams(abs: string): string {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height', '-of', 'csv=p=0', abs], { encoding: 'utf8' });
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // ffprobe emite los campos en su orden fijo (codec_name, codec_type, width, height), no en el del argumento
      const [codec, type, w, h] = line.split(',');
      return type === 'video' ? `${type}:${codec} ${w}x${h}` : `${type}:${codec}`;
    })
    .join(' + ');
}

/** Ejecuta ffmpeg con argumentos FIJOS hacia un archivo temporal y devuelve sus bytes. Un hilo, sin metadatos: mismo maestro ⇒ mismos bytes. */
function runFfmpeg(args: string[], ext: string): Buffer {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bbw-media-')), `out.${ext}`);
  execFileSync('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'error', '-y', ...args, tmp], { stdio: ['ignore', 'ignore', 'inherit'] });
  const bytes = fs.readFileSync(tmp);
  fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  return bytes;
}

/** Argumentos comunes de salida: sin audio (D-BBW-24), sin metadatos ni marcas de tiempo (bitexact), mismo cadencia y GOP de 2 s (48 @ 24 fps). */
const VIDEO_COMMON = ['-an', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact', '-pix_fmt', 'yuv420p', '-g', '48'];

function encodeVideo(master: VideoMaster, p: Extract<Profile, { kind: 'video' }>): { bytes: Buffer; ext: string } {
  const scale = ['-vf', `scale=${p.width}:${p.height}:flags=lanczos`];
  if (p.codec === 'h264') {
    // respaldo universal: libx264, CRF fijo, preset slow, perfil High 4.0, un hilo, moov al principio (arranque sin esperar al final del archivo)
    const args = ['-i', master.abs, ...VIDEO_COMMON, ...scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(p.quality), '-profile:v', 'high', '-level', '4.0', '-threads', '1', '-movflags', '+faststart', '-f', 'mp4'];
    return { bytes: runFfmpeg(args, 'mp4'), ext: 'mp4' };
  }
  // formato moderno: SVT-AV1 en WebM, CRF fijo, preset 4, un hilo (lp=1)
  const args = ['-i', master.abs, ...VIDEO_COMMON, ...scale, '-c:v', 'libsvtav1', '-preset', '4', '-crf', String(p.quality), '-svtav1-params', 'lp=1', '-f', 'webm'];
  return { bytes: runFfmpeg(args, 'webm'), ext: 'webm' };
}

/** Póster = el PRIMER FOTOGRAMA EXACTO del maestro (fotograma 0, sin pérdida vía PNG) codificado por sharp al formato y calidad del perfil. */
async function encodePoster(master: VideoMaster, p: Extract<Profile, { kind: 'poster' }>): Promise<Buffer> {
  const png = runFfmpeg(['-i', master.abs, '-map', '0:v:0', '-frames:v', '1', '-vf', `select=eq(n\\,0),scale=${p.width}:${p.height}:flags=lanczos`, '-c:v', 'png', '-f', 'image2'], 'png');
  const img = sharp(png).withMetadata({}).removeAlpha();
  return p.format === 'jpeg' ? img.jpeg({ quality: p.quality, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer() : img.webp({ quality: p.quality, effort: 6 }).toBuffer();
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
    case 'video':
      return `video ${p.codec} ${p.width}×${p.height} crf ${p.quality} sin audio ≤ ${p.budgetBytes} B`;
    case 'poster':
      return `poster ${p.format} ${p.width}×${p.height} q ${p.quality} fotograma 0 ≤ ${p.budgetBytes} B`;
  }
}

async function main(): Promise<void> {
  const surface = resolveColorToken(SURFACE_TOKEN);
  const loaded = new Map<MasterId, SvgMaster>();
  const master = (id: MasterId) => {
    if (masters[id].kind !== 'svg') throw new Error(`[media] el maestro "${id}" no es un SVG: este perfil no lo admite`);
    return loaded.get(id) ?? (loaded.set(id, loadSvgMaster(id)), loaded.get(id)!);
  };
  const loadedVideo = new Map<MasterId, VideoMaster>();
  const video = (id: MasterId) => {
    if (masters[id].kind !== 'video') throw new Error(`[media] el maestro "${id}" no es un vídeo: este perfil no lo admite`);
    return loadedVideo.get(id) ?? (loadedVideo.set(id, loadVideoMaster(id)), loadedVideo.get(id)!);
  };
  const needsFfmpeg = (Object.values(derivatives) as Derivative[]).some((d) => d.profile.kind === 'video' || d.profile.kind === 'poster');
  const ffmpeg = needsFfmpeg ? ffmpegVersion() : undefined;

  const publicDir = path.join(REPO_ROOT, PUBLIC_DIR);
  fs.mkdirSync(publicDir, { recursive: true });

  const lock: LockFile = {
    generatedBy: 'scripts/media/build.ts (pnpm media:build)',
    tool: { sharp: sharp.versions.sharp, vips: sharp.versions.vips, ...(ffmpeg ? { ffmpeg } : {}) },
    surface: { token: SURFACE_TOKEN, srgb: surface.srgb },
    masters: {},
    derivatives: {},
    generated: { path: GENERATED_FILE, sha256: '' },
  };
  for (const id of Object.keys(masters) as MasterId[]) {
    // D-BBW-70: además de la huella del archivo, el lock sella el COLOR RESUELTO con el que se pintó. Sin esto se abriría un hueco
    // nuevo: cambiar el token del acento no cambia ningún maestro, así que la huella seguiría cuadrando y los derivados quedarían
    // viejos en verde — justo la clase de fallo silencioso que este mecanismo venía a cerrar.
    const svgPaint = masters[id].kind === 'video' ? undefined : master(id).paintColor;
    lock.masters[id] = {
      file: masters[id].file,
      sha256: sha256(masters[id].kind === 'video' ? video(id).bytes : master(id).bytes),
      ...(svgPaint ? { paint: svgPaint } : {}),
    };
  }

  const outputs = new Map<DerivativeId, { bytes: Buffer; width?: number; height?: number; budgetBytes?: number; streams?: string }>();
  const notes: string[] = [];

  // orden fijo: primero todo lo que el manifiesto referencia
  const ids = Object.keys(derivatives) as DerivativeId[];
  const ordered = [...ids.filter((id) => derivatives[id].profile.kind !== 'manifest'), ...ids.filter((id) => derivatives[id].profile.kind === 'manifest')];

  for (const id of ordered) {
    const d = derivatives[id];
    const p: Profile = d.profile;
    if (p.kind === 'video' || p.kind === 'poster') {
      const vm = video(d.master);
      if (p.kind === 'video') {
        const { bytes } = encodeVideo(vm, p);
        // el derivado se sondea desde un temporal: sin pista de audio (D-BBW-24) y con las dimensiones del perfil
        const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bbw-media-')), d.path);
        fs.writeFileSync(tmp, bytes);
        const streams = probeStreams(tmp);
        fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
        if (/audio:/.test(streams)) throw new Error(`[media] ${d.path}: el derivado conserva una pista de audio (${streams}); un fondo decorativo no lleva audio (D-BBW-24)`);
        if (!streams.includes(`${p.width}x${p.height}`)) throw new Error(`[media] ${d.path}: dimensiones ${streams} ≠ perfil ${p.width}×${p.height}`);
        outputs.set(id, { bytes, width: p.width, height: p.height, budgetBytes: p.budgetBytes, streams });
      } else {
        const bytes = await encodePoster(vm, p);
        outputs.set(id, { bytes, width: p.width, height: p.height, budgetBytes: p.budgetBytes });
      }
      const out = outputs.get(id)!;
      const pct = ((out.bytes.length / p.budgetBytes) * 100).toFixed(0);
      if (out.bytes.length > p.budgetBytes) throw new Error(`[media] ${d.path}: ${out.bytes.length} B supera el presupuesto del perfil (${p.budgetBytes} B, ${pct} %): bajar calidad o resolución es una decisión con consecuencias visibles, no se acepta en silencio`);
      notes.push(`${d.path}: ${out.bytes.length} B = ${pct} % del presupuesto ${p.budgetBytes} B${out.streams ? ` · ${out.streams}` : ''}`);
      continue;
    }
    const m = master(d.master);
    if (p.kind === 'svg-copy') {
      outputs.set(id, { bytes: m.painted, width: Math.round(m.viewBox.w), height: Math.round(m.viewBox.h) });
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
    lock.derivatives[id] = {
      path: `${PUBLIC_DIR}/${d.path}`,
      master: d.master,
      profile: profileLabel(d.profile),
      sha256: sha256(out.bytes),
      ...(out.width ? { width: out.width, height: out.height } : {}),
      ...(out.budgetBytes ? { bytes: out.bytes.length, budgetBytes: out.budgetBytes } : {}),
      ...(out.streams ? { streams: out.streams } : {}),
    };
  }

  // módulo generado: rutas + dimensiones intrínsecas de los derivados y vectores inline
  const mediaEntries = ordered.map((id) => {
    const d = derivatives[id];
    const out = outputs.get(id)!;
    const pk = d.profile;
    const type =
      pk.kind === 'svg-copy'
        ? 'image/svg+xml'
        : pk.kind === 'ico'
          ? 'image/x-icon'
          : pk.kind === 'manifest'
            ? 'application/manifest+json'
            : pk.kind === 'video'
              ? pk.codec === 'h264'
                ? 'video/mp4'
                : 'video/webm; codecs=av01'
              : pk.kind === 'poster'
                ? pk.format === 'jpeg'
                  ? 'image/jpeg'
                  : 'image/webp'
                : 'image/png';
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

  console.log(`[media-build] OK — ${Object.keys(lock.masters).length} maestro(s) → ${ordered.length} derivado(s) en ${PUBLIC_DIR}/ + ${GENERATED_FILE} (${iconEntries.length} vectores inline); superficie ${SURFACE_TOKEN} = ${surface.srgb} (oklch ${surface.oklch.L} ${surface.oklch.C} ${surface.oklch.H}); sharp ${lock.tool.sharp} / vips ${lock.tool.vips}${lock.tool.ffmpeg ? ` / ffmpeg ${lock.tool.ffmpeg}` : ''}; lock → ${LOCK_FILE}`);
  for (const n of notes) console.log(`  · ${n}`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(2);
});
