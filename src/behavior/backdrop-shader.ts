/**
 * behavior/backdrop-shader.ts — S1 · FONDO DEL HÉROE: SOMBREADOR WEBGL2 DE CUATRO PASADAS (fase 6i, portado P2; D-BBW-28 · D-BBW-30 ·
 * D-BBW-31 · D-BBW-33 · D-BBW-34 · D-BBW-35). Contrato: docs/system/BEHAVIOR.md §4. Inventario de origen: N1 doc A §1
 * (`bb:Lnnn` = `blob-bg.js` del export, línea · `dc:L56` = atributos con los que la página instancia el elemento).
 *
 * PROCEDENCIA (Q-BBW-008, respondida por Zavala el 2026-09-18): composición PROPIA de Zavala en After Effects («SB_Blobs 2», 1920×1080: capa
 * «SB_Video - Blob 2» con gradiente de 4 colores, desenfoque gaussiano 12 y zoom radial con desvanecimiento; «Shape Layer 3» con las formas y
 * su gradiente; «Adjustment Layer 1» con el gradiente de grado) → réplica WebGL2 de la comp (`uploads/SB Blobs Background.html`) → elemento
 * `<blob-bg>` (`blob-bg.js`, 352 líneas) del export del canvas de diseño «Eye Fish Landing» (2026-09-15) → este módulo. Autoría de la
 * composición y del código: Christian Zavala (Brand Brain Foundry). SIN código de terceros y SIN licencia externa que respetar; entra en este
 * repositorio público como código propio. Escrito aquí porque dentro de dos años nadie recordará de dónde salió.
 *
 * QUÉ HACE, en una frase: cuatro lóbulos de color con unión suave derivan y respiran en un espacio anclado a la comp, se desenfocan, se
 * estiran con un zoom radial desvanecido, se componen sobre un fondo de cuatro colores, se gradúan por luminancia, se APAGAN hacia un NÚCLEO
 * NEGRO cuyo borde deforman dos campos de ruido (por eso la frontera entre negro y color nunca se lee como un círculo: «deriva como agua
 * abierta», bb:L186-187), se comprimen con un techo de tono y reciben un grano temporal cuantizado. Todo en la tarjeta gráfica.
 *
 * CUATRO PASADAS (ninguna se simplifica): 1 lóbulos → FBO A a la resolución de la cadena · 2-3 desenfoque gaussiano separable A→B→A ·
 * 4 zoom radial + fondo + grado + núcleo + tonemapeo + grano → pantalla a resolución completa. Las tres fuentes GLSL se GENERAN aquí desde las
 * constantes de abajo (un solo hogar: la constante y el sombreador no pueden discrepar); la identidad con `blob-bg.js` se demuestra en el
 * output de la fase 6i renderizando ambos con los mismos uniformes y comparando píxel a píxel.
 *
 * TOKENS QUE LEE (nunca los repite; D-BBW-30): ninguno por valor. El reposo y el respaldo (D-BBW-33) son la superficie base, que aplica el
 * CSS del contenedor (`--bbf-surface-base`) cuando el lienzo no dibuja; la quietud (D-BBW-31) la lee el componente por el rol
 * `--bbf-motion-glow-play-state`. Los doce colores del algoritmo son VALOR DE MARCA (D-BBW-35): viven aquí marcados, con la rampa vista
 * equivalente al lado (D-BBW-27: `sea` es el verde de los lóbulos tras el proceso; `deep`, el azul), y ningún estilo los consume.
 *
 * CONSTANTES DE ALGORITMO (no son tokens). Clase por D-DOC-13 §2 en cada línea: estático · plantilla · dinámico.
 */

type Vec2 = readonly [number, number];
type Vec3 = readonly [number, number, number];
type Wave = { readonly fn: "sin" | "cos"; readonly f: number; readonly a: number };
type Lobe = {
  readonly anchor: Vec2;
  readonly driftX: readonly Wave[];
  readonly driftY: readonly Wave[];
  readonly radius: Vec2;
  readonly breath: "a" | "b";
  readonly k: number;
};
type Stop = { readonly at: Vec2; readonly color: Vec3 };

