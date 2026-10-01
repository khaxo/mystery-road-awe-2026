# Demo 7 — Vollständige Migration & Typfehler

**Dauer:** ca. 6 Minuten.

---

## Schritt 1 — Die Zahl, die alles sagt

```bash
git show 681a8eb --stat | head -25
```

**Sag dazu:**

> "Alle 13 Module von `.js` auf `.ts`, und `index.html` lädt jetzt `js/main.ts`.
>
> Direkt nach dem Umbenennen hatte ich **272 Compilerfehler**. Am Ende null — ohne ein
> einziges `any` und ohne eine einzige `!`-Assertion."

```bash
npm run typecheck && echo "0 Fehler"
grep -rn ": any\|as any" js/ | grep -v "^js/types.ts" || echo "kein any im Code"
```

---

## Schritt 2 — Die Fehler waren nur vier Ursachen

**Sag dazu:**

> "272 klingt nach viel, es waren aber im Kern nur vier Ursachen:
> — rund 45 mal 'Property existiert nicht auf Typ `never`', weil der State mit leeren
> Arrays initialisiert war und TypeScript daraus `never[]` gefolgert hat
> — rund 55 mal `getElementById` ist `HTMLElement | null`
> — rund 31 mal `.value` gibt es nicht auf `HTMLElement`
> — rund 21 mal `e.target` ist `EventTarget | null`
>
> Nachdem ich den State typisiert hatte, waren es schon nur noch 183."

---

## Schritt 3 — Fund 1: Laufzeitprüfung und Typ hingen nicht zusammen

Zeig erst den alten Code:

```bash
git show 6fe19a0:js/navigation.js | sed -n '13,20p'
```

**Sag dazu:**

> "Der alte Code prüft `hash` gegen eine Liste gültiger Views und weist ihn dann zu.
> Für TypeScript blieb `hash` aber ein beliebiger `string` — die Prüfung existierte, der
> Compiler konnte sie nur nicht _sehen_."

Jetzt die Lösung:

```bash
grep -n -B8 -A4 "function isViewName" js/state.ts
```

**Sag dazu:**

> "Die Lösung ist ein **Type Guard**. Der Rückgabetyp ist nicht `boolean`, sondern
> **`value is ViewName`**. Das verbindet beides: nach dem Aufruf weiß der Compiler, dass
> der Wert zum Union gehört.
>
> **Echter Bug oder Pedanterie?** Im Ist-Zustand Pedanterie — die Liste war korrekt. Aber
> die Liste und der Typ waren zwei unabhängige Wahrheiten, die jederzeit auseinanderlaufen
> konnten. Jetzt gibt es nur noch eine."

---

## Schritt 4 — Fund 2: ein echter latenter Bug

```bash
grep -n -B3 -A4 "data-view" js/main.ts | head -14
```

**Sag dazu:**

> "Der Compiler meldete hier:
> `Argument of type 'string | null' is not assignable to parameter of type 'ViewName'`.
>
> `getAttribute` liefert `string | null`. Fehlt das Attribut am Button oder ist es
> vertippt, wurde bisher `null` oder ein Unsinn-String an `navigateTo` gereicht, der ihn
> in `location.hash` schrieb — und die View hätte stillschweigend **nicht** umgeschaltet.
>
> **Das ist ein realer latenter Bug**, kein Rauschen. Er hängt an einem HTML-Attribut,
> also an Daten außerhalb des TypeScript-Codes, und wäre bei jeder Umbenennung
> aufgetreten."

---

## Schritt 5 — Fund 3: dieselbe Klasse an anderer Stelle

```bash
grep -n -B3 -A3 "isSortOrder" js/views/evidence.ts | head -12
```

**Sag dazu:**

> "`state.evidenceSortOrder = select.value` ergab:
> `Type 'string' is not assignable to type 'EvidenceSortOrder'`.
>
> Ein `<option value>` ist für den Compiler ein beliebiger String. Beide Fälle sagen
> dasselbe: **das DOM liefert Strings, die Domäne will Unions** — und die Umwandlung
> braucht eine sichtbare, prüfende Stelle. Dafür gibt es jetzt `isViewName` und
> `isSortOrder`."

