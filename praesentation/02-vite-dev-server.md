# Demo 2 — Vite als Dev-Server (inkl. HMR)

**Dauer:** ca. 5 Minuten. **Das ist eine Live-Demo — hier musst du wirklich klicken.**

---

## Vorbereitung (VOR der Präsentation machen!)

Terminal:

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && npm run dev
```

Es erscheint:

```
  VITE v8.3.2  ready in 394 ms
  ➜  Local:   http://localhost:5173/mystery-road-awe-2026/
```

**Lass dieses Terminal offen.** Öffne die URL im Browser. Öffne dort die DevTools mit
**Cmd + Alt + I** und geh auf den **Console**-Tab.

Du brauchst außerdem die Datei `styles.css` offen in deinem Editor.

---

## Schritt 1 — Zeig, dass die App läuft

Klick durch alle fünf Views: Dashboard → Evidence → People & Locations → Timeline →
Workspace.

**Sag dazu:**

> "Die App läuft jetzt über Vites Dev-Server statt über den einfachen Python-Server aus
> Übung 1. Funktional ist alles identisch — alle fünf Views rendern, die Daten sind
> geladen, die Bilder auch."

---

## Schritt 2 — Erklär die Umstrukturierung

```bash
ls public/
```

**Sag dazu:**

> "Eine Sache musste ich umbauen: `data/` und `assets/` liegen jetzt unter `public/`.
> Der Grund ist, dass beide zur **Laufzeit über zusammengebaute Strings** adressiert
> werden — `fetch("data/case.json")`, und die Avatar-Pfade stehen sogar als String
> **in der JSON-Datei** selbst. Vite kann solche Referenzen statisch nicht erkennen und
> hätte die Dateien nicht in den Build übernommen. Was in `public/` liegt, wird
> unverändert und unter demselben Pfad ausgeliefert."

---

## Schritt 3 — HMR vorführen (DER wichtigste Teil)

### 3a) Zustand aufbauen

1. Geh auf die **Evidence**-View.
2. Tipp ins Suchfeld: **calibration**
3. Es bleiben **7 Treffer** übrig. Zeig das.

**Sag dazu:**

> "Ich baue mir jetzt absichtlich einen Zustand auf: ich bin auf der Evidence-Seite,
> habe 'calibration' gesucht, es sind 7 von 18 Treffern übrig. Diesen Zustand merken
> wir uns."

### 3b) Einen Marker setzen (das ist der Beweis)

Geh in den **Console**-Tab der DevTools und tipp genau das ein, dann Enter:

```js
window.__marker = "ich war hier";
```

**Sag dazu:**

> "Zusätzlich setze ich eine Variable im Browser-Speicher. Die existiert nur in diesem
> einen Seitenaufruf — ein Neuladen würde sie löschen. Sie ist mein Beweismittel."

### 3c) Jetzt die Änderung

Geh in deinen Editor, öffne **`styles.css`**, scroll ganz ans Ende und füge an:

```css
body {
  background-color: #ffe9d6;
}
```

**Speichern.** Dann sofort zum Browser schauen.

**Was passiert:** Der Hintergrund wird orange-beige. Sonst nichts.

### 3d) Die Beweisführung

Zeig im Browser:

- Das Suchfeld steht **immer noch auf "calibration"**
- Es sind **immer noch 7 Treffer**
- Die Seite hat **nicht geblinkt**

Dann in der Console:

```js
window.__marker;
```

Es kommt `"ich war hier"` zurück.

**Sag dazu:**

> "Das ist Hot Module Replacement. Die Änderung ist angekommen — der Hintergrund hat
> die neue Farbe. Aber: es gab **keinen Seiten-Reload**. Mein Marker lebt noch, das
> Suchfeld ist noch gefüllt, die Filterung steht noch auf 7 Treffern.
>
> Bei einem normalen Auto-Refresh wäre der Marker weg, das Suchfeld leer und ich hätte
> wieder alle 18 Einträge. Vite tauscht stattdessen nur das geänderte Modul im laufenden
> Programm aus und lässt den Zustand stehen."

Zeig noch das Terminal, in dem `npm run dev` läuft — dort steht eine Zeile wie:

```
[vite] (client) hmr update /styles.css?direct
```

**Sag dazu:**

> "Und hier im Server-Log steht es auch: `hmr update`, nicht 'page reload'."

### 3e) Ehrliche Einschränkung (das bringt Punkte)

**Sag dazu:**

> "Eine Einschränkung, die ich dazusagen muss: Das gilt hier für CSS. Bei
> JavaScript-Modulen, die keine eigene HMR-Schnittstelle über `import.meta.hot`
> anbieten, fällt Vite auf einen vollen Reload zurück. Der Zustandserhalt gilt also
> nicht automatisch für jede Codeänderung."

### 3f) Aufräumen

Lösch die drei Zeilen wieder aus `styles.css` und speichere. Der Hintergrund wird wieder
normal.

---

## Erwartete Fragen und deine Antworten

**"Was macht Vites Dev-Server, das ein statischer Server nicht macht?"**

> "Vier Dinge. Erstens HMR, das haben wir gerade gesehen. Zweitens löst er
> **Bare-Imports** auf — ich könnte `import x from "lodash"` schreiben statt einen
> relativen Pfad; der Browser kann das nicht, Vite schreibt es um. Drittens
> **transpiliert er on-the-fly**: meine Dateien sind TypeScript, der Browser kann kein
> TypeScript — Vite liefert gültiges JavaScript aus, ohne dass ich vorher baue.
> Viertens bündelt er Abhängigkeiten vor, damit nicht hunderte Einzelrequests entstehen."

**"Warum passt die Modulstruktur aus Übung 1 so gut zu Vite?"**

> "Weil Vites Dev-Server genau darauf aufbaut, dass der Browser `import` und `export`
> selbst versteht. Er liefert jedes Modul einzeln aus und kann bei einer Änderung
> **genau dieses eine** ersetzen.
> Die ursprüngliche Version war eine einzige `app.js` mit über tausend Zeilen — da gab
> es genau eine Einheit. Jede Änderung wäre zwangsläufig ein Komplett-Neuladen gewesen.
> Der Modul-Split ist also die Voraussetzung dafür, dass HMR überhaupt etwas Feineres
> tun kann als neu zu laden."

**"Was genau ist nicht passiert, als du HMR ausgelöst hast?"**

> "Kein Page-Reload. Konkret: `window.__marker` hat überlebt, das Suchfeld war noch
> gefüllt, und die gefilterte Liste stand noch auf 7 statt 18 Einträgen. Alle drei wären
> bei einem Reload weg gewesen."
