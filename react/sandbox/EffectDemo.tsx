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

/* ------------------------------------------------------------------ *
 * Demo 1: ein Seiteneffekt IM RENDER
 * ------------------------------------------------------------------ */

const imRender = { zaehler: 0 };

/**
 * Absichtlich falsch gebaut. Nur in dieser Wegwerf-Ansicht.
 *
 * Die Komponente veraendert bei jedem Render eine Variable ausserhalb von
 * sich. Das ist ein Seiteneffekt im Render - und er "funktioniert"
 * scheinbar: Die Zahl steigt, die Anzeige stimmt.
 *
 * Nur steigt sie pro Klick um ZWEI, nicht um eins. Denn React ruft die
 * Funktion im StrictMode absichtlich zweimal auf, um genau solche Effekte
 * aufzudecken. Im Produktionsbuild waere es wieder eins - derselbe Code,
 * zwei verschiedene Ergebnisse.
 *
 * Und das ist die eigentliche Lektion: Eine Renderfunktion darf keine Spuren
 * hinterlassen, weil nicht sie entscheidet, wie oft sie laeuft.
 */
function SeiteneffektImRender({ klicks }: { klicks: number }) {
  // Genau diese Zeile ist der Fehler - und der Linter sagt es auch:
  //
  //   react-hooks/immutability
  //   "Modifying a variable defined outside a component or hook is not
  //    allowed. Consider using an effect."
  //
  // Die Regel kam mit eslint-plugin-react-hooks dazu. Hier ist sie
  // abgeschaltet, weil diese Komponente den Fehler ZEIGEN soll.
  // eslint-disable-next-line react-hooks/immutability
  imRender.zaehler += 1;

  return (
    <p>
      {klicks} Klicks &rarr; die Variable steht bei <strong>{imRender.zaehler}</strong>
    </p>
  );
}

/**
 * Drei Effekte, drei Abhaengigkeitslisten.
 *
 * Die Beobachtung laeuft ueber die KONSOLE, nicht ueber Zahlen auf dem
 * Bildschirm. Das hat einen Grund, der selbst zur Sache gehoert: Effekte
 * laufen NACH dem Rendern. Ein Zaehler, den ein Effekt erhoeht, ist auf dem
 * Bildschirm immer einen Render alt - und dieser Zaehler selbst darf keinen
 * neuen Render ausloesen, sonst laeuft der Effekt ohne Abhaengigkeitsliste
 * endlos.
 *
 * Die Konsole hat dieses Problem nicht: Sie zeigt die Reihenfolge, in der
 * tatsaechlich etwas passiert ist.
 */
function Zaehler({ wert }: { wert: number }) {
  // KEINE Abhaengigkeitsliste: laeuft nach JEDEM Render.
  useEffect(() => {
    console.log(`  [keine Liste]  laeuft   (wert ist ${wert})`);
  });

  // LEERE Liste: laeuft einmal, beim Mounten.
  // In der Entwicklung zweimal - StrictMode mountet absichtlich doppelt.
  useEffect(() => {
    console.log("  [leere Liste]  laeuft   (nur beim Mounten)");
  }, []);

  // GEFUELLTE Liste: laeuft, wenn sich `wert` aendert.
  useEffect(() => {
    console.log(`  [Liste [wert]] laeuft   (wert ist jetzt ${wert})`);
  }, [wert]);

  return (
    <table className="attribute-table">
      <tbody>
        <tr>
          <td>
            <code>useEffect(fn)</code>
          </td>
          <td>keine Liste</td>
          <td>nach jedem Render</td>
        </tr>
        <tr>
          <td>
            <code>useEffect(fn, [])</code>
          </td>
          <td>leere Liste</td>
          <td>einmal beim Mounten</td>
        </tr>
        <tr>
          <td>
            <code>useEffect(fn, [wert])</code>
          </td>
          <td>gefuellte Liste</td>
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
  const [klicks, setKlicks] = useState(0);
  const [wert, setWert] = useState(0);
  const [andererWert, setAndererWert] = useState(0);
  const [timerSichtbar, setTimerSichtbar] = useState(false);
  const [mitAufraeumen, setMitAufraeumen] = useState(true);
  const [marke, setMarke] = useState(1);

  return (
    <section className="view active">
      <h2>Sandbox: Effekte, Abhaengigkeiten, Aufraeumen</h2>
      <p className="hint-text">Wegwerf-Ansicht fuer Demo 2 und Demo 3. Konsole oeffnen.</p>

      <h3>0. Seiteneffekt im Render (Demo 1)</h3>
      <p className="hint-text">
        Diese Komponente erhoeht beim Rendern eine Variable ausserhalb von sich. Die Zahl steigt pro
        Klick um <strong>zwei</strong> &mdash; StrictMode ruft die Renderfunktion in der Entwicklung
        absichtlich doppelt auf. Im Produktionsbuild waere es eins.
      </p>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setKlicks(klicks + 1)}>
          einmal neu rendern (Klicks: {klicks})
        </button>
      </div>
      <SeiteneffektImRender klicks={klicks} />

      <h3>1. Wie oft laeuft welcher Effekt?</h3>
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            console.log(`--- wert: ${wert} -> ${wert + 1} ---`);
            setWert(wert + 1);
          }}
        >
          wert erhoehen (jetzt {wert})
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            console.log(`--- anderer Zustand: ${andererWert} -> ${andererWert + 1} ---`);
            setAndererWert(andererWert + 1);
          }}
        >
          anderen Zustand erhoehen (jetzt {andererWert})
        </button>
      </div>
      <p className="hint-text">
        In der Konsole mitlesen. Der <strong>erste</strong> Knopf aendert <code>wert</code>: Dann
        laufen der Effekt ohne Liste <em>und</em> der mit <code>[wert]</code>. Der{" "}
        <strong>zweite</strong> Knopf loest ein Render aus, ohne <code>wert</code> zu aendern: Dann
        laeuft nur der ohne Liste. Der mit der leeren Liste laeuft nie wieder.
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
