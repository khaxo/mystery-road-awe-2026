import { Link } from "react-router-dom";
import { EmptyState } from "../../../shared/components/EmptyState.js";

export interface NotizEintrag {
  evidenceId: string;
  titel: string;
  text: string;
}

interface Props {
  eintraege: readonly NotizEintrag[];
}

/**
 * Liste der gespeicherten Notizen.
 *
 * Zwei Fehler der Vanilla-Fassung sind hier konstruktionsbedingt weg:
 *
 * 1. renderNotesList() setzte als DOM-Id `noteText-<Schleifenindex>`, obwohl
 *    die Belegnummer direkt daneben lag. Ein Index als Identitaet ist genau
 *    das, was in Uebung 4, Demo 4 als key-Fehler gezeigt wurde. Hier ist der
 *    key die Belegnummer - stabil, auch wenn Notizen dazukommen.
 *
 * 2. Der Notiztext wurde per innerHTML eingesetzt. Hier ist er ein
 *    Textknoten.
 */
export function NotesList({ eintraege }: Props) {
  if (eintraege.length === 0) {
    return <EmptyState text="No notes yet. Add one from an evidence item's detail view." />;
  }

  return (
    <div className="notes-list">
      {eintraege.map((eintrag) => (
        <div key={eintrag.evidenceId} className="mini-list-item">
          <strong>
            <Link to={`/evidence/${eintrag.evidenceId}`}>{eintrag.evidenceId}</Link>
          </strong>{" "}
          &mdash; {eintrag.titel}
          <div>{eintrag.text}</div>
        </div>
      ))}
    </div>
  );
}
