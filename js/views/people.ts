import type { Person } from "../types.js";
import type { PeopleTab } from "../state.js";
import { mustEl, targetOf } from "../dom.js";
import { navigateTo } from "../navigation.js";
import { state } from "../state.js";
import { evidenceMentionsPerson } from "../utils.js";
import { renderEvidenceList } from "./evidence.js";

export function switchPeopleTab(tab: PeopleTab) {
  state.currentPeopleTab = tab;
  const peoplePanel = mustEl("peoplePanel");
  const locationsPanel = mustEl("locationsPanel");
  const peopleTabBtn = mustEl("tabPeopleBtn");
  const locationsTabBtn = mustEl("tabLocationsBtn");

  if (tab === "people") {
    peoplePanel.classList.remove("hidden");
    locationsPanel.classList.add("hidden");
    peopleTabBtn.classList.add("active");
    locationsTabBtn.classList.remove("active");
  } else {
    peoplePanel.classList.add("hidden");
    locationsPanel.classList.remove("hidden");
    peopleTabBtn.classList.remove("active");
    locationsTabBtn.classList.add("active");
  }
}

function countEvidenceForPerson(person: Person) {
  let count = 0;
  for (let i = 0; i < state.allEvidence.length; i++) {
    if (evidenceMentionsPerson(state.allEvidence[i], person)) count++;
  }
  return count;
}

export function renderPeople() {
  const container = mustEl("peoplePanel");
  let html = "";
  for (let i = 0; i < state.allPeople.length; i++) {
    const person = state.allPeople[i];
    const count = countEvidenceForPerson(person);

    html += '<div class="person-card">';
    html += '<div class="person-card-header">';
    html +=
      '<img class="person-avatar" src="' +
      person.avatar +
      '" alt="Portrait of ' +
      person.name +
      '">';
    html +=
      "<div><h3>" + person.name + '</h3><div class="person-role">' + person.role + "</div></div>";
    html += "</div>";
    html += "<p><strong>Speciality:</strong> " + person.speciality + "</p>";
    html += "<ul>";
    for (let r = 0; r < person.responsibilities.length; r++) {
      html += "<li>" + person.responsibilities[r] + "</li>";
    }
    html += "</ul>";
    html += '<div class="person-statement">&ldquo;' + person.statement + "&rdquo;</div>";
    html += "<p>" + count + " related evidence item" + (count === 1 ? "" : "s") + " &mdash; ";
    html +=
      '<button type="button" class="evidence-count-link" data-person-id="' +
      person.id +
      '">view</button></p>';
    html += "</div>";
  }
  container.innerHTML = html;

  const links = container.querySelectorAll(".evidence-count-link");
  for (let l = 0; l < links.length; l++) {
    links[l].addEventListener("click", (e: Event) => {
      const personId = targetOf(e)?.getAttribute("data-person-id");
      if (!personId) return;
      mustEl<HTMLInputElement>("filterPerson").value = personId;
      navigateTo("evidence");
      setTimeout(function () {
        renderEvidenceList();
      }, 0);
    });
  }
}

export function renderLocations() {
  const container = mustEl("locationsPanel");
  let html = "";
  for (let i = 0; i < state.allLocations.length; i++) {
    const loc = state.allLocations[i];
    html += '<div class="location-card">';
    html += "<h3>" + loc.id + " &mdash; " + loc.name + "</h3>";
    html += "<p>" + loc.description + "</p>";
    html += "<p><strong>Contains:</strong></p><ul>";
    for (let c = 0; c < loc.contains.length; c++) {
      html += "<li>" + loc.contains[c] + "</li>";
    }
    html += "</ul></div>";
  }
  container.innerHTML = html;
}
