/**
 * ADAPTADOR NULO del puerto de analítica (P-BBW-82; docs/system/PORTS.md, fila «Analítica», alternativa prevista).
 * No hace nada, a propósito: es el adaptador vigente mientras no haya token (`src/config/analytics.ts`) y la prueba de que el
 * banner y la preferencia no dependen del actor. Cero hosts, cero peticiones.
 */
import type { AnalyticsAdapter } from "../port";

export const nullAdapter: AnalyticsAdapter = {
  name: "null",
  load() {
    /* nada que cargar */
  },
  block() {
    /* nada que bloquear */
  },
};
