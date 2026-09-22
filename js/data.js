import { populateAllDropdowns } from "./dropdowns.js";
import { state } from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { applyStoredBookmarkFlags, renderEvidenceList } from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";

function showLoadingOverlay(msg) {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep() {
  state.loadingStepsRemaining--;
  if (state.loadingStepsRemaining <= 0) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

// Vorher: sechs Ebenen verschachtelte .then() - fetch -> .json() -> fetch -> .json()
// -> fetch -> .json(). Die Reihenfolge ist bewusst unveraendert: die drei Requests
// laufen weiterhin *nacheinander*, nicht parallel. Das Parallelisieren ist Thema
// einer spaeteren Uebung, hier geht es nur um die Lesbarkeit derselben Ablauffolge.
async function loadCorePeopleAndLocations() {
  const caseRes = await fetch("data/case.json");
  state.caseData = await caseRes.json();

  const peopleRes = await fetch("data/people.json");
  state.allPeople = await peopleRes.json();

  const locationsRes = await fetch("data/locations.json");
  state.allLocations = await locationsRes.json();

  hideLoadingStep();
  renderDashboard();
  populateAllDropdowns();
}

async function loadEvidenceData() {
  try {
    const res = await fetch("data/evidence.json");
    const data = await res.json();

    state.allEvidence = data;
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

async function loadTimelineData() {
  try {
    const res = await fetch("data/timeline.json");
    const data = await res.json();

    state.allTimeline = data;
    renderDashboard();
    if (state.currentPage === "timeline") renderTimeline();
    populateAllDropdowns();
  } catch (err) {
    // entspricht dem frueheren .catch()
    console.log("timeline load error", err);
  } finally {
    // entspricht dem frueheren .finally()
    hideLoadingStep();
  }
}

export async function loadAllData() {
  showLoadingOverlay("Loading case file\u2026");
  state.loadingStepsRemaining = 2;

  await loadCorePeopleAndLocations();

  // Bewusst ohne await: die beiden wurden auch vorher nur angestossen, nicht
  // abgewartet - loadAllData() war fertig, sobald der Kern geladen war.
  loadEvidenceData();
  loadTimelineData();
}
