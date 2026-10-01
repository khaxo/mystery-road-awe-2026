# Drill — bevor du irgendetwas ankreuzt

## Warum dieses Blatt

Die Regeln sagen: **Ablesen vorbereiteter Notizen reicht nicht.** Die Dateien 01–10 sind
Vorbereitung, kein Skript für den Auftritt. Mit diesem Blatt übst du so, dass du sie am
Ende nicht mehr brauchst.

Die Bewertung hat **drei** Teile zu je 10 Punkten:

| Bereich                                  | Was zählt                        | Kannst du vorbereiten? |
| ---------------------------------------- | -------------------------------- | ---------------------- |
| Demonstration & Korrektheit              | läuft es, zeigst du das Richtige | **ja**, voll           |
| Erklärung der Umsetzung & Entscheidungen | _warum_ so und nicht anders      | teilweise              |
| Theorie & Nachfragen                     | unvorhersehbare Fragen           | **nein**               |

Du brauchst 15 von 30 **und** „sufficient understanding in all three areas". Heißt: Mit
perfekter Demo und perfekter Erklärung, aber Blackout bei den Nachfragen, bestehst du
nicht. Der dritte Block ist der, für den dieses Blatt da ist.

**Risiko:** Ein angekreuzter Task, den du nicht verteidigen kannst, kostet **zwei
zusätzliche** erfolgreiche Präsentationen. Nicht ankreuzen kostet nur diesen einen.
Kreuz im Zweifel weniger an.

---

## So übst du (30–45 Minuten, bringt mehr als dreimal Durchlesen)

Pro Demo drei Durchgänge:

1. **Lesen.** Datei 01–10 einmal durch, in Ruhe.
2. **Zuklappen und laut sagen.** Datei weg, und erzähl die Demo laut — an die Wand, ans
   Handy, egal. Stockst du, schlag nach und mach den Durchgang nochmal.
3. **Die Killer-Frage beantworten**, unten pro Demo eine. Ohne nachschauen. Wenn du sie
   nicht in drei bis vier Sätzen beantworten kannst, hast du diese Demo noch nicht.

Der Test für „ich kann das": Du kannst es **in eigenen Worten** sagen, und zwar in einer
anderen Formulierung als in der Datei steht.

---

## Zeiteinteilung für 7–15 Minuten

| Phase          | Zeit    | Was                                                     |
| -------------- | ------- | ------------------------------------------------------- |
| Einordnen      | 1 Min   | Was war die Aufgabe, was ist das Ergebnis               |
| Zeigen         | 3–5 Min | Live: Befehle, Browser, Actions                         |
| Entscheidungen | 2–3 Min | Warum so — inkl. einer bewusst _nicht_ gewählten Option |
| Fragen         | Rest    | Hier wird der dritte Punkteblock vergeben               |

**Rede nicht die vollen 15 Minuten.** Je kürzer dein Teil, desto mehr Zeit für Fragen —
und Fragen sind ein Drittel der Punkte. Fünf bis sieben Minuten eigener Teil ist ideal.

---

## Pro Demo: drei Sätze frei sprechen + die Killer-Frage

Die drei Sätze sind **kein Zitat zum Auswendiglernen**, sondern der Inhalt, den du
abdecken musst. Formulier sie selbst.

### Demo 1 — Package Manager

1. npm gewählt, weil mit Node installiert; Entscheidung über `pnpm import` umkehrbar.
2. Lockfile ist committet, weil `package.json` nur Bereiche nennt und das Lockfile
   exakte Versionen plus Integritäts-Hashes.
3. Vite, ESLint, Prettier, TypeScript sind alle devDependencies — sie laufen zur
   Bauzeit, im `dist/` steckt nichts davon.

**Killer-Frage:** _„Was passiert konkret, wenn das Lockfile nicht committet ist?"_
→ Ein Kollege installiert nächste Woche und bekommt eine neuere Nebenversion. Dein Build
und seiner unterscheiden sich, ohne dass jemand etwas geändert hat. In der CI wäre jeder
Lauf potenziell ein anderer Build — Fehler, die sich nicht reproduzieren lassen.

### Demo 2 — Vite Dev-Server & HMR

