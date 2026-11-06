"use client";

import { useEffect, useRef } from "react";
import { inlineIcons, rigs } from "@/media";
import { startOctopus } from "@/behavior/brand-mark-octopus";
import styles from "./BrandMark.module.css";

/**
 * BrandMarkLive — atom · 'use client' (S9, M1c). Renderiza el imagotipo inline (vector por el puerto de medios, D-BBW-21) y, en el
 * cliente, cablea el motor del imagotipo vivo sobre el MISMO `<path>`: el HTML servido trae el trazado oficial y el nombre accesible
 * desde el primer byte (D-BBW-28, I-4); el motor solo mueve y, al asentarse, restaura el `d` literal. Con movimiento reducido el motor
 * no arranca (D-BBW-31): solo cambia el color, que es CSS. Solo cablea: refs y ciclo de vida (BEHAVIOR.md §1.4).
 */
export function BrandMarkLive({ href, name }: { href: string; name: string }) {
  const hostRef = useRef<HTMLAnchorElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const path = pathRef.current;
    if (!host || !path) return;
    return startOctopus(host, path, rigs.brandIconRig);
  }, []);

  const icon = inlineIcons.brandIcon;

  return (
    <a ref={hostRef} href={href} className={styles.brandMark} data-component="bbf-brand-mark" data-enter="">
      <svg viewBox={icon.viewBox} aria-label={name} focusable="false" className={styles.icon}>
        <path ref={pathRef} fill="currentColor" d={icon.d} />
      </svg>
    </a>
  );
}
