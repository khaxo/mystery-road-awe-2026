# Demo 4 — SPA vs. MPA: Zustand & Routing

## Wie Navigation in dieser App heute funktioniert

```
Benutzer klickt "Evidence"
        |
        v
  onClick  ->  window.location.hash = "evidence"
        |
        v
  Browser feuert das Event "hashchange"
        |
        v
  handleHashChange()
        |-- liest den Hash, prüft ihn gegen die Liste gültiger Views
        |-- state.currentPage = "evidence"
        |-- entfernt die Klasse "active" von ALLEN .view-Sektionen
        |-- setzt "active" auf #view-evidence
        |-- entfernt "active" von allen Nav-Buttons, setzt sie auf den passenden
        |-- ruft renderEvidenceList() auf  -- ABER nur beim ersten Mal,
        |                                     wegen state.viewRendered.evidence
        v
  Die Sektion ist sichtbar
```

**Was dabei NICHT passiert — und in einer klassischen Multi-Page-App passieren würde:**

- Keine HTTP-Anfrage. Der Server erfährt vom Seitenwechsel nichts.
- Kein neues Dokument, kein neuer JavaScript-Kontext.
- Keine globalen Variablen werden zurückgesetzt. `allEvidence` bleibt geladen.
- Kein Neuaufbau des DOM. Das Markup aller fünf Views stand von Anfang an in
  `index.html`; es wird nur per CSS ein- und ausgeblendet.
- Kein weißer Blitz, keine zurückgesetzte Scrollposition.
- Kein erneutes Laden von `styles.css`, Bildern oder JSON-Daten.

## Zustands-Inventar: was einen Reload überlebt

### Überlebt — liegt im `localStorage`

| Schlüssel             | Inhalt                           |
| --------------------- | -------------------------------- |
| `remotion_bookmarks`  | Liste der gemerkten Evidence-IDs |
| `remotion_notes`      | Notizen, ID → Text               |
| `remotion_hypothesis` | Der Hypothesen-Entwurf           |

### Überlebt — steht in der URL

- **Die aktuelle View.** `state.currentPage` ist zwar nur im Speicher, wird aber beim
  Laden aus `location.hash` wiederhergestellt. Das ist der Grund, warum man einen
  Link auf `#timeline` verschicken kann.

### Geht verloren — nur im Speicher

| Was                                                                                                | Folge beim Reload                                    |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `allEvidence`, `allPeople`, `allLocations`, `allTimeline`, `caseData`                              | Alle fünf JSON-Dateien werden erneut geladen         |
| `filteredEvidence`, `evidenceSortOrder`                                                            | Sortierung fällt auf „Newest first" zurück           |
| `selectedEvidence`                                                                                 | Eine offene Detailansicht ist zu                     |
| `currentPeopleTab`                                                                                 | Zurück auf „People", auch wenn „Locations" offen war |
| `viewRendered`                                                                                     | Alle Render-Flags zurück auf `false`                 |
| `evidenceViewLoading`, `loadingStepsRemaining`, `latestSearchRequestId`, `modalCloseListenerCount` | interne Flags, zurück auf Ausgangswert               |

### Geht verloren — steckt nur im DOM

Das wird leicht übersehen, ist aber für den Benutzer am spürbarsten:

- Der eingetippte Suchbegriff
- Alle fünf Filter-Dropdowns
- Die Scrollposition
- Ein geöffnetes Quickview-Modal
- Ungespeicherter Text in einem Notizfeld

## Fragen

### Wo lebt „die Daten der aktuellen Seite" — MPA vs. SPA?

**In einer klassischen MPA auf dem Server.** Zwischen zwei Anfragen hält der Browser
praktisch nichts; er hat ein Cookie mit einer Session-ID. Alles Übrige — welcher
Benutzer, welcher Filter, welcher Schritt im Formular — liegt in der Session auf dem
Server oder wird bei jeder Anfrage über URL-Parameter und Formularfelder erneut
mitgeschickt.

**In dieser SPA liegen die Daten im Speicher des Browsers**, konkret im exportierten
`state`-Objekt bzw. in React-State.

**Die guten Folgen:**

- Ansichtswechsel sind sofort — es muss nichts geholt werden.
- Die 18 Beweisstücke werden **einmal** geladen und von allen fünf Views benutzt. In
  einer MPA holte jede Seite sie erneut.
- Zwischenzustände wie ein halb ausgefüllter Hypothesen-Entwurf überstehen einen
  Ansichtswechsel mühelos.
- Der Server ist zustandslos — hier sogar ein reiner statischer Dateiserver, was das
  Deployment auf GitHub Pages überhaupt erst ermöglicht.

**Die schlechten Folgen:**

- **Ein Reload löscht alles**, was nicht ausdrücklich persistiert wurde. Die Tabelle
  oben zeigt, wie viel das ist.
- **Es gibt keine einzelne Quelle der Wahrheit mehr.** Derselbe Wert kann an zwei
  Stellen angezeigt werden und auseinanderlaufen — exakt der Dashboard-Bug dieser App.
- **Der Speicher wächst.** Bei 18 Einträgen irrelevant, bei 50.000 nicht.
- **Alles, was im Speicher liegt, ist für Suchmaschinen und für Benutzer ohne
  JavaScript unsichtbar.**

### Was leistet eine Router-Bibliothek, das `handleHashChange()` nicht leistet?

Mindestens sieben Dinge:

1. **Parameter in Pfaden.** `/evidence/E01` mit `E01` als ausgelesener Wert. Hier müsste
   man den Hash von Hand zerlegen.
2. **Verschachtelte Routen.** Eine Detailansicht _innerhalb_ der Evidence-View, mit
   eigener URL — ohne dass die äußere View neu aufgebaut wird.
3. **History API statt Hash.** Echte Pfade, kein `#`. Setzt allerdings einen Server
   voraus, der jeden Pfad auf `index.html` abbildet — auf GitHub Pages nicht möglich.
4. **Nachladen pro Route.** Code und Daten einer View erst holen, wenn sie gebraucht
   werden. Das Dashboard-Bundle müsste die Timeline-Logik nicht enthalten.
5. **Blockierte Navigation.** „Sie haben ungespeicherte Änderungen — wirklich verlassen?"
6. **Datenvorbereitung vor dem Rendern**, damit die View nicht erst leer erscheint.
7. **Verwaltung von Scrollposition und Fokus**, inklusive korrekter Ankündigung für
   Screenreader beim Ansichtswechsel.

Punkt 7 ist der, an den man zuletzt denkt und der am meisten über die Qualität einer
Anwendung aussagt.

### Was passiert beim Klick auf den Zurück-Button?

**Er funktioniert** — in beiden Versionen, und das ist kein Zufall.

Jede Änderung von `location.hash` erzeugt einen Eintrag in der Browser-Historie.
„Zurück" setzt den Hash auf den vorigen Wert, der Browser feuert `hashchange`, und der
Handler schaltet die View um.

Nachgemessen in der React-Version: von `#timeline` zurück → `#people`, Überschrift und
aktiver Nav-Button folgen.

**Was dabei _nicht_ wiederhergestellt wird**, und das ist der interessante Teil: nur die
View wechselt. Suchbegriff, Filter, Sortierung und Scrollposition bleiben so, wie sie
gerade sind. Für den Benutzer fühlt sich „zurück" deshalb unvollständig an — er landet
auf der vorigen Seite, aber nicht im vorigen _Zustand_. Ein ausgewachsener Router mit
Zustandswiederherstellung würde genau diese Lücke schließen.