1. `data/` und `assets/` mussten nach `public/`, weil ihre Pfade zur Laufzeit als
   Strings zusammengebaut werden und Vite sie statisch nicht sieht.
2. HMR: Änderung kam an, **Zustand blieb** — Marker lebte, Suchfeld gefüllt, 7 Treffer.
3. Ohne den Modul-Split aus Übung 1 gäbe es nur eine Einheit, also nur Komplett-Reload.

**Killer-Frage:** _„Was genau ist NICHT passiert?"_
→ Kein Page-Reload. Beweis: `window.__marker` hat überlebt, das Suchfeld war noch
gefüllt, die Liste zeigte noch 7 statt 18 Einträgen. Alle drei wären bei einem Reload weg.

### Demo 3 — Production Build

1. 18 Module → eine Datei, 55.000 → 22.000 Zeichen, eine Zeile.
2. Content-Hash im Dateinamen löst das Cache-Problem.
3. `vite preview` serviert `dist/`, nicht die Quellen — damit ist der Build geprüft.

**Killer-Frage:** _„Warum deployt man den Dev-Server nie?"_
→ Unminifiziert und ungebündelt, hängt HMR-WebSocket und Datei-Watcher an, transpiliert
bei jedem Request neu, und ist weder auf Last noch auf Sicherheit ausgelegt — er ist
dafür gebaut, auf localhost Quellcode vom Dateisystem zu servieren.

### Demo 4 — Lint & Format

1. Linter prüft Semantik, Formatter nur Darstellung. `eslint-config-prettier` steht
   zuletzt und schaltet die Überschneidung ab.
2. `--fix` repariert `var`→`let`, **nicht** `==`→`===` — letzteres würde das Verhalten
   ändern (`"1" == 1` ist true, `"1" === 1` ist false).
3. Deshalb läuft in der CI `lint` und nie `lint:fix`.

**Killer-Frage:** _„Warum hat ESLint den Fehler aus Demo 10 nicht gefunden?"_
→ Weil es ein Tippfehler in einem String war, syntaktisch völlig korrekt. ESLint ohne
Typinformation sieht nur Struktur. Erst der Compiler weiß, dass dort nur fünf bestimmte
Werte erlaubt sind.

### Demo 5 — TypeScript-Setup

1. `noEmit: true` — Vite transpiliert, `tsc` ist reiner Prüfer.
2. `strict` an (bündelt `strictNullChecks` und `noImplicitAny`),
   `noUncheckedIndexedAccess` bewusst aus und begründet.
3. `build` ist `tsc --noEmit && vite build`, weil Vite selbst keine Typen prüft.

**Killer-Frage:** _„Hätte TypeScript deine Bugs aus Übung 1 gefunden?"_
→ Größtenteils nein, und das differenziert zu beantworten bringt die Punkte: Das
Loading-Flag war typkorrekt `boolean`. Die Array-Zuweisung war typkorrekt — Typen
unterscheiden nicht zwischen „dasselbe Objekt" und „gleichartiges Objekt". Nur der
Schleifenindex wäre gefunden worden, mit genau der Option, die ich ausgelassen habe.

### Demo 6 — Domänentypen

1. `personIds` enthält an einer Stelle `"Nova Byte"` — einen Anzeigenamen zwischen IDs.
2. JS kam durch, weil `evidenceMentionsPerson` **beides** prüft; die Detailansicht zeigt
   den Rohstring, was zufällig richtig aussieht.
3. Zwei Typebenen: `RawEvidence` beschreibt die Datei, Normalisierung beim Laden erzeugt
   das kanonische Modell.

**Killer-Frage:** _„Was können deine Typen NICHT?"_
→ Sie beschreiben eine Annahme über die JSON, sie prüfen sie nicht. `res.json()` liefert
`any`, das `as T` ist eine Behauptung. Fehlt in der Datei ein Feld, kompiliert alles und
die App stürzt zur Laufzeit ab. Nötig wäre Validierung an der Systemgrenze — Guards oder
ein Schema-Validator wie Zod.

### Demo 7 — Migration

1. 272 Fehler → 0, ohne `any` und ohne `!`.
2. Drei Fundklassen: Type Guard für `ViewName`, `getAttribute` liefert `string | null`,
   `select.value` ist beliebiger String.
