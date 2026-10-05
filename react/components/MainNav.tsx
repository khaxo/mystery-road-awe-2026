import { VIEWS, VIEW_LABELS } from "../hooks/useHashRoute.js";
import type { ViewName } from "../hooks/useHashRoute.js";

interface Props {
  aktiveView: ViewName;
  aufNavigation: (ziel: ViewName) => void;
}

/**
 * Navigationsleiste.
 *
 * Vanilla-Version: fuenf <button>-Elemente standen fest im HTML, und
 * handleHashChange() hat per Schleife die Klasse "active" umgehaengt.
 * Hier entstehen die Buttons aus der VIEWS-Liste, und welcher aktiv ist,
 * ergibt sich aus einem Vergleich im Render - es gibt keinen Code, der
 * eine Klasse hinzufuegt oder entfernt.
 */
export function MainNav({ aktiveView, aufNavigation }: Props) {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {VIEWS.map((view) => (
        <button
          key={view}
          type="button"
          className={view === aktiveView ? "nav-btn active" : "nav-btn"}
          aria-current={view === aktiveView ? "page" : undefined}
          onClick={() => aufNavigation(view)}
        >
          {VIEW_LABELS[view]}
        </button>
      ))}
    </nav>
  );
}
