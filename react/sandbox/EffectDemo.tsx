import { useEffect, useState } from "react";

/**
 * Wegwerf-Ansicht fuer Demo 2 und Demo 3, erreichbar unter
 * /#/sandbox/effects.
 *
 * Sie beantwortet drei Fragen, die man nur sehen kann, wenn man sie laufen
 * laesst:
 *
 *   1. Wie oft laeuft ein Effekt mit / ohne / mit gefuellter
 *      Abhaengigkeitsliste?
 *   2. Wann laeuft die Aufraeumfunktion?
 *   3. Was passiert, wenn sie fehlt?
 */

/** Zaehlt, wie oft ein Effekt gelaufen ist - ausserhalb von React, damit das
 *  Zaehlen selbst keinen Render ausloest und die Zahlen nicht verfaelscht. */
const laeufe = { ohne: 0, leer: 0, gefuellt: 0 };

function Zaehler({ wert }: { wert: number }) {
  // KEINE Abhaengigkeitsliste: laeuft nach JEDEM Render.
  useEffect(() => {
    laeufe.ohne += 1;
  });

  // LEERE Liste: laeuft einmal, beim Mounten.
  // (In der Entwicklung zweimal - StrictMode mountet absichtlich doppelt.)
  useEffect(() => {
    laeufe.leer += 1;
  }, []);

  // GEFUELLTE Liste: laeuft, wenn sich `wert` aendert.
  useEffect(() => {
    laeufe.gefuellt += 1;
  }, [wert]);

  return (
    <table className="attribute-table">
      <tbody>
        <tr>
          <td>
            <code>useEffect(fn)</code> &mdash; keine Liste
          </td>
          <td>
            <strong>{laeufe.ohne}</strong> Laeufe
          </td>
          <td>nach jedem Render</td>
        </tr>
        <tr>
          <td>
            <code>useEffect(fn, [])</code> &mdash; leer
          </td>
          <td>
            <strong>{laeufe.leer}</strong> Laeufe
          </td>
          <td>einmal beim Mounten</td>
        </tr>
        <tr>
          <td>
            <code>useEffect(fn, [wert])</code> &mdash; gefuellt
          </td>
          <td>
            <strong>{laeufe.gefuellt}</strong> Laeufe
          </td>
          <td>
            wenn sich <code>wert</code> aendert
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Timer MIT Aufraeumfunktion. Protokolliert Aufbau und Abbau in der Konsole.
 */
function TimerMitAufraeumen({ marke }: { marke: number }) {
  const [sekunden, setSekunden] = useState(0);

  useEffect(() => {
    console.log(`[MIT cleanup] Intervall ${marke} gestartet`);
    const id = setInterval(() => {
      setSekunden((v) => v + 1);
    }, 1000);

    return () => {
      clearInterval(id);
      console.log(`[MIT cleanup] Intervall ${marke} beendet`);
    };
  }, [marke]);

  return (
    <p>
      Mit Aufraeumen, Instanz {marke}: <strong>{sekunden}s</strong>
    </p>
  );
}

/**
 * Derselbe Timer OHNE Aufraeumfunktion.
 *
 * Das Intervall laeuft nach dem Unmounten weiter und ruft setSekunden auf
 * einer Komponente auf, die es nicht mehr gibt. Beobachtbar in der Konsole:
 * Die Zeilen "[OHNE cleanup] tick" hoeren nicht auf, auch wenn die Komponente
 * weg ist. Und bei jedem Wechsel von `marke` kommt ein weiteres Intervall
 * hinzu, ohne dass das alte endet - die Ticks werden immer dichter.
 *
 * Absichtlich falsch. Nur in dieser Wegwerf-Ansicht.
 */
function TimerOhneAufraeumen({ marke }: { marke: number }) {
  const [sekunden, setSekunden] = useState(0);

  useEffect(() => {
    console.log(`[OHNE cleanup] Intervall ${marke} gestartet - wird nie beendet`);
    setInterval(() => {
      console.log(`[OHNE cleanup] tick von Instanz ${marke}`);
      setSekunden((v) => v + 1);
    }, 1000);
    // kein return - das ist der Fehler, den diese Komponente zeigt
  }, [marke]);

  return (
    <p>
      Ohne Aufraeumen, Instanz {marke}: <strong>{sekunden}s</strong>
    </p>
  );
}

export function EffectDemo() {
  const [wert, setWert] = useState(0);
  const [andererWert, setAndererWert] = useState(0);
  const [timerSichtbar, setTimerSichtbar] = useState(false);
  const [mitAufraeumen, setMitAufraeumen] = useState(true);
  const [marke, setMarke] = useState(1);

  return (
    <section className="view active">
      <h2>Sandbox: Effekte, Abhaengigkeiten, Aufraeumen</h2>
      <p className="hint-text">Wegwerf-Ansicht fuer Demo 2 und Demo 3. Konsole oeffnen.</p>

      <h3>1. Wie oft laeuft welcher Effekt?</h3>
      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={() => setWert(wert + 1)}>
          wert erhoehen (jetzt {wert})
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setAndererWert(andererWert + 1)}
        >
          anderen Zustand erhoehen (jetzt {andererWert})
        </button>
      </div>
      <p className="hint-text">
        Der zweite Knopf loest ein Render aus, ohne <code>wert</code> zu aendern. Danach steigt die
        erste Zahl, die dritte nicht.
      </p>
      <Zaehler wert={wert} />

      <h3>2. Aufraeumfunktion</h3>
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setTimerSichtbar(!timerSichtbar)}
        >
          Timer {timerSichtbar ? "ausblenden (unmount)" : "einblenden (mount)"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setMitAufraeumen(!mitAufraeumen)}
        >
          gerade: {mitAufraeumen ? "MIT Aufraeumen" : "OHNE Aufraeumen"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setMarke(marke + 1)}>
          Abhaengigkeit aendern (marke = {marke})
        </button>
      </div>
      <p className="hint-text">
        Mit Aufraeumen: Jedes &bdquo;gestartet&ldquo; hat ein &bdquo;beendet&ldquo;. Ohne
        Aufraeumen: Die Ticks hoeren nach dem Ausblenden nicht auf, und jede Aenderung der
        Abhaengigkeit legt ein weiteres Intervall obendrauf.
      </p>

      {timerSichtbar &&
        (mitAufraeumen ? (
          <TimerMitAufraeumen marke={marke} />
        ) : (
          <TimerOhneAufraeumen marke={marke} />
        ))}
    </section>
  );
}
