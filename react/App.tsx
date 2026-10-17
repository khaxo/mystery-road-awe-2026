import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "./app/AppHeader.js";
import { NotFoundView } from "./app/NotFoundView.js";
import { DashboardView } from "./features/dashboard/DashboardView.js";
import { PersonDetailView } from "./features/team/PersonDetailView.js";
import { TeamView } from "./features/team/TeamView.js";
import { TimelineView } from "./features/timeline/TimelineView.js";
import { KeyDemo } from "./sandbox/KeyDemo.js";
import { useCaseData } from "./shared/hooks/useCaseData.js";

/**
 * Wurzelkomponente.
 *
 * HashRouter statt BrowserRouter - bewusste Entscheidung:
 * GitHub Pages ist ein reiner Dateiserver. Ein BrowserRouter braeuchte einen
 * Server, der jeden Pfad auf index.html umschreibt. Ohne das waere ein direkter
 * Aufruf von /team/people ein 404 - und damit waere die Anforderung
 * "bookmarkable routes" genau nicht erfuellt. Mit HashRouter steht der Pfad
 * hinter dem #, wird nie an den Server geschickt, und jeder Link funktioniert
 * auch beim direkten Aufruf.
 */
export function App() {
  const { laedt, fehler, ...daten } = useCaseData();

  return (
    <HashRouter>
      <AppHeader />

      <main id="app" className="app-main">
        {/* Conditional Rendering, Technik 3: Ternaer-Kette fuer sich
            gegenseitig ausschliessende Zustaende. */}
        {fehler ? (
          <section className="view active">
            <h2>Daten konnten nicht geladen werden</h2>
            <p>{fehler}</p>
          </section>
        ) : laedt ? (
          <section className="view active">
            <h2>Case file</h2>
            <p>Loading case file&hellip;</p>
          </section>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView daten={daten} />} />

            {/* /team ohne Tab -> auf den Personen-Tab umleiten */}
            <Route path="/team" element={<Navigate to="/team/people" replace />} />
            <Route path="/team/:tab" element={<TeamView daten={daten} />} />
            <Route path="/team/people/:personId" element={<PersonDetailView daten={daten} />} />

            <Route path="/timeline" element={<TimelineView daten={daten} />} />

            {/* Wegwerf-Route fuer Demo 4. Nicht in der Navigation verlinkt. */}
            <Route path="/sandbox/keys" element={<KeyDemo daten={daten} />} />

            {/* Catch-all. Der Vanilla-Code hat bei unbekanntem Hash still auf
                Dashboard umgeleitet; hier gibt es stattdessen eine echte
                404-Ansicht - siehe NotFoundView. */}
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        )}
      </main>
    </HashRouter>
  );
}
