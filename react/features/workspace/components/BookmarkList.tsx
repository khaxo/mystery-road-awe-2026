import { Link } from "react-router-dom";
import type { Evidence } from "../../../../js/types.js";
import { EmptyState } from "../../../shared/components/EmptyState.js";

interface Props {
  belege: readonly Evidence[];
  onEntfernen: (evidenceId: string) => void;
}

/**
 * Liste der mit Lesezeichen versehenen Belege.
 *
 * Rein darstellend. Insbesondere filtert sie nicht selbst: Welche Belege
 * markiert sind, entscheidet der Aufrufer.
 *
 * Der "Open"-Knopf ist jetzt ein <Link> auf die Belegroute. In der
 * Vanilla-Version stand hier:
 *
 *     navigateTo("evidence");
 *     setTimeout(() => openEvidenceDetail(id), 0);
 *
 * Das setTimeout war noetig, weil die Evidence-View im Moment des Klicks noch
 * nicht gerendert war - openEvidenceDetail haette in ein leeres DOM
 * geschrieben. Mit einer Route entfaellt die ganze Reihenfolgefrage.
 */
export function BookmarkList({ belege, onEntfernen }: Props) {
  if (belege.length === 0) {
    return <EmptyState text="No bookmarked evidence yet. Bookmark items from the Evidence view." />;
  }

  return (
    <div className="bookmarks-list">
      {belege.map((beleg) => (
        <div key={beleg.id} className="mini-list-item">
          <strong>{beleg.id}</strong> &mdash; {beleg.title}{" "}
          <Link to={`/evidence/${beleg.id}`} className="btn btn-small btn-secondary">
            Open
          </Link>{" "}
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => onEntfernen(beleg.id)}
          >
            Entfernen
          </button>
        </div>
      ))}
    </div>
  );
}
