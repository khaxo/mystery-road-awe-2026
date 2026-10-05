import { AppHeader } from "./components/AppHeader.js";
import { useCaseData } from "./hooks/useCaseData.js";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { DashboardView } from "./views/DashboardView.js";
import { PlaceholderView } from "./views/PlaceholderView.js";

/**
 * Wurzelkomponente: Shell (Header + Navigation) plus die aktuell gewaehlte View.
 *
 * Das Gegenstueck zu handleHashChange() aus der Vanilla-Version - aber ohne
 * manuelles Umschalten von CSS-Klassen. Es wird schlicht nur die aktive View
 * gerendert; die anderen existieren im DOM gar nicht erst.
 */
export function App() {
  const [view, navigiere] = useHashRoute();
  const { laedt, fehler, ...daten } = useCaseData();

  // Bookmarks liegen weiterhin im localStorage, genau wie in der Vanilla-App.
  // Bewusst nur gelesen: Gesetzt werden sie in der Evidence-View, die noch
  // nicht migriert ist.
  const bookmarkAnzahl = leseBookmarkAnzahl();

  return (
    <>
      <AppHeader aktiveView={view} aufNavigation={navigiere} />

      <main id="app" className="app-main">
        {fehler && (
          <section className="view active">
            <h2>Daten konnten nicht geladen werden</h2>
            <div className="dashboard-panel">
              <p>{fehler}</p>
            </div>
          </section>
        )}

        {!fehler && laedt && (
          <section className="view active">
            <h2>Case Dashboard</h2>
            <div className="dashboard-panel">
              <p>Loading case file&hellip;</p>
            </div>
          </section>
        )}

        {!fehler &&
          !laedt &&
          (view === "dashboard" ? (
            <DashboardView daten={daten} bookmarkAnzahl={bookmarkAnzahl} />
          ) : (
            <PlaceholderView view={view} />
          ))}
      </main>
    </>
  );
}

function leseBookmarkAnzahl(): number {
  try {
    const roh = localStorage.getItem("remotion_bookmarks");
    const geparst: unknown = roh ? JSON.parse(roh) : [];
    return Array.isArray(geparst) ? geparst.length : 0;
  } catch {
    return 0;
  }
}
