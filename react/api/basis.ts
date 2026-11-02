// Woher die Daten kommen - die EINZIGE Stelle, an der das entschieden wird.
//
// ---------------------------------------------------------------------------
// Warum es hier zwei Quellen gibt
// ---------------------------------------------------------------------------
// Die Aufgabenstellung sagt ausdruecklich: Das Backend laeuft nur lokal in der
// Entwicklung und wird nicht deployt. Die GitHub-Pages-Pipeline aus Uebung 2
// baut und veroeffentlicht weiterhin das statische Frontend.
//
// Daraus folgt ein Problem, das die Aufgabe nicht nennt: Zeigen alle Aufrufe
// auf http://localhost:3001, ist die deployte Seite tot. Niemand, der
// khaxo.github.io oeffnet, hat diesen Server.
//
// Deshalb gibt es zwei Modi, und die Entscheidung faellt einmal, hier:
//
//   Entwicklung  ->  das Backend (http://localhost:3001/api)
//   Produktion   ->  die statischen Dateien (data/*.json), wie bis Uebung 5
//
// Das ist keine Notloesung, sondern dieselbe Trennung, die `vite build` und
// `vite dev` schon immer machen. Und sie kostet nichts: Beide Modi liefern
// dieselben Formen, weil das Backend genau diese Dateien ausliefert.
//
// Ueberschreiben:
//   npm run dev:static                                 statische Dateien im Dev
//   VITE_API_BASE=http://localhost:4000/api npm run dev  anderer Port

/** "static" bedeutet: direkt die Dateien unter data/, kein Backend. */
const STATISCH = "static";

function basisBestimmen(): string {
  const konfiguriert = import.meta.env.VITE_API_BASE;
  if (konfiguriert !== undefined && konfiguriert.length > 0) return konfiguriert;

  // import.meta.env.DEV ist zur Bauzeit bekannt. Im Produktionsbuild wird der
  // Zweig darunter wegoptimiert - der localhost-String landet also nicht
  // einmal im ausgelieferten Bundle.
  return import.meta.env.DEV ? "http://localhost:3001/api" : STATISCH;
}

const BASIS = basisBestimmen();

export const nutztBackend = BASIS !== STATISCH;

/**
 * Vollstaendige URL fuer einen Datensatz.
 *
 * `name` ist der Endpunktname ohne Schraegstrich: "case", "evidence", ...
 * Im statischen Modus wird daraus der Dateiname.
 *
 * `parameter` sind die Testschalter des Backends (delay, fail, empty, q). Im
 * statischen Modus werden sie weggelassen - eine Datei kann nicht langsam
 * oder kaputt sein, und genau deshalb gibt es das Backend.
 */
export function url(name: string, parameter?: Record<string, string>): string {
  if (!nutztBackend) return `data/${name}.json`;

  const basis = `${BASIS}/${name}`;
  if (!parameter) return basis;

  const query = new URLSearchParams(parameter).toString();
  return query ? `${basis}?${query}` : basis;
}

/** Fuer die Fehlermeldung in der Oberflaeche: Wo haben wir es versucht? */
export const BASIS_BESCHREIBUNG = nutztBackend ? BASIS : "data/*.json (statisch)";
