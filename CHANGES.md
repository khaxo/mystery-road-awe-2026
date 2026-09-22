# Changes — Exercise 1

Baseline: tag `original` (commit 22cb2d8), branch `exercise-1`.

## Demo 1 — Module split

<!-- Pro Modul eine Zeile: was rausgezogen, warum diese Grenze, was exportiert vs. privat -->

## Verdächtig (später prüfen — NICHT während Demo 1 fixen)

- **`.catch()`-Zweig von `loadEvidenceData` (app.js:95-98)** — im Fehlerfall wird zwar
  `console.error` geloggt und eine `alert()` gezeigt, aber `evidenceViewLoading` bleibt
  auf `true`. Schlägt das Laden fehl, dreht sich der Spinner ewig weiter. Gleiche
  Fehlerklasse wie Bug 1, nur auf dem Error-Pfad. Bewusst noch nicht mitgefixt
  (siehe Bug 1, Abschnitt "Bewusst nicht geaendert").
- Beim Reload werden im Server-Log mal nur `/` und `data/evidence.json` angefragt, mal
  alle fünf JSON-Dateien. Vermutlich Browser-Cache — im Network-Tab mit "Disable cache"
  gegenprüfen (Demo 7).

## Bugs

### Bug 1 — Evidence-Katalog bleibt dauerhaft im Ladezustand

**Demo-Zuordnung:** Demo 3 (asynchroner / Promise-Handling-Bug)
**Status:** gefixt

**Reproduktion**
1. `http://localhost:8080` laden
2. Zur View "Evidence" navigieren

Tritt unabhängig vom Navigationsweg auf: sowohl über Dashboard -> Klick auf "Evidence"
als auch bei direktem Aufruf von `http://localhost:8080/#evidence`.

**Erwartet**
Der Ladezustand verschwindet und die 18 Evidence-Einträge werden als Karten gerendert.

**Tatsächlich**
Der Ladezustand bleibt dauerhaft stehen. Es wird nie eine Liste gerendert, auch nicht
nach längerem Warten. Keine leere Liste, sondern ein hängender Loading-State.

**Beobachteter State (Browser-Console, während der Bug sichtbar ist)**

| Ausdruck | Wert | Bedeutung |
|---|---|---|
| `allEvidence.length` | 18 | Daten sind vollstaendig geladen |
| `filteredEvidence.length` | 18 | Filterung verliert nichts |
| `evidenceViewLoading` | `true` | App haelt sich weiterhin fuer "am Laden" |
| `loadingStepsRemaining` | 0 | globaler Ladevorgang gilt als abgeschlossen |

Damit waren Laden und Filtern als Ursache ausgeschlossen — die Daten sind da, nur
gerendert wird nicht.

**Root Cause**

`grep -n "evidenceViewLoading" app.js` lieferte im Originalstand **genau zwei** Treffer:

    19:  var evidenceViewLoading = true;    // Deklaration
    374:   if (evidenceViewLoading) {        // einzige Lesestelle

Es gab **keine einzige Zuweisung auf `false`** im gesamten File. Die Variable stand ab
dem Auswerten von `app.js` permanent auf `true`.

`renderEvidenceList()` steigt an dieser Lesestelle sofort wieder aus:

    if (evidenceViewLoading) {
      loadingIndicator.classList.remove("hidden");
      container.innerHTML = "";
      return;                              // <- immer hier Schluss
    }

Die Funktion wurde also durchaus aufgerufen (u.a. aus dem `.then()` von
`loadEvidenceData`), lief an, sah `true`, zeigte den Spinner, leerte den Container und
kehrte zurück — jedes Mal. Die 18 Einträge erreichten die Render-Schleife nie.

In Promise-Begriffen: `loadEvidenceData()` fetcht `data/evidence.json`, die Kette
resolved einwandfrei, und der `.then()`-Block setzte auch korrekt `allEvidence`,
`filteredEvidence` und die Bookmark-Flags — **er vergaß nur die eine Zustandsänderung,
die das Rendern überhaupt erst freischaltet**. Der Fehler sitzt damit im Lifecycle-Punkt
*on success*, nicht beim Start, nicht während pending und nicht im Fehlerfall.

**Fix**

Eine Zeile in `loadEvidenceData` (app.js:91), im `.then()`-Block:

    .then(function (data) {
      allEvidence = data;
      applyStoredBookmarkFlags();
      filteredEvidence = allEvidence;
      renderDashboard();
      populateAllDropdowns();
      evidenceViewLoading = false;              // <- neu
      if (currentPage === "evidence") renderEvidenceList();
    })

Die Position ist nicht beliebig: Die Zuweisung muss **vor** dem Aufruf von
`renderEvidenceList()` stehen. Stünde sie danach, würde der Aufruf noch mit `true`
laufen, erneut am Guard abprallen und der Ladezustand bliebe beim ersten Rendern
weiterhin stehen — der Bug wäre nur auf spätere Renders verschoben.

**Bewusst nicht geändert**

Der `.catch()`-Zweig setzt das Flag weiterhin nicht zurück. Begründung: der gemeldete
Defekt betrifft den Erfolgspfad, und ein minimaler, chirurgischer Fix ist leichter zu
verifizieren. Der Error-Pfad hat dasselbe Problem, ist aber ein eigener Fall und steht
oben unter "Verdächtig". Ein blosses `evidenceViewLoading = false` im `.catch()` waere
ausserdem irrefuehrend: `renderEvidenceList()` wuerde dann "No evidence matches the
current filters." anzeigen, obwohl in Wahrheit das Laden fehlgeschlagen ist. Sauber
waere ein eigener Fehlerzustand in der View.

**Verifikation**

- `grep -n "evidenceViewLoading" app.js` zeigt jetzt drei statt zwei Treffer
  (19 Deklaration, 91 Zuweisung, 375 Lesestelle).
- Ausgeliefertes File gegengeprueft: `curl -s localhost:8080/app.js | grep evidenceViewLoading`
  enthaelt die neue Zeile 91.
- OFFEN: im Browser neu laden, Evidence oeffnen, 18 Karten sichtbar? `evidenceViewLoading`
  in der Console steht auf `false`? Zusaetzlich mit "Slow 3G" im Network-Tab testen,
  damit der Fix nicht nur wegen schneller lokaler Ladezeiten funktioniert.
- Fehlerfall testbar, indem man in `loadEvidenceData` den Pfad kurzzeitig auf
  `data/evidence-kaputt.json` aendert (zeigt das oben beschriebene Verhalten des
  nicht geaenderten `.catch()`-Zweigs).
