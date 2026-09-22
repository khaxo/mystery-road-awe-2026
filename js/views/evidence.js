import { state } from "../state.js";
import { loadNoteForEvidence, saveBookmarksToStorage, saveNoteForEvidence } from "../storage.js";
import { evidenceMentionsPerson, findEvidenceById, findLocationById, findPersonById, formatDate, getRelevanceBadgeClass, getStatusBadgeClass } from "../utils.js";

export function populateEvidenceDropdowns() {
  var typeSelect = document.getElementById("filterType");
  var personSelect = document.getElementById("filterPerson");
  var locationSelect = document.getElementById("filterLocation");
  if (!typeSelect || !personSelect || !locationSelect) return;

  var types = [];
  for (var i = 0; i < state.allEvidence.length; i++) {
    var t = state.allEvidence[i].type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = '<option value="">All types</option>';
  for (var ti = 0; ti < types.length; ti++) {
    typeSelect.innerHTML += '<option value="' + types[ti] + '">' + types[ti] + "</option>";
  }

  personSelect.innerHTML = '<option value="">All people</option>';
  for (var p = 0; p < state.allPeople.length; p++) {
    personSelect.innerHTML += '<option value="' + state.allPeople[p].id + '">' + state.allPeople[p].name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (var l = 0; l < state.allLocations.length; l++) {
    locationSelect.innerHTML += '<option value="' + state.allLocations[l].id + '">' + state.allLocations[l].id + " - " + state.allLocations[l].name + "</option>";
  }
}

export function getFilteredEvidence() {
  var searchBox = document.getElementById("evidenceSearch");
  var searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  var typeVal = document.getElementById("filterType").value;
  var personVal = document.getElementById("filterPerson").value;
  var locationVal = document.getElementById("filterLocation").value;
  var statusVal = document.getElementById("filterStatus").value;
  var relevanceVal = document.getElementById("filterRelevance").value;

  var results = [];
  for (var i = 0; i < state.allEvidence.length; i++) {
    var item = state.allEvidence[i];
    var matches = true;

    if (searchTerm) {
      var haystack = (item.title + " " + item.summary + " " + item.tags.join(" ")).toLowerCase();
      if (haystack.indexOf(searchTerm) === -1) matches = false;
    }
    if (matches && typeVal && item.type.toLowerCase() !== typeVal) matches = false;
    if (matches && personVal) {
      var person = findPersonById(personVal);
      if (!person || !evidenceMentionsPerson(item, person)) matches = false;
    }
    if (matches && locationVal && item.locationIds.indexOf(locationVal) === -1) matches = false;
    if (matches && statusVal && (item.status || "").toLowerCase() !== statusVal) matches = false;
    if (matches && relevanceVal && (item.relevance || "").toLowerCase() !== relevanceVal) matches = false;

    if (matches) results.push(item);
  }

  sortEvidenceList(results, state.evidenceSortOrder);

  state.filteredEvidence = results;
  return results;
}

// Sortiert die uebergebene Liste in place. Privat - nur getFilteredEvidence und
// handleSortChange brauchen das.
function sortEvidenceList(list, sortValue) {
  if (sortValue === "title-asc") {
    list.sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
  } else if (sortValue === "title-desc") {
    list.sort(function (a, b) {
      return b.title.localeCompare(a.title);
    });
  } else if (sortValue === "date-asc") {
    list.sort(function (a, b) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  } else {
    list.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }
  return list;
}

export function renderEvidenceList() {
  var container = document.getElementById("evidenceList");
  if (!container) return;

  var loadingIndicator = document.getElementById("evidenceLoadingIndicator");
  if (state.evidenceViewLoading) {
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }
  if (loadingIndicator) loadingIndicator.classList.add("hidden");

  var results = getFilteredEvidence();

  var html = "";
  if (results.length === 0) {
    html = "<p>No evidence matches the current filters.</p>";
  }
  for (var i = 0; i < results.length; i++) {
    html += renderEvidenceCardHTML(results[i]);
  }
  container.innerHTML = html;
}

function renderEvidenceCardHTML(ev) {
  var isBookmarked = state.bookmarks.indexOf(ev.id) !== -1;
  var html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html += '<button class="bookmark-btn ' + (isBookmarked ? "active" : "") + '" data-action="bookmark" data-id="' + ev.id + '" aria-label="Toggle bookmark for ' + ev.title + '"><span class="bookmark-icon">' + (isBookmarked ? "★" : "☆") + "</span></button>";
  html += "<h3>" + ev.title + "</h3>";
  html += '<div class="evidence-meta">' + ev.id + " &middot; " + ev.type + " &middot; " + formatDate(ev.timestamp) + "</div>";
  html += '<div class="evidence-summary">' + ev.summary + "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<span class="badge badge-critical">Critical</span>';
  }
  html += '<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
  html += '<span class="badge ' + getRelevanceBadgeClass(ev.relevance) + '">' + ev.relevance + "</span>";
  html += "<div>";
  for (var t = 0; t < ev.tags.length; t++) {
    html += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }
  html += "</div>";
  html += "</div>";
  return html;
}

export function handleEvidenceListClick(event) {
  var target = event.target;

  if (target.dataset && target.dataset.action === "bookmark") {
    event.stopPropagation();
    handleBookmarkClick(target.dataset.id);
    return;
  }

  var card = target.closest(".evidence-card");
  if (card) {
    openEvidenceDetail(card.getAttribute("data-id"));
  }
}

function handleBookmarkClick(evidenceId) {
  var ev = findEvidenceById(evidenceId);
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
  for (var i = 0; i < state.allEvidence.length; i++) {
    state.allEvidence[i].bookmarked = state.bookmarks.indexOf(state.allEvidence[i].id) !== -1;
  }
}

export function handleSortChange() {
  state.evidenceSortOrder = document.getElementById("sortEvidence").value;
  renderEvidenceList();
}


export function clearFilters() {
  document.getElementById("evidenceSearch").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterPerson").value = "";
  document.getElementById("filterLocation").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterRelevance").value = "";
  renderEvidenceList();
}

function simulateAsyncSearch(term) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(term);
    }, 300);
  });
}