---

## Schritt 6 — Zeig, dass du nicht geschummelt hast

```bash
cat js/dom.ts
```

**Sag dazu:**

> "Statt überall ein Ausrufezeichen hinzuschreiben — die sogenannte
> Non-Null-Assertion, mit der man dem Compiler einfach sagt 'glaub mir, das ist nicht
> null' — habe ich typisierte Helfer gebaut:
> — `mustEl()` für Elemente, die statisch im `index.html` stehen. Fehlt so eines, ist
> das ein Programmierfehler, und dann **soll** es mit klarer Meldung krachen.
> — `el()` für alles, was fehlen darf — insbesondere `#quickViewModal`, das zur Laufzeit
> erzeugt wird.
> — `targetOf()` prüft mit `instanceof HTMLElement`. Das ist eine **echte
> Laufzeitprüfung**, kein Cast: der Compiler verengt den Typ, _weil_ der Code prüft."

---

## Schritt 7 — Verhaltensgleichheit beweisen

```bash
npm run build && npm run preview
```

Öffne http://localhost:4173/mystery-road-awe-2026/ und klick durch:
Evidence (18 Karten) → Suche "calibration" (7) → leeren (18) → Sortierung umstellen →
People (6 Portraits) → Timeline → Workspace.

**Sag dazu:**

> "Eine typsichere App, die sich anders verhält, ist keine erfolgreiche Migration.
> Deshalb habe ich nach der Umstellung den vollständigen Funktionsdurchlauf gegen den
> **Produktions-Build** gefahren: alle fünf Views, Suche, alle vier Sortierkriterien,
> Filter, Bookmark in State und localStorage, Detailansicht, Notizen, Tabs, Modal,
> Workspace, Hypothese. Null Laufzeitfehler, Ergebnisse identisch."

---

## Erwartete Fragen und deine Antworten

**"Wann ist `any` während einer Migration die richtige Wahl?"**

> "Als **temporärer Platzhalter** an einer Grenze, die man gleich darauf ordentlich
> modelliert — oder bei einer wirklich dynamischen Fremdbibliothek ohne Typen.
>
> Meine Linie: An der JSON-Grenze gibt es **genau eine** Stelle mit einer Typbehauptung,
> nämlich `ladeJson<T>()`, und die ist im Code als Behauptung kommentiert. Überall sonst
> wurde modelliert.
>
> Und: `unknown` war mehrfach die bessere Wahl als `any`. `unknown` **erzwingt** eine
> Prüfung, bevor man den Wert benutzen darf. `any` erlaubt alles."

**"Hat die Migration einen echten, vorher unbemerkten Bug aufgedeckt?"** _(Antworte mit
der `navigateTo`-Geschichte — und wenn du Zeit hast, verweise auf Demo 4.)_

> "Ja, den `data-view`-Fall, den ich gerade gezeigt habe. Der war latent und hätte bei
> der nächsten Umbenennung zugeschlagen.
>
> Der größte Fund kam allerdings erst danach, über das type-aware Linting — das zeige ich
> bei Demo 4: die Timeline hat auf der Live-Seite fünfzehnmal `[object Object]` angezeigt.
> Den hat `tsc` **nicht** gefunden, obwohl der Compiler grün war."

**"Was waren die Fälle, die eher Rauschen waren?"**

> "`Date` minus `Date` ist in TypeScript ein Fehler, in JavaScript funktioniert es über
> implizite Konvertierung. Behoben mit `.getTime()` — Pedanterie, aber der explizite
> Code ist besser lesbar.
>
> Und die vielen `getElementById`-Null-Prüfungen. Formal berechtigt, praktisch stehen
> diese Elemente alle statisch im HTML. Deshalb habe ich sie nicht einzeln geprüft,
> sondern das Problem einmal in `dom.ts` gelöst."
