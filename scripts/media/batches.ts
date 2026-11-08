/**
 * scripts/media/batches.ts — LOS LOTES DEL CAMPO LEÍDOS DEL DISCO (S12, R2 del perfil; contrato docs/system/MEDIA.md §11). Lo comparten el guion
 * (`build.ts`, que genera) y la guardia (`check-media.ts`, que comprueba): los dos ven la MISMA lista, sacada de la carpeta del uso y en orden de
 * nombre, y el mismo punto focal, sacado del contenido. Nadie escribe la lista de un lote.
 */
import * as fs from 'fs';
import * as path from 'path';
import { FIELD_BATCHES_DIR, FIELD_BATCH_EXTENSIONS, FIELD_BATCH_NAME_RE, fieldBatches, type FieldBatchId } from '../../src/media/registry';
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
