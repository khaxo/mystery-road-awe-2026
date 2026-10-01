# Changes — Exercise 2 (Build Tooling, TypeScript & CI/CD)

Repo: https://github.com/khaxo/mystery-road-awe-2026
Live: https://khaxo.github.io/mystery-road-awe-2026/
Ausgangspunkt: Stand nach Exercise 1 (Commit `6fe19a0`, 12 ES-Module).

---

## Demo 1 — Package Manager & Projekt-Metadaten

**Gewaehlt: npm.** Begruendung: npm ist mit Node 25.8.2 bereits installiert, pnpm
nicht. Fuer ein Projekt dieser Groesse (aktuell ~200 transitive Pakete, ein einziger
Entwickler) ist der Vorteil von pnpm gering, der Zusatzaufwand (Installation, CI-Setup
mit `pnpm/action-setup`) dagegen real. Die Entscheidung ist umkehrbar — ein
`pnpm import` erzeugt aus `package-lock.json` eine `pnpm-lock.yaml`.

**Was pnpm anders macht:** npm legt in jedem Projekt eine eigene, flache Kopie aller
Pakete unter `node_modules/` ab. pnpm legt jedes Paket genau einmal in einem globalen
Content-Addressable Store ab und verlinkt es per Hardlink ins Projekt. Folge: deutlich
weniger Plattenplatz und schnellere Installs bei vielen Projekten. Ausserdem baut pnpm
`node_modules/` **nicht flach** auf — ein Paket kann nur importieren, was es selbst in
seinen `dependencies` deklariert hat. Unter npm funktionieren "Phantom-Dependencies"
(ein Import, der nur zufaellig klappt, weil ein anderes Paket die Bibliothek
mitgebracht hat) und fliegen einem spaeter um die Ohren.

**`.gitignore`:** `node_modules/`, `dist/`, Vite-Cache, Editor-/OS-Dateien.
Begruendung: alles davon ist **generiert** und aus `package.json` + Lockfile bzw. aus
dem Quellcode jederzeit reproduzierbar.

**Erste Abhaengigkeit:** Vite, als `devDependency`. Lockfile `package-lock.json`
(40 aufgeloeste Pakete beim ersten Install) ist committet.

### Antworten

- **Was ein Package Manager loest, das manuelles Herunterladen nicht:** vor allem
  **transitive Abhaengigkeiten** und **Versionsaufloesung**. Vite zieht ~200 Pakete nach;
  die wuerde niemand von Hand verwalten. Dazu: ein maschinenlesbares Manifest, mit dem
  jeder Entwickler und jede CI denselben Stand herstellt; semantische Versionsbereiche
  (`^8.3.2`) inklusive Sicherheitsupdates; `npm audit`; und eine definierte Trennung
  zwischen Laufzeit- und Entwicklungsabhaengigkeiten.
- **`dependencies` vs. `devDependencies`:** `dependencies` landen beim Konsumenten im
  Produkt, `devDependencies` nur auf der Entwickler- und CI-Maschine. **Vite, ESLint,
  Prettier und TypeScript sind alle `devDependencies`** — sie laufen zur _Bauzeit_. Was
  der Browser am Ende ausliefert, ist der Inhalt von `dist/`; dort steckt kein Vite
  drin. Dieses Projekt hat derzeit **null** Laufzeitabhaengigkeiten.
- **Lockfile:** `package.json` sagt `^8.3.2` ("8.3.2 oder neuer, aber unter 9"), das
  Lockfile sagt exakt `8.3.2` plus den exakten Baum aller transitiven Pakete samt
  Integritaets-Hashes. Ohne Lockfile bekommt ein Teammitglied, das naechste Woche
  installiert, womoeglich 8.4.0 — und damit einen Bug, den es auf deiner Maschine nicht
  gibt ("works on my machine"). In der CI waere jeder Lauf potenziell ein anderer Build.
  Deshalb laeuft in beiden Workflows `npm ci` (installiert strikt nach Lockfile und
  bricht ab, wenn Lockfile und `package.json` auseinanderlaufen) statt `npm install`.

---

## Demo 2 — Vite als Dev-Server

**Umstrukturierung:** `data/` und `assets/` wurden nach `public/` verschoben. Grund:
Beide werden zur **Laufzeit ueber zusammengebaute Strings** adressiert —
`fetch("data/case.json")` und `person.avatar` (der Pfad steht als String _in der JSON_).
Vite kann solche Referenzen statisch nicht erkennen und wuerde die Dateien nicht in den
Build uebernehmen. Was in `public/` liegt, wird unveraendert und unter demselben Pfad
ausgeliefert und kopiert.

`vite.config.js` setzt `base: "/mystery-road-awe-2026/"` (GitHub Pages serviert
Projekt-Sites unter diesem Unterpfad) und `sourcemap: true`.

**Verifikation aller Views** (nicht nur "Seite laedt"): Dashboard, Evidence, People,
Timeline, Workspace rendern Inhalt; 18 Evidence, 6 Personen, 6 Orte, 15 Timeline-Events
geladen; alle 6 Avatare mit `naturalWidth > 0`.

