import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Criterio transversal 2 (PLAN_DE_CONSTRUCCION §3) / D-BBW-09 (I-2): CERO texto de negocio dentro de un componente.
  // Todo texto visible llega por props o desde la capa de contenido (fase 5). `noStrings` cubre también `{"literal"}`;
  // los atributos quedan fuera (href, rel, lang, content de meta no son contenido de negocio).
  {
    files: ["src/app/**/*.tsx", "src/components/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": ["error", { noStrings: true, ignoreProps: true, noAttributeStrings: false }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