export function handleSearchInput(event) {
  var term = event.target.value;
  var requestId = ++state.latestSearchRequestId;

  simulateAsyncSearch(term).then(function (resolvedTerm) {
    // Only apply this response if nothing newer has been typed meanwhile.
    if (requestId !== state.latestSearchRequestId) return;
    renderEvidenceList();
  });
}

export function openEvidenceDetail(evidenceId) {
  var ev = findEvidenceById(evidenceId);
  if (!ev) return;
  state.selectedEvidence = ev;

  var section = document.getElementById("evidenceDetailSection");
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function closeEvidenceDetail() {
  var section = document.getElementById("evidenceDetailSection");
  section.classList.add("hidden");
  section.innerHTML = "";
  state.selectedEvidence = null;
}

function renderEvidenceDetail(ev) {
  var section = document.getElementById("evidenceDetailSection");

  var personNames = [];
  for (var p = 0; p < ev.personIds.length; p++) {
    var person = findPersonById(ev.personIds[p]);
    personNames.push(person ? person.name : ev.personIds[p]);
  }

  var locationNames = [];
  for (var l = 0; l < ev.locationIds.length; l++) {
    var loc = findLocationById(ev.locationIds[l]);
    locationNames.push(loc ? loc.id + " - " + loc.name : ev.locationIds[l]);
  }

  var tagsHtml = "";
  for (var t = 0; t < ev.tags.length; t++) {
    tagsHtml += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }

  var storedNote = loadNoteForEvidence(ev.id);

  var html = "";
  html += '<div class="evidence-detail-header">';
  html += "<div><h2>" + ev.title + "</h2>";
  html += '<div class="evidence-meta">' + ev.id + " &middot; " + ev.type + " &middot; " + formatDate(ev.timestamp) + "</div></div>";
  html += '<button type="button" class="btn btn-secondary btn-small" data-action="close-detail">Close</button>';
  html += "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<div class="warning-banner">This item is tagged as critical evidence.</div>';
  }

  html += '<div class="detail-field"><strong>Summary</strong>' + ev.summary + "</div>";
  html += '<div class="evidence-detail-content">' + ev.content + "</div>";
  html += '<div class="detail-field"><strong>Related people</strong>' + personNames.join(", ") + "</div>";
  html += '<div class="detail-field"><strong>Related locations</strong>' + locationNames.join(", ") + "</div>";
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
  html += '<textarea id="evidenceNoteInput" class="note-textarea" rows="3" data-evidence-id="' + ev.id + '" placeholder="Add a private note about this evidence...">' + storedNote + "</textarea>";
  html += '<button type="button" class="btn btn-primary btn-small" style="margin-top:6px;" data-action="save-note">Save note</button>';
  html += "</div>";

  html += '<div class="detail-field"><strong>Note preview</strong><div id="notePreview">' + storedNote + "</div></div>";

  section.innerHTML = html;

  document.getElementById("detailStatusSelect").addEventListener("change", function (e) {
    ev.status = e.target.value; // direct mutation of the loaded evidence object
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
  document.getElementById("detailRelevanceSelect").addEventListener("change", function (e) {
    ev.relevance = e.target.value;
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
}

function statusOptionHTML(current, value, label) {
  var currentLower = (current || "").toLowerCase();
  var selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

export function saveCurrentNote() {
  var textarea = document.getElementById("evidenceNoteInput");
  if (!textarea) return;
  var evidenceId = textarea.getAttribute("data-evidence-id"); // note id is read back off the DOM
  var text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  var preview = document.getElementById("notePreview");
  if (preview) preview.innerHTML = text; // unsafe on purpose, see above
}
