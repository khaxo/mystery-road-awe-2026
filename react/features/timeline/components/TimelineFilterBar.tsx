import type { CaseLocation, Person } from "../../../../js/types.js";

interface Props {
  personen: readonly Person[];
  orte: readonly CaseLocation[];
  typen: readonly string[];
  /** Vorauswahl aus der URL. Die Steuerelemente sind absichtlich NICHT verdrahtet. */
  gewaehltePerson: string;
}

/**
 * Filterleiste der Timeline.
 *
 * Laut Aufgabenstellung fuer diese Uebung bewusst **nicht funktional**: Die
 * Dropdowns sind vollstaendig gerendert und zeigen die Vorauswahl aus der URL,
 * aendern beim Umstellen aber nichts. Das Verdrahten mit `onChange` und
 * `useState` ist Thema von Uebung 5.
 *
 * `defaultValue` statt `value`: Mit `value` und ohne `onChange` waere das Feld
 * dauerhaft eingefroren und React warnt in der Konsole. `defaultValue` macht es
 * zu einem *unkontrollierten* Element - der Browser verwaltet den Wert selbst,
 * React gibt nur den Startwert vor.
 */
export function TimelineFilterBar({ personen, orte, typen, gewaehltePerson }: Props) {
  return (
    <div className="filter-bar">
      <label>
        Order
        <select defaultValue="asc" disabled>
          <option value="asc">Oldest first</option>
          <option value="desc">Newest first</option>
        </select>
      </label>

      <label>
        Person
        <select defaultValue={gewaehltePerson} disabled>
          <option value="">All people</option>
          {personen.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Location
        <select defaultValue="" disabled>
          <option value="">All locations</option>
          {orte.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id}
            </option>
          ))}
        </select>
      </label>

      <label>
        Type
        <select defaultValue="" disabled>
          <option value="">All event types</option>
          {typen.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
