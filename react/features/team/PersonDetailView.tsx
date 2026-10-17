import { Link, useParams } from "react-router-dom";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { evidenceMentionsPerson } from "../../../js/utils.js";
import { AttributeList } from "../../shared/components/AttributeList.js";
import { Badge } from "../../shared/components/Badge.js";
import { Card } from "../../shared/components/Card.js";
import { EmptyState } from "../../shared/components/EmptyState.js";

interface Props {
  daten: CaseDaten;
}

/**
 * Detailansicht einer Person, erreichbar ueber /team/people/:personId.
 *
 * Zeigt, warum ein Routenparameter hier richtig ist und kein Query-Parameter:
 * Die Person **ist** die Ressource, die diese Seite zeigt - nicht eine
 * Einstellung auf einer allgemeineren Seite.
 */
export function PersonDetailView({ daten }: Props) {
  const { personId } = useParams();

  // `personId` ist fuer TypeScript `string | undefined`, egal was in der
  // Routendefinition steht. Und selbst ein vorhandener Wert muss keiner echten
  // Person entsprechen - jemand kann /team/people/gibtesnicht aufrufen.
  const person = daten.people.find((p) => p.id === personId);

  if (!person) {
    return (
      <section className="view active">
        <h2>Person nicht gefunden</h2>
        <Card>
          <EmptyState text={`Zur Kennung "${personId ?? ""}" gibt es keine Person.`} />
          <p>
            <Link className="btn btn-secondary btn-small" to="/team/people">
              Zur Personenliste
            </Link>
          </p>
        </Card>
      </section>
    );
  }

  const belege = daten.evidence.filter((ev) => evidenceMentionsPerson(ev, person));

  return (
    <section className="view active">
      <h2>{person.name}</h2>

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
        <p>{person.background}</p>
      </Card>

      <Card titel={`Related evidence (${belege.length})`}>
        {belege.length === 0 ? (
          <EmptyState text="Keine Beweisstuecke erwaehnen diese Person." />
        ) : (
          belege.map((ev) => (
            <div className="mini-list-item" key={ev.id}>
              <strong>{ev.id}</strong>
              {" — "}
              {ev.title} <Badge text={ev.status} klasse={`badge-${ev.status}`} />
            </div>
          ))
        )}
      </Card>

      <p>
        <Link className="btn btn-secondary btn-small" to="/team/people">
          Zurueck zur Liste
        </Link>
      </p>
    </section>
  );
}
