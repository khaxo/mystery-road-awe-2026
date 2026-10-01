# Demo 10 — Trigger, Permissions & Failure Modes

**Dauer:** ca. 6 Minuten. **Fast komplett im Browser.**

---

## Vorbereitung

Browser-Tab auf:
**https://github.com/khaxo/mystery-road-awe-2026/actions**

---

## Schritt 1 — Der blockierte Deploy

Geh direkt auf diesen Lauf:
**https://github.com/khaxo/mystery-road-awe-2026/actions/runs/36889785968**

Das ist der **Deploy**-Workflow auf dem Commit mit dem absichtlichen Fehler.

Links siehst du zwei Jobs: **Build** (rotes Kreuz) und **Deploy** (grau/übersprungen).

Klick auf **Build**, dann klapp die Schritte auf.

**Sag dazu, Schritt für Schritt auf den Bildschirm zeigend:**

> "Hier sieht man genau, was ich zeigen wollte:
>
> `npm ci` — grün.
> `Linten` — **grün**.
> `Bauen`, also `tsc --noEmit && vite build` — **rot**.
> `Pages konfigurieren` — übersprungen.
> `dist/ als Artefakt hochladen` — übersprungen.
>
> Und links der zweite Job, **Deploy: komplett übersprungen**.
>
> Der Deploy-Job wurde also nicht ausgeführt und zurückgerollt — er lief **gar nicht
> erst**. Das liegt an `needs: build` in der Workflow-Datei: fällt der Build aus, wird
> der abhängige Job übersprungen."

**Und der wichtige Zusatz:**

> "Beachtenswert ist, dass ESLint grün war. Der Fehler war ein Tippfehler in einem
> String — `"evidences"` statt `"evidence"` — syntaktisch völlig einwandfrei. Nur die
> Typprüfung konnte ihn finden. Genau dafür steht `tsc --noEmit` in meinem Build-Script."

---

## Schritt 2 — Blieb die alte Version online? (sehr wahrscheinliche Frage)

**Sag dazu:**

> "Ich habe das während des fehlgeschlagenen Deploys geprüft: die Live-Seite lieferte
> weiterhin Status 200 und das **alte** Bundle `index-CWYkdHbA.js`.
>
> Die zuletzt erfolgreich veröffentlichte Version bleibt also stehen. Das ist das
> gewünschte Verhalten — man nennt es 'fail closed': ein kaputter Commit darf eine
> funktionierende Seite nicht abschalten.
>
> Der Preis ist, dass die Live-Version still veraltet. Deshalb muss ein fehlgeschlagener
> Lauf sichtbar sein und darf nicht ignoriert werden."

Das kannst du live nachstellen:

```bash
curl -s -o /dev/null -w "Live-Status: %{http_code}\n" https://khaxo.github.io/mystery-road-awe-2026/
```

---

## Schritt 3 — Die Permissions

```bash
grep -n -A8 "^permissions:" .github/workflows/deploy.yml
```

**Sag dazu, Zeile für Zeile:**

> "Drei Berechtigungen, und zwar **im Workflow** definiert, nicht auf Repository-Ebene:
>
> — `contents: read` — Code auschecken. **Nur lesen.** Dieser Workflow committet nichts,
> also braucht er keine Schreibrechte.
> — `pages: write` — auf GitHub Pages veröffentlichen.
> — `id-token: write` — das OIDC-Token, mit dem sich der Deploy-Job beim Pages-Dienst
> ausweist."

**Und die zweite Hälfte der Antwort — zeig es im Browser:**

Geh auf **https://github.com/khaxo/mystery-road-awe-2026/settings/pages**

> "Hier steht die zweite Voraussetzung: **Source = GitHub Actions**."

**Sag dazu ausdrücklich:**

> "Und jetzt das, was oft übersehen wird: **Ich brauche kein einziges Secret.** Die
> Authentifizierung läuft über das automatisch bereitgestellte `GITHUB_TOKEN` plus das
> kurzlebige OIDC-Token. Es gibt keinen dauerhaften API-Schlüssel, der gestohlen werden
> könnte."

---

## Schritt 4 — Das Sicherheitsrisiko bei Überrechtigung

**Sag dazu (gute Antwort, die über das Offensichtliche hinausgeht):**

> "Die `permissions` gelten für das `GITHUB_TOKEN` in **jedem Schritt** des Laufs — also
> auch für jede Third-Party-Action, die ich einbinde, und für jedes npm-Paket, dessen
> Install-Script läuft.
>
> Hätte ich `contents: write` gesetzt, könnte ein kompromittiertes Paket in mein
> Repository committen. Mit `packages: write` könnte es Pakete unter meinem Namen
> veröffentlichen.
>
> Deshalb stehen die Rechte im Workflow und nicht als Default auf Repository-Ebene, und
> deshalb steht `contents` auf `read`: Prinzip der minimalen Rechte."

