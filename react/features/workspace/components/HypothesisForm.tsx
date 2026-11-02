import { useState } from "react";
import type { FormEvent } from "react";
import type { Evidence, Hypothesis, Person } from "../../../../js/types.js";
import { leseHypothese, schreibeHypothese } from "../../../shared/state/speicher.js";

interface Props {
  personen: readonly Person[];
  belege: readonly Evidence[];
}

/**
 * Liest den gespeicherten Entwurf EINMAL, beim ersten Rendern.
 *
 * Als Funktion an useState uebergeben (nicht aufgerufen!), damit der
 * localStorage nicht bei jedem Render erneut gelesen wird. useState(f) ruft f
 * nur beim Mounten auf; useState(f()) wuerde bei jedem Render lesen und das
 * Ergebnis dann wegwerfen.
 *
 * Das ersetzt loadHypothesisFromStorage() aus der Vanilla-Version, die sechs
 * DOM-Elemente aufsuchte und ihr .value von Hand setzte - und fuer das
 * Mehrfachauswahlfeld in einer Schleife ueber alle <option> deren .selected
 * beschrieb.
 */
function anfangsEntwurf(): Hypothesis {
  const gespeichert = leseHypothese();
  return {
    suspectId: gespeichert?.suspectId ?? "",
    nature: gespeichert?.nature ?? "",
    evidenceIds: gespeichert?.evidenceIds ?? [],
    // ?? statt ||: "0" ist ein gueltiger Wert. Mit || haette eine Confidence
    // von 0 nach dem Neuladen wieder 50 ergeben (Lektion aus Uebung 2).
    confidence: gespeichert?.confidence ?? "50",
    explanation: gespeichert?.explanation ?? "",
    alternative: gespeichert?.alternative ?? "",
    savedAt: gespeichert?.savedAt ?? ""
  };
}

/**
 * Hypothesen-Formular, vollstaendig kontrolliert.
 *
 * Alle sechs Eingaben liegen in EINEM Zustandsobjekt, nicht in sechs
 * useState-Aufrufen. Begruendung: Die Felder sind kein Buendel unabhaengiger
 * Einstellungen, sondern EIN Dokument. Es wird als Ganzes geladen, als Ganzes
 * gespeichert und als Ganzes in den localStorage geschrieben. Haette jedes
 * Feld seinen eigenen Zustand, muesste saveEntwurf() sie erst wieder zu einem
 * Objekt zusammensetzen - und beim naechsten neuen Feld wuerde man genau das
 * vergessen.
 *
 * Jede Aenderung erzeugt ein NEUES Objekt ({ ...entwurf, feld: wert }). Das
 * alte wird nicht angefasst. Warum das noetig ist, steht in CHANGES-5.md,
 * Demo 3.
 */
export function HypothesisForm({ personen, belege }: Props) {
  const [entwurf, setEntwurf] = useState<Hypothesis>(anfangsEntwurf);

  function speichern(event: FormEvent<HTMLFormElement>) {
    // Ohne das laedt der Browser die Seite neu - der Standardablauf eines
    // <form>-Submits. preventDefault() auf dem React-Ereignis wirkt dabei
    // genauso wie auf dem nativen.
    event.preventDefault();

    const fertig: Hypothesis = { ...entwurf, savedAt: new Date().toISOString() };
    try {
      schreibeHypothese(fertig);
    } catch (err) {
      console.error("Hypothesen-Entwurf konnte nicht gespeichert werden", err);
      return;
    }
    setEntwurf(fertig);
  }

  return (
    <div className="hypothesis-card">
      <h3>Hypothesis Draft</h3>
      <form onSubmit={speichern}>
        <div className="form-row">
          <label htmlFor="hypSuspect">Suspected responsible person</label>
          <select
            id="hypSuspect"
            value={entwurf.suspectId}
            onChange={(e) => setEntwurf({ ...entwurf, suspectId: e.target.value })}
          >
            <option value="">Select a person&hellip;</option>
            {personen.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypNature">Accidental or deliberate incident</label>
          <select
            id="hypNature"
            value={entwurf.nature}
            onChange={(e) => setEntwurf({ ...entwurf, nature: e.target.value })}
          >
            <option value="">Select&hellip;</option>
            <option value="accidental">Accidental</option>
            <option value="deliberate">Deliberate</option>
            <option value="unclear">Unclear</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypEvidence">Selected supporting evidence</label>
          {/* Mehrfachauswahl: der Wert ist ein Array, nicht ein String.
              selectedOptions liefert die ausgewaehlten <option>-Elemente. */}
          <select
            id="hypEvidence"
            multiple
            size={6}
            value={entwurf.evidenceIds}
            onChange={(e) =>
              setEntwurf({
                ...entwurf,
                evidenceIds: Array.from(e.target.selectedOptions, (option) => option.value)
              })
            }
          >
            {belege.map((beleg) => (
              <option key={beleg.id} value={beleg.id}>
                {beleg.id} &ndash; {beleg.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypConfidence">Confidence (0&ndash;100)</label>
          <input
            type="range"
            id="hypConfidence"
            min="0"
            max="100"
            value={entwurf.confidence}
            onChange={(e) => setEntwurf({ ...entwurf, confidence: e.target.value })}
          />
          {/* Abgeleitet, nicht gespeichert. Die Vanilla-Version hielt den
              angezeigten Wert in einem zweiten DOM-Knoten und musste ihn bei
              jeder Aenderung mitpflegen - dieselbe Zahl an zwei Stellen. */}
          <output htmlFor="hypConfidence">{entwurf.confidence}</output>
        </div>

        <div className="form-row">
          <label htmlFor="hypExplanation">Written explanation</label>
          <textarea
            id="hypExplanation"
            rows={4}
            placeholder="Explain your reasoning&hellip;"
            value={entwurf.explanation}
            onChange={(e) => setEntwurf({ ...entwurf, explanation: e.target.value })}
          />
        </div>

        <div className="form-row">
          <label htmlFor="hypAlternative">Alternative explanation</label>
          <textarea
            id="hypAlternative"
            rows={3}
            placeholder="What else could explain the evidence?"
            value={entwurf.alternative}
            onChange={(e) => setEntwurf({ ...entwurf, alternative: e.target.value })}
          />
        </div>

        <div className="form-actions">
          {/* type="submit": der Knopf loest das onSubmit des Formulars aus.
              Damit funktioniert auch Enter im Textfeld. */}
          <button type="submit" className="btn btn-primary">
            Save hypothesis draft
          </button>
          {entwurf.savedAt && (
            <span className="saved-msg">
              Gespeichert: {new Date(entwurf.savedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
