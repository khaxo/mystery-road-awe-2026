# Architektur der React-Anwendung

Stand nach Übung 4. Drei der fünf Views sind vollständig in React: **Dashboard**,
**People & Locations**, **Timeline**. Evidence Catalogue und Workspace laufen
weiterhin in der Vanilla-TypeScript-Version und folgen in Übung 5.

## Ordnerstruktur

```
react/
├── main.tsx                      Einstiegspunkt: createRoot + <App/>
├── App.tsx                       Router, Lade-/Fehlerzustand, Routendefinition
│
├── app/                          Die Shell — was jede View umgibt
│   ├── AppHeader.tsx
│   ├── MainNav.tsx
│   └── NotFoundView.tsx
│
├── features/                     Ein Ordner pro fachlichem Bereich
│   ├── dashboard/
│   │   ├── DashboardView.tsx
│   │   └── components/           CaseSummaryCard, StatCard, ReviewProgress,
│   │                             RecentEvidenceList, RecentTimelineList
│   ├── team/
│   │   ├── TeamView.tsx          liest :tab, wählt die Liste
│   │   ├── PersonDetailView.tsx  liest :personId
│   │   └── components/           TeamTabs, PeopleList, PersonCard,
│   │                             LocationsList, LocationCard
│   ├── timeline/
│   │   ├── TimelineView.tsx      Filter in der URL, kein useState
│   │   └── components/           TimelineFilterBar, TimelineEntry
│   ├── evidence/
│   │   ├── EvidenceView.tsx      useReducer für die Filter, :evidenceId
│   │   ├── auswahl.ts            reine Auswahlfunktion, kein React
│   │   ├── filterReducer.ts      SET_FILTER, SET_SORT, CLEAR_FILTERS
│   │   └── components/           EvidenceToolbar, EvidenceList,
│   │                             EvidenceCard, EvidenceDetail
│   └── workspace/
│       ├── WorkspaceView.tsx
│       └── components/           BookmarkList, NotesList, HypothesisForm
│
├── shared/                       Von mindestens zwei Features benutzt
│   ├── components/               Badge, Card, EmptyState, AttributeList
│   ├── hooks/                    useCaseData
│   └── state/                    BookmarkContext, speicher (localStorage)
│
└── sandbox/                      Wegwerf-Beispiele, nicht Teil der App
    ├── HalloFall.tsx             JSX-Übung aus Übung 3
    ├── KeyDemo.tsx               key={index} gegen key={id}
    └── ControlledDemo.tsx        kontrolliert gegen unkontrolliert
```

Zwei Dateien in `features/evidence/` sind kein React: `auswahl.ts` und
`filterReducer.ts` enthalten keinen Hook, kein JSX und keinen React-Import. Das
ist Absicht — „welche Belege sind sichtbar?" und „was macht diese Aktion mit dem
Filterzustand?" sind Rechnungen, die man ohne React lesen und testen kann.

## Die Regel für „shared" gegen „feature-lokal"

**Eine Komponente wandert nach `shared/`, sobald sie von einem zweiten Feature
gebraucht wird — nicht vorher.**

Das ist bewusst eine _nachlaufende_ Regel. Etwas vorsorglich zu teilen, weil es
teilbar aussieht, führt zu Komponenten, die für zwei hypothetische Fälle ausgelegt
sind und für keinen davon gut.

**Beispiel „shared":** `Badge`. Wird in `dashboard/RecentEvidenceList`,
`team/PersonDetailView` und `timeline/TimelineEntry` benutzt — drei Features. Was
variiert, geht über Props (`text`, `klasse`); was fix ist, bleibt drin (das
`<span>` und die Basisklasse).

**Beispiel „feature-lokal":** `StatCard`. Sieht nach einem allgemeinen Baustein aus,
wird aber ausschließlich vom Dashboard benutzt. Sie bleibt in
`features/dashboard/components/`, bis ein zweites Feature sie braucht. Dasselbe gilt
für `PersonCard` — die ist fachlich an das Team-Feature gebunden.

