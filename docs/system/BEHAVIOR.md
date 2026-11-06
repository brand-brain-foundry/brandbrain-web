---
id: BBW-BEHAVIOR
title: "Constantes de algoritmo de los sistemas dinámicos — brandbrain-web"
type: canon
status: VIGENTE
version: 1.11
owner_repo: brandbrain-web
subject_repo: brandbrain-web
created: 2026-09-18
updated: 2026-11-06
verified_against_code: 2026-11-06@fix/sello-segun-solape (v1.11: §13 — el sello se oculta SOLO MIENTRAS LA BARRA LO TAPA: `IntersectionObserver` con la medida de la reserva y umbral `BAR_AVOID_THRESHOLD` = 1 (`barAvoidRootMargin`, `isCoveredByBar` en consent.ts), marcas genéricas `data-bar-avoid` / `data-bar-covered` (`ConsentBar/attr.ts`); sale `data-consent-bar` de `<html>` con su constante (sin lector, I-6); ocultar instantáneo porque no existe rol de salida, reportado) · 2026-11-06@feat/m2-desarme (v1.10: §14 — S11 rebasado sobre sello y banner; el sello del pie queda FUERA de S11 por decisión de Zavala (un efecto por pieza), exento en R11 por selector nombrado `a.cert`; R11b inventario de hosts en el código; §13 conserva la nota del sello) · 2026-11-06@fix/m1d-imagotipo-identico (v1.8: §12 — conducta, sorteo y anatomía idénticos al prototipo; R10d; criterios del modelo aprobado; M1d) · 2026-11-06@feat/m1-imagotipo-vivo (v1.7: §12 reescrita — S9 porta el motor de referencia aprobado (varilla con marco local), rig v3 derivado al compilar en src/media/generated.ts, deformFrame pura, guardia R10 que ejecuta el motor; v1.6: §12 nueva — S9 imagotipo vivo, Kirchhoff elastic rod simplificado, 6 tentáculos independientes, muelle amortiguado engage ζ=0.7 / release ζ=0.9; motor en src/behavior/brand-mark-octopus.ts; rig externo en media/masters/brand-icon-rig.json verificado por R10; referencia de §13 en el módulo corregida a §12; D-BBW-28/31) (src/behavior/brand-mark-octopus.ts · src/components/atoms/BrandMark/BrandMarkLive.tsx; origen de cada constante en DESPACHO-BBW-2026-11-05-M1-imagotipo-vivo §0.1/§4)
supersedes: []
superseded_by: null
related: [BBW-TYPOGRAPHY-WEIGHTS, BBW-DESIGN-EXCEPTIONS, BBW-PLAN-CONSTRUCCION, BBW-MEDIA, D-BBW-24, D-BBW-25, D-BBW-28, D-BBW-29, D-BBW-30, D-BBW-31, D-BBW-33, D-BBW-34, D-BBW-35, D-BBW-36, D-BBW-37, D-DOC-13]
summary: "Contrato del hogar de las constantes de algoritmo (D-BBW-30): un módulo declarado por sistema en src/behavior/, sin JSX ni CSS, que lista cada constante con su origen y su clase, y que LEE los tokens que ya existen por getPropertyValue (o por el valor computado donde el navegador los aplica) y jamás los repite. v1.0 (fase 6h, portado P1): S5 modulador de peso (weight-modulator.ts) y S7 ajuste óptico y puntero (optical-fit.ts). v1.1 (fase 6i, portado P2): S1 fondo, el sombreador WebGL2 de cuatro pasadas (backdrop-shader.ts) con su PROCEDENCIA (composición y código propios de Zavala, sin licencia de terceros: Q-BBW-008) y su presupuesto de resolución medido (D-BBW-34); rejilla de escritura del peso en S5 (HAL-BBW-16). v1.2 (fase 6j, portado P3): S2 vídeo, el seguimiento del sujeto (subject-tracking.ts): centroide de luminancia con exponente, suavizado, traslación acotada sobre el zoom, cadena de reintentos; con movimiento reducido el bucle no arranca; la garantía de D-BBW-25 re-medida con una cota sobre la ventana entera de traslación (velo 43 %, sin cambio). v1.3 (fase 6k, portado P4): S3/S4 partículas, el GENERADOR del campo (particle-field.ts, D-BBW-36: se porta el generador con los rangos, los planos y la distribución, no la tirada del export): 21 burbujas en tres planos con tres elementos anidados y dos animaciones con SUS tiempos (ascenso 13,7–28,3 s, oscilación 3,7–7,3 s: el error de la 6e corregido), 31 motas en tres planos con desenfoques distintos, posición horizontal por el promedio de tres muestras, semilla fija reproducible; con movimiento reducido las animaciones no arrancan y con la pestaña oculta se pausan por el mismo rol. v1.6 (M1): S9 imagotipo vivo. v1.7 (M1c): S9 es el porte del motor de referencia aprobado (varilla con marco local, rig v3 derivado del maestro al compilar, guardia que ejecuta el motor)."
tags: [comportamiento, constantes, algoritmos, tokens, sombreador, seguimiento, video, particulas, procedencia, brandbrain-web]
---

# Constantes de algoritmo de los sistemas dinámicos

> **Qué es:** el registro de las constantes que parametrizan un procedimiento (umbrales, exponentes, frecuencias, tolerancias, pasadas) y que
> **no son tokens de diseño** porque ningún estilo las consume. **Qué no es:** un segundo sistema de tokens. Los valores que un estilo consume
> (pesos, tamaños, duraciones, colores) viven en `src/styles/tokens/` y los módulos de aquí los **leen**, nunca los copian.

## §1 — Regla (D-BBW-30)

1. **Un módulo por sistema** en `src/behavior/<sistema>.ts`: objeto congelado con cada constante nombrada, su origen (`dc:Lnnn` = línea del
   export inventariado por el N1) y su clase por D-DOC-13 §2 (estático · plantilla · dinámico), más las funciones puras del algoritmo y las que
   miden el DOM (marcadas como tales). Sin JSX, sin CSS, sin texto.
2. **Los módulos leen los tokens que ya existen y nunca los repiten.** Dos formas, las dos por el navegador: `getComputedStyle(root).getPropertyValue('--bbf-…')`
   para un rol declarado en `:root`, o el valor computado de la propiedad donde el navegador lo aplica (p. ej. `font-weight` del titular = el
   rol `--bbf-type-display-weight`, que el CSS ya resolvió). Un número de peso, tamaño, duración o color dentro de un módulo es un defecto.
   Comprobación: `grep -nE '\b(25|100|300|400|500|700)\b' src/behavior/*.ts` no devuelve ninguna línea de valor (solo comentarios que citan
   el token equivalente).
3. **Los valores de marca dentro de un algoritmo** (los que un diseñador tocaría para cambiar el carácter: anchura de la joroba, ganancias
   del puntero, los vec3 del sombreador cuando llegue) viven en el módulo **marcados como dinámico** con referencia cruzada al token
   equivalente si lo hay. No se convierten en tokens: ningún estilo los consume, y dispersarlos por los componentes es lo que esta regla evita.
4. **El componente cliente solo cablea**: refs, eventos, ciclo de vida. El algoritmo no sabe de React; el componente no sabe de constantes.
5. **Guardia**: solo a la segunda necesidad (D-DOC-13 §3). Hoy la comprueban las guardias existentes: `check-typography-tokens.ts`
   (ningún `fontWeight:`/`fontSize:` numérico en `src/`), `check-typography-system.ts` R4 (ningún `wght` crudo) y `check-color-tokens.ts`
   (ningún color crudo). Fase 6i: los vec3 del sombreador (floats GLSL) no los ve ninguna guardia de color; la comprobación de este contrato es
   `grep` en el output de cada despacho (tabla ⇔ módulo, ningún token repetido). Guardia propia solo a la segunda necesidad real de bloquear
   algo (D-DOC-13 §3): hoy no hay defecto que haya escapado.

## §2 — S5 · Modulador de peso de la tercera línea del claim (`src/behavior/weight-modulator.ts`)

