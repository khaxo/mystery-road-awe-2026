// Domain-Modell des Falls. Die Typen bilden ab, was tatsaechlich in
// public/data/*.json steht - nicht, was dort idealerweise stehen sollte.

/* ------------------------------------------------------------------ *
 * Kanonische Wertebereiche
 * ------------------------------------------------------------------ */

// Die Auswahlwerte stammen aus den statischen <select>-Optionen in index.html.
// Sie sind kleingeschrieben; die JSON-Daten sind es nicht durchgaengig (siehe
// Normalisierung unten).
export type EvidenceStatus = "unreviewed" | "reviewed" | "flagged";
export type EvidenceRelevance = "unknown" | "relevant" | "irrelevant";
export type TimelineCertainty = "confirmed" | "reported" | "contradictory";

/* ------------------------------------------------------------------ *
 * Rohdaten, so wie sie aus den JSON-Dateien kommen
 * ------------------------------------------------------------------ */

// Absichtlich lockerer typisiert als das kanonische Modell: Was im File steht,
// haelt sich nicht an die Wertebereiche. Diese Typen beschreiben die Realitaet.
export interface RawEvidence {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  summary: string;
  content: string;
  personIds: string[];
  locationIds: string[];
  tags: string[];
  status: string;
  relevance: string;
}

export interface RawTimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: string;
  certainty: string;
  personIds: string[];
  locationIds: string[];
  evidenceIds: string[];
}

/* ------------------------------------------------------------------ *
 * Kanonisches Modell, mit dem die App arbeitet
 * ------------------------------------------------------------------ */

export interface Evidence extends Omit<RawEvidence, "status" | "relevance" | "type"> {
  type: string;
  status: EvidenceStatus;
  relevance: EvidenceRelevance;
  /** Wird zur Laufzeit aus dem localStorage gesetzt, steht nicht in der JSON. */
  bookmarked?: boolean;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  speciality: string;
  responsibilities: string[];
  statement: string;
  background: string;
  avatar: string;
}

export interface CaseLocation {
  id: string;
  name: string;
  description: string;
  contains: string[];
}

export interface TimelineEvent extends Omit<RawTimelineEvent, "certainty"> {
  certainty: TimelineCertainty;
}

export interface CaseData {
  caseId: string;
  title: string;
  subtitle: string;
  status: string;
  opened: string;
  summary: string;
  location: string;
  leadInvestigator: string;
  notes: string;
}

export interface Hypothesis {
  suspectIds: string[];
  evidenceIds: string[];
  reasoning: string;
  confidence: number;
  savedAt: string;
}

/* ------------------------------------------------------------------ *
 * Normalisierung: Rohdaten -> kanonisches Modell
 * ------------------------------------------------------------------ */

const EVIDENCE_STATUS: readonly EvidenceStatus[] = ["unreviewed", "reviewed", "flagged"];
const EVIDENCE_RELEVANCE: readonly EvidenceRelevance[] = ["unknown", "relevant", "irrelevant"];
const TIMELINE_CERTAINTY: readonly TimelineCertainty[] = ["confirmed", "reported", "contradictory"];

/**
 * Die JSON enthaelt sowohl "Reviewed" als auch "unreviewed", sowohl "Test-Report"
 * als auch "test-report". Frueher hat sich jede Vergleichsstelle einzeln mit
 * .toLowerCase() beholfen. Jetzt wird genau einmal, beim Laden, entschieden.
 */
function zuStatus(wert: string): EvidenceStatus {
  const klein = wert.toLowerCase();
  return EVIDENCE_STATUS.includes(klein as EvidenceStatus)
    ? (klein as EvidenceStatus)
    : "unreviewed";
}

function zuRelevanz(wert: string): EvidenceRelevance {
  const klein = wert.toLowerCase();
  return EVIDENCE_RELEVANCE.includes(klein as EvidenceRelevance)
    ? (klein as EvidenceRelevance)
    : "unknown";
}

function zuCertainty(wert: string): TimelineCertainty {
  const klein = wert.toLowerCase();
  return TIMELINE_CERTAINTY.includes(klein as TimelineCertainty)
    ? (klein as TimelineCertainty)
    : "reported";
}

export function normalisiereEvidence(raw: RawEvidence[]): Evidence[] {
  return raw.map((e) => ({
    ...e,
    type: e.type.toLowerCase(),
    status: zuStatus(e.status),
    relevance: zuRelevanz(e.relevance)
  }));
}

export function normalisiereTimeline(raw: RawTimelineEvent[]): TimelineEvent[] {
  return raw.map((t) => ({ ...t, certainty: zuCertainty(t.certainty) }));
}

export function isEvidenceStatus(v: string): v is EvidenceStatus {
  return (EVIDENCE_STATUS as readonly string[]).includes(v);
}

export function isEvidenceRelevance(v: string): v is EvidenceRelevance {
  return (EVIDENCE_RELEVANCE as readonly string[]).includes(v);
}
