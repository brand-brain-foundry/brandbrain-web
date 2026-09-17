---
id: BBW-MEDIA-CONTRACT
title: "Contrato del puerto de medios — brandbrain-web"
type: canon
status: VIGENTE
version: 1.0
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-17
updated: 2026-09-17
verified_against_code: 2026-09-17@feat/fase6c-sistema-de-medios-foco-y-piezas (media/masters/ · src/media/registry.ts · scripts/media/build.ts · scripts/lint/check-media.ts · media/derivatives.lock.json · public/ · src/media/generated.ts)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, BBW-CONTENT-MODEL, D-BBW-21, D-BBW-02, D-BBW-03, D-BBW-09]
summary: "Todo medio tiene un MAESTRO (fuente única, se edita a mano, media/masters/) y DERIVADOS (se generan por guion determinista con un perfil declarado, se versionan en public/ y nunca se editan). Un guardia comprueba la correspondencia maestro ⇔ derivados por hash. Nomenclatura por rol y dimensión. Adaptador actual: servidos desde el propio sitio; alternativa: almacenamiento externo. Hoy: el conjunto vigente de iconos + manifiesto y la imagen para compartir desde el icono de marca; vídeo con contrato y sin maestro."
tags: [medios, puerto, maestros, derivados, iconos, manifiesto, brandbrain-web]
---

# Contrato del puerto de medios — brandbrain-web

> **Decisión que lo gobierna:** D-BBW-21 (2026-09-17). **Qué es:** el documento que permite reproducir el sistema de medios dentro de un
> año: dónde vive cada cosa, qué la genera, cómo se nombra, qué comprueba el guardia y cómo se añade un medio. **Qué no es:** una
> biblioteca de assets (no hay galería, ni casos, ni vídeo procesado: nada especulativo) ni un gestor.

## §1 — Principio: maestro y derivados

| | Maestro | Derivado |
|---|---|---|
| Qué es | La fuente única de un medio. **Lo único que se edita a mano.** | Lo que se sirve: un tamaño, un formato, un recorte del maestro. |
| Dónde vive | `media/masters/` (fuera de `public/` y de `src/`: no se sirve, no se importa) | `public/<rol>[-<dimensión>][-<variante>].<ext>` (se sirve tal cual) · los vectores que van inline, en `src/media/generated.ts` |
| Quién lo produce | Una persona (o el diseño): **se trae, no se dibuja**. `origin` en el registro dice de dónde salió. | **Siempre el guion** `scripts/media/build.ts` (`pnpm media:build`), desde el maestro y un perfil declarado. **Nunca se edita.** |
| Se versiona | Sí | **Sí.** La alternativa (generarlos al compilar) metería una herramienta de imagen en `pnpm build` y haría el resultado dependiente de su versión. Guardarlos mantiene la compilación pura y sin dependencias de producción (D-BBW-21). |
| Quién lo comprueba | El guardia (`R1`: el hash del maestro es el del lock) | El guardia (`R2`: el hash del derivado es el del lock; `R4`: nada en `public/` fuera del puerto) |

**Nomenclatura por rol y dimensión, nunca por contenido:** `icon.svg`, `icon-192.png`, `icon-512-maskable.png`, `apple-touch-icon-180.png`,
`share-1200x630.png`, `favicon.ico`, `manifest.webmanifest`. Cambiar lo que el icono dibuja no cambia ningún nombre ni ninguna referencia.

## §2 — Las piezas (verificadas)

| Pieza | Ruta | Papel |
|---|---|---|
| Registro | `src/media/registry.ts` | **La declaración:** maestros (archivo, clase, origen), derivados (maestro, ruta, perfil, rol), vectores inline, lista blanca de `public/`. Sin imports de Node: lo leen el guion, el guardia y los componentes. |
| Guion | `scripts/media/build.ts` (+ `tokens.ts`, `lock.ts`) | Determinista: recibe maestro + perfil → produce el derivado. Resuelve la **superficie del sistema por token** (`--bbf-surface-base` → OKLCH → sRGB) para los derivados opacos. Escribe `public/`, `src/media/generated.ts` y el lock. |
| Lock | `media/derivatives.lock.json` | Hash SHA-256 de cada maestro y de cada derivado, versión de la herramienta (sharp/libvips), color de superficie resuelto. Sin marcas de tiempo: función del contenido. |
| Guardia | `scripts/lint/check-media.ts` (`pnpm lint:media`, `pnpm guard`, pre-commit) | R1 maestro ⇔ lock · R2 derivado ⇔ lock (incluido `generated.ts`) · R3 lock ⇔ registro (sin huérfanos) · R4 nada en `public/` fuera del puerto · R5 misma herramienta que generó. Demostrada fallando y pasando en el output de la fase 6c. |
| Puerto | `src/media/index.ts` | Lo que consumen los componentes: `media.<id>` (ruta, tipo, dimensiones intrínsecas) e `inlineIcons`/`iconFor(id)`. El adaptador actual (servido desde el propio sitio) es el prefijo `/` de `src`; un origen externo cambiaría eso aquí y nada en los componentes. |
| Generado | `src/media/generated.ts` | Derivado: rutas + dimensiones + vectores inline (viewBox + trazado). No se edita (R2). |