> ### ⏸ APAGADO Y REVERSIBLE desde 2026-09-22 (D-BBW-65)
>
> **Ninguna línea del claim se anima.** Las tres salen con el peso de reposo de su rol, que es el mismo que el HTML servido ya traía, así
> que lo que se ve ahora es exactamente lo que se veía sin JavaScript. **El módulo no se ha borrado ni tocado**: sigue entero, con su
> algoritmo, sus constantes y sus orígenes por línea del export. Lo que se retira es su **aplicación** desde `HeroClaim`.
>
> Es una **excepción declarada a I-6** (nada sin consumidor): Zavala pidió conservarlo porque puede volver. Un módulo sin consumidor y sin
> nota es basura; con nota es una pieza guardada, y el coste de guardarla es cero en el artefacto (nadie lo importa, así que no entra en
> ningún fragmento del build).
>
> **2026-11-02: `HeroClaim` ya no existe** (el claim salió del héroe por orden de Zavala); se recupera de la etiqueta de respaldo de `main`.
> **Qué hay que devolver para encenderlo**, todo en `src/components/molecules/HeroClaim/HeroClaim.tsx`: el reparto de la línea en glifos
> tras hidratar (con su `aria-label` y su restauración al desmontar), el bucle de `requestAnimationFrame` sobre `frame()`, el anclaje de
> la caja vía `calibrate()` —que es lo que impide que la línea empuje a sus hermanas— y la quietud por pestaña oculta y por movimiento
> reducido (D-BBW-31). En la hoja, `.glyph` y el `display: flex` + `contain: layout` de la línea viva. **El afinado del cuerpo con la
> medida real no hay que tocarlo**: se quedó en el componente porque era de la composición y no del movimiento.
>
> La tabla que sigue describe el módulo **tal como está escrito**, que es como sigue estando. Mientras el apagado dure, describe una
> capacidad disponible y no un comportamiento observable.


**Qué hace:** la línea se parte en letras y cada una interpola su peso siguiendo una señal continua sin periodo, con la restricción de que
**Σ avances = presupuesto** (el ancho total nunca cambia: el grosor se redistribuye). Tres partes: señal (pura) → conservación por water-fill
de Newton contra la tabla de avances medida (pura) → calibración (mide el DOM). Inventario: N1 doc A §5.

**Héroe rediagramado (D-BBW-47).** El módulo no cambia de algoritmo, cambia de sujeto: deja de animar **una palabra** (el titular) y pasa a
animar **la última línea de un claim de tres**, una frase con espacios y punto. La conservación es **por línea**: la caja anclada es la de esa
línea y las otras dos, el encabezado y la firma son hermanos que no se enteran. Dos cosas que la frase trae y la palabra no tenía, las dos
medidas en el turno: **el espacio es un glifo con avance** y hay que impedir que se colapse (HAL-BBW-24, `white-space: pre` en el glifo), y
**la discontinuidad de avance la tienen tres glifos**, no uno, con el refinado perdiéndola en cuerpos pequeños (HAL-BBW-25, fila `REFINE`).

*Tabla de constantes archivada en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-S5-tabla-2026-11-05 (S5 apagado, D-BBW-65). Se restaura aquí si S5 se reactiva.*


**Tokens que lee (nunca repite):** `--bbf-type-display-weight-from` / `-to` por `getPropertyValue` en `:root` (= WMIN/WMAX del diseño, madres
`--bbf-weight-display-anim-min/-max`); el **peso de reposo** como `font-weight` computado del titular (rol `--bbf-type-display-weight` =
`--bbf-weight-display-rest`, la fórmula (min + max) / 2 de la fase 5). **El reposo ES el peso de conservación**: el diseño fija el presupuesto en
s = 0,5 del eje (dc:L515), que con 100–500 es 300. El rol de quietud `--bbf-motion-loop-play-state` lo lee el componente.

**Lo que mide en ejecución (no se supone):** la tabla de avances por glifo y peso (n × 9 medidas uniformes + las del refinado: 27 relayouts
hoy, cada uno compartido por los n glifos), el presupuesto y la caja anclada; se re-mide al montar, en `document.fonts.ready`, en cada `loadingdone` del conjunto de fuentes (si la display llega tarde, la primera
tabla es de la de respaldo y la conservación sería falsa), a los 60/700/1800 ms y en cada `resize`. Cambiar palabra o fuente no exige recalibrar
nada a mano: se remuestrea sola.

**CÓMO se mide el ancho, y por qué no da igual (D-BBW-45, cierra HAL-BBW-22).** La palabra se mide con **`max-content`**, nunca con `auto`. Una caja
con `auto` **encoge para ajustarse** y por tanto **queda topada por el ancho disponible**: en cuanto la palabra no cabe, la medida devuelve el disponible
en vez del ancho real, y como el cuerpo se corrige con `objetivo × cuerpo / medido`, la corrección **se calcula a sí misma** y el cuerpo equivocado se
congela hasta que se recarga. Es exactamente lo que pasaba cuando la display llegaba tarde y la tabla salía de la de respaldo. `max-content` es el ancho
intrínseco y no lo topa el contenedor; además impide que los glifos, que son elementos flexibles, encojan durante la medida. **La calibración desconfía
de su propia medida:** compara el ancho real con el que daría la caja encogida y, si el topado coincide con el disponible —la firma del tope—, lo dice
por consola en desarrollo. **Los tres retardos NO son la red de seguridad:** con red lenta la fuente llega a los ~7,6 s, mucho después de los 1.800 ms;
quien salva la caja es `loadingdone`. El salto mientras tanto lo amortigua el respaldo con métricas ajustadas (`modulator-fallback`, ±1,5 %). Lo que SÍ está calibrado a esta familia: `SIGMA`, `GAUSS`, `SIGMOID_K` (cuántas letras engordan y cuánto) y el
interletrado de la palabra (EXC-BBW-04).

## §3 — S7 · Ajuste óptico del rótulo y peso por puntero — RETIRADO (D-BBW-47)

> Módulo retirado; `src/behavior/optical-fit.ts` no existe. Contenido archivado en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-S7-retirado-2026-11-05.

## §4 — S1 · Fondo: sombreador WebGL2 de cuatro pasadas (`src/behavior/backdrop-shader.ts`)

**Procedencia (Q-BBW-008, respondida por Zavala el 2026-09-18).** Composición **propia de Zavala** en After Effects («SB_Blobs 2», 1920×1080)
→ réplica WebGL2 (`uploads/SB Blobs Background.html`) → elemento `<blob-bg>` (`blob-bg.js`) del export del canvas de diseño (2026-09-15) → el
módulo. Autoría de la composición y del código: Christian Zavala Cubas (cadena de nombre única, D-BBW-58). **Sin código de terceros y sin licencia externa** que
respetar; entra en este repositorio público como código propio. Consta aquí y en la cabecera del módulo porque el repositorio es público.

**Qué hace:** cuatro lóbulos de color con unión suave derivan y respiran en un espacio anclado a la comp, se desenfocan (gaussiana separable),
se estiran con un zoom radial desvanecido, se componen sobre un fondo de cuatro colores, se gradúan por luminancia, se apagan hacia un **núcleo
negro cuyo borde deforman dos campos de ruido** (la pieza que impide que la frontera se lea como un círculo), se comprimen con un techo de tono y
reciben un grano temporal cuantizado. Cuatro pasadas, ninguna simplificada; las tres fuentes GLSL se generan desde las constantes (un solo
hogar) y son idénticas al original píxel a píxel (output 6i §F3: 0 píxeles distintos de 3,73 M en siete instantes). Inventario: N1 doc A §1.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `COMP` | 1920 × 1080 | bb:L9 | plantilla | tamaño de la comp de origen: toda ancla y longitud se escribe en px de esa comp |
| `COVER_EXP` | 0,7 | bb:L31-35 | estático | exponente de `coverK`: cuánto agrandan lóbulos y bordes las pantallas más altas que la comp |
| `G4_EPS` · `LUMA` · `GRADE_MIN_LUMA` | 1e−6 · Rec.709 · 0,001 | bb:L36-46, L177 | estático | épsilon del gradiente de cuatro colores; luminancia del grado; mínimo para no dividir por cero |
| `LOBES` | 4 anclas, 12 términos de deriva (amplitud px · rad/s), 4 radios, k 55/55/55/85 | bb:L67-78 | **dinámico** | composición y movimiento de esta marca |
| `BREATH` | ±10 % a 0,33 (seno) y 0,44 (coseno) rad/s | bb:L72-73 | **dinámico** | respiración de los radios |
| `EDGE` | 60 / −120 px | bb:L80 | **dinámico** | borde de los lóbulos (pleno a 120 px dentro, cero a 60 fuera) |
| `LOBE_COLORS` · `BG_COLORS` · `GRADE_COLORS` | 12 vec3 con sus anclas | bb:L82-86, L163-167, L171-175 | **dinámico · valor de marca** (D-BBW-35) | los colores del algoritmo; la rampa vista equivalente al lado (`sea-700` el verde, `deep-800` / `deep-900` los azules); ningún estilo los consume |
| `BLUR` | σ 12 px de comp (mín 1) · 8 muestras por lado · paso 1,5 · ×0,5 | bb:L103-109, L318 | plantilla (σ de AE) / estático | desenfoque gaussiano separable |
| `ZOOM` | centro (1531,4 · 431,4) · 0,105 · 24 muestras · caída 0,86 | bb:L150-161, L339-340 | **dinámico** (centro, cantidad) / estático (muestreo) | «CC Radial Blur Fading Zoom» |
| `CORE` | centro (0,5 · 0,52) · escala 1,45 · deformación 0,74 + 0,40·w1 + 0,16·w2 · campos 2,1 / 4,7 con derivas (0,026 · −0,019) / (−0,017 · 0,031) · bordes 0,10 / 2,05 · piso 0,015 | bb:L184-192 | **dinámico** | el núcleo negro deformado por ruido: **criterio de aceptación de la fase 6i** |
| `NOISE_FIELD` | hash (127,1 · 311,7 · 43758,5453123) · 3 octavas · lacunaridad 2,07 · ganancia ½ | bb:L130-141 | estático | ruido de valor y fbm |
| `TONEMAP` | x/(x+0,55)·1,55·exposure·2 · techo 0,34 | bb:L195-196 | **dinámico** | «el fondo nunca supera el 34 %» (citado en primitives/colors.css) |
| `GRAIN` | 12 pasos/s · hash 0,1031 / 31,32 · desplazamientos (137,31 · 57) / (311,7 · 113) | bb:L125-129, L198-203 | estático | grano temporal cuantizado |
| `INSTANCE` | exposure 0,38 · grade 0,42 · noise 0,045 · speed 0,42 · core 0,56 | dc:L56 | **dinámico** | valores con los que la página instancia el elemento; `speed` escala todo el tiempo (residual de la retícula, N1 doc D §6) |
| `BUDGET` | dprCap **1,0** (el diseño: 1,5) · chainScale 0,5 · minPx 2 | bb:L288-295 · D-BBW-34 | plantilla (coste-calidad) | presupuesto de resolución, elegido con medida (output 6i §F5): fps con todo animado 106 / 102 / 108 para 1,5 / 1,0 / 0,75 (no discriminan); campo sin grano de 1,0 frente a 1,5: 0,2/255 de media, 1,3/255 en p99,9; grano de 1,0: celda de 2 px de dispositivo (1 px CSS), σ +0,6/255. Criterio declarado antes de medir: campo p99,9 < 3/255 · Δσ grano < 1/255 · celda ≤ 1 px CSS → la más barata que cumple es 1,0 (0,75 pasa el campo pero su celda de 2,7 px se ve) |
| `CONTEXT` | antialias false · alpha false · low-power | bb:L217 | estático | atributos del contexto |

