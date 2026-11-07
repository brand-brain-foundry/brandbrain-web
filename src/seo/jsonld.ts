import { site, type Locale } from "@/config/site";
import { PAGE_TYPES, type StructuredDataKind } from "@/config/page-types";
import { pageEntry, pageUrl, type PageId } from "@/config/pages";
import { identity, type LinkKey } from "@/content/site";
import { entityList, entityText, isEmitted, isProfilePageReady, type Credential } from "@/content/entity";
import type { PageDocument } from "@/content/schema";
import { media } from "@/media";

/**
 * DATOS ESTRUCTURADOS (fase 7; enmendados por D-BBW-58 y D-BBW-60; CONSTRUCTOR ÚNICO POR TIPO desde S1, P-BBW-94 §0.2.4: qué grafo emite una
 * página lo declara su TIPO en `src/config/page-types.ts` y lo construye el mapa `GRAPH_BUILDERS` de abajo; un tipo de grafo sin constructor
 * rompe el typecheck, como `SECTION_RENDERERS`. Mismo resultado que antes en la portada: el cambio es de estructura, no de contenido). Se DERIVAN de la fuente única (`src/config/site.ts` para lo técnico, `content/site.json` para lo editable, D-BBW-78) y del documento de
 * la página; ningún dominio, buzón ni nombre se escribe literal aquí (criterio transversal 1). Salen como un solo
 * `<script type="application/ld+json">` con un `@graph`.
 *
 * REGLA QUE MANDA (despacho fase 7 §F3, reafirmada por el de la enmienda §F3): los datos estructurados DESCRIBEN la página; no añaden
 * hechos que la página no dice.
 *
 * LA ENTIDAD, DESDE S2 (P-BBW-95): los campos del `Person` salen del BLOQUE DE ENTIDAD de `content/site.json` (`src/content/entity.ts`, descrito
 * en `entity-fields.ts`), y la regla de arriba se vuelve mecánica: un campo se emite solo si está `aprobado` (y R7g para el build si no es
 * visible en la página), o si ya se emitía antes de S2 y sigue `heredado` (`description`, que toma la `meta.description` de la portada; `sameAs`).
 * Lo `pendiente` no se emite: ni `knowsAbout`, ni `hasCredential`, ni `image` salen hasta que la sesión C apruebe su valor y S3 lo haga visible.
 * `ProfilePage` (`mainEntity` → la `Person`) se añade al grafo cuando el mínimo de la entidad está aprobado (`PROFILE_PAGE_MINIMUM`); hoy no.
 *
 * EL SUJETO DEL SITIO ES UNA `Person`, NO UNA `Organization` (D-BBW-58). La biblia estratégica v2 §2 convierte este sitio en la práctica
 * profesional de una persona y «Brand Brain Foundry» en el nombre del MÉTODO. Declarar una organización con el nombre de una persona sería
 * el dato falso que la regla prohíbe, así que el tipo cambia. Lo que eso arrastra, dicho entero porque no es una sustitución cosmética:
 *
 * · SALE `logo`. `logo` es propiedad de `Organization` (y de `Brand`, `Place`, `Product`), no de `Person`: emitirlo aquí sería inválido, y
 *   el resultado enriquecido de logo de Google es explícitamente de organización. El dibujo de marca NO desaparece del sitio —sigue siendo
 *   el icono de la cabecera, el favicon, el icono de Apple y los iconos del manifiesto, todos por el puerto de medios (D-BBW-21)—, deja de
 *   estar DECLARADO como logo de una entidad que ya no se declara. No se sustituye por `image`: `image` en una `Person` es una imagen DE la
 *   persona, y en esta página no hay ninguna (S2: el campo `image` de la entidad existe, pendiente; entra cuando haya una y sea visible).
 * · `jobTitle` SÍ entra (D-BBW-61), y entra por la razón que la regla exige: **el cargo volvió a ser visible**. La línea del pie lo dice
 *   ahora en voz alta, y la cadena que declara este campo es literalmente la misma que el pie compone, porque las dos salen de `identity.role`.
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
 *   que diga «estos perfiles son míos». Queda dicho, como antes, porque es un límite y no un descuido. **S2:** las llaves de `sameAs` viven
 *   ahora en `entity.sameAs` (estado `heredado`: se emiten como antes); R7g informa que GitHub ya no es visible en la página (salió del pie
 *   el 2026-11-02) y lo deja para la sesión C, que decide si aprobarlo y hacerlo visible o retirarlo.
 * · `identity.links.agency`, `identity.links.studio` y `identity.links.works` tampoco entran en `sameAs`: son OTRAS entidades (la agencia hermana y un portafolio), no este
 *   sujeto con otra dirección. S2 les da sitio en `entity.relations` (pendiente).
 * · `aggregateRating`, `review`, `priceRange`, `telephone`, `birthDate`, `address`: no existen en la página. No se emiten.
 *
 * LÍMITE CONOCIDO de `WebSite` (verificado en vivo): el nombre de sitio de Google NO se admite a nivel de subdirectorio —
 * un sitio en subdirectorio (`/es/`) figura explícitamente como NO admitido (developers.google.com/search/docs/appearance/site-names,
 * actualizada 2025-12-10). La portada canónica de este sitio es `/es/` por D-BBW-07 (prefijo de ruta en ambos locales), así que la
 * característica de nombre de sitio queda fuera de alcance mientras `/` redirija. El tipo se emite igualmente: es válido, lo leen los
 * agentes de IA y declara idioma y editor. Cerrarlo exigiría servir el español sin prefijo, que D-BBW-07 descartó por firma.
 */
