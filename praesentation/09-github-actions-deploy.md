# Demo 9 — GitHub Actions: Deployment-Workflow

**Dauer:** ca. 6 Minuten. **Browser + Terminal. Hier gehst du live.**

---

## Vorbereitung

Zwei Browser-Tabs:

- **Tab A:** https://khaxo.github.io/mystery-road-awe-2026/
- **Tab B:** https://github.com/khaxo/mystery-road-awe-2026/actions

---

## Schritt 1 — Zeig die Live-Seite zuerst

Geh auf **Tab A** und klick durch: Evidence → People & Locations → Timeline → Workspace.

**Sag dazu:**

> "Das ist die deployte App unter `khaxo.github.io`. Sie wird nicht von meinem Rechner
> ausgeliefert — mein Laptop könnte aus sein. Alle 18 Beweisstücke laden, die Suche
> funktioniert, die Portraits sind da, die Timeline rendert."

---

## Schritt 2 — Zeig den Workflow

```bash
cat .github/workflows/deploy.yml
```

**Sag dazu:**

> "Zwei Jobs. Der erste, `build`, macht Checkout, Node-Setup, `npm ci`, dann **Linten**,
> dann **Bauen** — und lädt zum Schluss den `dist/`-Ordner als Artefakt hoch.
>
> Der zweite, `deploy`, hat `needs: build`. Er läuft also **nur**, wenn der erste
> erfolgreich war, und er baut nichts neu — er veröffentlicht nur dieses Artefakt."

---

## Schritt 3 — Der Mechanismus (danach wird gefragt!)

```bash
grep -n -A3 "upload-pages-artifact\|deploy-pages\|permissions" .github/workflows/deploy.yml
```

**Sag dazu:**

> "Der Mechanismus ist **kein** Push auf einen `gh-pages`-Branch — das ist die alte
> Methode. Hier passiert Folgendes:
>
> `actions/upload-pages-artifact` packt den `dist`-Ordner in ein Pages-spezifisches
> Artefakt. Das ist der **Übergabepunkt zwischen den beiden Jobs** — und der ist nötig,
> weil jeder Job auf einer eigenen VM läuft und nichts vom anderen erbt.
>
> `actions/deploy-pages` weist sich dann über ein kurzlebiges **OIDC-Token** gegenüber
> dem Pages-Dienst aus und sagt ihm: aktiviere genau dieses Artefakt als neue Version der
> Seite.
>
> Das Repository wird dabei **nicht verändert** — es gibt keinen Deploy-Commit."

Zeig noch, wo das eingestellt ist. Geh im Browser auf:
**https://github.com/khaxo/mystery-road-awe-2026/settings/pages**

**Sag dazu:**

> "Und hier in den Einstellungen steht die Voraussetzung: **Source = GitHub Actions**,
> nicht 'Deploy from a branch'. Ohne das würde der Workflow ins Leere laufen."

---

## Schritt 4 — LIVE eine Änderung ausliefern (das Highlight)

Notier dir zuerst, was gerade live ist:

```bash
curl -s https://khaxo.github.io/mystery-road-awe-2026/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.css'
```

Schreib dir den Namen auf. Dann mach eine echte, sichtbare Änderung:

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && printf '\n/* Live-Demo */\n.brand-logo { transform: rotate(-3deg); }\n' >> styles.css && npm run format >/dev/null && git add -A && git commit -m "demo: tilt the logo, live via CI" && git push origin main
```

**Sag dazu:**

> "Ich kippe das Logo leicht. Keine manuelle Deploy-Aktion — ich pushe nur."

Geh auf **Tab B** (Actions), lad neu. Der Lauf startet.

**Sag dazu, während er läuft:**

> "Der Workflow läuft jetzt: installiert, lintet, baut, lädt das Artefakt hoch, und der
> zweite Job veröffentlicht es. Dauert etwa anderthalb Minuten."

Wenn beide Jobs grün sind, geh auf **Tab A** und lade **hart neu** mit
**Cmd + Shift + R**. Das Logo ist gekippt.

Dann der Beweis über den Dateinamen:

```bash
curl -s https://khaxo.github.io/mystery-road-awe-2026/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.css'
```

**Sag dazu:**

> "Und hier sieht man den Content-Hash aus Demo 3 in Aktion: die CSS-Datei heißt jetzt
> anders, weil ihr Inhalt sich geändert hat. Alte Besucher bekommen garantiert nicht die
> gecachte Version."

### Danach wieder aufräumen (nach der Präsentation)

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && git revert --no-edit HEAD && git push origin main
```

---

## Erwartete Fragen und deine Antworten

**"Warum lintet und baut der Deploy-Workflow nochmal, wenn CI das schon tut?"**

> "Weil er **für sich allein** entscheiden können muss, ob veröffentlicht werden darf.
>
> Die beiden Workflows laufen unabhängig und parallel. Es gibt keine Garantie, dass CI
> vorher fertig ist — oder dass er überhaupt lief, zum Beispiel bei einem manuellen
> Start über `workflow_dispatch`.
>
> Außerdem braucht der Deploy-Job den `dist`-Ordner ohnehin, und jeder Job startet auf
> einer **frischen VM** und erbt nichts vom CI-Lauf. Und auf 'hat auf meiner Maschine
> funktioniert' zu vertrauen scheidet ganz aus: der Build muss reproduzierbar aus dem
> Repository entstehen, nicht aus einem lokalen Zustand."

**"Was müsstest du ändern, um auf Netlify oder Vercel zu deployen?"**

> "Gleich bliebe alles bis einschließlich `dist/`: Checkout, Node-Setup, `npm ci`,
> `lint`, `build`.
>
> Ausgetauscht würde nur der letzte Abschnitt. Statt `configure-pages`,
> `upload-pages-artifact` und `deploy-pages` käme zum Beispiel
> `netlify-cli deploy --prod --dir=dist`, oder bei einem eigenen Server ein
> `rsync`-Schritt.
>
> Und ein wichtiger Unterschied bei den Berechtigungen: Statt des OIDC-Tokens bräuchte
> ich ein **Repository-Secret** — einen API-Token oder SSH-Key —, und die
> `pages`/`id-token`-Permissions entfielen.
>
> Dazu müsste ich noch `base` in der `vite.config.js` anpassen, wenn der neue Host unter
> einer Domain-Wurzel serviert statt unter einem Unterpfad wie bei GitHub Pages."
