import { navigateTo } from "../navigation.js";
import { state } from "../state.js";
import { certaintyBadgeClass, findEvidenceById, findLocationById, formatDate } from "../utils.js";
import { openEvidenceDetail } from "./evidence.js";

export function populateTimelineDropdowns() {
  const personSelect = document.getElementById("timelinePersonFilter");
  const locationSelect = document.getElementById("timelineLocationFilter");
  const typeSelect = document.getElementById("timelineTypeFilter");
  if (!personSelect || !locationSelect || !typeSelect) return;

  personSelect.innerHTML = '<option value="">All people</option>';
  for (let p = 0; p < state.allPeople.length; p++) {
    personSelect.innerHTML += '<option value="' + state.allPeople[p].id + '">' + state.allPeople[p].name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (let l = 0; l < state.allLocations.length; l++) {
    locationSelect.innerHTML += '<option value="' + state.allLocations[l].id + '">' + state.allLocations[l].id + "</option>";
  }

  const types = [];
  for (let i = 0; i < state.allTimeline.length; i++) {
    if (types.indexOf(state.allTimeline[i].type) === -1) types.push(state.allTimeline[i].type);
  }
  typeSelect.innerHTML = '<option value="">All event types</option>';
  for (let t = 0; t < types.length; t++) {
    typeSelect.innerHTML += '<option value="' + types[t] + '">' + types[t] + "</option>";
  }
}

export function renderTimeline() {
  const container = document.getElementById("timelineContainer");
  if (!container) return;

  const order = document.getElementById("timelineOrder").value;
  const personFilter = document.getElementById("timelinePersonFilter").value;
  const locationFilter = document.getElementById("timelineLocationFilter").value;
  const typeFilter = document.getElementById("timelineTypeFilter").value;

  let events = [];
  for (let i = 0; i < state.allTimeline.length; i++) {
    const evt = state.allTimeline[i];
    if (personFilter && evt.personIds.indexOf(personFilter) === -1) continue;
    if (locationFilter && evt.locationIds.indexOf(locationFilter) === -1) continue;
    if (typeFilter && evt.type !== typeFilter) continue;
    events.push(evt);
  }

  events = events.slice().sort(function (a, b) {
    const diff = new Date(a.time) - new Date(b.time);
    return order === "desc" ? -diff : diff;
  });

  let html = "";
  for (let e = 0; e < events.length; e++) {
    const item = events[e];
    html += '<div class="timeline-event certainty-' + item.certainty + '">';
    html += '<div class="timeline-time">' + formatDate(item.time) + '&nbsp;&middot;&nbsp;<span class="badge badge-' + certaintyBadgeClass(item.certainty) + '">' + item.certainty + "</span></div>";
    html += "<h3>" + item.title + "</h3>";
    html += "<p>" + item.description + "</p>";

    const eventLocationNames = [];
    for (let el = 0; el < item.locationIds.length; el++) {
      const evtLoc = findLocationById(item.locationIds[el]);
      eventLocationNames.push(evtLoc || item.locationIds[el]);
    }
    if (eventLocationNames.length > 0) {
      html += '<p class="evidence-meta">Location: ' + eventLocationNames.join(", ") + "</p>";
    }

    for (let ev2 = 0; ev2 < item.evidenceIds.length; ev2++) {
      html += '<button type="button" class="evidence-link-btn" data-evidence-id="' + item.evidenceIds[ev2] + '">View ' + item.evidenceIds[ev2] + "</button>";
    }
    html += "</div>";
  }
  if (events.length === 0) {
    html = "<p>No timeline events match the current filters.</p>";
  }
  container.innerHTML = html;

  const linkButtons = container.querySelectorAll(".evidence-link-btn");
  for (let b = 0; b < linkButtons.length; b++) {
    linkButtons[b].addEventListener("click", (e) => {
      openEvidenceModal(e.target.getAttribute("data-evidence-id"));
    });
  }
}

export function openEvidenceModal(evidenceId) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  let modal = document.getElementById("quickViewModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quickViewModal";
    document.body.appendChild(modal);

    // Listener genau einmal registrieren - beim Erzeugen des Modal-Elements.
    // Vorher hing er an jedem oeffnen neu dran und wurde nie entfernt.
    state.modalCloseListenerCount++;
    console.log("modal close listener attached, active close listeners:", state.modalCloseListenerCount);

    modal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-close-btn") || e.target.classList.contains("modal-backdrop")) {
        modal.innerHTML = "";
      }
      if (e.target.getAttribute && e.target.getAttribute("data-open-full")) {
        modal.innerHTML = "";
        navigateTo("evidence");
        setTimeout(function () {
          openEvidenceDetail(e.target.getAttribute("data-open-full"));
        }, 0);
      }
    });
  }

  modal.innerHTML =
    '<div class="modal-backdrop"><div class="modal-box">' +
    '<button type="button" class="modal-close-btn" aria-label="Close">&times;</button>' +
    "<h3>" + ev.title + "</h3>" +
    '<p class="evidence-meta">' + ev.id + " &middot; " + ev.type + " &middot; " + formatDate(ev.timestamp) + "</p>" +
    "<p>" + ev.summary + "</p>" +
    '<button type="button" class="btn btn-primary btn-small" data-open-full="' + ev.id + '">Open full evidence</button>' +
    "</div></div>";

}
