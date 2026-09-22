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
