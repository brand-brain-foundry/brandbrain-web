/**
 * scripts/media/lock.ts — forma del fichero de correspondencia maestro ⇔ derivados (`media/derivatives.lock.json`) y utilidades
 * compartidas por el guion (`build.ts`, que lo escribe) y la guardia (`scripts/lint/check-media.ts`, que lo comprueba).
 * Sin marcas de tiempo: el lock es una función del contenido, no del momento (determinismo).
 */
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export type LockMaster = { file: string; sha256: string; /** D-BBW-70: color resuelto del token con el que se pintó el maestro, si tiene uno */ paint?: string };
export type LockDerivative = {
  path: string;
  master: string;
  profile: string;
  sha256: string;
  width?: number;
  height?: number;
  /** fase 6d (vídeo y póster): peso real y presupuesto del perfil (la guardia R6 comprueba bytes ≤ budgetBytes) */
  bytes?: number;
  budgetBytes?: number;
  /** fase 6d (vídeo): pistas del derivado verificadas con ffprobe al generar; un fondo decorativo no lleva audio (D-BBW-24) */
  streams?: string;
};
export type LockBatchMember = {
  master: { file: string; sha256: string };
  kind: 'image' | 'video';
  /** `x,y` del contenido con el que se recortó: si el contenido cambia y no se regenera, la guardia lo dice (R9) */
  focus: string;
  path: string;
  profile: string;
  sha256: string;
  bytes: number;
  budgetBytes: number;
  streams?: string;
};
export type LockFile = {
  generatedBy: string;
  /** `ffmpeg` solo existe cuando hay derivados de vídeo (fase 6d): versión que los generó; la guardia R5 la compara con la instalada */
  tool: { sharp: string; vips: string; ffmpeg?: string };
  surface: { token: string; srgb: string };
  masters: Record<string, LockMaster>;
  derivatives: Record<string, LockDerivative>;
  /** M1c: rigs (anatomía derivada de un maestro vectorial, escrita en generated.ts): huella del JSON derivado, por id del registro */
  rigs?: Record<string, { master: string; profile: string; sha256: string }>;
  /** S12 (R2 del perfil): lotes del campo, por uso y por nombre del medio: maestro, punto focal y derivado sellados (la guardia los recalcula) */
  batches?: Record<string, Record<string, LockBatchMember>>;
  generated: { path: string; sha256: string };
};

export function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex');
}

export function sha256File(absPath: string): string | undefined {
  try {
    return sha256(fs.readFileSync(absPath));
  } catch {
    return undefined;
  }
}

/** JSON con claves ordenadas: el mismo contenido produce siempre los mismos bytes. */
export function stableJson(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.keys(v as Record<string, unknown>).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])]));
    }
    return v;
  };
  return JSON.stringify(sort(value), null, 2) + '\n';
}

export function readLock(absPath: string): LockFile | undefined {
  try {
    return JSON.parse(fs.readFileSync(absPath, 'utf8')) as LockFile;
  } catch {
    return undefined;
  }
}