**Tokens que lee (nunca repite):** ninguno por valor. Reposo y respaldo = la superficie base por CSS del contenedor (`--bbf-surface-base`,
D-BBW-33); quietud por el rol `--bbf-motion-glow-play-state`, leído por el componente (D-BBW-31): con movimiento reducido y con la pestaña
oculta el bucle se cancela y el lienzo se oculta (queda la superficie base). Sin WebGL2 o con el contexto perdido: lo mismo, y la página sigue.

**Lo que cambia respecto al elemento del diseño sin cambiar la salida:** los uniformes se resuelven una vez (el diseño los buscaba por cuadro);
el tamaño sigue al contenedor por `ResizeObserver` y a la ventana por `resize` (el diseño re-medía en cada cuadro, forzando una disposición
junto al modulador); el reloj continuo se detiene con la pestaña oculta y con movimiento reducido (el diseño seguía). Coste medido con todo
animado en la máquina de referencia: output 6i §F5 (el diseño vivo: 52,7 fps).

## §5 — S2 · Vídeo: seguimiento del sujeto — RETIRADO 2026-11-02

> Módulo retirado; sale con el pez. Contenido archivado en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-S2-retirado-2026-11-05.

## §6 — S6 · Entrada con enfoque progresivo (sin módulo: todo es token)

**Qué hace:** cada pieza de la página nace desenfocada, desplazada y transparente, y se resuelve con la curva firma; el escalonado va **por
jerarquía** (fondo → escenario → cromo → marca → afirmaciones → pie), no por un índice uniforme. Inventario: N1 doc A §6 y doc B §13.

**Por qué NO tiene módulo en `src/behavior/`** (y por qué eso no es una excepción a D-BBW-30): este sistema **no tiene constantes de algoritmo**.
No hay umbral, exponente, tolerancia ni pasada: hay duraciones, retardos, un desplazamiento, dos desenfoques y una escala, y **todos son valores
que un estilo consume**, es decir, tokens. La regla del §1 dice dónde viven las constantes que ningún estilo consume; aquí no hay ninguna. El
sistema vive entero en `base/document.css` (una regla y un par de fotogramas clave), en `semantic/motion.css` (un rol de duración y otro de
retardo por pieza) y en la hoja de cada componente, que solo declara **a qué rol apunta su pieza**.

| Pieza | Duración | Retardo | Origen |
|---|---|---|---|
| fondo (`HeroBackdrop`) | ×10 = 2400 ms | ×1,5 = 120 ms | dc:L55 (2400 / 100) |
| escenario del vídeo (`HeroMedia`) | ×8,5 = 2040 ms | ×2,5 = 200 ms | dc:L63 (2000 / 200) |
| marca (`BrandMark`) | ×4 = 960 ms | ×3,5 = 280 ms | dc:L219 (900 / 260) |
| enlaces de la nav y conmutador | ×4 = 960 ms | ×5 = 400 ms + ×1,5 = 120 ms por enlace | dc:L695, dc:L256 (900 / 380 + 110·i) |
| titular | ×4,5 = 1080 ms | ×11 = 880 ms | dc:L789 (1100 / 880) |
| rótulo | ×4,5 = 1080 ms | ×12,5 = 1000 ms | dc:L805 (1100 / 1000) |
| afirmación 1 · afirmación 2 | ×4 = 960 ms | ×14,5 = 1160 ms · ×16 = 1280 ms | dc:L318, dc:L322 |
| aviso del pie · grupo legal | ×4 = 960 ms | ×16,5 = 1320 ms · ×18 = 1440 ms | dc:L851, dc:L856 |

**Desenfoque y escala:** 10 px → paso ×3 de espaciado (12) para todas las piezas; el escenario lleva 22 px → el desenfoque de la hoja (24) y
una **escala inicial de 1,05**, que es el único residual del sistema y vive como madre en `primitives/motion.css` (D-BBW-38).

**Movimiento reducido (D-BBW-31):** la entrada **no arranca**: `base/document.css` retira la animación entera bajo la preferencia. Colapsar solo
la madre de duración dejaba la animación en 0,04 ms, que es imperceptible pero **medible**: en el primer `requestAnimationFrame` el estilo
computado era todavía el inicial, porque una animación CSS fija su inicio en el fotograma siguiente al que se aplica. Un fotograma de destello es
justo lo que el criterio no quiere.

**Coste (output 6l):** con todo resuelto no cuesta nada medible (117,6–118,9 fps con todo animado, frente a 120 sin las piezas de entrada); en el
**arranque sí se nota**: 173–290 ms de tareas largas en el primer segundo y medio, frente a 0–75 ms sin las entradas. Es el desenfoque animado
sobre trece piezas, dos de ellas a pantalla completa (el lienzo del fondo y el escenario del vídeo).

## §7 — S3/S4 · Partículas: burbujas y nieve marina (`src/behavior/particle-field.ts`)

**Qué hace:** GENERA el campo (D-BBW-36). El export trae los 52 valores concretos, pero son una tirada aleatoria del generador del original, no
un diseño: se porta **el generador** con los recuentos, los rangos por plano y la distribución del diseño, con **semilla fija** (una compilación
produce siempre el mismo campo: HTML completo, D-BBW-09/28, y medida repetible, D-BBW-25). El módulo emite **solo números normalizados 0..1**;
la hoja del componente los lleva a los rangos de las madres. Inventario: N1 doc A §3 (burbujas) y §4 (nieve marina); clasificación: N1 doc D §3.
Todo lo que se ve (tamaños, opacidades, desenfoques por plano, recorridos, tiempos, tintes, alfas, proporciones de la esfera) es token.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `SEED` | 0x6e5f4b3a | fase 6e | plantilla | semilla del generador determinista (mulberry32): cualquier valor sirve; cambiarla cambia la disposición y obliga a re-medir el contraste |
| `COUNTS` | motas 16 / 10 / 5 · burbujas 11 / 7 / 3 | dc:L77-107, L110-214 (N1 doc A §3.3, §4.3) | **dinámico** | recuentos por plano de foco: composición de esta marca (31 motas, 21 burbujas) |
| `X_SAMPLES` | 3 | descripción de Zavala (N1 doc A §7.4: el código del export ya trae la tirada, no el generador) | **dinámico** | muestras uniformes que se PROMEDIAN para la posición horizontal: la media de tres uniformes concentra el campo hacia el centro en vez de repartirlo plano (el export lo muestra: burbujas 29–90 %, motas 12–77 %, medias ≈ 55 % y 51 %) |
| `DECIMALS` | 3 | fase 6e | estático | decimales de cada número normalizado escrito en el HTML |
| (uniforme) | tamaño · opacidad · deriva · fase · duración · oscilación | dc:L77-214 | estático (forma de la tirada) | el resto de campos son uniformes dentro del rango de su plano; cada partícula consume el mismo número de muestras en el mismo orden, así el campo es estable ante cambios de recuento de otro plano |

