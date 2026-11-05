"use client";

import { useEffect, useRef } from "react";
import { inlineIcons } from "@/media";
import { startOctopus } from "@/behavior/brand-mark-octopus";
import styles from "./BrandMark.module.css";

/**
 * BrandMarkLive — atom · 'use client' (S9, M1). Renderiza el imagotipo inline con canvas superpuesto.
 * El SVG (reposo) está en el HTML desde el primer byte (D-BBW-28); el canvas entra solo al pasar el
 * puntero o tocar. Con movimiento reducido: solo cambia el color (no arranca el motor).
 */
export function BrandMarkLive({ href, name }: { href: string; name: string }) {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !svg || !canvas) return;
    return startOctopus(wrap, svg, canvas);
  }, []);

  const icon = inlineIcons.brandIcon;

  return (
    <a
      ref={wrapRef}
      href={href}
      className={styles.brandMark}
      data-component="bbf-brand-mark"
      data-enter=""
    >
      <span className={styles.iconWrap}>
        <svg
          ref={svgRef}
          viewBox={icon.viewBox}
          aria-label={name}
          focusable="false"
          className={styles.icon}
        >
          <path fill="currentColor" d={icon.d} />
        </svg>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </span>
    </a>
  );
}
