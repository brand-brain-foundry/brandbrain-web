---
id: BBW-MEDIA-CONTRACT
title: "Contrato del puerto de medios — brandbrain-web"
type: canon
status: VIGENTE
version: 1.12
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-17
updated: 2026-11-08
verified_against_code: 2026-11-08@feat/perfil-p4 (v1.12: §3 y §12 — vídeo de las fichas de proyectos: 3 maestros-fragmento `card-*.mp4`, recorte `crop: "center"` en los perfiles `video`/`poster`, CLIPS (`mediaClips` → `generated.ts` → `mediaClip(id)`), derivados 640×480 con presupuesto; src/media/{registry,index,generated}.ts · scripts/media/build.ts · media/derivatives.lock.json · content/es/pages/perfil.json) · 2026-11-08@feat/perfil-p2b-216 (v1.11: §3 y §10 — perfil propio `jpeg-disc` para el retrato del cierre (lado = rol de longitud × densidad, sin `minPixels`), derivados 216/432, guardia R11 «disco en su uso»; src/media/{registry,generated}.ts · scripts/media/{build,tokens}.ts · scripts/lint/check-media.ts · media/derivatives.lock.json) · 2026-11-08@feat/perfil-p2b (v1.10: §10 — retrato del cierre a 240/480 (D-BBW-111, un peldaño abajo); src/media/{registry,generated}.ts · media/derivatives.lock.json) · 2026-11-08@feat/perfil-r3 (v1.9: §11 — lote `perfil` real (4 medios) y miembro por REFERENCIA: enlace simbólico a un maestro declarado, vigilado por R10; scripts/media/batches.ts · media/masters/campo/perfil/ · content/site.json `$.fieldMedia`) · 2026-11-08@feat/perfil-p2 (v1.8: §10 — retrato del cierre en círculo: derivados `portrait-252x252.jpg` / `portrait-504x504.jpg` (1× y 2× del tamaño mostrado, q 82) en el `srcset`; el de 1200 sigue de `src` y en `Person.image`) · 2026-11-08@feat/perfil-r2 (v1.7: §11 LOTES DEL CAMPO — carpeta por uso `media/masters/campo/<uso>/`, perfil `field-batch` (cuadrado por punto focal del contenido, 480 px, JPEG/H.264), `fieldBatches` en generated.ts y en el lock, guardia R9/R10 y R1–R6 sobre cada medio; scripts/media/{build,batches,lock}.ts · scripts/lint/check-media.ts · src/media/{registry,index,generated}.ts) · 2026-11-08@feat/perfil-p1 (v1.6: maestro del retrato = `zavala-1` (1792×2400) con el nombre del rol, perfil `jpeg-crop` por PUNTO FOCAL `focusY`, recortes de 1200; scripts/media/build.ts · src/media/{registry,generated}.ts · media/derivatives.lock.json) · 2026-11-07@feat/posicionamiento-s3c (v1.5: maestro raster `portrait.jpg`, perfil `jpeg-crop`, conjunto `mediaSets.portrait` generado en src/media/generated.ts; scripts/media/build.ts · src/media/{registry,index,generated}.ts) · 2026-11-06@fix/m1d-imagotipo-identico (v1.4: rig derivado con línea central exacta, M1d) · 2026-11-05@feat/m1-imagotipo-vivo (v1.3: §9 rig del imagotipo vivo como maestro de configuración, sin derivados, verificado por guardia R10; M1, `DESPACHO-BBW-2026-11-05-M1-imagotipo-vivo`) · 2026-09-29@feat/video-del-heroe-nuevo-maestro (v1.2: maestro nuevo del vídeo del héroe, el anterior conservado como variante `-registro` sin derivados, comparación de formatos rehecha; v1.1: vídeo del héroe con maestro de registro, perfiles video/poster, ffmpeg como herramienta de desarrollo, guardia R5 ampliada y R6 presupuesto; v1.0: media/masters/ · src/media/registry.ts · scripts/media/build.ts · scripts/lint/check-media.ts · media/derivatives.lock.json · public/ · src/media/generated.ts)
supersedes: []
superseded_by: null
related: [BBW-PORTS, BBW-PLAN-CONSTRUCCION, BBW-CONTENT-MODEL, D-BBW-21, D-BBW-24, D-BBW-02, D-BBW-03, D-BBW-09]
summary: "Todo medio tiene un MAESTRO (fuente única, se edita a mano, media/masters/) y DERIVADOS (se generan por guion determinista con un perfil declarado, se versionan en public/ y nunca se editan). Un guardia comprueba la correspondencia maestro ⇔ derivados por hash. Nomenclatura por rol y dimensión. Adaptador actual: servidos desde el propio sitio; alternativa: almacenamiento externo. Hoy: el conjunto vigente de iconos + manifiesto y la imagen para compartir desde el icono de marca; el vídeo del héroe (D-BBW-24) desde el maestro nuevo del 2026-09-29 (H.264 1504×846 a 10 Mbit/s, fuente limpia; el maestro de registro comprimido de la 6d se conserva sin derivados): H.264 sin audio en dos tamaños + póster del primer fotograma, con presupuesto de peso por perfil comprobado por el guardia. Con esta fuente el formato moderno (AV1) SÍ ahorra a igual parecido (−17 %); no se aplica sin firma. v1.4 (M1c): el rig del imagotipo vivo es un derivado del perfil `rig` (anatomía derivada del maestro al compilar, en generated.ts, sellado en el lock, verificado por R10), no un maestro."
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
**Los maestros también se nombran por rol** (`media/masters/<rol>.<ext>`), **nunca por versión:** el archivo con el nombre del rol es EL QUE MANDA.
Cuando un maestro se sustituye y el anterior se conserva (2026-09-29, vídeo del héroe), el anterior pasa a una **variante con sufijo**
(`hero-loop-registro.mp4`), declarada en el registro **sin derivados**: la guardia sella su hash (R1) y lo exige en el lock (R3), así que no
puede cambiar ni desaparecer en silencio, y dentro de un año se lee cuál alimenta el sitio sin abrir ningún registro: el del rol.

