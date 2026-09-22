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
- [GEKLAERT: war Browser-Cache, siehe Bug 1 Verifikation] Beim Reload werden im Server-Log mal nur `/` und `data/evidence.json` angefragt, mal
  alle fünf JSON-Dateien. Vermutlich Browser-Cache — im Network-Tab mit "Disable cache"
  gegenprüfen (Demo 7).

### Code-Smell-Kandidaten (Demo 8)

- **Verwaistes `resources/`-Verzeichnis.** Enthaelt dieselben sechs Personen-Bilder wie
  `assets/people/`, nur mit Unterstrich statt Bindestrich im Dateinamen
  (`kernel_colt.png` vs. `kernel-colt.png`). Im Code referenziert wird ausschliesslich
  `assets/people/` — nachgeprueft mit
  `grep -rn "resources/" app.js index.html styles.css` -> kein Treffer.
  Die Dateien in `resources/` sind toter Ballast: sie suggerieren beim Lesen eine
  Abhaengigkeit, die es nicht gibt, und beim Aendern eines Bildes ist nicht klar,
  welche Kopie gilt. Fix: `resources/` loeschen.

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
- Im Browser nach erzwungenem Cache-Refresh gegengeprueft:

  | Pruefung | vorher | nachher |
  |---|---|---|
  | `evidenceViewLoading` | `true` | `false` |
  | gerenderte Karten in `#evidenceList` | 0 | 18 |
  | Loading-Indicator hat Klasse `hidden` | nein | ja |
  | `allEvidence.length` | 18 | 18 (unveraendert) |

- **Stolperfalle beim Verifizieren:** Der erste Verifikationsversuch schlug fehl und sah
  aus, als haette der Fix nicht gewirkt — `evidenceViewLoading` stand weiter auf `true`,
  0 Karten. Ursache war der HTTP-Cache des Browsers: der Server lieferte bereits die
  korrigierte Datei (`fetch('app.js', {cache:'no-store'})` -> 200, Fix enthalten),
  waehrend die Seite noch die alte, gecachte Version ausfuehrte
  (`loadEvidenceData.toString()` enthielt die neue Zeile nicht). Erst ein
  `fetch('app.js', {cache:'reload'})` plus Neuladen hat den neuen Code aktiviert.
  Lehre: beim Debuggen im Network-Tab dauerhaft "Disable cache" aktivieren, sonst
  debuggt man Code, der gar nicht mehr laeuft.
- Der Vergleich `loadEvidenceData.toString()` gegen den Datei-Inhalt ist ein
  brauchbarer Schnelltest dafuer, ob der Browser ueberhaupt den aktuellen Code ausfuehrt.
- Fehlerfall testbar, indem man in `loadEvidenceData` den Pfad kurzzeitig auf
  `data/evidence-kaputt.json` aendert (zeigt das oben beschriebene Verhalten des
  nicht geaenderten `.catch()`-Zweigs).
- OFFEN: zusaetzlich mit "Slow 3G" im Network-Tab testen, damit belegt ist, dass der Fix
  nicht nur wegen schneller lokaler Ladezeiten funktioniert.

---

### Bug 2 — Jeder Klick auf einen Nav-Button wirft einen TypeError

**Demo-Zuordnung:** Demo 4 (stiller Bug) + Demo 8 (var/let-Scoping)
**Status:** gefixt

**Reproduktion**
1. `http://localhost:8080` mit offener Console laden
2. Auf einen beliebigen Nav-Button klicken (Dashboard / Evidence / People / ...)

**Erwartet** `nav clicked: <view>` in der Console, sonst nichts.

**Tatsächlich**

    TypeError: undefined is not an object (evaluating 'navButtons[i].getAttribute')
      (anonymous function) (app.js:1041)

Bei jedem Klick erneut. **In der UI ist nichts zu sehen** — die Navigation funktioniert
trotzdem, weil sie gar nicht an diesem Listener haengt, sondern an den
`onclick="navigateTo('...')"`-Attributen in `index.html`. Der Listener macht nur das
Logging, und genau das schlaegt fehl.

