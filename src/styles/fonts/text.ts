import localFont from "next/font/local";

/**
 * Familia de TEXTO — auto-hospedada (D-BBW-14). NO es un puerto: ningún actor externo en runtime.
 * Archivo: space-grotesk-variable.woff2 (eje wght 300–700), origen: proyecto floriankarsten/space-grotesk en GitHub @ 03507d0,
 * licencia SIL OFL 1.1 (LICENSE-OFL.txt, junto al archivo; verificada antes de incorporarla: permite embeber y redistribuir).
 * next/font/local la sirve desde el build (self-hosted, preload, métricas de respaldo) y expone la familia generada en la
 * custom property `--bbf-font-text-src`, que consume el token `--bbf-font-text` (primitives/typography.css). El nombre de la
 * familia no se escribe en ningún sitio: lo genera next/font.
 */
export const textFont = localFont({
  src: "./space-grotesk-variable.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--bbf-font-text-src",
});
