import { useEffect } from "react";

/**
 * Setzt den Titel des Browser-Tabs.
 *
 * ---------------------------------------------------------------------------
 * Warum das ein Effekt sein MUSS
 * ---------------------------------------------------------------------------
 * `document.title` gehoert nicht zu dem DOM, das React verwaltet. Reacts
 * Zustaendigkeit endet an seinem Wurzelknoten - alles darin baut und
 * aktualisiert React, alles darausserhalb nicht. Der Tab-Titel, der Verlauf
 * des Browsers, der localStorage und ein `window`-Listener sind in diesem
 * Sinne alle dasselbe: **externe Systeme**.
 *
 * Und genau dafuer ist useEffect da: einen Wert aus React in ein externes
 * System schreiben.
 *
 * Wuerde man `document.title = titel` direkt in den Komponentenkoerper
 * schreiben, waere es ein Seiteneffekt im Render. Das "funktioniert" meistens -
 * und bricht, sobald React die Komponente rendert, ohne das Ergebnis zu
 * verwenden. Im StrictMode passiert das in der Entwicklung bei jedem Render
 * absichtlich.
 *
 * ---------------------------------------------------------------------------
 * Warum die Aufraeumfunktion den alten Titel zuruecksetzt
 * ---------------------------------------------------------------------------
 * Damit dieser Hook umkehrbar ist. Wer ihn in einer Komponente benutzt, die
 * wieder verschwindet, soll keinen Titel hinterlassen, der nicht mehr passt.
 * In dieser App ist der Nutzen klein, weil die Komponente immer gerendert
 * wird - die Gewohnheit ist der Punkt: Ein Effekt, der etwas aufbaut, raeumt
 * es auch ab.
 */
export function useDokumentTitel(titel: string): void {
  useEffect(() => {
    const vorher = document.title;
    document.title = titel;

    return () => {
      document.title = vorher;
    };
  }, [titel]);
}
