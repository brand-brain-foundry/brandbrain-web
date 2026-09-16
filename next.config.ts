import type { NextConfig } from "next";

/**
 * D-BBW-03 — ARTEFACTO ESTÁTICO. `output: 'export'` hace que `next build`
 * emita HTML/CSS/JS puro en `out/`, servible por cualquier host estático.
 * Es la decisión que sostiene la portabilidad de hosting (docs/system/DEPLOY_CONTRACT.md).
 *
 * Si alguien quita `output: 'export'`:
 *   - el build deja de producir `out/` y el host (que solo sirve estático) no tiene nada que servir;
 *   - se abre la puerta a features de servidor (server actions, proxy, ISR, image loader por defecto,
 *     rutas dinámicas sin generateStaticParams) que rompen el contrato de puerto;
 *   - cambiar esto es firma de Zavala (D-BBW-03), no criterio de ejecución.
 *
 * `images.unoptimized: true`: la optimización de imagen en runtime exige servidor (prohibida en export).
 * `trailingSlash: true`: emite `es/index.html` en vez de `es.html` — índice de directorio, lo que
 * cualquier servidor estático resuelve sin reglas de rewrite.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
