import type { Evidence } from "../../../../js/types.js";
import { EmptyState } from "../../../shared/components/EmptyState.js";
import { EvidenceCard } from "./EvidenceCard.js";

interface Props {
  belege: readonly Evidence[];
  markierte: readonly string[];
  onToggleBookmark: (evidenceId: string) => void;
}

/**
 * Liste der sichtbaren Belege.
 *
 * Entscheidet pro Karte, ob sie markiert ist, und gibt das Ergebnis als
 * boolean weiter. Die Karte selbst bekommt die Bookmark-Liste nie zu sehen -
 * sie wuerde damit nur den Umgang mit einer Liste lernen muessen, die sie
 * nichts angeht (gleiches Muster wie PersonCard/PeopleList aus Uebung 3).
 */
export function EvidenceList({ belege, markierte, onToggleBookmark }: Props) {
  if (belege.length === 0) {
    return <EmptyState text="No evidence matches the current filters." />;
  }

  return (
    <div className="evidence-grid">
      {belege.map((beleg) => (
        <EvidenceCard
          key={beleg.id}
          beleg={beleg}
          markiert={markierte.includes(beleg.id)}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  );
}
