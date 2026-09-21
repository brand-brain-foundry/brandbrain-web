#!/usr/bin/env tsx
/**
 * check-media.ts — GUARDIA DE CORRESPONDENCIA MAESTRO ⇔ DERIVADOS (fase 6c, brandbrain-web; D-BBW-21; docs/system/MEDIA.md).
 *
 * Por qué existe: los derivados se versionan en el repo (compilación pura, sin herramienta de imagen en `pnpm build`). El riesgo de
 * versionarlos es que alguien cambie el maestro sin regenerar, o edite un derivado a mano: nada fallaría y el sitio serviría un medio
 * que ya no corresponde a su fuente. Esta guardia hace detectables las dos cosas comparando hashes con `media/derivatives.lock.json`.
 *
 * Qué comprueba (exit 1 si falla, exit 2 si el tool rompe — fail-closed en .githooks/pre-commit):
 *   R1 · Cada maestro del registro existe en media/masters/ y su hash es el del lock (maestro cambiado sin regenerar = error).
 *   R2 · Cada derivado del registro existe en public/ y su hash es el del lock; ídem `src/media/generated.ts` (derivado editado a mano,
 *        o registro cambiado sin regenerar = error).
 *   R3 · El lock lista exactamente los maestros y derivados del registro (ni huérfanos ni ausentes).
 *   R4 · public/ no contiene ningún archivo que no sea un derivado declarado o esté en `publicAllowList` (nada entra al sitio
 *        saltándose el puerto).
 *   R5 · La herramienta instalada es la que generó los derivados (misma versión de sharp y de libvips): otra versión puede rasterizar
 *        distinto; regenerar y revisar el diff es el camino, no ignorarlo. Fase 6d: ídem para ffmpeg cuando el lock lo registra (perfiles de
 *        vídeo y póster). Si ffmpeg NO está instalado, no se puede regenerar y por tanto nada puede derivar: se informa y no se rompe; si está
 *        y es otra versión, error.
 *   R6 · PRESUPUESTO DE PESO (fase 6d, D-BBW-24): cada derivado con presupuesto en su perfil (vídeo, póster) pesa ≤ ese presupuesto, medido
 *        sobre el archivo real de public/ (no sobre el lock). Pasarse es una decisión con consecuencias visibles, nunca un hecho consumado.
 * Uso: `pnpm lint:media` · `pnpm guard` · pre-commit.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { GENERATED_FILE, LOCK_FILE, MASTERS_DIR, MASTER_PAINT_TOKENS, PUBLIC_DIR, derivatives, masters, publicAllowList } from '../../src/media/registry';
import { resolveColorToken } from '../media/tokens';
import { REPO_ROOT, readLock, sha256File } from '../media/lock';

type Fail = { rule: string; where: string; detail: string };
const fails: Fail[] = [];

const lock = readLock(path.join(REPO_ROOT, LOCK_FILE));
if (!lock) {
  console.error(`[media-gate] FAIL-CLOSED: falta o no se puede leer ${LOCK_FILE} (ejecutar pnpm media:build)`);
  process.exit(2);
}

// R1 — maestros
for (const [id, m] of Object.entries(masters)) {
  const abs = path.join(REPO_ROOT, MASTERS_DIR, m.file);
  const h = sha256File(abs);
  const rec = lock.masters[id];
  if (!h) fails.push({ rule: 'R1', where: `${MASTERS_DIR}/${m.file}`, detail: 'maestro declarado en el registro que no existe' });
  else if (!rec) fails.push({ rule: 'R3', where: `${MASTERS_DIR}/${m.file}`, detail: `maestro "${id}" sin entrada en el lock: regenerar (pnpm media:build)` });
  else if (rec.sha256 !== h) fails.push({ rule: 'R1', where: `${MASTERS_DIR}/${m.file}`, detail: `el maestro cambió y los derivados NO se regeneraron (lock ${rec.sha256.slice(0, 12)}… ≠ ${h.slice(0, 12)}…): pnpm media:build` });

  /**
   * R7 · NINGÚN COLOR ESCRITO A MANO EN UN MAESTRO (P-BBW-57, D-BBW-70). La guardia de color (`check-color-tokens.ts`) escanea `src/**`
   * y no puede ver esto: los maestros son SVG y viven en `media/`. Por ahí sobrevivió un `#909fff` a un cambio de paleta entero —el
   * isotipo quedó como el único elemento del color viejo en toda la página, y todas las guardias dieron verde (L-87).
   * **Esa guardia no se toca**: es COPIA POR CONTRATO (D-BBW-06, CONTRATO-04) y se actualiza re-pinneando, no editando. La regla vive
   * aquí, que es donde el repo ya es dueño de `media/masters/**`.
   * Qué se acepta en un maestro: `currentColor` —que el generador resuelve desde el token (`MASTER_PAINT_TOKENS`) o deja para que lo
   * ponga el CSS— y `none`. Cualquier literal de color es error, con la línea.
   */
  /**
   * R8 · EL COLOR DEL TOKEN, SELLADO (D-BBW-70). Un maestro pintado por token no cambia de bytes cuando cambia el token: la huella del
   * archivo seguiría cuadrando y los derivados quedarían viejos **en verde**. El lock sella el color resuelto y aquí se vuelve a
   * resolver y a comparar, que es lo que convierte «el color viene del token» en una promesa comprobable y no en una intención.
   */
  const tokenPintura = MASTER_PAINT_TOKENS[id as keyof typeof MASTER_PAINT_TOKENS];
  if (rec && tokenPintura) {
    const ahora = resolveColorToken(tokenPintura).srgb;
    if (rec.paint !== ahora) {
      fails.push({
        rule: 'R8',
        where: `${MASTERS_DIR}/${m.file}`,
        detail: `el token de pintura "${tokenPintura}" vale ahora ${ahora} y los derivados se generaron con ${rec.paint ?? '(ninguno)'}: pnpm media:build`,
      });
    }
  }

  if (h && /\.svg$/i.test(m.file)) {
    const texto = fs.readFileSync(abs, 'utf8');
    texto.split(/\r?\n/).forEach((linea, i) => {
      for (const hit of linea.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/g)) {
        fails.push({
          rule: 'R7',
          where: `${MASTERS_DIR}/${m.file}:${i + 1}`,
          detail: `color escrito a mano en un maestro ("${hit[0]}"): un maestro declara \`currentColor\` y el color se resuelve al construir desde su token en MASTER_PAINT_TOKENS (D-BBW-70). Un literal aquí no lo ve ninguna otra guardia (L-87)`,
        });
      }
    });
  }
}
for (const id of Object.keys(lock.masters)) {
  if (!(id in masters)) fails.push({ rule: 'R3', where: LOCK_FILE, detail: `maestro "${id}" en el lock que ya no está en el registro: regenerar` });
}

