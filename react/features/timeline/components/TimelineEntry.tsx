import type { TimelineEvent } from "../../../../js/types.js";
import { certaintyBadgeClass, formatDate } from "../../../../js/utils.js";
import { Badge } from "../../../shared/components/Badge.js";

interface Props {
  ereignis: TimelineEvent;
  /** Bereits aufgeloeste Ortsnamen. Die Komponente schlaegt nichts selbst nach. */
  ortsnamen: readonly string[];
}

/**
 * Ein Eintrag im Zeitstrahl. Rein darstellend.
 *
 * Bemerkenswert: `ortsnamen` kommt fertig aufgeloest herein. In der
 * Vanilla-Version hat die Render-Schleife selbst `findLocationById()` gerufen -
 * und genau dort steckte der Bug, der auf der Live-Seite fuenfzehnmal
 * "[object Object]" angezeigt hat, weil das gefundene Objekt statt seines
 * Namens in die Liste gepusht wurde.
 */
export function TimelineEntry({ ereignis, ortsnamen }: Props) {
  return (
    <div className={`timeline-event certainty-${ereignis.certainty}`}>
      <div className="timeline-time">
        {formatDate(ereignis.time)}
        {" · "}
        <Badge
          text={ereignis.certainty}
          klasse={`badge-${certaintyBadgeClass(ereignis.certainty)}`}
        />
      </div>

      <h3>{ereignis.title}</h3>
      <p>{ereignis.description}</p>

      {ortsnamen.length > 0 && <p className="evidence-meta">Location: {ortsnamen.join(", ")}</p>}

      {ereignis.evidenceIds.map((id) => (
        <span className="evidence-link-btn" key={id}>
          {id}
        </span>
      ))}
    </div>
  );
}
