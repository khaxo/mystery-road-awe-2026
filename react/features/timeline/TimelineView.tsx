import { useSearchParams } from "react-router-dom";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { EmptyState } from "../../shared/components/EmptyState.js";
import { TimelineEntry } from "./components/TimelineEntry.js";
import { TimelineFilterBar } from "./components/TimelineFilterBar.js";

interface Props {
  daten: CaseDaten;
}

/**
 * Timeline-Ansicht.
 *
 * Liest den Query-Parameter `?person=` **einmal beim Rendern** und bestimmt
 * daraus die anfaenglich gezeigte Liste. Das ist kein State im Sinne der
 * Aufgabenregel: Der Wert kommt aus der URL, nicht aus einer Benutzeraktion,
 * die ich speichere. Die URL ist hier die Quelle der Wahrheit.
 *
 * Beispiel: /#/timeline?person=nova-byte zeigt nur Ereignisse mit Nova Byte.
 */
export function TimelineView({ daten }: Props) {
  const [suchparameter] = useSearchParams();
  const personFilter = suchparameter.get("person") ?? "";

  const gefiltert = personFilter
    ? daten.timeline.filter((evt) => evt.personIds.includes(personFilter))
    : daten.timeline;

  // slice() vor sort(), weil sort() in place arbeitet - sonst wuerde die
  // Reihenfolge im geladenen Datensatz mit veraendert (Bug 5 aus Uebung 1).
  const sortiert = gefiltert
    .slice()
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const typen = [...new Set(daten.timeline.map((evt) => evt.type))].sort();
  const personName = daten.people.find((p) => p.id === personFilter)?.name;

  return (
    <section className="view active">
      <h2>Timeline</h2>

      <TimelineFilterBar
        personen={daten.people}
        orte={daten.locations}
        typen={typen}
        gewaehltePerson={personFilter}
      />

      {/* Logisches UND: nur zeigen, wenn ueberhaupt gefiltert wird. */}
      {personFilter && (
        <p className="evidence-meta">
          Gefiltert nach <strong>{personName ?? personFilter}</strong> &mdash; aus der URL
          uebernommen.
        </p>
      )}

      {sortiert.length === 0 ? (
        <EmptyState text="No timeline events match the current filters." />
      ) : (
        sortiert.map((ereignis) => (
          <TimelineEntry
            key={ereignis.id}
            ereignis={ereignis}
            ortsnamen={ereignis.locationIds.map(
              (id) => daten.locations.find((o) => o.id === id)?.name ?? id
            )}
          />
        ))
      )}
    </section>
  );
}
