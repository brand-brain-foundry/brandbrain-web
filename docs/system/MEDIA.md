---
id: BBW-MEDIA-CONTRACT
title: "Contrato del puerto de medios — brandbrain-web"
type: canon
status: VIGENTE
version: 1.1
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-17
updated: 2026-09-17
verified_against_code: 2026-09-17@feat/fase6d-copy-video-y-fondo (v1.1: vídeo del héroe con maestro de registro, perfiles video/poster, ffmpeg como herramienta de desarrollo, guardia R5 ampliada y R6 presupuesto; v1.0: media/masters/ · src/media/registry.ts · scripts/media/build.ts · scripts/lint/check-media.ts · media/derivatives.lock.json · public/ · src/media/generated.ts)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, BBW-CONTENT-MODEL, D-BBW-21, D-BBW-24, D-BBW-02, D-BBW-03, D-BBW-09]
summary: "Todo medio tiene un MAESTRO (fuente única, se edita a mano, media/masters/) y DERIVADOS (se generan por guion determinista con un perfil declarado, se versionan en public/ y nunca se editan). Un guardia comprueba la correspondencia maestro ⇔ derivados por hash. Nomenclatura por rol y dimensión. Adaptador actual: servidos desde el propio sitio; alternativa: almacenamiento externo. Hoy: el conjunto vigente de iconos + manifiesto y la imagen para compartir desde el icono de marca; el vídeo del héroe (D-BBW-24) desde un maestro de registro ya comprimido: H.264 sin audio en dos tamaños + póster del primer fotograma, con presupuesto de peso por perfil comprobado por el guardia."
tags: [medios, puerto, maestros, derivados, iconos, manifiesto, video, poster, brandbrain-web]
---

# Contrato del puerto de medios — brandbrain-web

> **Decisiones que lo gobiernan:** D-BBW-21 (2026-09-17) y, para el vídeo, D-BBW-24 (2026-09-17). **Qué es:** el documento que permite reproducir el sistema de medios dentro de un
> año: dónde vive cada cosa, qué la genera, cómo se nombra, qué comprueba el guardia y cómo se añade un medio. **Qué no es:** una
> biblioteca de assets (no hay galería ni casos: nada especulativo) ni un gestor.

## §1 — Principio: maestro y derivados

| | Maestro | Derivado |
|---|---|---|
| Qué es | La fuente única de un medio. **Lo único que se edita a mano.** | Lo que se sirve: un tamaño, un formato, un recorte del maestro. |
| Dónde vive | `media/masters/` (fuera de `public/` y de `src/`: no se sirve, no se importa) | `public/<rol>[-<dimensión>][-<variante>].<ext>` (se sirve tal cual) · los vectores que van inline, en `src/media/generated.ts` |
| Quién lo produce | Una persona (o el diseño): **se trae, no se dibuja**. `origin` en el registro dice de dónde salió. | **Siempre el guion** `scripts/media/build.ts` (`pnpm media:build`), desde el maestro y un perfil declarado. **Nunca se edita.** |
| Se versiona | Sí | **Sí.** La alternativa (generarlos al compilar) metería una herramienta de imagen en `pnpm build` y haría el resultado dependiente de su versión. Guardarlos mantiene la compilación pura y sin dependencias de producción (D-BBW-21). |
| Quién lo comprueba | El guardia (`R1`: el hash del maestro es el del lock) | El guardia (`R2`: el hash del derivado es el del lock; `R4`: nada en `public/` fuera del puerto) |

**Nomenclatura por rol y dimensión, nunca por contenido:** `icon.svg`, `icon-192.png`, `icon-512-maskable.png`, `apple-touch-icon-180.png`,
`share-1200x630.png`, `favicon.ico`, `manifest.webmanifest`, `hero-loop-1280x720.mp4`, `hero-loop-640x360.mp4`, `hero-loop-poster-1280x720.jpg`.
Cambiar lo que el icono dibuja o lo que el vídeo muestra no cambia ningún nombre ni ninguna referencia.

## §2 — Las piezas (verificadas)