**Tokens que lee (nunca repite):** ninguno por valor. Los consume el CSS del componente (`HeroParticles.module.css`): rangos de tamaño y
opacidad por plano, desenfoques 0 / 0,3 / 3 (burbujas) y 0 / 0,8 / 4,5 (motas), deriva ±2,9vw, unidad del vaivén `max(--bbf-space-2, 0,85vw)` × 0,55
(`primitives/particles.css` · `semantic/particles.css`); **tiempos por sistema** en `primitives/motion.css`: motas ×150…×362,5 (36–87 s), ascenso de
las burbujas ×57…×118 (13,7–28,3 s), oscilación ×15,5…×30,5 (3,7–7,3 s, `ease-in-out`, claves 0/25/75/100) — los cuatro extremos caen en la
retícula con |Δ| ≤ 20 ms; **proporciones** (D-BBW-37): mota +8 % → −42 % de la altura del campo con meseta 16–84 %; burbuja: envoltorio a −10 %,
nace a +12 % con escala 0,6 y muere a −104 % con escala 1, meseta 12–84 %; esfera: brillo en 33 %/27 %, paradas 34 %/62 %/100 %, borde de línea
al alfa de su plano (0,46 / 0,38 / 0,26), sombra interior. Las mesetas viven en los fotogramas clave (forma, D-BBW-37 c). La quietud (D-BBW-31) va
por el rol `--bbf-motion-particles-play-state` en los tres elementos animados: con movimiento reducido es `paused` desde la raíz y las animaciones
**no arrancan** (cada partícula queda en su fase: el reposo, D-BBW-28); con la pestaña oculta el reloj cliente `HeroParticlesClock` fija el mismo rol
en el campo y lo retira al volver. Sin más JavaScript: el campo viaja en el HTML y anima por CSS.

> Notas de fases cerradas (6e ✅, 6k ✅) archivadas en `docs/system/BEHAVIOR_HISTORY.md` §§BEHAVIOR-notas-fases-2026-11-05.

## §8 — Sombras de texto (P-BBW-31, cerrado en la 6l)

El mapeo elemento → sombra que faltaba desde la 6a lo dejó inventariado el N1 (doc B §11) y las seis sombras del diseño caen en los cuatro pasos
que `primitives/shadows.css` ya tenía. Se asignan **por rol tipográfico** (`--bbf-type-<rol>-shadow`, `semantic/typography.css`), nunca por
palabra. **No son la garantía de legibilidad** (D-BBW-25 lo dice expresamente) y el velo local sigue calibrado sin contar con ellas; lo que las
sombras darían si contaran está medido en el output 6l §5.

## §9 — Cómo entra un sistema nuevo (P5)

1. Módulo `src/behavior/<sistema>.ts` con el objeto congelado, origen por línea y clase por constante; funciones puras separadas de las que
   tocan el DOM o la GPU.
2. Tabla en este documento con las mismas columnas; sección "tokens que lee".
3. Componente cliente que solo cablea, y que lee la quietud por el rol de reproducción correspondiente (`--bbf-motion-*-play-state`): con
   movimiento reducido y con la pestaña oculta el bucle se detiene y queda el reposo (D-BBW-31).
4. El HTML servido trae el estado de reposo del sistema; el output del despacho lo demuestra sobre `out/` (D-BBW-28).
5. Lo que el sistema sustituye se retira en el mismo commit (N1 doc C §4).

---
*BBW-BEHAVIOR v1.4 · `docs/system/BEHAVIOR.md` · 2026-09-18 · v1.4 en la fase 6l (`DESPACHO-BBW-2026-09-18-fase6l-P5-entradas-sombras-y-lockup`: S6 entradas con enfoque progresivo, sin módulo porque no tiene constantes de algoritmo; sombras de texto por rol, P-BBW-31 cerrado; D-BBW-38/39) · v1.3 · `docs/system/BEHAVIOR.md` · 2026-09-18 · v1.3 en la fase 6k (`DESPACHO-BBW-2026-09-18-fase6k-P4-particulas-fieles`: S3/S4 partículas, D-BBW-36/37) · v1.2 en la fase 6j (`DESPACHO-BBW-2026-09-18-fase6j-P3-seguimiento-del-sujeto`: S2 seguimiento del sujeto) · v1.1 en la fase 6i (`DESPACHO-BBW-2026-09-17-fase6i-P2-sombreador-de-fondo`: S1 con procedencia, D-BBW-33/34/35, HAL-BBW-16) · nace en la fase 6h (`DESPACHO-BBW-2026-09-17-fase6h-P1-modulador-de-peso`, D-BBW-30)*

## §10 — Recorte del titular: por qué la mitad vive en el arnés (D-BBW-40, fase 6m)

**El defecto (HAL-BBW-20).** A 360 px `deepbrand` pedía 374,5 px con la guarda `14.6vw`, que se había calibrado contra `Creative`; el bloque
deja 328 y el héroe recortaba 7,3 px por lado. **Ninguna guardia lo veía**, y no por descuido: el documento **no desborda**
(`scrollWidth == clientWidth` en los cinco anchos) porque el héroe tiene `overflow: hidden`. El recorte es invisible para cualquier
comprobación que mire el documento.

**Lo que SÍ vive en una guardia de código** (`scripts/lint/check-typography-system.ts`, R9): la **causa**, no el síntoma. R9 obliga a que el
margen de seguridad esté declarado a los dos lados del punto de corte con suelo de 16 px, a que toda guarda `-fit-unit` derive de
`--bbf-lockup-target` **sin ningún literal de longitud**, y a que todo rol de borde (`-pad`, `-side`, `-page`) tome `max(var(--bbf-space-safe), …)`.

**Fase 7b (D-BBW-42): el ancho deja de ser un TOPE y pasa a ser la INVARIANTE.** Las guardas ya no miden contra el ancho *disponible* sino
contra el ancho *objetivo* (`--bbf-lockup-target`), que es el que el lockup tenía en el diseño — `--bbf-lockup-width-per-size` (5,93013 px de
lockup por px de cuerpo del titular, medido en el export en nueve anchos con amplitud del 0,0139 %) por `--bbf-size-display` — con el
disponible como **suelo de seguridad**. La guardia crece con un apartado (d) que ata el propio objetivo al disponible y a la razón medida,
**sin literales**: sin él, (b) sería aflojar la regla, porque bastaría escribir el objetivo a mano para saltarse D-BBW-40. Comprobada contra
las dos regresiones (objetivo escrito a mano, y objetivo que se salta el margen): las caza.

Comprobado que detecta las dos formas de la regresión: devolver `14.6vw` a la guarda da dos errores R9, y quitarle el suelo a `--bbf-bar-side`
da uno.

**Lo que NO puede vivir en una guardia, y se dice en vez de fingirlo:** que la palabra **quepa**. Exige la familia display cargada (la sirve
Adobe en ejecución), disposición resuelta y el modulador calibrado. No hay navegador en el proceso de verificación y añadir uno es una
dependencia nueva. **Queda como paso del arnés**, y este es el paso:

1. Servir `out/` en la raíz con rangos HTTP (`pnpm preview:serve`; sin rangos el vídeo se queda en `readyState 0`).
2. Un `iframe` por ancho de {360, 780, 1000, 1728, 1920}, con la **pestaña visible** (si no, `requestAnimationFrame` no corre).
3. Esperar `document.fonts.ready` y ~3 s (la calibración del modulador tiene retardos a 60/700/1800 ms).
4. Por ancho, medir la **tinta** y no la caja: extremos de los `span` de letra del titular menos el interletrado sobrante; para el rótulo, su
   caja menos el interletrado (que se aplica también tras la última letra); para cabecera y pie, sus hijos visibles recortados por todo
   antecesor con `overflow` distinto de `visible` (si no, la onda de 160 px del subrayado da un falso positivo).
5. Comprobar: margen mínimo de tinta ≥ `--bbf-space-safe` en los cinco anchos, y `scrollWidth == clientWidth`.
6. Repetir con los `<script>` retirados (`srcdoc` + `<base>`): es el estado **servido**, donde manda la guarda derivada sola.

Valores de referencia de la 6m: margen mínimo de tinta 16,05 px (360) · 21,48 (780) · 32,00 (1000) · 40,00 (1728 y 1920), desborde 0 en todos;
servido, 20,00 px a 360 con el titular a 37,963 px y 270 px de ancho sobre 328 disponibles.

