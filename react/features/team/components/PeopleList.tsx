import type { CaseDaten } from "../../../shared/hooks/useCaseData.js";
import { evidenceMentionsPerson } from "../../../../js/utils.js";
import { EmptyState } from "../../../shared/components/EmptyState.js";
import { PersonCard } from "./PersonCard.js";

interface Props {
  daten: CaseDaten;
}

/**
 * Feature-Komponente: beschafft und berechnet, stellt aber selbst nichts dar.
 *
 * Die zweite Haelfte der Aufteilung aus Demo 5. Hier lebt das Wissen darueber,
 * **wie** gezaehlt wird - naemlich ueber evidenceMentionsPerson(), das sowohl
 * die Person-ID als auch den Anzeigenamen prueft (weil evidence.json an einer
 * Stelle "Nova Byte" statt "nova-byte" enthaelt).
 *
 * PersonCard weiss davon nichts und muss es auch nicht wissen.
 */
export function PeopleList({ daten }: Props) {
  if (daten.people.length === 0) return <EmptyState text="Keine Personen geladen." />;

  return (
    <div className="people-grid">
      {daten.people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          anzahlBelege={daten.evidence.filter((ev) => evidenceMentionsPerson(ev, person)).length}
        />
      ))}
    </div>
  );
}
