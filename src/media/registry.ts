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

/**
 * D-BBW-70 — CON QUÉ TOKEN SE PINTA UN MAESTRO. Un maestro que dibuja marca no lleva su color dentro: lo declara `currentColor` y el
 * generador lo resuelve AQUÍ, desde el rol, igual que ya hacía con la superficie de los derivados opacos. Así un cambio de acento se
 * propaga solo a favicon, iconos, recortable, Apple, imagen para compartir y el logo de la cabecera, sin tocar ningún archivo de dibujo.
 * Un maestro sin entrada aquí se queda con su `currentColor` sin resolver — que es lo correcto para los vectores que se pintan por CSS
 * (las ondas de subrayado, los brazos del conmutador, los iconos de perfil): esos heredan el color del texto donde se insertan.
 */
export const MASTER_PAINT_TOKENS: Partial<Record<MasterId, string>> = {
  brandIcon: "--bbf-accent",
};

export type MasterKind = "svg" | "video" | "raster";
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
  toggleArmTop: { file: "toggle-arm-top.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, brazo superior del conmutador 34×6), 2026-09-17" },
  toggleArmBottom: { file: "toggle-arm-bottom.svg", kind: "svg", origin: "diseño inventariado (N0 §2.3, brazo inferior del conmutador 34×6), 2026-09-17" },
  /**
   * Vídeo del héroe (D-BBW-24, fase 6d). `heroLoop` es EL MAESTRO QUE MANDA: el archivo con el nombre del rol (`hero-loop.mp4`) es el que
   * alimenta los tres derivados. 2026-09-29: Zavala entrega un render nuevo hecho con otra técnica (H.264 High 1504×846 · 30 fps con cadencia
   * real de 24 fps por duplicación 4:5 · 8 s · 240 fotogramas · 10,1 Mbit/s · sin audio · Mainconcept/Adobe), una fuente más limpia que el
   * maestro de registro anterior (1,7 Mbit/s, un solo fotograma clave, recomprimido por Google). El anterior NO se borra: queda declarado
   * abajo como `heroLoopRegistro` con el sufijo de variante `-registro`, sin derivados. La nomenclatura del contrato (rol, no versión) es la
   * que dice cuál manda: el rol es `hero-loop`; lo demás son variantes conservadas.
   */
  heroLoop: {
    file: "hero-loop.mp4",
    kind: "video",
    origin: "render nuevo entregado por Zavala el 2026-09-29 como media/masters/hero-loop-2.mp4 (10 077 031 B, H.264 1504×846 30 fps, sin audio) y renombrado al rol el mismo día (DESPACHO-BBW-2026-09-29-video-del-heroe-nuevo-maestro). Sustituye al maestro de registro de la 6d, que se conserva como hero-loop-registro.mp4",
  },
  /**
   * MAESTRO DE REGISTRO anterior (fase 6d, D-BBW-24): H.264 1280×720 · 24 fps · 8 s · 192 fotogramas YA COMPRIMIDO (1,7 Mbit/s) y CON PISTA
   * AAC. Fue el techo de calidad hasta el 2026-09-29. Se conserva SIN DERIVADOS por decisión del despacho («el maestro anterior no se borra»):
   * la guardia R1 sigue sellando su hash y R3 lo exige en el lock, así que no puede cambiar ni desaparecer en silencio. No alimenta nada.
   */
  heroLoopRegistro: {
    file: "hero-loop-registro.mp4",
    kind: "video",
    origin: "diseño inventariado (N0 §2.1, assets/fish-loop.mp4 ≡ uploads/Crystal_fish_with_human_eye_20260915110026.mp4); dejado por Zavala en public/bb-landing-hero.mp4 el 2026-09-17 y movido a media/masters/hero-loop.mp4 el mismo día; renombrado a hero-loop-registro.mp4 el 2026-09-29 al entrar el maestro nuevo. Ya comprimido, con audio: maestro de registro (D-BBW-24), conservado sin derivados",
  },
  /** Sello Google Cloud Certified — Foundational (F4, P-BBW-69). PNG raster 521×521 RGBA copiado byte a byte de handoff-diseno/assets/ el 2026-11-01.
   *  Derivados: 72/144 px (pantalla) y 64/128 px (panel compacto). Enlace solo cuando links.credly está presente ([ZAVALA-MANUAL]). */
  gcFoundational: {
    file: "gc-foundational.png",
    kind: "raster",
    origin: "sello GC Foundational copiado byte a byte de handoff-diseno/assets/gc-foundational.png el 2026-11-01 (F4, P-BBW-69)",
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
  | { kind: "manifest"; icons: readonly string[] }
  /** Redimensiona un maestro raster (PNG/JPEG) a `size`×`size` con fondo transparente preservado. Herramienta: sharp. */
  | { kind: "png-resize"; size: number };

export type Derivative = { master: MasterId; path: string; profile: Profile; role: string };

/**
 * CONJUNTO VIGENTE de iconos y manifiesto (industria verificada en vivo 2026-09-17: evilmartians.com "How to favicon", web.dev
 * "maskable-icon", MDN "Define app icons") + la imagen para compartir (developers.facebook.com: ≥ 1200×630, 1,91:1).
 * Sin los tamaños obsoletos (16/32/48/96 sueltos, la docena de Apple, tiles de Windows): servir peticiones que ya nadie hace.
 */
/* Los valores con `as const` para inferir DerivativeId; se exportan con el tipo completo Derivative (sin estrechar)
   para que los scripts de build y guardia puedan comprobar todos los profile kinds (incluyendo video/poster si se reintroducen). */
const _derivativesConst = {
  icon: { master: "brandIcon", path: "icon.svg", profile: { kind: "svg-copy" }, role: "icono escalable: pestaña del navegador y marca en la cabecera" },
  gcFoundational72: { master: "gcFoundational", path: "gc-foundational-72.png", profile: { kind: "png-resize", size: 72 }, role: "sello GC Foundational 72 px (1×, pantalla estándar)" },
  gcFoundational144: { master: "gcFoundational", path: "gc-foundational-144.png", profile: { kind: "png-resize", size: 144 }, role: "sello GC Foundational 144 px (2×, pantalla de alta densidad)" },
  gcFoundational64: { master: "gcFoundational", path: "gc-foundational-64.png", profile: { kind: "png-resize", size: 64 }, role: "sello GC Foundational 64 px (1×, panel compacto)" },
  gcFoundational128: { master: "gcFoundational", path: "gc-foundational-128.png", profile: { kind: "png-resize", size: 128 }, role: "sello GC Foundational 128 px (2×, panel compacto de alta densidad)" },
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
} as const satisfies Record<string, Derivative>;
export type DerivativeId = keyof typeof _derivativesConst;
/** Derivados exportados con el tipo Derivative completo (no estrechado por as const) para que los scripts accedan a todos los profile kinds. */
export const derivatives: { readonly [K in DerivativeId]: Derivative } = _derivativesConst;

/**
 * Vectores que van INLINE en los componentes (pintan con `currentColor` y se dimensionan por tokens): el derivado es el par
 * viewBox + trazado extraído del maestro y escrito en `src/media/generated.ts`. `paint` dice si el maestro es relleno o trazo;
 * `use` distingue los iconos de perfil (los resuelve `iconFor(id)` desde el contenido) de los ornamentos (los pide un componente por nombre).
 */
export type InlineIcon = { master: MasterId; paint: "fill" | "stroke"; use: "profile" | "ornament" | "brand" };
export const inlineIcons = {
  brandIcon: { master: "brandIcon", paint: "fill", use: "brand" },
  linkedin: { master: "iconLinkedin", paint: "fill", use: "profile" },
  github: { master: "iconGithub", paint: "fill", use: "profile" },
  toggleArmTop: { master: "toggleArmTop", paint: "stroke", use: "ornament" },
  toggleArmBottom: { master: "toggleArmBottom", paint: "stroke", use: "ornament" },
} as const satisfies Record<string, InlineIcon>;
export type InlineIconId = keyof typeof inlineIcons;

/**
 * Archivos de public/ que NO son derivados de un maestro. La guardia rechaza cualquier archivo no declarado aquí ni arriba.
 * No es una puerta de atrás para medios: un medio SIEMPRE entra por el puerto. Aquí solo caben archivos que no son medios.
 *
 * · `_headers` (D-BBW-44) — manifiesto declarativo de cabeceras de respuesta. No se sirve como recurso: el host lo lee y lo aplica.
 *   Es política de entrega, versionada y auditable; no es configuración que el proveedor necesite para construir ni desplegar
 *   (eso lo sigue prohibiendo `docs/system/DEPLOY_CONTRACT.md` §5). Su contenido se explica dentro del propio fichero.
 * · `_redirects` (D-BBW-55) — manifiesto declarativo de REDIRECCIONES, la misma clase de fichero y por la misma razón. Lleva la regla
 *   primaria de D-BBW-07 (`/` → `/es/`, 301), que hasta ahora solo existía como página de defensa con `meta refresh` — y un refresh de
 *   cero segundos espera al evento de carga, así que dejaba una página blanca de ~900 ms. Un host que no lo entienda lo ignora y sigue
 *   sirviendo el artefacto con su defensa debajo.
 */
export const publicAllowList: readonly string[] = ["_headers", "_redirects"];