**Cuál de los dos vídeos recibe cada pantalla (D-BBW-46).** El `<video>` declara **las dos** fuentes con condición de pantalla, de la más restrictiva a
la más general: **`640×360` por debajo de `--bbf-bp-nav` (790 px desde D-BBW-79; 780 hasta entonces)** y `1280×720` por encima. Sin esa condición la primera fuente gana siempre y un
teléfono se descargaba el derivado grande teniendo el pequeño: medido el 2026-09-19 a 360 px, **871,8 KB de los 1.187 KB** de la página. El navegador
elige **una vez, al cargar**, y no rectifica al girar el teléfono: es lo que se quiere, que nadie se traiga dos vídeos. Construir un derivado no basta
para que alguien lo reciba — hay que declarar **cuándo**.
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
| vectores inline | viewBox + trazado del maestro → `generated.ts`; pintan con `currentColor`, se dimensionan y trazan por tokens (`Icon` atom). | icono de LinkedIn, brazos del conmutador y las flechas de los botones del cuerpo. **2026-11-02:** salen el icono de GitHub y las ondas del subrayado |
| `png-resize` (2026-11-02) | Redimensiona un maestro **raster** (clase `raster`, PNG) a `size`² con lanczos3 y conserva la transparencia; sharp. | sello del pie, `gc-foundational-72.png` y `-144.png` |
| `video` (fase 6d) | Transcodifica un maestro de vídeo **sin audio** a `width`×`height` (Lanczos; con `crop: "center"`, P4, antes recorta la caja más grande de la proporción del perfil, centrada) con `codec` `h264` (MP4, libx264, CRF `quality`, preset slow, High 4.0, `+faststart`) o `av1` (WebM, SVT-AV1, CRF `quality`, preset 4); **un solo hilo** y sin metadatos (`bitexact`) para que la salida sea idéntica entre máquinas; GOP 48 (2 s a 24 fps). El guion sondea el derivado (ffprobe): sin pista de audio y con las dimensiones del perfil, o falla. **`budgetBytes`** = presupuesto de peso; pasarse hace fallar el guion y la guardia (R6). | **Hoy (P4):** `card-{agency,studio,works}-640x480.mp4` (CRF 23, recorte centrado, ≤ 900 000 B; §12). *(Fase 6d, retirados 2026-11-02: `hero-loop-1280x720.mp4` ≤ 1 000 000 B · `hero-loop-640x360.mp4` ≤ 400 000 B.)* |
| `poster` (fase 6d) | El **primer fotograma exacto** del maestro (fotograma 0, sin pérdida vía PNG) codificado por sharp a `format` (`jpeg` mozjpeg 4:2:0 o `webp`) a `quality`, con `budgetBytes`. Es lo que se ve mientras el vídeo carga y lo que se sirve con movimiento reducido; un solo URL (`poster`), por eso JPEG (universal). | **Hoy (P4):** `card-{agency,studio,works}-poster-640x480.jpg` (q 80, recorte centrado, ≤ 60 000 B; §12). *(Fase 6d, retirado: `hero-loop-poster-1280x720.jpg`.)* |
| `jpeg-crop` (S3c; foco P1) | Recorte de proporción `aspect` por punto focal, escalado a `width` sin ampliar; rompe por debajo de `minPixels` (≥ 50 000: el suelo de Google para las imágenes que declaran los datos estructurados). §10. | `portrait-1200x{1200,900,675}.jpg` (`Person.image`) |
| `jpeg-disc` (P2b-216, D-BBW-111) | El mismo recorte 1:1 para una imagen que **solo se muestra**: el lado NO se escribe, es el rol de longitud `sizeToken` (resuelto de los tokens) × `density`. Su suelo es cubrir su caja a esa densidad sin que el navegador amplíe; no lleva `minPixels`. **Solo en su uso** (guardia R11). §10. | `portrait-216x216.jpg` y `-432x432.jpg` (cierre del perfil) |

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

