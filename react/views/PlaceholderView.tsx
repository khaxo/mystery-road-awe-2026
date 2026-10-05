import { VIEW_LABELS } from "../hooks/useHashRoute.js";
import type { ViewName } from "../hooks/useHashRoute.js";

interface Props {
  view: ViewName;
}

/**
 * Platzhalter fuer die vier noch nicht migrierten Views. Sie existieren in
 * der Shell, damit die Navigation vollstaendig funktioniert - der Inhalt
 * folgt in Uebung 4 und 5.
 */
export function PlaceholderView({ view }: Props) {
  return (
    <section className="view active">
      <h2>{VIEW_LABELS[view]}</h2>
      <div className="dashboard-panel">
        <p>
          Diese View ist noch nicht nach React migriert. Sie laeuft weiterhin in der
          Vanilla-TypeScript-Version.
        </p>
        <p>
          <a className="btn btn-secondary btn-small" href={`index.html#${view}`}>
            In der Vanilla-Version oeffnen
          </a>
        </p>
      </div>
    </section>
  );
}