## §11 — S8 · Campo del criterio (`src/behavior/criterio-field.ts`, 2026-11-02)

**Qué hace:** una rejilla de puntos donde corren carriles de «texto». Cada 4,1 s una consulta barre una banda de carriles con un cursor,
enciende los aciertos, la cierra con dos corchetes, saca a la derecha una barra por carril y se disuelve punto a punto. Conducta escrita en
`OUTPUT-BBW-2026-11-01-F0` §4 (hub); **implementación propia**: el archivo de la referencia (`criterio-field.js`) no se abrió (C14). PRNG
mulberry32 y hash entero propios, deterministas por semilla. El componente `CriterioField` (molecule cliente) solo cablea.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `SEED` | 0x5a7cc0b5 | propio | plantilla | semilla; cambiarla cambia la disposición, no la conducta |
| `DOT` | 3 px | F0 §4.0 | dinámico | lado del punto; el paso es aparte |
| `WIDE_MIN_W/H` · `LINE_DIVISIONS` | 480 × 160 · 7 | F0 §4.1 | plantilla | modo amplio: paso = interlineado del primer párrafo / 7, y un carril por línea del párrafo |
| `LANE_STEP_WIDE/NARROW` · `NARROW_PITCH` · `NARROW_FIRST_ROW` | 7 · 4 · 4 px · 1 | F0 §4.0, §4.1 | plantilla | separación de carriles en filas; paso fijo del estrecho |
| `DPR_CAP` | 2 | F0 §4.1 | estático | densidad máxima del lienzo |
| `EDGE_WIDE/NARROW` | 28 · 14 columnas | F0 §4.1 | dinámico | borde suave por azar fijo; el amplio no suaviza la derecha (el campo sale de la página) |
| `PATTERN_LENGTH` · `RUN_*` · `GAP_*` · `DEPTHS` · `SPARSE_SHARE` · `STRONG_SHARE` | 2048 · 2 + ⌊r₁r₂·34⌋ · 6 + ⌊r^1,5·110·g⌋ (g 0,35/0,75, corte 40 filas) · 0,94/0,86/0,74 · 25 % · 16 % | F0 §4.2 | dinámico | patrón cíclico de cada carril |
| `LIVE_WINDOW_S` · `LIVE_SHARE` · `FRAME_MS` | 2,6 s · 34 % · 100 ms | F0 §4.2, §4.4 | dinámico / estático | carriles vivos avanzan una posición por fotograma; 10 fps con `setTimeout` |
| `QUERY_*` · `SWEEP_END_S` · `RESULT_END_S` · `DISSOLVE_START_S` | 1,2 / 4,1 / 3,38 s · 0,76 · 1,18 · 2,48 s | F0 §4.3 | dinámico | línea de tiempo de la consulta |
| `BAND_*` · `BAR_*` · `HIT_EXTRA_SHARE` · `TRAMA_EVERY` | ver módulo | F0 §4.3 | dinámico | banda, barras, aciertos y trama |
| `STILL_AT_S` | 2,7 s | F0 §4.4 | estático | fotograma único con movimiento reducido |

**En el héroe oscuro (2026-11-02):** ocupa el ESCENARIO que tenía el vídeo del pez (misma geometría, máscara radial y entrada). Como el escenario
pasa por debajo del bloque de texto, el módulo lee el borde derecho del bloque y **los carriles nacen a su derecha** (`Geometry.start`), con el
borde suave contado desde ahí. Medido antes de esta regla: con el campo bajo los párrafos el contraste caía a **1,67** a 1440 (el cursor claro
pasando bajo el texto); con ella, el peor píxel de fondo bajo el texto da **≥ 5,65**, y **≥ 9,95** cuando además la zona de texto pasa por encima de la viñeta (cinco anchos, seis tomas por ancho, D-BBW-25).

**Tokens que lee (nunca repite):** `--bbf-field-lane`, `--bbf-field-lane-live`, `--bbf-field-read`, `--bbf-field-hit` y `--bbf-text-on-base`,
resueltos por el navegador en un elemento sonda; la quietud por `--bbf-motion-loop-play-state`.

**Quietud (D-BBW-31, I-9):** con movimiento reducido se pinta UN fotograma (una consulta resuelta) y el bucle **no arranca**; se repinta si
cambia el tamaño o cargan las fuentes. Con la pestaña oculta el reloj se detiene y, al volver, sigue donde estaba. **HTML servido:** la placa
vacía, que es su reposo (decorativo, `aria-hidden`: no hay texto que perder, I-4).

## §12 — S9 · Imagotipo vivo (`src/behavior/brand-mark-octopus.ts`, M1c · 2026-11-06 · M1d: idéntico al prototipo)

**Qué hace:** en reposo el `<path>` del imagotipo es el trazado oficial, inline, en color acento (`--bbf-accent`). **El motor de referencia
aprobado por Zavala el 2026-11-05 (`despachos/2026-11/insumos/M1c-motor-referencia-aprobado-2026-11-05.js`) es la especificación literal:
conducta, movimiento y anatomía** (M1d, instrucción de Zavala: «igualito»). Conducta (= prototipo ref:L173–L185): con el puntero del ratón
(`pointerType === 'mouse'`, sin condición de media query) o con foco de teclado vira a menta (`--bbf-text-on-base`, CSS) y el motor cambia el `d`
del MISMO `<path>`: los seis tentáculos se mueven cada uno por su cuenta y, al soltar, vuelven; cuando la energía de los muelles baja de
`ENERGY_REST` se restaura el `d` oficial **literal** y el bucle se para (D-BBW-28). Un **toque** (`pointerdown` que no sea ratón) despierta el
motor y lo suelta a `WAKE_HOLD_MS`; no se llama a `preventDefault`: el enlace navega. El **scroll** da un impulso acotado por velocidad **en
todos los dispositivos** si no hay hover/foco activo. **No hay despertar al cargar** (M1c lo había añadido por decisión de Strategic; M1d lo
retira). **Modelo:** varilla con marco local. La anatomía (puntas, regiones, líneas centrales, sección) se deriva del maestro **al compilar**
(rig v3, `src/media/generated.ts`, perfil `rig` del registro, `MEDIA.md` §9) con la línea central **exacta** (sin redondeo: M1d F2, abajo); al
arrancar, cada punto del contorno de un tentáculo se expresa en el marco (tangente, normal) de su línea central; la deformación es
θ(s) = θ₀(s) + A·s^1,6·g(s,t) con g = onda base→punta + tres armónicos de ruido + vaivén, todos con frecuencia, fase y velocidad sorteadas por
tentáculo en cada carga **en el mismo orden de sorteo que el prototipo** (`spring.delay` incluido, sorteado y no leído: misma semilla ⇒ mismos
parámetros); la columna se integra con las longitudes reales × un estiramiento elástico que crece hacia la punta (nunca bajo 1, pulso propio);
grosor y casquete viajan rígidos en el marco. Cuerpo, cabeza y hueco: puntos oficiales fijos. Función pura `deformFrame(prep, motions, amps,
times)` → `d`; el motor solo cablea. Coste por fotograma en el artefacto (M1d F5, Chrome 120 Hz, hover): mediana 0,6 ms · p95 0,7 ms; un búfer
de cadenas + `join` no mejoró la cifra (0,6 · 0,8) y no se conserva.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `STEP` · `K` | 0,5 u · 72 | ref:L7–L8 | estático | paso de muestreo del contorno · muestras de la línea central (el rig los lleva: `step`, `k`) |
| `CAP_SPAN_U` · `CAP_MIN_SEP` | 12 u · 5 % | ref:L28, L35 | estático | ventana de giro para hallar un casquete · separación mínima entre puntas |
| `MARCH_MAX_FRAC` · `MARCH_WINDOW` | 20 % · 60 | ref:L55, L57 | estático | alcance y ventana de la marcha pareada desde la punta |
| `W_SAMPLE` · `W_SKIP` · `W_STOP` · `W_START` | [60, 200) · 40 · 1,12 · 0,8 | ref:L61–L66 | estático | mediana de sección W, salto inicial, anclaje (sección > 1,12·W) y punta (sección > 0,8·W) |
| `SMOOTH_HALF` | 4 | ref:L70 | estático | semiventana del suavizado de la línea central |
| `ENV_EXP` | 1,6 | ref:L123 | dinámico | envolvente s^1,6: ≈ 0 en la base, máxima en la punta |
| `WAVE_K` · `WAVE_W` · `WAVE_A` | [0,8; 1,3] · [2,2; 3,4] · [0,40; 0,55] | ref:L108 | dinámico | onda base→punta: número de onda, velocidad, amplitud |
| `NOISE_HARMONICS` · `NOISE_K` · `NOISE_K_GAIN` · `NOISE_W` · `NOISE_A` | 3 · [0,4; 2,2]·(m+1)·0,6 · [0,6; 2,4] (signo alterno) · [0,10; 0,22]/(m+1) | ref:L109 | dinámico | tres armónicos de ruido |
| `SWAY_W` · `SWAY_A` | [0,5; 1,1] · ±[0,24; 0,38] | ref:L110 | dinámico | vaivén de todo el tentáculo |
| `STRETCH_A` · `STRETCH_W` · `STRETCH_PULSE_BASE/AMP` · `STRETCH_EXP` · `STRETCH_GAIN` | [0,10; 0,15] · [1,4; 2,4] · 0,65 / 0,35 · 1,2 · 1,8 | ref:L112, L128 | dinámico | estiramiento elástico hacia la punta con pulso propio |
| `TIME0` · `PHASE` | [0, 100] s · [0; 6,28] rad | ref:L113, L108 | dinámico / estático | reloj inicial y fases |
| `SPRING_K_ON` · `SPRING_Z_ON` · `SPRING_K_OFF` · `SPRING_Z_OFF` | [26, 40] · [0,42; 0,55] · [9, 14] · [0,62; 0,78] | ref:L111 | plantilla | muelles de entrada (subamortiguada) y salida (más amortiguada), sorteados por tentáculo |
| `ENERGY_REST` · `DT_MAX` · `DT_DEFAULT` | 0,004 · 33 ms · 16 ms | ref:L153, L167 | estático | umbral de reposo (Σ\|x\|+\|v\|) y paso de tiempo |
| `SPRING_DELAY` | [0; 0,12] | ref:L103 | plantilla | retardo sorteado por el prototipo y nunca leído; se sortea igual para conservar la secuencia de `random` (M1d) |
| `SCROLL_GAIN` · `SCROLL_IMP_MAX` · `SCROLL_JITTER` | 0,9 · 2,2 · [0,6; 1,2] | ref:L182–L183 | dinámico | impulso de scroll (todos los dispositivos, sin hover/foco activo): ganancia sobre px/ms, tope, dispersión por tentáculo |
| `WAKE_HOLD_MS` | 1 100 ms | ref:L177 | plantilla | toque (`pointerdown` no-ratón): cuánto se sostiene el muelle en 1 antes de soltar |
| `FMT_DECIMALS` | 2 | ref:L136 | estático | decimales de cada coordenada escrita en el `d` |