export const BACKDROP_SHADER = Object.freeze({
  /** tamaño de la composición de After Effects de origen: toda ancla y longitud se escribe en px de esa comp (bb:L9) · plantilla */
  COMP: Object.freeze({ w: 1920, h: 1080 }),
  /** exponente de `coverK`: cuánto agrandan lóbulos y bordes las pantallas más altas que la comp (bb:L31-35) · estático (criterio técnico) */
  COVER_EXP: 0.7,
  /** épsilon del gradiente de cuatro colores por inverso del cuadrado de la distancia (réplica del «4-Color Gradient» de AE, bb:L36-45) · estático */
  G4_EPS: 1e-6,
  /** luminancia Rec.709 para el grado (bb:L46) · estático */
  LUMA: Object.freeze([0.2126, 0.7152, 0.0722] as Vec3),
  /** los cuatro lóbulos: ancla (px de comp), deriva por eje como suma de senos (amplitud px · frecuencia rad/s), radios (px), respiración `a`
   *  (seno) o `b` (coseno) y k de la unión suave con el acumulado (px); el orden de unión es el de la lista (bb:L67-78) · dinámico (composición
   *  y movimiento de esta marca) */
  LOBES: Object.freeze([
    { anchor: [150, 10], driftX: [{ fn: "sin", f: 0.42, a: 85 }, { fn: "sin", f: 0.19, a: 45 }], driftY: [{ fn: "cos", f: 0.35, a: 65 }], radius: [610, 430], breath: "a", k: 55 },
    { anchor: [1810, -20], driftX: [{ fn: "cos", f: 0.31, a: 95 }, { fn: "cos", f: 0.17, a: 40 }], driftY: [{ fn: "sin", f: 0.46, a: 58 }], radius: [505, 365], breath: "b", k: 55 },
    { anchor: [700, 1230], driftX: [{ fn: "sin", f: 0.27, a: 105 }, { fn: "sin", f: 0.51, a: 40 }], driftY: [{ fn: "cos", f: 0.38, a: 74 }], radius: [600, 420], breath: "b", k: 55 },
    { anchor: [2160, 300], driftX: [{ fn: "cos", f: 0.49, a: 70 }], driftY: [{ fn: "sin", f: 0.23, a: 92 }, { fn: "sin", f: 0.41, a: 34 }], radius: [360, 330], breath: "a", k: 85 },
  ] as readonly Lobe[]),
  /** respiración de los radios: ±amplitud, dos relojes (bb:L72-73) · dinámico */
  BREATH: Object.freeze({ amp: 0.1, a: { fn: "sin", f: 0.33 } as const, b: { fn: "cos", f: 0.44 } as const }),
  /** borde de los lóbulos: color pleno a `inside` px de comp dentro del borde, cero a `outside` px fuera (bb:L80) · dinámico */
  EDGE: Object.freeze({ outside: 60, inside: -120 }),
  /** color de los lóbulos: gradiente de cuatro colores (anclas en px de comp) (bb:L82-86) · dinámico · VALOR DE MARCA (D-BBW-35): el verde
   *  visto tras exposición, tonemapeo y techo es la madre `sea` (paso 700) y el azul la madre `deep` (paso 800) de primitives/colors.css */
  LOBE_COLORS: Object.freeze([
    { at: [1059.9, 40.0], color: [0.208, 0.871, 0.549] }, // verde → sea-700 visto
    { at: [1850.1, 95.5], color: [0.118, 0.31, 0.784] }, // azul → deep-800 visto
    { at: [1498.3, 479.8], color: [0.086, 0.337, 0.941] }, // azul → deep-800 (ΔE 0,013)
    { at: [1875.5, 774.2], color: [0.078, 0.153, 0.369] }, // azul marino → deep-900 (ΔE 0,034)
  ] as readonly Stop[]),
  /** desenfoque gaussiano separable: σ en px de la comp escalada a la cadena, mínimo 1; muestras por lado, paso y factor del desplazamiento
   *  (bb:L103-109, bb:L318) · plantilla (σ = «Gaussian Blur 12» de AE) / estático (muestreo) */
  BLUR: Object.freeze({ sigmaCompPx: 12, minSigma: 1, taps: 8, step: 1.5, offsetScale: 0.5 }),
  /** zoom radial con desvanecimiento («CC Radial Blur Fading Zoom»: centro en px de comp, Amount 81 → 0,105, 24 muestras, caída 0,86)
   *  (bb:L150-161, bb:L339-340) · dinámico (centro, cantidad) / estático (muestras, caída: coste-calidad) */
  ZOOM: Object.freeze({ center: [1531.4, 431.4] as Vec2, amount: 0.105, taps: 24, falloff: 0.86 }),
  /** fondo bajo los lóbulos («SB_Video - Blob 2»): gradiente de cuatro colores (bb:L163-167) · dinámico · VALOR DE MARCA (azul → deep; marino → deep-900) */
  BG_COLORS: Object.freeze([
    { at: [872.2, -43.8], color: [0.118, 0.31, 0.784] },
    { at: [1850.1, 95.5], color: [0, 0, 0] },
    { at: [1498.3, 479.8], color: [0, 0, 0] },
    { at: [1532.8, 907.5], color: [0.043, 0.075, 0.22] },
  ] as readonly Stop[]),
  /** grado («Adjustment Layer 1»): gradiente de cuatro colores aplicado por luminancia y mezclado con `grade` (bb:L171-179) · dinámico · VALOR DE MARCA */
  GRADE_COLORS: Object.freeze([
    { at: [856.0, 4.6], color: [0.302, 0.933, 0.608] },
    { at: [1894.1, 63.3], color: [0.165, 0.353, 0.816] },
    { at: [595.7, 809.2], color: [0.102, 0.353, 0.941] },
    { at: [1441.6, 995.9], color: [0.118, 0.227, 0.471] },
  ] as readonly Stop[]),
  /** luminancia mínima del grado para no dividir por cero (bb:L177) · estático */
  GRADE_MIN_LUMA: 0.001,
  /** NÚCLEO NEGRO DEFORMADO POR RUIDO (bb:L184-192): centro (fracción del viewport, corregido de aspecto para que sea circular), escala
   *  radial, deformación del radio = base + w1·fbm(rel·f1 + deriva1·t) + w2·fbm(rel·f2 + deriva2·t), bordes del `smoothstep` como múltiplos
   *  de `core`, y piso de luz en el centro · dinámico (es la pieza que impide que el borde se lea como un círculo: criterio de aceptación de
   *  la fase 6i) */
  CORE: Object.freeze({
    center: [0.5, 0.52] as Vec2,
    scale: 1.45,
    warp: Object.freeze({ base: 0.74, w1: 0.4, w2: 0.16 }),
    fields: Object.freeze([
      { freq: 2.1, drift: [0.026, -0.019] as Vec2 },
      { freq: 4.7, drift: [-0.017, 0.031] as Vec2 },
    ]),
    edge: Object.freeze({ inner: 0.1, outer: 2.05 }),
    floor: 0.015,
  }),
  /** ruido de valor y fbm: hash 2D, interpolación suave, tres octavas con lacunaridad 2,07 y ganancia ½ (bb:L130-141) · estático */
  NOISE_FIELD: Object.freeze({ hash: Object.freeze({ k: [127.1, 311.7] as Vec2, mul: 43758.5453123 }), octaves: 3, lacunarity: 2.07, gain: 0.5 }),
  /** techo de tonemapeo: x/(x+knee)·gain·exposure·mul, y el color nunca supera `cap` (bb:L195-196) · dinámico (cap 0,34 = «el fondo nunca
   *  supera el 34 %», criterio de marca; citado en primitives/colors.css como parte del proceso que produjo `sea`/`deep`) */
  TONEMAP: Object.freeze({ knee: 0.55, gain: 1.55, mul: 2.0, cap: 0.34 }),
  /** grano temporal cuantizado: `steps` pasos por segundo de tiempo escalado; hash 3D y desplazamientos por canal (bb:L125-129, bb:L198-203)
   *  · estático (hash) */
  GRAIN: Object.freeze({ steps: 12, hash: Object.freeze({ k: 0.1031, add: 31.32 }), offsets: Object.freeze([[137.31, 57], [311.7, 113]] as readonly Vec2[]) }),
  /** valores con los que la página instancia el elemento (dc:L56: `exposure grade noise speed core`; los valores por defecto del elemento
   *  eran 0,34/0,45/0,05/0,55/0,5) · dinámico (`speed` escala TODO el tiempo: deriva, respiración, ruido y grano; residual reportado en el N1
   *  doc D: un multiplicador de tiempo no es una duración de la retícula) */
  INSTANCE: Object.freeze({ exposure: 0.38, grade: 0.42, noise: 0.045, speed: 0.42, core: 0.56 }),
  /** PRESUPUESTO DE RENDIMIENTO (D-BBW-34): tope de `devicePixelRatio` del lienzo y escala de la cadena (pasadas 1-3 a esta fracción del
   *  lienzo en cada eje: «the chain is heavily blurred downstream, so run it at quarter area», bb:L288-295); tamaño mínimo · plantilla
   *  (coste-calidad). El diseño traía 1,5 (bb:L288). La fase 6i midió las candidatas 1,5 / 1,0 / 0,75 al ancho del diseño (output §F5): los
   *  fps con todo animado no las distinguen (106 / 102 / 108 sobre un techo de 120); el CAMPO sin grano de 1,0 difiere del de 1,5 en 0,2/255 de
   *  media y 1,3/255 en el percentil 99,9; el grano de 1,0 mide 2 px de dispositivo por celda (= 1 px CSS) con σ +0,6/255 respecto a 1,5; 0,75
   *  supera la celda de 1 px CSS (2,7) y se ve pixelado ampliado. Elegida 1,0: la más barata (2,25 veces menos píxeles que 1,5) dentro del
   *  criterio declarado antes de medir (campo p99,9 < 3/255 · Δσ del grano < 1/255 · celda ≤ 1 px CSS) */
  BUDGET: Object.freeze({ dprCap: 1.0, chainScale: 0.5, minPx: 2 }),
  /** contexto: sin antialias (no hay geometría), opaco (lo de debajo nunca se ve), GPU de bajo consumo donde haya dos (bb:L217) · estático */
  CONTEXT: Object.freeze({ antialias: false, alpha: false, powerPreference: "low-power" } as const),
});

