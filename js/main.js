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
      navigateTo(targetView);
    });
  }

  for (const button of document.querySelectorAll("[data-nav-target]")) {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-nav-target")));
  }

  // Evidence
  document.getElementById("evidenceSearch").addEventListener("input", handleSearchInput);

  // Event delegation fuer Karten-Klicks / Bookmark-Button. Genau einmal registriert -
  // vorher hing der Listener nach jedem renderEvidenceList() zusaetzlich am Container.
  document.getElementById("evidenceList").addEventListener("click", handleEvidenceListClick);

  document.getElementById("filterType").addEventListener("change", renderEvidenceList);
  document.getElementById("filterPerson").addEventListener("change", renderEvidenceList);
  document.getElementById("filterLocation").addEventListener("change", renderEvidenceList);
  document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);
  document.getElementById("filterRelevance").addEventListener("change", renderEvidenceList);

  document.getElementById("sortEvidence").addEventListener("change", handleSortChange);
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);

  // Die Detailansicht wird per innerHTML neu aufgebaut, ihre Buttons existieren
  // also noch nicht. Delegation auf den Container, der statisch im HTML steht.
  document.getElementById("evidenceDetailSection").addEventListener("click", (e) => {
    const action = e.target.getAttribute && e.target.getAttribute("data-action");
    if (action === "close-detail") closeEvidenceDetail();
    if (action === "save-note") saveCurrentNote();
  });

  // People & Locations
  document
    .getElementById("tabPeopleBtn")
    .addEventListener("click", () => switchPeopleTab("people"));
  document
    .getElementById("tabLocationsBtn")
    .addEventListener("click", () => switchPeopleTab("locations"));

  // Timeline
  document.getElementById("timelineOrder").addEventListener("change", renderTimeline);
  document.getElementById("timelinePersonFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineLocationFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineTypeFilter").addEventListener("change", renderTimeline);

  // Workspace
  document.getElementById("saveHypothesisBtn").addEventListener("click", saveHypothesis);
  document.getElementById("hypConfidence").addEventListener("input", (e) => {
    document.getElementById("hypConfidenceValue").textContent = e.target.value;
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
initApp();
