import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },

  // Basis-Regeln fuer alle JS/TS-Dateien
  js.configs.recommended,

  // TypeScript-Regeln, nur fuer .ts
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: ["**/*.ts"] })),

  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser }
    },
    rules: {
      // Fehler, die echte Bugs anzeigen
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": "warn",

      // In dieser App ist console.log teils bewusstes Logging - deshalb nur Warnung,
      // aber alert() blockiert den Thread und soll auffallen.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-alert": "warn"
    }
  },

  // MUSS zuletzt stehen: schaltet alle ESLint-Regeln ab, die mit Prettier
  // kollidieren wuerden (Einrueckung, Anfuehrungszeichen, Semikolons ...).
  prettierConfig
);