### HMR — was genau beobachtet wurde

Vorbereitung: zur Evidence-View navigiert, "calibration" ins Suchfeld getippt
(7 Treffer), und `window.__hmrMarker` in der Console gesetzt. Dann `styles.css`
geaendert (Hintergrundfarbe).

| Beobachtung            | Ergebnis                                        |
| ---------------------- | ----------------------------------------------- |
| Vite-Log               | `[vite] (client) hmr update /styles.css?direct` |
| Hintergrundfarbe       | `rgb(238,241,246)` -> `rgb(255,233,214)`        |
| `window.__hmrMarker`   | **ueberlebt**                                   |
| Suchfeld               | weiterhin `"calibration"`                       |
| gefilterte Trefferzahl | weiterhin 7                                     |

Was **nicht** passiert ist: kein Page-Reload. Ein voller Reload haette den Marker
geloescht, das Suchfeld geleert und wieder alle 18 Eintraege gezeigt. Genau das ist der
Unterschied zwischen HMR und einem Auto-Refresh: Vite tauscht das geaenderte Modul im
laufenden Programm aus und laesst den Zustand stehen.

Bei CSS ersetzt Vite nur das `<style>`/Link-Target. Bei JS-Modulen ohne eigene
HMR-API (`import.meta.hot`) faellt Vite auf einen vollen Reload zurueck — der
Zustandserhalt gilt hier also fuer CSS, nicht automatisch fuer jede Codeaenderung.

### Antworten

- **Statischer Server vs. Vite Dev-Server:** Der Python-Server aus Exercise 1 hat
  Dateien 1:1 ausgeliefert, sonst nichts. Vite (a) macht **HMR**, (b) loest
  **Bare-Imports** auf (`import x from "lodash"` statt Pfadangabe), (c) **transpiliert
  on-the-fly** — unsere `.ts`-Dateien gehen als gueltiges JS an den Browser, obwohl der
  kein TypeScript kann, (d) liefert **pre-bundelte Dependencies** aus (esbuild), damit
  nicht hunderte Einzel-Requests entstehen.
- **Warum ES-Module gut zu Vite passen:** Vites Dev-Server basiert darauf, dass der
  Browser `import`/`export` selbst versteht — er liefert jedes Modul einzeln aus und
  ersetzt bei einer Aenderung **nur dieses eine**. Die Single-`<script>`-Version haette
  diese Granularitaet nicht: es gab genau eine Einheit, also waere jede Aenderung ein
  Komplett-Neuladen. Der Modul-Split aus Exercise 1 ist die Voraussetzung dafuer, dass
  HMR ueberhaupt etwas Feineres tun kann.

---

## Demo 3 — Production Build & Preview

    $ npm run build
    ✓ 18 modules transformed.
    dist/index.html                 11.72 kB │ gzip: 2.78 kB
    dist/assets/index-ZAWMSz9M.css  11.44 kB │ gzip: 2.77 kB
    dist/assets/index-BDA54tmN.js   23.79 kB │ gzip: 6.36 kB │ map: 69.56 kB

### Beobachtete Transformationen (Quelle -> Build)

|           | Quelle (`js/`) | Build (`dist/`)          |
| --------- | -------------- | ------------------------ |
| Dateien   | 12 Module      | **1** JS-Datei           |
| Groesse   | 43.088 Bytes   | **23.792 Bytes** (-45 %) |
| Zeilen    | 1.106          | **1**                    |
| Dateiname | `main.ts`      | `index-BDA54tmN.js`      |

1. **Bundling** — 16 bzw. 18 Module zu einer Datei zusammengefasst; im Browser nur noch
   ein `<script>` statt zwoelf Requests.
2. **Minification** — Whitespace und Kommentare weg, lokale Namen gekuerzt; alles auf
   einer Zeile. 45 % kleiner, mit gzip bleiben 6,4 kB.
3. **Content-Hash im Dateinamen** — `index-BDA54tmN.js`.
4. **CSS extrahiert und ebenfalls gehasht** — `index-ZAWMSz9M.css`.
5. **`public/` unveraendert uebernommen** — `dist/data/*.json`, `dist/assets/**`.
6. **Sourcemap erzeugt** — `.js.map`, damit ein Stacktrace auf die TS-Quelle zeigt.

**Verifiziert mit `vite preview`** (Port 4173, serviert `dist/`, kein Dev-Server):
alle Views, Suche 18 -> 7 -> 18, alle vier Sortierkriterien, 6 Avatare, null
Laufzeitfehler, genau ein `<script>` im DOM.

### Antworten

- **Warum Content-Hash:** Browser und CDNs cachen statische Dateien aggressiv und oft
  lange. Hiesse die Datei immer `index.js`, bekaemen wiederkehrende Benutzer nach einem
  Deployment die **alte** Version aus dem Cache. Weil der Hash aus dem Inhalt
  berechnet wird, ist der Dateiname nach jeder inhaltlichen Aenderung ein anderer — die
  neue URL ist garantiert ungecacht, waehrend unveraenderte Dateien ihren Namen behalten
  und im Cache bleiben duerfen. **Live beobachtet:** nach dem letzten Deploy wechselte
  `index-CWYkdHbA.js` -> `index-ByndX9BB.js` und `index-ZAWMSz9M.css` ->
  `index-MB1kIfZ6.css`.
