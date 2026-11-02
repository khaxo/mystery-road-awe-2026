import { useEffect, useState } from "react";
import type { Evidence } from "../../js/types.js";
import { nutztBackend, sucheEvidence } from "../api/fallApi.js";
import { EmptyState } from "../shared/components/EmptyState.js";
import { useFetch } from "../shared/hooks/useFetch.js";

/**
 * Wegwerf-Ansicht fuer Demo 7, erreichbar unter /#/sandbox/race.
 *
 * ---------------------------------------------------------------------------
 * Warum es diese Ansicht gibt
 * ---------------------------------------------------------------------------
 * Ein Wettlauf zwischen Anfragen braucht zwei Dinge, die der Belegkatalog
 * absichtlich nicht hat:
 *
 *   - eine Anfrage, die von einer BENUTZEREINGABE abhaengt (der Katalog
 *     filtert im Client - richtig so, siehe CHANGES-5.md, Demo 4),
 *   - und die Moeglichkeit, die ERSTE Anfrage langsam und die ZWEITE schnell
 *     zu machen.
 *
 * Hier gibt es beides: Die Suche geht an den Server, und die Verzoegerung ist
 * pro Suchbegriff einstellbar.
 *
 * ---------------------------------------------------------------------------
 * Wichtig fuer die Praesentation
 * ---------------------------------------------------------------------------
 * Die BEHOBENE Variante benutzt `useFetch` - denselben Hook, den die ganze
 * App benutzt. Die Korrektur liegt also nicht in dieser Wegwerf-Ansicht,
 * sondern an der Stelle, von der jede Ladestelle profitiert.
 *
 * Die KAPUTTE Variante daneben ist der handgeschriebene Effekt ohne Abbruch
 * und ohne Guard - also das, was man zuerst schreibt.
 */

const SCHNELL = 150;
const LANGSAM = 3000;

/* ------------------------------------------------------------------ *
 * Die kaputte Fassung: kein Abbruch, kein Guard
 * ------------------------------------------------------------------ */

