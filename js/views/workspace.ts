import { mustEl, targetOf, valueOf } from "../dom.js";
import { navigateTo } from "../navigation.js";
import { STORAGE_KEY_HYPOTHESIS, state } from "../state.js";
import { getSelectedOptions } from "../utils.js";
import { openEvidenceDetail } from "./evidence.js";

export function renderWorkspace() {
  renderBookmarksList();
  renderNotesList();
  populateHypothesisDropdowns();
  loadHypothesisFromStorage();
}

function renderBookmarksList() {
  const container = mustEl("bookmarksList");
  if (!container) return;

  const bookmarkedItems = state.allEvidence.filter(function (ev) {
    return ev.bookmarked;
  });

  if (bookmarkedItems.length === 0) {
    container.innerHTML =
      "<p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>";
    return;
  }

  let html = "";
  for (let i = 0; i < bookmarkedItems.length; i++) {
    const ev = bookmarkedItems[i];
    html +=
      '<div class="mini-list-item"><strong>' +
      ev.id +
      "</strong> &mdash; " +
      ev.title +
      ' <button type="button" class="btn btn-small btn-secondary" data-open-evidence="' +
      ev.id +
      '">Open</button></div>';
  }
  container.innerHTML = html;

  const openButtons = container.querySelectorAll("[data-open-evidence]");
  for (let b = 0; b < openButtons.length; b++) {
    openButtons[b].addEventListener("click", (e: Event) => {
      navigateTo("evidence");
      const id = targetOf(e)?.getAttribute("data-open-evidence");
      if (!id) return;
      setTimeout(() => openEvidenceDetail(id), 0);
    });
  }
}

function renderNotesList() {
  const container = mustEl("notesList");
  if (!container) return;

  const noteEntries = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const note = state.notesStore[state.allEvidence[i].id];
    if (note) {
      noteEntries.push({
        index: i,
        evidenceId: state.allEvidence[i].id,
        title: state.allEvidence[i].title,
        text: note
      });
    }
  }

  if (noteEntries.length === 0) {
    container.innerHTML = "<p>No notes yet. Add one from an evidence item's detail view.</p>";
    return;
  }

  let html = "";
  for (let n = 0; n < noteEntries.length; n++) {
    const entry = noteEntries[n];
    html +=
      '<div class="mini-list-item"><strong>' +
      entry.evidenceId +
      "</strong> &mdash; " +
      entry.title;
    html += '<div id="noteText-' + entry.index + '">' + entry.text + "</div></div>"; // unsafe innerHTML rendering, same as the note preview
  }
  container.innerHTML = html;
}

export function populateHypothesisDropdowns() {
  const suspectSelect = mustEl<HTMLSelectElement>("hypSuspect");
  const evidenceSelect = mustEl<HTMLSelectElement>("hypEvidence");
  if (!suspectSelect || !evidenceSelect) return;

  const currentSuspect = suspectSelect.value;
  suspectSelect.innerHTML = '<option value="">Select a person…</option>';
  for (let p = 0; p < state.allPeople.length; p++) {
    suspectSelect.innerHTML +=
      '<option value="' + state.allPeople[p].id + '">' + state.allPeople[p].name + "</option>";
  }
  suspectSelect.value = currentSuspect;

  evidenceSelect.innerHTML = "";
  for (let i = 0; i < state.allEvidence.length; i++) {
    evidenceSelect.innerHTML +=
      '<option value="' +
      state.allEvidence[i].id +
      '">' +
      state.allEvidence[i].id +
      " - " +
      state.allEvidence[i].title +
      "</option>";
  }
}

export function saveHypothesis() {
  const draft = {
    suspectId: valueOf("hypSuspect"),
    nature: valueOf("hypNature"),
    evidenceIds: getSelectedOptions(mustEl("hypEvidence")),
    confidence: valueOf("hypConfidence"),
    explanation: valueOf("hypExplanation"),
    alternative: valueOf("hypAlternative"),
    savedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(draft));
  } catch (err) {
    console.error("Could not save hypothesis draft", err);
    alert("Your hypothesis could not be saved to local storage.");
    return;
  }

  const msg = mustEl("hypothesisSavedMsg");
  msg.classList.remove("hidden");
  setTimeout(function () {
    msg.classList.add("hidden");
  }, 2000);
}

export function loadHypothesisFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
  if (!raw) return;

  const draft = JSON.parse(raw);

  mustEl<HTMLInputElement>("hypSuspect").value = draft.suspectId || "";
  mustEl<HTMLInputElement>("hypNature").value = draft.nature || "";
  mustEl<HTMLInputElement>("hypConfidence").value = draft.confidence || 50;
  mustEl("hypConfidenceValue").textContent = draft.confidence || 50;
  mustEl<HTMLInputElement>("hypExplanation").value = draft.explanation || "";
  mustEl<HTMLInputElement>("hypAlternative").value = draft.alternative || "";

  const evidenceSelect = mustEl<HTMLSelectElement>("hypEvidence");
  const savedIds = draft.evidenceIds || [];
  for (let i = 0; i < evidenceSelect.options.length; i++) {
    evidenceSelect.options[i].selected = savedIds.indexOf(evidenceSelect.options[i].value) !== -1;
  }
}
