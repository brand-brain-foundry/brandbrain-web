#!/usr/bin/env tsx
/**
 * export-schema.ts — escribe `content/site.schema.json` desde la descripción declarativa del documento del sitio (S2 · P-BBW-95, §0.2.5).
 * Uso: `pnpm content:schema`. El fichero generado se versiona y NUNCA se edita a mano: la guardia R1 (`scripts/lint/check-content.ts`)
 * falla si no coincide con lo que `renderSiteSchema` devuelve, y pide ejecutar esta orden.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { renderSiteSchema } from '../../src/content/site-schema';
import { WRITTEN_LINK_KEYS } from '../../src/content/site';
import { MEDIA_IDENTIFIERS } from '../../src/media';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const SCHEMA_PATH = path.join(REPO_ROOT, 'content', 'site.schema.json');

const text = renderSiteSchema(WRITTEN_LINK_KEYS, MEDIA_IDENTIFIERS);
const before = fs.existsSync(SCHEMA_PATH) ? fs.readFileSync(SCHEMA_PATH, 'utf8') : null;
fs.writeFileSync(SCHEMA_PATH, text);
console.log(`[content:schema] ${before === text ? 'sin cambios' : before === null ? 'creado' : 'actualizado'}: content/site.schema.json (${text.length} caracteres)`);
