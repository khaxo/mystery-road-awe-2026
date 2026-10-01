import { state } from "./state.js";

// Alle Funktionen hier sind kleine, zustandslose Helfer ohne eigenes `this` und ohne
// `arguments` - damit sind sie unproblematische Kandidaten fuer Arrow Functions.
// Die drei Lookups ersetzen gleichzeitig handgeschriebene for-Schleifen durch
// Array.prototype.find: weniger Code, kein Schleifenindex, keine off-by-one-Gelegenheit.

export const findEvidenceById = (id) => state.allEvidence.find((ev) => ev.id === id) || null;

export const findPersonById = (id) => state.allPeople.find((person) => person.id === id) || null;

export const findLocationById = (id) => state.allLocations.find((loc) => loc.id === id) || null;

export const evidenceMentionsPerson = (ev, person) =>
  Boolean(ev.personIds) && (ev.personIds.includes(person.id) || ev.personIds.includes(person.name));

export const formatDate = (ts) => {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return (
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
};

export const getStatusBadgeClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
};

export const getRelevanceBadgeClass = (relevance) =>
  (relevance || "").toLowerCase() === "relevant" ? "badge-relevant" : "badge-unreviewed";

export const certaintyBadgeClass = (certainty) => {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
};

export const getSelectedOptions = (selectEl) =>
  Array.from(selectEl.options)
    .filter((option) => option.selected)
    .map((option) => option.value);
