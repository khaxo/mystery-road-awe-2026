import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { leseBookmarks, schreibeBookmarks } from "./speicher.js";

interface BookmarkZugriff {
  /** Alle markierten Belegnummern. */
  bookmarks: readonly string[];
  istMarkiert: (evidenceId: string) => boolean;
  toggleBookmark: (evidenceId: string) => void;
}

/**
 * Context fuer die Lesezeichen.
 *
 * -------------------------------------------------------------------------
 * WAS CONTEXT LOEST
 * -------------------------------------------------------------------------
 * Vor diesem Commit reichte App.tsx `bookmarks` und `onToggleBookmark` als
 * Props durch. Der Weg bis zum Knopf war:
 *
 *     App  ->  EvidenceView  ->  EvidenceList  ->  EvidenceCard
 *
 * EvidenceView und EvidenceList haben mit Lesezeichen inhaltlich nichts zu
 * tun. Sie nahmen die beiden Props an und gaben sie weiter - das ist
 * "prop drilling". Context ueberspringt diese Zwischenstationen: Der
 * Provider stellt den Wert zur Verfuegung, jeder Nachfahre holt ihn sich
 * selbst, egal wie tief er sitzt.
 *
 * -------------------------------------------------------------------------
 * WAS CONTEXT NICHT LOEST
 * -------------------------------------------------------------------------
 * Context ist kein Zustandsverwalter. Er transportiert nur. Der Zustand
 * selbst ist hier ein ganz normales useState in dieser Komponente - genau
 * dasselbe useState, das vorher in App.tsx stand. Context hat es nicht
 * ersetzt, sondern nur umgezogen.
 *
 * Insbesondere gilt weiterhin:
 *   - Aendert sich der Wert, rendert JEDER Konsument neu. Context kennt
 *     keine selektiven Abonnements, anders als Redux oder Zustand.
 *   - Der Wert lebt im Komponentenbaum. Unmountet der Provider, ist er weg.
 *   - Zwei Provider ergeben zwei unabhaengige Werte; der naechste im Baum
 *     gewinnt. "Global" ist er also nur relativ zu seinem Teilbaum.
 *
 * -------------------------------------------------------------------------
 * UND IST DAS HIER DIE RICHTIGE ENTSCHEIDUNG?
 * -------------------------------------------------------------------------
 * Ehrliche Antwort: Fuer diese App waere Prop Drilling vertretbar gewesen.
 * Es ging um zwei Props ueber zwei Zwischenebenen. Das ist laestig, aber
 * nicht fehleranfaellig - und der vorherige Commit funktionierte.
 *
 * Was fuer Context spricht, ist nicht die Tiefe, sondern die Streuung:
 * Lesezeichen werden an vier Stellen gebraucht (Katalogkarte, Workspace,
 * Dashboard-Zaehler, und beim Entfernen im Workspace), die in verschiedenen
 * Feature-Ordnern liegen. Jede neue Stelle haette eine neue Prop-Kette
 * bedeutet.
 *
 * Deshalb liegen die NOTIZEN bewusst weiter in Props: eine schreibende und
 * eine lesende Stelle, eine Ebene tief. Dort waere Context Aufwand ohne
 * Gegenwert - und naeher an dem, was das Skript "unnecessary global state"
 * nennt.
 */
const BookmarkContext = createContext<BookmarkZugriff | null>(null);

interface ProviderProps {
  children: ReactNode;
}

export function BookmarkProvider({ children }: ProviderProps) {
  const [bookmarks, setBookmarks] = useState<string[]>(leseBookmarks);

  function toggleBookmark(evidenceId: string) {
    const neu = bookmarks.includes(evidenceId)
      ? bookmarks.filter((id) => id !== evidenceId)
      : [...bookmarks, evidenceId];

    setBookmarks(neu);
    schreibeBookmarks(neu);
  }

  const zugriff: BookmarkZugriff = {
    bookmarks,
    istMarkiert: (evidenceId) => bookmarks.includes(evidenceId),
    toggleBookmark
  };

  return <BookmarkContext.Provider value={zugriff}>{children}</BookmarkContext.Provider>;
}

/**
 * Zugriff auf die Lesezeichen.
 *
 * Der Standardwert des Context ist absichtlich `null` und nicht ein leeres
 * Ersatzobjekt. Sonst wuerde eine Komponente, die versehentlich ausserhalb
 * des Providers steht, stillschweigend mit einer leeren Liste arbeiten -
 * ein Fehler, der sich als "meine Lesezeichen sind verschwunden" tarnt.
 * So wirft sie stattdessen beim ersten Aufruf.
 */
export function useBookmarks(): BookmarkZugriff {
  const zugriff = useContext(BookmarkContext);
  if (!zugriff) {
    throw new Error("useBookmarks muss innerhalb von <BookmarkProvider> benutzt werden");
  }
  return zugriff;
}
