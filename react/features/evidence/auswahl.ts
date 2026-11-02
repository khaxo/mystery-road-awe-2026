// Reine Auswahlfunktion: Alle Belege + Filterzustand -> sichtbare Liste.
//
// Hier steht KEIN React. Kein useState, kein Hook, kein JSX. Das ist Absicht:
// Die Frage "welche Belege sind gerade sichtbar?" ist eine Rechnung, keine
// Zustandsfrage. Die Rechnung laeuft bei jedem Render neu - deshalb kann ihr
// Ergebnis nie veralten (siehe Demo 4).

import type { EvidenceSortOrder } from "../../../js/state.js";
import type { Evidence, Person } from "../../../js/types.js";
import { evidenceMentionsPerson } from "../../../js/utils.js";

/**
 * Die sieben Werte, die zusammen bestimmen, was der Katalog zeigt.
 * Sie gehoeren fachlich zusammen und werden gemeinsam zurueckgesetzt -
 * deshalb ein Objekt und nicht sieben lose Variablen.
 */
export interface FilterZustand {
  suche: string;
  typ: string;
  person: string;
  ort: string;
  status: string;
  relevanz: string;
  sortierung: EvidenceSortOrder;
}

export const LEERER_FILTER: FilterZustand = {
  suche: "",
  typ: "",
  person: "",
  ort: "",
  status: "",
  relevanz: "",
  sortierung: "date-desc"
};

/** Alle Filterfelder ausser der Sortierung - die Sortierung filtert nichts weg. */
export type FilterFeld = Exclude<keyof FilterZustand, "sortierung">;

function istFilterAktiv(filter: FilterZustand): boolean {
  return Boolean(
    filter.suche.trim() ||
    filter.typ ||
    filter.person ||
    filter.ort ||
    filter.status ||
    filter.relevanz
  );
}

function vergleicher(ordnung: EvidenceSortOrder): (a: Evidence, b: Evidence) => number {
  switch (ordnung) {
    case "title-asc":
      return (a, b) => a.title.localeCompare(b.title);
    case "title-desc":
      return (a, b) => b.title.localeCompare(a.title);
    case "date-asc":
      return (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    case "date-desc":
      return (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  }
}

/**
 * Sichtbare Belege in der gewuenschten Reihenfolge.
 *
 * Gegenueber getFilteredEvidence() aus der Vanilla-Version faellt zweierlei weg:
 *
 * 1. Das Auslesen der Formularwerte aus dem DOM (sechs Mal valueOf(...)).
 *    Die Werte kommen jetzt als Argument herein.
 * 2. Die Zeile `state.filteredEvidence = results`. Das Ergebnis wird nirgends
 *    gespeichert, sondern zurueckgegeben - es gibt also keine zweite Liste,
 *    die mit der ersten aus dem Takt geraten koennte.
 */
export function waehleEvidence(
  alle: Evidence[],
  personen: readonly Person[],
  filter: FilterZustand
): Evidence[] {
  const suchbegriff = filter.suche.toLowerCase().trim();
  const person = filter.person ? (personen.find((p) => p.id === filter.person) ?? null) : null;

  // Ohne aktiven Filter muss nichts durchlaufen werden - filter() wuerde ein
  // identisches Array aufbauen.
  const treffer = istFilterAktiv(filter)
    ? alle.filter((ev) => {
        if (suchbegriff) {
          const heuhaufen = `${ev.title} ${ev.summary} ${ev.tags.join(" ")}`.toLowerCase();
          if (!heuhaufen.includes(suchbegriff)) return false;
        }
        if (filter.typ && ev.type !== filter.typ) return false;
        if (filter.person && (!person || !evidenceMentionsPerson(ev, person))) return false;
        if (filter.ort && !ev.locationIds.includes(filter.ort)) return false;
        if (filter.status && ev.status !== filter.status) return false;
        if (filter.relevanz && ev.relevance !== filter.relevanz) return false;
        return true;
      })
    : alle;

  // [...treffer] ist nicht optional.
  //
  // Ist kein Filter aktiv, IST `treffer` das uebergebene Array - dieselbe
  // Referenz, nicht eine Kopie. Ein sort() darauf wuerde die Liste des
  // Aufrufers umsortieren. Genau dieser Fehler war Bug 5 aus Uebung 1:
  // dort hingen `filteredEvidence` und `allEvidence` an derselben Referenz,
  // und das Sortieren der Ansicht hat die Originalreihenfolge zerstoert.
  //
  // Nicht die Abkuerzung oben ist das Problem, sondern das Sortieren in
  // place. Mit der Kopie darf die Abkuerzung bleiben.
  return [...treffer].sort(vergleicher(filter.sortierung));
}

/** Alle vorkommenden Belegarten, alphabetisch - fuer das Typ-Dropdown. */
export function vorhandeneTypen(alle: readonly Evidence[]): string[] {
  return [...new Set(alle.map((ev) => ev.type))].sort();
}
