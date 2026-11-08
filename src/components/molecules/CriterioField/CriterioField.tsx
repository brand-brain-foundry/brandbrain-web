"use client";

import { useEffect, useRef } from "react";
import { startCriterioField } from "@/behavior/criterio-field";
import type { FieldMediaItem } from "@/media";
import styles from "./CriterioField.module.css";

/**
 * CriterioField — molecule cliente. El campo de puntos S8 (F0 §4). SOLO CABLEA (BEHAVIOR.md §1.4): monta el lienzo, busca la línea de
 * referencia (el primer elemento marcado con `data-field-line` dentro de su sección) y entrega todo a `src/behavior/criterio-field.ts`,
 * que tiene el algoritmo, las constantes, el reloj y la quietud. Decorativo (`aria-hidden`): toda la información está en el texto.
 * Sin JavaScript el HTML servido trae la placa vacía, que es su reposo (I-4: no hay texto que perder).
 * S12 (R2 del perfil, BEHAVIOR.md §15): `media` = el lote del campo que la sección declara, por el puerto de medios. Con lote vacío (o sin la
 * prop) el componente es exactamente el de antes y el módulo de la capa ni se descarga; con medios, se carga aparte y se pasa al motor.
 */
export function CriterioField({ className, media }: { className?: string; media?: readonly FieldMediaItem[] }) {
  const plate = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const p = plate.current;
    const c = canvas.current;
    if (!p || !c) return;
    const section = p.closest("section");
    const line = section?.querySelector<HTMLElement>("[data-field-line]") ?? null;
    if (!media || media.length === 0) return startCriterioField(c, p, line);
    let stop: (() => void) | null = null;
    let cancelled = false;
    void import("@/behavior/field-media").then(({ createFieldMediaLayer }) => {
      if (cancelled) return;
      const layer = createFieldMediaLayer(p, section ?? p, media);
      const halt = startCriterioField(c, p, line, layer);
      stop = () => {
        halt();
        layer.dispose();
      };
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [media]);

  return (
    <div ref={plate} className={`${styles.plate}${className ? ` ${className}` : ""}`} aria-hidden="true" data-component="bbf-criterio-field">
      <canvas ref={canvas} className={styles.canvas} />
    </div>
  );
}
