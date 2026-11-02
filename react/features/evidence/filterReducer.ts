// Reducer fuer den Filterzustand des Belegkatalogs.
//
// Ein Reducer ist eine reine Funktion (Zustand, Aktion) -> neuer Zustand.
// Kein React, kein Hook, keine Seiteneffekte. useReducer ruft sie auf, aber
// sie liesse sich genauso in einem Test direkt aufrufen.

import type { EvidenceSortOrder } from "../../../js/state.js";
import type { FilterFeld, FilterZustand } from "./auswahl.js";
import { LEERER_FILTER } from "./auswahl.js";

/**
 * Die drei Dinge, die mit dem Filterzustand passieren koennen.
 *
 * Bemerkenswert ist, was hier NICHT steht: wie die Werte gesetzt werden.
 * Die Aktion beschreibt die ABSICHT ("setze das Feld 'typ' auf 'chat-log'"),
 * nicht die Ausfuehrung. Wie daraus ein neuer Zustand wird, entscheidet
 * ausschliesslich die Funktion unten - an einer Stelle, nicht an sieben.
 */
export type FilterAktion =
  | { type: "SET_FILTER"; feld: FilterFeld; wert: string }
  | { type: "SET_SORT"; wert: EvidenceSortOrder }
  | { type: "CLEAR_FILTERS" };

export function filterReducer(zustand: FilterZustand, aktion: FilterAktion): FilterZustand {
  switch (aktion.type) {
    case "SET_FILTER":
      // Ein berechneter Schluessel ersetzt die sieben Setter der vorherigen
      // Fassung. Neues Filterfeld = eine Zeile im Interface, sonst nichts.
      return { ...zustand, [aktion.feld]: aktion.wert };

    case "SET_SORT":
      return { ...zustand, sortierung: aktion.wert };

    case "CLEAR_FILTERS":
      // Die Sortierung bleibt absichtlich erhalten: Der Knopf heisst "Clear
      // filters", nicht "Alles zuruecksetzen". Die Vanilla-Version konnte
      // diese Unterscheidung gar nicht treffen - sie leerte sechs
      // DOM-Elemente und liess das siebte stehen, weil es zufaellig nicht in
      // der Liste stand.
      return { ...LEERER_FILTER, sortierung: zustand.sortierung };
  }
}
