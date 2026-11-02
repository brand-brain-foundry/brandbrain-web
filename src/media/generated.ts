/**
 * GENERADO por scripts/media/build.ts (pnpm media:build) desde media/masters/ + src/media/registry.ts. NO EDITAR: la guardia
 * scripts/lint/check-media.ts compara este archivo con media/derivatives.lock.json. Rutas absolutas de los derivados servidos desde
 * el propio sitio (adaptador actual, docs/system/MEDIA.md), con sus dimensiones intrínsecas (se declaran en <img> para no provocar
 * saltos de composición), y los vectores inline (viewBox + trazado; pintan con currentColor y se dimensionan por tokens).
 */
/** Color de SUPERFICIE resuelto del rol `--bbf-surface-base` (D-BBW-75). Lo consume la etiqueta `theme-color` del documento, que
 * así sale del MISMO token y del MISMO cálculo que el `theme_color` del manifiesto: no pueden divergir, porque son el mismo número
 * generado una sola vez. Escribirlo a mano en el layout habría sido un hex fuera de primitives y una segunda fuente de verdad. */
export const surfaceColor = "#000000" as const; // COLOR-ALLOW: valor GENERADO resolviendo --bbf-surface-base, no escrito a mano; su correspondencia con el token la vigila check-media.ts (huella de este archivo contra el lock, que sella el rol y su sRGB)

export const media = {
  icon: { src: "/icon.svg", type: "image/svg+xml", width: 263, height: 272, sizes: "263x272" },
  favicon: { src: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
  appleTouchIcon: { src: "/apple-touch-icon-180.png", type: "image/png", width: 180, height: 180, sizes: "180x180" },
  icon192: { src: "/icon-192.png", type: "image/png", width: 192, height: 192, sizes: "192x192" },
  icon512: { src: "/icon-512.png", type: "image/png", width: 512, height: 512, sizes: "512x512" },
  icon512Maskable: { src: "/icon-512-maskable.png", type: "image/png", width: 512, height: 512, sizes: "512x512" },
  share: { src: "/share-1200x630.png", type: "image/png", width: 1200, height: 630, sizes: "1200x630" },
  gcFoundational72: { src: "/gc-foundational-72.png", type: "image/png", width: 72, height: 72, sizes: "72x72" },
  gcFoundational144: { src: "/gc-foundational-144.png", type: "image/png", width: 144, height: 144, sizes: "144x144" },
  manifest: { src: "/manifest.webmanifest", type: "application/manifest+json" },
} as const;

export const inlineIcons = {
  linkedin: { viewBox: "0 0 24 24", paint: "fill", use: "profile", d: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.71h.05c.53-.96 1.83-1.97 3.77-1.97C21.4 8.74 23 10.9 23 14.3V21h-4v-6.06c0-1.52-.55-2.56-1.93-2.56-1.05 0-1.68.7-1.95 1.38-.1.24-.12.58-.12.92V21h-4V9z" },
  arrowRight: { viewBox: "0 0 16 16", paint: "stroke", use: "ornament", d: "M2.5 8h11M9 3.5 13.5 8 9 12.5" },
  arrowUpRight: { viewBox: "0 0 16 16", paint: "stroke", use: "ornament", d: "M4.5 11.5l7-7M5.5 4.5h6v6" },
  toggleArmTop: { viewBox: "0 0 34 6", paint: "stroke", use: "ornament", d: "M0 3 Q 4.25 0.5 8.5 3 T 17 3 T 25.5 3 T 34 3" },
  toggleArmBottom: { viewBox: "0 0 34 6", paint: "stroke", use: "ornament", d: "M0 3 Q 4.25 5.5 8.5 3 T 17 3 T 25.5 3 T 34 3" },
} as const;
