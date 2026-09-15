<!--
  COPIA POR CONTRATO (D-BBW-06) — NO es referencia viva.
  Origen:   bbf-web:src/components/CLAUDE.md
  Commit:   bbf-web@e453303 (origin/main al 2026-09-15)
  Contrato: bbf-command-hub:shared/CONTRATOS_ENTRE_REPOS.md → CONTRATO-04
  Regla:    esta copia se actualiza SOLO re-pinneando a un commit nuevo y registrándolo en el
            contrato. Prohibido leer paths vivos de bbf-web desde este repo.
  Contexto: las rutas internas citadas (src/styles/..., src/components/..., governance-model.md)
            son las del repo de ORIGEN; en brandbrain-web se materializan cuando exista el primer token.
-->

# CLAUDE.md — src/components/ · EJE B — Composición de UI

**Atomic Design canon BBF/Sivar Brains — D-SBWEB-TOKENS**

> Eje B de 2 ejes ORTOGONALES (ver `governance-model.md` para el mapa completo).
> Este documento cubre SOLO composición de UI (qué combina qué). La derivación
> de valores/tokens es el Eje A — ver `src/styles/CLAUDE.md`. No mezcles los dos
> vocabularios: un componente no "deriva" un token, lo CONSUME.
>
> Lee antes de crear/modificar componentes.

---

## Referente de industria (Eje B)

**Atomic Design, Brad Frost (2016, vigente 2026 como estándar de facto).**
Cadena canon: `Atom → Molecule → Organism → Template → Page`.

Mapeo BBF de esa cadena, verificado contra el árbol real (@`6bca46c`):

```
Atom       → src/components/atoms/       pieza UI mínima, consume tokens+intents
Molecule   → src/components/molecules/   atoms combinados, sin lógica de negocio propia
Organism   → src/components/organisms/   composición mayor con estructura/lógica propia
Section    → src/components/sections/    bloque de contenido de página (ver nota abajo)
Template   → src/components/templates/   layout que orquesta bloques SIN datos reales
Page       → app/(frontend)/.../page.tsx template/sections + datos reales (Payload)
```

**Nota de vocabulario (resuelve la discrepancia de `HAL-SBWEB-TAXONOMY-DOC-DRIFT-01`):**
Frost no nombra "Section" como tier propio — lo que aquí se llama Section
equivale a un **Organism de contenido de página** (Hero, Capabilities, Cierre)
en su modelo, mientras que lo que aquí se llama Organism (Header, Footer) es
**chrome persistente cross-página**. BBF conserva el nombre "Section" porque ya
tiene 7 sections reales en el árbol y renombrarlas no aporta nada (A-01) — se
documenta la equivalencia, no se fuerza el vocabulario de Frost al 100%.

**Section y Template NO están anidados en el código real** (`Section ⊄ Template`).
Verificado en `app/(frontend)/[locale]/`: son dos rutas de ensamblaje FINAL
alternativas, ambas consumidas directo por `page.tsx`, nunca una dentro de otra:

- **Ruta Section** (home, contacto): `page.tsx` compone Sections a mano
  directamente con datos de Payload Globals. Usa Organisms de contenido
  compound (`<HeroSection><HeroSection.Content>...`).
- **Ruta Template** (cerebro-marca, como-trabajamos, casos): `page.tsx` pasa un
  `ContentItem` (Payload `contentItems`, kind `cornerstone-page`) a un Template,
  que renderiza `blocks[]` vía `BlockRenderer` (ver `blocks/` abajo) — no
  compone Sections.

La doc anterior de `templates/CLAUDE.md` documentaba un ejemplo hipotético con
Sections DENTRO de un Template (`hero`/`main`/`cta` como slots) que nunca se
implementó así en código real — `CornerstoneTemplate.tsx` (única implementación
real hoy) no importa ningún `sections/*`. Se corrige contra el código (regla:
la fuente de verdad es el código, no el doc).

---

## Estructura real (verificada @ `6bca46c`)

