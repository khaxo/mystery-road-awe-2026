import { useState } from "react";
import { Link } from "react-router-dom";
import type { Evidence } from "../../../../js/types.js";
import { isEvidenceRelevance, isEvidenceStatus } from "../../../../js/types.js";
import { formatDate } from "../../../../js/utils.js";
import type { Pruefstand } from "../../../App.js";

interface Props {
  beleg: Evidence;
  /** Aufgeloeste Anzeigenamen. Die Detailansicht sucht nichts selbst. */
  personennamen: readonly string[];
  ortsnamen: readonly string[];
  /** Die GESPEICHERTE Notiz, nicht der Entwurf im Textfeld. */
  notiz: string;
  onNotizSpeichern: (evidenceId: string, text: string) => void;
  onPruefung: (evidenceId: string, stand: Pruefstand) => void;
}

/**
 * Detailansicht eines Belegs.
 *
 * Zwei Arten von Zustand treffen hier aufeinander, und die Unterscheidung ist
 * der interessante Teil:
 *
 * - Der ENTWURF im Textfeld (`entwurf`) ist rein lokal. Niemand sonst
 *   interessiert sich fuer halb getippten Text, also bleibt er hier.
 * - Die GESPEICHERTE Notiz kommt als Prop von oben, weil der Workspace sie
 *   ebenfalls anzeigt. Geaendert wird sie ueber onNotizSpeichern().
 *
 * Deshalb zeigt die Vorschau auch sichtbar etwas anderes als das Textfeld,
 * solange nicht gespeichert wurde. In der Vanilla-Version schrieb
 * saveCurrentNote() den Text per `preview.innerHTML = text` direkt ins DOM -
 * ungeprueft, also als XSS-Luecke. Hier ist es ein Textknoten, den React
 * setzt; `<script>` darin ist sichtbarer Text, kein Code.
 *
 * Das Zuruecksetzen des Entwurfs beim Wechsel auf einen anderen Beleg
 * passiert NICHT hier, sondern beim Aufrufer: Er gibt dieser Komponente
 * `key={beleg.id}`. Eine andere key bedeutet fuer React eine andere
 * Komponenteninstanz - der alte Zustand wird verworfen. Genau die Semantik,
 * die in Uebung 4, Demo 4 am Checkbox-Beispiel gezeigt wurde.
 */
export function EvidenceDetail({
  beleg,
  personennamen,
  ortsnamen,
  notiz,
  onNotizSpeichern,
  onPruefung
}: Props) {
  const [entwurf, setEntwurf] = useState(notiz);
  const ungespeichert = entwurf !== notiz;

  return (
    <div className="evidence-detail">
      <div className="evidence-detail-header">
        <div>
          <h2>{beleg.title}</h2>
          <div className="evidence-meta">
            {beleg.id} &middot; {beleg.type} &middot; {formatDate(beleg.timestamp)}
          </div>
        </div>
        {/* Schliessen heisst: zurueck auf die Route ohne Beleg-ID. Vorher
            setzte closeEvidenceDetail() eine CSS-Klasse und leerte innerHTML. */}
        <Link to="/evidence" className="btn btn-secondary btn-small">
          Close
        </Link>
      </div>

      {beleg.tags.includes("critical") && (
        <div className="warning-banner">This item is tagged as critical evidence.</div>
      )}

      <div className="detail-field">
        <strong>Summary</strong>
        {beleg.summary}
      </div>
      <div className="evidence-detail-content">{beleg.content}</div>

      <div className="detail-field">
        <strong>Related people</strong>
        {personennamen.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Related locations</strong>
        {ortsnamen.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Tags</strong>
        {beleg.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>

      <div className="detail-field">
        <strong>Review status</strong>
        <select
          value={beleg.status}
          onChange={(e) => {
            if (isEvidenceStatus(e.target.value)) {
              onPruefung(beleg.id, { status: e.target.value, relevance: beleg.relevance });
            }
          }}
        >
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      <div className="detail-field">
        <strong>Relevance</strong>
        <select
          value={beleg.relevance}
          onChange={(e) => {
            if (isEvidenceRelevance(e.target.value)) {
              onPruefung(beleg.id, { status: beleg.status, relevance: e.target.value });
            }
          }}
        >
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>
      </div>

      <div className="detail-field">
        <strong>Investigator note</strong>
        <textarea
          className="note-textarea"
          rows={3}
          placeholder="Add a private note about this evidence..."
          value={entwurf}
          onChange={(e) => setEntwurf(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary btn-small"
          style={{ marginTop: 6 }}
          disabled={!ungespeichert}
          onClick={() => onNotizSpeichern(beleg.id, entwurf)}
        >
          {ungespeichert ? "Save note" : "Saved"}
        </button>
      </div>

      <div className="detail-field">
        <strong>Note preview</strong>
        {/* Zeigt die gespeicherte Notiz. Kein innerHTML - und damit kein XSS. */}
        <div>{notiz || <em>Noch keine gespeicherte Notiz.</em>}</div>
      </div>
    </div>
  );
}