> **2026-11-02 (orden de Zavala): el pez sale del héroe.** Salen `HeroMedia` y los tres derivados (720p, 360p, póster). **Los dos maestros se
> conservan declarados y sellados, sin derivados**, igual que el de registro: el pez vuelve con declarar de nuevo sus perfiles y `pnpm media:build`.
> Lo que sigue describe el contrato tal como era.

**Decisión (D-BBW-24, 2026-09-17):** el vídeo del héroe es **fondo decorativo**: silencio, bucle, sin controles, sin pantalla completa (las
condiciones sin las cuales ningún navegador lo reproduce solo; MDN `<video>` y guía de autoplay, leídos en vivo 2026-09-17: el bloqueo de
autoplay no aplica a medios silenciados o sin pista de audio; `playsinline` es obligatorio en Safari). **El audio se elimina de todos los
derivados.** Lleva **póster** (lo que se ve mientras carga y lo que se sirve con movimiento reducido) y se declara **decorativo** para las
tecnologías de asistencia: toda la información está en el texto.

| Aspecto | Contrato (vigente) |
|---|---|
| Maestro | `media/masters/hero-loop.mp4` — **maestro NUEVO (2026-09-29, `DESPACHO-BBW-2026-09-29-video-del-heroe-nuevo-maestro`):** render entregado por Zavala con otra técnica: H.264 High L3.2 · **1504×846** · **30 fps con cadencia real de 24** (47 fotogramas duplicados por conversión 4:5, con dos deslices en los fotogramas 90 y 215) · 8,000 s · 240 fotogramas · **10,06 Mbit/s** (10 077 031 B) · BT.709 rango vídeo · fotograma clave cada 1 s · **sin audio** · Mainconcept (Adobe). **Es una fuente más limpia** que la anterior: 5,9× la tasa de bits, bloqueo residual en la rejilla de 8 px 1,02–1,05 frente a 1,07–1,12 del anterior, y un derivado a CRF 23 que conserva más del maestro (SSIM 0,9969 frente a 0,9964). El guion no toca la cadencia: los derivados salen a 30 fps con los duplicados (que cuestan ~0 B) y el GOP 48 pasa a ser 1,6 s. **Composición y movimiento coinciden** con el maestro anterior (SSIM media 0,953 fotograma a fotograma), **el aspecto no**: el pez alterna tres acabados por tramos (cristal, ámbar con venas, boceto a lápiz), registrado en el output del despacho para decisión de Zavala. **El maestro anterior se conserva** como `hero-loop-registro.mp4` (H.264 1280×720 · 24 fps · 192 fotogramas · 1,7 Mbit/s · con AAC · recomprimido por Google): maestro de registro de la 6d, declarado sin derivados. `origin` de los dos en el registro. |
| Perfiles | `video h264 1280×720 crf 23` (respaldo universal, a la resolución del maestro) · `video h264 640×360 crf 23` (perfil ligero para pantallas pequeñas) · `poster jpeg 1280×720 q 80` (primer fotograma exacto). CRF 23 = valor por defecto de x264, no una elección; q 80 = valor por defecto de sharp. |
| Formato moderno | **Medido dos veces.** (1) 2026-09-17, sobre el maestro de registro comprimido: AV1 (SVT-AV1 4.1.0, preset 4) a CRF 30 pesaba 604 KB con SSIM 0,990, mientras H.264 a CRF 26 pesaba 598 KB con SSIM 0,995: **no justificado**, no se generó. (2) **2026-09-29, sobre el maestro nuevo, misma métrica** (SSIM frente al maestro escalado a 720p, fotogramas emparejados por índice): H.264 CRF 23 (el derivado servido) 796 865 B · SSIM 0,99688 · peor fotograma 0,9951; **AV1 CRF 30 662 160 B · SSIM 0,99704 · peor fotograma 0,9954**. A igual parecido el formato moderno pesa **un 17 % menos**, y a igual peso (≈ 640 KB) conserva más (0,99704 frente a 0,99616 del H.264 CRF 25). **El ahorro ya está medido y justifica la alternativa según D-BBW-24, pero el cambio de formato lo firma Zavala: NO aplicado**, sigue sirviéndose solo H.264. El perfil `av1` del guion está listo (`<source type="video/webm; codecs=av01">` delante del MP4). Tabla completa en el output del despacho. |
| Presupuesto de peso (R6) | 720p ≤ 1 000 000 B (la mitad del maestro de la 6d y un quinto del umbral de peso total de página que Lighthouse marca, 5 000 KiB, leído en vivo 2026-09-17) · 360p ≤ 400 000 B · póster ≤ 60 000 B. **Reales (2026-09-29, maestro nuevo):** 796 865 B (80 %) · 337 674 B (84 %) · 32 027 B (53 %). *(2026-09-17, maestro de registro: 891 885 · 315 107 · 35 496.)* Pasarse rompe el guion y la guardia: bajar calidad o resolución es decisión con consecuencias visibles, no un hecho consumado. |
| Nomenclatura | `hero-loop-1280x720.mp4` · `hero-loop-640x360.mp4` · `hero-loop-poster-1280x720.jpg` |
| Entrega | `HeroMedia` (molecule, cliente): `<video autoplay muted loop playsinline disablepictureinpicture preload="metadata" poster width height>` con `<source type>` (hoy uno: MP4) y `aria-hidden`; una `<img>` con el póster como imagen fija. **Movimiento reducido:** el rol `--bbf-motion-media-display` / `--bbf-motion-still-display` (`semantic/motion.css`) esconde el vídeo y muestra la imagen fija, sin JavaScript. **Pestaña oculta:** se pausa y se reanuda al volver (Page Visibility API); es lo único que hace el cliente. El póster es el candidato LCP más temprano (web.dev: "the poster image load time or first frame presentation time — whichever is earlier"). |
| Tamaños y entrega adaptativa | El HTML sirve el 720p a todo el mundo. El 360p **existe, se presupuesta y se guarda**, pero no se selecciona por pantalla: `<source media>` no es fiable dentro de `<video>` y elegirlo por JavaScript es entrega adaptativa, que este turno no cablea (despacho 6d §6). Cablearlo = leer `--bbf-bp-nav` en `HeroMedia` y elegir la fuente antes de reproducir; cero cambios en el guion ni en la guardia. |
| Herramienta | ffmpeg (§4), nunca de producción. |
| Guardia | La misma: R1 maestro ⇔ lock, R2 derivado ⇔ lock, R5 versión de ffmpeg, **R6 presupuesto**. |
| Póster y reposo | El póster es el fotograma 0 exacto del maestro (MAD 0,41/255 frente a él, el error del JPEG q 80); el fotograma 0 del derivado difiere del póster en **1,38/255 de media** (el error del H.264 a CRF 23, antes 0,60 con la fuente ya comprimida) y del fotograma 1 en 0,05: **no hay salto al arrancar el bucle**. Vídeo e imagen fija llevan el mismo encuadre de reposo en el HTML servido (6j). |
| Garantía y seguimiento con el maestro nuevo (2026-09-29) | Garantía D-BBW-25 recalculada entera (ciclo completo, ventana de traslación entera, píxel peor, cinco anchos): cumple con el velo al 48 %; el término que manda es la línea 1 del claim a 1000 px, **4,31 contra 3** (con el vídeo anterior 4,22); velo mínimo que cumple **36 %** (antes 36,9 %). El seguimiento persigue al sujeto con el vídeo nuevo (masa 87–199 sobre un mínimo de 0,6; traslación dentro de ±3,7037 %, sin tocar la cota) y el borde de la máscara no aparece. Cifras y método en el output del despacho. |

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

