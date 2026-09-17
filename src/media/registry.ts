/**
 * REGISTRO DEL PUERTO DE MEDIOS — la declaración (D-BBW-21; contrato en docs/system/MEDIA.md; fila "Medios" en docs/system/PORTS.md).
 *
 * · MAESTRO = la fuente única de un medio, lo único que se edita a mano. Vive en `media/masters/` (fuera de public/ y de src/).
 * · DERIVADO = lo que se sirve. Lo produce `scripts/media/build.ts` desde el maestro con el PERFIL declarado aquí y se versiona en
 *   `public/` (o, para los vectores que van inline, en `src/media/generated.ts`). NUNCA se edita: la guardia `scripts/lint/check-media.ts`
 *   compara cada derivado y cada maestro con `media/derivatives.lock.json` y rompe el build si algo no corresponde.
 * · NOMENCLATURA por ROL y DIMENSIÓN (`icon-192.png`, `share-1200x630.png`), nunca por lo que el medio muestra.
 * · Este archivo no importa nada de Node: lo leen el guion, la guardia y (vía `src/media/index.ts`) los componentes.
 * · Los colores de los derivados opacos (fondo del icono de Apple, del manifiesto y de la imagen para compartir) salen del ROL de superficie
 *   del sistema (`SURFACE_TOKEN`), resuelto por el guion desde los tokens: ningún color escrito a mano.
 *
 * CLASE (D-DOC-13): la forma (maestro/derivado/perfil/lock) = estático · los perfiles del conjunto de iconos y de la imagen para compartir =
 * plantilla (valores de industria verificados 2026-09-17) · qué maestros hay = dinámico.
 */

export const MASTERS_DIR = "media/masters";
export const PUBLIC_DIR = "public";
export const LOCK_FILE = "media/derivatives.lock.json";
export const GENERATED_FILE = "src/media/generated.ts";
/** Rol de superficie que reciben los derivados opacos. Resuelto a sRGB por el guion desde src/styles/tokens (nunca un valor aquí). */
export const SURFACE_TOKEN = "--bbf-surface-base";

export type MasterKind = "svg" | "video";
export type Master = { file: string; kind: MasterKind; origin: string };

/** Maestros. `origin` documenta de dónde salió el archivo: un maestro no se dibuja, se trae del diseño (despacho 6c §5). */
export const masters = {
  brandIcon: {
    file: "brand-icon.svg",
    kind: "svg",
    origin: "diseño inventariado (OUTPUT-BBW-2026-09-16-N0 §2.1, assets/bb-icon.svg), copiado byte a byte 2026-09-17; conserva su manifiesto de procedencia C2PA",
  },
  iconLinkedin: { file: "icon-linkedin.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, iconos sociales, path inline), 2026-09-17" },
  iconGithub: { file: "icon-github.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, iconos sociales, path inline), 2026-09-17" },
  underlineWaveNav: { file: "underline-wave-nav.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, onda de subrayado 160×7), 2026-09-17" },
  underlineWaveMenu: { file: "underline-wave-menu.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, onda de la hoja 340×9), 2026-09-17" },
  toggleArmTop: { file: "toggle-arm-top.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, brazo superior del conmutador 34×6), 2026-09-17" },
  toggleArmBottom: { file: "toggle-arm-bottom.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, brazo inferior del conmutador 34×6), 2026-09-17" },
  /**
   * Vídeo del héroe (D-BBW-24, fase 6d). MAESTRO DE REGISTRO, no el render original: el diseño (N0 §2.1, `assets/fish-loop.mp4`) solo trae un
   * H.264 1280×720 · 24 fps · 8 s · 192 fotogramas YA COMPRIMIDO (1,7 Mbit/s) y CON PISTA AAC. Recomprimir arrastra sus defectos (techo de
   * calidad); se acepta porque es el mejor archivo disponible y SE REGENERA el día que exista el original (sustituir este archivo +
   * `pnpm media:build`). Los perfiles eliminan el audio: un fondo decorativo no reproduce sonido.
   */
  heroLoop: {
    file: "hero-loop.mp4",
    kind: "video",
    origin: "diseño inventariado (N0 §2.1, assets/fish-loop.mp4 ≡ uploads/Crystal_fish_with_human_eye_20260915110026.mp4); dejado por Zavala en public/bb-landing-hero.mp4 el 2026-09-17 y movido aquí el mismo día. Ya comprimido, con audio: maestro de registro (D-BBW-24)",
  },
} as const satisfies Record<string, Master>;
export type MasterId = keyof typeof masters;

