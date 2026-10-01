# Demo 8 — GitHub Actions: Development-Workflow

**Dauer:** ca. 5 Minuten. **Hauptsächlich Browser.**

---

## Vorbereitung

Browser-Tab offen auf:
**https://github.com/khaxo/mystery-road-awe-2026/actions**

Terminal im Projektordner bereit.

---

## Schritt 1 — Zeig die Workflow-Datei

```bash
cat .github/workflows/ci.yml
```

**Sag dazu, von oben nach unten:**

> "Der Workflow heißt `CI`. Er triggert bei jedem Push auf jeden Branch, bei jedem
> Pull Request gegen `main`, und lässt sich zusätzlich manuell starten.
>
> Darunter die Schritte: Repository auschecken, Node 22 einrichten mit Abhängigkeits-
> Caching, `npm ci`, dann Format-Check, Linten, Typprüfung und zuletzt ein Testbuild.
>
> Er deployt **nichts** — das macht ein zweiter Workflow."

---

## Schritt 2 — Die Begriffe Workflow / Job / Step (danach wird gefragt!)

**Zeig mit dem Finger auf die Datei und sag:**

> "Die drei Ebenen lassen sich hier direkt zeigen:
>
> — **Workflow** ist die ganze Datei, benannt `CI`, mit ihren Triggern ganz oben.
> — **Job** ist `quality`, hier mit `runs-on: ubuntu-latest`. Ein Job läuft auf einer
> **eigenen, frischen virtuellen Maschine**. Jobs laufen standardmäßig parallel und
> teilen kein Dateisystem.
> — **Step** ist ein einzelner Eintrag darunter, zum Beispiel `- name: Linten` mit
> `run: npm run lint`. Steps laufen **nacheinander** im selben Arbeitsverzeichnis, und
> der erste fehlgeschlagene bricht den ganzen Job ab."

---

## Schritt 3 — Die Lauf-Historie im Browser

Geh auf **https://github.com/khaxo/mystery-road-awe-2026/actions**

Links siehst du die beiden Workflows: **CI** und **Deploy to GitHub Pages**.
Klick links auf **CI**.

**Sag dazu:**

> "Hier ist die echte Lauf-Historie. Grüne Haken, und einer mit rotem Kreuz."

---

## Schritt 4 — Der Fehlschlag (dein stärkster Teil)

Klick auf den **roten** Lauf mit dem Titel
_"demo10: deliberate TypeScript error - typo in view name"_.

Direktlink falls du ihn nicht findest:
**https://github.com/khaxo/mystery-road-awe-2026/actions/runs/36889785966**

Klick links auf den Job **"Lint, Format & Types"**. Jetzt siehst du die Schritte.

Klick den fehlgeschlagenen Schritt auf, damit die Logs aufklappen.

**Sag dazu:**

> "Das war ein absichtlicher Commit. Ich habe einen Tippfehler eingebaut: statt
> `"evidence"` stand da `"evidences"` im Plural.
>
> Schau auf die Reihenfolge: Checkout, Node-Setup und `npm ci` sind durchgelaufen,
> Format-Check grün, **Linten grün** — und erst die Typprüfung bricht ab.
>
> Das ist der Punkt: ESLint hat den Fehler **nicht** gefunden, weil der Code syntaktisch
> völlig in Ordnung ist. Es ist ein Tippfehler in einem String. Nur der TypeScript-
> Compiler konnte ihn sehen, weil er weiß, dass `currentPage` nur fünf bestimmte Werte
> annehmen darf."

Im Log steht die Meldung — zeig sie:

```
error TS2820: Type '"evidences"' is not assignable to type 'ViewName'.
              Did you mean '"evidence"'?
```

**Sag dazu:**

> "TypeScript schlägt sogar die Korrektur vor."

---

## Schritt 5 — Die Reparatur

Geh zurück zur CI-Übersicht und klick auf den **nächsten, grünen** Lauf:
_"fix: correct view-name typo and add visible keyboard focus style"_.

**Sag dazu:**

> "Derselbe Workflow, ein Commit später, alle Schritte grün. Das ist das Vorher/Nachher."

---

## Schritt 6 — Live einen Lauf auslösen (falls gefordert)

Die Angabe sagt: _"Be ready to trigger a real workflow run live on request."_ So geht's
**sicher**:

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && git commit --allow-empty -m "demo: trigger a live workflow run" && git push origin main
```

**Sag dazu:**

> "`--allow-empty` erzeugt einen Commit ohne Änderung — ich will ja nur den Workflow
> auslösen, nichts kaputtmachen."

Dann im Browser die Actions-Seite neu laden. Nach ein paar Sekunden erscheint der neue
Lauf mit gelbem Punkt (läuft), nach etwa einer Minute grün.

**Alternative ohne Commit:** Auf der Actions-Seite links auf **CI**, dann rechts der
Knopf **"Run workflow"** → **"Run workflow"**. Das geht, weil im Workflow
`workflow_dispatch` steht.

---

## Erwartete Fragen und deine Antworten

**"Warum Lint und Format in der CI, wenn es doch lokal laufen könnte?"**

> "Weil 'könnte lokal laufen' und 'ist gelaufen' zwei verschiedene Dinge sind.
>
> Die CI ist die einzige Instanz, die **jeden** Push prüft — unabhängig davon, wer
> gepusht hat, mit welcher Node-Version, welcher Editor-Konfiguration, oder ob jemand
> einen Pre-Commit-Hook mit `--no-verify` übergangen hat.
>
> Und sie prüft auf einer **sauberen Maschine**. Das fängt genau die Fehler, die lokal
> durch Reste in `node_modules` oder global installierte Werkzeuge verdeckt sind.
> Lokales Linten ist Komfort — schnelles Feedback. CI-Linten ist die Zusage."

**"Was macht das Dependency-Caching, und was wäre ohne?"**

> "`actions/setup-node` legt den npm-Cache — also die heruntergeladenen Pakete — als
> Artefakt ab. Der Schlüssel setzt sich zusammen aus Betriebssystem, Node-Version und dem
> **Hash der `package-lock.json`**. Ändert sich das Lockfile nicht, werden die Pakete
> nicht erneut aus dem Netz geholt.
>
> Ohne Cache: **korrektheitsmäßig überhaupt kein Unterschied.** `npm ci` installiert so
> oder so exakt die Versionen aus dem Lockfile, und die Integritäts-Hashes werden
> geprüft. Der Cache beeinflusst nur, **woher** die Dateien kommen, nicht ihren Inhalt.
>
> Geschwindigkeitsmäßig: jeder Lauf lädt alle Pakete neu, typisch einige zehn Sekunden
> mehr pro Job. Bei zwei Workflows pro Push also doppelt."

**"Warum `npm ci` und nicht `npm install`?"**

> "`npm ci` installiert strikt nach Lockfile, löscht `node_modules` vorher komplett und
> **bricht ab**, wenn Lockfile und `package.json` auseinanderlaufen. `npm install` darf
> das Lockfile dagegen verändern — in einer CI will ich genau das nicht, dort soll der
> Build reproduzierbar sein."
