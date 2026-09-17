---
id: BBW-DEPLOY-CONTRACT
title: "Contrato de puerto de despliegue — brandbrain-web"
type: canon
status: VIGENTE
version: 1.2
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-15
updated: 2026-09-17
verified_against_code: 2026-09-17@feat/fase6f-previsualizacion-y-fidelidad (contrato de puerto sin cambios desde 2026-09-15; v1.2 añade §7 previsualización por rama, D-BBW-26; `pnpm preview` en scripts/preview/serve.ts)
supersedes: []
superseded_by: null
related: [D-BBW-02, D-BBW-03, D-BBW-04, D-BBW-05, D-BBW-07, D-BBW-09, D-BBW-10, D-BBW-11, D-BBW-26, BBW-PORTS]
summary: "Qué produce este repo, qué exige de cualquier host y qué NO vive aquí. El hosting es un puerto intercambiable: migrar de proveedor = cambiar de panel + un registro DNS, cero cambios de código. v1.1 (2026-09-16): el actor de despliegue es Cloudflare conectado al repo (D-BBW-10, enmienda D-BBW-04); Hostinger queda solo como correo y registro de dominios (D-BBW-11). El contrato de puerto no cambia. v1.2 (2026-09-17, D-BBW-26): §7 previsualización por rama adelantada (Cloudflare Pages con integración Git, sin dominio ni DNS; pasos [ZAVALA-MANUAL]) y comando local `pnpm preview` con rangos HTTP."
tags: [deploy, hosting, contrato, portabilidad]
---

# Contrato de puerto de despliegue — brandbrain-web

> **En una frase:** *dame un runner de Node, corré `pnpm build`, serví la carpeta `out/` como estático.*
> Todo host serio lo cumple. Si un host pide algo que este contrato no dice, eso es **deuda registrable**
> (HALLAZGOS del hub), no un archivo más en el repo.

## 1. Qué produce el repo

| Aspecto | Valor |
|---|---|
| Comando de build | `pnpm install --frozen-lockfile && pnpm build` (`next build`) |
| Carpeta de salida | `out/` |
| Naturaleza del artefacto | **Estático puro**: HTML + CSS + JS + assets. Un archivo por ruta (`es/index.html`, `en/index.html`, `index.html` de raíz que redirige, `404.html`). |
| Runtime del artefacto | **Ninguno.** No hay proceso Node en producción. `pnpm start` no existe a propósito. |
| Mecanismo | `output: 'export'` + `trailingSlash: true` + `images.unoptimized` en `next.config.ts` (D-BBW-03). |

## 2. Qué exige de cualquier host

1. **Runner de Node** en versión LTS soportada por Next.js (hoy `>=20.9`; el repo declara `engines.node: 22.x` y `.nvmrc`), solo durante el build.
2. **pnpm** (Corepack o instalado; `packageManager` está declarado en `package.json`).
3. **Servir `out/` como raíz estática** con índice de directorio (`/es/` → `es/index.html`).
4. Nada más. **Sin** base de datos, **sin** proceso persistente, **sin** almacenamiento, **sin** variables en runtime, **sin** cron.

## 3. Qué NO vive en el repo, y por qué

| Cosa | Dónde vive | Por qué no aquí |
|---|---|---|
| DNS, certificados TLS, redirecciones (`cerebrosdemarca.com` → canónico, `/` → `/es/`), caché de edge | **Cloudflare** (D-BBW-05, D-BBW-07) | Son propiedad del dominio, no del código. Cambiar de host no las toca. |
| Adaptador de despliegue (aplicación de GitHub de Cloudflare, auto-deploy desde `main`) | **Panel de Cloudflare** (D-BBW-10, enmienda D-BBW-04) | Un workflow o token del host dentro del repo acopla el código al proveedor. Sin credenciales en el repo. |
| Valores de variables de entorno | **Panel del host / Secret Manager** (S-1) | El repo solo conoce **nombres** (`.env.example`). Hoy no necesita ninguno en runtime. |
| Correo (MX y afines de `brandbrainfoundry.com`) | Cloudflare DNS → Hostinger mail (D-BBW-11: Hostinger = correo + registro de dominios, **no** hosting web) | Fuera de ámbito de la web. No se toca en ninguna fase; el cutover recrea los registros contra la línea base medida. |

