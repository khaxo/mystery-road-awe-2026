import { useSearchParams } from "react-router-dom";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { EmptyState } from "../../shared/components/EmptyState.js";
import { TimelineEntry } from "./components/TimelineEntry.js";
import type { TimelineFilter, TimelineFilterFeld } from "./components/TimelineFilterBar.js";
import { TimelineFilterBar } from "./components/TimelineFilterBar.js";

interface Props {
  daten: CaseDaten;
}

/**
 * Timeline-Ansicht.
 *
 * Der Filterzustand liegt in der URL, nicht in der Komponente. useSearchParams
 * liefert ihn beim Lesen und setzt ihn beim Schreiben; ein Wechsel erzeugt
 * einen Eintrag in der Browser-Historie, der Zurueck-Button nimmt also eine
 * Filteraenderung zurueck.
 *
 * Beispiel: /#/timeline?person=nova-byte&order=desc
 *
 * In Uebung 4 war die Filterleiste abgeschaltet und nur der Parameter
 * ?person= wurde gelesen. Jetzt sind alle vier Werte bedienbar - und es ist
 * dabei kein useState entstanden.
 */
export function TimelineView({ daten }: Props) {
  const [suchparameter, setSuchparameter] = useSearchParams();

  const filter: TimelineFilter = {
    order: suchparameter.get("order") ?? "asc",
    person: suchparameter.get("person") ?? "",
    ort: suchparameter.get("ort") ?? "",
    typ: suchparameter.get("typ") ?? ""
  };

  function setzeFilter(feld: TimelineFilterFeld, wert: string) {
    // Immer eine NEUE URLSearchParams bauen. Die vorhandene zu veraendern
    // waere dieselbe Mutation eines fremden Objekts, die React-Zustand
    // verbietet - und setSuchparameter wuerde die Aenderung nicht bemerken.
    const neu = new URLSearchParams(suchparameter);
    if (wert) neu.set(feld, wert);
    else neu.delete(feld);
    setSuchparameter(neu);
  }

  const gefiltert = daten.timeline.filter((evt) => {
    if (filter.person && !evt.personIds.includes(filter.person)) return false;
    if (filter.ort && !evt.locationIds.includes(filter.ort)) return false;
    if (filter.typ && evt.type !== filter.typ) return false;
    return true;
  });

  // slice() vor sort(), weil sort() in place arbeitet - sonst wuerde die
  // Reihenfolge im geladenen Datensatz mit veraendert (Bug 5 aus Uebung 1).
  const sortiert = gefiltert
    .slice()
    .sort((a, b) =>
      filter.order === "desc"
        ? new Date(b.time).getTime() - new Date(a.time).getTime()
        : new Date(a.time).getTime() - new Date(b.time).getTime()
    );

  const typen = [...new Set(daten.timeline.map((evt) => evt.type))].sort();
  const personName = daten.people.find((p) => p.id === filter.person)?.name;

  return (
    <section className="view active">
      <h2>Timeline</h2>

      <TimelineFilterBar
        personen={daten.people}
        orte={daten.locations}
        typen={typen}
        filter={filter}
        onFilter={setzeFilter}
      />

      {/* Logisches UND: nur zeigen, wenn ueberhaupt gefiltert wird. */}
      {filter.person && (
        <p className="evidence-meta">
          Gefiltert nach <strong>{personName ?? filter.person}</strong> &mdash; aus der URL
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
