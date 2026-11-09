import { site, type Locale } from "@/config/site";
import { PAGE_TYPES, type StructuredDataKind } from "@/config/page-types";
import { pageEntry, pageRules, pageUrl, type PageId } from "@/config/pages";
import { identity, type LinkKey } from "@/content/site";
import { entityList, entityText, entityValue, isEmittedOn, isProfilePageReadyOn, visibilityContext, type Credential, type Place, type VisibilityContext } from "@/content/entity";
import { getGlobal, requireSection } from "@/content";
import type { PageDocument } from "@/content/schema";
import { mediaMembers } from "@/media";

/**
 * DATOS ESTRUCTURADOS (fase 7; enmendados por D-BBW-58 y D-BBW-60; CONSTRUCTOR ÚNICO POR TIPO desde S1, P-BBW-94 §0.2.4: qué grafo emite una
 * página lo declara su TIPO en `src/config/page-types.ts` y lo construye el mapa `GRAPH_BUILDERS` de abajo; un tipo de grafo sin constructor
 * rompe el typecheck, como `SECTION_RENDERERS`. Mismo resultado que antes en la portada: el cambio es de estructura, no de contenido). Se DERIVAN de la fuente única (`src/config/site.ts` para lo técnico, `content/site.json` para lo editable, D-BBW-78) y del documento de
 * la página; ningún dominio, buzón ni nombre se escribe literal aquí (criterio transversal 1). Salen como un solo
 * `<script type="application/ld+json">` con un `@graph`.
 *
 * S3c · LA PERSONA SE DECLARA UNA VEZ (D-BBW-90; insumo CONTENIDO-PERFIL-WEB v1.0 §6): la página de perfil (tipo `profile`) emite `ProfilePage`
 * con el `Person` COMPLETO; la portada (tipo `website`) emite el `WebSite`, cuyo `publisher` apunta a la persona por su `@id`; ninguna otra
 * página la declara (R7h lo comprueba sobre todo el sitio servido). `Person.url` es la dirección canónica de la persona: la de la página de
 * perfil (§0.3.2 del despacho), no la portada, que redirige. `image` = los tres recortes del retrato; `workLocation` = localidad y país
 * (nunca `homeLocation` ni una dirección completa: §0.3.4, P-BBW-78); `dateCreated`/`dateModified` = las fechas que la página escribe en su
 * contenido, nunca la hora de la compilación. Lo que el párrafo de abajo dice del `Person` en la portada es historia: desde S3c vale para la
 * página de perfil.
 *
 * REGLA QUE MANDA (despacho fase 7 §F3, reafirmada por el de la enmienda §F3): los datos estructurados DESCRIBEN la página; no añaden
 * hechos que la página no dice.
 *
 * LA ENTIDAD, DESDE S2 (P-BBW-95): los campos del `Person` salen del BLOQUE DE ENTIDAD de `content/site.json` (`src/content/entity.ts`, descrito
 * en `entity-fields.ts`), y la regla de arriba se vuelve mecánica: un campo se emite solo si está `aprobado` Y ES VISIBLE en la página que
 * emite el grafo —visibilidad decidida al construir desde la capa de contenido (`visibilityContext`: el cuerpo de la página + el documento
 * global; S3) y confirmada por R7g sobre el HTML—, o si ya se emitía antes de S2 y sigue `heredado`. Lo `pendiente` no se emite. Lo aprobado y
 * sin texto visible (`description`, `alternateName`…) tampoco: entra el día que una sección lo escriba, sin tocar este archivo. Desde
 * D-BBW-116 la entrada del perfil es copy propio en primera persona, así que `description` no es visible en ninguna página y no se emite.
 * `ProfilePage` (`mainEntity` → la `Person`) se añade al grafo cuando el mínimo de la entidad se emite (`PROFILE_PAGE_MINIMUM`: nombre,
 * imagen y `sameAs`; la URL es la de la página); `description` es opcional y su ausencia no lo suprime (D-BBW-116).
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

const PERSON_ID = `${site.url}/#person`;
const WEBSITE_ID = `${site.url}/#website`;

/**
 * El `Person` COMPLETO conforme al bloque de entidad: cada propiedad entra solo si la entidad la emite en esta página (aprobada Y visible), en el
 * orden del insumo §6. `url` = la dirección canónica de la persona (la página de perfil que lo emite).
 */