## §10 — El retrato y los conjuntos de recortes (S3c, D-BBW-91 · 2026-11-07; maestro y fórmula nuevos en P1, D-BBW-103 · 2026-11-08)

| | |
|---|---|
| Maestro | `media/masters/portrait.jpg` — desde P1 (D-BBW-103) el retrato `zavala-1` de la carpeta de la capa del perfil (JPEG sRGB **1792×2400**, 1 893 711 B, blanco y negro sobre fondo blanco, sin GPS), traído por Zavala a `media-entrantes/perfil/capa/`. **Conserva el nombre del rol** (§1: los maestros se nombran por rol, nunca por versión ni contenido): el despacho decía «el maestro pasa a `zavala-1`» y la regla manda; la procedencia la dice `origin`. El maestro de S3c (600×600) salió en el mismo commit (I-6). Vive UNA vez: la entidad (`$.entity.image`) lo referencia por su conjunto. |
| Perfil `jpeg-crop` | La caja más grande de la proporción `aspect` dentro del maestro, centrada en x y **centrada en y sobre el punto focal `focusY`** (y = focusY × alto − alto de la caja / 2, acotada al maestro; P1 sustituye el ancla `anchorY` de S3c: con un maestro vertical un ancla común cortaba el pelo en el 1:1 o la barbilla en el 16:9), escalada a `width` **sin ampliar nunca** el maestro, JPEG `quality` (mozjpeg, 4:4:4, sin metadatos); el guion rompe por debajo de `minPixels`. |
| Derivados | `portrait-1200x1200.jpg` (1:1, 156 742 B; sostiene el retrato circular del cierre, P2) · `portrait-1200x900.jpg` (4:3, 132 644 B) · `portrait-1200x675.jpg` (16:9, 106 740 B); `focusY` 0,42 (medido: de la frente a la barbilla en los tres; el 16:9 recorta el pelo, que no cabe en un 16:9 de un maestro vertical), q 90, ≥ 50 000 píxeles (Google, ProfilePage). Los de 600 de S3c salieron. |
| Retrato del cierre (P2, D-BBW-103; tamaño de P2b, D-BBW-111; 216 y perfil propio en P2b-216) | `portrait-216x216.jpg` (5 642 B) y `portrait-432x432.jpg` (15 810 B): el MISMO recorte 1:1 (mismo `focusY`), servido al tamaño al que se muestra (`--bbf-profile-portrait-size`, **216 px CSS = 3 × `space-18`**, elección de Zavala; eran 240/480 en P2b y 252/504 en P2) con la densidad acotada a 2, en el `srcset` (1×, 2×) del `<img>` del cierre. **Perfil `jpeg-disc`, no `jpeg-crop`:** el `minPixels` 50 000 de `jpeg-crop` nace del uso «imagen declarada en datos estructurados» (Google, ProfilePage; `src/media/registry.ts`, comentario del tipo) y este disco no es una de ellas; con aquel suelo el 1× de 216 (46 656 px) no se podía generar. Su suelo propio: lado = el rol × la densidad, leído de los tokens por el guion (`resolveLengthToken`, `scripts/media/tokens.ts`; el rol se declara una sola vez y el nombre del archivo debe decir el lado). El de 1200 (159 KB) queda como `src` (R7g lo busca y `Person.image` lo cita) y el navegador que entiende `srcset` no lo descarga (medido a ×1/×2/×3). **R11 (`check-media.ts`):** un `jpeg-disc` (a) no puede ser miembro de un conjunto, (b) no lo puede nombrar ningún campo de `$.entity`, (c) mide exactamente el rol × la densidad (token cambiado sin regenerar = error). El guion rechaza también (a). |
| Conjunto | `mediaSets.portrait` = los tres, en orden, declarado en el registro y **escrito en `generated.ts`** (los consumidores lo leen de allí: `src/media/index.ts` lo importan componentes cliente y el registro no debe viajar al navegador — medido en S3c: importarlo metía el registro entero en el fragmento compartido). `MEDIA_IDENTIFIERS` = derivados + conjuntos (lo que la entidad puede referenciar); `mediaMembers(id)` = los derivados que nombra |
| Uso | La página de perfil muestra el PRIMERO en un `<img>` real (Google no indexa imágenes de CSS) con sus dimensiones intrínsecas; `Person.image` emite los tres |