const C = BACKDROP_SHADER;

// ── GLSL generado desde las constantes (un solo hogar) ────────────────────────────────────────────────────────────────
const f = (n: number): string => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const v2 = (p: Vec2): string => `vec2(${f(p[0])}, ${f(p[1])})`;
const v3 = (c: Vec3): string => `vec3(${f(c[0])}, ${f(c[1])}, ${f(c[2])})`;
const waves = (ws: readonly Wave[]): string => ws.map((w) => `${w.fn}(t*${f(w.f)})*${f(w.a)}`).join(" + ");
const g4 = (stops: readonly Stop[]): string => stops.map((s) => `anchor(${v2(s.at)}), ${v3(s.color)}`).join(",\n    ");
/** deriva de un campo de ruido: `±uTime * v` (el signo delante del tiempo, como en el original) */
const drift = (v: number): string => `${v < 0 ? "-" : ""}uTime * ${f(Math.abs(v))}`;

export const GLSL_VERT = `#version 300 es
void main(){
  vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2);
  gl_Position = vec4(p*2.0-1.0, 0.0, 1.0);
}`;

const COMMON = `
precision highp float;
uniform vec2 uComp;
uniform vec2 uRes;
uniform float uTime;

vec2 P(vec2 frag){
  vec2 uv = frag / uRes;
  return vec2(uv.x, (1.0 - uv.y) * (uRes.y / uRes.x));
}
float uw(float compPx){ return compPx / uComp.x; }
vec2 anchor(vec2 compPt){
  return vec2(compPt.x / uComp.x, (compPt.y / uComp.y) * (uRes.y / uRes.x));
}
float coverK(){
  float h = uRes.y / uRes.x;
  float base = uComp.y / uComp.x;
  return pow(max(1.0, h / base), ${f(C.COVER_EXP)});
}
vec3 g4(vec2 q, vec2 p1, vec3 c1, vec2 p2, vec3 c2, vec2 p3, vec3 c3, vec2 p4, vec3 c4){
  const float E = ${f(C.G4_EPS)};
  vec2 d1=q-p1, d2=q-p2, d3=q-p3, d4=q-p4;
  float w1=1.0/(dot(d1,d1)+E);
  float w2=1.0/(dot(d2,d2)+E);
  float w3=1.0/(dot(d3,d3)+E);
  float w4=1.0/(dot(d4,d4)+E);
  float s=w1+w2+w3+w4;
  return (c1*w1 + c2*w2 + c3*w3 + c4*w4)/s;
}
float luma(vec3 c){ return dot(c, ${v3(C.LUMA)}); }
`;

