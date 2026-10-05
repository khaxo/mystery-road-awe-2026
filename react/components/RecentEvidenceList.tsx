import type { Evidence } from "../../js/types.js";
import { getStatusBadgeClass } from "../../js/utils.js";
import { Badge } from "./Badge.js";

interface Props {
  eintraege: Evidence[];
}

export function RecentEvidenceList({ eintraege }: Props) {
  return (
    <div className="dashboard-panel">
      <h3>Recent evidence</h3>
      {eintraege.length === 0 && <p>No evidence loaded yet.</p>}
      {eintraege.map((ev) => (
        // key: stabile Identitaet pro Eintrag. Daran erkennt React beim
        // Vergleich, welches Element dasselbe geblieben ist - ohne key
        // muesste es anhand der Position raten.
        <div className="mini-list-item" key={ev.id}>
          <strong>{ev.id}</strong>
          {" — "}
          {ev.title} <Badge text={ev.status} klasse={getStatusBadgeClass(ev.status)} />
        </div>
      ))}
    </div>
  );
}
