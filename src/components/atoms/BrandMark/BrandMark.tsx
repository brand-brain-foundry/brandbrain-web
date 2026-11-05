import { BrandMarkLive } from "./BrandMarkLive";

/**
 * BrandMark — atom. La marca en la esquina, enlazada a la portada del locale. M1 (S9): muestra el
 * trazado oficial inline (`brand-icon.svg` por el puerto de medios, D-BBW-21) en color de acento al
 * reposo; al pasar/tocar, un lienzo canvas anima los 6 tentáculos independientemente. El HTML servido
 * siempre contiene el SVG (D-BBW-28); el motor JS se arranca en el cliente por BrandMarkLive.
 * Fase 6g: entra al cargar (`data-enter`). Fase 6l: retardo `enter-delay-brand` (260 ms, jerarquía
 * del diseño).
 */
export function BrandMark({ href, name }: { href: string; name: string }) {
  return <BrandMarkLive href={href} name={name} />;
}