| Pieza | Ruta | Papel |
|---|---|---|
| Registro | `src/media/registry.ts` | **La declaración:** maestros (archivo, clase, origen), derivados (maestro, ruta, perfil, rol), vectores inline, lista blanca de `public/`. Sin imports de Node: lo leen el guion, el guardia y los componentes. |
| Guion | `scripts/media/build.ts` (+ `tokens.ts`, `lock.ts`) | Determinista: recibe maestro + perfil → produce el derivado. Resuelve la **superficie del sistema por token** (`--bbf-surface-base` → OKLCH → sRGB) para los derivados opacos. Escribe `public/`, `src/media/generated.ts` y el lock. |
| Lock | `media/derivatives.lock.json` | Hash SHA-256 de cada maestro y de cada derivado, versión de las herramientas (sharp/libvips; ffmpeg cuando hay vídeo), color de superficie resuelto; para vídeo y póster, peso real, presupuesto y pistas verificadas. Sin marcas de tiempo: función del contenido. |
| Guardia | `scripts/lint/check-media.ts` (`pnpm lint:media`, `pnpm guard`, pre-commit) | R1 maestro ⇔ lock · R2 derivado ⇔ lock (incluido `generated.ts`) · R3 lock ⇔ registro (sin huérfanos) · R4 nada en `public/` fuera del puerto · R5 misma herramienta que generó (sharp/libvips; y ffmpeg si está instalado: si no está, nada puede regenerar y se informa) · **R6 presupuesto de peso** (fase 6d): cada derivado con presupuesto pesa ≤ su presupuesto, medido sobre el archivo real. Demostrada fallando y pasando en los outputs de las fases 6c y 6d. |
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
| `video` (fase 6d) | Transcodifica un maestro de vídeo **sin audio** a `width`×`height` (Lanczos) con `codec` `h264` (MP4, libx264, CRF `quality`, preset slow, High 4.0, `+faststart`) o `av1` (WebM, SVT-AV1, CRF `quality`, preset 4); **un solo hilo** y sin metadatos (`bitexact`) para que la salida sea idéntica entre máquinas; GOP 48 (2 s a 24 fps). El guion sondea el derivado (ffprobe): sin pista de audio y con las dimensiones del perfil, o falla. **`budgetBytes`** = presupuesto de peso; pasarse hace fallar el guion y la guardia (R6). | `hero-loop-1280x720.mp4` (CRF 23, ≤ 1 000 000 B) · `hero-loop-640x360.mp4` (CRF 23, ≤ 400 000 B; perfil ligero para pantallas pequeñas, previsto, no servido: la entrega adaptativa no se cablea) |
| `poster` (fase 6d) | El **primer fotograma exacto** del maestro (fotograma 0, sin pérdida vía PNG) codificado por sharp a `format` (`jpeg` mozjpeg 4:2:0 o `webp`) a `quality`, con `budgetBytes`. Es lo que se ve mientras el vídeo carga y lo que se sirve con movimiento reducido; un solo URL (`poster`), por eso JPEG (universal). | `hero-loop-poster-1280x720.jpg` (q 80, ≤ 60 000 B) |

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
- **`ffmpeg` (fase 6d, D-BBW-24; en este turno 8.1.2 de Homebrew con libx264 y SVT-AV1 4.1.0).** CLI determinista con parámetros fijos, un solo
  hilo y sin metadatos: dos ejecuciones producen el mismo hash (comprobado: lock idéntico ×2). Solo para los perfiles `video` y `poster`,
  solo en `pnpm media:build`; `pnpm build` no la invoca. **Por qué no va en `package.json`:** no existe como paquete sin descargar un binario en
  la instalación (`ffmpeg-static` ≈ 70 MB por plataforma, con `postinstall` que pnpm 10 bloquea por defecto, y sin garantía de traer SVT-AV1);
  el guion la exige instalada y falla con mensaje si no está. Su versión queda en el lock (`tool.ffmpeg`) y la guardia R5 la compara con la
  instalada: otra versión ⇒ regenerar y revisar el diff; ausente ⇒ nada puede regenerar (se informa, no rompe). **Cero dependencias de producción.**
- **Lo que NO se instaló:** ningún empaquetador de `.ico` (lo hace el guion), ningún optimizador extra, ningún paquete de vídeo en `node_modules`.

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

## §6 — Vídeo del héroe (D-BBW-24, fase 6d): fondo decorativo

**Decisión (D-BBW-24, 2026-09-17):** el vídeo del héroe es **fondo decorativo**: silencio, bucle, sin controles, sin pantalla completa (las
condiciones sin las cuales ningún navegador lo reproduce solo; MDN `<video>` y guía de autoplay, leídos en vivo 2026-09-17: el bloqueo de
autoplay no aplica a medios silenciados o sin pista de audio; `playsinline` es obligatorio en Safari). **El audio se elimina de todos los
derivados.** Lleva **póster** (lo que se ve mientras carga y lo que se sirve con movimiento reducido) y se declara **decorativo** para las
tecnologías de asistencia: toda la información está en el texto.

