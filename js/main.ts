import { isViewName } from "./state.js";
import { mustEl, targetOf, targetValue } from "./dom.js";
// Einstiegspunkt. Verdrahtet beim Start alle Event-Listener und stoesst das
// Laden der Falldaten an. Exportiert bewusst nichts - dieses Modul wird nur
// von index.html geladen, niemand importiert daraus.

import { loadAllData } from "./data.js";
import { handleHashChange, navigateTo } from "./navigation.js";
import { loadBookmarksFromStorage, loadNotesFromStorage, loadNoteAsync } from "./storage.js";
import {
  clearFilters,
  closeEvidenceDetail,
  handleEvidenceListClick,
  handleSearchInput,
  handleSortChange,
  renderEvidenceList,
  saveCurrentNote
} from "./views/evidence.js";
import { switchPeopleTab } from "./views/people.js";
import { renderTimeline } from "./views/timeline.js";
import { saveHypothesis } from "./views/workspace.js";

function setupEventListeners() {
  window.addEventListener("hashchange", handleHashChange);

  // Navigation. Die Buttons trugen vorher onclick="navigateTo('...')" direkt im
  // HTML. Inline-Handler werden gegen den *globalen* Scope aufgeloest, und
  // Modul-Top-Level ist nicht global - sie wuerden mit type="module" alle
  // "navigateTo is not defined" werfen. Deshalb hier ueber data-Attribute.
  const navButtons = document.querySelectorAll(".nav-btn");
  for (const button of navButtons) {
    button.addEventListener("click", () => {
      const targetView = button.getAttribute("data-view");
      console.log("nav clicked:", targetView);
      // data-view kommt aus dem HTML und ist damit string | null. isViewName ist
      // die Stelle, an der daraus ein gueltiger ViewName wird - oder eben nicht.
      if (isViewName(targetView)) navigateTo(targetView);
    });
  }

  for (const button of document.querySelectorAll("[data-nav-target]")) {
    button.addEventListener("click", () => {
      const ziel = button.getAttribute("data-nav-target");
      if (isViewName(ziel)) navigateTo(ziel);
    });
  }

  // Evidence
  // handleSearchInput ist async, gibt also ein Promise zurueck. addEventListener
  // erwartet void - ein zurueckgegebenes Promise wuerde niemand abfangen.
  // void macht sichtbar, dass das Ergebnis bewusst verworfen wird.
  mustEl("evidenceSearch").addEventListener("input", (e: Event) => {
    void handleSearchInput(e);
  });

  // Event delegation fuer Karten-Klicks / Bookmark-Button. Genau einmal registriert -
  // vorher hing der Listener nach jedem renderEvidenceList() zusaetzlich am Container.
  mustEl("evidenceList").addEventListener("click", handleEvidenceListClick);

  mustEl("filterType").addEventListener("change", renderEvidenceList);
  mustEl("filterPerson").addEventListener("change", renderEvidenceList);
  mustEl("filterLocation").addEventListener("change", renderEvidenceList);
  mustEl("filterStatus").addEventListener("change", renderEvidenceList);
  mustEl("filterRelevance").addEventListener("change", renderEvidenceList);

  mustEl("sortEvidence").addEventListener("change", handleSortChange);
  mustEl("clearFiltersBtn").addEventListener("click", clearFilters);

  // Die Detailansicht wird per innerHTML neu aufgebaut, ihre Buttons existieren
  // also noch nicht. Delegation auf den Container, der statisch im HTML steht.
  mustEl("evidenceDetailSection").addEventListener("click", (e: Event) => {
    const action = targetOf(e)?.getAttribute?.("data-action");
    if (action === "close-detail") closeEvidenceDetail();
    if (action === "save-note") saveCurrentNote();
  });

  // People & Locations
  mustEl("tabPeopleBtn").addEventListener("click", () => switchPeopleTab("people"));
  mustEl("tabLocationsBtn").addEventListener("click", () => switchPeopleTab("locations"));

  // Timeline
  mustEl("timelineOrder").addEventListener("change", renderTimeline);
  mustEl("timelinePersonFilter").addEventListener("change", renderTimeline);
  mustEl("timelineLocationFilter").addEventListener("change", renderTimeline);
  mustEl("timelineTypeFilter").addEventListener("change", renderTimeline);

  // Workspace
  mustEl("saveHypothesisBtn").addEventListener("click", saveHypothesis);
  mustEl("hypConfidence").addEventListener("input", (e: Event) => {
    mustEl("hypConfidenceValue").textContent = targetValue(e);
  });
}

async function initApp() {
  loadBookmarksFromStorage();
  loadNotesFromStorage();
  setupEventListeners();

  await loadAllData();
  handleHashChange();

  const firstNote = await loadNoteAsync("E01");
  console.log("First note preview:", firstNote);
}

// Module werden automatisch deferred ausgefuehrt, das DOM steht also bereits.
// Der fruehere doppelte hashchange-Listener (einmal hier, einmal in
// setupEventListeners) war wirkungslos, weil identische Referenzen dedupliziert
// werden - er ist trotzdem entfernt, weil er beim Lesen Unsinn suggeriert.
// initApp ist async; void markiert, dass hier bewusst nicht gewartet wird.
void initApp();
