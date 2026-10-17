import type { CaseLocation } from "../../../../js/types.js";
import { EmptyState } from "../../../shared/components/EmptyState.js";
import { LocationCard } from "./LocationCard.js";

interface Props {
  orte: readonly CaseLocation[];
}

export function LocationsList({ orte }: Props) {
  if (orte.length === 0) return <EmptyState text="Keine Orte geladen." />;

  return (
    <div className="people-grid">
      {orte.map((ort) => (
        <LocationCard key={ort.id} ort={ort} />
      ))}
    </div>
  );
}
