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
  const { bookmarks, toggleBookmark } = useBookmarks();

  // Abgeleitet aus der einen Lesezeichen-Liste, nicht kopiert.
  //
  // Hier stand bis zum Commit davor ein eigenes useState, das beim Mounten
  // von `bookmarks` befuellt wurde - mit der Begruendung, das Entfernen
  // solle "sofort wirken". Es wirkte auch sofort, aber nur hier: Der
  // Dashboard-Zaehler und die Sterne im Katalog bekamen davon nichts mit,
  // und der localStorage blieb unveraendert. Siehe CHANGES-5.md, Demo 9.
  const markierteBelege = daten.evidence.filter((ev) => bookmarks.includes(ev.id));

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
          <BookmarkList belege={markierteBelege} onEntfernen={toggleBookmark} />
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
