import type { ReactNode } from "react";
import type { Locale } from "@/config/site";
import type { PageId } from "@/config/pages";
import type { PageDocument } from "@/content/schema";
import { structuredData } from "./jsonld";

/**
 * DATOS ESTRUCTURADOS DE UNA PÁGINA, en el HTML SERVIDO (D-BBW-09): un rastreador que no ejecuta JavaScript los lee tal cual.
 * Qué grafo emite lo decide el TIPO de la página (`src/config/page-types.ts` → constructores de `./jsonld.ts`). Envuelve el `<main>` de
 * toda página: si su tipo emite un grafo, lo antepone como `<script type="application/ld+json">`; si no, devuelve el contenido tal cual
 * (sin fragmento de por medio: el documento servido es byte a byte el de antes, medido en S1 F6). Una página nueva emite lo que su tipo
 * declara sin tocar su `page.tsx`.
 */
export function WithStructuredData({ locale, id, page, children }: { locale: Locale; id: PageId; page: PageDocument; children: ReactNode }) {
  const graph = structuredData(locale, id, page);
  if (!graph) return children;
  return (
    <>
      <script
        type="application/ld+json"
        // JSON serializado desde un objeto construido en build; no hay entrada de usuario. `<` se escapa para que ningún valor pueda
        // cerrar la etiqueta (defensa en profundidad: hoy todos los valores salen de la fuente única y del contenido ya validado).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
      />
      {children}
    </>
  );
}