## §3 — Perfiles de salida (los que existen; cada uno es una transformación determinista)

| Perfil | Qué hace | Quién lo usa hoy |
|---|---|---|
| `svg-copy` | Copia byte a byte. El SVG ya es escalable: los navegadores lo leen y lo escalan. | `icon.svg` (pestaña y marca en la cabecera) |
| `png` | Rasteriza a `size`²; fondo transparente o **la superficie por token**; `padding` = fracción del lado; `safeZone` = el dibujo cabe en el cuadrado inscrito en el círculo central de radio 40 % y **el guion lo verifica píxel a píxel** (falla si un píxel del dibujo queda fuera). | `apple-touch-icon-180.png` (opaco, padding 1/9), `icon-192.png`, `icon-512.png` (transparentes), `icon-512-maskable.png` (opaco, zona segura) |
| `ico` | Empaqueta rasterizaciones PNG en un contenedor `.ico` (cabecera + directorio + PNG por entrada; lo escribe el guion, sin herramienta). | `favicon.ico` (16/32/48) |
| `share` | Lienzo `width×height` sobre la superficie con el dibujo centrado a `iconHeight` de la altura. **Sin texto.** | `share-1200x630.png` |
| `manifest` | El manifiesto de la aplicación web con los derivados `icons`, `purpose: maskable` para el recortable, y `theme_color`/`background_color` = superficie por token. | `manifest.webmanifest` |
| vectores inline | viewBox + trazado del maestro → `generated.ts`; pintan con `currentColor`, se dimensionan y trazan por tokens (`Icon` atom). | iconos de perfil (LinkedIn, GitHub), onda del subrayado (nav, hoja), brazos del conmutador |