```
components/
├── atoms/                     18 piezas
│   ├── Badge/ BlobBackground/(+Boundary) BrandGradientBackground/(+Boundary,+Lazy)
│   ├── BrandLogo/(+Animator) Button/ ChipGroup/ Container/ Heading/ Icon/(+registry)
│   ├── Link/ Lissajous/ MenuIcon/ NavLink/ PulpoPixel/(+Loader) Reveal/ SkipLink/ Text/
│   └── index.ts               Barrel export
├── molecules/                 20 composiciones
│   ├── AppScreen/ Aprendizaje/ BrandLogoLink/ CapabilityCard/ CapabilityScene/
│   │   ContactForm/ FormField/ HeroMediaFrame/ HeroTicker/ HeroVideo/ HubDiagram/
│   │   Integraciones/ LanguageSwitcher/ MegaMenuPanel/ MobileMenu/ NewsletterBox/
│   │   QuoteBlock/ SectionHeader/ StepsBlock/ Timeline/(+Scroller) Turnstile/
│   │   WAAgenda/(+Sequence) WAChat/(+Sequence)
│   └── index.ts
├── organisms/                 2 — chrome persistente cross-página (D-88 corregido)
│   ├── Header/ (+HeaderDesktopNav, +HeaderScrollWrapper)
│   ├── Footer/
│   └── index.ts
├── sections/                  7 — bloques de contenido de página (compound pattern)
│   ├── HeroSection/ CapabilitiesSection/ CaseSection/ CierreSection/ ContactSection/
│   │   MetodoSection/(+ServiceCard) PorqueSection/(+.Comparison)
│   └── index.ts
├── templates/                 1 implementado (CornerstoneTemplate) — Tier orquestador
│   ├── CornerstoneTemplate.tsx
│   └── CLAUDE.md              Doc tier — ver ese archivo para el pattern completo
├── blocks/                    15 — renderers de Payload Lexical blocks (eje aparte,
│   │                          ver nota abajo): BlockRenderer, Callout, Code,
│   │                          ComparisonTable, Cta, CustomHtml, Divider, Embed,
│   │                          Gallery, Image, Quote, RichTextRenderer, Stat,
│   │                          TableOfContents, Video
└── seo/                        2 — utilidad cross-cutting: JsonLd, StructuredData
```

**Corrección de inventario:** la doc anterior decía *"Sections (D-88): NO
organisms/"* — stale, `organisms/` existe con código real desde antes de este
despacho (Header/Footer, no legacy). Se corrige el `D-88` referenciado abajo.

### `blocks/` y `seo/` — no son tiers de este eje