const lobeCenters = C.LOBES.map((l, i) => `  vec2 c${i + 1} = anchor(${v2(l.anchor)}) + vec2(uw(${waves(l.driftX)}), uw(${waves(l.driftY)}));`).join("\n");
const lobeUnion = C.LOBES.map((l, i) => {
  const e = `sdEllipse(q, c${i + 1}, vec2(uw(${f(l.radius[0])}), uw(${f(l.radius[1])})) * ${l.breath === "a" ? "br" : "br2"})`;
  return i === 0 ? `  float d = ${e};` : `  d = smin(d, ${e}, uw(${f(l.k)})*k);`;
}).join("\n");

/** Pasada 1 · lóbulos → FBO A (premultiplicado) */
export const GLSL_BASE = `#version 300 es
${COMMON}
out vec4 O;

float sdEllipse(vec2 q, vec2 c, vec2 r){
  vec2 d = (q - c) / r;
  return (length(d) - 1.0) * min(r.x, r.y);
}
float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

void main(){
  vec2 q = P(gl_FragCoord.xy);
  float t = uTime;
  float k = coverK();

${lobeCenters}

  float br  = k * (1.0 + ${f(C.BREATH.amp)} * ${C.BREATH.a.fn}(t * ${f(C.BREATH.a.f)}));
  float br2 = k * (1.0 + ${f(C.BREATH.amp)} * ${C.BREATH.b.fn}(t * ${f(C.BREATH.b.f)}));

${lobeUnion}

  float a = smoothstep(uw(${f(C.EDGE.outside)})*k, uw(${f(C.EDGE.inside)})*k, d);

  vec3 col = g4(q,
    ${g4(C.LOBE_COLORS)});

  O = vec4(col * a, a);
}`;

