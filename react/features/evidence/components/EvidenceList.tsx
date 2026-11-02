import type { Evidence } from "../../../../js/types.js";
import { EmptyState } from "../../../shared/components/EmptyState.js";
import { EvidenceCard } from "./EvidenceCard.js";

interface Props {
  belege: readonly Evidence[];
}

/**
 * Liste der sichtbaren Belege.
 *
 * Seit Demo 8 hat sie mit Lesezeichen nichts mehr zu tun. Vorher nahm sie
 * `markierte` und `onToggleBookmark` an, nur um beides an die Karten
 * weiterzugeben - sie war eine Durchreiche. Genau diese Rolle hat der
 * Context ueberfluessig gemacht.
 */
export function EvidenceList({ belege }: Props) {
  if (belege.length === 0) {
    return <EmptyState text="No evidence matches the current filters." />;
  }

  return (
    <div className="evidence-grid">
      {belege.map((beleg) => (
        <EvidenceCard key={beleg.id} beleg={beleg} />
      ))}
    </div>
  );
}