`ref:Lnn` = línea del motor de referencia aprobado. Restos muertos del prototipo que **no** se portan: `CENTER`, `TIP_WIN`, `NOTCH_WIN` y la
variable `on`. **Anatomía (M1d F2):** el signo de convexidad al hallar las puntas se toma del **área orientada** del contorno y no de la suma de
giros del prototipo (ref:L30), porque esa suma es degenerada en el maestro (horquilla `s.5,0,.8,0`): **medido** Chrome −8,5e-13 → −1 y Node
+1,3e-12 → +1 (sobre los puntos exactos el criterio literal elegiría las muescas). El área orientada da el signo de Chrome y las seis puntas
del prototipo; la punta TR cae en 558 frente a 559 del prototipo (meseta de giro de 4e-5 rad bajo el ruido float32 de `getPointAtLength`,
ΔP ≈ 5e-4 u): **escalado** en el output de M1d. La línea central del rig se guarda **exacta**: redondearla a 0,001 u cambiaba de segmento a un
punto de BL y otro de TR y los separaba 0,17 u del prototipo en movimiento (R10d).

**Criterios del modelo aprobado (M1d F4, ejecución de la instrucción «igualito»; no es una decisión nueva):** los rojos de M1c que vienen del
propio prototipo dejan de ser defectos. (1) **Separación entre tentáculos** (antes R10b, ≥ 1 u): el prototipo no tiene término de colisión y
sus vecinos se tocan; la guardia la **reporta** (mínimo y % de fotogramas con contacto < 1 u) y **no falla**. La separación con el cuerpo (≥ 1 u)
sigue siendo regla: el prototipo la cumple con 7,8 u de margen. (2) **Longitud** (antes M1 §4.3 «constante ± 0,5 %»): se reescribe como
**«estiramiento ≤ +12 % y reposo = longitud oficial»** (el aprobado estira hacia la punta por diseño: `STRETCH_*`). (3) **Independencia**
(antes M1 §4.4 «|r| < 0,3 y sin pico de autocorrelación > 0,5»): se reescribe como **«parámetros sorteados por tentáculo y por carga»** (el ritmo
es del aprobado: ondas de frecuencia fija por carga).

**Tokens que lee (nunca repite):** `--bbf-motion-octopus-play-state` (quietud; D-BBW-31). El color no lo lee: es CSS del átomo
(`--bbf-accent` → `--bbf-text-on-base` con `--bbf-motion-link-duration` / `--bbf-motion-link-ease`).

**HTML servido (D-BBW-28, I-4):** `<a href><svg aria-label><path fill="currentColor" d={oficial}/></svg></a>` desde el primer byte; sin JS es el
imagotipo oficial con su nombre accesible. El motor no crea ningún elemento: solo escribe `d` y lo restaura literal al asentarse.

**Quietud (D-BBW-31, I-9):** con `--bbf-motion-octopus-play-state: paused` el motor devuelve antes de registrar un solo oyente o `rAF`: solo
cambia el color. Pestaña oculta (`visibilitychange`) o logo fuera de pantalla (`IntersectionObserver`): el bucle se cancela y se reanuda al
volver si queda energía; en reposo no hay ningún `rAF` pendiente. La anatomía se prepara en `requestIdleCallback` tras el primer pintado, no en
el primer fotograma del hover. Oyentes pasivos; ninguna lectura de layout por fotograma. CLS 0: el `svg` lleva `overflow: visible` y las puntas
salen de su caja sin moverla.

**Guardia R10 (`scripts/lint/check-brand-mark-rig.ts`, M1c F4 · M1d F3; en `pnpm guard` y en el `pre-commit` desde M1d F6):** ejecuta el
motor. R10c: el rig generado = el que se deriva del maestro. R10a: con amplitud 0, Hausdorff bidireccional contra el maestro ≤ 0,25 u en los
seis y, en raster a 32/48/512 px, ningún píxel distinto fuera del borde. R10b: 20 semillas × 200 fotogramas: sección ± 1 % y separación con el
cuerpo ≥ 1 u (fallan); separación entre tentáculos informativa. **R10d (identidad con el prototipo):** `scripts/lint/fixtures/brand-mark-golden.{json,bin}`
guarda los vértices que escribió el prototipo aprobado en Chrome (3 semillas × 200 fotogramas, `Math.random` = mulberry32(semilla), muelle de
entrada, dt = 1/60; 1 de cada 8 vértices + el centro de cada región; int16 a 0,01 u, que es la precisión con que el prototipo escribe el `d`),
con el sha256 del prototipo de origen y las dos sustituciones con que se generó (muestreador del contorno = el del repo, porque el de Blink
acumula en float32; signo por área orientada) declaradas en la cabecera; el motor del repo corre con las mismas semillas y falla si cualquier
vértice guardado difiere > 0,05 u. Se ve fallar con `BBW_RIG_DEFECT=section-as-tangent` (el defecto real de `a4500d0`), con
`BBW_RIG_SVG=<maestro alterado>` y, R10d, cambiando una sola constante de movimiento. **Medidas y estado en los outputs de M1c y M1d.**

## §13 — S10 · Consentimiento (`src/behavior/consent.ts`, P-BBW-82, L3, 2026-11-06)

**Qué hace:** guarda y lee la elección sobre la medición de visitas como preferencia TÉCNICA del navegador (almacenamiento local, exenta:
solo conserva la elección) con **fecha y versión**, y juzga si una elección guardada sigue valiendo. Sin JSX, sin CSS, sin texto. El componente
cliente (`src/components/organisms/ConsentBar/`) solo cablea; la medición entra por el puerto de analítica (`src/analytics/port.ts`, `PORTS.md`).
No es un sistema de movimiento: no lee tokens, no tiene bucle ni quietud que declarar (I-9: la barra no tiene animación de entrada, con o sin
movimiento reducido). Está aquí porque tiene **constantes de algoritmo** y una regla sobre dónde viven.

