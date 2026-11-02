import { useEffect, useState } from "react";

/**
 * Was eine laufende oder abgeschlossene Anfrage ueber sich sagt.
 *
 * Drei Felder, und ihre Kombinationen sind der Inhalt von Demo 6:
 *
 *   laedt=true,  daten=null,  fehler=null   -> laedt
 *   laedt=false, daten=null,  fehler!=null  -> fehlgeschlagen
 *   laedt=false, daten!=null, fehler=null   -> erfolgreich
 *
 * Und der vierte Fall, der KEIN eigenes Feld braucht: erfolgreich, aber leer.
 * Das ist `daten.length === 0` - eine Eigenschaft der Daten, kein Zustand der
 * Anfrage. Ein viertes Flag `istLeer` waere doppelter Zustand (Uebung 5,
 * Demo 9).
 */
export interface Anfragezustand<T> {
  daten: T | null;
  laedt: boolean;
  fehler: string | null;
}

/** Eine Funktion, die mit einem Abbruchsignal Daten holt. */
export type Lader<T> = (signal: AbortSignal) => Promise<T>;

/** Ergebnis EINER Anfrage, zusammen mit der Marke, zu der es gehoert. */
interface Ergebnis<T> {
  marke: string;
  daten: T | null;
  fehler: string | null;
}

/**
 * Daten holen, mit Ladezustand, Fehlerzustand und Abbruch.
 *
 * ---------------------------------------------------------------------------
 * Was dieser Hook loest
 * ---------------------------------------------------------------------------
 * Jede Stelle, die Daten holt, braucht dieselben Dinge: einen Effekt, einen
 * Ladezustand, einen Fehlerzustand, ein try/catch und einen Abbruch beim
 * Aufraeumen. Bis Uebung 5 stand das handgeschrieben in useCaseData; jede
 * weitere Ladestelle haette es kopiert.
 *
 * ---------------------------------------------------------------------------
 * `laedt` ist ABGELEITET, nicht gespeichert
 * ---------------------------------------------------------------------------
 * Hier steht bewusst kein `const [laedt, setLaedt] = useState(true)`. Der
 * Ladezustand ist keine eigene Tatsache - er ist die Antwort auf die Frage:
 *
 *   Gehoert das gespeicherte Ergebnis zu der Anfrage, die gerade gilt?
 *
 * `marke` ist die Kennung der gueltigen Anfrage, und jedes Ergebnis traegt
 * die Marke, zu der es gehoert. Passen sie nicht zusammen, wird geladen.
 *
 * Das hat drei Folgen:
 *
 * 1. Es kann kein Zustand entstehen, in dem `laedt` false ist, obwohl noch
 *    geladen wird - genau der Fehler, der in der Vanilla-Version den Spinner
 *    haengen liess (dort: evidenceViewLoading wurde im Fehlerfall nie
 *    zurueckgesetzt).
 * 2. Beim Wechsel der Abhaengigkeiten ist `laedt` sofort true, ohne dass ein
 *    Effekt erst laufen muss. Die Oberflaeche zeigt nie kurz das alte
 *    Ergebnis als haette es zum neuen Zustand gehoert.
 * 3. Im Effekt wird kein Zustand synchron gesetzt. Das ist auch die
 *    Empfehlung der react-hooks-Regeln - `set-state-in-effect` warnt genau
 *    davor.
 *
 * ---------------------------------------------------------------------------
 * Der Abbruch, und warum er ZWEI Wirkungen hat
 * ---------------------------------------------------------------------------
 * Die Aufraeumfunktion ruft `controller.abort()`. Das tut zweierlei, und die
 * beiden sind leicht zu verwechseln:
 *
 * 1. Die HTTP-Anfrage wird abgebrochen. `fetch` lehnt mit einem AbortError
 *    ab, der Browser schliesst die Verbindung. Das spart Netzwerk und
 *    Serverlast.
 *
 * 2. Die Antwort kann nicht mehr in den Zustand gelangen - der catch-Zweig
 *    erkennt den AbortError und schreibt nichts, und der Erfolgszweig prueft
 *    `signal.aborted`. DAS ist der Teil, der den Wettlauf verhindert, nicht
 *    das Schliessen der Verbindung.
 *
 * Punkt 2 allein waere auch ohne AbortController erreichbar, mit einem Flag
 * in der Aufraeumfunktion - so machte es useCaseData bis Uebung 5, und so
 * macht es die Vanilla-Version mit `state.latestSearchRequestId`. Nur
 * Punkt 1 kann der AbortController zusaetzlich.
 */
export function useFetch<T>(
  lader: Lader<T>,
  abhaengigkeiten: readonly unknown[]
): Anfragezustand<T> {
  // Die Abhaengigkeiten als ein primitiver Wert. Das ist noetig, weil ein
  // Array bei jedem Render ein neues Objekt ist und als Abhaengigkeit eines
  // Effekts damit immer "geaendert" waere.
  const marke = JSON.stringify(abhaengigkeiten);

  const [ergebnis, setErgebnis] = useState<Ergebnis<T> | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const daten = await lader(controller.signal);
        // Zweiter Riegel neben dem AbortError: Es ist moeglich, dass fetch
        // schon erfolgreich war, als abgebrochen wurde. Dann darf das
        // Ergebnis trotzdem nicht in den Zustand.
        if (controller.signal.aborted) return;
        setErgebnis({ marke, daten, fehler: null });
      } catch (err) {
        // Ein Abbruch ist kein Fehler, sondern heisst: diese Antwort
        // interessiert niemanden mehr. Wuerde man ihn als Fehler behandeln,
        // zeigte jeder Tastendruck im Suchfeld kurz eine Fehlermeldung.
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (controller.signal.aborted) return;
        setErgebnis({
          marke,
          daten: null,
          fehler: err instanceof Error ? err.message : String(err)
        });
      }
    })();

    return () => {
      controller.abort();
    };

    // `lader` steht absichtlich nicht in der Liste. Bei jedem Render ist es
    // eine neue Pfeilfunktion, der Effekt wuerde also endlos neu laufen.
    // Stattdessen gilt ein Vertrag mit dem Aufrufer: In `abhaengigkeiten`
    // steht alles, wovon der Lader abhaengt. Diesen Vertrag kann der Linter
    // nicht pruefen - deshalb steht er hier ausgeschrieben.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marke]);

  // Gehoert das gespeicherte Ergebnis zur aktuellen Anfrage?
  const passend = ergebnis !== null && ergebnis.marke === marke;

  return {
    daten: passend ? ergebnis.daten : null,
    fehler: passend ? ergebnis.fehler : null,
    laedt: !passend
  };
}
