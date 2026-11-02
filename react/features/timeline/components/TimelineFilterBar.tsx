import type { CaseLocation, Person } from "../../../../js/types.js";

export interface TimelineFilter {
  order: string;
  person: string;
  ort: string;
  typ: string;
}

export type TimelineFilterFeld = keyof TimelineFilter;

interface Props {
  personen: readonly Person[];
  orte: readonly CaseLocation[];
  typen: readonly string[];
  filter: TimelineFilter;
  onFilter: (feld: TimelineFilterFeld, wert: string) => void;
}

/**
 * Filterleiste der Timeline.
 *
 * In Uebung 4 waren diese vier Steuerelemente absichtlich tot: `defaultValue`,
 * `disabled`, kein Handler. Jetzt sind sie kontrolliert - `value` von oben,
 * `onChange` nach oben.
 *
 * Die Besonderheit gegenueber dem Belegkatalog: Der Zustand dieser Leiste
 * liegt nicht in einem useState oder useReducer, sondern in der URL
 * (?order=&person=&ort=&typ=). TimelineView liest ihn mit useSearchParams.
 *
 * Begruendung: Eine gefilterte Timeline ist etwas, das man verschickt
 * ("schau dir mal die Ereignisse mit Nova Byte an"). Nach der Regel aus
 * Uebung 4 - wenn ein Zustand den Benutzer interessiert, gehoert er in die
 * URL - ist das hier der richtige Ort. Der Belegkatalog hat sieben
 * Filterwerte und wuerde daraus eine unleserliche Adresse machen; dort liegt
 * der Zustand deshalb in der Komponente. Zwei Antworten auf dieselbe Frage,
 * bewusst unterschiedlich.
 */
export function TimelineFilterBar({ personen, orte, typen, filter, onFilter }: Props) {
  return (
    <div className="filter-bar">
      <label>
        Order
        <select value={filter.order} onChange={(e) => onFilter("order", e.target.value)}>
          <option value="asc">Oldest first</option>
          <option value="desc">Newest first</option>
        </select>
      </label>

      <label>
        Person
        <select value={filter.person} onChange={(e) => onFilter("person", e.target.value)}>
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
        <select value={filter.ort} onChange={(e) => onFilter("ort", e.target.value)}>
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
        <select value={filter.typ} onChange={(e) => onFilter("typ", e.target.value)}>
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