- **`blocks/`** pertenece al puente Payload-schema → UI (regla
  `10-payload-collections.md`: "cada block es un schema + un componente que lo
  renderiza"). Cada archivo envuelve atoms/molecules para renderizar UN
  `blockType` del array `contentItems.blocks`. Es el consumidor de Templates
  (ver `CornerstoneTemplate.tsx`), no un tier de Atomic Design en sí mismo.
- **`seo/`** son utilidades transversales (JSON-LD, structured data) que se
  inyectan en cualquier nivel (layout, page, section) — no componen UI visible,
  no tienen tier.

---

## Pattern canon por nivel

### Atoms

**Folder estructura canon:**
```
atoms/{Name}/
├── {Name}.tsx                 Componente Server (o Client si necesita interactividad)
├── {Name}.variants.ts         CVA variants
└── index.ts                   Barrel export
```

**API prop canon (D-95 RATIFICADA):**
- Atoms tienen prop **semántica** (intent, level, variant) — NO prop genérica
  ni genéricos numéricos: `<Button intent="primary">`, `<Heading level="display-lg">`

**CVA pattern:**
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

export const atomVariants = cva('base-classes', {
  variants: { intent: { /* ... */ } },
  compoundVariants: [/* override cuando variant cambia default */],
  defaultVariants: { /* ... */ },
});
export type AtomVariants = VariantProps<typeof atomVariants>;
```

### Molecules

**Patterns canon:**
- **Monolítica (D-85):** componente único, todas las props en la API directa
  (pocas props + uso interno simple, ej. LanguageSwitcher)
- **Compound (D-86):** sub-components nombrados `Molecule.SubComponent`
  (composition flexible, ej. HeroVideo)

### Organisms

**Pattern canon (D-88 corregido — chrome persistente):**
- Folder: `organisms/{Name}/`
- Composición mayor con estructura/lógica propia; vive en el layout root, no en
  el body de cada página (ej. `Header`, `Footer`)
- Combina molecules + atoms; puede tener sub-archivos (`HeaderDesktopNav.tsx`,
  `HeaderScrollWrapper.tsx`) cuando la lógica de un organism crece

### Sections

**Pattern canon (D-88, D-89):**
- Folder: `sections/{Name}/`
- Compound pattern preferido: `<Section surface="..."><Section.Content>...</Section.Content></Section>`
- Bloque de contenido de página, consumido directo por `page.tsx` con datos reales

### Templates (D-106)

Ver `templates/CLAUDE.md` para el pattern completo. Resumen: thin wrapper Server
Component, sin `.variants.ts`, orquesta `blocks[]` (no Sections — ver nota de
vocabulario arriba) para páginas dirigidas por `contentItems` cornerstone.

---

## Atomic composition canon

```tsx
// Atoms
<Heading level="display-lg">...</Heading>
<Text variant="body-md">...</Text>
<Button intent="primary" href="...">...</Button>

// Atom Server + Client split (D-99)
<BrandLogoAnimator>
  <BrandLogo variant="stamp" animated />
</BrandLogoAnimator>

// Molecule compound
<HeroVideo>
  <HeroVideo.Source ... />
</HeroVideo>

// Organism (chrome persistente, en layout root)
<Header />
{children}
<Footer />

// Section compound (en page.tsx, con datos reales)
<HeroSection>
  <HeroSection.Content align="center">
    <Heading ... /><Text ... /><Button ... />
  </HeroSection.Content>
</HeroSection>

// Template (en page.tsx, con ContentItem de Payload)
<CornerstoneTemplate contentItem={contentItem} locale={locale} />
```

---

## Server vs Client

### Default: Server Component
Sin `'use client'`, sin state interactivo. Ejemplos: Heading, Text, BrandLogo, Button, Icon.

### Client cuando necesario
`'use client'` al top. State, events, browser APIs, hooks. Ejemplos:
BrandLogoAnimator (WAAPI), LanguageSwitcher (useRouter).

### Server + Client split canon (D-99)
```
Server Component → carga estático (SVG, markup, tokens)
Client Component → wrappea para interactividad (WAAPI, router, state)
Pattern: <ClientWrapper><ServerComponent /></ClientWrapper>
```

### Error Boundary — componentes cliente con API de navegador riesgosa

Ver `.claude/rules/60-error-boundary-policy.md` (regla 60). Todo componente
cliente que toca WebGL/canvas/media nace con: Error Boundary + fallback por
token + try/catch async. Molde ya construido: `BlobBackgroundBoundary.tsx`,
`BrandGradientBackgroundBoundary.tsx`.

---

## Tokens canon en componentes

```tsx
// ✅ CANON — arbitrary property Tailwind v4 (D-92)
className="[font-size:var(--bbf-text-display-lg)]"

// ✅ CANON — CSSProperties para tokens dinámicos (D-96)
style={{ '--bbf-custom-token': value } as CSSProperties}

// ❌ Hardcoded
style={{ fontSize: '3rem', color: '#1a1a1a' }}
```

Un componente NUNCA deriva su propio valor — eso es responsabilidad del Eje A.
Un componente CONSUME un token/intent ya resuelto (ver `src/styles/CLAUDE.md`).

---

## data-component AI-readable (D-82)

```tsx
<div data-component="bbf-{component-name}" ...>
```

---

## Surface canon (D-94 + D-110)

```
auto  dark  sand  glass  transparent
```

Pattern canon: propagación vía `data-surface` attribute en HTML. Ver
`lib/CLAUDE.md` §Surface canon.

---

## Decisiones aplicables

- **D-82** AI-readable canon · **D-85/D-86** Molecules mono/compound
- **D-88** Organisms + Sections folder canon (corregido: organisms/ SÍ existe)
- **D-89** Section compound API · **D-92** Tailwind v4 arbitrary properties
- **D-95** Atoms prop semántica · **D-96** CSSProperties directo
- **D-99** Server + Client split · **D-106** Templates canon
- **D-107** Cross-surface fuente única · **D-108** Icon registry
- **D-110** Surface canon 5 valores · **L-34/regla 60** Error Boundary policy
- **D-SBWEB-TOKENS** (este despacho) — separación en 2 ejes, Eje B = este documento

---

## Lecciones aplicables

- **L-91** Migrar inline-style a atom: verificar que variant mapea al token exacto
- **L-92** Tailwind v4 `text-[var()]` sin hint = color (usar arbitrary)
- **L-93** Variants semánticos NO tamaño genérico
- **L-98** Crear foundations cuando ≥3 casos justifican (no premature abstraction)

---

## Cómo agregar nuevos componentes

1. Identificar nivel: atom / molecule / organism / section (¿chrome persistente
   o contenido de página?) / template (¿orquesta blocks[] dinámicos?)
2. Folder canon: `{nivel}/{Name}/`
3. Archivos: `{Name}.tsx` + `{Name}.variants.ts` (no aplica a templates) + `index.ts`
4. `data-component="bbf-{name}"` attribute (D-82)
5. Tokens canon — NUNCA valores hardcoded (consume Eje A, no deriva)
6. Surface-aware si el componente cambia según contexto visual
7. Si toca una API de navegador riesgosa (WebGL/canvas/media): regla 60 completa
8. Export barrel en `{nivel}/index.ts`
9. Si toca >3 archivos no relacionados, escalar a Strategic antes de ejecutar
