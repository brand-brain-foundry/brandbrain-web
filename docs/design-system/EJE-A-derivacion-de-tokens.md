<!--
  COPIA POR CONTRATO (D-BBW-06) — NO es referencia viva.
  Origen:   bbf-web:src/styles/CLAUDE.md
  Commit:   bbf-web@e453303 (origin/main al 2026-09-15)
  Contrato: bbf-command-hub:shared/CONTRATOS_ENTRE_REPOS.md → CONTRATO-04
  Regla:    esta copia se actualiza SOLO re-pinneando a un commit nuevo y registrándolo en el
            contrato. Prohibido leer paths vivos de bbf-web desde este repo.
  Contexto: las rutas internas citadas (src/styles/..., src/components/..., governance-model.md)
            son las del repo de ORIGEN; en brandbrain-web se materializan cuando exista el primer token.
-->

# CLAUDE.md — src/styles/ · EJE A — Derivación de tokens

**Token system canon BBF/Sivar Brains — D-SBWEB-TOKENS**

> Eje A de 2 ejes ORTOGONALES que gobiernan el design system (ver
> `.claude/skills/bbf-design-governance-audit/reference/governance-model.md` para
> el mapa de ambos). Este documento cubre SOLO la derivación de valores (tokens).
> La composición de UI (atom/molecule/organism/section/template) es el Eje B —
> ver `src/components/CLAUDE.md`. No mezcles los dos vocabularios.
>
> Lee este archivo antes de modificar `styles/`.

---

## Referente de industria (Eje A)

**DTCG (Design Tokens Community Group, spec 2025.10)** + implementaciones de
referencia que siguen la misma cadena de 3-4 tiers: Material Design 3, Adobe
Spectrum, Salesforce Lightning Design System (SLDS), Shopify Polaris.

Cadena canon:

```
Primitivo (valor bruto, sin contexto)
   ↓
Semántico / mother (la intención — QUÉ representa, no de qué color es)
   ↓
Variante (graduación de la mother — tamaño/tono/estado; solo si la intención lo exige)
   ↓
Componente (token específico de un componente — uso interno, no se exporta)
```

Nombres **por rol**, nunca por valor: `--bbf-text-on-light` no `--bbf-color-black`.
El consumidor pide el rol; el sistema resuelve el valor primitivo detrás.

**Se DESCARTA el nivel "Brand Preset"** como peldaño de esta cadena — no tiene
precedente en ningún referente de industria citado arriba. Es DATO de marca
(gobernado por el global `BrandSystem` + los primitivos que selecciona), no un
nivel de derivación CSS. Su destino de exposición/consumo lo resuelve
`D-SBWEB-BRAND` (frente aparte, ya firmada 2026-08-09, tercera-vía).

---

## Estructura real (verificada @ `6bca46c`)