/**
 * Perfiles de salida. Cada uno es una transformación determinista del maestro:
 *   svg-copy  · copia byte a byte (el SVG ya es escalable; el navegador lo lee y lo escala).
 *   png       · rasterización a `size`×`size`; `background` = transparente o la superficie del sistema; `padding` = fracción del lado
 *               reservada alrededor del dibujo; `safeZone` = el dibujo cabe en el cuadrado inscrito en el círculo central de radio 40 %
 *               (icono recortable de Android: el lanzador recorta con formas distintas; verificado por el guion píxel a píxel).
 *   ico       · contenedor .ico con las rasterizaciones PNG de `sizes` (respaldo para lo que aún pide /favicon.ico).
 *   share     · lienzo `width`×`height` sobre la superficie del sistema con el dibujo centrado a `iconHeight` (fracción de la altura).
 *   manifest  · el manifiesto de la aplicación web, que referencia los derivados `icons` y toma sus colores de la superficie.
 */
/**
 * PERFILES DE VÍDEO (fase 6d, D-BBW-24; contrato MEDIA.md §6). Herramienta de desarrollo: ffmpeg (CLI determinista con parámetros fijos y un
 * solo hilo; versión registrada en el lock y comprobada por la guardia R5). Nunca de producción: `pnpm build` no la invoca.
 *   video   · transcodifica el maestro SIN AUDIO a `width`×`height` con el códec dado: `h264` (MP4, respaldo universal: libx264, CRF `quality`)
 *             o `av1` (WebM, formato moderno: SVT-AV1, CRF `quality`; solo existe si el ahorro medido lo justificó, MEDIA.md §6).
 *             `budgetBytes` = presupuesto de peso del perfil, comprobado por la guardia (R6).
 *   poster  · el PRIMER FOTOGRAMA EXACTO del maestro (para que el bucle arranque sin salto) como imagen raster `format` a `quality`,
 *             con su presupuesto. Es lo que se ve mientras el vídeo carga y lo que se sirve con movimiento reducido.
 */
export type VideoCodec = "h264" | "av1";
export type Profile =
  | { kind: "svg-copy" }
  | { kind: "video"; codec: VideoCodec; width: number; height: number; quality: number; budgetBytes: number }
  | { kind: "poster"; width: number; height: number; format: "jpeg" | "webp"; quality: number; budgetBytes: number }
  | { kind: "png"; size: number; background: "transparent" | "surface"; padding: number; safeZone?: true }
  | { kind: "ico"; sizes: readonly number[] }
  | { kind: "share"; width: number; height: number; iconHeight: number }
  | { kind: "manifest"; icons: readonly string[] };

export type Derivative = { master: MasterId; path: string; profile: Profile; role: string };

/**
 * CONJUNTO VIGENTE de iconos y manifiesto (industria verificada en vivo 2026-09-17: evilmartians.com "How to favicon", web.dev
 * "maskable-icon", MDN "Define app icons") + la imagen para compartir (developers.facebook.com: ≥ 1200×630, 1,91:1).
 * Sin los tamaños obsoletos (16/32/48/96 sueltos, la docena de Apple, tiles de Windows): servir peticiones que ya nadie hace.
 */