- **Warum man den Dev-Server nie deployt:** Er liefert unminifizierten, ungebundelten
  Code aus (viele Requests, grosse Payloads), haengt einen HMR-WebSocket und einen
  Datei-Watcher an, transpiliert bei jedem Request neu statt einmal vorab, und ist
  weder auf Last noch auf Sicherheit ausgelegt (er ist dafuer gebaut, auf `localhost`
  Quellcode vom Dateisystem zu servieren). Er ist ein Entwicklungswerkzeug, kein
  Webserver.

---

## Demo 4 — Lint & Format

**ESLint 9 (Flat Config, `eslint.config.js`)** mit `js.configs.recommended`,
`typescript-eslint` nur fuer `**/*.ts`, eigenen Regeln (`eqeqeq`, `no-var`,
`prefer-const`, `no-console` ausser warn/error, `no-alert`) und `eslint-config-prettier`
**als letztem Eintrag** — das schaltet alle ESLint-Regeln ab, die mit Prettier um
Formatierung streiten wuerden.

**Prettier** (`.prettierrc.json`): `printWidth: 100`, doppelte Anfuehrungszeichen,
Semikolons, keine Trailing Commas.

**Scripts:** `dev`, `typecheck`, `build`, `preview`, `lint`, `lint:fix`, `format`,
`format:check`.

### Echte Funde

**Linter, auf dem Bestandscode:** 6 Treffer, u.a. `no-alert` in `js/data.ts` (ein
`alert()` im Fehlerpfad des Evidence-Ladens blockiert den Thread) und mehrere
`no-console`.

**Formatter:** `prettier --check` meldete 12 Dateien. Konkretes Beispiel aus
`js/views/people.ts` — Prettier hat die **Anfuehrungszeichen normalisiert**, um
Escaping zu vermeiden:

    - html += "<div><h3>" + person.name + "</h3><div class=\"person-role\">" + ...
    + html += "<div><h3>" + person.name + '</h3><div class="person-role">' + ...

### Der wichtigste Fund: was `--fix` NICHT repariert

Absichtlich fehlerhafte Datei angelegt und `lint` / `lint:fix` laufen lassen:

| Regel                     | vom Auto-Fix repariert? | Warum                                                                                    |
| ------------------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| `no-var` (`var` -> `let`) | **ja**                  | rein syntaktisch, Verhalten identisch                                                    |
| `eqeqeq` (`==` -> `===`)  | **nein**                | wuerde das **Laufzeitverhalten aendern**: `"1" == 1` ist `true`, `"1" === 1` ist `false` |
| `no-unused-vars`          | **nein**                | Code zu loeschen kann etwas kaputtmachen                                                 |

Das ist die Antwort auf "warum zwei Scripts": `--fix` fasst nur an, was **beweisbar
verhaltensneutral** ist. Alles andere muss ein Mensch entscheiden. Und man will die
nicht-fixende Variante immer dann, wenn die Antwort "ja/nein" lauten muss statt "ich
aendere mal was" — namentlich **in der CI** (dort darf nichts stillschweigend
umgeschrieben werden, der Lauf soll scheitern) und im Code-Review.

### Antworten

- **Linter vs. Formatter:** Der Linter prueft **Semantik und Fehleranfaelligkeit** —
  "diese Variable wird nie benutzt", "`==` statt `===`", "`alert()` blockiert". Der
  Formatter prueft **ausschliesslich Darstellung** — Einrueckung, Zeilenlaenge,
  Anfuehrungszeichen — und interessiert sich nicht dafuer, was der Code tut. Konkret
  hier: Linter -> `no-alert` in `js/data.ts`; Formatter -> die Quote-Normalisierung oben.
- **Was `npm run lint` unter der Haube tut:** npm liest das Feld `scripts.lint` aus
  `package.json` und fuehrt den Befehl in einer Shell aus, bei der
  **`node_modules/.bin` vorne im `PATH`** steht. Dort hat npm beim Installieren eine
  ausfuehrbare Verknuepfung `eslint` angelegt. Waere ESLint nur **global** installiert,
  wuerde es zwar vermutlich trotzdem laufen (globaler `PATH`) — aber mit einer
  **anderen Version** als die des Projekts, nicht reproduzierbar, und in der CI gar
  nicht, weil dort nur `npm ci` laeuft. Genau deshalb gehoeren Werkzeuge in die
  `devDependencies`.

---

## Demo 5 — TypeScript-Setup & erste Konvertierungen

`tsconfig.json`: `target: ES2022`, `moduleResolution: bundler`, **`noEmit: true`**
(Vite/esbuild transpiliert, `tsc` ist hier reiner Typpruefer).

