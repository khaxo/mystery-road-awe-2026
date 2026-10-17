import type { CaseDaten } from "../../../shared/hooks/useCaseData.js";
import type { Person } from "../../../../js/types.js";
import { evidenceMentionsPerson } from "../../../../js/utils.js";
import { AttributeList } from "../../../shared/components/AttributeList.js";
import { Card } from "../../../shared/components/Card.js";

interface Props {
  person: Person;
  daten: CaseDaten;
}

export function PersonCard({ person, daten }: Props) {
  // Diese Komponente macht zwei Jobs: sie RECHNET (wie viele Beweisstuecke
  // erwaehnen diese Person?) und sie STELLT DAR. Deshalb braucht sie den
  // kompletten Datensatz als Prop, obwohl sie fuer die Darstellung nur eine
  // Zahl braucht. Wird in Demo 5 aufgeteilt.
  const anzahl = daten.evidence.filter((ev) => evidenceMentionsPerson(ev, person)).length;

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
        {anzahl} related evidence item{anzahl === 1 ? "" : "s"}
      </p>
    </Card>
  );
}