```
styles/
├── base/
│   ├── reset.css
│   ├── focus.css
│   └── scrollbar.css
├── tokens/
│   ├── primitives/            Tier 1 — 11 archivos
│   │   ├── colors.css
│   │   ├── colors-warm.css       D-MIG-01: ramp warm coexistente
│   │   ├── colors-dark.css       D-CASO-3: ramp dark coexistente
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   ├── motion.css            @deprecated D-DS-03 — SSOT real: motion/ (ver abajo)
│   │   ├── shadows.css
│   │   ├── breakpoints.css
│   │   ├── radius.css
│   │   ├── z-index.css
│   │   └── line.css              D-DS-14: madre→variante line thickness
│   ├── semantic/               Tier 2 — 13 archivos
│   │   ├── colors.css
│   │   ├── colors-warm.css
│   │   ├── colors-dark.css
│   │   ├── surface-roles.css     D-DS-12: cascade global [data-surface]
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   ├── motion.css
│   │   ├── gradients.css         D-DS-13: semantic gradient aliases
│   │   ├── shadows.css
│   │   ├── feedback.css
│   │   ├── lines.css             D-DS-14: semantic line aliases + focus-ring
│   │   ├── line-roles.css        D-LINE-SYSTEM: line color intention axis
│   │   └── radius.css            D-RADIUS-01: semantic radius roles
│   ├── components/             Tier 3 — 23 archivos (uno por componente/sección
│   │   │                       con tokens propios; lista completa: button, header,
│   │   │                       hero, hero-section, hero-media-frame, home-hero,
│   │   │                       logo, section-header, capabilities(+wa/app-screen/
│   │   │                       wa-agenda/app-integraciones/aprendizaje), lissajous,
│   │   │                       case-section, timeline, quote-block, porque-section,
│   │   │                       metodo-section, cierre-section, contact-page, prose)
│   │   └── (ver árbol real con `find src/styles/tokens/components -type f`)
│   └── motion/                 Subcarpeta del Eje A (NO tier paralelo) — 5 archivos
│       ├── index.css              orquestador: duration → easing → lissajous → reduced
│       ├── duration.css           D-MOTION-SCALE: madre --bbf-motion-duration-base
│       ├── easing.css             curvas canon + BBF signature
│       ├── lissajous.css          tokens motion-context del módulo Lissajous
│       └── reduced.css            override prefers-reduced-motion (debe cargar último)
└── utilities/
    ├── animations.css
    ├── motion-patterns.css
    ├── gradient-animations.css
    ├── containers.css
    ├── section-paddings.css
    ├── text-utilities.css
    ├── section-wrap.css
    └── view-transitions.css
```

**Corrección de inventario (cierra parte de `HAL-SBWEB-TAXONOMY-DOC-DRIFT-01`):**
el inventario anterior de este archivo listaba 8/5/5 archivos y citaba
`locale-switcher.css`, que **no existe** en el árbol real. Los números reales
verificados por `find` son 11/13/23 (+5 en `motion/`).

---

## `motion/` — por qué vive como subcarpeta, no como tier paralelo

`motion/` es la SSOT real de duration/easing desde D-DS-03 (2026-06-12) —
`primitives/motion.css` quedó `@deprecated` ese mismo día pero sigue importado
(0 consumers, ver `HAL-SBWEB-PRIMITIVE-DEPRECATED-LIVE-01`, deuda de eliminación
diferida y NO tocada por este despacho).

`motion/` mezcla contenido de más de un tier bajo un mismo folder:
- `duration.css` + `easing.css` → **Tier 1** (valores brutos: madre
  `--bbf-motion-duration-base` + `calc()`).
- `lissajous.css` → **Tier 3** (consume `var(--bbf-surface-ink, ...)` semánticos
  con fallback — token component-specific, no primitivo).
- `reduced.css` → un **override de accesibilidad** (`@media prefers-reduced-motion`)
  que debe cargar DESPUÉS de `duration.css` en el mismo `@import` (mismo nombre de
  variable, misma especificidad → gana orden de fuente) para que el override
  resuelva. `index.css` ya lo garantiza internamente (duration → easing →
  lissajous → reduced).

**Por qué NO se movió el import en este despacho (nombrado como deuda, no
ejecutado — HAL-SBWEB-PRIMITIVE-DEPRECATED-LIVE-01 ya registra esta nota):**
mover `motion/index.css` a su tier correcto exige **separar el archivo**
(duration/easing → `primitives/`, lissajous → `components/`, reduced se queda
donde pueda seguir las reglas de orden de fuente) — eso es un refactor de código
real, no un cambio de import de 1 línea, y el criterio de este despacho es
documentación, no construcción (§0.3). La resolución de `var()` en CSS no
depende del orden de `@import` entre archivos que declaran *nombres distintos*
de custom property (solo importa cuando el MISMO nombre se redeclara) — por eso
hoy no hay bug activo pese al import fuera de los 6 bloques documentados en
`globals.css`. Se nombra como deuda de un EXEC futuro de consolidación de tokens
motion, no de este despacho de estructura.

---

## Tiers canon

### Tier 1: Primitives

**Función:** valores brutos sin contexto. **Ejemplo:** `--bbf-color-red-500`.
**No usar directamente** en componentes — usar semantic.

### Tier 2: Semantic

