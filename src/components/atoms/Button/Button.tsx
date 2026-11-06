import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

/**
 * Button — atom (P-BBW-82, L3 §0.1 «Banner»). UN componente y UNA variante: los tres botones de la primera capa del consentimiento
 * («Rechazar», «Aceptar», «Configurar») y los tres del panel tienen que estar al MISMO NIVEL —tamaño, color, posición— (AEPD, Guía de
 * cookies, mayo de 2024; requisito 2 del despacho), y la forma más honesta de garantizarlo es que no exista otra variante que elegir.
 * Es un `<button type="button">`: nunca envía nada. El texto llega por `children` desde `content/`; el foco lo pinta el sistema (D-BBW-22).
 * Hereda la geometría de las llamadas a la acción del héroe (48 de alto, relleno lateral `space-7`, píldora, contorno de 1 px), por
 * los mismos tokens; no comparte hoja con ellas porque aquéllas son enlaces de una sección y éste es un control reutilizable.
 */
export function Button({
  children,
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type={type} className={`${styles.button}${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </button>
  );
}
