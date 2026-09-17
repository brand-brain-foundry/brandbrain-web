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
 *        distinto; regenerar y revisar el diff es el camino, no ignorarlo.
 * Uso: `pnpm lint:media` · `pnpm guard` · pre-commit.
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { GENERATED_FILE, LOCK_FILE, MASTERS_DIR, PUBLIC_DIR, derivatives, masters, publicAllowList } from '../../src/media/registry';
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

if (fails.length === 0) {
  console.log(`[media-gate] OK — ${Object.keys(masters).length} maestro(s) y ${Object.keys(derivatives).length} derivado(s) + ${GENERATED_FILE} en correspondencia con ${LOCK_FILE}; ${present.length} archivo(s) en ${PUBLIC_DIR}/, todos declarados; sharp ${lock.tool.sharp} / vips ${lock.tool.vips}; superficie ${lock.surface.token} = ${lock.surface.srgb}.`);
  process.exit(0);
}
console.error(`[media-gate] ${fails.length} problema(s) — build roto.`);
for (const f of fails) console.error(`  ${f.rule} ${f.where}: ${f.detail}`);
console.error('  Regla: un maestro se edita; un derivado se regenera (pnpm media:build) y nunca se edita; nada entra en public/ fuera del puerto.');
process.exit(1);
