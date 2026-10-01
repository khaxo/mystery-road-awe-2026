import { isViewName, state } from "./state.js";
import type { ViewName } from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderEvidenceList } from "./views/evidence.js";
import { renderLocations, renderPeople } from "./views/people.js";
import { renderTimeline } from "./views/timeline.js";
import { renderWorkspace } from "./views/workspace.js";

export function navigateTo(viewName: ViewName): void {
  window.location.hash = viewName;
  // handleHashChange() will pick this up via the hashchange listener
}

export function handleHashChange(): void {
  const raw = window.location.hash.replace("#", "");
  const hash: ViewName = isViewName(raw) ? raw : "dashboard";
  state.currentPage = hash;

  const sections = document.querySelectorAll<HTMLElement>(".view");
  sections.forEach((section) => section.classList.remove("active"));

  document.getElementById("view-" + hash)?.classList.add("active");

  const navButtons = document.querySelectorAll<HTMLElement>(".nav-btn");
  navButtons.forEach((button) => {
    button.classList.remove("active");
    if (button.getAttribute("data-view") === hash) {
      button.classList.add("active");
    }
  });

  if (hash === "dashboard" && !state.viewRendered.dashboard) {
    renderDashboard();
    state.viewRendered.dashboard = true;
  } else if (hash === "evidence" && !state.viewRendered.evidence) {
    renderEvidenceList();
    state.viewRendered.evidence = true;
  } else if (hash === "people" && !state.viewRendered.people) {
    renderPeople();
    renderLocations();
    state.viewRendered.people = true;
  } else if (hash === "timeline" && !state.viewRendered.timeline) {
    renderTimeline();
    state.viewRendered.timeline = true;
  } else if (hash === "workspace") {
    // workspace is cheap enough that it always re-renders
    renderWorkspace();
  }
}
