import { Navigate, useParams } from "react-router-dom";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { LocationsList } from "./components/LocationsList.js";
import { PeopleList } from "./components/PeopleList.js";
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

      {/* Conditional Rendering, Technik 4: Ternaer fuer zwei Alternativen. */}
      {tab === "people" ? <PeopleList daten={daten} /> : <LocationsList orte={daten.locations} />}
    </section>
  );
}
