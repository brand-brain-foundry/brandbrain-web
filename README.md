# brandbrain-web

Web oficial de **Brand Brain Foundry**. Landing estática bilingüe (ES por defecto, EN), Next.js App Router
con `output: 'export'`. Sin CMS, sin base de datos, sin backend.

- Contrato de hosting (puerto intercambiable): [`docs/system/DEPLOY_CONTRACT.md`](docs/system/DEPLOY_CONTRACT.md)
- Sistema de diseño (copia por contrato desde `bbf-web`): [`docs/design-system/`](docs/design-system/)
- Única fuente de verdad de dominio/locales/contacto: `src/config/site.ts`

```bash
pnpm install
pnpm check   # typecheck + lint + guardias de color y tipografía
pnpm build   # → out/ (estático)
```

Operación (despachos, estado, bitácora): hub `bbf-command-hub` → `repos/brandbrain-web/`.
