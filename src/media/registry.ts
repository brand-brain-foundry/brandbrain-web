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
 * (los brazos del conmutador, los iconos de perfil): esos heredan el color del texto donde se insertan.
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
  /* 2026-11-02 (orden de Zavala): salen el icono de GitHub (el perfil sale del pie y de la hoja) y las dos ondas de subrayado de la nav.
     Recuperables desde la etiqueta de respaldo de `main`. */
  /* Las flechas de los dos botones del cuerpo nuevo (2026-11-02): trazos de la referencia aprobada (handoff-diseno/src/home.html). */
  arrowRight: { file: "arrow-right.svg", kind: "svg", origin: "referencia aprobada de la home (handoff-diseno/src/home.html, flecha de «Hablemos», viewBox 16), 2026-11-02" },
  arrowUpRight: { file: "arrow-up-right.svg", kind: "svg", origin: "referencia aprobada de la home (handoff-diseno/src/home.html, flecha de «Perfil en LinkedIn», viewBox 16), 2026-11-02" },
  /** Sello Google Cloud Certified (2026-11-02). PNG raster RGBA copiado byte a byte de handoff-diseno/assets/gc-foundational.png (el mismo
   *  maestro que entró en la rama de la home clara, 3a62247). Se sirve redimensionado por `png-resize`; el componente no conoce su ruta. */
  gcFoundational: {
    file: "gc-foundational.png",
    kind: "raster",
    origin: "handoff de la home nueva (handoff-diseno/assets/gc-foundational.png), copiado byte a byte el 2026-11-01; traído a esta rama desde 3a62247 el 2026-11-02",
  },
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
  /** Redimensiona un maestro raster (PNG/JPEG) a `size`×`size` con su transparencia. Herramienta: sharp. */
  | { kind: "png-resize"; size: number };

export type Derivative = { master: MasterId; path: string; profile: Profile; role: string };

/**
 * CONJUNTO VIGENTE de iconos y manifiesto (industria verificada en vivo 2026-09-17: evilmartians.com "How to favicon", web.dev
 * "maskable-icon", MDN "Define app icons") + la imagen para compartir (developers.facebook.com: ≥ 1200×630, 1,91:1).
 * Sin los tamaños obsoletos (16/32/48/96 sueltos, la docena de Apple, tiles de Windows): servir peticiones que ya nadie hace.
 */
const _derivativesConst = {
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
  /* 2026-11-02 (orden de Zavala): el pez sale del héroe y el campo de puntos ocupa su escenario. Salen los tres derivados del vídeo
     (720p, 360p y póster) con su único consumidor, `HeroMedia`. Los DOS MAESTROS se conservan declarados y sellados, sin derivados, como
     ya se hacía con `heroLoopRegistro`: el pez puede volver con regenerar sus derivados, sin buscar el archivo en el historial. */
  gcFoundational72: { master: "gcFoundational", path: "gc-foundational-72.png", profile: { kind: "png-resize", size: 72 }, role: "sello del pie, 72 px (1×)" },
  gcFoundational144: { master: "gcFoundational", path: "gc-foundational-144.png", profile: { kind: "png-resize", size: 144 }, role: "sello del pie, 144 px (2×, pantalla de alta densidad)" },
} as const satisfies Record<string, Derivative>;
export type DerivativeId = keyof typeof _derivativesConst;
/** Con el tipo `Derivative` completo (sin estrechar) para que el guion y la guardia comprueben todos los perfiles aunque hoy no haya vídeo. */
export const derivatives: { readonly [K in DerivativeId]: Derivative } = _derivativesConst;

/**
 * Vectores que van INLINE en los componentes (pintan con `currentColor` y se dimensionan por tokens): el derivado es el par
 * viewBox + trazado extraído del maestro y escrito en `src/media/generated.ts`. `paint` dice si el maestro es relleno o trazo;
 * `use` distingue los iconos de perfil (los resuelve `iconFor(id)` desde el contenido) de los ornamentos (los pide un componente por nombre).
 */
export type InlineIcon = { master: MasterId; paint: "fill" | "stroke"; use: "profile" | "ornament" };
/**
 * RIGS (M1c, 2026-11-05): derivados de ANATOMÍA de un maestro vectorial, no de imagen. El perfil `rig` muestrea el contorno del
 * maestro cada `step` u y deriva los seis tentáculos (regiones, líneas centrales de `samples` puntos y sección) con el paso 1 del
 * motor de referencia aprobado (`scripts/media/brand-icon-rig.ts`). Se escribe en `src/media/generated.ts` (`rigs`) y se sella en el
 * lock; la guardia R10 lo vuelve a derivar y exige que coincida. Un rig no es un maestro: nadie lo edita, se regenera.
 */
export type RigProfile = { kind: "rig"; step: number; samples: number };
export type RigSpec = { master: MasterId; profile: RigProfile; role: string };
export const rigs = {
  brandIconRig: {
    master: "brandIcon",
    profile: { kind: "rig", step: 0.5, samples: 72 },
    role: "anatomía del imagotipo vivo (S9): regiones, líneas centrales y sección de los seis tentáculos; el motor la consume al arrancar",
  },
} as const satisfies Record<string, RigSpec>;
export type RigId = keyof typeof rigs;

export const inlineIcons = {
  brandIcon: { master: "brandIcon", paint: "fill", use: "ornament" },
  linkedin: { master: "iconLinkedin", paint: "fill", use: "profile" },
  arrowRight: { master: "arrowRight", paint: "stroke", use: "ornament" },
  arrowUpRight: { master: "arrowUpRight", paint: "stroke", use: "ornament" },
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