function OhneSchutz({ suchbegriff, verzoegerung }: { suchbegriff: string; verzoegerung: number }) {
  const [treffer, setTreffer] = useState<Evidence[] | null>(null);
  const [laedt, setLaedt] = useState(false);

  useEffect(() => {
    // Der Linter meckert hier zu Recht: set-state-in-effect. Diese Fassung
    // ist absichtlich die naive - sie setzt den Ladezustand synchron, statt
    // ihn abzuleiten, und das ist Teil dessen, was sie falsch macht.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLaedt(true);
    void (async () => {
      // Kein signal, kein abgebrochen-Flag: Was zurueckkommt, wird
      // geschrieben - egal, ob es noch jemanden interessiert.
      const ergebnis = await sucheEvidence(suchbegriff, undefined, { delay: verzoegerung });
      console.log(`[OHNE Schutz] Antwort fuer "${suchbegriff}" trifft ein -> wird geschrieben`);
      setTreffer(ergebnis);
      setLaedt(false);
    })();
    // Keine Aufraeumfunktion. Das ist der Fehler.
  }, [suchbegriff, verzoegerung]);

  return (
    <div className="panel-card">
      <h3>Ohne Schutz</h3>
      <p className="evidence-meta">
        handgeschriebener Effekt, kein <code>AbortController</code>, kein Guard
      </p>
      {laedt && <p>laedt&hellip;</p>}
      <Ergebnisliste treffer={treffer} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Die behobene Fassung: useFetch, also Abbruch in der Aufraeumfunktion
 * ------------------------------------------------------------------ */

function MitSchutz({ suchbegriff, verzoegerung }: { suchbegriff: string; verzoegerung: number }) {
  const { daten, laedt, fehler } = useFetch<Evidence[]>(
    (signal) => sucheEvidence(suchbegriff, signal, { delay: verzoegerung }),
    [suchbegriff, verzoegerung]
  );

  return (
    <div className="panel-card">
      <h3>Mit Schutz</h3>
      <p className="evidence-meta">
        <code>useFetch</code> &mdash; derselbe Hook wie im Rest der App
      </p>
      {laedt && <p>laedt&hellip;</p>}
      {fehler && <p className="warning-banner">{fehler}</p>}
      <Ergebnisliste treffer={daten} />
    </div>
  );
}

function Ergebnisliste({ treffer }: { treffer: Evidence[] | null }) {
  if (treffer === null) return null;
  if (treffer.length === 0) return <EmptyState text="Keine Treffer." />;

  return (
    <>
      <p>
        <strong>{treffer.length}</strong> Treffer
      </p>
      <ul>
        {treffer.slice(0, 5).map((ev) => (
          <li key={ev.id}>
            {ev.id} &ndash; {ev.title}
          </li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Die Steuerung
 * ------------------------------------------------------------------ */

export function RaceDemo() {
  const [suchbegriff, setSuchbegriff] = useState("");
  const [verzoegerung, setVerzoegerung] = useState(SCHNELL);

  /**
   * Stellt den Wettlauf in einem Klick her.
   *
   * Erst eine LANGSAME Anfrage nach "calibration", dann 300 ms spaeter eine
   * SCHNELLE nach "chat". Die zweite ist lange fertig, bevor die erste
   * antwortet.
   *
   * Erwartung ohne Schutz: Die Anzeige zeigt kurz die Treffer fuer "chat" und
   * springt dann auf die Treffer fuer "calibration" - obwohl im Suchfeld
   * "chat" steht. Das ist das veraltete Ergebnis, das gewinnt.
   */
  function wettlaufAusloesen() {
    console.log("--- Wettlauf gestartet ---");
    setVerzoegerung(LANGSAM);
    setSuchbegriff("calibration");

    setTimeout(() => {
      setVerzoegerung(SCHNELL);
      setSuchbegriff("chat");
    }, 300);
  }

  return (
    <section className="view active">
      <h2>Sandbox: Wettlauf zwischen Anfragen</h2>

      {!nutztBackend && (
        <div className="warning-banner">
          Diese Ansicht braucht das Entwicklungs-Backend. Starte <code>npm run server</code> und
          rufe die Seite ueber <code>npm run dev</code> auf (nicht <code>dev:static</code>).
        </div>
      )}

      <p className="hint-text">
        Wegwerf-Ansicht fuer Demo 7. Konsole oeffnen, dann den Knopf druecken.
      </p>

      <div className="form-row">
        <label htmlFor="raceSuche">Suchbegriff (geht an den Server)</label>
        <input
          id="raceSuche"
          type="text"
          value={suchbegriff}
          onChange={(e) => setSuchbegriff(e.target.value)}
          placeholder="z. B. calibration"
        />
      </div>

      <div className="form-row">
        <label htmlFor="raceDelay">Verzoegerung des Servers: {verzoegerung} ms</label>
        <input
          id="raceDelay"
          type="range"
          min="0"
          max="4000"
          step="100"
          value={verzoegerung}
          onChange={(e) => setVerzoegerung(Number(e.target.value))}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={wettlaufAusloesen}>
          Wettlauf ausloesen
        </button>
        <span className="hint-text">
          langsame Anfrage nach &bdquo;calibration&ldquo;, 300 ms spaeter schnelle nach
          &bdquo;chat&ldquo;
        </span>
      </div>

      <p className="hint-text">
        Nach dem Klick steht im Suchfeld <code>chat</code>. Links muss am Ende trotzdem
        &bdquo;calibration&ldquo; stehen &mdash; das ist der Fehler. Rechts bleibt es bei
        <code> chat</code>.
      </p>

      <div className="dashboard-columns">
        <OhneSchutz suchbegriff={suchbegriff} verzoegerung={verzoegerung} />
        <MitSchutz suchbegriff={suchbegriff} verzoegerung={verzoegerung} />
      </div>
    </section>
  );
}
