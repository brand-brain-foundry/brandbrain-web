"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * ProfileMotion — organism cliente (P2 del perfil). SOLO CABLEA (BEHAVIOR.md §1.4): envuelve el cuerpo de la página de perfil y entrega su
 * caja a `src/behavior/profile-reveal.ts` (S13: apariciones una vez y línea de tiempo), que tiene las constantes y la quietud. Los hijos
 * llegan del servidor con su texto completo (D-BBW-09): sin JavaScript todo está visible y quieto, que es su reposo.
 * El módulo se carga APARTE (`import()`), como la capa del campo: el compilador reparte los componentes de cliente en fragmentos que piden
 * todas las páginas, y así el inicio solo lleva este envoltorio, no S13.
 */
export function ProfileMotion({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    void import("@/behavior/profile-reveal").then(({ startProfileReveal }) => {
      if (!cancelled) stop = startProfileReveal(el);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return (
    <div ref={ref} className={className} data-component="bbf-profile-motion">
      {children}
    </div>
  );
}
