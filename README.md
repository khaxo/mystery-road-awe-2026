# Project ReMotion – Investigation Portal

Investigate the failure of an AI-assisted rehabilitation robot.

## About

Project ReMotion is a browser-based investigation platform built around a fictional incident.
During a pre-demonstration calibration test, the AI-assisted rehabilitation robot **ReMotion**
loaded the wrong calibration profile and triggered its emergency stop. This application lets an
investigator review the evidence, people, locations, and timeline surrounding the incident, and
build up a working hypothesis about what happened.

This repository contains an existing vanilla-JavaScript (no frameworks used) investigation application. The system is
functional but has accumulated technical debt and inconsistent implementation decisions. Your task
during the course will be to analyse, maintain, refactor, migrate, and extend it.

## Running the application

This application uses `fetch()` to load its case data from local JSON files, so it must be served
over HTTP — opening `index.html` directly from the filesystem (`file://`) will not work in most
browsers.

Any static file server will do. For example, from the project root:

```bash
# Python 3
python -m http.server 8080

# Node.js (no install required)
npx serve .

# VS Code
# Use the "Live Server" extension
```

Then open `http://localhost:8080` (or whatever port your server prints) in your browser.

## Entwicklungs-Backend (nur lokal)

Seit Übung 6 liest die React-Version ihre Falldaten im Entwicklungsmodus von einem
kleinen Node-Server, statt die JSON-Dateien direkt zu laden.

**Dieser Server wird nicht deployt.** Die GitHub-Pages-Pipeline aus Übung 2 baut und
veröffentlicht weiterhin ausschließlich das statische Frontend. Der Server ist kein
Teil des Workflows, kein Teil des Builds und steht nicht in den `dependencies` —
`express` ist eine `devDependency`.

### Starten

Zwei Terminals:

```bash
npm run server
```

```bash
npm run dev
```

Der Server lauscht auf `http://localhost:3001`, der Vite-Dev-Server auf
`http://localhost:5173`. Unterschiedlicher Port heißt unterschiedlicher Origin,
deshalb setzt der Server einen `Access-Control-Allow-Origin`-Header für die
Vite-Adressen (`server/index.js`).

### Endpunkte

| Endpunkt             | liefert                                                    |
| -------------------- | ---------------------------------------------------------- |
| `GET /api/case`      | `public/data/case.json`                                    |
| `GET /api/evidence`  | `public/data/evidence.json`, optional gefiltert über `?q=` |
| `GET /api/people`    | `public/data/people.json`                                  |
| `GET /api/locations` | `public/data/locations.json`                               |
| `GET /api/timeline`  | `public/data/timeline.json`                                |

Nur Lesezugriffe. Lesezeichen, Notizen und der Hypothesen-Entwurf bleiben im
`localStorage` — daran ändert diese Übung nichts.

### Testschalter

Pro Anfrage einstellbar, damit sich Lade-, Fehler- und Leerzustände vorführen lassen:

| Parameter     | Wirkung                                     |
| ------------- | ------------------------------------------- |
| `?delay=2000` | wartet 2000 ms vor der Antwort (max. 20000) |
| `?fail=1`     | antwortet mit `500` statt mit Daten         |
| `?empty=1`    | antwortet mit einer leeren Liste            |

`API_DELAY=500 npm run server` setzt die Grundverzögerung für alle Endpunkte
(Standard: 250 ms).

Dieselben drei Schalter wirken auch über die Adresszeile des Frontends und gelten
dann für alle Anfragen:

```
react.html?delay=3000#/dashboard
react.html?fail=1#/dashboard
react.html?empty=1#/evidence
```

### Woher die Daten kommen

Entschieden wird das an einer Stelle, in `react/api/basis.ts`:

| Modus                          | Quelle                      |
| ------------------------------ | --------------------------- |
| `npm run dev`                  | `http://localhost:3001/api` |
| `npm run dev:static`           | `data/*.json` (ohne Server) |
| `npm run build` / GitHub Pages | `data/*.json`               |

Der Produktionsbuild fällt auf die statischen Dateien zurück, weil das Backend
laut Aufgabenstellung nicht deployt wird. Ohne diesen Rückfall wäre die
veröffentlichte Seite tot. Beide Modi liefern dieselben Formen, weil der Server
genau diese Dateien ausliefert.

Die Vanilla-Version unter `index.html` ist davon nicht betroffen — sie lädt
weiterhin direkt die JSON-Dateien.

## Features

- **Dashboard** — case summary and key statistics calculated from the loaded case data.
- **Evidence catalogue** — search, filter (by type, person, location, status, relevance), sort,
  bookmark, and open detailed evidence records.
- **People & Locations** — profile cards for the investigation team and the six key locations.
- **Timeline** — chronological view of case events with filtering and links to related evidence.
- **Investigator workspace** — bookmarked evidence, personal notes, and a hypothesis draft form.
  Workspace data is saved to your browser's local storage and will still be there when you reload
  the page.

## Browser requirements

A recent version of any evergreen desktop browser (Chrome, Firefox, Edge, Safari). JavaScript must
be enabled. The layout targets common desktop and tablet widths.

## Project status

This is an existing brownfield application, not a fresh scaffold. It works for everyday use, but
you should expect to find rough edges, inconsistent patterns, and a handful of bugs as you work
with it — that discovery process is part of the course.
