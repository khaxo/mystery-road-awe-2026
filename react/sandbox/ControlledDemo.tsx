import { useState } from "react";

/**
 * Wegwerf-Ansicht fuer Demo 2. Nicht in der Navigation verlinkt, erreichbar
 * unter /#/sandbox/controlled.
 *
 * Sie stellt drei Textfelder nebeneinander, die sich nur in einem Punkt
 * unterscheiden - wer den Wert besitzt:
 *
 *   1. UNKONTROLLIERT: `defaultValue`. React gibt den Startwert vor, danach
 *      verwaltet das DOM-Element den Wert selbst. Tippen funktioniert, aber
 *      React weiss nicht, was drinsteht.
 *
 *   2. KONTROLLIERT OHNE onChange: `value` ohne Rueckkanal. Tippen bewirkt
 *      NICHTS - und React warnt in der Konsole. Der Grund liegt im
 *      Render-Zyklus: Ein Tastendruck aendert zunaechst den DOM-Wert, loest
 *      aber keinen Zustandswechsel aus. React rendert also erneut (bzw. haelt
 *      am letzten Ergebnis fest) und schreibt denselben `value` wieder
 *      hinein. Das Feld springt sofort auf den alten Wert zurueck.
 *
 *   3. KONTROLLIERT MIT onChange: `value` plus Rueckkanal. Der Tastendruck
 *      aendert den Zustand, der neue Zustand erzeugt ein neues Render, und
 *      das Render setzt den neuen `value`. Erst dieser Kreis macht das Feld
 *      bedienbar.
 *
 * Merksatz: Bei einem kontrollierten Feld ist die Anzeige eine FOLGE des
 * Zustands. Fehlt onChange, fehlt der Weg vom Tastendruck zum Zustand - und
 * damit der Weg zurueck zur Anzeige.
 */
export function ControlledDemo() {
  const [wert, setWert] = useState("Tippen funktioniert");

  return (
    <section className="view active">
      <h2>Kontrolliert vs. unkontrolliert</h2>
      <p className="hint-text">
        Wegwerf-Ansicht fuer Demo 2. Konsole oeffnen und in alle drei Felder tippen.
      </p>

      <div className="form-row">
        <label htmlFor="demoUnkontrolliert">
          1. Unkontrolliert &ndash; <code>defaultValue</code>, kein <code>onChange</code>
        </label>
        <input id="demoUnkontrolliert" type="text" defaultValue="Tippen funktioniert" />
        <p className="hint-text">
          Das DOM besitzt den Wert. Tippen geht, aber React kennt den Inhalt nicht.
        </p>
      </div>

      <div className="form-row">
        <label htmlFor="demoEingefroren">
          2. Kontrolliert OHNE <code>onChange</code> &ndash; eingefroren
        </label>
        {/* Absichtlich ohne onChange. React warnt hier in der Konsole:
            "You provided a `value` prop to a form field without an `onChange`
            handler." */}
        <input id="demoEingefroren" type="text" value="Tippen bewirkt nichts" />
        <p className="hint-text">
          React besitzt den Wert, aber es gibt keinen Weg, ihn zu aendern. Jeder Tastendruck wird
          vom naechsten Render ueberschrieben.
        </p>
      </div>

      <div className="form-row">
        <label htmlFor="demoKontrolliert">
          3. Kontrolliert MIT <code>onChange</code>
        </label>
        <input
          id="demoKontrolliert"
          type="text"
          value={wert}
          onChange={(e) => setWert(e.target.value)}
        />
        <p className="hint-text">
          Zustand im Moment: <strong>{wert.length}</strong> Zeichen, Inhalt &bdquo;{wert}&ldquo;.
          React kennt den Wert, weil der Wert von React kommt.
        </p>
      </div>
    </section>
  );
}
