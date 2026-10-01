import { el } from "./dom.js";
import { populateAllDropdowns } from "./dropdowns.js";
import { state } from "./state.js";
import type { CaseData, CaseLocation, Person, RawEvidence, RawTimelineEvent } from "./types.js";
import { normalisiereEvidence, normalisiereTimeline } from "./types.js";
import { renderDashboard } from "./views/dashboard.js";
import { applyStoredBookmarkFlags, renderEvidenceList } from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";

function showLoadingOverlay(msg: string): void {
  const overlay = el("loadingOverlay");
  const text = el("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep(): void {
  state.loadingStepsRemaining--;
  if (state.loadingStepsRemaining <= 0) {
    el("loadingOverlay")?.classList.add("hidden");
  }
}

/**
 * res.json() liefert `any`. Diese Hilfsfunktion zwingt jeden Aufrufer, zu sagen,
 * was er erwartet - das `as T` steht damit an genau einer Stelle statt an fuenf.
 * Achtung, und das ist der Kern einer Prueffrage: Das ist eine *Behauptung*, keine
 * Pruefung. Steht etwas anderes in der Datei, merkt es TypeScript nicht.
 */
async function ladeJson<T>(pfad: string): Promise<T> {
  const res = await fetch(pfad);
  return (await res.json()) as T;
}

// Vorher: sechs Ebenen verschachtelte .then() - fetch -> .json() -> fetch -> .json()
// -> fetch -> .json(). Die Reihenfolge ist bewusst unveraendert: die drei Requests
// laufen weiterhin *nacheinander*, nicht parallel. Das Parallelisieren ist Thema
// einer spaeteren Uebung, hier geht es nur um die Lesbarkeit derselben Ablauffolge.
async function loadCorePeopleAndLocations(): Promise<void> {
  state.caseData = await ladeJson<CaseData>("data/case.json");
  state.allPeople = await ladeJson<Person[]>("data/people.json");
  state.allLocations = await ladeJson<CaseLocation[]>("data/locations.json");

  hideLoadingStep();
  renderDashboard();
  populateAllDropdowns();
}

async function loadEvidenceData(): Promise<void> {
  try {
    const raw = await ladeJson<RawEvidence[]>("data/evidence.json");

    // Normalisierung an genau einer Stelle: aus "Reviewed"/"unreviewed" wird
    // garantiert ein EvidenceStatus. Danach darf sich der Rest der App darauf
    // verlassen und braucht kein .toLowerCase() mehr an jeder Vergleichsstelle.
    state.allEvidence = normalisiereEvidence(raw);

    applyStoredBookmarkFlags();
    state.filteredEvidence = state.allEvidence.slice();
    renderDashboard();
    populateAllDropdowns();
    state.evidenceViewLoading = false;
    if (state.currentPage === "evidence") renderEvidenceList();
  } catch (err) {
    // entspricht dem frueheren .catch()
    console.error("Failed to load evidence.json", err);
    alert("Evidence could not be loaded. Some views may be incomplete.");
  }
}

async function loadTimelineData(): Promise<void> {
  try {
    const raw = await ladeJson<RawTimelineEvent[]>("data/timeline.json");
    state.allTimeline = normalisiereTimeline(raw);

    renderDashboard();
    if (state.currentPage === "timeline") renderTimeline();
    populateAllDropdowns();
  } catch (err) {
    // entspricht dem frueheren .catch()
    console.warn("timeline load error", err);
  } finally {
    // entspricht dem frueheren .finally()
    hideLoadingStep();
  }
}

export async function loadAllData(): Promise<void> {
  showLoadingOverlay("Loading case file\u2026");
  state.loadingStepsRemaining = 2;

  await loadCorePeopleAndLocations();

  // Bewusst ohne await: die beiden wurden auch vorher nur angestossen, nicht
  // abgewartet - loadAllData() war fertig, sobald der Kern geladen war.
  void loadEvidenceData();
  void loadTimelineData();
}
