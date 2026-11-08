/**
 * VARIANTES DE COLOR DEL FONDO (R1, D-BBW-96; BEHAVIOR §4.1) — los nombres que una página puede declarar en su fila del registro
 * (`src/config/pages.ts`, campo `backdrop`). Una página que no declara ninguna pinta el fondo del INICIO (giro 0, programa intacto).
 *
 * El nombre es lo único que vive aquí: el VALOR del giro es una madre derivada por fórmula de los tonos primitivos
 * (`--bbf-color-backdrop-turn-<nombre>`, `primitives/colors.css`) y el rol de página lo fija el selector `[data-backdrop="<nombre>"]`
 * (`semantic/colors.css`). La guardia R12 (`scripts/lint/check-backdrop.ts`) exige que las tres piezas existan para cada nombre, que la
 * portada no declare ninguna y que una página con variante no lleve partículas (D-BBW-105).
 */
export const BACKDROP_VARIANTS = ["verde"] as const;

export type BackdropVariant = (typeof BACKDROP_VARIANTS)[number];
