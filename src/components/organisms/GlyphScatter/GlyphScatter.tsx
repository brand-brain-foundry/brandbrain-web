"use client";

import { useEffect } from "react";
import { startScatter } from "@/behavior/glyph-scatter";

/**
 * GlyphScatter — organism cliente sin markup (S11, M2, P-BBW-83). Cromo persistente que vive en el layout del locale y cablea UNA sola vez el
 * sistema de desarme de enlaces y botones sobre `document` (delegación de eventos): los componentes solo se marcan con `data-scatter` y nunca
 * saben de él. El HTML servido no cambia (I-4): el módulo parte el texto en el cliente y solo mueve. Con movimiento reducido el módulo devuelve
 * antes de registrar nada (D-BBW-31, I-9). Solo cablea: ciclo de vida (BEHAVIOR.md §1.4).
 */
export function GlyphScatter() {
  useEffect(() => startScatter(document), []);
  return null;
}