## §11 — Lotes del campo (S12, R2 del perfil · 2026-11-08; P-BBW-98 §3.2, D-BBW-96)

La capa de medios del campo S8 (BEHAVIOR.md §15) toma sus medios de un **lote**: la carpeta de un USO. Lo que cambia frente a §5 es que **nadie
escribe la lista** de un lote: la carpeta ES la lista.

| | |
|---|---|
| Dónde | `media/masters/campo/<uso>/` (hoy un uso declarado: `perfil`, con 4 medios desde R3: `christian-3`, `crystal-fish-with-human-eye` (vídeo), `sc`, `zavala-1` por referencia). Cada archivo de la carpeta es un maestro del lote, en **orden de nombre**. Carpeta ausente o vacía = **lote vacío** = el campo de hoy (la capa ni se descarga). **Miembro por referencia (R3, I-1):** un medio que ya es maestro de otro rol entra como **enlace simbólico** a ese maestro (`perfil/zavala-1.jpg` → `../../portrait.jpg`), nunca como copia; solo vale si resuelve a un maestro declarado en `masters` (R10). |
| Declaración | `src/media/registry.ts` → `fieldBatches` (el uso existe) + `FIELD_BATCH_PROFILE` (común). Un subdirectorio de `campo/` sin uso declarado rompe (R10). |
| Nombre | El del archivo sin extensión, `^[a-z0-9][a-z0-9-]*$` (`zavala-1.jpg`): es el que cita el punto focal y el que se lee en el lock. Extensiones: imagen `.jpg .jpeg .png .webp`, vídeo `.mp4 .mov .webm`; otra rompe (R10). |
| Punto focal | **Lo declara el CONTENIDO** (despacho R2 §2.2): `content/site.json` → `$.fieldMedia.<uso>.<nombre> = { x, y }` (fracciones del ancho y del alto del maestro, tal como se ve: la orientación EXIF se aplica antes). **Sin entrada, el centro.** Un punto de un medio que no está en la carpeta rompe (R10). |
| Perfil `field-batch` | El **cuadrado más grande** que cabe en el maestro, **centrado en su punto focal** y sin salirse, escalado a **480×480** (lanczos3; nunca amplía: un maestro de lado corto < 480 rompe). Imagen → JPEG q 82 (mozjpeg, 4:4:4, sin metadatos), **≤ 80 000 B**. Vídeo → H.264 (los parámetros del perfil `video`: CRF 23, preset slow, High 4.0, un hilo, `+faststart`, bitexact) **sin audio**, recortado igual, **≤ 8 s**, **≤ 600 000 B**; el guion lo sondea (sin pista de audio, 480×480). **Una sola proporción para todos**: cualquier medio sirve en cualquier caja de la capa, que es cuadrada. Lado 480 = el tope de la capa a 2× en la ventana más grande medida (1920×1080 → 199,8 px CSS). |
| Derivado | `public/campo-<uso>-<nombre>-480x480.(jpg\|mp4)` (rol · uso · dimensión; el nombre distingue los miembros). |
| Puerto | `generated.ts` → `fieldBatches.<uso> = [{ id, kind, src, type, side }]`; `src/media/index.ts` → `fieldBatch(uso)` (`[]` si vacío) y `FIELD_BATCH_IDS` (lo que el contenido puede citar en `HeroSection.fieldMedia`). |
| Lock | `batches.<uso>.<nombre>` = maestro (archivo + sha256), clase, **punto focal sellado** (`x,y`), ruta, perfil, sha256, bytes y presupuesto del derivado (y pistas, si es vídeo). `tool.ffmpeg` aparece cuando un lote trae vídeo. |
| Guardia | `check-media.ts`: **R1** maestro del lote ⇔ lock · **R2** derivado ⇔ lock · **R3** el lock lista exactamente los medios de cada carpeta y los usos declarados · **R4** el derivado cuenta como declarado · **R6** presupuesto por archivo · **R9** el punto focal del contenido es el sellado (cambiarlo sin `pnpm media:build` rompe: el recorte ya no corresponde) · **R10** forma de la carpeta. Vistas fallar en `OUTPUT-BBW-2026-11-08-R2-perfil-capa-de-medios` §4. |
| Cómo se cambia | Subir/quitar/reemplazar un archivo de la carpeta (o mover su punto focal en `site.json`) → `pnpm media:build` → `pnpm lint:media`. Commit de maestro, contenido, lock, derivado y `generated.ts` juntos. Quién corre `media:build` cuando edita alguien no técnico sigue abierto (P-BBW-98 §7.10). |

