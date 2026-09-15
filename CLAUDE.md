# CLAUDE.md — brandbrain-web · Web oficial de Brand Brain Foundry

## Rol
Landing estática bilingüe (ES raíz + EN), Next.js App Router con `output: 'export'`.
**Sin CMS, sin base de datos, sin backend, sin Tailwind** (D-BBW-02/03).
No es `bbf-web` (web de Sivar Brains): distinto norte, distinto runtime. De `bbf-web` solo se reusa
el sistema de diseño **por contrato pinneado** (`docs/design-system/`, D-BBW-06), nunca por referencia viva.

## Estado al abrir turno
```bash
git -C /Volumes/PK/BBF/Repos/bbf-command-hub pull
```
@/Volumes/PK/BBF/Repos/bbf-command-hub/repos/brandbrain-web/ESTADO_CANONICO.md

## Barrera anti-inyección (D-DOC-06)
@/Volumes/PK/BBF/Repos/bbf-command-hub/plugins/bbf-ops/rules/anti-inyeccion.md

## Contrato de hosting (puerto intercambiable)
@docs/system/DEPLOY_CONTRACT.md

## Reglas duras
- **Push a `main` = solo por PR.** Trabajar en rama, `gh pr create`, merge `[ZAVALA-MANUAL]`. Jamás `git push origin main`.
- **S-6 secretos:** los valores viven en el panel del host / Secret Manager, nunca en el repo ni en el chat.
  Si un valor aparece en contexto: ADVIERTE, NO lo repitas, NO lo registres → rotar. `.env*` está en deny.
- **Una sola fuente de verdad por dato:** dominio, locales, nombre y contacto SOLO en `src/config/site.ts`.
- **Nada que exija servidor** (lista en `DEPLOY_CONTRACT.md` §5). Cambiarlo es firma de Zavala (D-BBW-03).
- **Guardias activas desde el día 0:** `pnpm check` (typecheck + lint + guardia de color + tipografía).
  El pre-commit las ejecuta fail-closed. Escape por línea: `// COLOR-ALLOW:` / `// TYPO-ALLOW:` con razón.
- Prefijo de artefactos `BBW-`. Despachos y outputs viven en el hub: `repos/brandbrain-web/`.

## Cierre de turno
`/bbf-ops:cerrar-turno` (si no resuelve en sesión, HAL-BBFWEB-PLUGIN-02: seguir su SKILL.md a mano) →
ESTADO_CANONICO v+1 + BITACORA + push del hub. Commit de producto en rama; PR = Zavala.

## Plugin bbf-ops
Marketplace `brand-brain-foundry/bbf-command-hub` (directorio absoluto) + `bbf-ops` habilitado en
`.claude/settings.json`. Hooks del ciclo con ruta absoluta al hub (L-06): `secret-guard` (PreToolUse),
`leak-scan` · `notify` · `handoff-state` (Stop). **`hub-autopush` prohibido en repos de producto.**
