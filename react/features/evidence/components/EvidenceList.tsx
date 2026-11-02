import type { Evidence } from "../../../../js/types.js";
import { EvidenceCard } from "./EvidenceCard.js";

interface Props {
  /** Die sichtbaren, also gefilterten Belege. */
  belege: readonly Evidence[];
  /**
   * Ist der DATENSATZ leer (der Server hat nichts geliefert), oder schliessen
   * nur die Filter alles aus? Zwei verschiedene Lagen, zwei verschiedene
   * Texte - siehe CHANGES-6.md, Demo 6.
   */
  datensatzLeer: boolean;
  onZuruecksetzen: () => void;
}

/**
 * Liste der sichtbaren Belege.
 *
 * Seit Demo 8 hat sie mit Lesezeichen nichts mehr zu tun. Vorher nahm sie
 * `markierte` und `onToggleBookmark` an, nur um beides an die Karten
 * weiterzugeben - sie war eine Durchreiche. Genau diese Rolle hat der
 * Context ueberfluessig gemacht.
 */
export function EvidenceList({ belege, datensatzLeer, onZuruecksetzen }: Props) {
  // Erst die Frage "gibt es ueberhaupt Daten?", dann "passt etwas zu den
  // Filtern?". Die Reihenfolge ist wichtig: Bei leerem Datensatz waere
  // "passt nicht zu den Filtern" eine falsche Auskunft - es gibt keine
  // Filter, es gibt nur keine Daten.
  if (datensatzLeer) {
    return (
      <div className="panel-card">
        <h3>Keine Belege im Datensatz</h3>
        <p>
          Der Server hat eine erfolgreiche Antwort geschickt, die keine Belege enthaelt. Das ist
          kein Fehler - es ist nichts da.
        </p>
        <p className="hint-text">
          Im Entwicklungsmodus laesst sich dieser Zustand mit <code>?empty=1</code> in der Adresse
          ausloesen.
        </p>
      </div>
    );
  }

  if (belege.length === 0) {
    return (
      <div className="panel-card">
        <h3>Kein Treffer</h3>
        <p>Es gibt Belege, aber keiner passt zu den aktuellen Filtern.</p>
        <button type="button" className="btn btn-secondary" onClick={onZuruecksetzen}>
          Filter zuruecksetzen
        </button>
      </div>
    );
  }

  return (
    <div className="evidence-grid">
      {belege.map((beleg) => (
        <EvidenceCard key={beleg.id} beleg={beleg} />
      ))}
    </div>
  );
}
