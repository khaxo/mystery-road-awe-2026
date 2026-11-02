// Zugriff auf den localStorage fuer die React-Version.
//
// Warum nicht js/storage.ts wiederverwenden? Jene Funktionen schreiben in das
// globale `state`-Objekt der Vanilla-App - genau die Art geteilten, veraenderlichen
// Zustands, die React ersetzt. Die Speicher-SCHLUESSEL werden dagegen importiert,
// damit beide Versionen dieselben Eintraege lesen und schreiben.
//
// Jede Funktion hier ist defensiv: Der Inhalt des localStorage kommt von
// AUSSERHALB des Programms. Typen allein helfen da nicht (Lektion aus Uebung 2),
// deshalb steht um jeden JSON.parse ein try/catch.

import {
  STORAGE_KEY_BOOKMARKS,
  STORAGE_KEY_HYPOTHESIS,
  STORAGE_KEY_NOTES
} from "../../../js/state.js";
import type { Hypothesis } from "../../../js/types.js";
import { istHypothesis } from "../../../js/types.js";

export function leseBookmarks(): string[] {
  try {
    const roh = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const geparst: unknown = roh ? JSON.parse(roh) : [];
    return Array.isArray(geparst) ? (geparst as string[]) : [];
  } catch (err) {
    console.warn("Gespeicherte Bookmarks unlesbar, starte leer", err);
    return [];
  }
}

export function schreibeBookmarks(ids: readonly string[]): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(ids));
}

export function leseNotizen(): Record<string, string> {
  try {
    const roh = localStorage.getItem(STORAGE_KEY_NOTES);
    const geparst: unknown = roh ? JSON.parse(roh) : {};
    return geparst && typeof geparst === "object" && !Array.isArray(geparst)
      ? (geparst as Record<string, string>)
      : {};
  } catch (err) {
    console.warn("Gespeicherte Notizen unlesbar, starte leer", err);
    return {};
  }
}

export function schreibeNotizen(notizen: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notizen));
}

export function leseHypothese(): Partial<Hypothesis> | null {
  try {
    const roh = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
    if (!roh) return null;
    const geparst: unknown = JSON.parse(roh);
    return istHypothesis(geparst) ? geparst : null;
  } catch (err) {
    console.warn("Gespeicherter Hypothesen-Entwurf unlesbar, ignoriere ihn", err);
    return null;
  }
}

export function schreibeHypothese(entwurf: Hypothesis): void {
  localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(entwurf));
}
