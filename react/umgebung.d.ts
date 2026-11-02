// Typen fuer die Umgebungsvariablen, die Vite zur Bauzeit einsetzt.
//
// Statt `/// <reference types="vite/client" />` sind sie hier einzeln
// deklariert. Grund: vite/client typisiert import.meta.env mit einer
// Indexsignatur auf `any`. Jeder Zugriff waere damit `any`, und die
// no-unsafe-*-Regeln aus recommendedTypeChecked wuerden anschlagen.
//
// So steht ausserdem an einer Stelle, welche Variablen dieses Projekt
// ueberhaupt kennt.

interface ImportMetaEnv {
  /** true bei `vite dev`, false im Produktionsbuild. Zur Bauzeit ersetzt. */
  readonly DEV: boolean;
  readonly PROD: boolean;
  /**
   * Basis-URL des Entwicklungs-Backends, oder "static" fuer die Dateien
   * unter data/. Fehlt sie, entscheidet DEV - siehe react/api/basis.ts.
   */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
