import type { TimelineEvent } from "../../js/types.js";
import { formatDate } from "../../js/utils.js";

interface Props {
  eintraege: TimelineEvent[];
}

export function RecentTimelineList({ eintraege }: Props) {
  return (
    <div className="dashboard-panel">
      <h3>Recent timeline events</h3>
      {eintraege.length === 0 && <p>No timeline events loaded yet.</p>}
      {eintraege.map((evt) => (
        <div className="mini-list-item" key={evt.id}>
          <strong>{formatDate(evt.time)}</strong>
          <br />
          {evt.title}
        </div>
      ))}
    </div>
  );
}
