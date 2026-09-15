---
id: BBW-DEPLOY-CONTRACT
title: "Contrato de puerto de despliegue — brandbrain-web"
type: canon
status: VIGENTE
version: 1.0
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-15
updated: 2026-09-15
verified_against_code: 2026-09-15@chore/bootstrap
supersedes: []
superseded_by: null
related: [D-BBW-02, D-BBW-03, D-BBW-04, D-BBW-05, D-BBW-07]
summary: "Qué produce este repo, qué exige de cualquier host y qué NO vive aquí. El hosting es un puerto intercambiable: migrar de proveedor = cambiar de panel + un registro en Cloudflare, cero cambios de código."
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
| Adaptador de despliegue (GitHub App de Hostinger, auto-deploy desde `main`) | **Panel del host** (D-BBW-04) | Un workflow o token del host dentro del repo acopla el código al proveedor. |
| Valores de variables de entorno | **Panel del host / Secret Manager** (S-1) | El repo solo conoce **nombres** (`.env.example`). Hoy no necesita ninguno en runtime. |
| Correo (MX y afines de `brandbrainfoundry.com`) | Cloudflare DNS → Hostinger mail | Fuera de ámbito de la web. No se toca en ninguna fase. |

## 4. Capas, dueño y qué cambia al migrar de proveedor

| Capa | Dueño hoy | Cambio si migramos de host | **Cambios en el repo** |
|---|---|---|---|
| Código y contenido | GitHub `brand-brain-foundry/brandbrain-web` | Ninguno | **ninguno** |
| Build (`pnpm build` → `out/`) | El runner del host | Reproducir el mismo comando en el host nuevo | **ninguno** |
| Servir estático | Host (Hostinger hoy) | Conectar el host nuevo al repo, apuntar a `out/` | **ninguno** |
| Adaptador de despliegue | GitHub App del host, en el panel | Desinstalar App antigua, instalar la nueva (scope: solo este repo) | **ninguno** |
| DNS / TLS / redirects / caché | Cloudflare | Cambiar el registro que apunta al host | **ninguno** |
| Variables de entorno (nombres) | `.env.example` en el repo; valores en el panel | Volver a cargar valores en el panel nuevo | **ninguno** |

La columna que importa es la última. Si alguna fila deja de leer **ninguno**, el contrato está roto.

## 5. Anti-patrones que rompen el contrato

- **Features de servidor** (prohibidas en export estático, lista oficial Next 16): server actions, `proxy`/middleware, rewrites/redirects/headers en `next.config`, ISR, cookies, route handlers que lean el request, rutas dinámicas sin `generateStaticParams` o con `dynamicParams: true`, draft mode, intercepting routes, `next/image` con el loader por defecto.
- **SDK o cliente del proveedor** de hosting en `dependencies`.
- **Archivos de config propietarios del host** en la raíz (p. ej. `vercel.json`, `netlify.toml`, `.htaccess` generados por panel, `app.yaml`).
- **Workflows de CI que conozcan al host** (tokens, CLI del proveedor, FTP). El deploy lo dispara el host observando `main`, no el repo empujando al host.
- **URLs del host** (subdominios `*.hostingersite.com`, IPs) escritas en código o contenido. El único dominio conocido es `site.url` en `src/config/site.ts`.
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

---
*D-BBW-02..07 · `docs/system/DEPLOY_CONTRACT.md` · 2026-09-15*