### Bewusste Strictness-Entscheidungen

**Eingeschaltet: `strict: true`.** Das ist ein Sammelschalter; er aktiviert u.a.
**`strictNullChecks`** (`null`/`undefined` sind nicht mehr in jedem Typ enthalten, man
muss pruefen), **`noImplicitAny`** (ein Parameter ohne erkennbaren Typ ist ein Fehler
statt stillschweigend `any`), `strictFunctionTypes`, `strictBindCallApply` und
`strictPropertyInitialization`. Behalten, weil die beiden erstgenannten in dieser
Migration den gesamten Nutzen gebracht haben — praktisch alle 272 Startfehler waren
entweder "moeglicherweise null" oder "implizit any".

Zusaetzlich an: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`.

**Bewusst AUS gelassen: `noUncheckedIndexedAccess`.** Es wuerde jeden Zugriff `arr[i]`
zu `T | undefined` machen. Dieser Code durchlaeuft Arrays fast ueberall mit klassischen
Indexschleifen, deren Grenzen direkt aus `array.length` stammen — die Pruefung haette
dutzende Stellen angefasst, ohne einen einzigen echten Fehler zu finden, und haette den
Blick auf die Funde verstellt, die tatsaechlich zaehlen. Fuer neu geschriebenen Code
mit `map`/`filter`/`find` wuerde ich sie anschalten.

### Erste konvertierte Module

`js/utils.ts` (9 Helfer), `js/storage.ts`, `js/state.ts` — kein `any`, null Fehler.

### Werkzeug-Verdrahtung

    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit && vite build"

Entscheidend: **Vite prueft keine Typen.** esbuild entfernt die Typannotationen und
transpiliert, es validiert sie nicht. Ohne das vorgeschaltete `tsc` waere ein Typfehler
stillschweigend durchgebaut worden — und der Editor waere die einzige Instanz gewesen,
die ihn je gesehen haette.

### Antworten

- **Compile-Time-Fehler vs. die Laufzeit-Bugs aus Exercise 1:** Ein Typfehler wird
  gefunden, **ohne das Programm auszufuehren**, allein aus der Struktur des Codes. Die
  Bugs aus Exercise 1 brauchten eine laufende App in einem bestimmten Zustand.
  **Haette TypeScript sie gefunden?**
  - _Bug 1_ (`evidenceViewLoading` wird nie auf `false` gesetzt): **nein.** Der Typ ist
    `boolean`, der Wert `true` — vollkommen typkorrekt. Das ist ein Logikfehler.
  - _Bug 5_ (`filteredEvidence = allEvidence` statt Kopie): **nein.** Beide Seiten sind
    `Evidence[]`, die Zuweisung ist typkorrekt. Typen unterscheiden nicht zwischen
    "dasselbe Objekt" und "ein gleichartiges Objekt".
  - _Bug 2_ (`navButtons[i]` ist `undefined` nach Schleifenende): **ja, mit
    `noUncheckedIndexedAccess`** — genau die Option, die hier aus gutem Grund aus ist.
    Ein Beispiel dafuer, dass Strictness ein Zielkonflikt ist, keine Skala.
  - _Bug 3_ (ein Promise wird statt des Werts geloggt): **teilweise.** `console.log`
    nimmt `any`, also kein Fehler — aber jede _Verwendung_ des Werts als String waere
    sofort aufgefallen.
- **Was `any` tut:** Es schaltet die Pruefung fuer diesen Wert **komplett ab** — und
  zwar ansteckend: alles, was daraus abgeleitet wird, ist auch wieder ungeprueft. Ein
  `any` an einer zentralen Stelle (z.B. dem Rueckgabewert von `fetch().json()`) haette
  die halbe App faktisch ungetypt gelassen, waehrend der Compiler "0 Fehler" meldet.
  Deshalb in diesem Durchgang bewusst vermieden: das Ziel war nicht ein gruener
  Compiler, sondern die Information, die er auf dem Weg dorthin liefert.

---

## Demo 6 — Typisierung der Domaenendaten

`js/types.ts` definiert `Evidence`, `Person`, `CaseLocation`, `TimelineEvent`,
`CaseData`, `Hypothesis` sowie die Unions `EvidenceStatus`, `EvidenceRelevance`,
`TimelineCertainty`. `js/data.ts` benutzt sie statt untypisierter `fetch().json()`-
Ergebnisse.

### Das mehrdeutige Feld: `evidence.personIds`

Datenanalyse ueber `public/data/*.json`:

    Personen-IDs in people.json : kernel-colt, nova-byte, patch-vector,
                                  refactor-rex, root-harbor, signal-scholar
    personIds in evidence.json  : ... + "Nova Byte"   <-- ein ANZEIGENAME

In `evidence.json` steht an einer Stelle **"Nova Byte"** — der Anzeigename — zwischen
lauter kebab-case-IDs. In `timeline.json` kommt das nicht vor, dort sind es
ausschliesslich IDs.

**Wie JavaScript damit durchgekommen ist:** `evidenceMentionsPerson` prueft seit jeher
**beides**:

    ev.personIds.includes(person.id) || ev.personIds.includes(person.name)

Das Feld hiess `personIds`, enthielt aber faktisch "IDs **oder** Namen", und jede
einzelne Lesestelle hat sich selbst darum gekuemmert — oder eben nicht. In
`js/views/evidence.ts` liefert `findPersonById("Nova Byte")` folgerichtig `null`, und
der Fallback zeigt den Rohstring an. Das **sieht zufaellig richtig aus**, weil der
Rohwert nun einmal der Anzeigename ist. Reiner Glueckstreffer.

**Wozu TypeScript zwingt:** `personIds: string[]` zu schreiben ist ehrlich, aber
nutzlos. Sobald man `personIds: PersonId[]` modellieren will, muss man entscheiden:
Ist das eine ID-Liste (dann sind die Daten falsch und gehoeren korrigiert) oder eine
Referenzliste, die beides erlaubt (dann gehoert das in den Typ und in **eine**
Aufloesungsfunktion)? Die dritte Variante — "mal so, mal so, und jede Lesestelle raet" —
laesst sich nicht aufschreiben. Genau das war der Zustand vorher.

### Zweiter Fund: inkonsistente Gross-/Kleinschreibung

    evidence.type      : 'Test-Report' UND 'test-report'
    evidence.status    : 'Reviewed'    UND 'unreviewed'
    evidence.relevance : 'Unknown'     UND 'unknown'
    timeline.certainty : durchgaengig klein

Der JS-Code kam damit durch, weil **jede** Vergleichsstelle einzeln `.toLowerCase()`
aufrief. Mit `EvidenceStatus = "unreviewed" | "reviewed" | "flagged"` geht das nicht
mehr: `"Reviewed"` gehoert nicht zum Union. Loesung: `RawEvidence` (mit `string`)
beschreibt, was tatsaechlich in der Datei steht; `normalisiereEvidence()` wandelt es
**einmal beim Laden** in das kanonische Modell. Danach darf sich die gesamte App auf
den Wertebereich verlassen.

### Antworten

- **Was Typen hier NICHT koennen:** Die Typen beschreiben eine **Annahme** ueber den
  Inhalt der JSON-Dateien, sie pruefen ihn nicht. `res.json()` liefert `any`; das
  `as T` in `ladeJson<T>()` ist eine _Behauptung_. Legt jemand eine `evidence.json` mit
  fehlendem `tags`-Array ab, kompiliert alles weiterhin fehlerfrei und die App stuerzt
  zur Laufzeit bei `.tags.join(" ")` ab. Was zusaetzlich noetig waere: **Validierung zur
  Laufzeit** an der Systemgrenze — handgeschriebene Guards oder ein Schema-Validator
  wie Zod/Valibot, der aus dem Schema zugleich den TypeScript-Typ ableitet. Dasselbe
  gilt fuer `localStorage` (siehe `loadNotesFromStorage`, wo deshalb `unknown` + Pruefung
  statt eines Casts steht).
- **`interface` vs. `type`:** `interface` ist auf Objektformen beschraenkt, laesst sich
  aber **nachtraeglich erweitern** (declaration merging) und zeigt sich in
  Fehlermeldungen oft mit dem Namen statt ausgeschrieben. `type` kann alles —
  Unions, Tupel, Mapped Types, bedingte Typen —, ist aber nicht erweiterbar. Hier:
  `interface` fuer die Domaenenobjekte (`Evidence`, `Person`, ...), `type` fuer die
  Unions (`EvidenceStatus` ...), weil ein Union gar nicht als `interface` ausdrueckbar
  ist. **Fuer die Objektformen ist es praktisch egal** — die Entscheidung ist hier
  Konvention, nicht Technik.

---

## Demo 7 — Vollstaendige Migration

Alle 13 Module von `.js` auf `.ts`, `index.html` laedt `js/main.ts`.
**272 Fehler -> 0**, ohne ein einziges `any` und ohne eine `!`-Assertion.

Neu entstanden: `js/dom.ts` (typisierte DOM-Helfer `el`, `mustEl`, `valueOf`,
`targetOf`, `targetValue`) statt verstreuter Non-Null-Assertions.

### Drei Stellen, an denen der Compiler etwas Echtes gezeigt hat

**1. `handleHashChange` — Laufzeitpruefung und Typ hingen nicht zusammen**

Der alte Code prueft `hash` gegen eine Liste und weist dann zu:

    const validViews = ["dashboard", "evidence", ...];
    if (validViews.indexOf(hash) === -1) hash = "dashboard";
    state.currentPage = hash;        // fuer TS: irgendein string

Fuer TypeScript blieb `hash` ein beliebiger `string`. Die Pruefung existierte, der
Compiler konnte sie nur nicht _sehen_. Loesung ist ein **Type Guard**:

    function isViewName(value: string | null): value is ViewName

Das `value is ViewName` verbindet beides: nach dem Aufruf weiss der Compiler, dass der
Wert zum Union gehoert. **Realer Bug oder Pedanterie?** Pedanterie im Ist-Zustand — die
Liste war korrekt. Aber die Liste und der Typ waren zwei unabhaengige Wahrheiten, die
jederzeit auseinanderlaufen konnten. Jetzt gibt es nur noch eine.

**2. `navigateTo(button.getAttribute("data-view"))` — echter latenter Fehler**

    error TS2345: Argument of type 'string | null' is not assignable
                  to parameter of type 'ViewName'.

`getAttribute` liefert `string | null`. Fehlt das Attribut am Button oder ist vertippt,
wurde bisher `null` bzw. ein Unsinn-String an `navigateTo` gereicht, der ihn in
`location.hash` schrieb — die View haette stillschweigend nicht umgeschaltet. **Das ist
ein realer latenter Bug**, kein Rauschen: er haengt an einem HTML-Attribut, also an
Daten ausserhalb des TypeScript-Codes, und waere bei jeder Umbenennung aufgetreten.

**3. `state.evidenceSortOrder = select.value` — dieselbe Klasse an anderer Stelle**

    error TS2322: Type 'string' is not assignable to type 'EvidenceSortOrder'.

`<option value>` ist fuer den Compiler ein beliebiger String. Beide Faelle sagen
dasselbe: **das DOM liefert Strings, die Domaene will Unions** — und die Umwandlung
muss eine sichtbare, pruefende Stelle haben. Dafuer gibt es jetzt `isViewName` und
`isSortOrder` in `js/state.ts`.

### Weitere Kategorien (eher Rauschen, aber nuetzlich)

- `Date - Date` ist in TypeScript ein Fehler (`TS2362/2363`) — in JS funktioniert es
  ueber implizite Konvertierung. Behoben mit `.getTime()`. Pedanterie, aber der
  explizite Code ist besser lesbar.
- `e.target` ist `EventTarget | null` — **kein** garantiertes HTML-Element. Geloest mit
  `targetOf()`, das `instanceof HTMLElement` prueft. Das ist eine echte
  Laufzeitpruefung, kein Cast — und hat die Annahme sichtbar gemacht, die vorher in
  jeder Handler-Zeile implizit drinsteckte.
- ~55 x `document.getElementById(...)` ist `HTMLElement | null`. Statt ueberall `!` zu
  schreiben: `mustEl()` fuer Elemente, die statisch in `index.html` stehen (wirft mit
  klarer Meldung, wenn das HTML kaputt ist), `el()` fuer alles, was fehlen darf —
  insbesondere `#quickViewModal`, das zur Laufzeit erzeugt wird.

### Antworten

- **Wann `any` richtig ist:** Als **temporaerer Platzhalter** an einer Grenze, die man
  gleich darauf ordentlich modelliert, oder bei einer wirklich dynamischen
  Fremdbibliothek ohne Typen. Hier gezogene Linie: an der JSON-Grenze gibt es **genau
  eine** Stelle mit einer Typbehauptung (`ladeJson<T>()`), und die ist kommentiert und
  als Behauptung gekennzeichnet. Ueberall sonst wurde modelliert. `unknown` war
  mehrfach die bessere Wahl als `any` (siehe `loadBookmarksFromStorage`): es erzwingt
  eine Pruefung, statt sie zu erlauben.
- **Verhaltensgleichheit nachgewiesen:** Nach der Migration wurde der vollstaendige
  Funktionsdurchlauf gegen den Produktions-Build gefahren — alle fuenf Views, Suche
  (18 -> 7 -> 18), alle vier Sortierkriterien (vier verschiedene erste Eintraege),
  Typfilter (18 -> 1 -> 18 nach "Clear"), Bookmark (in `state` **und** `localStorage`),
  Detailansicht auf/zu, Notiz speichern, Status-Dropdown, People/Locations-Tabs,
  Cross-Links, Timeline-Modal, Workspace-Listen, Hypothese speichern. **Null
  Laufzeitfehler, Ergebnisse identisch zur JS-Version.**

---

## Demo 8 — Development-Workflow (`.github/workflows/ci.yml`)

Trigger: `push` auf alle Branches, `pull_request` gegen `main`, plus
`workflow_dispatch`. Schritte: Checkout -> Node 22 mit npm-Cache -> `npm ci` ->
`format:check` -> `lint` -> `typecheck` -> `build`.

### Workflow / Job / Step

- **Workflow** = die ganze Datei `ci.yml`, benannt `CI`, mit ihren Triggern.
- **Job** = `quality`. Laeuft auf einer eigenen frischen VM (`runs-on: ubuntu-latest`).
  Jobs laufen standardmaessig **parallel** und isoliert; sie teilen kein Dateisystem.
  Deshalb braucht `deploy.yml` ein hochgeladenes Artefakt, um etwas zwischen seinen
  zwei Jobs zu uebergeben.
- **Step** = ein einzelner Schritt darin, z.B. `- name: Linten / run: npm run lint`.
  Steps laufen **sequenziell** im selben Arbeitsverzeichnis; der erste fehlgeschlagene
  bricht den Job ab.

### Fehlschlag und Reparatur (belegt)

Commit `f3a6097` mit einem absichtlichen Typfehler -> **CI: failure**, Deploy: failure.
Commit `1c9b891` mit der Korrektur -> **CI: success**, Deploy: success.

### Antworten

- **Warum Lint/Format in der CI, wenn es lokal laeuft:** Weil "koennte lokal laufen"
  und "ist gelaufen" verschiedene Dinge sind. Die CI ist die einzige Instanz, die
  **jeden** Push prueft, unabhaengig davon, wer gepusht hat, mit welcher Konfiguration,
  welcher Node-Version oder ob der Pre-Commit-Hook mit `--no-verify` uebergangen wurde.
  Sie prueft ausserdem auf einer **sauberen Maschine** — das faengt genau die Fehler,
  die lokal durch Reste in `node_modules/` oder globale Installationen verdeckt sind.
  Lokales Linten ist Komfort (schnelles Feedback), CI-Linten ist die Zusage.
- **Was `cache: "npm"` tut:** `actions/setup-node` legt den **npm-Cache** (`~/.npm`,
  die heruntergeladenen Tarballs) als Artefakt ab, verschluesselt ueber einen Schluessel
  aus Betriebssystem, Node-Version und dem **Hash von `package-lock.json`**. Aendert
  sich das Lockfile nicht, werden die Pakete nicht erneut aus dem Netz geholt.
  **Ohne Cache:** korrektheitsmaessig **kein Unterschied** — `npm ci` installiert so oder
  so exakt die Versionen aus dem Lockfile; der Cache beeinflusst nur die Herkunft der
  Dateien, nicht ihren Inhalt (Integritaets-Hashes werden geprueft). Geschwindigkeit:
  jeder Lauf laedt alle Pakete neu herunter, typisch einige zehn Sekunden mehr pro Job —
  bei zwei Workflows pro Push also doppelt.

---

## Demo 9 — Deployment-Workflow (`.github/workflows/deploy.yml`)

Trigger: `push` auf `main` plus `workflow_dispatch`. Zwei Jobs:
`build` (checkout, Node, `npm ci`, `lint`, `build`, `configure-pages`,
`upload-pages-artifact` mit `path: ./dist`) und `deploy` (`needs: build`,
`actions/deploy-pages@v4`).

**Live-URL:** https://khaxo.github.io/mystery-road-awe-2026/ — end-to-end geprueft:
18 Evidence-Karten, Suche filtert auf 7, 6 Avatare geladen, Timeline und Workspace
rendern, null Laufzeitfehler, ein gebundeltes Skript.

**Aenderung live gegangen ohne manuellen Schritt:** Commit `1c9b891` (Fix + sichtbarer
Tastaturfokus) -> Workflow -> neue Hashes auf der Live-Seite:
`index-CWYkdHbA.js` -> `index-ByndX9BB.js`, `index-ZAWMSz9M.css` -> `index-MB1kIfZ6.css`.

### Antworten

- **Warum der Deploy-Workflow selbst nochmal lintet und baut:** Weil er **fuer sich
  allein** entscheiden koennen muss, ob veroeffentlicht werden darf. Die beiden
  Workflows laufen unabhaengig und parallel; es gibt keine Garantie, dass CI vorher
  fertig ist oder ueberhaupt lief (z.B. bei `workflow_dispatch` oder nach einer
  Branch-Protection-Aenderung). Ausserdem braucht der Deploy-Job das `dist/` ohnehin —
  und jeder Job startet auf einer frischen VM, erbt also **nichts** vom CI-Lauf. Auf
  "hat auf meiner Maschine funktioniert" zu vertrauen, scheidet ganz aus: der Build muss
  reproduzierbar aus dem Repository entstehen, nicht aus einem lokalen Zustand.
- **Der konkrete Mechanismus:** **Kein** Push auf einen `gh-pages`-Branch. Der
  `build`-Job packt `dist/` mit `actions/upload-pages-artifact@v3` in ein
  Pages-spezifisches Artefakt (ein Tar im Actions-Artefaktspeicher). Der `deploy`-Job
  ruft `actions/deploy-pages@v4` auf, weist sich ueber ein **OIDC-Token**
  (`id-token: write`) gegenueber dem Pages-Dienst aus und sagt ihm, er soll genau dieses
  Artefakt als neue Version der Site aktivieren. Das Repository wird dabei nicht
  veraendert — es gibt keinen Deploy-Commit. Voraussetzung ist, dass Pages auf
  **Source = GitHub Actions** steht (`build_type: workflow`), nicht auf "Deploy from a
  branch".
- **Bei einem anderen Static Host:** Gleich blieben Checkout, Node-Setup, `npm ci`,
  `lint` und `build` — also alles bis einschliesslich `dist/`. Ausgetauscht wuerde nur
  der letzte Abschnitt: statt `configure-pages` / `upload-pages-artifact` /
  `deploy-pages` kaeme z.B. `netlify-cli deploy --prod --dir=dist` oder `vercel deploy
--prebuilt`, bei SFTP ein `rsync`/`scp`-Schritt. Statt des OIDC-Tokens braeuchte man
  dann ein **Repository-Secret** (API-Token bzw. SSH-Key), und `permissions: pages/
id-token` entfiele. Ausserdem muesste `base` in `vite.config.js` angepasst werden,
  wenn der neue Host unter einer Domain-Wurzel statt einem Unterpfad serviert.

---

## Demo 10 — Trigger, Permissions & Failure Modes

### Der blockierte Deploy (belegt, Commit `f3a6097`)

Absichtlicher Typfehler in `js/navigation.ts`:

    if (hash === "evidence") state.currentPage = "evidences";

    error TS2820: Type '"evidences"' is not assignable to type 'ViewName'.
                  Did you mean '"evidence"'?

Lauf des Deploy-Workflows:

    JOB Build: failure
       4. npm ci                       -> success
       5. Linten                       -> success
       6. Bauen (tsc --noEmit)         -> FAILURE
       7. Pages konfigurieren          -> skipped
       8. dist/ als Artefakt hochladen -> skipped
    JOB Deploy: skipped

Bemerkenswert: **ESLint war gruen.** Der Fehler ist rein typischer Natur — ein
Tippfehler in einem String, der zufaellig syntaktisch einwandfrei ist. Nur `tsc` hat ihn
gesehen. Genau dafuer steht `tsc --noEmit` im `build`-Script.

### Antworten

- **Was mit der live stehenden Version passiert:** Sie **bleibt unveraendert online**.
  Nachgeprueft waehrend der Deploy fehlgeschlagen war: `curl` auf die Live-URL lieferte
  weiterhin **200** und das alte Bundle `index-CWYkdHbA.js`. Grund: `deploy` haengt
  ueber `needs: build` am Build-Job; faellt der aus, wird `deploy` **uebersprungen** —
  es wird also gar kein neues Artefakt aktiviert, und die zuletzt erfolgreich
  veroeffentlichte Version bleibt stehen. Das ist das gewuenschte Verhalten
  ("fail closed"): ein kaputter Commit darf eine funktionierende Seite nicht abschalten.
  Der Preis ist, dass die Live-Version still veraltet — deshalb muss ein fehlgeschlagener
  Lauf sichtbar sein und nicht ignoriert werden.
- **Benoetigte Permissions und wo sie stehen:**

  | Ort                                       | Was                                                  |
  | ----------------------------------------- | ---------------------------------------------------- |
  | `permissions:` in `deploy.yml`            | `contents: read`, `pages: write`, `id-token: write`  |
  | Repository-Settings -> Pages              | Source = **GitHub Actions** (`build_type: workflow`) |
  | `environment: github-pages` im deploy-Job | bindet den Lauf an die Pages-Umgebung                |

  **Secrets werden keine gebraucht.** Die Authentifizierung laeuft ueber das
  automatisch bereitgestellte `GITHUB_TOKEN` plus ein kurzlebiges **OIDC-Token**
  (`id-token: write`) — es gibt keinen dauerhaften API-Schluessel, der gestohlen werden
  koennte.

  **Risiko bei Ueberrechtigung:** `permissions` gelten fuer das `GITHUB_TOKEN` _jedes
  Schritts_ im Lauf, also auch fuer jede Third-Party-Action und jedes npm-Paket, dessen
  Install-Script laeuft. Mit `contents: write` koennte ein kompromittiertes Paket in das
  Repository committen; mit `packages: write` Pakete veroeffentlichen. Deshalb stehen
  die Rechte **im Workflow** und nicht als Default auf Repository-Ebene, und `contents`
  steht auf `read` — dieser Workflow committet nichts.

- **`push` vs. `pull_request` vs. `workflow_dispatch`:**
  - `on: push` feuert, wenn Commits auf einen Branch gelangen — gut fuer "pruefe alles,
    was tatsaechlich im Repository landet".
  - `on: pull_request` feuert bei PR-Ereignissen und prueft standardmaessig den
    **Merge-Commit** aus PR-Branch und Zielbranch — also das Ergebnis, das nach dem
    Merge entstuende, nicht nur den PR-Branch fuer sich.
  - `on: workflow_dispatch` ist der manuelle Knopf in der Actions-Oberflaeche. Noetig,
    um einen Lauf ohne Codeaenderung auszuloesen — etwa nach einer geaenderten
    Repository-Einstellung oder zum Vorfuehren.

  **Gewaehlte Paarung:** CI auf `push` **und** `pull_request` (jede Aenderung wird
  geprueft, egal auf welchem Weg sie kommt), Deploy **nur** auf `push: main`. Das ist
  die richtige Kombination, weil `main` den veroeffentlichten Stand darstellt: ein PR
  soll geprueft, aber **nicht** veroeffentlicht werden, sonst koennte ein beliebiger
  Beitrag die Live-Seite ueberschreiben, bevor jemand ihn gesehen hat. Beide haben
  zusaetzlich `workflow_dispatch`, damit ein Lauf auf Zuruf startbar ist.
