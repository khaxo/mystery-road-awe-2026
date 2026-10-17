import { Link, useSearchParams } from "react-router-dom";
import type { CaseDaten } from "../shared/hooks/useCaseData.js";
import { Card } from "../shared/components/Card.js";

interface Props {
  daten: CaseDaten;
}

/**
 * Wegwerf-Beispiel fuer Demo 4: key={index} gegen key={person.id}.
 *
 * Die Falle, die man leicht uebersieht: Bei rein darstellendem Inhalt erzeugt
 * key={index} das RICHTIGE Ergebnis, nur ineffizient - React rendert den Text
 * korrekt neu, man sieht nichts. Sichtbar falsch wird es erst, wenn Zustand im
 * DOM haengt, den React beim Wiederverwenden behaelt.
 *
 * Deshalb hat hier jede Zeile eine **unkontrollierte Checkbox**: Ihren Wert
 * verwaltet der Browser, nicht React. Genau deshalb bleibt er haengen, wenn
 * React den falschen Knoten wiederverwendet.
 *
 * Kein useState noetig - die Reihenfolge kommt aus dem Query-Parameter, also
 * aus der URL. Das haelt die Regel "kein State ueber das initiale Rendern
 * hinaus" ein.
 */
export function KeyDemo({ daten }: Props) {
  const [suchparameter] = useSearchParams();
  const umgekehrt = suchparameter.get("order") === "reverse";

  const liste = umgekehrt ? daten.people.slice().reverse() : daten.people;

  return (
    <section className="view active">
      <h2>
        Sandbox: key={"{index}"} gegen key={"{id}"}
      </h2>

      <Card titel="So geht der Versuch">
        <ol>
          <li>Setz in BEIDEN Listen den Haken bei derselben Person, z.B. der ersten.</li>
          <li>Klick unten auf &bdquo;Reihenfolge umkehren&ldquo;.</li>
          <li>
            Links wandert der Haken <strong>nicht</strong> mit - er bleibt an derselben Position und
            gehoert jetzt zur falschen Person. Rechts folgt er der Person.
          </li>
        </ol>
        <p>
          <Link
            className="btn btn-secondary btn-small"
            to={umgekehrt ? "/sandbox/keys" : "/sandbox/keys?order=reverse"}
          >
            {umgekehrt ? "Urspruengliche Reihenfolge" : "Reihenfolge umkehren"}
          </Link>
        </p>
      </Card>

      <div className="dashboard-columns">
        <Card titel="FALSCH: key={index}">
          {liste.map((person, index) => (
            // ABSICHTLICH FALSCH - das ist der Gegenstand dieser Demo.
            <label className="mini-list-item" key={index}>
              <input type="checkbox" /> {person.name}
            </label>
          ))}
        </Card>

        <Card titel="RICHTIG: key={person.id}">
          {liste.map((person) => (
            <label className="mini-list-item" key={person.id}>
              <input type="checkbox" /> {person.name}
            </label>
          ))}
        </Card>
      </div>
    </section>
  );
}
