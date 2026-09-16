# CLAUDE.md — brandbrain-web · Web oficial de Brand Brain Foundry

## Rol
Web oficial de Brand Brain Foundry. Entregable en curso: la landing (primer entregable, no el destino — ver plan).
Next.js App Router con `output: 'export'`; estructura de rutas por locale ES/EN (D-BBW-07), **lanzamiento solo en ES**
(D-BBW-15: el build emite solo `publishedLocales`). Estático por defecto, dinámico por excepción con HTML completo (D-BBW-09).
**Sin CMS, sin base de datos, sin Tailwind** (D-BBW-02).
No es `bbf-web` (web de Sivar Brains): distinto norte, distinto runtime. De `bbf-web` solo se reusa
el sistema de diseño **por contrato pinneado** (`docs/design-system/`, D-BBW-06), nunca por referencia viva.

## Estado al abrir turno
```bash
git -C /Volumes/PK/BBF/Repos/bbf-command-hub pull
```
@/Volumes/PK/BBF/Repos/bbf-command-hub/repos/brandbrain-web/ESTADO_CANONICO.md

## Trayectoria (fases con puertas + 8 criterios transversales que todo despacho BBW debe satisfacer) — P-BBW-12
@/Volumes/PK/BBF/Repos/bbf-command-hub/repos/brandbrain-web/PLAN_DE_CONSTRUCCION.md

## Barrera anti-inyección (D-DOC-06)
@/Volumes/PK/BBF/Repos/bbf-command-hub/plugins/bbf-ops/rules/anti-inyeccion.md

## Contrato de hosting (puerto intercambiable) y registro de puertos
@docs/system/DEPLOY_CONTRACT.md
@docs/system/PORTS.md

## Reglas duras
- **Push a `main` = solo por PR.** Trabajar en rama, `gh pr create`, merge `[ZAVALA-MANUAL]`. Jamás `git push origin main`.
- **S-6 secretos:** los valores viven en el panel del host / Secret Manager, nunca en el repo ni en el chat.
  Si un valor aparece en contexto: ADVIERTE, NO lo repitas, NO lo registres → rotar. `.env*` está en deny.
- **Una sola fuente de verdad por dato:** dominio, locales, nombre y contacto SOLO en `src/config/site.ts`.
- **Nada que exija servidor** (lista en `DEPLOY_CONTRACT.md` §5). Cambiarlo es firma de Zavala (D-BBW-03).
- **Guardias activas desde el día 0:** `pnpm check` (typecheck + lint + guardia de color + tipografía).
  El pre-commit las ejecuta fail-closed. Escape por línea: `// COLOR-ALLOW:` / `// TYPO-ALLOW:` con razón.
  Sin baseline: **cualquier** HEX o font-size/font-weight crudo fuera de `src/styles/tokens/primitives/` rompe el commit.
- **Sistema de diseño (fase 4, D-BBW-14):** todo valor deriva por fórmula desde una madre en `src/styles/tokens/primitives/`
  (Eje A, `docs/design-system/`). Dos familias tipográficas y ni una más: display por Typekit (puerto), texto auto-hospedada.
  Nombres de fuente SOLO en `primitives/typography.css`. `react/jsx-no-literals` activa: cero texto de negocio en componentes.
- Prefijo de artefactos `BBW-`. Despachos y outputs viven en el hub: `repos/brandbrain-web/`.

## Cierre de turno
`/bbf-ops:cerrar-turno` (si no resuelve en sesión, HAL-BBFWEB-PLUGIN-02: seguir su SKILL.md a mano) →
ESTADO_CANONICO v+1 + BITACORA + push del hub. Commit de producto en rama; PR = Zavala.

## Plugin bbf-ops
Marketplace `brand-brain-foundry/bbf-command-hub` (directorio absoluto) + `bbf-ops` habilitado en
`.claude/settings.json`. Hooks del ciclo con ruta absoluta al hub (L-06): `secret-guard` (PreToolUse),
`leak-scan` · `notify` · `handoff-state` (Stop). **`hub-autopush` prohibido en repos de producto.**