3. Gemeinsamer Nenner: **das DOM liefert Strings, die Domäne will Unions.**

**Killer-Frage:** _„Zeig mir einen Typfehler, über den du nachdenken musstest."_
→ Sie wollen, dass du im Code navigierst. Übe das: `js/main.ts`, der
`data-view`-Block. Erklär, warum `string | null` nicht `ViewName` ist und warum das ein
echter latenter Bug war, kein Rauschen.

### Demo 8 — CI-Workflow

1. Workflow = Datei, Job = eigene VM, Step = Zeile; Jobs parallel, Steps sequenziell.
2. Fehlschlag und Reparatur sind als zwei echte Läufe belegt.
3. Caching ändert **nur die Geschwindigkeit**, nicht die Korrektheit.

**Killer-Frage:** _„Warum in CI linten, wenn es lokal läuft?"_
→ „Könnte lokal laufen" und „ist gelaufen" sind verschieden. CI prüft jeden Push,
unabhängig von Person, Node-Version und `--no-verify`, und auf einer sauberen Maschine.

### Demo 9 — Deploy-Workflow

1. Zwei Jobs, Übergabe über ein hochgeladenes Artefakt — nötig, weil Jobs nichts teilen.
2. Kein `gh-pages`-Branch: `deploy-pages` weist sich per OIDC aus und aktiviert das
   Artefakt. Kein Deploy-Commit.
3. Erneutes Linten und Bauen, weil der Workflow allein entscheiden können muss.

**Killer-Frage:** _„Was änderst du für Netlify?"_
→ Alles bis `dist/` bleibt. Nur der letzte Abschnitt wird getauscht, plus: statt OIDC ein
Repository-Secret, `pages`/`id-token` entfallen, und `base` in `vite.config.js` anpassen.

### Demo 10 — Trigger, Permissions, Failures

1. Deploy wurde **übersprungen**, nicht zurückgerollt — `needs: build`.
2. Live-Seite blieb mit 200 und altem Bundle online: „fail closed".
3. Keine Secrets nötig; `contents: read`, weil der Workflow nichts committet.

**Killer-Frage:** _„Was ist das Risiko bei zu weit gefassten Permissions?"_
→ Die Rechte gelten für **jeden Schritt**, also auch für jede fremde Action und jedes
npm-Install-Script. Mit `contents: write` könnte ein kompromittiertes Paket in dein
Repository committen.

---

## Welche Demos du ankreuzen solltest

Bewertet nach: Wie gut lässt sich das live zeigen, und wie berechenbar sind die
Nachfragen?

| Demo     | Risiko      | Warum                                                                            |
| -------- | ----------- | -------------------------------------------------------------------------------- |
| 1, 3, 4  | **niedrig** | Abgegrenzte Theorie, alles im Terminal zeigbar, konkrete Funde                   |
| 8, 9, 10 | **niedrig** | Die Actions-Oberfläche erzählt die halbe Geschichte selbst                       |
| 2, 5     | mittel      | Demo 2 musst du live korrekt ausführen; Demo 5 ist Begründungsarbeit             |
| 6        | mittel      | Starke Geschichte, aber Nachfragen zu `interface`/`type` und Laufzeitvalidierung |
| 7        | **hoch**    | „Zeig mir einen Typfehler" heißt: live im Code navigieren                        |

**Empfehlung:** Fang mit **1, 3, 4, 8, 9, 10** an — das sind sechs. Nimm **2 und 6** dazu,
sobald du sie zweimal frei durchgesprochen hast. **5 und 7** nur, wenn du den Code
wirklich gelesen hast, nicht nur die Anleitung.

---

## Am Tag der Präsentation

- Lass die Anleitung **zu**. Höchstens die Befehle auf einem Zettel, nicht die Sätze.
- Server und Browser-Tabs **vorher** öffnen. Nichts wirkt schlechter als Setup-Gefummel.
- Bei einer Frage, die du nicht weißt: _„Das habe ich nicht geprüft. Nachschauen würde
  ich es im Netzwerk-Tab / in den Actions-Logs / mit `git log`."_ Das ist ehrlich und
  zeigt Methodik — raten zeigt das Gegenteil.
- Wenn etwas kaputtgeht: `git checkout main && git reset --hard origin/main`.
