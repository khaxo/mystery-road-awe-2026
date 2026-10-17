import { Link } from "react-router-dom";
import type { Person } from "../../../../js/types.js";
import { AttributeList } from "../../../shared/components/AttributeList.js";
import { Card } from "../../../shared/components/Card.js";

interface Props {
  person: Person;
  /** Fertig berechnet. Die Karte zaehlt nicht selbst. */
  anzahlBelege: number;
}

/**
 * Rein darstellend: Props rein, JSX raus.
 *
 * Vorher (siehe Commit davor) nahm diese Komponente den kompletten Datensatz
 * entgegen und hat die Anzahl selbst berechnet - sie machte zwei Jobs.
 * Jetzt bekommt sie nur noch die fertige Zahl. Zwei Folgen:
 *
 * - Sie ist in jedem Kontext einsetzbar, auch dort, wo die Zahl anders
 *   zustande kommt.
 * - Aendert sich die Zaehlregel (zaehlen Aliasse mit? auch die Timeline?),
 *   aendert sich nur PeopleList - diese Datei bleibt unberuehrt.
 */
export function PersonCard({ person, anzahlBelege }: Props) {
  return (
    <Card klasse="person-card">
      <div className="person-card-header">
        <img className="person-avatar" src={person.avatar} alt={`Portrait of ${person.name}`} />
        <div>
          <h3>{person.name}</h3>
          <div className="person-role">{person.role}</div>
        </div>
      </div>

      <p>
        <strong>Speciality:</strong> {person.speciality}
      </p>

      <AttributeList titel="Responsibilities" eintraege={person.responsibilities} />

      <div className="person-statement">&ldquo;{person.statement}&rdquo;</div>

      <p>
        {anzahlBelege} related evidence item{anzahlBelege === 1 ? "" : "s"}
        {" — "}
        {/* Link auf die parametrisierte Route. Ein echtes <a href>, also
            mittelklickbar und kopierbar. */}
        <Link to={`/team/people/${person.id}`} className="evidence-count-link">
          Profil oeffnen
        </Link>
      </p>
    </Card>
  );
}
