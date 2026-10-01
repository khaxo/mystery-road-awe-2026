# Demo 5 — TypeScript-Setup & erste Konvertierungen

**Dauer:** ca. 5 Minuten. Nur Terminal + Editor.

---

## Schritt 1 — Zeig die `tsconfig.json`

```bash
cat tsconfig.json
```

**Sag dazu, Abschnitt für Abschnitt:**

> "Oben die Grundeinstellungen: Ziel ES2022, Modulauflösung 'bundler'.
>
> Dann **`noEmit: true`** — das ist wichtig. TypeScript erzeugt bei mir **keine**
> Dateien. Das Transpilieren macht Vite über esbuild. `tsc` läuft hier ausschließlich als
> **Typprüfer**."

---

## Schritt 2 — Die Strictness-Entscheidungen (danach wird gefragt!)

Du hast die Datei schon offen von Schritt 1 — zeig einfach auf die beiden Stellen.
Falls du sie hervorheben willst:

```bash
grep -n "strict\|noUnchecked" tsconfig.json
```

**Sag dazu — eingeschaltet:**

> "`strict: true` ist an. Das ist ein Sammelschalter, der mehrere Einzelprüfungen
> aktiviert. Die zwei wichtigsten:
> — **`strictNullChecks`**: `null` und `undefined` sind nicht mehr automatisch in jedem
> Typ enthalten. Wenn etwas `null` sein kann, muss ich es prüfen.
> — **`noImplicitAny`**: ein Parameter, dessen Typ sich nicht erschließen lässt, ist ein
> **Fehler** statt stillschweigend `any`.
>
> Die habe ich angelassen, weil sie den gesamten Nutzen gebracht haben: praktisch alle
> 272 Startfehler der Migration waren entweder 'möglicherweise null' oder 'implizit any'."

**Sag dazu — bewusst ausgelassen (das ist die stärkere Antwort):**

> "Eine Option habe ich bewusst **aus** gelassen: `noUncheckedIndexedAccess`. Die würde
> jeden Zugriff `arr[i]` zu `T | undefined` machen.
>
> Dieser Code durchläuft Arrays fast überall mit klassischen Indexschleifen, deren
> Grenzen direkt aus `array.length` kommen. Die Prüfung hätte dutzende Stellen angefasst,
> ohne einen einzigen echten Fehler zu finden — und hätte mir den Blick auf die Funde
> verstellt, die tatsächlich zählen. Für neu geschriebenen Code mit `map`, `filter` und
> `find` würde ich sie anschalten."

---

## Schritt 3 — Zeig ein konvertiertes kleines Modul

```bash
cat js/utils.ts
```

**Sag dazu:**

> "`utils.ts` war eines der ersten, die ich konvertiert habe — neun kleine, zustandslose
> Hilfsfunktionen. Kein einziges `any`.
>
> Schau dir den Rückgabetyp der Lookups an: **`Evidence | null`**. Das ist eine
> Entscheidung, die der Typ sichtbar macht — ein Lookup **kann** fehlschlagen, und jeder
> Aufrufer muss sich damit auseinandersetzen. Vorher stand da nur `return null`, und ob
> jemand das prüft, war Glückssache."

---

## Schritt 4 — Die Verdrahtung ins Build (danach wird gefragt!)

```bash
grep -A2 '"build"' package.json
```

**Sag dazu:**

> "`build` ist `tsc --noEmit && vite build` — die Typprüfung läuft **vor** dem Bauen.
>
> Das ist notwendig, weil **Vite keine Typen prüft**. esbuild entfernt die
> Typannotationen und transpiliert, aber es validiert sie nicht. Ohne das vorgeschaltete
> `tsc` wäre ein Typfehler stillschweigend durchgebaut worden, und mein Editor wäre die
> einzige Instanz gewesen, die ihn je gesehen hätte."

### Das kannst du sogar beweisen:

```bash
npm run typecheck && echo "0 Fehler"
```

---

## Erwartete Fragen und deine Antworten

**"Was ist der Unterschied zwischen einem Compile-Time-Typfehler und den Laufzeit-Bugs
aus Übung 1?"**

> "Ein Typfehler wird gefunden, **ohne das Programm auszuführen** — allein aus der
> Struktur des Codes. Die Bugs aus Übung 1 brauchten eine laufende App in einem ganz
> bestimmten Zustand: Daten geladen, bestimmte View offen, bestimmte Klickreihenfolge."

**"Hätte TypeScript die Bugs aus Übung 1 gefunden?"** _(Das ist die Lieblingsfrage —
antworte differenziert, nicht pauschal.)_

> "Größtenteils **nein**, und das finde ich das Interessante daran.
> — Bug 1, das Loading-Flag, das nie auf `false` gesetzt wurde: der Typ ist `boolean`,
> der Wert ist `true`. Vollkommen typkorrekt. Das ist ein Logikfehler.
> — Bug 5, `filteredEvidence = allEvidence` statt einer Kopie: beide Seiten sind
> `Evidence[]`, die Zuweisung ist typkorrekt. Typen unterscheiden nicht zwischen
> 'dasselbe Objekt' und 'ein gleichartiges Objekt'.
> — Bug 2, der Schleifenindex, der nach dem Durchlauf auf `undefined` zeigt: **den
> hätte** `noUncheckedIndexedAccess` gefunden — also genau die Option, die ich aus
> gutem Grund aus habe. Ein schönes Beispiel dafür, dass Strictness ein Zielkonflikt
> ist und keine Skala, auf der mehr immer besser ist."

**"Was macht `any`, und warum hast du es vermieden?"**

> "`any` schaltet die Prüfung für diesen Wert **komplett ab** — und zwar ansteckend:
> alles, was daraus abgeleitet wird, ist auch wieder ungeprüft.
> Ein `any` an einer zentralen Stelle, etwa am Rückgabewert von `fetch().json()`, hätte
> die halbe App faktisch ungetypt gelassen, während der Compiler brav '0 Fehler' meldet.
> Ich hatte in diesem Durchgang nicht das Ziel, einen grünen Compiler zu haben — ich
> wollte die Information, die er auf dem Weg dorthin liefert."

**"Nenne zwei Checks, die unter `strict` gebündelt sind."**

> "`strictNullChecks` und `noImplicitAny`. Dazu kommen noch `strictFunctionTypes`,
> `strictBindCallApply` und `strictPropertyInitialization`."