## §12 — Vídeo de las fichas de proyectos (P4 del perfil · 2026-11-08; D-BBW-102, D-BBW-97)

Cada ficha de «Proyectos» de la página de perfil lleva en su ventana 4:3 un fragmento de un vídeo de Zavala: en reposo el **póster**, y el vídeo
solo cuando S14 lo arranca (BEHAVIOR.md §17). Es el mecanismo del vídeo del héroe (§6, I-6: perfiles `video` y `poster`), con dos piezas nuevas.

| | |
|---|---|
| Maestros | `media/masters/card-agency.mp4` · `card-studio.mp4` · `card-works.mp4` — **fragmentos de 8 s** de los vídeos de la carpeta de proyectos (Drive → `media-entrantes/perfil/proyectos/`), con los tramos que Zavala vio en P0 (decisión 10): Sivar Brains 8,5–16,5 s, Pura kaSaka 0–8 s, Trayectoria 1,5–9,5 s (el fotograma 0 de la fuente es negro). Cortados una vez con ffmpeg por **búsqueda exacta** (`-i <fuente> -ss <entrada> -t 8`: el primer fotograma con marca ≥ la entrada; comprobado: el fotograma 0 del maestro se parece más al fotograma de entrada de la fuente que al anterior, SSIM 0,991 frente a 0,974), sin audio ni metadatos, H.264 CRF 16 a la resolución y cadencia de la fuente (1920×1080 30 fps · 1280×720 24 fps · 1920×1080 23,976 fps): 13,6 · 8,1 · 27,1 MB, muy por debajo de los 100 MB de GitHub. Nombre por **rol** (la llave de enlace de la ficha), procedencia, tramo, tamaño y huella de la fuente en `origin`. |
| Recorte | `crop: "center"` (opcional en `video` y `poster`): la caja más grande de la proporción del perfil (4:3) que cabe en el maestro, **centrada** (16:9 → 4:3 quita 1/8 a cada lado; dimensiones pares calculadas por el guion con ffprobe), y después el escalado. Revisado sobre cuatro fotogramas de cada fragmento: la figura de «Trabajo anterior» y el texto de Sivar Brains caben en la franja central. Sin la llave, el comportamiento de la fase 6d (escalar tal cual). |
| Derivados | `card-<rol>-640x480.mp4` (H.264 CRF 23, el valor por defecto de x264 como el héroe; **≤ 900 000 B**) y `card-<rol>-poster-640x480.jpg` (fotograma 0, JPEG q 80; **≤ 60 000 B**). **Reales:** agency 577 211 B (64 %) / 20 440 B (34 %) · studio 717 771 B (80 %) / 29 889 B (50 %) · works 615 657 B (68 %) / 22 316 B (37 %). Lado: la ventana mide como mucho `--bbf-profile-card-max` (306 px CSS) a cualquier ancho; a densidad 2 pide 612 × 459 → 640 × 480, el peldaño 4:3 inmediato por encima (el navegador nunca amplía). Un solo tamaño: la ficha tiene el mismo tope en el teléfono. **Presupuesto del vídeo** sin cargo en el peso inicial (no se descarga hasta reproducirse, `preload="none"`); **el del póster sí cuenta**: se pide al pintar la página. |
| Póster = fotograma 0 | El fotograma 0 del vídeo servido se parece al póster más que el fotograma 1 en los tres (SSIM 0,987/0,982 · 0,985/0,982 · 0,983/0,893): no hay salto al arrancar. Vídeo y póster de un clip con tamaño o recorte distintos rompen el guion. |
| Clip | `mediaClips` en el registro: un identificador (`cardAgency`, …) → el vídeo y el póster del MISMO maestro. El guion lo valida (perfiles `video`/`poster`, mismo maestro, mismo tamaño y recorte) y lo escribe en `generated.ts`; `src/media/index.ts` → `mediaClip(id)` (ruta, tipo y dimensiones de los dos) y `MEDIA_CLIP_IDS` (lo que el contenido puede citar en `projects.items[].media`, CONTENT_MODEL v3.17). El componente nunca escribe una ruta ni una dimensión. |
| Entrega | `<video poster width height muted playsinline preload="none" disablepictureinpicture disableremoteplayback tabindex="-1">` con un `<source type="video/mp4">`, dentro de la ventana `aria-hidden` (decorativo: el nombre accesible es el texto de la ficha, y toda la ficha es el enlace). Sin `autoplay` ni `loop` en el HTML: los fija S14. Sin JavaScript: póster quieto y ningún vídeo pedido. |
| Guardia | La misma: R1/R2/R3 (maestro, derivados y `generated.ts` ⇔ lock), R5 (ffmpeg 9.0.2 del lock = instalado), **R6** presupuesto por archivo. Determinismo: dos `pnpm media:build` seguidos dan el mismo lock byte a byte. |

