# Demo 3 — Production Build & Preview

**Dauer:** ca. 4 Minuten. Terminal + Browser.

---

## Vorbereitung

Falls noch ein Dev-Server läuft: in dem Terminal **Strg + C** drücken.

---

## Schritt 1 — Bauen, live vor Publikum

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && rm -rf dist && npm run build
```

Es erscheint ungefähr:

```
✓ 18 modules transformed.
dist/index.html                 11.72 kB │ gzip: 2.78 kB
dist/assets/index-MB1kIfZ6.css  11.50 kB │ gzip: 2.78 kB
dist/assets/index-BdRY8Q1x.js   22.31 kB │ gzip: 6.57 kB │ map: 83.00 kB
✓ built in 49ms
```

**Sag dazu:**

> "`npm run build` macht bei mir zwei Dinge: zuerst `tsc --noEmit`, also die
> Typprüfung, und erst danach `vite build`. Dazu komme ich bei Demo 5 nochmal.
> Oben steht '18 modules transformed' — aus meinen 13 Quelldateien plus Abhängigkeiten
> wird **eine** JavaScript-Datei."

---

## Schritt 2 — Schau in den `dist/`-Ordner

```bash
find dist -type f | sort
```

**Sag dazu:**

> "Das ist alles, was deployt wird. Oben die gebündelten Assets mit kryptischen Namen,
> unten die JSON-Daten und Bilder, die aus `public/` unverändert übernommen wurden."

---

## Schritt 3 — Der Vorher/Nachher-Vergleich (der stärkste Teil)

```bash
echo "QUELLE:" && cat js/*.ts js/views/*.ts | wc -lc && echo "BUILD:" && cat dist/assets/*.js | wc -lc
```

**Sag dazu, während du auf die Zahlen zeigst:**

> "Links die Quelle: rund 1580 Zeilen in 13 Dateien, etwa 55.000 Zeichen.
> Rechts der Build: **eine Zeile**, etwa 22.000 Zeichen. Also auf 40 Prozent geschrumpft
> und komplett auf einer Zeile."

Dann zeig den Anfang der gebauten Datei:

```bash
head -c 300 dist/assets/*.js; echo
```

**Sag dazu:**

> "So sieht Minification aus: keine Kommentare, kein Whitespace, Variablennamen auf
> einen Buchstaben gekürzt."

---

## Schritt 4 — Nenn die Transformationen

**Sag dazu (zähl an den Fingern ab):**

> "Konkret beobachtet habe ich fünf Transformationen:
>
> 1. **Bundling** — 18 Module zu einer Datei. Im Browser nur noch ein `<script>` statt
>    dreizehn Requests.
> 2. **Minification** — von 55.000 auf 22.000 Zeichen, alles auf einer Zeile. Mit gzip
>    bleiben 6,5 kB übrig.
> 3. **Content-Hash im Dateinamen** — `index-BdRY8Q1x.js`.
> 4. **CSS extrahiert und ebenfalls gehasht** — als eigene Datei.
> 5. **Sourcemap erzeugt** — damit ein Fehler-Stacktrace im Produktionscode trotzdem auf
>    meine TypeScript-Zeile zeigt."

---

## Schritt 5 — Preview starten und beweisen, dass es läuft

```bash
npm run preview
```

Öffne http://localhost:4173/mystery-road-awe-2026/

**Jetzt wirklich klicken:**

1. Evidence → es stehen 18 Karten da
2. Ins Suchfeld "calibration" → 7 Treffer
3. Suchfeld leeren → wieder 18
4. Sortierung auf "Title A–Z" umstellen → Reihenfolge ändert sich
5. People & Locations → die 6 Portraits sind da
6. Timeline → Einträge erscheinen

**Sag dazu:**

> "Das ist jetzt **nicht** der Dev-Server, sondern `vite preview` — der serviert den
> fertigen `dist/`-Ordner, so wie ein echter Webserver es täte. Alles funktioniert:
> Suche, Sortierung, Filter, Bilder."

Öffne die DevTools, Tab **Elements**, such nach `<script`:

**Sag dazu:**

> "Und hier sieht man das Bundling: ein einziges `<script>`-Tag mit dem gehashten
> Dateinamen, statt dreizehn Modul-Requests wie im Dev-Modus."

---

## Erwartete Fragen und deine Antworten

**"Warum haben Produktionsdateien einen Content-Hash im Namen?"**

> "Wegen Caching. Browser und CDNs speichern statische Dateien aggressiv und oft lange.
> Hieße die Datei immer `index.js`, bekämen wiederkehrende Benutzer nach einem
> Deployment die **alte** Version aus ihrem Cache.
> Der Hash wird aus dem Inhalt berechnet. Ändert sich der Inhalt, ändert sich der Name —
> die neue URL ist garantiert ungecacht. Ändert sich nichts, bleibt der Name und die
> Datei darf im Cache bleiben.
> Das kann ich sogar live zeigen: bei meinem letzten Deploy wechselte
> `index-CWYkdHbA.js` auf `index-ByndX9BB.js`, und die CSS-Datei genauso."

**"Warum würdest du nie den Dev-Server deployen?"**

> "Vier Gründe. Er liefert unminifizierten, ungebündelten Code aus — viele Requests,
> große Übertragung. Er hängt einen HMR-WebSocket und einen Datei-Watcher an, die ein
> Endbenutzer nie braucht. Er transpiliert bei **jedem** Request neu statt einmal vorab.
> Und er ist weder auf Last noch auf Sicherheit ausgelegt — er ist dafür gebaut, auf
> `localhost` Quellcode vom Dateisystem zu servieren. Das ist ein Entwicklungswerkzeug,
> kein Webserver."

**"Was ist der Unterschied zwischen `vite` und `vite preview`?"**

> "`vite` ist der Dev-Server: liest meine Quelldateien, transpiliert on-the-fly, macht
> HMR. `vite preview` startet einen simplen statischen Server auf dem bereits gebauten
> `dist/`-Ordner — er baut nichts und beobachtet nichts. Der Zweck ist genau zu prüfen,
> ob der **Produktions-Build** funktioniert, bevor man ihn deployt."
