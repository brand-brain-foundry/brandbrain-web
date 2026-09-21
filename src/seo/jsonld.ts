import { site, type Locale } from "@/config/site";

/**
 * DATOS ESTRUCTURADOS (fase 7; enmendados por D-BBW-58 y D-BBW-60). Se DERIVAN de la fuente única (`src/config/site.ts`) y del documento de
 * la página; ningún dominio, buzón ni nombre se escribe literal aquí (criterio transversal 1). Salen como un solo
 * `<script type="application/ld+json">` con un `@graph`.
 *
 * REGLA QUE MANDA (despacho fase 7 §F3, reafirmada por el de la enmienda §F3): los datos estructurados DESCRIBEN la página; no añaden
 * hechos que la página no dice.
 *
 * EL SUJETO DEL SITIO ES UNA `Person`, NO UNA `Organization` (D-BBW-58). La biblia estratégica v2 §2 convierte este sitio en la práctica
 * profesional de una persona y «Brand Brain Foundry» en el nombre del MÉTODO. Declarar una organización con el nombre de una persona sería
 * el dato falso que la regla prohíbe, así que el tipo cambia. Lo que eso arrastra, dicho entero porque no es una sustitución cosmética:
 *
 * · SALE `logo`. `logo` es propiedad de `Organization` (y de `Brand`, `Place`, `Product`), no de `Person`: emitirlo aquí sería inválido, y
 *   el resultado enriquecido de logo de Google es explícitamente de organización. El dibujo de marca NO desaparece del sitio —sigue siendo
 *   el icono de la cabecera, el favicon, el icono de Apple y los iconos del manifiesto, todos por el puerto de medios (D-BBW-21)—, deja de
 *   estar DECLARADO como logo de una entidad que ya no se declara. No se sustituye por `image`: `image` en una `Person` es una imagen DE la
 *   persona, y en esta página no hay ninguna.
 * · `jobTitle` SÍ entra (D-BBW-61), y entra por la razón que la regla exige: **el cargo volvió a ser visible**. La línea del pie lo dice
 *   ahora en voz alta, y la cadena que declara este campo es literalmente la misma que el pie compone, porque las dos salen de `site.role`.
 *   Ésta es la regla funcionando en la dirección buena: el turno anterior lo dejó fuera porque la página había dejado de decirlo, y entra
 *   en cuanto la página vuelve a decirlo. No se declara un cargo porque sea verdad; se declara porque **está escrito en la página**.
 *
 * LO QUE LA BIBLIA v2 §12 PIDE Y ESTA PÁGINA NO SOSTIENE TODAVÍA, dicho aquí para que no parezca olvido (despacho §5: si la biblia pide
 * declarar algo que la página no muestra, no se declara y se dice):
 * · `alumniOf` — la página no dice dónde estudió ni dónde trabajó. §10 lo prevé para la sección «Quién» (`#quien`, con Ogilvy), que **no
 *   está construida**. Entra con esa sección.
 * · `ProfessionalService` con `areaServed` (ES, SV, LatAm) — además de que la página no declara territorio, Google exige `address` con
 *   localidad física para todo `LocalBusiness` y no hay dirección publicada. Es la misma razón que ya lo mantenía fuera en la fase 7.
 * · `Service` por nivel — `/es/niveles` no existe; §13 de la biblia lo declara BLOQUEADO a la espera de decidir la forma del mantenimiento.
 * · `BreadcrumbList` — no hay páginas internas: el sitio es una sola portada.
 * · `FAQPage` — §12 lo condiciona a «preguntas reales» y no hay ninguna.
 * · SIGUE FUERA `ProfessionalService` (y cualquier `LocalBusiness`): Google exige `address` con la localidad física
 *   (developers.google.com/search/docs/appearance/structured-data/local-business) y este sitio no tiene dirección publicada. Inventarla
 *   sería el dato falso que §5 del despacho prohíbe. Cuando exista dirección real y visible en la página, el tipo entra y no antes.
 * · `sameAs` SE REFUERZA con el cambio, y conviene decir por qué. Entró en la fase 7b apoyado en la confirmación de Zavala de que los
 *   perfiles eran «de la marca», y quedó anotado como el límite de la regla: los nombres accesibles del pie son «Perfil de LinkedIn» y
 *   «Perfil de GitHub», deliberadamente sin atribuir. Con el sujeto convertido en persona, la afirmación que `sameAs` hace es más fácil de
 *   sostener, no menos: los destinos son literalmente perfiles personales (`/in/zavalacubas/`), y desde D-BBW-60 el pie que los contiene
 *   lleva el nombre de esa persona en su línea legal. **El límite se estrecha pero no desaparece**: sigue sin haber, en el texto, una frase
 *   que diga «estos perfiles son míos». Queda dicho, como antes, porque es un límite y no un descuido.
 * · `site.links.agency` y `site.links.works` tampoco entran en `sameAs`: son OTRAS entidades (la agencia hermana y un portafolio), no este
 *   sujeto con otra dirección.
 * · `aggregateRating`, `review`, `priceRange`, `telephone`, `birthDate`, `address`: no existen en la página. No se emiten.
 *
 * LÍMITE CONOCIDO de `WebSite` (verificado en vivo): el nombre de sitio de Google NO se admite a nivel de subdirectorio —
 * un sitio en subdirectorio (`/es/`) figura explícitamente como NO admitido (developers.google.com/search/docs/appearance/site-names,
 * actualizada 2025-12-10). La portada canónica de este sitio es `/es/` por D-BBW-07 (prefijo de ruta en ambos locales), así que la
 * característica de nombre de sitio queda fuera de alcance mientras `/` redirija. El tipo se emite igualmente: es válido, lo leen los
 * agentes de IA y declara idioma y editor. Cerrarlo exigiría servir el español sin prefijo, que D-BBW-07 descartó por firma.
 */
/** URL canónica de la portada de un locale publicado. Misma forma que emite el build (`trailingSlash: true`). */
export function homeUrl(locale: Locale): string {
  return `${site.url}/${locale}/`;
}

export function homeGraph(locale: Locale, description: string): object {
  const home = homeUrl(locale);
  const personId = `${site.url}/#person`;
  const websiteId = `${site.url}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        // la cadena del nombre, completa y sin variantes, desde la fuente única (D-BBW-58). Es la MISMA que el pie muestra en su línea legal.
        name: site.name,
        url: home,
        // el CARGO (D-BBW-61), de la misma constante que compone la línea del pie: lo declarado y lo visible son la misma cadena por construcción
        jobTitle: site.role,
        // el buzón oficial (D-BBW-13(a), reapuntado por D-BBW-58); la página lo lleva literal en el `href` del enlace de contacto
        email: site.contact.email,
        // los PERFILES personales, por su llave de rol en la fuente única. `agency` y `works` NO entran: son OTRAS entidades.
        sameAs: [site.links.linkedin, site.links.github],
        description,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: site.name,
        url: home,
        inLanguage: locale,
        // el sitio lo publica la persona: es su práctica profesional, no la web de una organización (D-BBW-58)
        publisher: { "@id": personId },
      },
    ],
  };
}