/** Lo que un constructor recibe: el locale, la página y su documento ya resuelto por el puerto de contenido. */
type GraphContext = { locale: Locale; id: PageId; page: PageDocument };

/** Un nodo `Person` conforme al bloque de entidad: las propiedades entran en el orden de siempre y solo si la entidad las emite. */
function personNode(personId: string, home: string, page: PageDocument): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "Person",
    "@id": personId,
    // la cadena del nombre, completa y sin variantes, desde la fuente única (D-BBW-58). Es la MISMA que el pie muestra en su línea legal.
    name: identity.brand,
    url: home,
  };
  // el CARGO (D-BBW-61), de la misma constante que compone la línea del pie: lo declarado y lo visible son la misma cadena por construcción
  if (isEmitted("role")) node.jobTitle = identity.role;
  // el buzón oficial (D-BBW-13(a), reapuntado por D-BBW-58); la página lo lleva literal en el `href` del enlace de contacto
  if (isEmitted("email")) node.email = identity.email;
  // los PERFILES personales, por su llave de rol en la fuente única (desde S2, declarados en `entity.sameAs`)
  if (isEmitted("sameAs")) node.sameAs = entityList<LinkKey>("sameAs").map((k) => identity.links[k]);
  // la descripción: propia cuando esté aprobada; mientras esté heredada, la `meta.description` de la portada (como antes de S2)
  if (isEmitted("description")) node.description = entityText("description") ?? page.meta.description;
  // lo NUEVO de S2, que no sale hasta que la sesión C lo apruebe y S3 lo haga visible
  if (isEmitted("knowsAbout")) node.knowsAbout = entityList<string>("knowsAbout");
  if (isEmitted("credentials")) {
    node.hasCredential = entityList<Credential>("credentials").map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      ...(c.issuer ? { recognizedBy: { "@type": "Organization", name: c.issuer } } : {}),
      url: identity.links[c.link as LinkKey],
    }));
  }
  if (isEmitted("image")) {
    const id = entityText("image") as keyof typeof media | undefined;
    if (id && id in media) node.image = `${site.url}${media[id].src}`;
  }
  return node;
}

/**
 * EL GRAFO DE LA ENTIDAD (`Person` + `WebSite`, y `ProfilePage` cuando la entidad tenga el mínimo aprobado): lo emite la portada. `url` de
 * `Person` y `WebSite` es la PORTADA del locale (la dirección de la persona y del sitio), no la página que lo emita: si otro tipo de página lo
 * emitiera algún día, seguiría apuntando a la portada.
 */
function entityGraph({ locale, page }: GraphContext): object {
  const home = pageUrl(locale, "home");
  const personId = `${site.url}/#person`;
  const websiteId = `${site.url}/#website`;

  const graph: object[] = [
    personNode(personId, home, page),
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: identity.brand,
      url: home,
      inLanguage: locale,
      // el sitio lo publica la persona: es su práctica profesional, no la web de una organización (D-BBW-58)
      publisher: { "@id": personId },
    },
  ];
  if (isProfilePageReady()) {
    // Google, «ProfilePage structured data» (act. 2026-09-08): `mainEntity` obligatorio; la página es el perfil de la persona que publica el sitio
    graph.push({ "@type": "ProfilePage", "@id": `${site.url}/#profile`, url: home, mainEntity: { "@id": personId } });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/** Un constructor por tipo de grafo. Un `StructuredDataKind` nuevo sin entrada aquí rompe el typecheck: nunca se omite en silencio. */
const GRAPH_BUILDERS: Record<StructuredDataKind, (ctx: GraphContext) => object | null> = {
  entity: entityGraph,
  none: () => null,
};

/** Los datos estructurados de una página según su tipo, o `null` si su tipo no emite ninguno. */
export function structuredData(locale: Locale, id: PageId, page: PageDocument): object | null {
  const kind = PAGE_TYPES[pageEntry(id).type].structuredData;
  return GRAPH_BUILDERS[kind]({ locale, id, page });
}
