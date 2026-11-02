import { useReducer } from "react";
import { useParams } from "react-router-dom";
import type { Pruefstand } from "../../App.js";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { LEERER_FILTER, vorhandeneTypen, waehleEvidence } from "./auswahl.js";
import { filterReducer } from "./filterReducer.js";
import { EvidenceDetail } from "./components/EvidenceDetail.js";
import { EvidenceList } from "./components/EvidenceList.js";
import { EvidenceToolbar } from "./components/EvidenceToolbar.js";

interface Props {
  daten: CaseDaten;
  notizen: Record<string, string>;
  onNotizSpeichern: (evidenceId: string, text: string) => void;
  onPruefung: (evidenceId: string, stand: Pruefstand) => void;
}

/**
 * Belegkatalog.
 *
 * Diese Komponente besitzt genau eine Sorte Zustand: die Filterwerte. Sie
 * interessieren niemanden ausserhalb dieser Ansicht, also liegen sie hier und
 * nicht hoeher.
 *
 * Alles andere ist entweder von oben hereingegeben (Lesezeichen, Notizen) oder
 * BERECHNET:
 *
 *   sichtbar = waehleEvidence(alle Belege, Personen, Filterwerte)
 *
 * Die Liste wird bei jedem Render neu bestimmt und nirgends gespeichert. Damit
 * gibt es keinen Zeitpunkt, an dem sie nicht zu den Filterwerten passt - das
 * ist der strukturelle Unterschied zu `state.filteredEvidence` in der
 * Vanilla-Version (siehe Demo 4).
 *
 * Auch der ausgewaehlte Beleg ist kein Zustand mehr, sondern kommt aus der
 * Route. `state.selectedEvidence` ist damit ersatzlos verschwunden.
 */
export function EvidenceView({ daten, notizen, onNotizSpeichern, onPruefung }: Props) {
  const { evidenceId } = useParams();

  // Ein Reducer statt sieben useState-Aufrufe.
  //
  // Warum gerade hier: Die sieben Werte sind kein Buendel unabhaengiger
  // Schalter, sondern EIN Filterzustand. Sie werden gemeinsam gelesen
  // (waehleEvidence bekommt sie als Objekt), gemeinsam zurueckgesetzt
  // ("Clear filters") und wachsen gemeinsam - ein achtes Filterfeld
  // betrifft alle drei Stellen.
  //
  // Was konkret leichter wurde, verglichen mit dem Commit davor:
  //
  //   - Die Zuordnung "Feldname -> Setter" ist verschwunden. Sie war ein
  //     switch mit sechs Faellen, der von Hand mit dem Interface
  //     synchron gehalten werden musste.
  //   - zuruecksetzen() waren sieben Setter-Aufrufe in Folge. Jetzt ist es
  //     eine Aktion, und WELCHE Werte der Startzustand hat, steht an genau
  //     einer Stelle (LEERER_FILTER).
  //   - Die Komponente kennt die Form des Zustands nicht mehr im Detail.
  //     Sie schickt Absichten ("SET_FILTER") statt Werte an Setter.
  const [filter, dispatch] = useReducer(filterReducer, LEERER_FILTER);

  const sichtbar = waehleEvidence(daten.evidence, daten.people, filter);
  const gewaehlt = evidenceId ? (daten.evidence.find((ev) => ev.id === evidenceId) ?? null) : null;

  return (
    <section className="view active">
      <h2>Evidence Catalogue</h2>

      <EvidenceToolbar
        filter={filter}
        typen={vorhandeneTypen(daten.evidence)}
        personen={daten.people}
        orte={daten.locations}
        onFilter={(feld, wert) => dispatch({ type: "SET_FILTER", feld, wert })}
        onSortierung={(wert) => dispatch({ type: "SET_SORT", wert })}
        onZuruecksetzen={() => dispatch({ type: "CLEAR_FILTERS" })}
        treffer={sichtbar.length}
        gesamt={daten.evidence.length}
      />

      {/* Eine Beleg-ID in der Route, zu der es keinen Beleg gibt: sichtbar
          melden statt still ignorieren - dieselbe Haltung wie bei der
          404-Ansicht aus Uebung 4. */}
      {evidenceId && !gewaehlt && (
        <div className="warning-banner">Kein Beleg mit der Nummer {evidenceId}.</div>
      )}

      {gewaehlt && (
        <EvidenceDetail
          // key: Wechselt der Beleg, verwirft React die Instanz samt
          // Notiz-Entwurf. Ohne key wuerde der Entwurf des vorherigen Belegs
          // im Textfeld stehen bleiben.
          key={gewaehlt.id}
          beleg={gewaehlt}
          personennamen={gewaehlt.personIds.map(
            (id) => daten.people.find((p) => p.id === id)?.name ?? id
          )}
          ortsnamen={gewaehlt.locationIds.map((id) => {
            const ortEintrag = daten.locations.find((o) => o.id === id);
            return ortEintrag ? `${ortEintrag.id} - ${ortEintrag.name}` : id;
          })}
          notiz={notizen[gewaehlt.id] ?? ""}
          onNotizSpeichern={onNotizSpeichern}
          onPruefung={onPruefung}
        />
      )}

      {/* Keine Lesezeichen-Props mehr. Die Karten holen sich den Zustand
          selbst aus dem Context - diese Ansicht muss ihn nicht durchreichen. */}
      <EvidenceList
        belege={sichtbar}
        datensatzLeer={daten.evidence.length === 0}
        onZuruecksetzen={() => dispatch({ type: "CLEAR_FILTERS" })}
      />
    </section>
  );
}
