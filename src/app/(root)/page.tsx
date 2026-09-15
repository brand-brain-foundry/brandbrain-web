import { site } from "@/config/site";

/**
 * D-BBW-07 — `/` resuelve al locale por defecto.
 * Regla primaria: 301 en Cloudflare. Esta página es la DEFENSA en el propio build
 * por si el edge no responde: HTML estático con `meta refresh` (no depende de JS)
 * + enlace visible como último recurso. En export estático no corre middleware/proxy.
 * React 19 eleva el <meta> al <head> automáticamente.
 */
export default function RootPage() {
  const target = `/${site.defaultLocale}/`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <main>
        <p>
          <a href={target}>{site.name}</a>
        </p>
      </main>
    </>
  );
}
