import { el, mustEl, targetOf, valueOf } from "../dom.js";
import { navigateTo } from "../navigation.js";
import { state } from "../state.js";
import { certaintyBadgeClass, findEvidenceById, findLocationById, formatDate } from "../utils.js";
import { openEvidenceDetail } from "./evidence.js";

export function populateTimelineDropdowns() {
  const personSelect = mustEl("timelinePersonFilter");
  const locationSelect = mustEl("timelineLocationFilter");
  const typeSelect = mustEl("timelineTypeFilter");
  if (!personSelect || !locationSelect || !typeSelect) return;

  personSelect.innerHTML = '<option value="">All people</option>';
  for (const eintrag of state.allPeople) {
    personSelect.innerHTML += '<option value="' + eintrag.id + '">' + eintrag.name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (const eintrag of state.allLocations) {
    locationSelect.innerHTML += '<option value="' + eintrag.id + '">' + eintrag.id + "</option>";
  }

  const types: string[] = [];
  for (const eintrag of state.allTimeline) {
    if (!types.includes(eintrag.type)) types.push(eintrag.type);
  }
  typeSelect.innerHTML = '<option value="">All event types</option>';
  for (const eintrag of types) {
    typeSelect.innerHTML += '<option value="' + eintrag + '">' + eintrag + "</option>";
  }
}

export function renderTimeline() {
  const container = mustEl("timelineContainer");
  if (!container) return;

  const order = valueOf("timelineOrder");
  const personFilter = valueOf("timelinePersonFilter");
  const locationFilter = valueOf("timelineLocationFilter");
  const typeFilter = valueOf("timelineTypeFilter");

  let events = [];
  for (const eintrag of state.allTimeline) {
    const evt = eintrag;
    if (personFilter && !evt.personIds.includes(personFilter)) continue;
    if (locationFilter && !evt.locationIds.includes(locationFilter)) continue;
    if (typeFilter && evt.type !== typeFilter) continue;
    events.push(evt);
  }

  events = events.slice().sort(function (a, b) {
    const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
    return order === "desc" ? -diff : diff;
  });

  let html = "";
  for (const eintrag of events) {
    const item = eintrag;
    html += '<div class="timeline-event certainty-' + item.certainty + '">';
    html +=
      '<div class="timeline-time">' +
      formatDate(item.time) +
      '&nbsp;&middot;&nbsp;<span class="badge badge-' +
      certaintyBadgeClass(item.certainty) +
      '">' +
      item.certainty +
      "</span></div>";
    html += "<h3>" + item.title + "</h3>";
    html += "<p>" + item.description + "</p>";

    const eventLocationNames: string[] = [];
    for (const eintrag of item.locationIds) {
      const evtLoc = findLocationById(eintrag);
      eventLocationNames.push(evtLoc ? evtLoc.name : eintrag);
    }
    if (eventLocationNames.length > 0) {
      html += '<p class="evidence-meta">Location: ' + eventLocationNames.join(", ") + "</p>";
    }

    for (const eintrag of item.evidenceIds) {
      html +=
        '<button type="button" class="evidence-link-btn" data-evidence-id="' +
        eintrag +
        '">View ' +
        eintrag +
        "</button>";
    }
    html += "</div>";
  }
  if (events.length === 0) {
    html = "<p>No timeline events match the current filters.</p>";
  }
  container.innerHTML = html;

  const linkButtons = container.querySelectorAll(".evidence-link-btn");
  for (const eintrag of linkButtons) {
    eintrag.addEventListener("click", (e: Event) => {
      const id = targetOf(e)?.getAttribute("data-evidence-id");
      if (id) openEvidenceModal(id);
    });
  }
}

export function openEvidenceModal(evidenceId: string) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  let modal = el("quickViewModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quickViewModal";
    document.body.appendChild(modal);

    // Listener genau einmal registrieren - beim Erzeugen des Modal-Elements.
    // Vorher hing er an jedem oeffnen neu dran und wurde nie entfernt.
    state.modalCloseListenerCount++;
    console.log(
      "modal close listener attached, active close listeners:",
      state.modalCloseListenerCount
    );

    const modalEl = modal;
    modalEl.addEventListener("click", (e: Event) => {
      if (
        targetOf(e)?.classList.contains("modal-close-btn") ||
        targetOf(e)?.classList.contains("modal-backdrop")
      ) {
        modalEl.innerHTML = "";
      }
      const volleId = targetOf(e)?.getAttribute("data-open-full");
      if (volleId) {
        modalEl.innerHTML = "";
        navigateTo("evidence");
        setTimeout(() => openEvidenceDetail(volleId), 0);
      }
    });
  }

  modal.innerHTML =
    '<div class="modal-backdrop"><div class="modal-box">' +
    '<button type="button" class="modal-close-btn" aria-label="Close">&times;</button>' +
    "<h3>" +
    ev.title +
    "</h3>" +
    '<p class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</p>" +
    "<p>" +
    ev.summary +
    "</p>" +
    '<button type="button" class="btn btn-primary btn-small" data-open-full="' +
    ev.id +
    '">Open full evidence</button>' +
    "</div></div>";
}
