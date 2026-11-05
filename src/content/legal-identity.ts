/**
 * DATOS LEGALES SENSIBLES — solo servidor (D-BBW-PLAN-2026-11-05-capa-legal §1 / P-BBW-78).
 *
 * NIF, domicilio y teléfono NUNCA entran en el repo. Viven en Cloudflare Pages como variables cifradas:
 * LEGAL_NIF · LEGAL_DOMICILIO · LEGAL_TELEFONO. Este módulo las lee en build y las entrega a quien le pida.
 *
 * Entorno de producción: CF_PAGES_BRANCH === 'main' (Cloudflare lo inyecta al compilar desde main)
 * o LEGAL_ENV === 'production' (para verificar el mecanismo en local sin valores reales).
 * — Producción sin la variable → error con el NOMBRE de la variable (nunca su valor). Build falla cerrado.
 * — Fuera de producción → relleno visible; el build sale con el marcador como texto.
 *
 * NUNCA importar desde un componente 'use client'. Solo desde rutas de servidor:
 * layout.tsx, page.tsx o generateMetadata (src/app/[locale]/aviso-legal/).
 * No exporta nada con prefijo NEXT_PUBLIC_.
 */

const PLACEHOLDER = '[DATO LEGAL — RELLENO DE PRUEBA]';

type LegalEnv = 'production' | 'preview';

function detectEnv(): LegalEnv {
  if (process.env['LEGAL_ENV'] === 'production') return 'production';
  if (process.env['CF_PAGES_BRANCH'] === 'main') return 'production';
  return 'preview';
}

function readVar(name: string, env: LegalEnv): string {
  const value = process.env[name];
  if (env === 'production') {
    if (!value) {
      throw new Error(
        `[legal-identity] falta la variable de entorno "${name}" en producción — ` +
          `el aviso legal no puede publicarse sin este dato (LSSI art. 10.1)`,
      );
    }
    return value;
  }
  return value ?? PLACEHOLDER;
}

/** Los tres datos que exige la LSSI art. 10.1. Consumidor previsto: page del aviso legal (L2). */
export function getLegalIdentity(): { nif: string; domicilio: string; telefono: string } {
  const env = detectEnv();
  return {
    nif: readVar('LEGAL_NIF', env),
    domicilio: readVar('LEGAL_DOMICILIO', env),
    telefono: readVar('LEGAL_TELEFONO', env),
  };
}
