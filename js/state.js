// Geteilter, veraenderlicher Zustand der Anwendung.
//
// Warum ein Objekt statt einzelner exportierter Variablen:
// Ein `import { allEvidence }` erzeugt ein *read-only binding*. Ein anderes Modul
// koennte es lesen, aber `allEvidence = [...]` dort wirft
// "Cannot assign to read only property" / "Assignment to constant variable".
// Ein exportiertes Objekt umgeht das sauber: die Bindung `state` bleibt konstant,
// veraendert werden nur ihre Properties.
export const state = {
  allEvidence: [],
  filteredEvidence: [],
  selectedEvidence: null,
  bookmarks: [],
  currentPage: "dashboard",

  allPeople: [],
  allLocations: [],
  allTimeline: [],
  caseData: {},

  currentPeopleTab: "people",
  loadingStepsRemaining: 2,

  evidenceViewLoading: true,

  viewRendered: {
    dashboard: false,
    evidence: false,
    people: false,
    timeline: false,
    workspace: false
  },

  // Aktives Sortierkriterium der Evidence-Liste. Muss im Zustand stehen, weil
  // getFilteredEvidence() die Liste bei jedem Rendern neu aufbaut - eine einmal
  // in das Array sortierte Reihenfolge wuerde dabei verworfen.
  evidenceSortOrder: "date-desc",

  notesStore: {},
  modalCloseListenerCount: 0,
  latestSearchRequestId: 0
};

// Konstanten - nie neu zugewiesen, daher als normale named exports unproblematisch.
export const STORAGE_KEY_BOOKMARKS = "remotion_bookmarks";
export const STORAGE_KEY_NOTES = "remotion_notes";
export const STORAGE_KEY_HYPOTHESIS = "remotion_hypothesis";