// R2 — derivados
for (const [id, d] of Object.entries(derivatives)) {
  const abs = path.join(REPO_ROOT, PUBLIC_DIR, d.path);
  const h = sha256File(abs);
  const rec = lock.derivatives[id];
  if (!h) fails.push({ rule: 'R2', where: `${PUBLIC_DIR}/${d.path}`, detail: 'derivado declarado que no existe: pnpm media:build' });
  else if (!rec) fails.push({ rule: 'R3', where: `${PUBLIC_DIR}/${d.path}`, detail: `derivado "${id}" sin entrada en el lock: regenerar` });
  else if (rec.sha256 !== h) fails.push({ rule: 'R2', where: `${PUBLIC_DIR}/${d.path}`, detail: `el derivado NO corresponde al lock (editado a mano, o perfil cambiado sin regenerar): un derivado nunca se edita; pnpm media:build` });
}
for (const id of Object.keys(lock.derivatives)) {
  if (!(id in derivatives)) fails.push({ rule: 'R3', where: LOCK_FILE, detail: `derivado "${id}" en el lock que ya no está en el registro: regenerar` });
}
{
  const h = sha256File(path.join(REPO_ROOT, GENERATED_FILE));
  if (!h) fails.push({ rule: 'R2', where: GENERATED_FILE, detail: 'módulo generado ausente: pnpm media:build' });
  else if (lock.generated.sha256 !== h) fails.push({ rule: 'R2', where: GENERATED_FILE, detail: 'módulo generado NO corresponde al lock (editado a mano o registro cambiado sin regenerar): pnpm media:build' });
}

