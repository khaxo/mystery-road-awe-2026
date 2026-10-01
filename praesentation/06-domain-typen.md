# Demo 6 — Typisierung der Domänendaten

**Dauer:** ca. 6 Minuten. **Hier hast du einen sehr starken Fund — nutz ihn.**

---

## Schritt 1 — Zeig die Typdatei

```bash
head -60 js/types.ts
```

**Sag dazu:**

> "`js/types.ts` beschreibt das Datenmodell des Falls: `Evidence`, `Person`,
> `CaseLocation`, `TimelineEvent`, `CaseData`.
>
> Das Besondere sind die **Union-Typen** oben: `EvidenceStatus` ist nicht `string`,
> sondern genau `"unreviewed" | "reviewed" | "flagged"`. Alles andere ist ein
> Compilerfehler."

---

## Schritt 2 — DER Fund: ein Anzeigename zwischen lauter IDs

Führ diesen Befehl aus (er analysiert die echten Daten live):

```bash
python3 -c "
import json
ppl = json.load(open('public/data/people.json'))
ev  = json.load(open('public/data/evidence.json'))
ids = {p['id'] for p in ppl}; namen = {p['name'] for p in ppl}
alle = sorted({x for e in ev for x in e['personIds']})
print('IDs in people.json :', sorted(ids))
print('personIds in evidence.json:', alle)
print()
print('--> davon NAMEN statt IDs:', sorted(x for x in alle if x in namen))
"
```

Ausgabe:

```
IDs in people.json : ['kernel-colt', 'nova-byte', ...]
personIds in evidence.json: ['Nova Byte', 'kernel-colt', 'nova-byte', ...]

--> davon NAMEN statt IDs: ['Nova Byte']
```

**Sag dazu:**

> "Das Feld heißt `personIds`. In `evidence.json` steht an einer Stelle aber
> **'Nova Byte'** — der _Anzeigename_, mit Leerzeichen und Großbuchstaben — zwischen
> lauter kebab-case-IDs. In `timeline.json` kommt das nicht vor, dort sind es
> ausschließlich IDs."

---

## Schritt 3 — Wie JavaScript damit durchgekommen ist

```bash
grep -n -A2 "evidenceMentionsPerson" js/utils.ts | head -8
```

**Sag dazu:**

> "Hier ist die Antwort. Diese Funktion prüft seit jeher **beides**: ob die Liste die ID
> enthält **oder** den Namen.
>
> Das heißt: das Feld hieß `personIds`, enthielt faktisch aber 'IDs **oder** Namen', und
> jede einzelne Lesestelle musste sich selbst darum kümmern — oder eben nicht."

Und jetzt die Stelle, die es _nicht_ tut:

```bash
grep -n -B2 -A3 "findPersonById(ev.personIds" js/views/evidence.ts
```

**Sag dazu:**

> "In der Detailansicht wird `findPersonById` aufgerufen. Für 'Nova Byte' liefert das
> `null`, weil keine Person diese _ID_ hat. Dann greift der Fallback und zeigt den
> Rohstring an.
>
> Und jetzt der Punkt: **das sieht zufällig richtig aus**, weil der Rohwert nun einmal
> der Anzeigename ist. Reiner Glückstreffer. Wäre dort irgendein anderer falscher Wert
> gelandet, hätte der Benutzer ihn genauso ungefiltert zu sehen bekommen."

---

## Schritt 4 — Wozu TypeScript zwingt

**Sag dazu (das ist die Kernantwort der Demo):**

> "`personIds: string[]` zu schreiben wäre ehrlich, aber nutzlos. Sobald ich das
> ordentlich modellieren will, muss ich mich **entscheiden**:
>
> Ist das eine ID-Liste? Dann sind die Daten falsch und gehören korrigiert.
> Oder ist es eine Referenzliste, die beides erlaubt? Dann gehört das in den Typ **und**
> in genau **eine** Auflösungsfunktion.
>
> Die dritte Variante — 'mal so, mal so, und jede Lesestelle rät' — lässt sich gar nicht
> aufschreiben. Genau das war aber der Zustand vorher. TypeScript zwingt einen nicht zur
> _richtigen_ Entscheidung, aber es zwingt einen, **überhaupt eine** zu treffen."

