/**
 * GENERADO por scripts/media/build.ts (pnpm media:build) desde media/masters/ + src/media/registry.ts. NO EDITAR: la guardia
 * scripts/lint/check-media.ts compara este archivo con media/derivatives.lock.json. Rutas absolutas de los derivados servidos desde
 * el propio sitio (adaptador actual, docs/system/MEDIA.md), con sus dimensiones intrínsecas (se declaran en <img> para no provocar
 * saltos de composición), y los vectores inline (viewBox + trazado; pintan con currentColor y se dimensionan por tokens).
 */
export const media = {
  icon: { src: "/icon.svg", type: "image/svg+xml", width: 263, height: 272, sizes: "263x272" },
  favicon: { src: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
  appleTouchIcon: { src: "/apple-touch-icon-180.png", type: "image/png", width: 180, height: 180, sizes: "180x180" },
  icon192: { src: "/icon-192.png", type: "image/png", width: 192, height: 192, sizes: "192x192" },
  icon512: { src: "/icon-512.png", type: "image/png", width: 512, height: 512, sizes: "512x512" },
  icon512Maskable: { src: "/icon-512-maskable.png", type: "image/png", width: 512, height: 512, sizes: "512x512" },
  share: { src: "/share-1200x630.png", type: "image/png", width: 1200, height: 630, sizes: "1200x630" },
  heroLoop720: { src: "/hero-loop-1280x720.mp4", type: "video/mp4", width: 1280, height: 720, sizes: "1280x720" },
  heroLoop360: { src: "/hero-loop-640x360.mp4", type: "video/mp4", width: 640, height: 360, sizes: "640x360" },
  heroLoopPoster: { src: "/hero-loop-poster-1280x720.jpg", type: "image/jpeg", width: 1280, height: 720, sizes: "1280x720" },
  manifest: { src: "/manifest.webmanifest", type: "application/manifest+json" },
} as const;

export const inlineIcons = {
  linkedin: { viewBox: "0 0 24 24", paint: "fill", use: "profile", d: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.71h.05c.53-.96 1.83-1.97 3.77-1.97C21.4 8.74 23 10.9 23 14.3V21h-4v-6.06c0-1.52-.55-2.56-1.93-2.56-1.05 0-1.68.7-1.95 1.38-.1.24-.12.58-.12.92V21h-4V9z" },
  github: { viewBox: "0 0 24 24", paint: "fill", use: "profile", d: "M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-1.94c-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12A11.5 11.5 0 0 0 12 .5z" },
  underlineWaveNav: { viewBox: "0 0 160 7", paint: "stroke", use: "ornament", d: "M0 3.5 Q 6 0.5 12 3.5 T 24 3.5 T 36 3.5 T 48 3.5 T 60 3.5 T 72 3.5 T 84 3.5 T 96 3.5 T 108 3.5 T 120 3.5 T 132 3.5 T 144 3.5 T 156 3.5 T 168 3.5" },
  underlineWaveMenu: { viewBox: "0 0 340 9", paint: "stroke", use: "ornament", d: "M0 4.5 Q 6 1 12 4.5 T 24 4.5 T 36 4.5 T 48 4.5 T 60 4.5 T 72 4.5 T 84 4.5 T 96 4.5 T 108 4.5 T 120 4.5 T 132 4.5 T 144 4.5 T 156 4.5 T 168 4.5 T 180 4.5 T 192 4.5 T 204 4.5 T 216 4.5 T 228 4.5 T 240 4.5 T 252 4.5 T 264 4.5 T 276 4.5 T 288 4.5 T 300 4.5 T 312 4.5 T 324 4.5 T 336 4.5 T 348 4.5" },
  toggleArmTop: { viewBox: "0 0 34 6", paint: "stroke", use: "ornament", d: "M0 3 Q 4.25 0.5 8.5 3 T 17 3 T 25.5 3 T 34 3" },
  toggleArmBottom: { viewBox: "0 0 34 6", paint: "stroke", use: "ornament", d: "M0 3 Q 4.25 5.5 8.5 3 T 17 3 T 25.5 3 T 34 3" },
} as const;
