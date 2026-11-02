import type { CaseData, CaseLocation, Evidence, Person, TimelineEvent } from "../../../js/types.js";
import { ladeEvidence, ladeFall, ladeOrte, ladePersonen, ladeTimeline } from "../../api/fallApi.js";
import { useFetch } from "./useFetch.js";

export interface CaseDaten {
  caseData: Partial<CaseData>;
  evidence: Evidence[];
  people: Person[];
  locations: CaseLocation[];
  timeline: TimelineEvent[];
}

export interface LadeZustand extends CaseDaten {
  laedt: boolean;
  fehler: string | null;
}

// Alle fuenf Anfragen laufen beim Mounten und nie wieder - also eine leere
// Abhaengigkeitsliste. Als Konstante ausserhalb der Komponente, damit nicht
// bei jedem Render ein neues Array entsteht.
const EINMAL: readonly unknown[] = [];

/**
 * Laedt die Falldaten.
 *
 * ---------------------------------------------------------------------------
 * Was sich gegenueber Uebung 5 geaendert hat
 * ---------------------------------------------------------------------------
 * Vorher stand hier ein handgeschriebener useEffect mit drei useState, einem
 * try/catch/finally, einem `aktiv`-Flag und fuenf `await` hintereinander.
 * Jetzt sind es fuenf Aufrufe von useFetch.
 *
 * Drei Dinge sind dadurch besser, und das dritte war nicht geplant:
 *
 * 1. Der Abbruch ist echt. Vorher verhinderte ein Flag nur das setState
 *    nachtraeglich; die Anfragen liefen weiter. Jetzt bricht useFetch sie ab.
 *
 * 2. Die Fehlerbehandlung steht an einer Stelle statt an fuenf - und zwar in
 *    useFetch, wo auch jede andere Ladestelle sie bekommt.
 *
 * 3. Die fuenf Anfragen laufen jetzt PARALLEL. Vorher war es
 *    `await ladeFall(); await ladePersonen(); ...` - jede wartete auf die
 *    vorige, die Gesamtzeit war die Summe. Fuenf useFetch-Aufrufe sind fuenf
 *    unabhaengige Effekte, die gleichzeitig starten; die Gesamtzeit ist das
 *    Maximum. Bei 250 ms Grundverzoegerung im Backend sind das rund 250 ms
 *    statt rund 1250 ms.
 *
 * Punkt 3 ist eine Nebenwirkung des Extrahierens: Weil jeder Aufruf fuer sich
 * steht, konnte die kuenstliche Reihenfolge nicht erhalten bleiben.
 *
 * ---------------------------------------------------------------------------
 * Wie fuenf Zustaende zu einem werden
 * ---------------------------------------------------------------------------
 * `laedt` ist true, solange IRGENDEINE Anfrage laeuft - die Oberflaeche soll
 * nicht halb gefuellt erscheinen.
 *
 * `fehler` ist der erste, der auftritt. Bewusst nicht alle fuenf gesammelt:
 * Faellt das Backend aus, scheitern ohnehin alle, und fuenf Mal dieselbe
 * Meldung hilft niemandem.
 */
export function useCaseData(): LadeZustand {
  const fall = useFetch<CaseData>(ladeFall, EINMAL);
  const personen = useFetch<Person[]>(ladePersonen, EINMAL);
  const orte = useFetch<CaseLocation[]>(ladeOrte, EINMAL);
  const belege = useFetch<Evidence[]>(ladeEvidence, EINMAL);
  const zeitstrahl = useFetch<TimelineEvent[]>(ladeTimeline, EINMAL);

  const laedt = fall.laedt || personen.laedt || orte.laedt || belege.laedt || zeitstrahl.laedt;

  const fehler =
    fall.fehler ?? personen.fehler ?? orte.fehler ?? belege.fehler ?? zeitstrahl.fehler;

  return {
    // Partial<CaseData>, weil das Dashboard rendert, bevor case.json da ist -
    // vorher ist das Objekt tatsaechlich leer. Das macht die Optionalitaet im
    // Typ sichtbar, statt sie mit einem Dummy-Objekt zu verstecken.
    caseData: fall.daten ?? {},
    people: personen.daten ?? [],
    locations: orte.daten ?? [],
    evidence: belege.daten ?? [],
    timeline: zeitstrahl.daten ?? [],
    laedt,
    fehler
  };
}
