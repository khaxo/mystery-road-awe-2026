import { useEffect, useState } from "react";
import type {
  CaseData,
  CaseLocation,
  Evidence,
  Person,
  RawEvidence,
  RawTimelineEvent,
  TimelineEvent
} from "../../js/types.js";
import { normalisiereEvidence, normalisiereTimeline } from "../../js/types.js";

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

const LEER: CaseDaten = {
  caseData: {},
  evidence: [],
  people: [],
  locations: [],
  timeline: []
};

async function ladeJson<T>(pfad: string): Promise<T> {
  const res = await fetch(pfad);
  if (!res.ok) throw new Error(`${pfad} antwortete mit ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Laedt die Falldaten einmal beim Mounten.
 *
 * Bewusst eine Zwischenloesung: Fuer diese Uebung reicht ein Hook, dessen
 * Ergebnis per Props nach unten gereicht wird. Sobald in Uebung 4/5 mehrere
 * Views dieselben Daten brauchen, wandert das in einen Context oder einen
 * Store - sonst muesste jede View erneut laden oder alles durch die halbe
 * Komponentenhierarchie durchgereicht werden ("prop drilling").
 *
 * Die Typen und die Normalisierung kommen unveraendert aus js/types.ts. Die
 * Arbeit aus Uebung 2 wird hier wiederverwendet, nicht nachgebaut - deshalb
 * gilt auch hier: "Reviewed" und "unreviewed" werden einmal beim Laden auf
 * den kanonischen Wertebereich gebracht.
 */
export function useCaseData(): LadeZustand {
  const [daten, setDaten] = useState<CaseDaten>(LEER);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    // Verhindert ein setState, nachdem die Komponente schon weg ist.
    let aktiv = true;

    void (async () => {
      try {
        const caseData = await ladeJson<CaseData>("data/case.json");
        const people = await ladeJson<Person[]>("data/people.json");
        const locations = await ladeJson<CaseLocation[]>("data/locations.json");
        const evidenceRoh = await ladeJson<RawEvidence[]>("data/evidence.json");
        const timelineRoh = await ladeJson<RawTimelineEvent[]>("data/timeline.json");

        if (!aktiv) return;
        setDaten({
          caseData,
          people,
          locations,
          evidence: normalisiereEvidence(evidenceRoh),
          timeline: normalisiereTimeline(timelineRoh)
        });
      } catch (err) {
        if (aktiv) setFehler(err instanceof Error ? err.message : String(err));
      } finally {
        if (aktiv) setLaedt(false);
      }
    })();

    return () => {
      aktiv = false;
    };
  }, []);

  return { ...daten, laedt, fehler };
}
