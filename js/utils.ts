import { state } from "./state.js";
import type { CaseLocation, Evidence, Person, TimelineCertainty } from "./types.js";

// Alle Funktionen hier sind kleine, zustandslose Helfer ohne eigenes `this` und ohne
// `arguments` - damit sind sie unproblematische Kandidaten fuer Arrow Functions.
// Die drei Lookups ersetzen gleichzeitig handgeschriebene for-Schleifen durch
// Array.prototype.find: weniger Code, kein Schleifenindex, keine off-by-one-Gelegenheit.

// Rueckgabetyp bewusst `| null` statt `| undefined`: find() liefert undefined,
// die Aufrufer pruefen aber durchgaengig auf null. Der Typ macht sichtbar, dass
// ein Lookup fehlschlagen KANN - genau das war bei "Nova Byte" der Fall.
export const findEvidenceById = (id: string): Evidence | null =>
  state.allEvidence.find((ev) => ev.id === id) ?? null;

export const findPersonById = (id: string): Person | null =>
  state.allPeople.find((person) => person.id === id) ?? null;

export const findLocationById = (id: string): CaseLocation | null =>
  state.allLocations.find((loc) => loc.id === id) ?? null;

// Prueft id UND name - weil evidence.json in personIds an einer Stelle einen
// Anzeigenamen ("Nova Byte") statt einer id enthaelt. Siehe CHANGES-2.md.
export const evidenceMentionsPerson = (ev: Evidence, person: Person): boolean =>
  Boolean(ev.personIds) && (ev.personIds.includes(person.id) || ev.personIds.includes(person.name));

export const formatDate = (ts: string): string => {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return (
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
};

export const getStatusBadgeClass = (status: string): string => {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
};

export const getRelevanceBadgeClass = (relevance: string): string =>
  (relevance || "").toLowerCase() === "relevant" ? "badge-relevant" : "badge-unreviewed";

export const certaintyBadgeClass = (certainty: TimelineCertainty): string => {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
};

export const getSelectedOptions = (selectEl: HTMLSelectElement): string[] =>
  Array.from(selectEl.options)
    .filter((option) => option.selected)
    .map((option) => option.value);
