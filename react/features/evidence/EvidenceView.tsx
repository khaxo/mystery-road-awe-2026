import { useState } from "react";
import { useParams } from "react-router-dom";
import type { EvidenceSortOrder } from "../../../js/state.js";
import type { Pruefstand } from "../../App.js";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import type { FilterFeld, FilterZustand } from "./auswahl.js";
import { vorhandeneTypen, waehleEvidence } from "./auswahl.js";
import { EvidenceDetail } from "./components/EvidenceDetail.js";
import { EvidenceList } from "./components/EvidenceList.js";
import { EvidenceToolbar } from "./components/EvidenceToolbar.js";

interface Props {
  daten: CaseDaten;
  /** Einzige Quelle der Wahrheit fuer Lesezeichen - gehoert App.tsx. */
  bookmarks: readonly string[];
  onToggleBookmark: (evidenceId: string) => void;
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
export function EvidenceView({
  daten,
  bookmarks,
  onToggleBookmark,
  notizen,
  onNotizSpeichern,
  onPruefung
}: Props) {
  const { evidenceId } = useParams();

  // Sieben zusammengehoerige Werte, sieben useState-Aufrufe. Das ist die
  // naheliegende erste Fassung - und der Ausgangspunkt fuer Demo 7, wo
  // daraus ein useReducer wird.
  const [suche, setSuche] = useState("");
  const [typ, setTyp] = useState("");
  const [person, setPerson] = useState("");
  const [ort, setOrt] = useState("");
  const [status, setStatus] = useState("");
  const [relevanz, setRelevanz] = useState("");
  const [sortierung, setSortierung] = useState<EvidenceSortOrder>("date-desc");

  const filter: FilterZustand = { suche, typ, person, ort, status, relevanz, sortierung };

  // Sieben Setter brauchen eine Zuordnung von Feldname auf Setter. Die muss
  // von Hand gepflegt werden: ein neues Filterfeld heisst ein neuer useState,
  // ein neuer case hier UND eine neue Zeile in zuruecksetzen().
  function setzeFilter(feld: FilterFeld, wert: string) {
    switch (feld) {
      case "suche":
        setSuche(wert);
        break;
      case "typ":
        setTyp(wert);
        break;
      case "person":
        setPerson(wert);
        break;
      case "ort":
        setOrt(wert);
        break;
      case "status":
        setStatus(wert);
        break;
      case "relevanz":
        setRelevanz(wert);
        break;
    }
  }

  function zuruecksetzen() {
    setSuche("");
    setTyp("");
    setPerson("");
    setOrt("");
    setStatus("");
    setRelevanz("");
    setSortierung("date-desc");
  }

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
        onFilter={setzeFilter}
        onSortierung={setSortierung}
        onZuruecksetzen={zuruecksetzen}
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

      <EvidenceList belege={sichtbar} markierte={bookmarks} onToggleBookmark={onToggleBookmark} />
    </section>
  );
}
