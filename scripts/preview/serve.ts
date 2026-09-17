/**
 * scripts/preview/serve.ts — previsualización LOCAL del artefacto (`pnpm preview`, fase 6f, D-BBW-26).
 * Sirve `out/` como lo haría un host estático: índice de directorio (`/es/` → `es/index.html`), barra final (`/es` → 301 `/es/`),
 * 404 con `404.html`, y **rangos HTTP** (`Accept-Ranges` + 206): sin ellos Chrome deja el vídeo del héroe en `readyState 0` (L-51).
 * Solo Node (sin dependencia): es herramienta de desarrollo, no toca el artefacto ni el contrato de puerto (DEPLOY_CONTRACT.md §1).
 * Uso: `pnpm preview` (compila y sirve) · `pnpm preview:serve` (solo sirve) · puerto por `PORT` (por defecto 4173).
 */
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve("out");
const PORT = Number(process.env.PORT) || 4173;
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
};

function stat(path: string) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, safe);
  if (!file.startsWith(ROOT + sep) && file !== ROOT) {
    res.writeHead(403).end();
    return;
  }
  const st = stat(file);
  if (st?.isDirectory()) {
    if (!pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${pathname}/${url.search}` }).end();
      return;
    }
    file = join(file, "index.html");
  }
  const fst = stat(file);
  if (!fst?.isFile()) {
    const nf = join(ROOT, "404.html");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    if (stat(nf)?.isFile()) createReadStream(nf).pipe(res);
    else res.end("404");
    return;
  }
  const type = TYPES[extname(file)] ?? "application/octet-stream";
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "no-store");
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = Math.min(range[2] ? Number(range[2]) : fst.size - 1, fst.size - 1);
    if (start >= fst.size || start > end) {
      res.writeHead(416, { "Content-Range": `bytes */${fst.size}` }).end();
      return;
    }
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${fst.size}`, "Content-Length": end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": fst.size });
  createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`[preview] out/ → http://127.0.0.1:${PORT}/es/  (rangos HTTP activos; Ctrl+C para parar)`);
});
