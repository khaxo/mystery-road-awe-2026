import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const hier = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // GitHub Pages serviert Projekt-Sites unter https://<user>.github.io/<repo>/.
  // Ohne base wuerden alle gebauten Asset-URLs auf / zeigen und 404 liefern.
  base: "/mystery-road-awe-2026/",

  plugins: [
    // Uebersetzt JSX/TSX und bringt Fast Refresh in den Dev-Server.
    react()
  ],

  server: {
    port: 5173,
    open: false
  },

  build: {
    outDir: "dist",
    sourcemap: true,

    // Zwei Einstiegspunkte, weil die Migration schrittweise laeuft:
    //   index.html -> die bestehende Vanilla-TS-App (alle fuenf Views)
    //   react.html -> die neue React-Shell (Dashboard migriert, Rest Platzhalter)
    // Beide werden gebaut und deployt, beide bleiben benutzbar.
    rollupOptions: {
      input: {
        vanilla: resolve(hier, "index.html"),
        react: resolve(hier, "react.html")
      }
    }
  }
});
