import { site } from "@/config/site";
import { identity } from "@/content/site";

/**
 * D-BBW-07 — `/` resuelve al locale por defecto.
 * REGLA PRIMARIA: el 301 del borde, que desde D-BBW-55 vive **versionado** en `public/_redirects` y ya no en el panel del proveedor.
 * Esta página es la DEFENSA por si el borde no responde o el host no entiende ese fichero: HTML estático con `meta refresh` (no depende
 * de JavaScript) + enlace visible como último recurso. En export estático no corre middleware ni proxy.
 * React 19 eleva el <meta> al <head> automáticamente.
 *
 * LO QUE ESTA DEFENSA NO PUEDE HACER, medido y dicho para que nadie la confunda con la regla primaria: un `meta refresh` de CERO
 * segundos **no se dispara al parsear, espera al evento de carga del documento**, y esta página —por ser una página de Next— se trae
 * antes todos los fragmentos de JavaScript del export. Mientras tanto se ve **sin hoja de estilos** (este segmento no importa
 * `globals.css` a propósito: cargarla retrasaría aún más el evento de carga). Medido: 904 ms en localhost con todo caliente, y
 * segundos en red real; aislado el mecanismo, 174 ms sin recurso pesado contra 948 ms con él. Por eso es la SEGUNDA barrera y no la
 * primera: cumple —acaba llevando al locale— pero no es instantánea, y de ahí el 301 del borde.
 */
export default function RootPage() {
  const target = `/${site.defaultLocale}/`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <main>
        <p>
          <a href={target}>{identity.brand}</a>
        </p>
      </main>
    </>
  );
}
