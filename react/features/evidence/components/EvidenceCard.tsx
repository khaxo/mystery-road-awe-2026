import { Link } from "react-router-dom";
import type { Evidence } from "../../../../js/types.js";
import { formatDate, getRelevanceBadgeClass, getStatusBadgeClass } from "../../../../js/utils.js";
import { Badge } from "../../../shared/components/Badge.js";

interface Props {
  beleg: Evidence;
  /** Fertig entschieden. Die Karte schaut nicht selbst in der Bookmark-Liste nach. */
  markiert: boolean;
  /** Rueckruf nach oben. Die Karte aendert nichts selbst. */
  onToggleBookmark: (evidenceId: string) => void;
}

/**
 * Rein darstellende Belegkarte.
 *
 * Drei Dinge sind gegenueber renderEvidenceCardHTML() aus der Vanilla-Version
 * anders, und alle drei betreffen das Ereignis-Handling (Demo 1):
 *
 * 1. Statt `data-action="bookmark" data-id="E-07"` in einen HTML-String zu
 *    schreiben und spaeter im Container-Listener per `event.target.dataset`
 *    wieder auszulesen, steht der Handler direkt am Button. Die Belegnummer
 *    kommt aus der Closure, nicht aus einem DOM-Attribut.
 *
 * 2. Es gibt keine Event Delegation mehr. Der alte Code hing EINEN Listener
 *    an #evidenceList, weil bei jedem `container.innerHTML = ...` alle Buttons
 *    neu entstanden und einzeln angehaengte Listener verloren gegangen waeren.
 *    React wirft die Knoten nicht weg, also entfaellt der Grund.
 *
 * 3. Das Oeffnen der Detailansicht ist ein <Link>, kein Klick auf die Karte.
 *    Damit ist ein Beleg verlinkbar - die Fortsetzung der Routing-Entscheidung
 *    aus Uebung 4.
 */
export function EvidenceCard({ beleg, markiert, onToggleBookmark }: Props) {
  return (
    <div className="evidence-card">
      <button
        type="button"
        className={markiert ? "bookmark-btn active" : "bookmark-btn"}
        aria-label={`Toggle bookmark for ${beleg.title}`}
        aria-pressed={markiert}
        onClick={() => onToggleBookmark(beleg.id)}
      >
        <span className="bookmark-icon">{markiert ? "★" : "☆"}</span>
      </button>

      <h3>
        <Link to={`/evidence/${beleg.id}`}>{beleg.title}</Link>
      </h3>

      <div className="evidence-meta">
        {beleg.id} &middot; {beleg.type} &middot; {formatDate(beleg.timestamp)}
      </div>

      <div className="evidence-summary">{beleg.summary}</div>

      {beleg.tags.includes("critical") && <Badge text="Critical" klasse="badge-critical" />}
      <Badge text={beleg.status} klasse={getStatusBadgeClass(beleg.status)} />
      <Badge text={beleg.relevance} klasse={getRelevanceBadgeClass(beleg.relevance)} />

      <div>
        {beleg.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
