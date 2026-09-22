import { state } from "./state.js";

export function findEvidenceById(id) {
  for (var i = 0; i < state.allEvidence.length; i++) {
    if (state.allEvidence[i].id === id) return state.allEvidence[i];
  }
  return null;
}

export function findPersonById(id) {
  for (var i = 0; i < state.allPeople.length; i++) {
    if (state.allPeople[i].id === id) return state.allPeople[i];
  }
  return null;
}

export function findLocationById(id) {
  for (var i = 0; i < state.allLocations.length; i++) {
    if (state.allLocations[i].id === id) return state.allLocations[i];
  }
  return null;
}

export function evidenceMentionsPerson(ev, person) {
  if (!ev.personIds) return false;
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
}

export function formatDate(ts) {
  if (!ts) return "Unknown date";
  var d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function getStatusBadgeClass(status) {
  var s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
}

export function getRelevanceBadgeClass(relevance) {
  var r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-unreviewed";
}

export function certaintyBadgeClass(certainty) {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
}

export function getSelectedOptions(selectEl) {
  var result = [];
  for (var i = 0; i < selectEl.options.length; i++) {
    if (selectEl.options[i].selected) result.push(selectEl.options[i].value);
  }
  return result;
}
