// Geteilter, veraenderlicher Zustand der Anwendung.
//
// Warum ein Objekt statt einzelner exportierter Variablen:
// Ein `import { allEvidence }` erzeugt ein *read-only binding*. Ein anderes Modul
// koennte es lesen, aber `allEvidence = [...]` dort wirft
// "Cannot assign to read only property" / "Assignment to constant variable".
// Ein exportiertes Objekt umgeht das sauber: die Bindung `state` bleibt konstant,
// veraendert werden nur ihre Properties.

import type { CaseData, CaseLocation, Evidence, Person, TimelineEvent } from "./types.js";

export type ViewName = "dashboard" | "evidence" | "people" | "timeline" | "workspace";
export type PeopleTab = "people" | "locations";
export type EvidenceSortOrder = "date-desc" | "date-asc" | "title-asc" | "title-desc";

export interface AppState {
  allEvidence: Evidence[];
  filteredEvidence: Evidence[];
  selectedEvidence: Evidence | null;
  bookmarks: string[];
  currentPage: ViewName;

  allPeople: Person[];
  allLocations: CaseLocation[];
  allTimeline: TimelineEvent[];
  caseData: Partial<CaseData>;

  currentPeopleTab: PeopleTab;
  loadingStepsRemaining: number;
  evidenceViewLoading: boolean;

  viewRendered: Record<ViewName, boolean>;

  evidenceSortOrder: EvidenceSortOrder;
  notesStore: Record<string, string>;
  modalCloseListenerCount: number;
  latestSearchRequestId: number;
}

export const state: AppState = {
  allEvidence: [],
  filteredEvidence: [],
  selectedEvidence: null,
  bookmarks: [],
  currentPage: "dashboard",

  allPeople: [],
  allLocations: [],
  allTimeline: [],
  // Partial<CaseData>, weil das Dashboard rendert, bevor case.json geladen ist -
  // vorher ist das Objekt tatsaechlich leer. Das macht die Optionalitaet im Typ
  // sichtbar, statt sie mit einem Dummy-Objekt zu verstecken.
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

const VIEW_NAMES: readonly ViewName[] = [
  "dashboard",
  "evidence",
  "people",
  "timeline",
  "workspace"
];
const SORT_ORDERS: readonly EvidenceSortOrder[] = [
  "date-desc",
  "date-asc",
  "title-asc",
  "title-desc"
];

/**
 * Das DOM liefert immer `string | null` - ein data-Attribut kann fehlen, ein
 * <option value> kann beliebig sein. Diese Guards sind die einzige Stelle, an der
 * aus "irgendein String aus dem HTML" ein Wert der Domaene wird.
 */
export function isViewName(value: string | null): value is ViewName {
  return value !== null && (VIEW_NAMES as readonly string[]).includes(value);
}

export function isSortOrder(value: string): value is EvidenceSortOrder {
  return (SORT_ORDERS as readonly string[]).includes(value);
}
