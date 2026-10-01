import { populateEvidenceDropdowns } from "./views/evidence.js";
import { populateTimelineDropdowns } from "./views/timeline.js";
import { populateHypothesisDropdowns } from "./views/workspace.js";

export function populateAllDropdowns() {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}
