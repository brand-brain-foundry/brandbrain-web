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

export type LockMaster = { file: string; sha256: string };
export type LockDerivative = { path: string; master: string; profile: string; sha256: string; width?: number; height?: number };
export type LockFile = {
  generatedBy: string;
  tool: { sharp: string; vips: string };
  surface: { token: string; srgb: string };
  masters: Record<string, LockMaster>;
  derivatives: Record<string, LockDerivative>;
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
