---
id: BBW-PORTS
title: "Registro de puertos — brandbrain-web"
type: canon
status: VIGENTE
version: 1.3
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-16
updated: 2026-09-16
verified_against_code: 2026-09-16@feat/fase6a-residuales-y-modelo-de-contenido (v1.3: enlaces salientes declarados en site.ts, que NO son puertos; v1.2: puerto de contenido declarado con su adaptador de archivos, src/content; v1.1: puerto de tipografía corregido contra la documentación oficial de Adobe Fonts, leída en vivo 2026-09-16)
supersedes: []
superseded_by: null
related: [BBW-DEPLOY-CONTRACT, BBW-PLAN-CONSTRUCCION, BBW-CONTENT-MODEL, D-BBW-10, D-BBW-13, D-BBW-14]
summary: "Todo actor externo pasa por un puerto declarado (criterio transversal 5): puerto · actor · adaptador actual · alternativa prevista · qué exigiría cambiar. Nace en la fase 4 con el puerto de tipografía display y los ya decididos (despliegue, contacto); la fase 5 añade el puerto de contenido (adaptador de archivos, ningún gestor instalado). No lista puertos que aún no existen."
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
| **Tipografía display** | Adobe Fonts (Typekit), proyecto web `ntm5vqh` (proyecto de Zavala; el identificador no es secreto). **Sin lista de dominios:** el embed funciona en cualquier sitio, sin límite de webs (Adobe, *Domains*, helpx.adobe.com/fonts/web/web-design-and-development/domains.html, 2022-11-16: *"You don't need to specify a list of domain names for your web projects"*). No hay tarea manual de alta de dominio. | D-BBW-14 | `src/styles/fonts/display.ts` (id del proyecto, URL de la hoja, hosts) → `<link>` en `src/app/[locale]/layout.tsx`. Familias nombradas solo en el token `--bbf-font-display` | `https://use.typekit.net` · `https://p.typekit.net` | **Cambiar de familia display** a una cuya licencia permita auto-hospedar (OFL u otra licencia web perpetua comprada a la fundición), cargada como el texto (`next/font/local`). **Auto-hospedar los archivos de Adobe NO es alternativa:** la licencia web de Adobe Fonts exige el embed code y no permite alojamiento local (Adobe, *Web fonts from Adobe Fonts*, helpx.adobe.com/fonts/web/font-licensing/webfont-licensing.html, 2025-11-14: *"Adobe doesn't offer the ability to host fonts locally … If local hosting (also known as self-hosting) is needed, you must purchase a license from the foundry or from an authorized reseller"*; *"The web font license requires that fonts be added to your website by the embed code provided"*). | Sustituir `display.ts` por un `localFont` sobre la familia nueva y cambiar el valor del token `--bbf-font-display`. Nada más. Fase 7: la política de seguridad de contenido debe permitir los dos hosts. Comprobación en el cutover: desde el dominio de producción, `document.fonts.load('400 20px "modulator-vf"')` → `loaded`. |
| **Contenido** | Ninguno en runtime: archivos versionados en el repo, leídos en build | D-BBW-02 · D-BBW-09 · D-BBW-15 | `src/content/` (`getPage(locale, slug)`) lee `content/<locale>/<colección>/<slug>.json`, valida y falla el build si falta o no cumple el modelo (`docs/system/CONTENT_MODEL.md`) | ninguno | **Gestor sobre git** (panel que edita y commitea/abre PR sobre estos mismos archivos). **Ningún gestor instalado**: llega sin rehacer nada porque escribe donde el puerto ya lee. Un formato nuevo (Markdown) = adaptador detrás de la misma función. | Añadir el gestor como actor con su fila aquí (hosts del panel), su decisión firmada (regla de las dos necesidades, D-DOC-13 §3) y, si escribe por API en vez de por PR, el mecanismo de autenticación fuera del repo. **Cero cambios en componentes.** |
| **Contacto** | Ninguno en runtime: `mailto:` al buzón oficial | D-BBW-13(a) | `site.contact.mailto` en `src/config/site.ts` (fuente única) | ninguno | Formulario → exige un endpoint fuera del repo (Worker/función que verifique y envíe); el repo solo conocería una URL pública | Añadir el endpoint como adaptador con su fila aquí, y una decisión firmada (D-BBW-09: "por visitante o por segundo"). |

**Lo que NO es un puerto:** la familia de texto (Space Grotesk) se auto-hospeda desde el build (`src/styles/fonts/text.ts`, OFL 1.1): ningún actor externo en runtime, por eso no tiene fila.

## Enlaces salientes (no son puertos)

`src/config/site.ts` declara `site.links` (fase 6a): destinos a los que la web **enlaza** (`<a href>`), nombrados por rol. Un enlace saliente
no es un actor externo: la página no le hace ninguna petición en runtime, no depende de que responda y no hay adaptador que cambiar. Por eso
no tienen fila arriba, pero se listan aquí para que la comprobación del criterio 5(b) (hosts que aparecen en `src/`) siga siendo un
subconjunto de lo declarado: `sivarbrains.com` (agencia) · `branddesignerpro.com` (trabajos con IA) · `www.linkedin.com` · `github.com` ·
`mailto:` al buzón oficial. El contenido (`content/`) nunca escribe una URL: referencia la llave y el puerto de contenido la valida.
Valores del inventario N0 §2.4, pendientes de confirmación por Zavala (P-BBW-19).

## Previstos, sin fila todavía (no se inventan)

- **Medios** (N0 §5): `public/` servido por el host; alternativa origen externo (R2). Sin decisión firmada → sin fila.
- **Analítica**: descartado por el N0 (sin necesidad medida).

---
*BBW-PORTS v1.3 · `docs/system/PORTS.md` · 2026-09-16 (v1.0 mismo día; v1.1 corrige el puerto de tipografía contra la doc oficial de Adobe; v1.2 añade el puerto de contenido, fase 5; v1.3 enlaces salientes, fase 6a) · nace en la fase 4 (`DESPACHO-BBW-2026-09-16-fase4-tokens-y-sistema-de-diseno`)*
