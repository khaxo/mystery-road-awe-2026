import { useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import type { EvidenceRelevance, EvidenceStatus } from "../js/types.js";
import { AppHeader } from "./app/AppHeader.js";
import { NotFoundView } from "./app/NotFoundView.js";
import { DashboardView } from "./features/dashboard/DashboardView.js";
import { EvidenceView } from "./features/evidence/EvidenceView.js";
import { PersonDetailView } from "./features/team/PersonDetailView.js";
import { TeamView } from "./features/team/TeamView.js";
import { TimelineView } from "./features/timeline/TimelineView.js";
import { WorkspaceView } from "./features/workspace/WorkspaceView.js";
import { ControlledDemo } from "./sandbox/ControlledDemo.js";
import { KeyDemo } from "./sandbox/KeyDemo.js";
import type { CaseDaten } from "./shared/hooks/useCaseData.js";
import { useCaseData } from "./shared/hooks/useCaseData.js";
import { BookmarkProvider } from "./shared/state/BookmarkContext.js";
import { leseNotizen, schreibeNotizen } from "./shared/state/speicher.js";

/** Vom Benutzer gesetzter Pruefstand eines Belegs. */
export interface Pruefstand {
  status: EvidenceStatus;
  relevance: EvidenceRelevance;
}

/**
 * Wurzelkomponente.
 *
 * HashRouter statt BrowserRouter:
 * GitHub Pages ist ein reiner Dateiserver. Ein BrowserRouter braeuchte einen
 * Server, der jeden Pfad auf index.html umschreibt. Ohne das waere ein direkter
 * Aufruf von /team/people ein 404 - und damit waere die Anforderung
 * "bookmarkable routes" genau nicht erfuellt. Mit HashRouter steht der Pfad
 * hinter dem #, wird nie an den Server geschickt, und jeder Link funktioniert
 * auch beim direkten Aufruf.
 *
 * ---------------------------------------------------------------------------
 * ZUSTANDSBESITZ (Uebung 5, Demo 5)
 * ---------------------------------------------------------------------------
 * Drei Dinge liegen hier und nicht weiter unten. Der Grund ist in allen drei
 * Faellen derselbe: Sie werden an einer Stelle GEAENDERT und an einer anderen
 * GELESEN, und diese Komponente ist der tiefste gemeinsame Vorfahr.
 *
 *   notizen     geschrieben in der Belegdetailansicht
 *               gelesen im Workspace
 *
 *   pruefung    geaendert in der Belegdetailansicht
 *               gelesen im Katalog (Badges, Statusfilter) und vom Dashboard
 *               ("Reviewed"-Zaehler)
 *
 * Was hier bewusst NICHT liegt: die geladenen Falldaten als Zustand. Sie
 * kommen aus useCaseData() und werden nicht in einen useState kopiert. Sonst
 * gaebe es zwei Listen von Belegen - die geladene und die kopierte - und damit
 * genau die doppelte Wahrheit, die diese Uebung vermeiden will.
 *
 * Die Benutzeranmerkungen (Notizen, Pruefstand) liegen deshalb NEBEN den
 * Daten, nicht in ihnen. Zusammengefuehrt werden sie beim Rendern.
 *
 * Die LESEZEICHEN sind seit Demo 8 kein Zustand dieser Komponente mehr. Sie
 * liegen im BookmarkProvider weiter unten - dasselbe useState, nur an einem
 * Ort, von dem aus es ohne Prop-Kette erreichbar ist.
 */
export function App() {
  const { laedt, fehler, ...geladen } = useCaseData();

  // Startwerte aus dem localStorage. Die Funktion wird uebergeben, nicht
  // aufgerufen: useState(f) ruft f nur beim Mounten auf, useState(f()) wuerde
  // bei jedem Render lesen.
  const [notizen, setNotizen] = useState<Record<string, string>>(leseNotizen);
  const [pruefung, setPruefung] = useState<Record<string, Pruefstand>>({});

  function speichereNotiz(evidenceId: string, text: string) {
    const neu = { ...notizen, [evidenceId]: text };
    setNotizen(neu);
    schreibeNotizen(neu);
  }

  /** Nicht persistiert - genau wie in der Vanilla-Version gilt das nur fuer die Sitzung. */
  function setzePruefung(evidenceId: string, stand: Pruefstand) {
    setPruefung({ ...pruefung, [evidenceId]: stand });
  }

  /**
   * Geladene Daten + Benutzeranmerkungen, zusammengefuehrt bei jedem Render.
   *
   * Das ist der Ersatz fuer applyStoredBookmarkFlags() und fuer `ev.status = neu`
   * aus der Vanilla-Version: Dort wurden die geladenen Objekte beschrieben, hier
   * entsteht pro Render eine neue Sicht darauf. Die geladenen Objekte selbst
   * bleiben unveraendert.
   */
  const daten: CaseDaten = {
    ...geladen,
    evidence: geladen.evidence.map((ev) => {
      const stand = pruefung[ev.id];
      return stand ? { ...ev, ...stand } : ev;
    })
  };

  // Einmal gebaut, an zwei Routen verwendet: /evidence und /evidence/:evidenceId
  // zeigen dieselbe Ansicht, die Detailansicht haengt am Routenparameter.
  const belegkatalog = (
    <EvidenceView
      daten={daten}
      notizen={notizen}
      onNotizSpeichern={speichereNotiz}
      onPruefung={setzePruefung}
    />
  );

  return (
    <HashRouter>
      {/* Der Provider umschliesst alles, was Lesezeichen braucht. Haette er
          nur die Routen umschlossen, waere der Kopfbereich aussen vor - dort
          koennte spaeter ein Zaehler stehen. */}
      <BookmarkProvider>
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

              <Route path="/evidence" element={belegkatalog} />
              <Route path="/evidence/:evidenceId" element={belegkatalog} />

              {/* /team ohne Tab -> auf den Personen-Tab umleiten */}
              <Route path="/team" element={<Navigate to="/team/people" replace />} />
              <Route path="/team/:tab" element={<TeamView daten={daten} />} />
              <Route path="/team/people/:personId" element={<PersonDetailView daten={daten} />} />

              <Route path="/timeline" element={<TimelineView daten={daten} />} />

              <Route
                path="/workspace"
                element={<WorkspaceView daten={daten} notizen={notizen} />}
              />

              {/* Wegwerf-Routen fuer Demos. Nicht in der Navigation verlinkt. */}
              <Route path="/sandbox/keys" element={<KeyDemo daten={daten} />} />
              <Route path="/sandbox/controlled" element={<ControlledDemo />} />

              {/* Catch-all. Der Vanilla-Code hat bei unbekanntem Hash still auf
                Dashboard umgeleitet; hier gibt es stattdessen eine echte
                404-Ansicht - siehe NotFoundView. */}
              <Route path="*" element={<NotFoundView />} />
            </Routes>
          )}
        </main>
      </BookmarkProvider>
    </HashRouter>
  );
}