export const derivatives = {
  icon: { master: "brandIcon", path: "icon.svg", profile: { kind: "svg-copy" }, role: "icono escalable: pestaña del navegador y marca en la cabecera" },
  favicon: { master: "brandIcon", path: "favicon.ico", profile: { kind: "ico", sizes: [16, 32, 48] }, role: "respaldo .ico multi-tamaño (agrupa los tamaños pequeños)" },
  appleTouchIcon: {
    master: "brandIcon",
    path: "apple-touch-icon-180.png",
    profile: { kind: "png", size: 180, background: "surface", padding: 1 / 9 },
    role: "icono de Apple 180, OPACO sobre la superficie (iOS compone sobre un mosaico: la transparencia se ve negra)",
  },
  icon192: { master: "brandIcon", path: "icon-192.png", profile: { kind: "png", size: 192, background: "transparent", padding: 0 }, role: "manifiesto, 192" },
  icon512: { master: "brandIcon", path: "icon-512.png", profile: { kind: "png", size: 512, background: "transparent", padding: 0 }, role: "manifiesto, 512" },
  icon512Maskable: {
    master: "brandIcon",
    path: "icon-512-maskable.png",
    profile: { kind: "png", size: 512, background: "surface", padding: 0, safeZone: true },
    role: "manifiesto, 512 recortable: dibujo dentro de la zona segura central",
  },
  share: {
    master: "brandIcon",
    path: "share-1200x630.png",
    profile: { kind: "share", width: 1200, height: 630, iconHeight: 0.5 },
    role: "imagen para compartir (1,91:1). Sin texto: cero copy de marca. Se cablea en la capa semántica (fase 7)",
  },
  manifest: {
    master: "brandIcon",
    path: "manifest.webmanifest",
    profile: { kind: "manifest", icons: ["icon192", "icon512", "icon512Maskable"] },
    role: "manifiesto de la aplicación web: iconos + color de tema y de fondo desde la superficie",
  },
  /**
   * VÍDEO DEL HÉROE (fase 6d, D-BBW-24; MEDIA.md §6). Solo H.264: el formato moderno (AV1, SVT-AV1) se midió y NO se justificó (a igual
   * peso, menos parecido al maestro: SSIM 0,990 a 604 KB frente a 0,995 del H.264 a 598 KB; su SSIM se estanca en 0,991 hasta 995 KB).
   * Calidad = CRF 23 (el valor por defecto de x264, no una elección). Presupuestos: 720p ≤ 1 000 000 B (la mitad del maestro y un quinto del
   * umbral de peso total de página de Lighthouse, 5 000 KiB, leído en vivo 2026-09-17) · 360p ≤ 400 000 B · póster ≤ 60 000 B.
   * El perfil 360p es el ligero para pantallas pequeñas; SERVIRLO según la pantalla es entrega adaptativa y este turno no la cablea (despacho 6d §6).
   */
  heroLoop720: {
    master: "heroLoop",
    path: "hero-loop-1280x720.mp4",
    profile: { kind: "video", codec: "h264", width: 1280, height: 720, quality: 23, budgetBytes: 1_000_000 },
    role: "fondo del héroe, respaldo universal H.264 a la resolución del maestro; sin audio",
  },
  heroLoop360: {
    master: "heroLoop",
    path: "hero-loop-640x360.mp4",
    profile: { kind: "video", codec: "h264", width: 640, height: 360, quality: 23, budgetBytes: 400_000 },
    role: "fondo del héroe, perfil ligero para pantallas pequeñas (previsto por el puerto; no servido aún: la entrega adaptativa no se cablea en la 6d)",
  },
  heroLoopPoster: {
    master: "heroLoop",
    path: "hero-loop-poster-1280x720.jpg",
    profile: { kind: "poster", width: 1280, height: 720, format: "jpeg", quality: 80, budgetBytes: 60_000 },
    role: "póster del vídeo: primer fotograma exacto; lo que se ve mientras carga y lo que se sirve con movimiento reducido (JPEG: formato universal, un solo URL en `poster`)",
  },
} as const satisfies Record<string, Derivative>;
export type DerivativeId = keyof typeof derivatives;

/**
 * Vectores que van INLINE en los componentes (pintan con `currentColor` y se dimensionan por tokens): el derivado es el par
 * viewBox + trazado extraído del maestro y escrito en `src/media/generated.ts`. `paint` dice si el maestro es relleno o trazo;
 * `use` distingue los iconos de perfil (los resuelve `iconFor(id)` desde el contenido) de los ornamentos (los pide un componente por nombre).
 */
export type InlineIcon = { master: MasterId; paint: "fill" | "stroke"; use: "profile" | "ornament" };
export const inlineIcons = {
  linkedin: { master: "iconLinkedin", paint: "fill", use: "profile" },
  github: { master: "iconGithub", paint: "fill", use: "profile" },
  underlineWaveNav: { master: "underlineWaveNav", paint: "stroke", use: "ornament" },
  underlineWaveMenu: { master: "underlineWaveMenu", paint: "stroke", use: "ornament" },
  toggleArmTop: { master: "toggleArmTop", paint: "stroke", use: "ornament" },
  toggleArmBottom: { master: "toggleArmBottom", paint: "stroke", use: "ornament" },
} as const satisfies Record<string, InlineIcon>;
export type InlineIconId = keyof typeof inlineIcons;

/** Archivos de public/ que NO son derivados de un maestro (hoy ninguno). La guardia rechaza cualquier archivo no declarado aquí ni arriba. */
export const publicAllowList: readonly string[] = [];
