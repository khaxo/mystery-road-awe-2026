import type { EvidenceSortOrder } from "../../../../js/state.js";
import { isSortOrder } from "../../../../js/state.js";
import type { CaseLocation, Person } from "../../../../js/types.js";
import type { FilterFeld, FilterZustand } from "../auswahl.js";

interface Props {
  filter: FilterZustand;
  typen: readonly string[];
  personen: readonly Person[];
  orte: readonly CaseLocation[];
  onFilter: (feld: FilterFeld, wert: string) => void;
  onSortierung: (wert: EvidenceSortOrder) => void;
  onZuruecksetzen: () => void;
  /** Anzahl der gerade sichtbaren Treffer - reine Anzeige. */
  treffer: number;
  gesamt: number;
}

/**
 * Filterleiste des Belegkatalogs.
 *
 * Alle sieben Steuerelemente sind KONTROLLIERT: `value` kommt von oben,
 * `onChange` meldet nach oben. Keines haelt einen eigenen Wert.
 *
 * Was das praktisch bedeutet, zeigt der "Clear filters"-Knopf: Er ruft nur
 * onZuruecksetzen() auf. In der Vanilla-Version musste clearFilters() sechs
 * DOM-Elemente einzeln aufsuchen und deren .value auf "" setzen - der
 * Zustand lag naemlich in den Feldern selbst. Hier liegt er eine Ebene
 * hoeher, die Felder zeigen ihn nur an, und ein einziger neuer Zustand
 * leert alle sechs gleichzeitig.
 *
 * Die Dropdown-Inhalte kommen per map() aus den Daten. Vorher baute
 * populateEvidenceDropdowns() dafuer HTML-Strings zusammen und schrieb sie
 * mit innerHTML += in die <select>-Elemente.
 */
export function EvidenceToolbar({
  filter,
  typen,
  personen,
  orte,
  onFilter,
  onSortierung,
  onZuruecksetzen,
  treffer,
  gesamt
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <label htmlFor="evidenceSearch" className="visually-hidden">
          Search evidence
        </label>
        <input
          type="text"
          id="evidenceSearch"
          placeholder="Search evidence by title, summary, or tag&hellip;"
          autoComplete="off"
          value={filter.suche}
          onChange={(e) => onFilter("suche", e.target.value)}
        />

        <label htmlFor="filterType" className="visually-hidden">
          Filter by type
        </label>
        <select
          id="filterType"
          value={filter.typ}
          onChange={(e) => onFilter("typ", e.target.value)}
        >
          <option value="">All types</option>
          {typen.map((typ) => (
            <option key={typ} value={typ}>
              {typ}
            </option>
          ))}
        </select>

        <label htmlFor="filterPerson" className="visually-hidden">
          Filter by person
        </label>
        <select
          id="filterPerson"
          value={filter.person}
          onChange={(e) => onFilter("person", e.target.value)}
        >
          <option value="">All people</option>
          {personen.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>

        <label htmlFor="filterLocation" className="visually-hidden">
          Filter by location
        </label>
        <select
          id="filterLocation"
          value={filter.ort}
          onChange={(e) => onFilter("ort", e.target.value)}
        >
          <option value="">All locations</option>
          {orte.map((ort) => (
            <option key={ort.id} value={ort.id}>
              {ort.id} &ndash; {ort.name}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-row">
        <label htmlFor="filterStatus" className="visually-hidden">
          Filter by status
        </label>
        <select
          id="filterStatus"
          value={filter.status}
          onChange={(e) => onFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>

        <label htmlFor="filterRelevance" className="visually-hidden">
          Filter by relevance
        </label>
        <select
          id="filterRelevance"
          value={filter.relevanz}
          onChange={(e) => onFilter("relevanz", e.target.value)}
        >
          <option value="">All relevance</option>
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>

        <label htmlFor="sortEvidence" className="visually-hidden">
          Sort evidence
        </label>
        <select
          id="sortEvidence"
          value={filter.sortierung}
          onChange={(e) => {
            // <option value> ist fuer TypeScript ein beliebiger string. Derselbe
            // Guard wie in der Vanilla-Version, unveraendert wiederverwendet.
            if (isSortOrder(e.target.value)) onSortierung(e.target.value);
          }}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">Title (A&ndash;Z)</option>
          <option value="title-desc">Title (Z&ndash;A)</option>
        </select>

        <button type="button" className="btn btn-secondary" onClick={onZuruecksetzen}>
          Clear filters
        </button>

        <span className="evidence-meta">
          {treffer} von {gesamt} Belegen
        </span>
      </div>
    </div>
  );
}
