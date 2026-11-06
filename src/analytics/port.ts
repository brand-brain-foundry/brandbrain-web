/**
 * PUERTO DE ANALÍTICA (P-BBW-82, L3 §0.1; registro: docs/system/PORTS.md, fila «Analítica»; criterio transversal 5).
 *
 * Contrato que cumple todo adaptador: `load()` inserta la medición y `block()` garantiza que, a partir de ese instante, no sale
 * ni una petición más al actor (retirar el consentimiento es tan fácil como darlo: requisito 3 del despacho). Ningún componente
 * conoce al actor: consume `analytics` y el adaptador que haya detrás.
 *
 * ADAPTADOR ACTUAL: Cloudflare Web Analytics con carga MANUAL del fragmento (nunca la inyección automática del panel de Pages,
 * que la pondría en todas las páginas y antes de consentir; memo §1.3). ALTERNATIVA PREVISTA: la NULA, que no hace nada; es la
 * que rige mientras `ANALYTICS_TOKEN` sea `null` (`src/config/analytics.ts`).
 *
 * QUÉ SE MIDE lo decide el registro de páginas (`src/config/pages.ts`, `measured`), no el adaptador: `shouldMeasure(pathname)`
 * es la única puerta y la calcula desde el registro y los locales publicados. El aviso legal queda fuera (requisito 6).
 *
 * El puerto NUNCA carga nada por su cuenta: quien llama es el cableado del consentimiento, y solo tras «Aceptar».
 */
import { ANALYTICS_TOKEN } from "../config/analytics";
import { LEGAL_PAGES, legalPageRoute } from "../config/pages";
import { site } from "../config/site";
import { createCloudflareAdapter } from "./adapters/cloudflare";
import { nullAdapter } from "./adapters/null";

export type AnalyticsAdapter = {
  /** nombre del adaptador, para el registro de puertos y para decirlo por consola en desarrollo */
  readonly name: "cloudflare" | "null";
  /** inserta la medición en la página actual (idempotente: una segunda llamada no hace nada) */
  load(): void;
  /** desde este instante, ninguna petición más al actor, aunque la medición ya estuviera cargada (idempotente) */
  block(): void;
};

/** Rutas que NO se miden: las páginas con `measured: false` × los locales publicados. Calculadas, nunca escritas. */
const UNMEASURED_PATHS: ReadonlySet<string> = new Set(
  site.publishedLocales.flatMap((locale) =>
    LEGAL_PAGES.filter((p) => !p.measured).map((p) => legalPageRoute(locale, p.slug)),
  ),
);

/** ¿Esta ruta se mide? Normaliza la barra final para comparar con el registro (el export emite `/es/aviso-legal/`). */
export function shouldMeasure(pathname: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return !UNMEASURED_PATHS.has(normalized);
}

/** El adaptador vigente, elegido UNA vez por la configuración técnica: con token, Cloudflare; sin token, la alternativa nula. */
export const analytics: AnalyticsAdapter = ANALYTICS_TOKEN ? createCloudflareAdapter(ANALYTICS_TOKEN) : nullAdapter;
