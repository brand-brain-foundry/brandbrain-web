# brandbrain-web

Web oficial de **Brand Brain Foundry**. Next.js App Router con `output: 'export'`: estructura de rutas por locale
(ES por defecto, EN previsto), **lanzamiento solo en español** (D-BBW-15). Sin CMS, sin base de datos, sin Tailwind.

- Contrato de hosting (puerto intercambiable): [`docs/system/DEPLOY_CONTRACT.md`](docs/system/DEPLOY_CONTRACT.md)
- Registro de puertos (actores externos → adaptador + alternativa): [`docs/system/PORTS.md`](docs/system/PORTS.md)
- Tokens del sistema (madres + derivación por fórmula): `src/styles/tokens/` · fuentes: `src/styles/fonts/` · pesos por familia: [`docs/system/TYPOGRAPHY_WEIGHTS.md`](docs/system/TYPOGRAPHY_WEIGHTS.md) · excepciones registradas: [`docs/system/DESIGN_EXCEPTIONS.md`](docs/system/DESIGN_EXCEPTIONS.md)
- Contenido (fuera de los componentes, por locale publicado; cada texto con su llave por rol, marcadores `[[PENDIENTE: …]]`): `content/` → puerto `src/content/` · modelo: [`docs/system/CONTENT_MODEL.md`](docs/system/CONTENT_MODEL.md)
- Sistema de diseño (copia por contrato desde `bbf-web`): [`docs/design-system/`](docs/design-system/)
- Única fuente de verdad de dominio/locales/contacto: `src/config/site.ts`

```bash
pnpm install
pnpm check   # typecheck + lint + guardias de color, tipografía, sistema tipográfico propio (pesos, escala, excepciones, corte) y modelo de contenido
pnpm build   # → out/ (estático)
```

Operación (despachos, estado, bitácora): hub `bbf-command-hub` → `repos/brandbrain-web/`.