**Root Cause**

    var navButtons = document.querySelectorAll(".nav-btn");
    for (var i = 0; i < navButtons.length; i++) {
      navButtons[i].addEventListener("click", function () {
        var targetView = navButtons[i].getAttribute("data-view");   // <- wirft

`var i` ist funktions-, nicht blockgescoped: es existiert nur **ein einziges** `i` fuer
die gesamte Schleife, und alle fuenf Closures schliessen ueber dieselbe Bindung. Wenn
ein Klick eintrifft, ist die Schleife laengst durchgelaufen und `i` steht auf
`navButtons.length` (= 5), also einen Index **hinter** dem letzten Element.
`navButtons[5]` ist `undefined`, und `undefined.getAttribute(...)` wirft.

Entscheidend ist der Zeitpunkt: die Closure liest `i` nicht beim Registrieren, sondern
beim Ausfuehren — also lange nach Schleifenende.

**Fix**

`var i` -> `let i` in der Schleifenkopfzeile (app.js:1039). `let` erzeugt pro Iteration
eine eigene Bindung, die die jeweilige Closure festhaelt.

**Alternative, die bewusst nicht gewaehlt wurde:** statt `navButtons[i]` im Handler
`e.currentTarget` benutzen. Das waere unabhaengig vom Scoping robust, aendert aber mehr
Code und verdeckt genau den Lerneffekt, um den es in Demo 8 geht.

**Verifikation**
Alle fuenf Nav-Buttons programmatisch geklickt: fuenf saubere
`nav clicked: dashboard|evidence|people|timeline|workspace`-Zeilen, **null TypeErrors**.
Vorher: ein TypeError pro Klick.

---

### Bug 3 — `First note preview:` loggt ein Promise statt des Notiztextes

**Demo-Zuordnung:** Demo 4 (stiller Bug)
**Status:** gefixt

**Reproduktion**
1. `http://localhost:8080` mit offener Console laden
2. Auf die Ausgabe `First note preview:` warten (feuert einmal beim Start)

**Erwartet** Der Notiztext zu Evidence `E01` (bei leerem Storage: ein leerer String).

**Tatsächlich**

    First note preview: {[[PromiseState]]: "fulfilled", [[PromiseResult]]: ""}

Ein Promise-Objekt. **Keinerlei sichtbare Auswirkung in der UI** — der Wert wird nirgends
angezeigt, nur geloggt. Genau deshalb ist das der Musterfall fuer Demo 4: an der
Oberflaeche ist nichts kaputt, der Code ist es trotzdem.

**Root Cause**

    var firstNote = loadNoteAsync("E01");          // Promise, nicht der Wert
    console.log("First note preview:", firstNote);

`loadNoteAsync` gibt ein `new Promise(...)` zurueck. Der Rueckgabewert wird ohne `.then()`
und ohne `await` direkt weiterverwendet, also landet das Promise-Objekt selbst im Log.
Das Promise resolved sogar korrekt (`status: "fulfilled"`) — es wird nur nie ausgepackt.

Kategorie: **ein Promise wird behandelt, als waere es bereits aufgeloeste Daten.** Dieselbe
Fehlerklasse, auf die Demo 9 in der letzten Frage abzielt (ein `await` entfernen und
beobachten, was passiert).

**Fix**

    loadNoteAsync("E01").then(function (firstNote) {
      console.log("First note preview:", firstNote);
    });

Der Wert wird erst geloggt, wenn das Promise aufgeloest ist. (In Demo 9 wird daraus die
`async`/`await`-Variante.)

**Verifikation**
Console zeigt jetzt `First note preview:` gefolgt vom leeren String statt des
Promise-Objekts. Im Console-Puffer stehen alte und neue Zeile direkt untereinander —
brauchbar als Vorher/Nachher fuer die Live-Demo.

---

### Bug 4 — Modal-Click-Listener werden bei jedem Öffnen neu registriert

**Demo-Zuordnung:** Demo 5 (weiterer Bug)
**Status:** gefixt

**Reproduktion**
1. Zur Timeline navigieren
2. Ein Evidence-Quickview-Modal oeffnen, schliessen, wieder oeffnen, wieder schliessen
3. Console beobachten

**Erwartet** Ein Listener, dauerhaft.

**Tatsächlich**

    modal opened, active close listeners: 1
    modal opened, active close listeners: 2
    modal opened, active close listeners: 3

Der Zaehler steigt bei jedem Oeffnen. Nach dem dritten Oeffnen laufen bei einem einzigen
Klick drei Handler. Beim "Open full evidence"-Pfad bedeutet das: `navigateTo("evidence")`
und `openEvidenceDetail(...)` feuern mehrfach hintereinander.

**Root Cause**

`openEvidenceModal` holt das Element `#quickViewModal` und erzeugt es nur beim ersten Mal
neu. Das `addEventListener("click", ...)` stand aber **ausserhalb** dieses
`if (!modal) { ... }`-Blocks und lief daher bei jedem Aufruf erneut. Da jedes Mal eine
**neue anonyme Funktion** uebergeben wird, sieht der Browser sie als eigenstaendigen
Listener und haengt sie zusaetzlich an — entfernt wird nie einer.
`modalCloseListenerCount` war die bereits eingebaute Instrumentierung genau dieses Lecks.

**Fix**

Listener-Registrierung (samt Zaehler und Log) in den `if (!modal)`-Block verschoben, also
an die Stelle, an der das Modal-Element einmalig erzeugt wird. Das `innerHTML`-Neubefuellen
bleibt bei jedem Oeffnen, der Listener wird nur einmal gebunden. Log-Text an die neue
Bedeutung angepasst: "modal close listener attached".

**Verifikation**
Modal dreimal hintereinander programmatisch geoeffnet, `modalCloseListenerCount` bleibt
bei **1** (vorher: 1, 2, 3).

---

### Bug 5 — Sortieren im Evidence-Katalog zerstört die Reihenfolge von `allEvidence`

**Demo-Zuordnung:** Demo 2 (Mutations-/Referenz-Bug)
**Status:** gefixt

**Reproduktion** (im Vorzustand von Bug 1, siehe Abschnitt "Wechselwirkung" unten)
1. Seite laden, auf dem Dashboard bleiben
2. Zur Evidence-View wechseln
3. Sortierung auf "Title A-Z" stellen
4. Zurueck zum Dashboard

**Erwartet** Das Dashboard zeigt unveraendert dieselben "Recent Evidence"-Eintraege.
Eine Sortierung in der Evidence-View ist eine reine Darstellungsfrage dieser View.

**Tatsächlich**

    allEvidence vorher:   E01,E02,E03,E04,...,E18
    allEvidence nachher:  E12,E03,E10,E16,E17,E06,E11,E07,E08,E04,E01,E13,...

    Dashboard "Recent Evidence" vorher:   E18,E17,E16,E15,E14
    Dashboard "Recent Evidence" nachher:  E18,E02,E09,E14,E15

Die Sortierung in einer View veraendert die Datenbasis der gesamten App. Das Dashboard
zeigt anschliessend falsche Eintraege, und die urspruengliche Reihenfolge aus der
JSON-Datei ist unwiederbringlich weg (auch "Clear filters" stellt sie nicht wieder her,
weil `getFilteredEvidence()` aus dem bereits umsortierten `allEvidence` neu aufbaut).

**Root Cause**

Zwei Zutaten, die einzeln harmlos sind:

1. In `loadEvidenceData` stand `filteredEvidence = allEvidence;` — das ist **keine Kopie**,
   sondern eine zweite Referenz auf **dasselbe** Array-Objekt. Belegt in der Console mit
   `allEvidence === filteredEvidence` -> `true`.
2. `handleSortChange` ruft `filteredEvidence.sort(...)`. `Array.prototype.sort` sortiert
   **in place**, veraendert also das Array selbst statt eine sortierte Kopie zu liefern.

Zusammen: das Sortieren der "gefilterten Ansicht" sortiert die Stammdaten mit, weil beide
Namen auf dasselbe Objekt zeigen.

Referenz vs. Kopie: `filteredEvidence = allEvidence` kopiert nur den *Verweis*, nicht die
Daten. Beide Variablen zeigen danach auf ein und dasselbe Objekt im Speicher — jede
Mutation ueber den einen Namen ist ueber den anderen sichtbar. Das unterscheidet sich
fundamental von Primitives (`let b = a` bei einer Zahl legt einen unabhaengigen Wert an).

Bemerkenswert: An anderer Stelle im selben File macht der Code es richtig —
`renderTimeline` (app.js:760) benutzt `events.slice().sort(...)`, sortiert also eine
Kopie. Das Muster war also bekannt, wurde hier nur nicht angewendet.

**Fix**

`filteredEvidence = allEvidence.slice();` — `slice()` ohne Argumente liefert eine flache
Kopie des Arrays. Die *Elemente* (Evidence-Objekte) bleiben dieselben Referenzen, was
gewollt ist: ein Bookmark-Flag soll ja in beiden Listen sichtbar sein. Nur die
Reihenfolge ist ab jetzt pro Array unabhaengig.

**Wechselwirkung mit Bug 1 (Antwort auf Demo 5, Frage 2)**

Dieser Bug liess sich nach dem Fix von Bug 1 **nicht mehr ueber die normale Oberflaeche
ausloesen** — der Bug-1-Fix hatte ihn zugedeckt:

- *Vor* dem Bug-1-Fix stieg `renderEvidenceList()` am `evidenceViewLoading`-Guard sofort
  wieder aus und erreichte `getFilteredEvidence()` nie. Damit blieb die Alias-Beziehung
  aus `loadEvidenceData` bestehen, und ein Sortieren traf `allEvidence` mit.
- *Nach* dem Bug-1-Fix laeuft `renderEvidenceList()` durch, ruft `getFilteredEvidence()`
  auf, und diese Funktion weist am Ende `filteredEvidence = results` zu — ein **neues**
  Array. Das Aliasing ist damit beim ersten Rendern der Evidence-View aufgeloest, bevor
  ueberhaupt sortiert werden kann.

Nachgewiesen durch Messung beider Zustaende: mit simuliertem Vorzustand
(`evidenceViewLoading = true` von Hand gesetzt) ueberlebt das Aliasing die Navigation
(`allEvidence === filteredEvidence` -> `true`) und die Sortierung zerstoert die
Reihenfolge; ohne Simulation ist es nach Schritt 2 bereits `false`.

Der Defekt war also nach dem Bug-1-Fix nicht behoben, sondern nur **unerreichbar** —
latent und bereit, bei jeder kuenftigen Aenderung an der Render-Reihenfolge
zurueckzukommen. Deshalb wurde die Ursache selbst gefixt und nicht auf die Maskierung
vertraut.

**Verifikation**
Nach dem Fix: `allEvidence === filteredEvidence` -> `false` direkt nach dem Laden.
Derselbe Angriff inklusive simuliertem Bug-1-Vorzustand laesst die Reihenfolge von
`allEvidence` unveraendert (E01..E18 vorher wie nachher).

---

### Bug 6 — Der Status-Filter rendert die Evidence-Liste doppelt

**Demo-Zuordnung:** Demo 5 (weiterer Bug) / Demo 8 (Code Smell)
**Status:** gefixt

**Reproduktion**
1. Evidence-View oeffnen
2. Den Status-Filter auf einen Wert stellen

**Erwartet** `renderEvidenceList()` laeuft einmal.

**Tatsächlich** `renderEvidenceList()` laeuft zweimal pro Aenderung — inklusive des
kompletten Neuaufbaus des `innerHTML` und eines zweiten Durchlaufs von
`getFilteredEvidence()` ueber alle 18 Eintraege.

**Root Cause**

In `setupEventListeners` war der Status-Filter als einziger der fuenf Filter **doppelt**
gebunden:

    document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);
    document.getElementById("filterStatus").setAttribute("onchange", "renderEvidenceList()");

Das sind zwei voneinander unabhaengige Mechanismen: ein DOM-Event-Listener und ein
Inline-Handler-Attribut. Sie deduplizieren sich **nicht** gegenseitig.

Empirisch nachgemessen an einem Wegwerf-`<select>` mit beiden Bindungen:
**2 Aufrufe pro `change`-Event.**

**Fix**
Die `setAttribute("onchange", ...)`-Zeile entfernt. Der Status-Filter ist jetzt genauso
gebunden wie die vier anderen Filter daneben.

---

### Aufräumarbeit (kein Bug) — Delegations-Listener aus der Render-Schleife gezogen

**Demo-Zuordnung:** Demo 8 (Code Smell)

`renderEvidenceList` endete mit

    container.addEventListener("click", handleEvidenceListClick);

lief also bei **jedem** Rendern erneut. Der naheliegende Verdacht war ein Listener-Leck
wie bei Bug 4.

**Das war es aber nicht.** Nachgemessen:

    dieselbe benannte Funktionsreferenz 3x registriert  ->  1 Aufruf pro Klick
    anonyme Funktion 3x registriert                     ->  3 Aufrufe pro Klick

Die DOM-Spec dedupliziert Listener, die in (Typ, Callback, Capture) identisch sind. Weil
hier jedes Mal dieselbe Referenz `handleEvidenceListClick` uebergeben wurde, entstand
**kein** Duplikat. Genau deshalb war Bug 4 einer und dieser hier nicht: dort wurde jedes
Mal eine frisch erzeugte anonyme Funktion uebergeben, also jedes Mal ein anderes Objekt.

Trotzdem geaendert, als Code Smell: Die Zeile las sich wie ein Leck, verliess sich auf ein
Detail der Event-Spec, und waere in dem Moment zu einem echten Bug geworden, in dem
jemand den Handler in eine Inline-Arrow-Funktion umschreibt — also spaetestens in Demo 10.
Die Registrierung steht jetzt einmalig in `setupEventListeners`; das Element
`#evidenceList` existiert statisch in `index.html:142`, ist zu diesem Zeitpunkt also da.

**Verifikation**
Nach drei aufeinanderfolgenden `renderEvidenceList()`-Aufrufen loest ein Klick auf eine
Karte `openEvidenceDetail` genau **einmal** aus.

---

## Demo 1 — Module split

`app.js` (1090 Zeilen, 57 Funktionen, 19 globale `var`s) wurde in **12 native
ES-Module** zerlegt. Kein Bundler, kein Build-Step — `index.html` laedt den
Einstiegspunkt direkt mit `<script type="module" src="js/main.js">`.

### Schnitt

| Modul | Zeilen | Inhalt |
|---|---|---|
| `js/state.js` | 47 | geteilter veraenderlicher Zustand + `STORAGE_KEY_*`-Konstanten |
| `js/utils.js` | 63 | Lookups (`findEvidenceById` …), `formatDate`, Badge-Klassen |
| `js/storage.js` | 41 | alle `localStorage`-Zugriffe |
| `js/data.js` | 92 | `fetch` der fuenf JSON-Dateien, Lade-Overlay |
| `js/dropdowns.js` | 9 | `populateAllDropdowns` — Klammer um die drei View-Dropdowns |
| `js/navigation.js` | 52 | `navigateTo`, `handleHashChange` |
| `js/views/dashboard.js` | 68 | Dashboard |
| `js/views/evidence.js` | 317 | Katalog, Filter, Sortierung, Detailansicht, Notizen |
| `js/views/people.js` | 87 | People- und Locations-Tabs |
| `js/views/timeline.js` | 128 | Timeline + Quickview-Modal |
| `js/views/workspace.js` | 134 | Bookmarks, Notizen, Hypothesen-Formular |
| `js/main.js` | 99 | Einstiegspunkt: Listener verdrahten, `initApp` |

**Begruendung des Schnitts:** primaer nach *Zustaendigkeit*, nicht nach Dateigroesse.
Die drei Querschnitts-Module (`state`, `utils`, `storage`) haben keine Abhaengigkeit zu
Views und sind dadurch isoliert testbar. Jede View bekam ein eigenes Modul, weil die
Views untereinander praktisch nichts teilen — sie beruehren sich nur ueber `state` und
`navigation`. `main.js` exportiert bewusst **nichts**: es ist Endpunkt des Graphen, nicht
Knoten.

### Privat vs. exportiert

Nicht alles wurde exportiert. Privat blieben u.a. `statCardHTML` (nur vom Dashboard
gebraucht), `renderEvidenceCardHTML`, `renderEvidenceDetail`, `statusOptionHTML`,
`simulateAsyncSearch`, `countEvidenceForPerson`, `renderBookmarksList`, `renderNotesList`
sowie die Lade-Helfer `showLoadingOverlay`, `hideLoadingStep`,
`loadCorePeopleAndLocations`, `loadEvidenceData`, `loadTimelineData` — von letzteren ist
nur `loadAllData` oeffentlich.

Nur `named exports`, kein `default export`. Begruendung: jedes Modul liefert mehrere
gleichrangige Funktionen; ein `default` haette in keinem Fall einen natuerlichen
"Hauptexport" markiert, und benannte Importe sind refactoring- und autocomplete-freundlich.
Der einzige sinnvolle Kandidat waere `state.js` gewesen — dort ist `state` aber bewusst
benannt, damit an jeder Importstelle sichtbar bleibt, dass es sich um den geteilten
Zustand handelt.

### Problem 1: Der geteilte Zustand

`allEvidence` und die 15 anderen globalen `var`s waren von ueberall les- **und
schreibbar**. Ein naives `export let allEvidence` loest das nicht: ein Import ist ein
*read-only binding*. Lesen geht, aber

    import { allEvidence } from "./state.js";
    allEvidence = data;        // TypeError: Assignment to constant variable.

Genau dieser Fehler ist nuetzlich: er macht sichtbar, dass eine Zuweisung aus einem
fremden Modul heraus eine **Fernwirkung** auf einen fremden Zustand ist — frueher ging
das unbemerkt und von ueberall.

Geloest ueber ein exportiertes Objekt: die Bindung `state` bleibt konstant, veraendert
werden nur ihre Properties (`state.allEvidence = data`). Jede Schreibstelle ist dadurch
im Code als solche erkennbar.

### Problem 2: Die 15 Inline-Handler

`index.html` hatte 13 `onclick`/`onchange`-Attribute, `app.js` erzeugte zwei weitere in
Template-Strings. **Alle 15 haetten mit `type="module"` aufgehoert zu funktionieren**,
weil Inline-Handler gegen den *globalen* Scope aufgeloest werden und Modul-Top-Level
nicht global ist — `navigateTo is not defined`.

Zwei Wege standen zur Wahl:
1. `window.navigateTo = navigateTo` im Einstiegspunkt — minimal, haette aber genau die
   Globals wieder eingefuehrt, die Demo 8 abschaffen will.
2. Inline-Handler durch `addEventListener` ersetzen.

Gewaehlt wurde (2). Umsetzung: die fuenf Nav-Buttons ueber ihr vorhandenes
`data-view`-Attribut, die vier "Go to …"-Buttons ueber ein neues `data-nav-target`,
`#sortEvidence` / Tabs / Hypothesen-Button ueber ihre IDs. Die zwei Handler in
Template-Strings wurden zu `data-action="close-detail"` bzw. `data-action="save-note"`
mit **Event Delegation** auf `#evidenceDetailSection` — noetig, weil diese Buttons bei
jedem Rendern neu erzeugt werden, der Container aber statisch im HTML steht.
`index.html` enthaelt jetzt **null** Inline-Handler.

### Weitere Beobachtungen

- `initApp()` wird direkt aufgerufen statt ueber `DOMContentLoaded`. Modul-Skripte werden
  automatisch *deferred* ausgefuehrt, das DOM steht also bereits — einer der
  Verhaltensunterschiede zum klassischen `<script>`.
- Der doppelte `hashchange`-Listener (einmal in `setupEventListeners`, einmal am
  Dateiende) wurde entfernt. Er war wirkungslos, weil identische Funktionsreferenzen
  dedupliziert werden, las sich aber wie ein Fehler.
- `app.js` wurde geloescht. Sie ist vollstaendig ersetzt und ueber
  `git show 9f51911:app.js` weiterhin erreichbar.

### Verifikation

Nach sauberem Reload: alle 12 Module laden mit 200, alle fuenf Views rendern Inhalt
(Dashboard 5096, Evidence 12419, People 5096, Timeline 9280 Zeichen). Manuell
durchgetestet: Navigation ueber Nav-Buttons und "Go to …"-Buttons, Suche (18 -> 7 -> 18
Treffer), Sortierung, People/Locations-Tabs, Bookmark (landet in `state` **und**
`localStorage`), Detailansicht oeffnen/schliessen, Notiz speichern, Workspace-Listen,
Hypothese speichern. `window.navigateTo`, `window.allEvidence` und `window.state` sind
jetzt erwartungsgemaess `undefined` — die Globals sind weg.

---

### Bug 7 — Die Sortierung funktionierte nur als Nebenwirkung von Bug 5

**Demo-Zuordnung:** Demo 5 (Wechselwirkung zwischen Bugs)
**Status:** gefixt
**Entdeckt:** beim Regressionstest nach dem Modul-Split — nicht durch Lesen des Codes.

**Symptom nach dem Bug-5-Fix**
Das Sortier-Dropdown im Evidence-Katalog hatte **keinerlei Wirkung** mehr. Alle vier
Kriterien (Titel auf/ab, Datum auf/ab) lieferten dieselbe Reihenfolge.

**Root Cause**

    handleSortChange()                     // sortiert state.filteredEvidence in place
      -> renderEvidenceList()
        -> getFilteredEvidence()           // baut results NEU aus state.allEvidence auf
           state.filteredEvidence = results // und wirft die eben sortierte Liste weg

Die Sortierung wurde also auf ein Array angewendet, das unmittelbar danach verworfen
wurde. **Solange Bug 5 bestand**, fiel das nicht auf: `filteredEvidence` und
`allEvidence` waren dasselbe Objekt, das In-place-`sort()` stellte damit auch
`allEvidence` um, und der Neuaufbau aus `allEvidence` erbte die sortierte Reihenfolge.

Das Feature funktionierte also **ausschliesslich ueber den Mutations-Bug**. Der Fix von
Bug 5 hat es freigelegt.

Nachgewiesen durch direkten Vergleich im laufenden Programm: mit kuenstlich
wiederhergestelltem Alias (`state.filteredEvidence = state.allEvidence`) wirkte die
Sortierung sofort wieder, ohne Alias nicht.

**Fix**

Das Sortierkriterium ist jetzt Teil des Zustands statt eine Eigenschaft des Arrays:

- `state.evidenceSortOrder` (Default `"date-desc"`, passend zur Vorauswahl im `<select>`)
- `handleSortChange()` schreibt nur noch das Kriterium und rendert neu
- `getFilteredEvidence()` sortiert `results` **nach** dem Filtern, ueber die neue private
  Hilfsfunktion `sortEvidenceList(list, sortValue)`

Dadurch ueberlebt die Sortierung jedes Neu-Rendern, und `allEvidence` bleibt unberuehrt.

**Lehre**
Ein Fix kann ein Feature zum Vorschein bringen, das sich auf den gefixten Bug gestuetzt
hat. Der Regressionstest nach einem Refactor ist nicht optional — dieser Fehler war
allein durch Lesen des Codes nicht zu sehen, weil beide Stellen (`handleSortChange` und
`getFilteredEvidence`) je fuer sich voellig plausibel aussehen.

**Verifikation**
Vier Sortierkriterien liefern vier verschiedene erste Eintraege. Die Sortierung bleibt
nach einem Filterwechsel erhalten. `state.allEvidence` steht unveraendert auf
`E01,E02,E03,…`.

---

## Demo 8 — Clean Coding: Globals, `var`/`let`/`const`, Code Smells

### Die 19 globalen `var`s des Originals

Zeilen 4-35 und 498 von `app.js` (Stand `22cb2d8`):

`allEvidence`, `filteredEvidence`, `selectedEvidence`, `bookmarks`, `currentPage`,
`allPeople`, `allLocations`, `allTimeline`, `caseData`, `currentPeopleTab`,
`loadingStepsRemaining`, `evidenceViewLoading`, `viewRendered`, `notesStore`,
`modalCloseListenerCount`, `latestSearchRequestId`, `STORAGE_KEY_BOOKMARKS`,
`STORAGE_KEY_NOTES`, `STORAGE_KEY_HYPOTHESIS`.

**Was bei Namenskollisionen passiert waere — drei konkrete Faelle:**

1. **`bookmarks`** — ein extrem generischer Name. Ein zweites Skript im selben
   Dokument (Analytics, ein Widget, eine Browser-Extension, die ins Seiten-Scope
   schreibt) mit einem eigenen `var bookmarks` haette dieselbe Bindung getroffen, weil
   beide auf `window.bookmarks` landen. Symptom: Bookmarks verschwinden oder tauchen
   doppelt auf, ohne dass eine Zeile im eigenen Code falsch aussieht.

2. **`state.currentPage`** (frueher `currentPage`) — steuert, welche View gerendert wird.
   Ein fremdes `currentPage` haette die Navigation stillschweigend uebernommen: `navigateTo`
   setzt den Wert, `handleHashChange` liest ihn, und zwischendurch schreibt jemand
   anders. Der Fehler waere nicht reproduzierbar gewesen, weil er von der Ladereihenfolge
   der Skripte abhaengt.

3. **`loadingStepsRemaining`** — ein Zaehler, der von `hideLoadingStep()` dekrementiert
   wird. Waere er von aussen veraenderbar, koennte das Lade-Overlay entweder nie
   verschwinden (Wert zu hoch) oder zu frueh (Wert zu niedrig, Views rendern mit leeren
   Daten). Exakt die Fehlerklasse von Bug 1, nur mit einer anderen Ursache.

**Wie der Modul-Split das verhindert:** Jedes Modul hat seinen eigenen Top-Level-Scope.
Nichts landet mehr auf `window` — nachgewiesen: `window.allEvidence`, `window.navigateTo`
und `window.state` sind jetzt `undefined`. Zugriff gibt es nur noch ueber einen
expliziten `import`, und der ist im Code sichtbar. Fremde Skripte im selben Dokument
koennen die Werte weder lesen noch ueberschreiben.

**Was der Split NICHT loest:** Der Zustand ist weiterhin *geteilt* und veraenderlich.
`state.allEvidence = ...` aus einem beliebigen importierenden Modul ist nach wie vor
moeglich. Gewonnen ist die Kapselung nach aussen und die Nachvollziehbarkeit der
Schreibzugriffe, nicht Unveraenderlichkeit.

### `var` -> `const`/`let`

Alle **161** Deklarationen umgestellt: **107 `const`, 54 `let`**. `grep -rn "\bvar \b" js/`
liefert keinen Treffer mehr.

Die Entscheidung fiel pro Deklaration danach, ob die Variable in ihrer Funktion spaeter
neu zugewiesen wird — nicht pauschal. `let` blieb im Wesentlichen fuer:

- **Schleifenzaehler** (`i`, `p`, `l`, `b`, `n`, `t`) — werden per `i++` veraendert
- **Akkumulatoren** (`html`, `count`, `reviewedCount`, `tagsHtml`) — werden in einer
  Schleife per `+=` aufgebaut
- **umgehaengte Referenzen** (`events`, `modal`, `el`, `hash`) — zeigen im Verlauf der
  Funktion auf etwas anderes

Wichtig fuer die Prueffrage: `const` verhindert **Neuzuweisung**, nicht **Mutation**.
`const results = []; results.push(x);` ist voellig in Ordnung — genau deshalb konnten so
viele Arrays und Objekte auf `const` umgestellt werden. Bug 5 waere durch `const` also
**nicht** verhindert worden: dort wurde nichts neu zugewiesen, sondern ein geteiltes
Array in place sortiert.

### Code Smells (ueber die Globals hinaus)

1. **Doppelte Bindung am Status-Filter** — siehe Bug 6. `addEventListener` *und*
   `setAttribute("onchange", ...)` auf demselben Element, als einziger der fuenf Filter.
   Kostete pro Filteraenderung einen kompletten ueberfluessigen Render-Durchlauf.
   Behoben.

2. **Verwaistes `resources/`-Verzeichnis** — sechs Personen-Bilder als Duplikate von
   `assets/people/`, nur mit Unterstrich statt Bindestrich im Namen, und nirgends
   referenziert (`grep -rn "resources/"` -> kein Treffer). Toter Ballast, der beim Lesen
   eine Abhaengigkeit suggeriert und beim Aendern eines Bildes die Frage aufwirft, welche
   Kopie gilt. **Geloescht** (in der Historie erhalten).

3. **Listener-Registrierung in der Render-Schleife** — siehe eigener Abschnitt oben.
   Kein Bug, aber eine Zeile, die sich auf ein Detail der Event-Spec verliess.
   Herausgezogen nach `setupEventListeners`.

4. **Doppelter `hashchange`-Listener** — einmal in `setupEventListeners`, einmal am
   Dateiende. Wirkungslos (identische Referenzen werden dedupliziert), aber irrefuehrend.
   Entfernt.

5. **Handgeschriebene `for`-Schleifen fuer Lookups** — `findEvidenceById`,
   `findPersonById`, `findLocationById` und `getSelectedOptions` durchliefen Arrays per
   Index. Ersetzt durch `find()` / `filter().map()`: kuerzer, kein Schleifenindex, keine
   Gelegenheit fuer einen Off-by-one — der Fehler, der in Bug 2 tatsaechlich aufgetreten
   ist.

### "Funktioniert" ist nicht "sauber"

Konkretes Beispiel aus diesem Projekt: die **Sortierung**. Sie tat vor allen Aenderungen
genau das, was der Benutzer erwartete — und stuetzte sich dabei ausschliesslich auf den
Aliasing-Bug (Bug 5/7). Der Code war korrekt im Sinne von "tut was er soll", aber jede
Aenderung an einer voellig anderen Stelle (hier: der Bug-1-Fix) konnte ihn umbringen.
Die reale Kosten der unsauberen Variante: ein Feature, dessen Funktionieren niemand aus
dem Code ableiten kann, das kein Test absichert und dessen Ausfall erst beim Klicken
auffaellt.

---

## Demo 9 — Von verschachtelten Promises zu `async`/`await`

### Die tiefste Kette: `loadCorePeopleAndLocations`

**Form vorher** — sechs Ebenen, jede Ebene startet erst nach Abschluss der vorigen:

    fetch("data/case.json")
      .then(caseRes => caseRes.json()
        .then(caseJson => {
          caseData = caseJson;
          return fetch("data/people.json")
            .then(peopleRes => peopleRes.json()
              .then(peopleJson => {
                allPeople = peopleJson;
                return fetch("data/locations.json")
                  .then(locationsRes => locationsRes.json()
                    .then(locationsJson => { ... }))
              }))
        }))

Die Verschachtelung entstand dadurch, dass `.json()` jeweils *innerhalb* des
`.then()`-Callbacks aufgeloest wurde, statt die Kette flach zurueckzugeben. Jede der drei
Dateien ist von der vorigen abhaengig — bzw. wurde so behandelt.

**Nachher** — dieselbe Ablauffolge, ohne Verschachtelung:

    async function loadCorePeopleAndLocations() {
      const caseRes = await fetch("data/case.json");
      state.caseData = await caseRes.json();

      const peopleRes = await fetch("data/people.json");
      state.allPeople = await peopleRes.json();

      const locationsRes = await fetch("data/locations.json");
      state.allLocations = await locationsRes.json();

      hideLoadingStep();
      renderDashboard();
      populateAllDropdowns();
    }

**Bewusst NICHT geaendert:** Die drei Requests laufen weiterhin *nacheinander*. Ein
`Promise.all([...])` waere hier schneller, ist aber ausdruecklich Thema einer spaeteren
Uebung.

### Weitere umgestellte Stellen

| Stelle | vorher | nachher |
|---|---|---|
| `loadEvidenceData` | `.then().then().catch()` | `async` + `try`/`catch` |
| `loadTimelineData` | `.then().then().catch().finally()` | `async` + `try`/`catch`/`finally` |
| `loadAllData` | `.then()` | `async` + `await` |
| `initApp` (main.js) | zwei geschachtelte `.then()` | zwei `await` |
| `handleSearchInput` (evidence.js) | `.then()` mit Race-Guard | `await` + Guard danach |

Das Error-Handling ist ueberall erhalten: aus `.catch(err => ...)` wurde `catch (err) { ... }`,
aus `.finally(...)` wurde `finally { ... }` mit identischem Inhalt.

Bei `handleSearchInput` war die Reihenfolge kritisch: der Guard
`if (requestId !== state.latestSearchRequestId) return;` muss **nach** dem `await` stehen.
Davor waere er wirkungslos, weil sich `latestSearchRequestId` genau waehrend der Wartezeit
aendert (der Benutzer tippt weiter).

### Zu den Prueffragen

- **Was `await` tut:** Es pausiert *nur die async-Funktion*, in der es steht, und gibt die
  Kontrolle an die Event-Loop zurueck. Das Programm laeuft normal weiter — Klicks, Timer,
  Rendering, andere async-Funktionen. Die Funktion setzt fort, wenn das Promise
  aufgeloest ist und der Microtask an der Reihe ist.
- **Rueckgabewert:** Eine `async`-Funktion gibt **immer** ein Promise zurueck.
  `loadAllData()` liefert also ein Promise; `loadAllData().then(v => console.log(v))`
  loggt `undefined`, weil die Funktion nichts zurueckgibt — nicht etwa gar nichts.
- **`.catch()`-Aequivalent:** `try`/`catch` um das `await`. Fehlt es und das awaitete
  Promise rejected, wird die Rejection zu einer unbehandelten Promise-Rejection der
  aufrufenden Kette — sichtbar als `Uncaught (in promise)` in der Console, waehrend die
  Funktion ab dem `await` einfach nicht weiterlaeuft. Kein Absturz, kein sichtbarer
  Fehler in der UI: genau die Fehlerklasse von Bug 1.
- **Schneller?** Nein. `async`/`await` ist Syntax ueber denselben Promises; es aendert
  nichts an der Anzahl oder Reihenfolge der Netzwerk-Requests. Was sich aendert, ist
  ausschliesslich die Lesbarkeit. Wer hier Geschwindigkeit gewinnen will, braucht
  `Promise.all` — eine andere Aenderung.
- **Ein `await` entfernen:** Aus `const caseRes = await fetch(...)` wird ein Promise in
  `caseRes`, und `caseRes.json()` wirft `caseRes.json is not a function`. Das ist dieselbe
  Kategorie wie Bug 3, wo ein Promise geloggt statt ausgepackt wurde.

---

## Demo 10 — Arrow Functions

### Konvertiert

**`js/utils.js` komplett** — neun kleine, zustandslose Helfer ohne `this` und ohne
`arguments`. Beispiel:

    // vorher
    function getRelevanceBadgeClass(relevance) {
      var r = (relevance || "").toLowerCase();
      if (r === "relevant") return "badge-relevant";
      return "badge-unreviewed";
    }

    // nachher
    export const getRelevanceBadgeClass = (relevance) =>
      (relevance || "").toLowerCase() === "relevant" ? "badge-relevant" : "badge-unreviewed";

Weitere: `statCardHTML` (dashboard.js) und `simulateAsyncSearch` (evidence.js), letztere
von drei verschachtelten `function`-Ausdruecken auf einen Einzeiler:

    const simulateAsyncSearch = (term) =>
      new Promise((resolve) => setTimeout(() => resolve(term), 300));

**Anonyme `addEventListener`-Callbacks:** sechs Stueck in evidence.js (2), people.js (1),
timeline.js (2), workspace.js (1), plus saemtliche Listener in `main.js`, die beim
Modul-Split ohnehin neu geschrieben wurden. Dazu vier `sort()`-Comparatoren.

**Verhaltensunterschied?** Bei diesen Konvertierungen: keiner. Keine der Funktionen
benutzt `this`, `arguments`, `new` oder `super`, und keine wird als Objektmethode
verwendet. Es ist eine reine Lesbarkeitsaenderung — nachgewiesen dadurch, dass der
komplette Funktionsdurchlauf (Navigation, Suche, Sortierung, Bookmarks, Detailansicht,
Notizen, Tabs, Cross-Links, Modal, Workspace, Hypothese) danach unveraendert
durchlaeuft, bei null Laufzeitfehlern.

### Bewusst nicht konvertiert: `initApp` in `js/main.js`

Ehrlicher Befund vorweg: In diesem Codebestand gibt es **kein einziges `this`** und
**kein `arguments`** (`grep -rn "\bthis\b" js/` findet nur Kommentare und einen
HTML-String). Das klassische Gegenargument "Arrow als Objektmethode bricht `this`" laesst
sich hier also nicht an echtem Code zeigen — es gibt keine Objektmethoden.

Der reale Grund, `initApp` als Funktionsdeklaration zu behalten, ist **Hoisting**:
`main.js` ruft `initApp()` auf Modul-Top-Level auf. Funktionsdeklarationen werden
vollstaendig gehoistet, der Aufruf darf also ueber der Definition stehen. Ein
`const initApp = async () => {...}` unterliegt der Temporal Dead Zone.

Empirisch belegt mit zwei Minimalmodulen:

    // A: Funktionsdeklaration, Aufruf davor  -> laeuft
    starte();
    function starte() { ... }

    // B: const-Arrow, Aufruf davor           -> ReferenceError
    starte();
    const starte = () => { ... };
    // ReferenceError: Cannot access 'starte' before initialization

Solange der Aufruf am Dateiende steht, funktionieren beide Varianten. Die Deklaration ist
aber robust gegen Umsortieren der Datei — und `initApp` ist genau die Funktion, bei der
jemand den Aufruf irgendwann nach oben zieht.

### Vorgeschlagene Team-Regel

1. **Arrow Functions** fuer alles, was als Wert weitergereicht wird: Callbacks,
   Comparatoren, Event-Handler, Promise-Executors, `map`/`filter`/`find`. Sie sind kuerzer
   und uebernehmen `this` lexikalisch, was in Callbacks fast immer das Gewuenschte ist.
2. **Funktionsdeklarationen** fuer benannte Top-Level-Funktionen eines Moduls,
   insbesondere Einstiegspunkte und alles, was gegenseitig oder frueh aufgerufen wird —
   wegen Hoisting und weil der Name im Stacktrace erscheint.
3. **Niemals Arrow** fuer Objektmethoden, Konstruktoren oder Funktionen, die `arguments`
   brauchen.

Begruendung: Die Regel richtet sich nach *Aufrufkontext*, nicht nach Laenge. Sie ist
mechanisch pruefbar und erklaert in jedem Einzelfall, warum die Wahl so ausfiel.