/** Pasadas 2-3 · desenfoque gaussiano separable (A→B horizontal, B→A vertical) */
export const GLSL_BLUR = `#version 300 es
${COMMON}
uniform sampler2D uTex;
uniform vec2 uDir;
uniform float uSigma;
out vec4 O;

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 texel = 1.0 / uRes;
  vec4 sum = texture(uTex, uv);
  float wsum = 1.0;
  for(int i=1;i<=${C.BLUR.taps};i++){
    float o = float(i) * ${f(C.BLUR.step)};
    float w = exp(-0.5 * (o*o) / (uSigma*uSigma));
    vec2 off = uDir * texel * o * uSigma * ${f(C.BLUR.offsetScale)};
    sum += texture(uTex, uv + off) * w;
    sum += texture(uTex, uv - off) * w;
    wsum += 2.0 * w;
  }
  O = sum / wsum;
}`;

/** Pasada 4 · zoom radial + fondo + grado + núcleo deformado + tonemapeo + grano → pantalla */
export const GLSL_FINAL = `#version 300 es
${COMMON}
uniform sampler2D uTex;
uniform vec2 uBlurCenter;
uniform float uAmount;
uniform float uExposure;
uniform float uGrade;
uniform float uNoise;
uniform float uCore;
out vec4 O;

float hash(vec3 p){
  p = fract(p * ${f(C.GRAIN.hash.k)});
  p += dot(p, p.zyx + ${f(C.GRAIN.hash.add)});
  return fract((p.x + p.y) * p.z);
}
float h2(vec2 p){ return fract(sin(dot(p, ${v2(C.NOISE_FIELD.hash.k)})) * ${f(C.NOISE_FIELD.hash.mul)}); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x),
             mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float s = 0.0, a = ${f(C.NOISE_FIELD.gain)};
  for (int i = 0; i < ${C.NOISE_FIELD.octaves}; i++){ s += a * vn(p); p *= ${f(C.NOISE_FIELD.lacunarity)}; a *= ${f(C.NOISE_FIELD.gain)}; }
  return s;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  vec2 q = P(frag);

  vec2 cuv = vec2(uBlurCenter.x / uComp.x, 1.0 - uBlurCenter.y / uComp.y);

  const int TAPS = ${C.ZOOM.taps};
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  for(int i=0;i<TAPS;i++){
    float t = float(i) / float(TAPS-1);
    float scale = 1.0 - t * uAmount;
    vec2 suv = cuv + (uv - cuv) * scale;
    float w = 1.0 - t * ${f(C.ZOOM.falloff)};
    acc += texture(uTex, suv) * w;
    wsum += w;
  }
  vec4 blob = acc / wsum;

  vec3 bg = g4(q,
    ${g4(C.BG_COLORS)});

  vec3 col = bg * (1.0 - blob.a) + blob.rgb;

  vec3 adj = g4(q,
    ${g4(C.GRADE_COLORS)});

  float lb = luma(col), la = max(luma(adj), ${f(C.GRADE_MIN_LUMA)});
  vec3 graded = clamp(adj * (lb / la), 0.0, 1.0);
  col = mix(col, graded, uGrade);

  vec2 rel = (uv - ${v2(C.CORE.center)}) * vec2(max(1.0, uRes.x / uRes.y), max(1.0, uRes.y / uRes.x));
  float r = length(rel) * ${f(C.CORE.scale)};
  float w1 = fbm(rel * ${f(C.CORE.fields[0].freq)} + vec2(${drift(C.CORE.fields[0].drift[0])}, ${drift(C.CORE.fields[0].drift[1])}));
  float w2 = fbm(rel * ${f(C.CORE.fields[1].freq)} + vec2(${drift(C.CORE.fields[1].drift[0])}, ${drift(C.CORE.fields[1].drift[1])}));
  r *= ${f(C.CORE.warp.base)} + ${f(C.CORE.warp.w1)} * w1 + ${f(C.CORE.warp.w2)} * w2;
  float core = smoothstep(uCore * ${f(C.CORE.edge.inner)}, uCore * ${f(C.CORE.edge.outer)}, r);
  col *= uExposure * mix(${f(C.CORE.floor)}, 1.0, core * core);

  col = col / (col + ${f(C.TONEMAP.knee)}) * ${f(C.TONEMAP.gain)} * uExposure * ${f(C.TONEMAP.mul)};
  col = min(col, vec3(${f(C.TONEMAP.cap)}));

  float tq = floor(uTime * ${f(C.GRAIN.steps)});
  vec3 n = vec3(
    hash(vec3(frag, tq)),
    hash(vec3(frag + ${f(C.GRAIN.offsets[0][0])}, tq + ${f(C.GRAIN.offsets[0][1])})),
    hash(vec3(frag + ${f(C.GRAIN.offsets[1][0])}, tq + ${f(C.GRAIN.offsets[1][1])})));
  col = clamp(col + (n - 0.5) * uNoise, 0.0, 1.0);

  O = vec4(col, 1.0);
}`;

