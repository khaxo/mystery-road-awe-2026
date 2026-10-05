import { useEffect, useState } from "react";

export const VIEWS = ["dashboard", "evidence", "people", "timeline", "workspace"] as const;
export type ViewName = (typeof VIEWS)[number];

export const VIEW_LABELS: Record<ViewName, string> = {
  dashboard: "Dashboard",
  evidence: "Evidence",
  people: "People & Locations",
  timeline: "Timeline",
  workspace: "Workspace"
};

function istViewName(wert: string): wert is ViewName {
  return (VIEWS as readonly string[]).includes(wert);
}

/** Liest die aktuelle View aus dem Hash, mit Fallback auf "dashboard". */
function ausHash(): ViewName {
  const roh = window.location.hash.replace("#", "");
  return istViewName(roh) ? roh : "dashboard";
}

/**
 * Minimales Routing-Skelett.
 *
 * Unterschied zur Vanilla-Version: Dort war `state.currentPage` eine globale
 * Variable, und `handleHashChange()` hat anschliessend *von Hand* CSS-Klassen
 * umgeschaltet und Render-Funktionen aufgerufen. Hier ist die aktuelle View
 * React-State - eine Aenderung loest das Neu-Rendern automatisch aus, und
 * niemand fasst das DOM direkt an.
 *
 * Konzeptionell gleich geblieben ist die Quelle der Wahrheit: der URL-Hash.
 * Beide Versionen reagieren auf `hashchange`, beide fallen auf "dashboard"
 * zurueck, wenn der Hash unbekannt ist.
 */
export function useHashRoute(): [ViewName, (ziel: ViewName) => void] {
  const [view, setView] = useState<ViewName>(ausHash);

  useEffect(() => {
    const beiAenderung = () => setView(ausHash());
    window.addEventListener("hashchange", beiAenderung);
    // Aufraeumen: ohne das wuerde sich bei jedem Mount ein weiterer Listener
    // ansammeln - genau das Leck, das in Uebung 1 Bug 4 war.
    return () => window.removeEventListener("hashchange", beiAenderung);
  }, []);

  const navigiere = (ziel: ViewName) => {
    window.location.hash = ziel;
  };

  return [view, navigiere];
}
