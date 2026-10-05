import type { CaseDaten } from "../hooks/useCaseData.js";
import { CaseSummaryCard } from "../components/CaseSummaryCard.js";
import { RecentEvidenceList } from "../components/RecentEvidenceList.js";
import { RecentTimelineList } from "../components/RecentTimelineList.js";
import { ReviewProgress } from "../components/ReviewProgress.js";
import { StatCard } from "../components/StatCard.js";

interface Props {
  daten: CaseDaten;
  bookmarkAnzahl: number;
}

/**
 * Dashboard-View.
 *
 * Gegenueber renderDashboard() aus der Vanilla-Version sind zwei Dinge anders:
 *
 * 1. Kein `container.innerHTML = html`. Es wird kein HTML-String gebaut und
 *    kein DOM-Teilbaum weggeworfen - React vergleicht und aendert nur, was
 *    sich tatsaechlich unterscheidet.
 *
 * 2. Die abgeleiteten Werte (geprueft, letzte fuenf Eintraege) werden bei
 *    JEDEM Render neu berechnet. In der Vanilla-Version passierte das nur,
 *    wenn jemand renderDashboard() aufrief - und das geschah wegen des
 *    viewRendered-Flags nur beim ERSTEN Besuch der View. Daher die veralteten
 *    Zahlen dort.
 */
export function DashboardView({ daten, bookmarkAnzahl }: Props) {
  const geprueft = daten.evidence.filter((ev) => ev.status === "reviewed").length;

  // slice() vor reverse(), weil reverse() in place arbeitet - genau der
  // Mutationsfehler aus Uebung 1, Bug 5.
  const letzteEvidence = daten.evidence.slice(-5).reverse();
  const letzteTimeline = daten.timeline.slice(-5).reverse();

  return (
    <section className="view active">
      <h2>Case Dashboard</h2>

      <CaseSummaryCard caseData={daten.caseData} />

      <div className="stat-grid">
        <StatCard wert={daten.evidence.length} label="Evidence items" />
        <StatCard wert={daten.people.length} label="People" />
        <StatCard wert={daten.locations.length} label="Locations" />
        <StatCard wert={bookmarkAnzahl} label="Bookmarked" />
        <StatCard wert={geprueft} label="Reviewed" />
      </div>

      <ReviewProgress geprueft={geprueft} gesamt={daten.evidence.length} />

      <div className="dashboard-columns">
        <RecentEvidenceList eintraege={letzteEvidence} />
        <RecentTimelineList eintraege={letzteTimeline} />
      </div>
    </section>
  );
}