// R4 — nada en public/ fuera del puerto
const declared = new Set<string>([...Object.values(derivatives).map((d) => d.path), ...publicAllowList]);
const publicAbs = path.join(REPO_ROOT, PUBLIC_DIR);
const walk = (dir: string, acc: string[]): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name !== '.DS_Store') acc.push(path.relative(publicAbs, full).split(path.sep).join('/'));
  }
  return acc;
};
const present = fs.existsSync(publicAbs) ? walk(publicAbs, []) : [];
for (const rel of present) {
  if (!declared.has(rel)) fails.push({ rule: 'R4', where: `${PUBLIC_DIR}/${rel}`, detail: 'archivo en public/ que no es un derivado declarado en src/media/registry.ts (ni está en publicAllowList): entra por el puerto o no entra' });
}

// R5 — misma herramienta
if (lock.tool.sharp !== sharp.versions.sharp || lock.tool.vips !== sharp.versions.vips) {
  fails.push({ rule: 'R5', where: LOCK_FILE, detail: `derivados generados con sharp ${lock.tool.sharp} / vips ${lock.tool.vips}; instalado sharp ${sharp.versions.sharp} / vips ${sharp.versions.vips}: regenerar y revisar el diff` });
}
let ffmpegNote = '';
if (lock.tool.ffmpeg) {
  let installed: string | undefined;
  try {
    const out = execFileSync('ffmpeg', ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    installed = /^ffmpeg version (\S+)/.exec(out)?.[1] ?? 'desconocida';
  } catch {
    installed = undefined;
  }
  if (installed === undefined) ffmpegNote = `; ffmpeg ${lock.tool.ffmpeg} generó el vídeo y NO está instalado aquí (no se puede regenerar: nada puede derivar)`;
  else if (installed !== lock.tool.ffmpeg) fails.push({ rule: 'R5', where: LOCK_FILE, detail: `derivados de vídeo generados con ffmpeg ${lock.tool.ffmpeg}; instalado ffmpeg ${installed}: regenerar y revisar el diff` });
  else ffmpegNote = `; ffmpeg ${lock.tool.ffmpeg}`;
}

// R6 — presupuesto de peso por perfil (vídeo, póster), medido sobre el archivo real
let budgeted = 0;
for (const [id, d] of Object.entries(derivatives)) {
  const p = d.profile;
  if (p.kind !== 'video' && p.kind !== 'poster') continue;
  budgeted++;
  const abs = path.join(REPO_ROOT, PUBLIC_DIR, d.path);
  let size: number | undefined;
  try {
    size = fs.statSync(abs).size;
  } catch {
    continue; // ya falló R2
  }
  if (size > p.budgetBytes) fails.push({ rule: 'R6', where: `${PUBLIC_DIR}/${d.path}`, detail: `${size} B supera el presupuesto del perfil "${id}" (${p.budgetBytes} B, ${((size / p.budgetBytes) * 100).toFixed(0)} %): bajar calidad o resolución es decisión con consecuencias visibles (D-BBW-24), no se acepta en silencio` });
}

if (fails.length === 0) {
  console.log(`[media-gate] OK — ${Object.keys(masters).length} maestro(s) y ${Object.keys(derivatives).length} derivado(s) + ${GENERATED_FILE} en correspondencia con ${LOCK_FILE}; ${present.length} archivo(s) en ${PUBLIC_DIR}/, todos declarados; sharp ${lock.tool.sharp} / vips ${lock.tool.vips}${ffmpegNote}; ${budgeted} derivado(s) con presupuesto de peso, todos dentro; superficie ${lock.surface.token} = ${lock.surface.srgb}.`);
  process.exit(0);
}
console.error(`[media-gate] ${fails.length} problema(s) — build roto.`);
for (const f of fails) console.error(`  ${f.rule} ${f.where}: ${f.detail}`);
console.error('  Regla: un maestro se edita; un derivado se regenera (pnpm media:build) y nunca se edita; nada entra en public/ fuera del puerto.');
process.exit(1);
