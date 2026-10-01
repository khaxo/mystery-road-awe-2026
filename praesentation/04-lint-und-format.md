# Demo 4 — Lint & Format

**Dauer:** ca. 6 Minuten. **Starke Demo — hier hast du echte Funde.**

---

## Vorbereitung

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && git status
```

Muss `working tree clean` sagen.

---

## Schritt 1 — Zeig die Scripts

```bash
cat package.json
```

**Sag dazu, auf den `scripts`-Block zeigend:**

> "Acht Scripts. `dev` und `preview` für die Server, `build`, `typecheck`, und dann die
> vier für Qualität: `lint`, `lint:fix`, `format` und `format:check`. Jedes davon
> macht etwas Echtes — zeige ich gleich."

---

## Schritt 2 — Zeig die ESLint-Config und sag die Herkunft dazu

```bash
head -30 eslint.config.js
```

**Sag dazu — WICHTIG, das ehrlich sagen:**

> "Die Config basiert auf der Beispieldatei, die nach der VZ-Session bereitgestellt
> wurde. Ich habe sie übernommen, weil sie in einem Punkt deutlich besser war als meine
> erste: sie nutzt **type-aware Linting**."

```bash
grep -n "TypeChecked\|projectService" eslint.config.js
```

**Sag dazu:**

> "`recommendedTypeChecked` plus `projectService` geben ESLint Zugriff auf die
> TypeScript-Typinformationen. Damit sind Regeln möglich, die reine Syntaxanalyse nicht
> leisten kann. Eine Regel wie `no-unnecessary-type-assertion` kann nur dann melden
> 'dieses `as` ist überflüssig', wenn sie weiß, welchen Typ der Wert ohnehin schon hat."

**Eine Ergänzung, die du erwähnen solltest:**

```bash
grep -B4 -A4 "disableTypeChecked" eslint.config.js
```

> "Eine Zeile musste ich ergänzen. Die `TypeChecked`-Configs stehen in der Beispieldatei
> ungefiltert und greifen deshalb auch auf die `.js`-Dateien des Projekts — also
> `eslint.config.js` und `vite.config.js` selbst. Die liegen nicht im TypeScript-Projekt,
> und dann bricht jede typbasierte Regel ab mit 'You have used a rule which requires type
> information'. `disableTypeChecked` ist die von typescript-eslint dafür vorgesehene
> Lösung."

---

## Schritt 3 — Zeig, dass gerade alles sauber ist

```bash
npm run lint && echo "--- keine Ausgabe heißt: keine Fehler ---"
```

```bash
npm run format:check
```

> `All matched files use Prettier code style!`

---

## Schritt 4 — Jetzt baust du live einen Fehler ein

Erstelle eine Wegwerf-Datei:

```bash
cat > js/demo.ts <<'EOF'
export function demo(status: string) {
  var label = "unbekannt";
  if (status == "flagged") {
    label = "markiert";
  }
  const ungenutzt = 42;
  return label;
}
EOF
```

**Sag dazu:**

> "Ich baue vier typische Fehler ein: ein `var` statt `let`, einen doppelten
> Gleichheitsvergleich statt dreifachem, eine ungenutzte Variable — und die Datei ist
> außerdem unsauber formatiert."

### Jetzt linten:

```bash
npm run lint
```

**Zeig die Ausgabe und lies sie vor:**

> "ESLint findet: `no-var`, `eqeqeq`, `no-unused-vars`."

---

## Schritt 5 — DER wichtigste Teil: was `--fix` repariert und was nicht

```bash
npm run lint:fix
```

Dann schau in die Datei:

```bash
cat js/demo.ts
```

**Zeig und sag:**

> "Aus `var label` ist `let label` geworden — repariert.
> Aber: `status == "flagged"` steht **immer noch** da. Und die ungenutzte Variable auch."

```bash
npm run lint
```

**Sag dazu — das ist deine Kernaussage:**

> "Und genau das ist der Grund, warum `lint` und `lint:fix` zwei getrennte Scripts sind.
>
> Eine Regel bekommt genau dann einen Autofixer, wenn es **exakt eine mechanische,
> bedeutungserhaltende** Umschreibung gibt. `var` zu `let` ist rein syntaktisch, das
> Verhalten bleibt identisch — fixbar.
>
> `==` zu `===` ist es **nicht**: `"1" == 1` ist `true`, `"1" === 1` ist `false`. Ein
> Autofix könnte also das Laufzeitverhalten ändern. Deshalb gibt es bewusst keinen.
> Dasselbe bei der ungenutzten Variable: vielleicht ist sie tot — vielleicht ist sie aber
> auch ungenutzt, weil zwei Zeilen weiter ein Tippfehler steckt. Dann wäre die richtige
> Lösung, sie zu _benutzen_, nicht sie zu löschen. ESLint kann das nicht unterscheiden
> und meldet deshalb nur."

**Und wann will man die nicht-fixende Variante?**

> "Vor allem **in der CI**. Dort darf nichts stillschweigend umgeschrieben werden — der
> Lauf soll scheitern, damit ich es sehe. Deshalb steht in meinen Workflows `npm run
lint` und nie `lint:fix`."

---

## Schritt 6 — Jetzt der Formatter

```bash
npm run format:check
```

> Meldet `js/demo.ts` als unsauber formatiert.

```bash
npm run format && cat js/demo.ts
```

**Sag dazu:**

> "Prettier hat nur die Darstellung angefasst — Einrückung, Zeilenumbrüche. Er
> interessiert sich überhaupt nicht dafür, **was** der Code tut. Das ist der Unterschied
> zum Linter: der Linter prüft Semantik und Fehleranfälligkeit, der Formatter nur
> Darstellung. Zwei Werkzeuge, je eine Aufgabe."

### Aufräumen (nicht vergessen!)

```bash
rm js/demo.ts && npm run lint && echo "wieder sauber"
```

---

## Schritt 7 — Ein echter Formatter-Fund aus dem Projekt

```bash
git show 681a8eb:js/views/people.ts | grep -n 'person-role' | head -2
```

**Sag dazu:**

> "Ein konkretes Beispiel aus dem echten Code: Prettier hat hier die Anführungszeichen
> **normalisiert**. Vorher standen doppelte Anführungszeichen außen, und die inneren
> mussten mit Backslash escaped werden. Prettier hat auf einfache Anführungszeichen
> außen gewechselt, damit das Escaping wegfällt — gleiche Bedeutung, besser lesbar."

---

## Erwartete Fragen und deine Antworten

**"Was macht `npm run lint` eigentlich unter der Haube?"**

> "npm liest das Feld `scripts.lint` aus der `package.json` und führt den Befehl in einer
> Shell aus — aber mit einem wichtigen Zusatz: **`node_modules/.bin` steht vorne im
> PATH**. Dort hat npm beim Installieren eine ausführbare Verknüpfung namens `eslint`
> angelegt. Deshalb findet er genau die ESLint-Version dieses Projekts."

**"Würde es auch gehen, wenn ESLint nur global installiert wäre?"**

> "Lokal vermutlich ja, über den globalen PATH — aber mit einer **anderen Version** als
> das Projekt erwartet, also nicht reproduzierbar. Und in der CI gar nicht, denn dort
> läuft nur `npm ci`, und das installiert ausschließlich, was in der `package.json`
> steht. Genau deshalb gehören Werkzeuge in die `devDependencies`."

**"Gib je einen konkreten Fund von Linter und Formatter."**

> "Linter: `no-alert` in `js/data.ts` — im Fehlerpfad des Evidence-Ladens steht ein
> `alert()`, das den Thread blockiert.
> Formatter: die Quote-Normalisierung in `js/views/people.ts`, die ich gerade gezeigt
> habe."