## §9 — Rig del imagotipo vivo (perfil `rig` → `src/media/generated.ts`, M1c · 2026-11-06)

El rig del imagotipo vivo (S9) **es un derivado, no un maestro** (M1c corrige a M1 §0.1 y a la v1.3 de este contrato): se deriva del maestro
`brand-icon.svg` con el perfil `rig` declarado en el registro (`rigs.brandIconRig`: `step` 0,5 u, `samples` 72) por el mismo guion que todo lo
demás (`pnpm media:build` → `scripts/media/brand-icon-rig.ts`), se escribe en `src/media/generated.ts` (`rigs`) y se sella en el lock
(`rigs.<id>.sha256` = huella del JSON derivado; la huella de `generated.ts` lo cubre también). Nadie lo edita: se regenera.

**Qué contiene (schema `brand-icon-rig/v3`):** `step`, `k`, `n` (muestras del contorno exterior), `l` (longitud del contorno) y seis tentáculos
con `id` (TR · MR · BR · BL · ML · TL, por orden angular de la punta), `start`/`end` (índices de la región en el contorno muestreado), `w` (mediana
de sección) y `l` (longitud) y `c` (línea central, 72 puntos a 0,001 u). Lo demás que el motor necesita (θ₀, longitudes de segmento, el marco
(k, t, u, v) de cada punto de la región, los tramos fijos del cuerpo) **se deriva al arrancar** con el mismo código que derivó el rig: una
sola fuente (I-1) y 3,6 KB comprimidos en vez de 28.

