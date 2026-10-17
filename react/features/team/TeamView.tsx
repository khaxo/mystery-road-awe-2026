import { Navigate, useParams } from "react-router-dom";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { EmptyState } from "../../shared/components/EmptyState.js";
import { LocationCard } from "./components/LocationCard.js";
import { PersonCard } from "./components/PersonCard.js";
import { TeamTabs } from "./components/TeamTabs.js";

interface Props {
  daten: CaseDaten;
}

const TABS = ["people", "locations"] as const;
type Tab = (typeof TABS)[number];

function istTab(wert: string | undefined): wert is Tab {
  return wert !== undefined && (TABS as readonly string[]).includes(wert);
}

/**
 * Feature-Komponente fuer "People & Locations".
 *
 * Sie liest den Routenparameter `:tab`, validiert ihn und entscheidet, welche
 * Liste gezeigt wird. Die Karten selbst kennt sie nur als Komponenten.
 */
export function TeamView({ daten }: Props) {
  const { tab } = useParams();

  // useParams liefert `string | undefined` - der Compiler weiss nichts ueber
  // die Routen. Ein unbekannter Tab wird auf den Standard umgeleitet, statt
  // eine leere Ansicht zu rendern.
  if (!istTab(tab)) return <Navigate to="/team/people" replace />;

  return (
    <section className="view active">
      <h2>People &amp; Locations</h2>
      <TeamTabs />

      {tab === "people" ? (
        <div className="people-grid">
          {daten.people.length === 0 ? (
            <EmptyState text="Keine Personen geladen." />
          ) : (
            daten.people.map((person) => (
              <PersonCard key={person.id} person={person} daten={daten} />
            ))
          )}
        </div>
      ) : (
        <div className="people-grid">
          {daten.locations.length === 0 ? (
            <EmptyState text="Keine Orte geladen." />
          ) : (
            daten.locations.map((ort) => <LocationCard key={ort.id} ort={ort} />)
          )}
        </div>
      )}
    </section>
  );
}