| Aspecto | Contrato (vigente) |
|---|---|
| Maestro | `media/masters/hero-loop.mp4` — **maestro DE REGISTRO, no el original:** el diseño solo trae un H.264 1280×720 · 24 fps · 8 s · 192 fotogramas ya comprimido (1,7 Mbit/s) y con pista AAC (N0 §2.1). Recomprimir arrastra sus defectos: es el techo de calidad. Se acepta porque es el mejor archivo disponible y **se regenera el día que exista el original** (sustituir el archivo + `pnpm media:build`; la guardia R1 obliga). `origin` en el registro. |
| Perfiles | `video h264 1280×720 crf 23` (respaldo universal, a la resolución del maestro) · `video h264 640×360 crf 23` (perfil ligero para pantallas pequeñas) · `poster jpeg 1280×720 q 80` (primer fotograma exacto). CRF 23 = valor por defecto de x264, no una elección; q 80 = valor por defecto de sharp. |
| Formato moderno | **Medido y NO justificado** (2026-09-17): AV1 (SVT-AV1 4.1.0, preset 4) a CRF 30 pesa 604 KB con SSIM 0,990 frente al maestro, mientras H.264 a CRF 26 pesa 598 KB con SSIM 0,995; el SSIM de AV1 se estanca en 0,991 hasta 995 KB (CRF 22). Sobre esta fuente ya comprimida y oscura el formato moderno no ahorra a igual parecido: no se genera. El perfil `av1` existe en el guion para el día del maestro original; se justifica midiendo, no por defecto. |
| Presupuesto de peso (R6) | 720p ≤ 1 000 000 B (la mitad del maestro y un quinto del umbral de peso total de página que Lighthouse marca, 5 000 KiB, leído en vivo 2026-09-17) · 360p ≤ 400 000 B · póster ≤ 60 000 B. **Reales (2026-09-17):** 891 885 B (89 %) · 315 107 B (79 %) · 35 496 B (59 %). Pasarse rompe el guion y la guardia: bajar calidad o resolución es decisión con consecuencias visibles, no un hecho consumado. |
| Nomenclatura | `hero-loop-1280x720.mp4` · `hero-loop-640x360.mp4` · `hero-loop-poster-1280x720.jpg` |
| Entrega | `HeroMedia` (molecule, cliente): `<video autoplay muted loop playsinline disablepictureinpicture preload="metadata" poster width height>` con `<source type>` (hoy uno: MP4) y `aria-hidden`; una `<img>` con el póster como imagen fija. **Movimiento reducido:** el rol `--bbf-motion-media-display` / `--bbf-motion-still-display` (`semantic/motion.css`) esconde el vídeo y muestra la imagen fija, sin JavaScript. **Pestaña oculta:** se pausa y se reanuda al volver (Page Visibility API); es lo único que hace el cliente. El póster es el candidato LCP más temprano (web.dev: "the poster image load time or first frame presentation time — whichever is earlier"). |
| Tamaños y entrega adaptativa | El HTML sirve el 720p a todo el mundo. El 360p **existe, se presupuesta y se guarda**, pero no se selecciona por pantalla: `<source media>` no es fiable dentro de `<video>` y elegirlo por JavaScript es entrega adaptativa, que este turno no cablea (despacho 6d §6). Cablearlo = leer `--bbf-bp-nav` en `HeroMedia` y elegir la fuente antes de reproducir; cero cambios en el guion ni en la guardia. |
| Herramienta | ffmpeg (§4), nunca de producción. |
| Guardia | La misma: R1 maestro ⇔ lock, R2 derivado ⇔ lock, R5 versión de ffmpeg, **R6 presupuesto**. |

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
*BBW-MEDIA-CONTRACT v1.1 · `docs/system/MEDIA.md` · 2026-09-17 (v1.1 fase 6d: vídeo del héroe, D-BBW-24, `DESPACHO-BBW-2026-09-17-fase6d-copy-video-y-fondo`) · nace en la fase 6c (`DESPACHO-BBW-2026-09-17-fase6c-sistema-de-medios-foco-y-piezas`, D-BBW-21)*
