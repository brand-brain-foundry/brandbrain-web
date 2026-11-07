/**
 * ANALÍTICA — CONFIGURACIÓN TÉCNICA (P-BBW-82, L3 §0.1 «Puerto de analítica»).
 *
 * El token del sitio de Cloudflare Web Analytics vive AQUÍ y en ningún otro sitio (I-2): ni en `content/` (no es texto) ni en
 * `src/config/site.ts` (protegido, D-BBW-03). NO es un secreto: con la carga manual el token viaja en el JavaScript de cada
 * página que mide, y Cloudflare lo valida contra el anfitrión declarado al dar de alta el sitio (doc «Get started», 2026-04-17).
 * Por eso puede estar en un repositorio público.
 *
 * `null` = SIN token = el puerto elige la ALTERNATIVA NULA (no se carga nada, nunca). Fue el estado de este archivo hasta que
 * Zavala entregó el token (despacho L3 §GATE 2, 2026-11-06). El token aquí es lo único que activa el adaptador de Cloudflare;
 * el banner y la preferencia funcionan igual con o sin él. Volver a `null` es la vía prevista para retirar la medición.
 *
 * Qué páginas se miden NO se decide aquí: sale del tipo de cada página (`src/config/page-types.ts`, regla `measured`, heredada por el registro `src/config/pages.ts`), para que una
 * ruta excluida (hoy el aviso legal, requisito 6 del despacho) no se escriba a mano en ningún otro sitio.
 */
export const ANALYTICS_TOKEN: string | null = "3536993f9a3540d3859b40e8a9e7dd95";