**Grenzfall `AttributeList`:** liegt in `shared/`, obwohl sie derzeit nur im
Team-Feature benutzt wird — in `PersonCard` („Responsibilities") und `LocationCard`
(„Contains"). Hier war das Kriterium nicht „zwei Features", sondern „zwei
unabhängige Datentypen mit derselben Darstellung". Das ist eine bewusste Ausnahme,
die ich beim nächsten Durchsehen hinterfragen würde.

## Nach Feature statt nach Typ

Die Alternative wäre die Gliederung **nach Typ**: alle Komponenten in
`components/`, alle Hooks in `hooks/`, alle Views in `views/` — genau so lag der
Code nach Übung 3.

Warum der Wechsel für diese App:

- **Was zusammen geändert wird, liegt zusammen.** Eine Änderung an der Timeline
  berührt `TimelineView`, `TimelineEntry` und `TimelineFilterBar`. Nach Typ
  sortiert lägen die in drei verschiedenen Ordnern.
- **Der Umfang jeder Änderung ist sichtbar.** Wer `features/team/` anfasst, weiß,
  dass nichts außerhalb betroffen ist — es sei denn, er fasst `shared/` an, und
  dann ist das ein bewusster Schritt.
- **Die Migration wird abbildbar.** Übung 5 fügt `features/evidence/` und
  `features/workspace/` hinzu. Der Rest bleibt unberührt.

Nach Typ zu gliedern ist bei sehr kleinen Projekten einfacher, weil man nicht über
Zugehörigkeit nachdenken muss. Bei fünf Views mit je mehreren Komponenten kippt das.

## Presentational gegen Feature

| Komponente           | Art            | Begründung                                               |
| -------------------- | -------------- | -------------------------------------------------------- |
| `Badge`              | presentational | Props rein, JSX raus                                     |
| `Card`               | presentational | kennt ihren Inhalt nicht, nimmt `children`               |
| `EmptyState`         | presentational | ein String, ein Absatz                                   |
| `AttributeList`      | presentational | Titel + Liste, keine Herkunft                            |
| `StatCard`           | presentational | Zahl + Label                                             |
| `CaseSummaryCard`    | presentational | bekommt `caseData` fertig                                |
| `ReviewProgress`     | presentational | rechnet nur aus zwei Props eine Prozentzahl              |
| `RecentEvidenceList` | presentational | bekommt die fertige Liste                                |
| `RecentTimelineList` | presentational | bekommt die fertige Liste                                |
| `PersonCard`         | presentational | **nach der Aufteilung**: nimmt `anzahlBelege` als Zahl   |
| `LocationCard`       | presentational | Props rein, JSX raus                                     |
| `TeamTabs`           | presentational | zwei Links, keine Daten                                  |
| `TimelineEntry`      | presentational | bekommt `ortsnamen` fertig aufgelöst                     |
| `TimelineFilterBar`  | presentational | Listen rein, Markup raus                                 |
| `MainNav`            | presentational | feste Liste, kein Datenzugriff                           |
| `AppHeader`          | presentational | reine Hülle                                              |
| `EvidenceToolbar`    | presentational | sieben kontrollierte Felder, Werte rein, Ereignisse raus |
| `EvidenceList`       | presentational | **nach Demo 8**: bekommt nur noch die fertige Liste      |
| `BookmarkList`       | presentational | filtert nicht selbst, bekommt die Belege fertig          |
| `NotesList`          | presentational | bekommt fertige Anzeigeeinträge                          |
| `ControlledDemo`     | presentational | Wegwerf-Ansicht, eigener lokaler Zustand                 |
| `EvidenceCard`       | **feature**    | holt Lesezeichen per `useBookmarks()` aus dem Context    |
| `EvidenceDetail`     | **feature**    | hält den Notiz-Entwurf lokal, meldet das Speichern hoch  |
| `HypothesisForm`     | **feature**    | hält den ganzen Entwurf, liest und schreibt localStorage |
| `EvidenceView`       | **feature**    | `useReducer` für Filter, liest `:evidenceId`, leitet ab  |
| `WorkspaceView`      | **feature**    | leitet Lesezeichen- und Notizlisten ab                   |
| `PeopleList`         | **feature**    | berechnet die Beleganzahl pro Person                     |
| `LocationsList`      | **feature**    | wählt zwischen Liste und Leerzustand                     |
| `TeamView`           | **feature**    | liest `:tab`, validiert, leitet um                       |
| `PersonDetailView`   | **feature**    | liest `:personId`, sucht, behandelt „nicht gefunden"     |
| `TimelineView`       | **feature**    | liest vier Query-Parameter, filtert, sortiert            |
| `DashboardView`      | **feature**    | leitet alle fünf Kennzahlen ab, nichts gespeichert       |
| `NotFoundView`       | **feature**    | liest `useLocation`                                      |
| `App`                | **feature**    | lädt Daten, besitzt Notizen und Prüfstand, Routen        |
| `BookmarkProvider`   | **feature**    | besitzt den Lesezeichen-Zustand, keine Darstellung       |

**Die Regel dahinter:** Sobald eine Komponente _etwas erfährt, das nicht in ihren
Props steht_ — ein Routenparameter, ein Query-Parameter, `localStorage`, ein
Netzwerkaufruf — ist sie eine Feature-Komponente. Alles andere ist presentational.

Das ist schärfer als „rechnet sie etwas aus?". `ReviewProgress` rechnet eine
Prozentzahl aus und bleibt trotzdem presentational, weil beide Eingaben aus Props
kommen. Dieselbe Komponente liefert bei denselben Props immer dasselbe Ergebnis.

## Die Aufteilung aus Demo 5

`PersonCard` machte ursprünglich zwei Jobs: Sie nahm den **kompletten Datensatz**
entgegen, zählte selbst die zugehörigen Beweisstücke und stellte die Karte dar.

Aufgeteilt in:

- **`PeopleList`** — weiß, _wie_ gezählt wird (über `evidenceMentionsPerson`, das
  sowohl ID als auch Anzeigename prüft, weil `evidence.json` an einer Stelle
  „Nova Byte" statt „nova-byte" enthält).
- **`PersonCard`** — bekommt `anzahlBelege: number` und stellt dar.

**Was der Schnitt bringt:** Ändert sich die Zählregel — zählen Timeline-Erwähnungen
mit? gelten Aliasse? — ändert sich nur `PeopleList`. `PersonCard` bleibt
unberührt, weil sie von der Regel nie etwas wusste. Umgekehrt ändert ein Umbau des
Karten-Markups nichts an der Zählung.

Vorher war beides in einer Datei, und die Karte brauchte den gesamten Datensatz,
obwohl sie für die Darstellung eine einzige Zahl benötigte.

## Routen

| Pfad                     | Komponente                                                  |
| ------------------------ | ----------------------------------------------------------- |
| `/`                      | Weiterleitung auf `/dashboard`                              |
| `/dashboard`             | `DashboardView`                                             |
| `/evidence`              | `EvidenceView`                                              |
| `/evidence/:evidenceId`  | `EvidenceView` mit offener Detailansicht                    |
| `/team`                  | Weiterleitung auf `/team/people`                            |
| `/team/:tab`             | `TeamView` (`people` oder `locations`, sonst Weiterleitung) |
| `/team/people/:personId` | `PersonDetailView`                                          |
| `/timeline`              | `TimelineView`, liest `?order=&person=&ort=&typ=`           |
| `/workspace`             | `WorkspaceView`                                             |
| `/sandbox/keys`          | `KeyDemo`, liest `?order=`                                  |
| `/sandbox/controlled`    | `ControlledDemo`                                            |
| alles andere             | `NotFoundView`                                              |

**`HashRouter` statt `BrowserRouter`** — bewusste Entscheidung. GitHub Pages ist ein
reiner Dateiserver und kann Pfade nicht auf `index.html` umschreiben. Mit einem
`BrowserRouter` wäre der direkte Aufruf von `/team/people` ein 404, und genau die
geforderte Eigenschaft „bookmarkable" wäre verfehlt. Hinter dem `#` wird der Pfad nie
an den Server geschickt, also funktioniert jeder Link auch beim Direktaufruf.

## Wo der Zustand wohnt

Seit Übung 5 steht in diesem Projekt an fünf Stellen Zustand. Jede Zeile hat
eine Begründung, und die Begründungen unterscheiden sich — das ist kein
Versehen.

| Was                         | Wo                 | Mechanismus             | warum dort                                                                  |
| --------------------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------- |
| Lesezeichen                 | `BookmarkProvider` | `useState` + Context    | vier Verbrauchsstellen in drei Feature-Ordnern                              |
| Notizen                     | `App`              | `useState` + Props      | eine schreibende, eine lesende Stelle — Context wäre Aufwand ohne Gegenwert |
| Prüfstand (Status/Relevanz) | `App`              | `useState` + Props      | geändert im Detail, gelesen in Katalog und Dashboard                        |
| Katalogfilter (7 Werte)     | `EvidenceView`     | `useReducer`            | interessiert niemanden außerhalb der Ansicht; drei Arten von Änderung       |
| Timeline-Filter (4 Werte)   | die URL            | `useSearchParams`       | eine gefilterte Timeline will man verschicken                               |
| Notiz-Entwurf               | `EvidenceDetail`   | `useState`              | halb getippter Text interessiert niemanden sonst                            |
| Hypothesen-Entwurf          | `HypothesisForm`   | `useState` (ein Objekt) | ein Dokument, als Ganzes geladen und gespeichert                            |

**Was bewusst KEIN Zustand ist:** die geladenen Falldaten. Sie kommen aus
`useCaseData()` und werden nie in ein `useState` kopiert. Die
Benutzeranmerkungen liegen deshalb _neben_ den Daten, nicht in ihnen;
`App.tsx` führt beides beim Rendern zusammen. Sonst gäbe es zwei Belegelisten —
die geladene und die kopierte — und damit genau die doppelte Wahrheit, die die
Vanilla-Version mit `applyStoredBookmarkFlags()` von Hand synchron halten musste.

**Ebenfalls kein Zustand:** jeder abgeleitete Wert. Die gefilterte Liste, die
Kennzahlen des Dashboards, die Lesezeichenliste des Workspace, die Notizliste,
der Inhalt des Typ-Dropdowns. Alle werden bei jedem Render neu berechnet. Die
Begründung steht in CHANGES-5.md, Demo 4.

## Imperatives DOM: zwei Stellen, zwei verschiedene Dinge

```bash
grep -rn "document\." react/        # zwei Zeilen
grep -rn "addEventListener" react/   # keine Treffer
```

| Zugriff                           | Datei                              | warum er dort richtig ist                                                                   |
| --------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `document.getElementById("root")` | `main.tsx`                         | Der Einhängepunkt für `createRoot`. React muss irgendwo anfangen. **Innerhalb** der Wurzel. |
| `document.title`                  | `shared/hooks/useDokumentTitel.ts` | Der Tab-Titel gehört React nicht. **Außerhalb** der Wurzel, deshalb in einem Effekt.        |

Reacts Zuständigkeit endet an seinem Wurzelknoten: Alles darin baut und
aktualisiert React. Ein Direktzugriff _dort_ wäre ein Fehler. Der Tab-Titel,
der `localStorage` und ein `window`-Listener liegen außerhalb — sie sind
externe Systeme, und ein Effekt ist die vorgesehene Art, mit ihnen zu reden.

Kein `addEventListener`, kein `innerHTML`, kein `classList` im React-Baum.

## Woher die Daten kommen (seit Übung 6)

Vier Schichten, jede mit einer Zuständigkeit. Von unten nach oben:

```
public/data/*.json
      │   gelesen von
      ▼
server/index.js                    Express, nur in der Entwicklung
      │   GET /api/evidence
      ▼
react/api/basis.ts                 Welche Quelle gilt? Eine Entscheidung.
react/api/fallApi.ts               Welche URLs, welche Antwortformen?
      │   ladeEvidence(signal)  ->  Promise<Evidence[]>
      ▼
react/shared/hooks/useFetch.ts     Ladezustand, Fehlerzustand, Abbruch
react/shared/hooks/useCaseData.ts  fünf Anfragen -> ein Zustand
      │   { evidence, laedt, fehler, ... }
      ▼
react/App.tsx                      verteilt per Props und Context
      │
      ▼
die Komponenten                    nur Darstellung, kein fetch
```

**Nachweisbar:** `grep -rn "fetch(" react/` liefert genau eine Zeile, und die
steht in `react/api/fallApi.ts`.

### Welche Quelle gilt

| Modus                         | Quelle                      |
| ----------------------------- | --------------------------- |
| `npm run dev`                 | `http://localhost:3001/api` |
| `npm run dev:static`          | `data/*.json`               |
| `npm run build`, GitHub Pages | `data/*.json`               |

Der Produktionsbuild fällt auf die statischen Dateien zurück, weil das Backend
laut Aufgabenstellung nicht deployt wird. Ohne diesen Rückfall wäre die
veröffentlichte Seite tot. Entschieden wird das an einer Stelle, in
`react/api/basis.ts`, und der `localhost`-String landet nicht im
Produktionsbundle — `import.meta.env.DEV` ist zur Bauzeit bekannt, der Zweig
wird wegoptimiert:

```bash
npm run build && grep -c "localhost:3001" dist/assets/react-*.js   # 0
```

### Wenn sich das Backend ändert

| Änderung                                               | betroffene Dateien                                |
| ------------------------------------------------------ | ------------------------------------------------- |
| Ein Pfad heißt anders (`/api/evidence` → `/api/items`) | `fallApi.ts`                                      |
| Ein Feld heißt anders in der Antwort                   | `js/types.ts` (Normalisierung) und `fallApi.ts`   |
| Anderer Port oder Host                                 | `basis.ts` — oder gar keine, über `VITE_API_BASE` |
| Authentifizierung kommt dazu                           | `fallApi.ts`                                      |

**Keine Komponente.** Das ist der Zweck der Trennung.
