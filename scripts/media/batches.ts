/**
 * scripts/media/batches.ts — LOS LOTES DEL CAMPO LEÍDOS DEL DISCO (S12, R2 del perfil; contrato docs/system/MEDIA.md §11). Lo comparten el guion
 * (`build.ts`, que genera) y la guardia (`check-media.ts`, que comprueba): los dos ven la MISMA lista, sacada de la carpeta del uso y en orden de
 * nombre, y el mismo punto focal, sacado del contenido. Nadie escribe la lista de un lote.
 */
import * as fs from 'fs';
import * as path from 'path';
import { FIELD_BATCHES_DIR, FIELD_BATCH_EXTENSIONS, FIELD_BATCH_NAME_RE, MASTERS_DIR, fieldBatches, masters, type FieldBatchId } from '../../src/media/registry';
import { fieldMediaFocus } from '../../src/content/site';
import { REPO_ROOT } from './lock';

export type BatchMember = { batch: FieldBatchId; name: string; file: string; abs: string; kind: 'image' | 'video'; focus: { x: number; y: number } };

/** Los miembros de cada lote declarado + los problemas de forma (extensión sin perfil, nombre inválido, nombre repetido, carpeta sin declarar). */
export function readBatches(): { members: BatchMember[]; problems: string[] } {
  const members: BatchMember[] = [];
  const problems: string[] = [];
  const root = path.join(REPO_ROOT, FIELD_BATCHES_DIR);
  if (fs.existsSync(root)) {
    for (const e of fs.readdirSync(root, { withFileTypes: true })) {
      if (e.name === '.DS_Store') continue;
      if (!e.isDirectory() || !(e.name in fieldBatches)) problems.push(`${FIELD_BATCHES_DIR}/${e.name}: no es la carpeta de un uso declarado en fieldBatches (src/media/registry.ts)`);
    }
  }
  for (const batch of Object.keys(fieldBatches) as FieldBatchId[]) {
    const dir = path.join(root, batch);
    if (!fs.existsSync(dir)) continue; // lote vacío: el campo de hoy
    const seen = new Set<string>();
    for (const file of fs.readdirSync(dir).filter((f) => f !== '.DS_Store' && f !== '.gitkeep').sort()) {
      const ext = path.extname(file).toLowerCase();
      const name = path.basename(file, path.extname(file));
      const kind = (FIELD_BATCH_EXTENSIONS.image as readonly string[]).includes(ext) ? 'image' : (FIELD_BATCH_EXTENSIONS.video as readonly string[]).includes(ext) ? 'video' : null;
      const where = `${FIELD_BATCHES_DIR}/${batch}/${file}`;
      if (!kind) { problems.push(`${where}: extensión sin perfil (imagen ${FIELD_BATCH_EXTENSIONS.image.join(' ')} · vídeo ${FIELD_BATCH_EXTENSIONS.video.join(' ')})`); continue; }
      if (!FIELD_BATCH_NAME_RE.test(name)) { problems.push(`${where}: nombre inválido (minúsculas, dígitos y guiones: es el que cita el punto focal)`); continue; }
      if (seen.has(name)) { problems.push(`${where}: nombre repetido con otra extensión (el nombre identifica al medio)`); continue; }
      seen.add(name);
      // REFERENCIA (R3 del perfil, I-1): un miembro puede ser un ENLACE SIMBÓLICO a un maestro ya declarado en el registro (el retrato `zavala-1`
      // → `portrait.jpg`), para no duplicarlo. Solo vale si resuelve a uno de esos maestros; roto o hacia otro sitio rompe (R10).
      if (fs.lstatSync(path.join(dir, file)).isSymbolicLink()) {
        const allowed = Object.values(masters).map((m) => path.join(REPO_ROOT, MASTERS_DIR, m.file));
        let real = '';
        try { real = fs.realpathSync(path.join(dir, file)); } catch { /* enlace roto */ }
        if (!allowed.some((a) => fs.existsSync(a) && fs.realpathSync(a) === real)) { problems.push(`${where}: enlace que no resuelve a un maestro declarado en src/media/registry.ts (masters): un miembro por referencia solo apunta a un maestro existente`); continue; }
      }
      const f = fieldMediaFocus[batch]?.[name];
      members.push({ batch, name, file, abs: path.join(dir, file), kind, focus: f ? { x: f.x, y: f.y } : { x: 0.5, y: 0.5 } });
    }
  }
  // un punto focal del contenido que no nombra ningún medio del lote es un dato huérfano (se escribió para un archivo que no está)
  for (const [batch, entries] of Object.entries(fieldMediaFocus)) {
    for (const name of Object.keys(entries ?? {})) {
      if (!members.some((m) => m.batch === batch && m.name === name)) problems.push(`content/site.json $.fieldMedia.${batch}.${name}: punto focal de un medio que no está en ${FIELD_BATCHES_DIR}/${batch}/`);
    }
  }
  return { members, problems };
}

/** El punto focal como cadena estable para el lock (`x,y`). */
export const focusLabel = (f: { x: number; y: number }) => `${f.x},${f.y}`;
