<!--
  COPIA POR CONTRATO (D-BBW-06) — NO es referencia viva.
  Origen:   bbf-web:src/components/templates/CLAUDE.md
  Commit:   bbf-web@e453303 (origin/main al 2026-09-15)
  Contrato: bbf-command-hub:shared/CONTRATOS_ENTRE_REPOS.md → CONTRATO-04
  Regla:    esta copia se actualiza SOLO re-pinneando a un commit nuevo y registrándolo en el
            contrato. Prohibido leer paths vivos de bbf-web desde este repo.
  Contexto: las rutas internas citadas (src/styles/..., src/components/..., governance-model.md)
            son las del repo de ORIGEN; en brandbrain-web se materializan cuando exista el primer token.
-->

# CLAUDE.md — src/components/templates/ · EJE B (Atomic Design)

**Templates canon BBF/Sivar Brains — parte del Eje B de composición de UI**

> Vocabulario unificado con `src/components/CLAUDE.md` (léelo primero — este
> archivo es el detalle del tier Template, no una taxonomía paralela).
> Decisiones: D-88, D-89, D-106, D-SBWEB-TOKENS.

---

## Qué es un Template BBF

Un template es un layout que orquesta contenido dinámico **sin datos hardcoded
en el componente** — recibe los datos reales por props. En BBF, el caso real
implementado (`CornerstoneTemplate.tsx`) orquesta `blocks[]` de Payload
(`contentItems`, ver `blocks/` en `src/components/CLAUDE.md`), no Sections.

```
Eje B (Atomic Design BBF):
Atom → Molecule → Organism → Section → Template → Page
                              (contenido    (orquesta    (template/sections
                               de página)    blocks[])    + datos reales)
```

**Diferencia clave (vocabulario unificado — cierra la discrepancia de
`HAL-SBWEB-TAXONOMY-DOC-DRIFT-01` entre este documento y `components/CLAUDE.md`):**
- **Section** = bloque de contenido de página, compound pattern, consumido
  directo por `page.tsx` con datos reales (HeroSection, CapabilitiesSection...)
- **Template** = orquestador de `blocks[]` dinámicos (array de Payload), SIN
  Sections dentro — son dos rutas de ensamblaje ALTERNATIVAS, no anidadas (ver
  nota de vocabulario en `components/CLAUDE.md` para la evidencia de código)
- **Page** = `page.tsx`, compone Sections a mano O pasa un `ContentItem` a un
  Template — nunca ambos a la vez hoy

**Corrección de esta versión:** el ejemplo anterior (`hero`/`main`/`cta` como
slots `ReactNode` recibiendo Sections) era hipotético y nunca se implementó así
— `CornerstoneTemplate.tsx`, la única implementación real, no importa ningún
`sections/*`. Se corrige contra el código.

---

## Cuándo usar Templates

Templates son necesarios cuando:
- El contenido viene de un array dinámico de Payload (`contentItems.blocks`,
  `kind: cornerstone-page`) y no se conoce la composición exacta en build-time
- Múltiples pages comparten el mismo layout de blocks (ej: todas las
  cornerstone pages: `/cerebro-marca`, `/como-trabajamos`, `/casos`)

**NO usar templates si:**
- Una page tiene composición fija y conocida — usar Sections directo en
  `page.tsx` (ruta Section, ver `components/CLAUDE.md`; ejemplo real: home, contacto)
- Solo hay una página de ese tipo con contenido hardcoded

---

## Folder estructura canon

```
components/templates/
├── {Name}Template/
│   ├── {Name}Template.tsx     Template (Server Component, thin wrapper)
│   └── index.ts               Barrel export
└── index.ts                   Barrel export templates
```

> Templates NO tienen `.variants.ts` (son thin wrappers, no definen appearance).
> Templates NO tienen `CLAUDE.md` por folder (este archivo cubre todos).

---

## Pattern canon (real — `CornerstoneTemplate.tsx`)

```tsx
/**
 * BBF Design System — {Name}Template
 *
 * Orquesta blocks[] dinámicos de un ContentItem de Payload.
 * Decisiones: D-106
 */

import type { ContentItem } from '@/payload/payload-types';
import { Container } from '@/components/atoms/Container';
import { Heading } from '@/components/atoms/Heading';
import { Text } from '@/components/atoms/Text';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';

type {Name}TemplateProps = {
  contentItem: ContentItem;
  locale: 'es' | 'en';
};

export function {Name}Template({ contentItem }: {Name}TemplateProps) {
  const blocks = contentItem.blocks ?? [];
  return (
    <article data-component="bbf-{name}-template">
      <header>
        <Container size="prose">
          <Heading level="display-1" as="h1">{contentItem.title}</Heading>
        </Container>
      </header>
      <Container size="prose">
        {blocks.map((block, idx) => (
          <BlockRenderer key={idx} block={block} />
        ))}
      </Container>
    </article>
  );
}
```

**Templates son:**
- Server Components (no interactividad propia)
- Thin wrappers — NUNCA lógica de negocio
- Reciben datos reales por props (`ContentItem`), no slots `ReactNode` fijos
- Orquestan `blocks[]` vía `BlockRenderer`, NO Sections (ver nota de vocabulario arriba)
- Sin tokens directos (spacing va en cada block/atom que consumen)

---

## Relación con Pages (real)

```tsx
// app/(frontend)/[locale]/cerebro-marca/page.tsx (real, resumido)
import { fetchCornerstoneBySlug } from '@/lib/payload/fetchContent';
import { CornerstoneTemplate } from '@/components/templates/CornerstoneTemplate';

export default async function Page({ params }) {
  const { locale } = await params;
  const item = await fetchCornerstoneBySlug('cerebro-marca', locale);
  if (!item || !item.blocks?.length) notFound();
  return <CornerstoneTemplate contentItem={item} locale={locale} />;
}
```

---

## Estado actual

`CornerstoneTemplate.tsx` está **implementado y en uso real** — consumido por
`/cerebro-marca`, `/como-trabajamos`, `/casos` (ver `ESTADO_CANONICO.md` §2:
estas 3 rutas ES devuelven 404 hoy porque `contentItems` está vacío en
producción, no porque el Template no exista — el gap es de contenido/seed, no
de código). Corrige la afirmación anterior de este documento ("NO hay templates
implementados aún"), stale desde antes de M5-ADMIN-1.

Templates futuros se crean cuando aparezca otro `kind` de `contentItems` que
necesite un layout de blocks distinto (ej. si `Case`/`Blog` dejan de compartir
schema con cornerstone-page — decisión pendiente de Zavala, ver §7 ESTADO_CANONICO).

---

## Skill relacionado

`bbf-skills/create-template/SKILL.md` — proceso canon para crear nuevos templates.

---

## Decisiones aplicables

- **D-88** Organisms + Sections folder canon (tier hermano, no anidado — ver
  nota de vocabulario arriba)
- **D-89** Section compound API (usado en la ruta Section, no en Templates)
- **D-106** Templates canon BBF
- **D-SBWEB-TOKENS** (este despacho) — vocabulario unificado con `components/CLAUDE.md`

---

## Lecciones aplicables

- **L-96** Cleanups técnicos antes de foundations nuevas
- **L-98** Foundations cuando ≥3 casos justifican