**El conjunto de iconos es el vigente, verificado en vivo el 2026-09-17** (evilmartians.com "How to favicon": `favicon.ico` + `icon.svg` +
`apple-touch-icon` 180 + 192 + 512 + recortable; web.dev "maskable-icon": zona segura = círculo central de radio 40 %; MDN "Define app
icons": `purpose: maskable`; developers.facebook.com: imagen para compartir ≥ 1200×630, 1,91:1). **No se generan los tamaños obsoletos**
(16/32/48/96 sueltos, la docena de Apple, tiles de Windows, pinned de Safari): son peticiones que las plataformas ya no hacen. El icono de
Apple es **opaco** sobre la superficie (iOS compone sobre un mosaico y la transparencia se ve negra).

## §4 — Herramienta de desarrollo (declarada y justificada; cero dependencias de producción)

- **`sharp` 0.35.4 (devDependencies, versión exacta).** libvips: rasteriza SVG con librsvg, compone y codifica PNG con parámetros fijos.
  Es la **misma biblioteca que Next.js declara como dependencia opcional** (`next@16.3.5` → `sharp ^0.35.4`): ya estaba instalada por esa
  vía; declararla la hace explícita y reproducible. **Corre solo en `pnpm media:build`.** `pnpm build` no la invoca (los derivados ya están
  en el repo; `images.unoptimized: true` en `next.config.ts` garantiza que Next tampoco la usa). `dependencies` no cambia.
- **Determinismo:** mismo maestro + mismo perfil + misma versión ⇒ mismos bytes. Comprobado ejecutando el guion tres veces: lock idéntico.
  Si cambia la versión de la herramienta, el guardia (R5) obliga a regenerar y a revisar el diff, en vez de servir mezclas.
- **Lo que NO se instaló:** ningún empaquetador de `.ico` (lo hace el guion), ningún optimizador extra, ninguna herramienta de vídeo.

## §5 — Cómo se añade un medio (el procedimiento completo)

1. **Traer el maestro** a `media/masters/<rol>.<ext>` (no dibujarlo: si no está disponible, la pieza espera y se reporta).
2. **Declararlo** en `src/media/registry.ts`: entrada en `masters` (archivo, clase, `origin`), y una entrada en `derivatives` por cada
   salida que la web necesite HOY (maestro, ruta por rol y dimensión, perfil, rol). Si va inline, entrada en `inlineIcons`.
3. **Si hace falta un perfil nuevo** (p. ej. una foto: AVIF + WebP + JPEG de respaldo servidos con `<picture>`/`<source type>` y
   dimensiones intrínsecas declaradas en `<img width height>` para no provocar saltos de composición, web.dev/MDN 2026-09-17): se añade al
   tipo `Profile` del registro y al guion, **con su regla escrita aquí**. No existe hasta que exista su primer maestro.
4. `pnpm media:build` → derivados + `generated.ts` + lock. Revisar el diff de `public/` como cualquier otro cambio.
5. **Consumir por el puerto:** `media.<id>` en el componente (ruta, tipo, `width`/`height` intrínsecos) o `<Icon name>`; el tamaño en
   pantalla, por tokens. Nunca una ruta ni una dimensión escrita a mano en un componente.
6. `pnpm lint:media` en verde. Commit del maestro, del registro, del lock y de los derivados juntos.

**Cambiar un maestro** = editar el archivo + `pnpm media:build`. Si se olvida el paso 2, el guardia rompe el commit (R1).

## §6 — Vídeo: contrato ahora, proceso cuando exista el maestro

El diseño (N0 §2.1) cita un bucle de 8 s (`fish-loop.mp4`, H.264 1280×720, 24 fps, **con pista de audio** que sobra, 1,86 MB) que el hero
reproduce silenciado y en bucle. **Hoy no hay maestro en el repo y no se transcodifica nada** (despacho 6c §6): el archivo del export es un
derivado ya comprimido, no un maestro. Cuando llegue el maestro (el render original, o como mínimo el mejor archivo disponible declarado
como tal):

| Aspecto | Contrato |
|---|---|
| Maestro | `media/masters/hero-loop.<ext>` (el mejor archivo disponible, con su `origin`). Sin audio o con audio: el perfil lo elimina. |
| Perfiles | (a) **AV1 en WebM** (formato moderno) + (b) **H.264 en MP4** (respaldo universal), ambos **sin pista de audio**, misma duración y
  misma resolución de salida (la que el rol pida, ≤ 1280×720 mientras el diseño no cambie), y (c) **fotograma de portada** (`poster`) como
  derivado raster por el perfil `png`/foto (dimensiones intrínsecas declaradas: el `<video>` reserva su caja con `width`/`height`). |
| Nomenclatura | `hero-loop-1280x720.webm` · `hero-loop-1280x720.mp4` · `hero-loop-poster-1280x720.<ext>` |
| Entrega | `<video muted playsinline loop autoplay preload="metadata" poster width height>` con dos `<source type>` en orden moderno → respaldo. Respeta `prefers-reduced-motion` (el turno de movimiento decide cómo). |
| Herramienta | Una de desarrollo, declarada y justificada al entrar (candidata: ffmpeg por su CLI determinista con parámetros fijos), **nunca de producción**. Se decide en el despacho que traiga el maestro. |
| Guardia | La misma (hash maestro ⇔ derivados). |

Registrado como pendiente en `bbf-command-hub:repos/brandbrain-web/ESTADO_CANONICO.md` (P-BBW-25).

## §7 — Alternativa prevista (no cableada)

**Almacenamiento externo** (un bucket/CDN): cambia **dónde se publican** los derivados, no cómo se generan. Entraría como un prefijo de
origen en `src/media/index.ts` (los componentes siguen pidiendo `media.<id>`), con su fila de actor en `PORTS.md` (hosts, decisión firmada,
credenciales fuera del repo). El guion y el guardia no cambian. **Gestor de contenido:** sube maestros; el proceso no cambia. Ninguno de los
dos se instala hasta la segunda necesidad (D-DOC-13 §3).

## §8 — Seguridad (D-DOC-06)

Un maestro es **dato**: el guion lo lee como bytes/XML, extrae geometría y lo rasteriza; jamás ejecuta nada que venga dentro (un SVG puede
llevar `<script>`: el guion no lo evalúa y los derivados raster no lo conservan; el derivado SVG se sirve como `<img>`/`<link rel=icon>`,
contextos en los que el navegador no ejecuta scripts). El manifiesto de procedencia C2PA del icono se conserva en maestro y derivado SVG
como metadato inerte.

---
*BBW-MEDIA-CONTRACT v1.0 · `docs/system/MEDIA.md` · 2026-09-17 · nace en la fase 6c (`DESPACHO-BBW-2026-09-17-fase6c-sistema-de-medios-foco-y-piezas`, D-BBW-21)*