// ── Renderizador (toca la GPU) ───────────────────────────────────────────────────────────────────────────────────────
export type BackdropSize = { W: number; H: number; bw: number; bh: number; dpr: number };
export type Backdrop = {
  /** ajusta el lienzo y la cadena a un tamaño CSS y un `devicePixelRatio` (el tope del presupuesto se aplica aquí) */
  resize(cssW: number, cssH: number, devicePixelRatio: number): BackdropSize;
  /** dibuja el instante `clockS` (segundos de reloj continuo; el módulo aplica `speed`) */
  draw(clockS: number): void;
  /** libera programas, texturas y objetivos */
  dispose(): void;
  readonly size: BackdropSize;
};

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };

/** Uniformes por programa, resueltos una vez (el diseño los buscaba en cada cuadro, bb:L302-304: mismo resultado, menos trabajo por cuadro). */
function locations(gl: WebGL2RenderingContext, p: WebGLProgram, names: readonly string[]): Record<string, WebGLUniformLocation | null> {
  const out: Record<string, WebGLUniformLocation | null> = {};
  for (const n of names) out[n] = gl.getUniformLocation(p, n);
  return out;
}

/**
 * Crea el sombreador sobre un lienzo. Devuelve `null` si el navegador no ofrece WebGL2 o no compila: el llamante deja la superficie base
 * (D-BBW-33; el diseño hacía `background:#000`, bb:L218). Bloque de trabajo de bb:L208-352 sin el DOM sombra ni el bucle (van en el componente).
 */
