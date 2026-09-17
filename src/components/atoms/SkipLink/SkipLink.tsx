import styles from "./SkipLink.module.css";

/**
 * SkipLink — atom. Enlace para saltar al contenido principal: primer elemento enfocable de la página, invisible hasta recibir el foco.
 * Texto por props desde `content/` (`nav.skipLabel`); destino = id del `<main>`. Sin literales, sin valores (CSS por tokens).
 */
export function SkipLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className={styles.skipLink} data-component="bbf-skip-link">
      {label}
    </a>
  );
}
