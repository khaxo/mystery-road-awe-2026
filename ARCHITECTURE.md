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
│   └── timeline/
│       ├── TimelineView.tsx      liest ?person=
│       └── components/           TimelineFilterBar, TimelineEntry
│
├── shared/                       Von mindestens zwei Features benutzt
│   ├── components/               Badge, Card, EmptyState, AttributeList
│   └── hooks/                    useCaseData
│
└── sandbox/                      Wegwerf-Beispiele, nicht Teil der App
    ├── HalloFall.tsx             JSX-Übung aus Übung 3
    └── KeyDemo.tsx               key={index} gegen key={id}
```

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

| Komponente           | Art            | Begründung                                             |
| -------------------- | -------------- | ------------------------------------------------------ |
| `Badge`              | presentational | Props rein, JSX raus                                   |
| `Card`               | presentational | kennt ihren Inhalt nicht, nimmt `children`             |
| `EmptyState`         | presentational | ein String, ein Absatz                                 |
| `AttributeList`      | presentational | Titel + Liste, keine Herkunft                          |
| `StatCard`           | presentational | Zahl + Label                                           |
| `CaseSummaryCard`    | presentational | bekommt `caseData` fertig                              |
| `ReviewProgress`     | presentational | rechnet nur aus zwei Props eine Prozentzahl            |
| `RecentEvidenceList` | presentational | bekommt die fertige Liste                              |
| `RecentTimelineList` | presentational | bekommt die fertige Liste                              |
| `PersonCard`         | presentational | **nach der Aufteilung**: nimmt `anzahlBelege` als Zahl |
| `LocationCard`       | presentational | Props rein, JSX raus                                   |
| `TeamTabs`           | presentational | zwei Links, keine Daten                                |
| `TimelineEntry`      | presentational | bekommt `ortsnamen` fertig aufgelöst                   |
| `TimelineFilterBar`  | presentational | Listen rein, Markup raus                               |
| `MainNav`            | presentational | feste Liste, kein Datenzugriff                         |
| `AppHeader`          | presentational | reine Hülle                                            |
| `PeopleList`         | **feature**    | berechnet die Beleganzahl pro Person                   |
| `LocationsList`      | **feature**    | wählt zwischen Liste und Leerzustand                   |
| `TeamView`           | **feature**    | liest `:tab`, validiert, leitet um                     |
| `PersonDetailView`   | **feature**    | liest `:personId`, sucht, behandelt „nicht gefunden"   |
| `TimelineView`       | **feature**    | liest `?person=`, filtert, sortiert                    |
| `DashboardView`      | **feature**    | liest `localStorage`, leitet Werte ab                  |
| `NotFoundView`       | **feature**    | liest `useLocation`                                    |
| `App`                | **feature**    | lädt Daten, definiert Routen                           |

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
| `/team`                  | Weiterleitung auf `/team/people`                            |
| `/team/:tab`             | `TeamView` (`people` oder `locations`, sonst Weiterleitung) |
| `/team/people/:personId` | `PersonDetailView`                                          |
| `/timeline`              | `TimelineView`, liest `?person=`                            |
| `/sandbox/keys`          | `KeyDemo`, liest `?order=`                                  |
| alles andere             | `NotFoundView`                                              |

**`HashRouter` statt `BrowserRouter`** — bewusste Entscheidung. GitHub Pages ist ein
reiner Dateiserver und kann Pfade nicht auf `index.html` umschreiben. Mit einem
`BrowserRouter` wäre der direkte Aufruf von `/team/people` ein 404, und genau die
geforderte Eigenschaft „bookmarkable" wäre verfehlt. Hinter dem `#` wird der Pfad nie
an den Server geschickt, also funktioniert jeder Link auch beim Direktaufruf.