**Función:** dar significado (intención) a primitives. **Ejemplo:**
`--bbf-text-on-light: var(--bbf-color-black-900)`. **Usar en componentes** —
preferred entry point.

### Tier 3: Components

**Función:** tokens específicos de un componente, uso solo interno.
**Ejemplo:** `--bbf-logo-rotation-duration: 40s`.

---

## Sistema de tokens

### Color (OKLCH — D-69, D-COLOR-SPACE)

- Primitives: rotaciones hue + saturación, 4 familias canon (sand/black/blue/green)
- Semantic: `text-on-*`, `surface-*`, `accent-*`
- Surface-based: tokens cambian según contexto de superficie (`[data-surface]`)

### Matriz semántica de color — 3 niveles (D-SBWEB-SEMANTIC-MATRIX)

**`surface` NO es un rol de color — es un CONTEXTO/MODO transversal que coordina un SET completo de
roles.** Firmado 2026-09-06 tras corrección de Zavala en revisión: un borrador previo de la matriz
mezclaba `surface` como si fuera un concepto de la categoría `color`, junto a `text`/`border`/`accent`.
El código real (`semantic/surface-roles.css`, D-DS-12) ya implementaba la distinción correcta — la
matriz solo la nombraba mal.

1. **Categoría `color` → roles de aplicación** (una propiedad CSS cada uno): `bg` (fondo — el token real
   sigue siendo `--bbf-surface-{sand|white|black|red}`, el prefijo histórico se preserva por A-01; `bg`
   es el nombre del CONCEPTO en la matriz, no un rename del token), `text`, `border`, `accent`, `focus`
   (`--bbf-color-focus-ring`), `feedback` (`semantic/feedback.css`: success/warning/error/info).

2. **Eje `surface` → contexto/modo transversal** (NO un rol de color), activado vía
   `[data-surface="..."]` en `semantic/surface-roles.css`. Cada valor activa el SET COMPLETO de roles
   `on-surface-*` coordinados para ese fondo — equivalente conceptual a "modo" (light/dark) en Material
   3/Spectrum. Valores reales verificados @ `b422e0e`:
   - **Consumidos hoy en componentes** (`grep data-surface= src/components/**`): `sand`, `warm`, `dark`,
     `sand-elevated`.
   - **Definido en `surface-roles.css`, sin consumidor real todavía:** `white` (hereda tabla `sand`).
   - **NO existe `data-surface="black"`** — `black` es un TOKEN de la categoría `color`/concepto `bg`
     (`--bbf-surface-black`), no un valor del eje `surface`. No confundir los dos niveles.

3. **Concepto `on-surface-{rol}` → el puente** — lo que los componentes consumen, agnóstico del contexto
   activo. Ejemplo real (`surface-roles.css`):
   ```css
   [data-surface='sand'] { --bbf-on-surface-title: var(--bbf-text-on-sand); }
   [data-surface='dark'] { --bbf-on-surface-title: var(--bbf-text-on-dark-surface); }
   ```
   Un componente pide `var(--bbf-on-surface-title)` sin saber si está sobre `sand` o `dark` — la cascada
   `[data-surface]` resuelve. 17+ roles por surface (title/body/muted/faint/bright/link/border/bg/
   hover-bg/input-bg/focus-ring/divider/icon...).

### Typography

- Family: Inter (display) + Mulish (body) — D-BBF-WEB-68/68b
- **Scale: Golden Ratio φ=1.618 (desktop), minor third/perfect fourth (1.333)
  para tamaños menores y mobile — D-BBF-KB-105, D-TYPO-RATIO-FIX.**
  Corrección de este despacho: la versión anterior de este documento decía
  *"Major Third 1.25"*, contradiciendo `primitives/typography.css` (fuente de
  verdad, ratio verificado por cadena φ³/φ²/φ¹/φ⁰ en el archivo). Se corrige
  contra el código, no al revés (cierra la 2ª discrepancia de
  `HAL-SBWEB-TAXONOMY-DOC-DRIFT-01`).