## 4. Capas, dueño y qué cambia al migrar de proveedor

| Capa | Dueño hoy | Cambio si migramos de host | **Cambios en el repo** |
|---|---|---|---|
| Código y contenido | GitHub `brand-brain-foundry/brandbrain-web` | Ninguno | **ninguno** |
| Build (`pnpm build` → `out/`) | El runner del host | Reproducir el mismo comando en el host nuevo | **ninguno** |
| Servir estático | Cloudflare (D-BBW-10; firmado, **no conectado** hasta el cutover) | Conectar el host nuevo al repo, apuntar a `out/` | **ninguno** |
| Adaptador de despliegue | Aplicación de GitHub de Cloudflare, en su panel | Desinstalar la aplicación antigua, instalar la nueva (scope: solo este repo) | **ninguno** |
| DNS / TLS / redirects / caché | Cloudflare | Cambiar el registro que apunta al host | **ninguno** |
| Variables de entorno (nombres) | `.env.example` en el repo; valores en el panel | Volver a cargar valores en el panel nuevo | **ninguno** |

La columna que importa es la última. Si alguna fila deja de leer **ninguno**, el contrato está roto.

## 5. Anti-patrones que rompen el contrato

- **Features de servidor** (prohibidas en export estático, lista oficial Next 16): server actions, `proxy`/middleware, rewrites/redirects/headers en `next.config`, ISR, cookies, route handlers que lean el request, rutas dinámicas sin `generateStaticParams` o con `dynamicParams: true`, draft mode, intercepting routes, `next/image` con el loader por defecto.
- **SDK o cliente del proveedor** de hosting en `dependencies`.
- **Archivos de config propietarios del host** en la raíz (p. ej. `vercel.json`, `netlify.toml`, `.htaccess` generados por panel, `app.yaml`).
- **Workflows de CI que conozcan al host** (tokens, CLI del proveedor, FTP). El deploy lo dispara el host observando `main`, no el repo empujando al host.
- **URLs del host** (subdominios `*.pages.dev` / `*.workers.dev`, IPs) escritas en código o contenido. El único dominio conocido es `site.url` en `src/config/site.ts`. Los actores externos que sí aparecen en `src/` pasan por un puerto declarado en `docs/system/PORTS.md`.
- **Valores** de variables de entorno en el repo (S-1/S-6).
- **Duplicar el árbol de rutas** para servir ES sin prefijo (viola I-2; el prefijo es obligatorio en export estático, D-BBW-07).

## 6. Procedimiento de migración (medible)

1. **Conectar el host nuevo** al repo (su GitHub App, scope solo `brandbrain-web`), con build `pnpm build` y salida `out/`. Sin tocar Cloudflare todavía.
2. **Verificar el build en la URL de preview del host nuevo**: `GET /es/` y `GET /en/` → 200 con el HTML esperado; `GET /` → redirige a `/es/`.
3. **Cambiar en Cloudflare** el registro del apex y `www` para apuntar al host nuevo (proxy naranja se mantiene). TTL bajo antes del cambio.
4. **Verificar en vivo** con `dig` (resuelve al host nuevo) y `curl -I https://brandbrainfoundry.com/es/` → 200 desde el host nuevo. Redirect de `cerebrosdemarca.com` y de `/` intactos (viven en Cloudflare, no se tocaron).
5. **Desconectar el host antiguo**: desinstalar su GitHub App, borrar el sitio en su panel.
6. Registrar el cutover en el hub (`repos/brandbrain-web/ESTADO_CANONICO.md` §1/§4 + BITACORA).

Cambios de código durante los 6 pasos: **cero**. Si hubo alguno, documentarlo como HAL-BBW y corregir el contrato o el código.

## 7. Previsualización por rama (adelantada, D-BBW-26, 2026-09-17) — `[ZAVALA-MANUAL]`

