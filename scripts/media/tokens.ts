/**
 * scripts/media/tokens.ts — resuelve un ROL de color del sistema (p. ej. `--bbf-surface-base`) a sRGB leyendo los archivos de tokens
 * (primitivos + semánticos), sustituyendo `var()`, evaluando `calc()` y convirtiendo OKLCH → sRGB (fórmulas de Björn Ottosson, las
 * mismas que implementa el navegador). Así los derivados opacos reciben la superficie POR TOKEN y ningún color se escribe a mano.
 * Alcance: solo `oklch(L C H)` (la forma B pura de primitives/colors.css). Otra forma = error explícito, nunca un color adivinado.
 */
import * as fs from 'fs';
import * as path from 'path';
import { REPO_ROOT } from './lock';

const TOKEN_FILES = ['src/styles/tokens/primitives/colors.css', 'src/styles/tokens/semantic/colors.css'];

function loadDeclarations(): Map<string, string> {
  const decls = new Map<string, string>();
  for (const rel of TOKEN_FILES) {
    const css = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/(--bbf-[a-z0-9-]+)\s*:\s*([^;]+);/g)) decls.set(m[1], m[2].trim());
  }
  return decls;
}

function substitute(value: string, decls: Map<string, string>, depth = 0): string {
  if (depth > 32) throw new Error(`[media] token: referencia circular al resolver "${value}"`);
  return value.replace(/var\((--bbf-[a-z0-9-]+)\)/g, (_, name: string) => {
    const v = decls.get(name);
    if (v === undefined) throw new Error(`[media] token "${name}" no declarado en ${TOKEN_FILES.join(', ')}`);
    return `(${substitute(v, decls, depth + 1)})`;
  });
}

/** Evaluador aritmético mínimo (+ − × ÷, paréntesis, `calc(` ≡ `(`). Solo números: una unidad o una función desconocida es error. */
function evalArith(expr: string): number {
  const src = expr.replace(/calc\(/g, '(');
  let i = 0;
  const peek = () => src[i];
  const skip = () => {
    while (i < src.length && /\s/.test(src[i])) i++;
  };
  const parseNumber = (): number => {
    skip();
    const m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i.exec(src.slice(i));
    if (!m) throw new Error(`[media] token: expresión no numérica en "${expr}" (posición ${i})`);
    i += m[0].length;
    return Number(m[0]);
  };
  const parseFactor = (): number => {
    skip();
    if (peek() === '(') {
      i++;
      const v = parseExpr();
      skip();
      if (peek() !== ')') throw new Error(`[media] token: paréntesis sin cerrar en "${expr}"`);
      i++;
      return v;
    }
    if (peek() === '-') {
      i++;
      return -parseFactor();
    }
    if (peek() === '+') {
      i++;
      return parseFactor();
    }
    return parseNumber();
  };
  const parseTerm = (): number => {
    let v = parseFactor();
    for (;;) {
      skip();
      if (peek() === '*') {
        i++;
        v *= parseFactor();
      } else if (peek() === '/') {
        i++;
        v /= parseFactor();
      } else return v;
    }
  };
  const parseExpr = (): number => {
    let v = parseTerm();
    for (;;) {
      skip();
      if (peek() === '+') {
        i++;
        v += parseTerm();
      } else if (peek() === '-') {
        i++;
        v -= parseTerm();
      } else return v;
    }
  };
  const v = parseExpr();
  skip();
  if (i !== src.length) throw new Error(`[media] token: resto no evaluable en "${expr}" → "${src.slice(i)}"`);
  return v;
}

/** Divide el interior de `oklch(...)` en sus tres argumentos respetando paréntesis anidados. */
function splitTopLevel(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of inner) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function oklchToSrgbHex(L: number, C: number, H: number): string {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const gamma = (x: number) => {
    const c = Math.min(1, Math.max(0, x));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  return '#' + lin.map((x) => Math.round(gamma(x) * 255).toString(16).padStart(2, '0')).join('');
}

export type ResolvedColor = { token: string; oklch: { L: number; C: number; H: number }; srgb: string };

export function resolveColorToken(token: string): ResolvedColor {
  const decls = loadDeclarations();
  const raw = decls.get(token);
  if (raw === undefined) throw new Error(`[media] el rol "${token}" no existe en ${TOKEN_FILES.join(', ')}`);
  const resolved = substitute(raw, decls);
  const start = resolved.indexOf('oklch(');
  if (start < 0) throw new Error(`[media] el rol "${token}" no resuelve a oklch(L C H) (forma B): "${resolved}"`);
  let depth = 0;
  let end = -1;
  for (let i = start + 'oklch'.length; i < resolved.length; i++) {
    if (resolved[i] === '(') depth++;
    if (resolved[i] === ')' && --depth === 0) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error(`[media] oklch sin cerrar al resolver "${token}": "${resolved}"`);
  const args = splitTopLevel(resolved.slice(start + 'oklch('.length, end).trim());
  if (args.length !== 3) throw new Error(`[media] oklch con ${args.length} argumento(s) al resolver "${token}": "${resolved}"`);
  const [L, C, H] = args.map(evalArith);
  return { token, oklch: { L, C, H }, srgb: oklchToSrgbHex(L, C, H) };
}