---

## Schritt 5 — Der zweite Fund: Groß-/Kleinschreibung

```bash
python3 -c "
import json
ev = json.load(open('public/data/evidence.json'))
for k in ['type','status','relevance']:
    print(f'{k:10}:', sorted({e[k] for e in ev})[:6])
"
```

Ausgabe zeigt: `'Test-Report'` **und** `'test-report'`, `'Reviewed'` **und**
`'unreviewed'`, `'Unknown'` **und** `'unknown'`.

**Sag dazu:**

> "Dieselben Werte in zwei Schreibweisen. Der JavaScript-Code kam damit durch, weil
> **jede** Vergleichsstelle einzeln `.toLowerCase()` aufgerufen hat — defensiv, aber
> verstreut über die ganze App.
>
> Mit `EvidenceStatus = 'unreviewed' | 'reviewed' | 'flagged'` geht das nicht mehr:
> `'Reviewed'` mit großem R gehört nicht zum Union."

**Zeig die Lösung:**

```bash
grep -n -A12 "export function normalisiereEvidence" js/types.ts
```

> "Die Lösung sind zwei Typebenen. `RawEvidence` mit `string` beschreibt, was
> **tatsächlich in der Datei steht**. `normalisiereEvidence()` wandelt das **einmal beim
> Laden** in das kanonische Modell. Danach darf sich die gesamte App auf den
> Wertebereich verlassen und braucht kein `.toLowerCase()` mehr."

---

## Erwartete Fragen und deine Antworten

**"Gibt es ein Datenproblem, das TypeScript NICHT fangen kann?"** _(Sehr wahrscheinliche
Frage — und du hast eine gute Antwort.)_

> "Ja, und zwar grundsätzlich. Meine Typen beschreiben eine **Annahme** über den Inhalt
> der JSON-Dateien — sie prüfen ihn nicht.
>
> `res.json()` liefert `any`. In meiner Hilfsfunktion `ladeJson<T>()` steht ein
> `as T` — das ist eine **Behauptung**, keine Prüfung. Legt jemand eine `evidence.json`
> ab, bei der das `tags`-Array fehlt, kompiliert bei mir alles fehlerfrei, und die App
> stürzt zur Laufzeit ab, sobald `.tags.join(" ")` aufgerufen wird.
>
> Was zusätzlich nötig wäre: **Validierung zur Laufzeit an der Systemgrenze**. Entweder
> handgeschriebene Guards oder ein Schema-Validator wie Zod, der aus dem Schema zugleich
> den TypeScript-Typ ableitet — dann hat man eine Quelle statt zwei."

Und ein Beispiel, wo du es schon so gemacht hast:

```bash
grep -n -A8 "export function loadNotesFromStorage" js/storage.ts
```

> "Beim `localStorage` habe ich es genau so gelöst: `unknown` statt `any`, dann eine
> echte Prüfung, dann erst die Verwendung. `unknown` **erzwingt** die Prüfung, `any`
> würde sie nur erlauben."

**"`interface` oder `type` — was hast du genommen und warum?"**

> "Beides, nach Zweck. `interface` für die Domänenobjekte wie `Evidence` und `Person`,
> `type` für die Unions wie `EvidenceStatus`.
>
> Der Grund für die Unions ist technisch zwingend: ein Union lässt sich gar nicht als
> `interface` ausdrücken, `interface` kann nur Objektformen.
>
> Für die Objektformen selbst ist es **praktisch egal**. Die Unterschiede: `interface`
> lässt sich nachträglich erweitern, `type` nicht. Das ist hier aber kein Vorteil,
> sondern eher einer der Gründe, warum manche Teams `type` bevorzugen. Meine Wahl ist
> hier Konvention, nicht Technik — und das würde ich auch so sagen."