function personNode(url: string, ctx: VisibilityContext): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "Person",
    "@id": PERSON_ID,
    // la cadena del nombre, completa y sin variantes, desde la fuente única (D-BBW-58): la misma que el <h1> de la página y el pie
    name: identity.brand,
  };
  // la única variante admitida (D-BBW-85): solo si está ESCRITA en la página fuera del nombre completo (hoy no: despacho S3c §6)
  if (isEmittedOn("alternateName", ctx)) node.alternateName = entityText("alternateName");
  // el CARGO (D-BBW-61): la misma constante que la línea bajo el <h1> y el pie
  if (isEmittedOn("role", ctx)) node.jobTitle = identity.role;
  // la frase definitoria (D-BBW-81/82/84): la entrada de la página la cita de la entidad
  if (isEmittedOn("description", ctx)) node.description = entityText("description");
  node.url = url;
  // el retrato: TODOS los recortes del conjunto que la entidad referencia (1:1, 4:3, 16:9), en direcciones absolutas y rastreables
  if (isEmittedOn("image", ctx)) {
    const urls = mediaMembers(String(entityValue("image"))).map((m) => `${site.url}${m.src}`);
    if (urls.length > 0) node.image = urls.length === 1 ? urls[0] : urls;
  }
  // el buzón, con la forma que el sitio emite desde S2: la dirección, sin `mailto:` (§0.3.3)
  if (isEmittedOn("email", ctx)) node.email = identity.email;
  // dónde trabaja (§0.3.4): localidad y país, nunca una dirección completa (P-BBW-78)
  if (isEmittedOn("location", ctx)) {
    const place = entityValue("location") as Place;
    node.workLocation = { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: place.locality, addressCountry: place.country } };
  }
  if (isEmittedOn("knowsAbout", ctx)) node.knowsAbout = entityList<string>("knowsAbout");
  if (isEmittedOn("credentials", ctx)) {
    const credentials = entityList<Credential>("credentials").map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      ...(c.category ? { credentialCategory: c.category } : {}),
      ...(c.issuer ? { recognizedBy: { "@type": "Organization", name: c.issuer } } : {}),
      url: identity.links[c.link as LinkKey],
    }));
    node.hasCredential = credentials.length === 1 ? credentials[0] : credentials;
  }
  // los PERFILES personales enlazados en la página (D-BBW-86)
  if (isEmittedOn("sameAs", ctx)) node.sameAs = entityList<LinkKey>("sameAs").map((k) => identity.links[k]);
  return node;
}

/** LA PORTADA: el sitio. Su editor es la persona, por referencia (`@id`): la persona no se declara aquí (insumo §6.3). */
function websiteGraph({ locale }: GraphContext): object {
  const home = pageUrl(locale, "home");
  return {
    "@context": "https://schema.org",
    "@graph": [{ "@type": "WebSite", "@id": WEBSITE_ID, name: identity.brand, url: home, inLanguage: locale, publisher: { "@id": PERSON_ID } }],
  };
}

/**
 * LA PÁGINA DE PERFIL: `ProfilePage` con el `Person` completo como `mainEntity` (Google, «ProfilePage structured data», act. 2026-09-08), o el
 * `Person` solo si la entidad no emite todavía el mínimo (`PROFILE_PAGE_MINIMUM`) en esta página.
 */
function profileGraph({ locale, id, page }: GraphContext): object {
  const url = pageUrl(locale, id);
  const ctx = visibilityContext(page, getGlobal(locale));
  const person = personNode(url, ctx);
  if (!isProfilePageReadyOn(ctx)) return { "@context": "https://schema.org", "@graph": [person] };
  const section = requireSection(page, "profile", `pages/${id} (${locale})`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profilepage`,
        url,
        // el nombre de la página es su <title>: la misma fórmula del tipo, sobre el mismo título propio
        name: pageRules(id).title(page.meta.title, identity.brand),
        inLanguage: locale,
        isPartOf: { "@id": WEBSITE_ID },
        // las fechas que la página escribe en su contenido (las edita una persona); nunca la hora de la compilación (R7h)
        dateCreated: section.published,
        dateModified: section.updated,
        mainEntity: person,
      },
    ],
  };
}

/** Un constructor por tipo de grafo. Un `StructuredDataKind` nuevo sin entrada aquí rompe el typecheck: nunca se omite en silencio. */
const GRAPH_BUILDERS: Record<StructuredDataKind, (ctx: GraphContext) => object | null> = {
  website: websiteGraph,
  profile: profileGraph,
  none: () => null,
};

/** Los datos estructurados de una página según su tipo, o `null` si su tipo no emite ninguno. */
export function structuredData(locale: Locale, id: PageId, page: PageDocument): object | null {
  const kind = PAGE_TYPES[pageEntry(id).type].structuredData;
  return GRAPH_BUILDERS[kind]({ locale, id, page });
}
