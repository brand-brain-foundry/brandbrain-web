/**
 * ADAPTADOR CLOUDFLARE WEB ANALYTICS del puerto de analítica (P-BBW-82; docs/system/PORTS.md, fila «Analítica»).
 *
 * El ÚNICO archivo del repo que conoce los dos anfitriones del actor (criterio de éxito 4 del despacho L3):
 *   · `static.cloudflareinsights.com` — de donde se descarga el fragmento (`beacon.min.js`).
 *   · `cloudflareinsights.com`        — a donde el fragmento envía las mediciones (`/cdn-cgi/rum`) en la instalación manual
 *                                      (FAQ de Web Analytics, 2026-07-14: «it will report back to cloudflareinsights.com/cdn-cgi/rum»).
 *
 * CÓMO SE CARGA (doc «Get started», 2026-04-17, y FAQ): un `<script type="module">` con `data-cf-beacon='{"token": …}'`,
 * insertado SOLO tras «Aceptar» y SOLO en las rutas que el registro mide. `type="module"` es lo que la propia doc pide para que
 * los navegadores antiguos no lo ejecuten.
 *
 * NAVEGACIÓN DE UNA SOLA CARGA (`spa`): la doc «Web Analytics for SPAs» (2026-08-20) dice que el fragmento sigue los cambios de
 * ruta por la API de navegación o parcheando `history.pushState`. Con Next, el pie lleva de una página a otra SIN recargar, así que
 * con `spa` activo una aceptación en la portada acabaría midiendo el aviso legal al navegar hasta él — justo lo que el requisito 6
 * prohíbe. Por eso `spa: false` (la opción documentada para desactivarlo, que «requiere la instalación manual»): se mide cada
 * CARGA COMPLETA de una página medida, y las navegaciones internas sin recarga no se cuentan. Es un recuento por debajo (la
 * portada es casi todo el tráfico y siempre es una carga completa) a cambio de que la exclusión sea cierta por construcción.
 *
 * RETIRAR (requisito 3, F5.4): el fragmento envía la carga inicial por `XMLHttpRequest` y las métricas finales por
 * `navigator.sendBeacon` al ocultarse la pestaña, y resuelve las dos referencias EN EL MOMENTO DE ENVIAR (leído en el propio
 * `beacon.min.js`, versión «2026.10.1», 2026-11-06: `navigator.sendBeacon.bind(navigator)` y `new XMLHttpRequest()` dentro de la
 * función de envío). Por eso `block()` puede cerrar la puerta DESPUÉS de haberlo cargado: envuelve las tres vías de salida
 * (`sendBeacon`, `XMLHttpRequest.open`, `fetch`) y descarta cualquier petición a los anfitriones del actor. Quien retira el
 * consentimiento recarga además la página (lo hace el cableado) para que el fragmento desaparezca del todo; la recarga dispara
 * el envío de cierre del fragmento y ese envío es, precisamente, el que la envoltura descarta.
 */
import type { AnalyticsAdapter } from "../port";

const SCRIPT_URL = "https://static.cloudflareinsights.com/beacon.min.js";
/** Anfitriones del actor: cualquier petición a ellos (o a sus subdominios) se descarta tras `block()`. */
const ACTOR_HOSTS = ["cloudflareinsights.com"] as const;
const SCRIPT_ATTR = "data-cf-beacon";

function isActorUrl(url: string | URL): boolean {
  try {
    const host = new URL(String(url), window.location.href).hostname;
    return ACTOR_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function createCloudflareAdapter(token: string): AnalyticsAdapter {
  let blocked = false;
  let loaded = false;

  return {
    name: "cloudflare",

    load() {
      if (loaded || blocked) return;
      if (document.querySelector(`script[${SCRIPT_ATTR}]`)) {
        loaded = true;
        return;
      }
      const script = document.createElement("script");
      script.type = "module";
      script.src = SCRIPT_URL;
      script.setAttribute(SCRIPT_ATTR, JSON.stringify({ token, spa: false }));
      document.body.appendChild(script);
      loaded = true;
    },

    block() {
      if (blocked) return;
      blocked = true;

      // 1) sendBeacon: la vía de las métricas finales (al ocultar la pestaña o salir).
      const nav = window.navigator;
      if (typeof nav.sendBeacon === "function") {
        const original = nav.sendBeacon.bind(nav);
        nav.sendBeacon = function sendBeacon(url: string | URL, data?: BodyInit | null): boolean {
          if (isActorUrl(url)) return false;
          return original(url, data);
        };
      }

      // 2) XMLHttpRequest: la vía de la carga inicial del fragmento.
      const xhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function open(
        this: XMLHttpRequest,
        method: string,
        url: string | URL,
        async: boolean = true,
        username?: string | null,
        password?: string | null,
      ): void {
        // Una petición al actor se desvía a un destino vacío: `send()` no lanza y nada sale de la máquina.
        const target = isActorUrl(url) ? "about:blank" : url;
        xhrOpen.call(this, method, target, async, username, password);
      };

      // 3) fetch: hoy el fragmento no la usa; se cierra también por si una versión futura cambia de vía.
      const originalFetch = window.fetch.bind(window);
      window.fetch = function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = typeof input === "string" || input instanceof URL ? input : input.url;
        if (isActorUrl(url)) return Promise.reject(new TypeError("analytics blocked"));
        return originalFetch(input, init);
      };

      // 4) El propio fragmento, si estaba en el documento: fuera (sus escuchas mueren con la recarga que hace el cableado).
      document.querySelector(`script[${SCRIPT_ATTR}]`)?.remove();
    },
  };
}
