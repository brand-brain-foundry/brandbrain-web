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

## Contrato de hosting (puerto intercambiable), registro de puertos, modelo de contenido, contrato de medios, pesos por familia, excepciones del sistema y constantes de algoritmo
@docs/system/DEPLOY_CONTRACT.md
@docs/system/PORTS.md
@docs/system/CONTENT_MODEL.md
@docs/system/MEDIA.md
@docs/system/TYPOGRAPHY_WEIGHTS.md
@docs/system/DESIGN_EXCEPTIONS.md
@docs/system/BEHAVIOR.md

## Reglas duras
- **Push a `main` = solo por PR.** Trabajar en rama, `gh pr create`, merge `[ZAVALA-MANUAL]`. Jamás `git push origin main`.
- **S-6 secretos:** los valores viven en el panel del host / Secret Manager, nunca en el repo ni en el chat.
  Si un valor aparece en contexto: ADVIERTE, NO lo repitas, NO lo registres → rotar. `.env*` está en deny.
- **Una sola fuente de verdad por dato:** dominio, locales, nombre y contacto SOLO en `src/config/site.ts`.
- **Nada que exija servidor** (lista en `DEPLOY_CONTRACT.md` §5). Cambiarlo es firma de Zavala (D-BBW-03).
- **Guardias activas desde el día 0:** `pnpm check` (typecheck + lint + guardias de color, tipografía, sistema tipográfico propio, contenido y medios).
  El pre-commit las ejecuta fail-closed. Escape por línea: `// COLOR-ALLOW:` / `// TYPO-ALLOW:` / `// WEIGHT-ALLOW:` con razón.
  Sin baseline: **cualquier** HEX o font-size/font-weight crudo fuera de `src/styles/tokens/primitives/` rompe el commit.
- **Pesos por familia (fase 5):** las dos familias tienen ejes incompatibles (display 25–500, text 300–700). Todo `--bbf-weight-*` lleva
  familia y cae en su rango declarado; un componente pide `--bbf-type-<rol>-weight`, nunca un número (`docs/system/TYPOGRAPHY_WEIGHTS.md`).
- **Contenido en su capa (fase 5, modelo granular fase 6a):** los textos viven en `content/<locale>/…` (`global.json` + `pages/`) y llegan por
  el puerto `src/content/` (`getGlobal`, `getPage`). Cada texto su llave, por rol; esquema estricto (llave desconocida o HTML = error);
  enlaces por llave de `site.links`; marcadores `[[PENDIENTE: …]]` hasta que haya copy. Cero literales en componentes. Solo locales
  publicados: crear `content/en/` = declarar EN (D-BBW-15, la guardia lo bloquea). Sustituciones (fase 6c, D-BBW-23): solo `{{brand}}`,
  `{{domain}}`, `{{year}}` del registro `src/content/substitutions.ts`, resueltas al compilar; una no declarada o lógica entre llaves rompe
  el build. `docs/system/CONTENT_MODEL.md`.
- **Medios (fase 6c, D-BBW-21, `docs/system/MEDIA.md`):** maestro en `media/masters/` (se edita) → derivados por `pnpm media:build` en `public/` y
  `src/media/generated.ts` (se versionan, NUNCA se editan; la guardia `check-media.ts` compara hashes con el lock). Un componente consume
  `src/media` (`media.<id>`, `<Icon name>`) y nunca escribe una ruta ni una dimensión. Un maestro no se dibuja: se trae del diseño o se espera.
  Herramienta de desarrollo `sharp` exacta, solo en `media:build`; cero dependencias de producción.
- **Sistema de diseño (fase 4, D-BBW-14; residuales resueltos fase 6a, D-BBW-16; escala re-anclada 6a-bis, D-BBW-17/18):** todo valor deriva por fórmula desde una madre en
  `src/styles/tokens/primitives/` (Eje A, `docs/design-system/`). Lo que no cae en la fórmula se ajusta al peldaño más cercano; una
  excepción exige valor + razón + registro en `docs/system/DESIGN_EXCEPTIONS.md` (hoy: EXC-BBW-01 display, EXC-BBW-02 rótulo derivado del display, D-BBW-19; la guardia propia
  `scripts/lint/check-typography-system.ts` cruza código y registro). Dos familias tipográficas y ni una más: display por Typekit (puerto), texto auto-hospedada.
  Nombres de fuente SOLO en `primitives/typography.css`. `react/jsx-no-literals` activa: cero texto de negocio en componentes.
- **Componentes (fase 6b, Eje B `docs/design-system/EJE-B-composicion-de-ui.md`):** `src/components/{atoms,molecules,organisms,sections}/`, CSS Modules; un componente
  CONSUME tokens (`var(--bbf-*)`) y nunca escribe un valor (ni color, ni tamaño, ni espacio, ni duración, ni media query: la vista responsiva llega por
  `semantic/viewport.css`). Si falta un token, se reporta; no se inventa en el componente. **El foco es del sistema** (D-BBW-22): una sola regla
  `:focus-visible` en `base/document.css` sobre `--bbf-focus-*`; ningún componente escribe `outline`. Todo texto llega por props desde `content/`. La página recorre
  `page.sections` con el mapa `SECTION_RENDERERS` (`src/components/sections/index.tsx`): un tipo sin renderizador rompe el typecheck y el build, nunca se omite en silencio.
- **Sistemas dinámicos (fase 6h, D-BBW-28/29/30/31, `docs/system/BEHAVIOR.md`):** una pieza dinámica de cliente solo mueve; el HTML servido trae su reposo y el texto
  literal. Sus constantes de algoritmo viven en `src/behavior/<sistema>.ts` (no son tokens; el módulo LEE los tokens por `getPropertyValue`, nunca los repite)
  y el componente cliente solo cablea. Peso por letra con `font-weight`, nunca `font-variation-settings`. Con movimiento reducido y pestaña oculta el bucle se
  detiene y queda el reposo (se lee por el rol `--bbf-motion-*-play-state`). Lo que un sistema sustituye se retira en el mismo commit.
- Prefijo de artefactos `BBW-`. Despachos y outputs viven en el hub: `repos/brandbrain-web/`.

## Cierre de turno
`/bbf-ops:cerrar-turno` (si no resuelve en sesión, HAL-BBFWEB-PLUGIN-02: seguir su SKILL.md a mano) →
ESTADO_CANONICO v+1 + BITACORA + push del hub. Commit de producto en rama; PR = Zavala.

## Plugin bbf-ops
Marketplace `brand-brain-foundry/bbf-command-hub` (directorio absoluto) + `bbf-ops` habilitado en
`.claude/settings.json`. Hooks del ciclo con ruta absoluta al hub (L-06): `secret-guard` (PreToolUse),
`leak-scan` · `notify` · `handoff-state` (Stop). **`hub-autopush` prohibido en repos de producto.**
