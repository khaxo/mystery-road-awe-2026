import type { Evidence } from "../types.js";
import type { EvidenceSortOrder } from "../state.js";
import { isEvidenceRelevance, isEvidenceStatus } from "../types.js";
import { mustEl, targetOf, targetValue, valueOf } from "../dom.js";
import { isSortOrder, state } from "../state.js";
import { loadNoteForEvidence, saveBookmarksToStorage, saveNoteForEvidence } from "../storage.js";
import {
  evidenceMentionsPerson,
  findEvidenceById,
  findLocationById,
  findPersonById,
  formatDate,
  getRelevanceBadgeClass,
  getStatusBadgeClass
} from "../utils.js";

export function populateEvidenceDropdowns() {
  const typeSelect = mustEl("filterType");
  const personSelect = mustEl("filterPerson");
  const locationSelect = mustEl("filterLocation");
  if (!typeSelect || !personSelect || !locationSelect) return;

  const types = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const t = state.allEvidence[i].type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = '<option value="">All types</option>';
  for (let ti = 0; ti < types.length; ti++) {
    typeSelect.innerHTML += '<option value="' + types[ti] + '">' + types[ti] + "</option>";
  }

  personSelect.innerHTML = '<option value="">All people</option>';
  for (let p = 0; p < state.allPeople.length; p++) {
    personSelect.innerHTML +=
      '<option value="' + state.allPeople[p].id + '">' + state.allPeople[p].name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (let l = 0; l < state.allLocations.length; l++) {
    locationSelect.innerHTML +=
      '<option value="' +
      state.allLocations[l].id +
      '">' +
      state.allLocations[l].id +
      " - " +
      state.allLocations[l].name +
      "</option>";
  }
}

export function getFilteredEvidence() {
  const searchBox = mustEl<HTMLInputElement>("evidenceSearch");
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const typeVal = valueOf("filterType");
  const personVal = valueOf("filterPerson");
  const locationVal = valueOf("filterLocation");
  const statusVal = valueOf("filterStatus");
  const relevanceVal = valueOf("filterRelevance");

  const results = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const item = state.allEvidence[i];
    let matches = true;

    if (searchTerm) {
      const haystack = (item.title + " " + item.summary + " " + item.tags.join(" ")).toLowerCase();
      if (haystack.indexOf(searchTerm) === -1) matches = false;
    }
    if (matches && typeVal && item.type.toLowerCase() !== typeVal) matches = false;
    if (matches && personVal) {
      const person = findPersonById(personVal);
      if (!person || !evidenceMentionsPerson(item, person)) matches = false;
    }
    if (matches && locationVal && item.locationIds.indexOf(locationVal) === -1) matches = false;
    if (matches && statusVal && (item.status || "").toLowerCase() !== statusVal) matches = false;
    if (matches && relevanceVal && (item.relevance || "").toLowerCase() !== relevanceVal)
      matches = false;

    if (matches) results.push(item);
  }

  sortEvidenceList(results, state.evidenceSortOrder);

  state.filteredEvidence = results;
  return results;
}

