import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serviert Projekt-Sites unter https://<user>.github.io/<repo>/.
  // Ohne base wuerden alle gebauten Asset-URLs auf / zeigen und 404 liefern.
  base: "/mystery-road-awe-2026/",

  server: {
    port: 5173,
    open: false
  },

  build: {
    outDir: "dist",
    // Sourcemaps, damit im Produktions-Build ein Stacktrace noch auf die
    // TypeScript-Quelle zeigt statt auf minifizierten Code.
    sourcemap: true
  }
});