- Tokens: display-1/2, h1-h6, body-lg/md/sm, caption, micro, xs (12px, gap de
  escala nombrado D-DS-04b — NO forzar a body-sm)
- Pattern Tailwind v4: `[font-size:var(--bbf-text-base)]` (D-92)

### Spacing

- Madre `--bbf-space-base=4px` + `calc(×N)` 24 pasos (D-SPACING-SCALE, FASE 4.C.2-B)
- Consumers Tailwind (`px-*`/`gap-*`) sin migrar = deuda conocida, no bloqueante

### Shadows (D-93)

- OKLCH alpha alineado D-69 · 5 niveles (xs/sm/md/lg/xl) · 5 aliases

### Motion (D-98, D-MOTION-SCALE)

- Durations: madre `--bbf-motion-duration-base=240ms` + `calc(×1.5)` medium/slow;
  instant/fast anclados (piso interactivo snappy, no derivable por ratio)
- Easings: 4 estándar + 4 BBF signature (entrance, exit, hover, bounce)
- Delays: stagger madre `--bbf-stagger-base=75ms` + `calc(×N)`
- Aliases: transition-default/hover/color/fade/entrance

### Line weight (D-DS-14)

- Madre `--bbf-line-base=1px` + `calc()` → sm/md/lg/xl (1/1.5/2/4px)
- Corrección: `governance-model.md` reportaba esta escala como "madre TBD" —
  stale, ya deriva desde 2026-06-13.

---

## Reglas canon

1. **Nunca hardcodear values** — siempre tokens canon (guardia `check-color-tokens.ts` en pre-commit)
2. **Tier hierarchy** — primitives → semantic → components, nunca al revés
3. **OKLCH para colors** (D-69, D-COLOR-SPACE)
4. **Tailwind v4 pattern** — arbitrary property explícita (D-92)
5. **prefers-reduced-motion** siempre respetar (`utilities/animations.css` + `motion/reduced.css`)
6. **Animate solo** transform + opacity (no layout thrash)
7. **will-change sparingly** + remove post-animation
8. **Todo por fórmula desde el primitivo** — madre + `calc()`. Un valor nombrado
   sin fórmula es deuda (D-SCALE-GOVERNANCE, ver governance-model.md); un literal
   es hardcode inmediato.

---

## Decisiones aplicables

- **D-69** OKLCH paleta canon · **D-COLOR-SPACE** fórmula de rampa (forma B pura)
- **D-72..74** Typography (histórica) · **D-BBF-KB-105** golden ratio φ=1.618 vigente
- **D-92** Tailwind v4 arbitrary properties · **D-93** Shadow tokens
- **D-98** Motion system · **D-MOTION-SCALE** madre reveal 240ms
- **D-SPACING-SCALE** madre 4px · **D-DS-14** line weight madre 1px
- **D-DS-03** SSOT motion → `motion/` (deprecated `primitives/motion.css`)
- **D-SBWEB-TOKENS** — separación en 2 ejes, Eje A = este documento
- **D-SBWEB-SEMANTIC-MATRIX** (2026-09-06) — matriz de niveles del tier semántico: categoría `color`
  =roles de aplicación / eje `surface`=contexto / `on-surface`=puente (ver sección Color arriba)

---

## Cómo agregar nuevos tokens

1. Identificar tier correcto (primitives/semantic/components) — nunca saltar un tier
2. Naming canon: `--bbf-{category}-{name}-{modifier}`, agnóstico por ROL no por valor
3. Subordinación: semantic referencia primitive vía `var()`; toda escala nueva
   necesita una madre + fórmula `calc()` (D-SCALE-GOVERNANCE) — no un valor suelto
4. Si afecta múltiples componentes, va en semantic (no components)
5. Actualizar `src/app/globals.css` con el `@import` correspondiente, en el tier
   correcto (orden crítico documentado ahí — no reordenar sin firma Strategic)
6. Golden rule antes de crear: ALIGN (¿existe una mother?) → REPLACE (¿un token
   ya cubre esto?) → CREATE (último recurso, registrado, nunca excepción suelta)