**Qué lo vigila:** `check-media.ts` R3 (el lock lista exactamente los rigs del registro; R2 cubre `generated.ts`) y la guardia **R10**
(`scripts/lint/check-brand-mark-rig.ts`, `pnpm lint:rig`, en `pnpm guard`): vuelve a derivar el rig del maestro y exige que coincida (R10c), y
**ejecuta el motor** sobre él (R10a amplitud 0 ⇒ el maestro; R10b sección y separación en 20 semillas × 200 fotogramas). Cambiar el maestro sin
regenerar rompe R1 (hash) y R10c.

**Cómo se modifica:** nunca a mano. Cambia el maestro o el perfil → `pnpm media:build` → `pnpm lint:rig`.

---
*BBW-MEDIA-CONTRACT v1.12 · `docs/system/MEDIA.md` · 2026-11-08 (v1.12: §3 y §12 vídeo de las fichas de proyectos — maestros-fragmento, recorte `center`, clips, 640×480 con presupuesto; P4 del perfil) · 2026-11-08 (v1.11: §3 y §10 perfil `jpeg-disc`, retrato del cierre 216/432, R11; P2b-216 del perfil) · 2026-11-08 (v1.10: §10 retrato del cierre 240/480; P2b del perfil) · 2026-11-08 (v1.9: §11 lote `perfil` real y miembro por referencia (enlace simbólico a un maestro declarado, R10); R3 del perfil) · 2026-11-08 (v1.8: §10 retrato del cierre 252/504; P2) · 2026-11-08 (v1.7: §11 lotes del campo, perfil `field-batch`, R9/R10; R2 del perfil) · 2026-11-08 (v1.6: §10 maestro `zavala-1`, punto focal, recortes de 1200; P1) · 2026-11-07 (v1.5: §10 retrato, perfil `jpeg-crop` y conjuntos de recortes; S3c) · 2026-11-06 (v1.4: §9 el rig pasa de maestro de configuración a derivado del perfil `rig`, sellado en el lock; M1c, `DESPACHO-BBW-2026-11-05-M1c-imagotipo-vivo-motor-y-guardia`) · v1.3: 2026-11-05 (M1) · v1.2: 2026-09-29 (`DESPACHO-BBW-2026-09-29-video-del-heroe-nuevo-maestro`) · v1.1 fase 6d: D-BBW-24 · nace en la fase 6c (D-BBW-21)*
