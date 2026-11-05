#!/usr/bin/env tsx
/**
 * check-legal-data.ts — GUARDIA ANTI-FUGA DE DATOS LEGALES (P-BBW-78).
 *
 * Busca en el árbol versionado patrones que tengan la FORMA de un NIF/DNI, NIE o teléfono español.
 * Falla (exit 1) si encuentra alguno fuera de la lista de valores ficticios declarados AQUÍ.
 *
 * Por qué existe: NIF, domicilio y teléfono SOLO viven en variables de entorno de Cloudflare (cifradas).
 * Ningún valor real puede entrar en el repo (público). Esta guardia es la barrera mecánica.
 *
 * Valores ficticios de prueba PERMITIDOS (declarados explícitamente, solo para verificar el mecanismo):
 *   NIF:   00000000T  (ocho ceros + T, control correcto para el número 0)
 *   NIE:   X0000000T  (X + siete ceros + T)
 *   Tel.:  600000000  · +34600000000  (todos ceros, claramente no real)
 *
 * Uso: pnpm lint:legal · pnpm guard · pre-commit.
 * Exit 0 = limpio. Exit 1 = hallazgos. Exit 2 = error del tool (fail-closed en pre-commit).
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ── Patrones ────────────────────────────────────────────────────────────────────────────────────────────
const NIF_RE = /\b\d{8}[A-TRWAGMYFPDXBNJZSQVHLCKE]\b/g;
const NIE_RE = /\b[XYZ]\d{7}[A-TRWAGMYFPDXBNJZSQVHLCKE]\b/g;
// Móvil (6xx/7xx) o fijo (9xx), 9 dígitos, opcionalmente precedidos por +34.
// (?<![\d.]) evita coincidir dentro de constantes matemáticas (1.707614701) o fechas largas.
const TEL_RE = /(?<![\d.])(?:\+34[\s\-.]?)?[679]\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3}\b/g;

// ── Valores ficticios PERMITIDOS ────────────────────────────────────────────────────────────────────────
const ALLOWED_NIF = new Set(['00000000T']);
const ALLOWED_NIE = new Set(['X0000000T']);
// Para el teléfono se normaliza quitando separadores antes de comparar
const ALLOWED_TEL_NORMALIZED = new Set(['600000000', '+34600000000']);

function normalizeTel(raw: string): string {
  return raw.replace(/[\s\-.]/g, '');
}

// ── Extensiones y rutas a escanear ──────────────────────────────────────────────────────────────────────
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.json', '.css', '.toml', '.env.example']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'out', '.git']);
// Este propio archivo está excluido: contiene los valores ficticios en el código
const SKIP_FILES = new Set([
  path.relative(REPO_ROOT, path.resolve(__dirname, 'check-legal-data.ts')).split(path.sep).join('/'),
]);

type Finding = { file: string; line: number; type: 'NIF' | 'NIE' | 'TEL' };
const findings: Finding[] = [];

function scan(abs: string): void {
  const rel = path.relative(REPO_ROOT, abs).split(path.sep).join('/');
  if (SKIP_FILES.has(rel)) return;

  let content: string;
  try {
    content = fs.readFileSync(abs, 'utf8');
  } catch {
    console.error(`[legal-gate] FAIL-CLOSED: no se puede leer ${rel}`);
    process.exit(2);
  }

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    for (const m of line.matchAll(NIF_RE)) {
      if (!ALLOWED_NIF.has(m[0])) findings.push({ file: rel, line: lineNum, type: 'NIF' });
    }
    for (const m of line.matchAll(NIE_RE)) {
      if (!ALLOWED_NIE.has(m[0])) findings.push({ file: rel, line: lineNum, type: 'NIE' });
    }
    for (const m of line.matchAll(TEL_RE)) {
      if (!ALLOWED_TEL_NORMALIZED.has(normalizeTel(m[0]))) findings.push({ file: rel, line: lineNum, type: 'TEL' });
    }
  });
}

function walk(dir: string): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(abs);
    } else if (e.isFile() && SCAN_EXTENSIONS.has(path.extname(e.name))) {
      scan(abs);
    }
  }
}

walk(REPO_ROOT);

if (findings.length === 0) {
  console.log('[legal-gate] OK — ningún NIF/NIE/teléfono real detectado en el árbol versionado.');
  process.exit(0);
}

console.error(`[legal-gate] ${findings.length} hallazgo(s) — datos legales reales no pueden estar en el repo (P-BBW-78).`);
for (const f of findings) {
  // Nunca se imprime el valor: solo archivo, línea y tipo.
  console.error(`  ${f.type}  ${f.file}:${f.line}`);
}
console.error('  Los datos legales (NIF, domicilio, teléfono) viven SOLO en variables de entorno de Cloudflare.');
console.error('  Si es un valor de prueba, añadirlo al ALLOWED_* de este script y documentarlo.');
process.exit(1);