---

## Schritt 5 — Ein fehlgeschlagenes Log live vorlesen

Die Angabe verlangt: _"be ready to read a failed run's logs live and explain to someone
unfamiliar with it what failed and why."_

Geh zurück auf den roten Lauf, klick den Schritt **"Bauen"** auf und scroll zur
Fehlermeldung.

**Erklär es so, als säße jemand ohne Vorwissen daneben:**

> "Ganz oben steht der Befehl, der ausgeführt wurde: `npm run build`.
>
> Darunter die eigentliche Meldung:
> `js/navigation.ts(20,28): error TS2820: Type '"evidences"' is not assignable to type
'ViewName'.`
>
> Das heißt übersetzt: In der Datei `js/navigation.ts`, Zeile 20, Spalte 28, steht der
> Text `"evidences"`. An dieser Stelle erlaubt mein Code aber nur fünf ganz bestimmte
> Werte — und `"evidences"` ist keiner davon. TypeScript schlägt sogar vor:
> _Did you mean "evidence"?_
>
> Ganz unten steht dann `Process completed with exit code 2`. Exit-Code ungleich null
> heißt für GitHub Actions: der Schritt ist fehlgeschlagen. Daraufhin bricht der ganze
> Job ab, und alle folgenden Schritte werden übersprungen."

---

## Schritt 6 — Die Trigger (sichere Punkte, kommt fast sicher dran)

```bash
grep -n -A6 "^on:" .github/workflows/ci.yml && echo "=== DEPLOY ===" && grep -n -A4 "^on:" .github/workflows/deploy.yml
```

**Sag dazu:**

> "Drei Trigger-Arten:
>
> — **`on: push`** feuert, wenn Commits auf einem Branch landen. Gut für 'prüfe alles,
> was tatsächlich im Repository ankommt'.
> — **`on: pull_request`** feuert bei PR-Ereignissen und prüft standardmäßig den
> **Merge-Commit** aus PR-Branch und Zielbranch — also das Ergebnis, das nach dem
> Merge entstünde, nicht nur den PR-Branch für sich. Das ist ein wichtiger
> Unterschied.
> — **`on: workflow_dispatch`** ist der manuelle Knopf in der Actions-Oberfläche. Den
> braucht man, um einen Lauf ohne Codeänderung auszulösen — etwa nach einer geänderten
> Repository-Einstellung, oder um ihn hier vorzuführen."

**Und die Paarung begründen (das ist die eigentliche Frage):**

> "Mein CI läuft auf **`push` und `pull_request`** — jede Änderung wird geprüft, egal auf
> welchem Weg sie kommt.
>
> Der Deploy läuft **nur auf `push: main`**. Das ist die richtige Kombination, weil
> `main` den veröffentlichten Stand darstellt. Ein Pull Request soll **geprüft**, aber
> **nicht veröffentlicht** werden — sonst könnte ein beliebiger fremder Beitrag die
> Live-Seite überschreiben, bevor sie jemand angeschaut hat.
>
> Beide haben zusätzlich `workflow_dispatch`, damit ich einen Lauf auf Zuruf starten
> kann."

---

## Schritt 7 — Falls du live einen Fehlschlag erzeugen sollst

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && printf 'const x: number = "das ist ein String";\n' >> js/utils.ts && git add -A && git commit -m "demo: deliberate type error" && git push origin main
```

Dann Actions-Seite neu laden und zuschauen, wie `Bauen` rot wird.

**Danach unbedingt wieder aufräumen:**

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && git revert --no-edit HEAD && git push origin main
```

---

## Erwartete Fragen und deine Antworten

**"Wird die alte Version bei einem fehlgeschlagenen Build abgeschaltet?"**

> "Nein, sie bleibt unverändert online — geprüft, Status 200 mit dem alten Bundle. Weil
> `deploy` über `needs: build` am Build hängt, wird bei dessen Ausfall gar kein neues
> Artefakt aktiviert. Das ist gewollt."

**"Welche Secrets braucht dein Deploy?"**

> "Keine. `GITHUB_TOKEN` wird automatisch bereitgestellt, und der Ausweis gegenüber dem
> Pages-Dienst läuft über ein kurzlebiges OIDC-Token. Erst bei einem externen Host wie
> Netlify bräuchte ich ein echtes Repository-Secret."

**"Wo hast du die Permissions konfiguriert?"**

> "An zwei Stellen: die `permissions:`-Sektion in `deploy.yml` für die Rechte des Laufs,
> und in den Repository-Einstellungen unter Pages die Quelle auf 'GitHub Actions'."