// Sortiert die uebergebene Liste in place. Privat - nur getFilteredEvidence und
// handleSortChange brauchen das.
function sortEvidenceList(list: Evidence[], sortValue: EvidenceSortOrder) {
  if (sortValue === "title-asc") {
    list.sort((a: Evidence, b: Evidence) => a.title.localeCompare(b.title));
  } else if (sortValue === "title-desc") {
    list.sort((a: Evidence, b: Evidence) => b.title.localeCompare(a.title));
  } else if (sortValue === "date-asc") {
    list.sort(
      (a: Evidence, b: Evidence) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } else {
    list.sort(
      (a: Evidence, b: Evidence) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
  return list;
}

export function renderEvidenceList() {
  const container = mustEl("evidenceList");
  if (!container) return;

  const loadingIndicator = mustEl("evidenceLoadingIndicator");
  if (state.evidenceViewLoading) {
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }
  if (loadingIndicator) loadingIndicator.classList.add("hidden");

  const results = getFilteredEvidence();

  let html = "";
  if (results.length === 0) {
    html = "<p>No evidence matches the current filters.</p>";
  }
  for (let i = 0; i < results.length; i++) {
    html += renderEvidenceCardHTML(results[i]);
  }
  container.innerHTML = html;
}

function renderEvidenceCardHTML(ev: Evidence) {
  const isBookmarked = state.bookmarks.indexOf(ev.id) !== -1;
  let html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html +=
    '<button class="bookmark-btn ' +
    (isBookmarked ? "active" : "") +
    '" data-action="bookmark" data-id="' +
    ev.id +
    '" aria-label="Toggle bookmark for ' +
    ev.title +
    '"><span class="bookmark-icon">' +
    (isBookmarked ? "★" : "☆") +
    "</span></button>";
  html += "<h3>" + ev.title + "</h3>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div>";
  html += '<div class="evidence-summary">' + ev.summary + "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<span class="badge badge-critical">Critical</span>';
  }
  html += '<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
  html +=
    '<span class="badge ' + getRelevanceBadgeClass(ev.relevance) + '">' + ev.relevance + "</span>";
  html += "<div>";
  for (let t = 0; t < ev.tags.length; t++) {
    html += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }
  html += "</div>";
  html += "</div>";
  return html;
}

export function handleEvidenceListClick(event: Event) {
  const target = targetOf(event);
  if (!target) return;

  if (target.dataset.action === "bookmark") {
    event.stopPropagation();
    const id = target.dataset.id;
    if (id) handleBookmarkClick(id);
    return;
  }

  const card = target.closest(".evidence-card");
  if (card) {
    const id = card.getAttribute("data-id");
    if (id) openEvidenceDetail(id);
  }
}

function handleBookmarkClick(evidenceId: string) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  if (state.bookmarks.indexOf(evidenceId) === -1) {
    state.bookmarks.push(evidenceId);
    ev.bookmarked = true;
  } else {
    state.bookmarks = state.bookmarks.filter(function (id) {
      return id !== evidenceId;
    });
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (state.currentPage === "evidence") renderEvidenceList();
}

export function applyStoredBookmarkFlags() {
  for (let i = 0; i < state.allEvidence.length; i++) {
    state.allEvidence[i].bookmarked = state.bookmarks.indexOf(state.allEvidence[i].id) !== -1;
  }
}

export function handleSortChange() {
  const gewaehlt = valueOf("sortEvidence");
  // <option value> ist fuer TypeScript ein beliebiger string. Der Guard ist die
  // einzige Stelle, an der daraus ein EvidenceSortOrder wird.
  if (isSortOrder(gewaehlt)) state.evidenceSortOrder = gewaehlt;
  renderEvidenceList();
}

export function clearFilters() {
  mustEl<HTMLInputElement>("evidenceSearch").value = "";
  mustEl<HTMLInputElement>("filterType").value = "";
  mustEl<HTMLInputElement>("filterPerson").value = "";
  mustEl<HTMLInputElement>("filterLocation").value = "";
  mustEl<HTMLInputElement>("filterStatus").value = "";
  mustEl<HTMLInputElement>("filterRelevance").value = "";
  renderEvidenceList();
}

const simulateAsyncSearch = (term: string): Promise<string> =>
  new Promise((resolve) => setTimeout(() => resolve(term), 300));

export async function handleSearchInput(event: Event) {
  const term = targetValue(event);
  const requestId = ++state.latestSearchRequestId;

  await simulateAsyncSearch(term);

  // Only apply this response if nothing newer has been typed meanwhile.
  // Der Guard muss NACH dem await stehen - davor waere er sinnlos, weil sich
  // latestSearchRequestId genau waehrend der Wartezeit aendern kann.
  if (requestId !== state.latestSearchRequestId) return;
  renderEvidenceList();
}

export function openEvidenceDetail(evidenceId: string) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;
  state.selectedEvidence = ev;

  const section = mustEl("evidenceDetailSection");
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function closeEvidenceDetail() {
  const section = mustEl("evidenceDetailSection");
  section.classList.add("hidden");
  section.innerHTML = "";
  state.selectedEvidence = null;
}

function renderEvidenceDetail(ev: Evidence) {
  const section = mustEl("evidenceDetailSection");

  const personNames = [];
  for (let p = 0; p < ev.personIds.length; p++) {
    const person = findPersonById(ev.personIds[p]);
    personNames.push(person ? person.name : ev.personIds[p]);
  }

  const locationNames = [];
  for (let l = 0; l < ev.locationIds.length; l++) {
    const loc = findLocationById(ev.locationIds[l]);
    locationNames.push(loc ? loc.id + " - " + loc.name : ev.locationIds[l]);
  }

  let tagsHtml = "";
  for (let t = 0; t < ev.tags.length; t++) {
    tagsHtml += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }

  const storedNote = loadNoteForEvidence(ev.id);

  let html = "";
  html += '<div class="evidence-detail-header">';
  html += "<div><h2>" + ev.title + "</h2>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div></div>";
  html +=
    '<button type="button" class="btn btn-secondary btn-small" data-action="close-detail">Close</button>';
  html += "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<div class="warning-banner">This item is tagged as critical evidence.</div>';
  }

  html += '<div class="detail-field"><strong>Summary</strong>' + ev.summary + "</div>";
  html += '<div class="evidence-detail-content">' + ev.content + "</div>";
  html +=
    '<div class="detail-field"><strong>Related people</strong>' + personNames.join(", ") + "</div>";
  html +=
    '<div class="detail-field"><strong>Related locations</strong>' +
    locationNames.join(", ") +
    "</div>";
  html += '<div class="detail-field"><strong>Tags</strong>' + tagsHtml + "</div>";

  html += '<div class="detail-field"><strong>Review status</strong>';
  html += '<select id="detailStatusSelect">';
  html += statusOptionHTML(ev.status, "unreviewed", "Unreviewed");
  html += statusOptionHTML(ev.status, "reviewed", "Reviewed");
  html += statusOptionHTML(ev.status, "flagged", "Flagged");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Relevance</strong>';
  html += '<select id="detailRelevanceSelect">';
  html += statusOptionHTML(ev.relevance, "unknown", "Unknown");
  html += statusOptionHTML(ev.relevance, "relevant", "Relevant");
  html += statusOptionHTML(ev.relevance, "irrelevant", "Irrelevant");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Investigator note</strong>';
  html +=
    '<textarea id="evidenceNoteInput" class="note-textarea" rows="3" data-evidence-id="' +
    ev.id +
    '" placeholder="Add a private note about this evidence...">' +
    storedNote +
    "</textarea>";
  html +=
    '<button type="button" class="btn btn-primary btn-small" style="margin-top:6px;" data-action="save-note">Save note</button>';
  html += "</div>";

  html +=
    '<div class="detail-field"><strong>Note preview</strong><div id="notePreview">' +
    storedNote +
    "</div></div>";

  section.innerHTML = html;

  mustEl("detailStatusSelect").addEventListener("change", (e: Event) => {
    const neu = targetValue(e);
    if (isEvidenceStatus(neu)) ev.status = neu; // direct mutation of the loaded evidence object
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
  mustEl("detailRelevanceSelect").addEventListener("change", (e: Event) => {
    const neu = targetValue(e);
    if (isEvidenceRelevance(neu)) ev.relevance = neu;
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
}

function statusOptionHTML(current: string, value: string, label: string) {
  const currentLower = (current || "").toLowerCase();
  const selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

export function saveCurrentNote() {
  const textarea = mustEl<HTMLTextAreaElement>("evidenceNoteInput");
  if (!textarea) return;
  const evidenceId = textarea.getAttribute("data-evidence-id"); // note id is read back off the DOM
  if (!evidenceId) return;
  const text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  const preview = mustEl("notePreview");
  if (preview) preview.innerHTML = text; // unsafe on purpose, see above
}
