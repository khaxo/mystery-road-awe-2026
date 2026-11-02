import { useState } from "react";
import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { useBookmarks } from "../../shared/state/BookmarkContext.js";
import { BookmarkList } from "./components/BookmarkList.js";
import type { NotizEintrag } from "./components/NotesList.js";
import { NotesList } from "./components/NotesList.js";
import { HypothesisForm } from "./components/HypothesisForm.js";

interface Props {
  daten: CaseDaten;
  notizen: Record<string, string>;
}

/**
 * Investigator Workspace.
 *
 * Zeigt drei Dinge: die markierten Belege, die gespeicherten Notizen und das
 * Hypothesen-Formular.
 */
export function WorkspaceView({ daten, notizen }: Props) {
  const { bookmarks } = useBookmarks();

  // Eigene Liste der angezeigten Lesezeichen, damit das Entfernen hier
  // sofort sichtbar ist, ohne auf den Zustand weiter oben zu warten.
  const [sichtbareBookmarks, setSichtbareBookmarks] = useState<string[]>([...bookmarks]);

  const markierteBelege = daten.evidence.filter((ev) => sichtbareBookmarks.includes(ev.id));

  function entferne(evidenceId: string) {
    setSichtbareBookmarks(sichtbareBookmarks.filter((id) => id !== evidenceId));
  }

  // Notizen -> Anzeigeeintraege. Abgeleitet, nicht gespeichert: Es gibt keine
  // zweite Liste, die nach dem Speichern einer Notiz nachgezogen werden muesste.
  const notizEintraege: NotizEintrag[] = daten.evidence
    .filter((ev) => notizen[ev.id])
    .map((ev) => ({ evidenceId: ev.id, titel: ev.title, text: notizen[ev.id] ?? "" }));

  return (
    <section className="view active">
      <h2>Investigator Workspace</h2>

      <div className="workspace-grid">
        <div className="workspace-col">
          <h3>Bookmarked Evidence</h3>
          <BookmarkList belege={markierteBelege} onEntfernen={entferne} />
        </div>

        <div className="workspace-col">
          <h3>Personal Notes</h3>
          <p className="hint-text">
            Notes are attached to whichever evidence item is currently open in the Evidence view.
          </p>
          <NotesList eintraege={notizEintraege} />
        </div>
      </div>

      <HypothesisForm personen={daten.people} belege={daten.evidence} />
    </section>
  );
}
