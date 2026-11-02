import type { CaseDaten } from "../../shared/hooks/useCaseData.js";
import { useBookmarks } from "../../shared/state/BookmarkContext.js";
import { CaseSummaryCard } from "./components/CaseSummaryCard.js";
import { RecentEvidenceList } from "./components/RecentEvidenceList.js";
import { RecentTimelineList } from "./components/RecentTimelineList.js";
import { ReviewProgress } from "./components/ReviewProgress.js";
import { StatCard } from "./components/StatCard.js";

interface Props {
  daten: CaseDaten;
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
export function DashboardView({ daten }: Props) {
  // Der Zaehler ist eine ABGELEITETE Zahl: die Laenge der einen Liste, die es
  // gibt. Bis Uebung 4 las diese Datei den localStorage selbst, danach kam die
  // Zahl als Prop, jetzt aus dem Context. Gemeinsam ist allen drei Fassungen,
  // dass die Zahl nirgends GESPEICHERT wird - genau deshalb kann sie nicht
  // veralten wie der Zaehler in der Vanilla-Version.
  const { bookmarks } = useBookmarks();

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
        <StatCard wert={bookmarks.length} label="Bookmarked" />
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