| Constante | Valor | Dónde vive | Clase | Qué es |
|---|---|---|---|---|
| `CONSENT_STORAGE_KEY` | `bbf-consent` | `src/config/consent.ts` | plantilla | nombre de la preferencia guardada; la página de Cookies lo cita por `{{consentKey}}` |
| `CONSENT_MONTHS` | 24 | `src/config/consent.ts` | estático (AEPD, Guía de cookies, mayo de 2024) | validez de la elección; la página de Cookies lo cita por `{{consentMonths}}` |
| `CONSENT_VERSION` | `"1"` | `src/config/consent.ts` | dinámico | versión de las finalidades; subirla vuelve a preguntar a todo el mundo |
| `MS_PER_MONTH` | 30,44 d | módulo | estático | la cota de validez en milisegundos (meses medios; la cota es lo que importa, no el calendario) |
| `BAR_AVOID_THRESHOLD` | 1 | módulo | estático | umbral del observador de solape: una pieza marcada cuenta como visible solo ENTERA dentro de la ventana recortada por la barra (abajo) |

**Por qué las tres constantes viven en `src/config/` y no en el módulo:** las lee también el registro de sustituciones
(`src/content/substitutions.ts`), para que el texto legal y el comportamiento salgan de **la misma constante** (I-1). El módulo las importa y no
las repite (misma regla que §1.2 para los tokens).

**Fail-safe (requisito 1 del despacho L3):** toda lectura y escritura va en `try/catch`. Sin almacenamiento, con JSON roto, versión distinta,
fecha ilegible o futura, o más de `CONSENT_MONTHS` meses, el estado es «sin decidir»: se vuelve a preguntar y **no se carga nada**. El estado
por defecto, sin JavaScript y sin preferencia, es «sin analítica».

**Lo que mide el cableado (no se supone):** la altura real de la barra, que escribe en el rol `--bbf-consent-reserve` (`semantic/spacing.css`)
mientras está a la vista; `body` lo consume como margen inferior para que el pie, superpuesto al borde del documento, siga alcanzable (F5.8).
No es un token de diseño: es una medida en tiempo de ejecución y por eso no tiene fórmula.

**Lo que marca el cableado (sello según solape, 2026-11-06; SUSTITUYE a «barra a la vista → sello oculto» de sello y banner, I-6):** una
pieza marcada en el HTML servido con `data-bar-avoid` (`ConsentBar/attr.ts`, `BAR_AVOID_ATTR`; hoy, solo el sello del pie, `Footer.tsx`) se oculta
**solo mientras la barra la tapa, aunque sea en parte**: si el desplazamiento la deja entera por encima de la barra, aparece aunque la barra siga
abierta; si la barra vuelve a pisarla, desaparece. Sin barra, siempre visible. **Mecanismo:** el mismo efecto que escribe la reserva crea, con esa
MISMA medida entera, un `IntersectionObserver` sobre las piezas marcadas (nadie escucha el scroll): raíz = la ventana con margen inferior negativo
igual a la reserva (`barAvoidRootMargin`), umbral `BAR_AVOID_THRESHOLD` = 1 (`isCoveredByBar`: entera dentro = visible; pisada en parte, entera bajo
la barra o aún fuera de la ventana por abajo = tapada). Cuando el `ResizeObserver` de la barra mide otra altura (tamaño, orientación), el observador
se rehace con ella; los cambios de la ventana los ve él mismo. El cableado escribe `data-bar-covered` (`BAR_COVERED_ATTR`) en cada pieza tapada y la
retira al destaparla o al bajar la barra; **quien tenga que reaccionar lo LEE en CSS** (hoy `Footer.module.css`, `.cert[data-bar-covered]`) y nadie
vuelve a calcular si la barra tapa algo (I-6). **Sale el atributo `data-consent-bar` de `<html>` con su constante:** sin lector era estado muerto
(I-6). El HTML servido trae `data-bar-avoid` y nunca `data-bar-covered` (I-4): sin JavaScript o con elección guardada el sello está visible desde el
primer byte. **Ocultar es instantáneo** (el estado tapado lleva `transition: none`): `semantic/motion.css` no declara ningún rol de salida y no se
inventa en el componente —reportado en el output del despacho—; **aparecer** usa por transición los roles de la entrada del sistema (§6: duración ×4,
curva firma, desplazamiento ×3, desenfoque ×3); con movimiento reducido la madre colapsa y no hay estado intermedio visible (I-9). Sin parpadeo en la
frontera: el observador solo avisa al cruzar el umbral y ocultar no mueve ninguna caja (ni la del enlace observado), así que no hay realimentación.
El sello conserva su efecto propio al pasar: `--bbf-motion-hover-lift` (`semantic/motion.css`, `space-half`; 0 con movimiento reducido) y
`--bbf-hover-fine` (`semantic/viewport.css`, 1 solo con `(hover: hover) and (pointer: fine)`), y sigue FUERA de S11 (§14).

**Retirar (requisito 3):** si había aceptación y pasa a rechazo, el cableado pide al puerto `block()` (el adaptador envuelve `sendBeacon`,
`XMLHttpRequest.open` y `fetch` y descarta toda petición al actor) y recarga la página; el envío de cierre del fragmento que la recarga
dispara es, precisamente, el que la envoltura descarta (verificado en F5.4 del output de L3).

## §14 — S11 · Desarme de enlaces y botones (`src/behavior/glyph-scatter.ts`, M2 · 2026-11-06 · P-BBW-83)

**Qué hace:** todos los enlaces y botones con texto del sitio comparten un único sistema dinámico de cliente (P-BBW-83, firmada por el `!` de M2;
D-BBW-09 en los términos de D-BBW-28). **El prototipo aprobado por Zavala el 2026-11-06 (`despachos/2026-11/insumos/M2-prototipo-desarme-aprobado-2026-11-06.html`,
v2, profundidad activada) es la especificación literal del movimiento** (método de M1d: copia literal + guardia de identidad). Al pasar el puntero del
ratón (`pointerType === 'mouse'`), recibir foco o tocar, cada glifo del texto y cada icono del puerto se suelta con x, y (em), giro en el plano y
profundidad d ∈ [−1, 1] → escala 1 + 0,28·d y opacidad 1 + 0,22·d si d < 0; sin giros 3D. Cada glifo flota hacia un objetivo con tres frecuencias
por eje y vuelve con muelle propio y desfase; bajo `ENERGY_REST` se borra la transformación (reposo exacto). Dentro de un párrafo lo lejano
(d < −0,05) pasa detrás del texto (el párrafo es contexto de apilamiento propio); fuera, siempre delante. Piel de botón: el contorno se deshace desde
un punto al azar hacia los dos lados (`stroke-dasharray`); el relleno se encoge hacia un punto al azar y se disuelve, y el texto toma el color del
relleno. Enlace en texto: el subrayado se recoge. Toque: despierta `WAKE_HOLD_MS` y suelta con `blur()`; sin `preventDefault`, el enlace navega.
Quedan fuera el imagotipo (S9), el enlace de salto y **el sello del pie** (`a.cert` de `Footer.tsx`; Zavala, 2026-11-06: **un efecto por pieza**; el
sello ya tiene el suyo —tinte del texto, elevación y halo de la insignia, §13— y no se parte). Las tres exenciones van **nombradas** en la guardia R11b
(abajo), nunca por omisión.

**Una fuente, cableado puntual:** las constantes y las funciones puras (`makeGlyph`, `stepGlyph`, `glyphFrame`, `stepSkin`, `skinFrame`, `frameDt`)
viven en el módulo; `makeGlyph` sortea en el **mismo orden de llamadas a `random`** que el prototipo. Un componente solo se MARCA
(`data-scatter="text|icon|outline|fill|prose"`; `data-scatter-skip` en lo que no se parte: el nombre oculto del icono y la píldora «Caso»); un único
cableador cliente (`src/components/organisms/GlyphScatter/`, montado una vez en el layout del locale) delega los eventos en `document`
(`pointerenter`/`pointerleave` en captura, `focusin`/`focusout`, `pointerdown`) y lleva **un solo bucle rAF para toda la página**, que se para cuando
nada está activo ni asentándose. Todo el CSS de S11 vive en un bloque `[data-scatter]` de `base/document.css` (hosts, palabras, glifos, nombre
oculto, piel, subrayado, contexto de apilamiento y los hovers de reposo con movimiento reducido): ningún componente escribe nada de S11.

