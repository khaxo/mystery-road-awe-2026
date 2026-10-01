import { STORAGE_KEY_BOOKMARKS, STORAGE_KEY_NOTES, state } from "./state.js";

export function saveBookmarksToStorage(): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    // JSON.parse liefert `any` - hier bewusst als `unknown` angenommen und
    // geprueft, statt dem Inhalt des localStorage blind zu vertrauen.
    state.bookmarks = Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    state.bookmarks = [];
  }
}

export function saveNoteForEvidence(evidenceId: string, text: string): void {
  state.notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId: string): string {
  return state.notesStore[evidenceId] || "";
}

export function loadNotesFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY_NOTES);
  if (!raw) {
    state.notesStore = {};
    return;
  }

  // Siehe CHANGES-2.md: hier fehlt bewusst (noch) ein try/catch - das ist der
  // Punkt, an dem Typen allein NICHT helfen, weil die Daten zur Laufzeit kommen.
  try {
    const parsed: unknown = JSON.parse(raw);
    state.notesStore =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, string>)
        : {};
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}

export function loadNoteAsync(evidenceId: string): Promise<string> {
  return new Promise((resolve) => {
    resolve(state.notesStore[evidenceId] || "");
  });
}
