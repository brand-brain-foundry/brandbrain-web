import type { ReactNode } from "react";
import { site } from "@/config/site";

/**
 * Root layout del segmento raíz `/` (route group). Coexiste con el root layout
 * de `[locale]/layout.tsx` (patrón "multiple root layouts" de Next). Existe
 * solo para servir la página de defensa de D-BBW-07 como HTML completo y estático.
 */
export default function RootRedirectLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