| Constante | Valor | Origen | Clase | Qué es |
|---|---|---|---|---|
| `DOF` | 4 | ref:L109 | estático | x, y, giro, profundidad |
| `REACH_BUTTON` · `REACH_LINK` | 1 · 0,75 em | ref:L126 | dinámico | alcance del desarme |
| `BASE_X` · `BASE_Y` · `BASE_ROT` · `BASE_DEPTH` | [0,3; 0,75]·alcance · [0,35; 0,85]·alcance · [−42; 42]° · [−1; 1] | ref:L114 | dinámico | objetivo base por glifo (x, y en una dirección al azar) |
| `FREQ` · `FREQ_WEIGHTS` · `PHASE` | [0,35; 0,9] · [0,9; 1,7] · [1,7; 2,6] rad/s · 0,6 · 0,3 · 0,1 · [0; 6,28] | ref:L115–L116, L168 | dinámico / estático | tres frecuencias por eje, pesos y fases |
| `AMP_X` · `AMP_Y` · `AMP_ROT` · `AMP_DEPTH` | 0,16·alcance · 0,2·alcance · 16° · 0,45 | ref:L117 | dinámico | amplitud de la flotación |
| `SPRING_K_ON` · `SPRING_Z_ON` · `SPRING_K_OFF` · `SPRING_Z_OFF` | [70; 110] · [0,38; 0,52] · [120; 170] · [0,62; 0,78] | ref:L118 | plantilla | muelles vivo (subamortiguado) y suelta |
| `DELAY` · `TIME0` | [0; 0,07] s · [0; 50] s | ref:L119 | plantilla / estático | desfase de arranque y reloj inicial por glifo |
| `SCALE_PER_DEPTH` · `OPACITY_PER_DEPTH` · `BEHIND_DEPTH` | 0,28 · 0,22 · −0,05 | ref:L182, L184, L186 | dinámico | profundidad → escala, opacidad, capa |
| `ENERGY_REST` · `ENERGY_W_POS` · `ENERGY_W_VEL` | 0,02 · [20, 20, 0,05, 10] · [2, 2, 0,01, 2] | ref:L173, L176 | estático | umbral de reposo y pesos |
| `SKIN_K_ON` · `SKIN_Z_ON` · `SKIN_K_OFF` · `SKIN_Z_OFF` · `SKIN_REST` | 260 · 0,9 · 90 · 0,75 · 0,002 | ref:L190, L192 | plantilla | muelle de la piel |
| `FILL_ORIGIN_MIN` · `FILL_ORIGIN_SPAN` · `FILL_SCALE_X` · `FILL_SCALE_Y` | 0,1 · 0,8 · 0,92 · 0,7 | ref:L203–L204 | dinámico | encogido del relleno hacia un punto al azar |
| `DT_MAX` · `DT_DEFAULT` · `WAKE_HOLD_MS` | 33 ms · 16 ms · 900 ms | ref:L155, L146 | estático / plantilla | paso de tiempo y toque |
| `FMT_3` · `FMT_ROT` · `FMT_ORIGIN` | 3 · 1 · 1 | ref:L183, L186, L203 | estático | decimales escritos |

`ref:Lnn` = línea del prototipo aprobado. **Lo que el porte añade sin cambiar lo visible (M2 output §8):** ajuste entre glifos por la medida del
texto en reposo (un glifo por caja rompía la conformación del texto corrido: hasta 1,7 px por palabra, medido) y U+2060 en los bordes del enlace
pegados a puntuación (una caja atómica abría cortes de línea que el texto no tenía); la palabra es una caja en línea con `nowrap` y el glifo la caja
atómica; piel vectorial inyectada en el primer contacto (sin JavaScript el `rect` del prototipo no tiene geometría: la piel CSS del átomo es el
reposo, I-4) y cambio de renderizador bajo `data-scatter-skin-live`; nombre accesible por texto oculto visualmente y no por `aria-label`; el
conmutador de profundidad, el anillo de foco y el `preventDefault` del prototipo no se portan (D-BBW-22; el enlace navega); sus transiciones de 0,3 s
→ `--bbf-motion-link-duration`; `stroke-width: 1` → `--bbf-line-sm`.

**Tokens que lee (nunca repite):** `--bbf-motion-scatter-play-state` (quietud, D-BBW-31) y el grosor del contorno de la piel (`stroke-width` computado
del `rect`, fijado por CSS en `--bbf-line-sm`). Los ±1 de capa dentro del párrafo son constantes de algoritmo. El margen por glifo es una medida
en tiempo de ejecución, no un valor de diseño.

**HTML servido (D-BBW-28, I-4):** el texto íntegro de cada enlace y botón y la piel CSS del átomo; sin JavaScript no cambia nada salvo el subrayado de
los enlaces en prosa, que es el del prototipo (degradado de `--bbf-line-sm` al pie de la caja) con y sin JavaScript. El cliente parte el texto en
el primer contacto (desplazamiento ≤ 0,33 px, CLS 0, medido en M2 F5) dejando el texto literal como nombre oculto.

**Quietud (D-BBW-31, I-9):** con `--bbf-motion-scatter-play-state: paused` el cableador devuelve antes de registrar un oyente o un rAF y no parte
nada; quedan los hovers de reposo (color de acento, contorno/relleno de acento, opacidad en prosa) del mismo bloque. Pestaña oculta: el bucle se
cancela y se reanuda al volver si queda energía. Un host fuera de pantalla que se asienta, o que deja de renderizarse mientras está activo (la barra
del consentimiento se oculta al decidir), salta al reposo. Coste medido en el artefacto (M2 F5, privacidad con 19 hosts y 233 glifos activos a la
vez): mediana 1,2 ms · p95 1,5 ms por fotograma en escritorio; 3,3 · 4,7 ms con CPU ×4.

**Guardia R11 (`scripts/lint/check-glyph-scatter.ts`, `lint:scatter`, en `pnpm guard` y en el pre-commit):** `scripts/lint/fixtures/glyph-scatter-golden.{json,bin}`
guarda lo que escribió el prototipo aprobado en Chrome (3 semillas × 200 fotogramas, `Math.random` = mulberry32, activación por `pointerenter`,
dt = 1/60; el enlace «los casos» y los dos botones; x, y, giro, profundidad por glifo y la p de la piel; cabecera con el sha256 del prototipo y la
única sustitución, exponer el estado). El módulo sortea los mismos glifos en el mismo orden y falla si un valor difiere > 0,001 em, > 0,1° o > 0,001.
Vista fallar cambiando `AMP_X` y pasar (output de M2 §5).

**Guardia R11b (misma guardia, inventario de hosts en el código; 2026-11-06, al rebasar M2 sobre sello y banner):** todo `<a>`, `<Link>` y `<button>`
nativo de `src/components/**` y `src/app/**` lleva `data-scatter`, salvo los que la guardia exime **por selector nombrado con su motivo**:
`a[data-component="bbf-skip-link"]` (enlace de salto: invisible hasta el foco, no es una pieza de la página), `a[data-component="bbf-brand-mark"]`
(imagotipo: S9, su propio sistema), `a.cert` (sello del pie: un efecto por pieza, el suyo propio) y `(root)/page.tsx a` (defensa de la raíz, fuera del
layout del locale: no hay cableador). Una exención que no corresponde a exactamente UN host del código también falla: la lista no puede quedar muerta ni
tapar dos. Vista fallar quitando la exención del sello (1 host sin marcar: `Footer.tsx a.cert`) y añadiendo un `<a>` sin marcar a un componente; vista
pasar al restaurar (output del rebase, §3).

---
*BBW-BEHAVIOR v1.11 · `docs/system/BEHAVIOR.md` · 2026-11-06 · v1.11 en sello según solape (instrucción directa de Zavala, sigue P-BBW-82: §13 el sello se oculta solo mientras la barra lo tapa, `IntersectionObserver` con la medida de la reserva, marcas `data-bar-avoid`/`data-bar-covered`, sale `data-consent-bar`) · v1.10 al rebasar M2 sobre sello y banner (instrucción directa de Zavala: §14 exime el sello por selector nombrado, R11b inventario; §13 conserva la nota del sello) · v1.9 en M2 (`DESPACHO-BBW-2026-11-06-M2-desarme-de-enlaces-y-botones`: S11 desarme de enlaces y botones, P-BBW-83, R11) y en sello y banner (instrucción directa de Zavala, P-BBW-82: el cableado expone `data-consent-bar`; roles `--bbf-motion-hover-lift` y `--bbf-hover-fine`) · v1.8 en M1d (`DESPACHO-BBW-2026-11-06-M1d-imagotipo-identico-al-prototipo`: conducta = prototipo (scroll en todos los dispositivos, toque, hover sin media query, sin despertar al cargar), orden de sorteo, línea central exacta, R10d identidad con el prototipo, criterios del modelo aprobado, coste medido (búfer + `join` sin mejora, no se conserva), R10 en el pre-commit) · v1.7 en M1c (`DESPACHO-BBW-2026-11-05-M1c-imagotipo-vivo-motor-y-guardia`: S9 porta el motor de referencia aprobado; rig v3 derivado al compilar; guardia R10 que ejecuta el motor; se retiran lienzo, `--bbf-base`, `clamp`, `natAngles`) · v1.6 en M1 (`DESPACHO-BBW-2026-11-05-M1-imagotipo-vivo`) · v1.4 en la fase 6l (`DESPACHO-BBW-2026-09-18-fase6l-P5-entradas-sombras-y-lockup`) · v1.3 en la fase 6k · v1.2 en la fase 6j · v1.1 en la fase 6i · nace en la fase 6h (D-BBW-30)*
