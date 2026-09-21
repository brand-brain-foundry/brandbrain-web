import type { HeroSection as HeroSectionData } from "@/content/schema";
import { media } from "@/media";
import { HeroBackdrop } from "@/components/molecules/HeroBackdrop";
import { HeroMedia } from "@/components/molecules/HeroMedia";
import { HeroParticles } from "@/components/molecules/HeroParticles";
import { HeroClaim } from "@/components/molecules/HeroClaim";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — section (bloque de contenido de página). Fondo por capas de profundidad (semantic/layers.css): fondo (el sombreador,
 * `HeroBackdrop`) · medio (el vídeo por el puerto de medios, `HeroMedia`) · velo (la viñeta) · partículas · contenido.
 * Fase «héroe rediagramado» (D-BBW-47 · D-BBW-48 · D-BBW-49): el héroe pasa de UN bloque centrado a DOS ZONAS — texto a la izquierda,
 * arte a la derecha — y el bloque de texto cambia entero de inventario:
 *   · el CLAIM en tres líneas alineadas a la izquierda (`HeroClaim`, molecule cliente), de las que SOLO LA TERCERA respira su peso
 *     letra a letra con conservación de ancho. El claim NO es un encabezado: solo hay un encabezado principal por página.
 *   · el ENCABEZADO (`<h1>`) debajo, en cuerpo de texto (rol `body`). Es el único `<h1>` y es el que declara de qué va la página,
 *     según la biblia estratégica v2 §10; la fase 7 lo tenía en la palabra de marca y esto la enmienda.
 *   · (la FIRMA que D-BBW-49 puso aquí ya no está: PR#26 dejó de pintarla y D-BBW-60 retira la llave. El nombre vive ahora en la línea
 *     legal del pie, en su única aparición visible.)
 * Lo que sale en este mismo commit (I-6): el lockup de dos líneas con su ajuste óptico y su peso por puntero (`HeroLock`,
 * `behavior/optical-fit.ts`, EXC-BBW-02) y las dos afirmaciones.
 * Lo que NO cambia, que es casi todo lo caro: el sombreador, el seguimiento del sujeto, las partículas, el puerto de medios, el velo
 * local de legibilidad (D-BBW-25) y la entrada escalonada por pieza. Cambia la diagramación, no el sistema.
 */
export function HeroSection({ section }: { section: HeroSectionData }) {
  const headingId = `${section.id}-heading`;
  return (
    <section id={section.id} className={styles.hero} aria-labelledby={headingId} data-component="bbf-hero">
      <HeroBackdrop />
      {/*
        D-BBW-46 — el derivado pequeño en pantallas pequeñas. Medido el 2026-09-19 sobre la dirección de prueba: a 360 px la página
        se traía los 871,8 KB del derivado de 1280×720 de un total de 1.187 KB, teniendo el de 640×360 (315 KB) ya construido y
        servido. El corte es la madre `--bbf-bp-nav` (780 px), el único punto de ruptura del sistema; el literal se repite aquí
        porque el atributo `media` es HTML y no admite `var()`, igual que ocurre con `@media` (R8).
      */}
      <HeroMedia
        sources={[{ ...media.heroLoop360, media: "(max-width: 780px)" }, media.heroLoop720]}
        poster={media.heroLoopPoster}
      />
      <div className={styles.veil} aria-hidden="true" />
      <HeroParticles />
      <div className={styles.text}>
        <div className={styles.block}>
          <HeroClaim lines={[section.claimLine1, section.claimLine2, section.claimLine3]} />
          <h1 id={headingId} className={styles.heading} data-enter="">
            {section.heading}
          </h1>
        </div>
      </div>
    </section>
  );
}
