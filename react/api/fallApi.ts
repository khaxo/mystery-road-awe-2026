// API-Zugriffsschicht.
//
// Diese Datei weiss zwei Dinge: welche URLs es gibt und welche Form die
// Antworten haben. Sie weiss NICHT, dass es React gibt - kein Hook, kein
// useState, kein JSX, kein Ladezustand. Jede Funktion hier ist ein
// Versprechen auf Daten, nichts weiter.
//
// Damit ist sie die einzige Stelle, die sich aendern muss, wenn das Backend
// seine Pfade oder seine Antwortformen aendert (siehe CHANGES-6.md, Demo 9).

import type {
  CaseData,
  CaseLocation,
  Evidence,
  Person,
  RawEvidence,
  RawTimelineEvent,
  TimelineEvent
} from "../../js/types.js";
import { normalisiereEvidence, normalisiereTimeline } from "../../js/types.js";
import { BASIS_BESCHREIBUNG, nutztBackend, url } from "./basis.js";

export { BASIS_BESCHREIBUNG, nutztBackend };

/** Testschalter des Entwicklungs-Backends. Im statischen Modus wirkungslos. */
export interface Testschalter {
  /** Kuenstliche Verzoegerung in Millisekunden. */
  delay?: number;
  /** true -> der Endpunkt antwortet mit 500. */
  fail?: boolean;
  /** true -> der Endpunkt antwortet mit einer leeren Liste. */
  empty?: boolean;
}

/**
 * Testschalter aus der Adresszeile - einmal beim Laden gelesen.
 *
 * Damit laesst sich jeder der drei Zustaende aus Demo 6 ohne Codeaenderung
 * ausloesen. Die Schalter stehen VOR dem Rautezeichen, damit sie nicht mit
 * dem Routenpfad kollidieren:
 *
 *   react.html?delay=3000#/dashboard    langsames Laden
 *   react.html?fail=1#/dashboard        Fehlerzustand
 *   react.html?empty=1#/evidence        Leerzustand
 *
 * Sie wirken nur gegen das Backend. Im statischen Modus werden sie
 * ignoriert - eine Datei kann nicht langsam oder kaputt sein, und genau das
 * ist der Grund, warum es das Backend gibt (Demo 4).
 *
 * Bewusst einmal beim Laden und nicht reaktiv: Ein Schalter, der sich
 * mittendrin aendert, waere ein Zustand, den die ganze Anwendung beobachten
 * muesste - fuer ein Werkzeug, das man beim Aufrufen der Seite einstellt.
 */
function schalterAusAdresse(): Testschalter {
  if (!nutztBackend) return {};

  const parameter = new URLSearchParams(window.location.search);
  const delay = Number(parameter.get("delay"));

  return {
    delay: Number.isFinite(delay) && delay > 0 ? delay : undefined,
    fail: parameter.get("fail") !== null,
    empty: parameter.get("empty") !== null
  };
}

const ADRESS_SCHALTER = schalterAusAdresse();

/** Was gerade ueber die Adresszeile simuliert wird - fuer die Anzeige. */
export const SIMULATION = ADRESS_SCHALTER;

function query(schalter?: Testschalter, extra?: Record<string, string>) {
  // Die Adressschalter gelten fuer alle Anfragen; ein ausdruecklich
  // uebergebener Schalter gewinnt (die Wettlauf-Demo setzt ihre eigene
  // Verzoegerung pro Anfrage).
  const wirksam: Testschalter = { ...ADRESS_SCHALTER, ...schalter };

  const parameter: Record<string, string> = { ...extra };
  if (wirksam.delay !== undefined) parameter.delay = String(wirksam.delay);
  if (wirksam.fail) parameter.fail = "1";
  if (wirksam.empty) parameter.empty = "1";
  return Object.keys(parameter).length > 0 ? parameter : undefined;
}

/**
 * Eine Anfrage, ein Ergebnis.
 *
 * Zwei Dinge, die hier bewusst passieren:
 *
 * 1. `res.ok` wird GEPRUEFT. `fetch` lehnt bei einem 500er nicht ab - das
 *    Versprechen erfuellt sich mit einer Antwort, die eben einen Fehlerstatus
 *    hat. Ohne diese Pruefung wuerde der Fehlerzustand nie ausgeloest; das
 *    JSON.parse darunter wuerde es tun, und zwar mit einer irrefuehrenden
 *    Meldung.
 *
 * 2. Das `signal` wird durchgereicht. Es kommt vom AbortController des
 *    aufrufenden Hooks. Damit kann die Anwendungsschicht eine laufende
 *    Anfrage abbrechen, ohne dass diese Datei wissen muss, warum.
 */
async function holen<T>(pfad: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(pfad, { signal });

  if (!res.ok) {
    throw new Error(`${pfad} antwortete mit ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export function ladeFall(signal?: AbortSignal, schalter?: Testschalter): Promise<CaseData> {
  return holen<CaseData>(url("case", query(schalter)), signal);
}

export function ladePersonen(signal?: AbortSignal, schalter?: Testschalter): Promise<Person[]> {
  return holen<Person[]>(url("people", query(schalter)), signal);
}

export function ladeOrte(signal?: AbortSignal, schalter?: Testschalter): Promise<CaseLocation[]> {
  return holen<CaseLocation[]>(url("locations", query(schalter)), signal);
}

export async function ladeEvidence(
  signal?: AbortSignal,
  schalter?: Testschalter
): Promise<Evidence[]> {
  const roh = await holen<RawEvidence[]>(url("evidence", query(schalter)), signal);
  // Normalisierung gehoert hierher: "Reviewed" gegen "unreviewed" ist eine
  // Eigenschaft der ANTWORTFORM, und Antwortformen sind das Thema dieser
  // Datei. Der Hook darueber bekommt fertige Domaenenobjekte.
  return normalisiereEvidence(roh);
}

export async function ladeTimeline(
  signal?: AbortSignal,
  schalter?: Testschalter
): Promise<TimelineEvent[]> {
  const roh = await holen<RawTimelineEvent[]>(url("timeline", query(schalter)), signal);
  return normalisiereTimeline(roh);
}

/**
 * Serversuche in den Belegen. Nur fuer die Wettlauf-Demo (Demo 7).
 *
 * Der Belegkatalog filtert weiterhin im Client - bei 18 Datensaetzen ist das
 * die richtige Antwort, und die Begruendung steht in CHANGES-5.md, Demo 4.
 * Diese Funktion existiert, weil ein Wettlauf zwischen Anfragen eine Anfrage
 * braucht, die von einer Benutzereingabe abhaengt.
 */
export async function sucheEvidence(
  suchbegriff: string,
  signal?: AbortSignal,
  schalter?: Testschalter
): Promise<Evidence[]> {
  const roh = await holen<RawEvidence[]>(
    url("evidence", query(schalter, { q: suchbegriff })),
    signal
  );
  return normalisiereEvidence(roh);
}
