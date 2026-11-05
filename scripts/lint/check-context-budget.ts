import { readFileSync, existsSync } from 'fs';
import { resolve, isAbsolute } from 'path';

const PROJECT_ROOT = process.cwd();
const CLAUDE_MD = resolve(PROJECT_ROOT, 'CLAUDE.md');
const MAX_SINGLE = 30_000;
const MAX_TOTAL = 70_000;

function main(): void {
  const claudeContent = readFileSync(CLAUDE_MD, 'utf8');
  const imports = claudeContent
    .split('\n')
    .filter(line => line.startsWith('@'))
    .map(line => line.slice(1).trim());

  let total = 0;
  let failed = false;

  type Row = { path: string; chars: number | 'skip'; status: string };
  const rows: Row[] = [];

  for (const imp of imports) {
    const fullPath = isAbsolute(imp) ? imp : resolve(PROJECT_ROOT, imp);
    if (!existsSync(fullPath)) {
      if (isAbsolute(imp)) {
        console.warn(`[budget] skip (hub path not found in CI): ${imp}`);
        rows.push({ path: imp.length > 65 ? '...' + imp.slice(-62) : imp, chars: 'skip', status: 'skip (hub)' });
      } else {
        console.error(`[budget] ERROR archivo local no encontrado: ${imp}`);
        rows.push({ path: imp, chars: 0, status: '⛔ missing' });
        failed = true;
      }
      continue;
    }
    const chars = readFileSync(fullPath, 'utf8').length;
    total += chars;
    const over = chars > MAX_SINGLE;
    if (over) failed = true;
    const label = imp.length > 65 ? '...' + imp.slice(-62) : imp;
    rows.push({ path: label, chars, status: over ? `⛔ > ${MAX_SINGLE}` : '✅' });
  }

  const w = 10;
  const sep = '-'.repeat(80);
  console.log('\n[budget] Presupuesto de contexto — archivos importados por CLAUDE.md');
  console.log(sep);
  for (const r of rows) {
    const c = r.chars === 'skip' ? '(skip)'.padStart(w) : String(r.chars).padStart(w);
    console.log(`  ${c}  ${r.status.padEnd(16)}  ${r.path}`);
  }
  console.log(sep);
  const totalOver = total > MAX_TOTAL;
  if (totalOver) failed = true;
  console.log(`  ${String(total).padStart(w)}  ${(totalOver ? `⛔ > ${MAX_TOTAL}` : '✅').padEnd(16)}  TOTAL\n`);

  if (failed) process.exit(1);
}

main();
