---
id: BBW-PORTS
title: "Registro de puertos — brandbrain-web"
type: canon
status: VIGENTE
version: 1.0
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-16
verified_against_code: 2026-09-16@feat/fase4-tokens-y-sistema-de-diseno
supersedes: []
superseded_by: null
related: [BBW-DEPLOY-CONTRACT, BBW-PLAN-CONSTRUCCION, D-BBW-10, D-BBW-13, D-BBW-14]
summary: "Todo actor externo pasa por un puerto declarado (criterio transversal 5): puerto · actor · adaptador actual · alternativa prevista · qué exigiría cambiar. Nace en la fase 4 con el puerto de tipografía display y los ya decididos (despliegue, contacto). No lista puertos que aún no existen."
tags: [puertos, actores-externos, adaptadores, brandbrain-web]
---

# Registro de puertos — brandbrain-web

> **Regla (PLAN_DE_CONSTRUCCION §3, criterio 5):** ningún actor externo se cablea desde un componente; cada uno entra por un
> puerto con **adaptador nombrado** y **alternativa prevista**. Comprobación: los hosts que aparecen en `src/` (`grep -rhoE
> 'https?://[a-z0-9.-]+' src | sort -u`, quitado el dominio canónico) son un **subconjunto** de la columna *Hosts* de esta tabla.
> **No se inventan puertos:** una fila entra cuando existe una decisión firmada que la gobierna y código (o panel) que la materializa.

## Puertos declarados

| Puerto | Actor externo (hoy) | Decisión | Adaptador actual (dónde vive) | Hosts en runtime | Alternativa prevista | Qué exigiría cambiar |
|---|---|---|---|---|---|---|
| **Despliegue** | Cloudflare (conectado al repo de GitHub por su aplicación; sin credenciales en el repo) | D-BBW-10 | Panel de Cloudflare. El repo solo cumple el contrato `pnpm build` → `out/` (`DEPLOY_CONTRACT.md`) | ninguno en `src/` (el host sirve `out/`) | Cualquier host estático (Netlify, GitHub Pages, otro CDN) | Cambiar de panel y el registro DNS. **Cero cambios en el repo.** Estado: firmado, **no conectado** (cutover = fase 8). |
| **Tipografía display** | Adobe Typekit, kit `ntm5vqh` (kit de Zavala; el identificador no es secreto, el kit está atado a una lista de dominios) | D-BBW-14 | `src/styles/fonts/display.ts` (id del kit, URL de la hoja, hosts) → `<link>` en `src/app/[locale]/layout.tsx`. Familias nombradas solo en el token `--bbf-font-display` | `https://use.typekit.net` · `https://p.typekit.net` | Auto-hospedar el display si un día se licencia (mismo mecanismo que el texto: `next/font/local`) | Sustituir `display.ts` por un `localFont` y cambiar el valor del token `--bbf-font-display`. Nada más. **`[ZAVALA-MANUAL]`: dar de alta `brandbrainfoundry.com` en el kit** antes del cutover; comprobación: `curl -sI -H 'Referer: https://brandbrainfoundry.com/' https://use.typekit.net/ntm5vqh.css` → 200 y la fuente carga en el navegador desde el dominio de producción. Fase 7: la política de seguridad de contenido debe permitir los dos hosts. |
| **Contacto** | Ninguno en runtime: `mailto:` al buzón oficial | D-BBW-13(a) | `site.contact.mailto` en `src/config/site.ts` (fuente única) | ninguno | Formulario → exige un endpoint fuera del repo (Worker/función que verifique y envíe); el repo solo conocería una URL pública | Añadir el endpoint como adaptador con su fila aquí, y una decisión firmada (D-BBW-09: "por visitante o por segundo"). |

**Lo que NO es un puerto:** la familia de texto (Space Grotesk) se auto-hospeda desde el build (`src/styles/fonts/text.ts`, OFL 1.1): ningún actor externo en runtime, por eso no tiene fila.

## Previstos, sin fila todavía (no se inventan)

- **Contenido** (D-BBW-02/09): archivos versionados por locale, fuera de los componentes. Nace en la fase 5, y ahí se declara.
- **Medios** (N0 §5): `public/` servido por el host; alternativa origen externo (R2). Sin decisión firmada → sin fila.
- **Analítica**: descartado por el N0 (sin necesidad medida).

---
*BBW-PORTS v1.0 · `docs/system/PORTS.md` · 2026-09-16 · nace en la fase 4 (`DESPACHO-BBW-2026-09-16-fase4-tokens-y-sistema-de-diseno`)*
