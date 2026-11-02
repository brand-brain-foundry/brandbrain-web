"use client";

import { useEffect, useRef } from "react";
import { startCriterioField } from "@/behavior/criterio-field";
import styles from "./CriterioField.module.css";

/**
 * CriterioField — molecule cliente. El campo de puntos S8 (F0 §4). SOLO CABLEA (BEHAVIOR.md §1.4): monta el lienzo, busca la línea de
 * referencia (el primer elemento marcado con `data-field-line` dentro de su sección) y entrega todo a `src/behavior/criterio-field.ts`,
 * que tiene el algoritmo, las constantes, el reloj y la quietud. Decorativo (`aria-hidden`): toda la información está en el texto.
 * Sin JavaScript el HTML servido trae la placa vacía, que es su reposo (I-4: no hay texto que perder).
 */
export function CriterioField({ className }: { className?: string }) {
  const plate = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const p = plate.current;
    const c = canvas.current;
    if (!p || !c) return;
    const line = p.closest("section")?.querySelector<HTMLElement>("[data-field-line]") ?? null;
    return startCriterioField(c, p, line);
  }, []);

  return (
    <div ref={plate} className={`${styles.plate}${className ? ` ${className}` : ""}`} aria-hidden="true" data-component="bbf-criterio-field">
      <canvas ref={canvas} className={styles.canvas} />
    </div>
  );
}