**Qué es:** la conexión del repo con Cloudflare **solo para previsualizaciones por rama**. No asigna dominio, no toca DNS, no publica producción; el
cutover (§6 y fase 8 del plan) sigue siendo un despacho propio. **CC no entra en ningún panel**: los pasos los da Zavala. **Cero credenciales en el repo**
(la conexión es la aplicación de GitHub de Cloudflare, instalada desde el panel de Cloudflare con alcance de un solo repositorio).

**Por qué Pages y no Workers (verificado en la documentación oficial el 2026-09-17):** Cloudflare recomienda Workers para proyectos nuevos
(*"Start new projects with Workers"*), pero desplegar assets estáticos con Workers exige un archivo de configuración de Wrangler con el directorio
de assets **dentro del repo**, y §5 lo prohíbe (archivo de configuración propietario del host en la raíz). Pages con integración Git no pide
ningún archivo: build, salida y rama se declaran en el panel. Si un día Pages dejara de admitir proyectos nuevos, la alternativa es Workers con
`assets.directory = out`, y ese archivo entraría por decisión firmada como excepción explícita de §5, no por defecto.

**Pasos en el panel (una sola vez):**

| # | Dónde | Qué | Valor |
|---|---|---|---|
| 1 | dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** | Autorizar la aplicación de GitHub de Cloudflare | Alcance: **solo `brand-brain-foundry/brandbrain-web`** (no "todos los repositorios"). Es lo que permite *"deploy your projects, and update your PRs with preview deployments"*. |
| 2 | Mismo asistente | Nombre del proyecto | `brandbrain-web` (genera el host `brandbrain-web.pages.dev`; es solo la dirección de previsualización, no un dominio propio). |
| 3 | Mismo asistente | Production branch | `main` |
| 4 | Mismo asistente | Framework preset | `Next.js (Static HTML Export)` (rellena build y salida; comprobar que quedan como en las filas 5 y 6) |
| 5 | Mismo asistente | Build command | `pnpm build` (§1; el preset propone `npx next build`, equivalente; se prefiere el comando del contrato) |
| 6 | Mismo asistente | Build output directory | `out` |
| 7 | Mismo asistente → Environment variables (build) | Versión de Node y de pnpm | `NODE_VERSION` = `22` (el repo ya trae `.nvmrc` = 22, que Pages también lee) · `PNPM_VERSION` = `10.32.1` (la del campo `packageManager`; la documentación dice que la detección por `pnpm-lock.yaml` no está soportada). **Ningún secreto**: la landing no necesita variables en runtime (§2.4). |
| 8 | **Save and Deploy** | Primer despliegue de `main` | Verificar `https://brandbrain-web.pages.dev/es/` → 200 con el HTML del build y `/` → `/es/`. **No** añadir dominio personalizado (Custom domains: vacío). |
| 9 | Proyecto → **Settings** → **Builds** → Preview deployments | Ramas de previsualización | `All non-Production branches` (por defecto). Cada rama obtiene el alias `https://<rama>.brandbrain-web.pages.dev` (minúsculas, no alfanuméricos → guiones) y cada commit su URL con hash; *"Any custom domains … will not be affected by preview deployments"*. |

**Qué queda después:** cada PR lleva un comentario de Cloudflare con su URL de previsualización; `main` se sirve en `brandbrain-web.pages.dev` **sin
dominio propio** (los dominios siguen redirigiendo a `sivarbrains.com` hasta el cutover). Registrar en el hub (`ESTADO_CANONICO.md` §4) la fecha de la
conexión y la URL de previsualización cuando existan.

**Local, sin panel:** `pnpm preview` compila y sirve `out/` en `http://127.0.0.1:4173/es/` con rangos HTTP (el vídeo del héroe no carga sin ellos,
L-51); `pnpm preview:serve` solo sirve. Es herramienta de desarrollo (`scripts/preview/serve.ts`, solo Node): no toca el artefacto.

---
*D-BBW-02..07 + D-BBW-09/10/11 + D-BBW-26 · `docs/system/DEPLOY_CONTRACT.md` · v1.2 · 2026-09-17 (v1.1: 2026-09-16 · v1.0: 2026-09-15)*