export function createBackdrop(canvas: HTMLCanvasElement): Backdrop | null {
  const gl = canvas.getContext("webgl2", { ...C.CONTEXT }) as WebGL2RenderingContext | null;
  if (!gl) return null;

  const compile = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };
  const link = (fs: string): WebGLProgram | null => {
    const p = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, GLSL_VERT);
    const f2 = compile(gl.FRAGMENT_SHADER, fs);
    if (!p || !vs || !f2) return null;
    gl.attachShader(p, vs);
    gl.attachShader(p, f2);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(p));
      gl.deleteProgram(p);
      return null;
    }
    return p;
  };
  const pBase = link(GLSL_BASE);
  const pBlur = link(GLSL_BLUR);
  const pFinal = link(GLSL_FINAL);
  if (!pBase || !pBlur || !pFinal) return null;
  const uBase = locations(gl, pBase, ["uComp", "uRes", "uTime"]);
  const uBlur = locations(gl, pBlur, ["uComp", "uRes", "uTime", "uTex", "uDir", "uSigma"]);
  const uFinal = locations(gl, pFinal, ["uComp", "uRes", "uTime", "uTex", "uBlurCenter", "uAmount", "uExposure", "uGrade", "uNoise", "uCore"]);
  const vao = gl.createVertexArray();

  const makeTarget = (): Target | null => {
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { tex, fbo, w: 0, h: 0 };
  };
  const A = makeTarget();
  const B = makeTarget();
  if (!A || !B) return null;

  const size: BackdropSize = { W: 0, H: 0, bw: 0, bh: 0, dpr: 1 };

  const sizeTarget = (t: Target, w: number, h: number) => {
    if (t.w === w && t.h === h) return;
    t.w = w;
    t.h = h;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
  };

  const setCommon = (u: Record<string, WebGLUniformLocation | null>, w: number, h: number, time: number) => {
    gl.uniform2f(u.uComp, C.COMP.w, C.COMP.h);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, time);
  };

  const blurPass = (src: Target, dst: Target, dx: number, dy: number, sigma: number, time: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, size.bw, size.bh);
    gl.useProgram(pBlur);
    setCommon(uBlur, size.bw, size.bh, time);
    gl.uniform2f(uBlur.uDir, dx, dy);
    gl.uniform1f(uBlur.uSigma, sigma);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(uBlur.uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return {
    size,
    resize(cssW, cssH, devicePixelRatio) {
      const dpr = Math.min(devicePixelRatio || 1, C.BUDGET.dprCap);
      const W = Math.max(C.BUDGET.minPx, Math.round(cssW * dpr));
      const H = Math.max(C.BUDGET.minPx, Math.round(cssH * dpr));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      size.W = W;
      size.H = H;
      size.dpr = dpr;
      size.bw = Math.max(C.BUDGET.minPx, Math.round(W * C.BUDGET.chainScale));
      size.bh = Math.max(C.BUDGET.minPx, Math.round(H * C.BUDGET.chainScale));
      sizeTarget(A, size.bw, size.bh);
      sizeTarget(B, size.bw, size.bh);
      return size;
    },
    draw(clockS) {
      const time = clockS * C.INSTANCE.speed;
      const { W, H, bw, bh } = size;
      gl.bindVertexArray(vao);

      gl.bindFramebuffer(gl.FRAMEBUFFER, A.fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(pBase);
      setCommon(uBase, bw, bh, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const sigma = Math.max(C.BLUR.minSigma, C.BLUR.sigmaCompPx * (bw / C.COMP.w));
      blurPass(A, B, 1, 0, sigma, time);
      blurPass(B, A, 0, 1, sigma, time);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(pFinal);
      setCommon(uFinal, W, H, time);
      gl.uniform2f(uFinal.uBlurCenter, C.ZOOM.center[0], C.ZOOM.center[1]);
      gl.uniform1f(uFinal.uAmount, C.ZOOM.amount);
      gl.uniform1f(uFinal.uExposure, C.INSTANCE.exposure);
      gl.uniform1f(uFinal.uGrade, C.INSTANCE.grade);
      gl.uniform1f(uFinal.uNoise, C.INSTANCE.noise);
      gl.uniform1f(uFinal.uCore, C.INSTANCE.core);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, A.tex);
      gl.uniform1i(uFinal.uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      for (const t of [A, B]) {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      }
      gl.deleteVertexArray(vao);
      gl.deleteProgram(pBase);
      gl.deleteProgram(pBlur);
      gl.deleteProgram(pFinal);
    },
  };
}
