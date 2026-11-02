# Übung 6 — Effects, Data Fetching & a Backend

Dokumentation zu den zehn Demos: was gemacht wurde, wo es steht, und die
Antworten auf die Theoriefragen.

## Commits dieser Übung

| Commit    | Inhalt                                                   | Demos      |
| --------- | -------------------------------------------------------- | ---------- |
| `c49ef97` | Entwicklungs-Backend auf Express                         | 4          |
| `ce6fcc2` | API-Schicht, `useFetch`, `useCaseData` darauf            | 5, 8, 9    |
| `e34ac89` | Dokumenttitel-Effekt, Effekt-Sandbox, drei Datenzustände | 1, 2, 3, 6 |
| `33419cd` | Wettlauf zwischen Anfragen                               | 7          |
| `582248c` | Sandbox beobachtet über die Konsole statt über Zähler    | 1, 2       |

## Was gebaut wurde, in einem Bild

```
public/data/*.json
      │   gelesen von
      ▼
server/index.js                    Express, nur in der Entwicklung
      │   GET /api/evidence?q=&delay=&fail=&empty=
      ▼
react/api/basis.ts                 Welche Quelle gilt? Eine Entscheidung.
react/api/fallApi.ts               Welche URLs, welche Antwortformen?
      │   ladeEvidence(signal)  ->  Promise<Evidence[]>
      ▼
react/shared/hooks/useFetch.ts     Ladezustand, Fehlerzustand, Abbruch
react/shared/hooks/useCaseData.ts  fünf Anfragen -> ein Zustand
      │   { evidence, laedt, fehler, ... }
      ▼
react/App.tsx                      verteilt per Props und Context
      ▼
die Komponenten                    nur Darstellung, kein fetch
```

---

## Demo 1 — Render-Logik gegen Effekte

### Der gefundene Seiteneffekt im Render

Er steht in der Git-Historie, und ich habe ihn in Übung 5 entfernt:

```bash
git show d154270:react/features/dashboard/DashboardView.tsx | sed -n '18,45p'
```

```js
function leseBookmarkAnzahl(): number {
  const roh = localStorage.getItem("remotion_bookmarks");
  ...
}

export function DashboardView({ daten }: Props) {
  const bookmarkAnzahl = leseBookmarkAnzahl();   // ← im Render
```

Das ist wörtlich das Beispiel, das die Aufgabe nennt: „reading `localStorage`
inline in the function body instead of in an effect".

### Und ein zweiter, bei dem das Doppel-Rendern sichtbar schiefgeht

In `/#/sandbox/effects`, Abschnitt 0. Eine Komponente erhöht beim Rendern eine
Variable außerhalb von sich:

```tsx
function SeiteneffektImRender({ klicks }: { klicks: number }) {
  imRender.zaehler += 1; // ← genau diese Zeile
  return <p>… die Variable steht bei {imRender.zaehler}</p>;
}
```

**Gemessen: 2, dann 4, dann 6.** Pro Klick steigt die Zahl um **zwei**, nicht
um eins. Derselbe Code ergäbe im Produktionsbuild 1, 2, 3.

Nebenbei: Der Linter fängt genau diese Zeile ab, mit der Regel
`react-hooks/immutability` — _„Modifying a variable defined outside a component
or hook is not allowed. Consider using an effect."_ Sie ist dort mit
Begründung abgeschaltet, weil die Komponente den Fehler zeigen soll.

### Meine Regel

> **In den Render gehört nur, was aus den Eingaben das Ergebnis berechnet.**
> Alles, was eine Spur hinterlässt oder von außen liest, gehört in einen
> Effekt.
>
> Die Probe: _Könnte ich diese Funktion zehnmal hintereinander aufrufen und
> neunmal das Ergebnis wegwerfen, ohne dass es einen Unterschied macht?_
> Wenn nein, ist es ein Seiteneffekt.

### Frage: Warum darf React mehr als einmal rendern? Was ginge bei deinem Beispiel schief?

**Weil Rendern in React kein Befehl ist, sondern eine Frage.** React fragt:
_Wie sähe die Oberfläche mit diesem Zustand aus?_ Es darf die Frage so oft
stellen, wie es will, und die Antwort auch wegwerfen.

Vier Gelegenheiten, bei denen das passiert:

1. **StrictMode in der Entwicklung** ruft jede Komponente absichtlich doppelt
   auf — genau um solche Effekte aufzudecken.
2. **Ein Elternteil rendert neu**, auch wenn sich an den eigenen Props nichts
   geändert hat.
3. **Ein abgebrochener Render.** React darf mit dem Rendern anfangen,
   feststellen, dass ein dringenderes Update eingetroffen ist, und von vorn
   beginnen.
4. **Zwei Zustandsänderungen in einem Ereignis**, die React nicht zu einem
   Render zusammenfasst.

**Was bei meinen zwei Beispielen schiefgeht, ist nicht dasselbe — und das ist
der interessante Teil.**

Beim **Zähler** ist es offensichtlich: `imRender.zaehler += 1` ist nicht
idempotent. Zweimal gerendert heißt zweimal erhöht. Das Ergebnis hängt davon
ab, wie oft React fragt — und das ist nichts, worüber ich Zusagen habe.

Beim **`localStorage`-Lesen** passiert bei doppeltem Render **nichts**. Lesen
ist idempotent; zweimal lesen liefert zweimal dasselbe. **Und genau deshalb
ist es so lange gut gegangen.**

Der Schaden war ein anderer: Der Wert wurde beim Rendern gelesen und danach
nie wieder. Änderte jemand ein Lesezeichen, während das Dashboard gerendert
war, blieb die Zahl stehen — es gab keinen Grund für React, neu zu rendern,
denn aus Reacts Sicht hatte sich nichts geändert. Der `localStorage` ist für
React unsichtbar.

> **Das ist die Pointe, falls nachgefragt wird:** Ein Seiteneffekt im Render
> kann auf zwei verschiedene Weisen schaden — durch Wiederholung (der Zähler)
> oder durch Unsichtbarkeit für Reacts Abhängigkeitsverfolgung (der
> `localStorage`). Die zweite ist die gefährlichere, weil kein Test sie findet.

### Frage: Ist ein abgeleiteter Wert ein Seiteneffekt?

**Nein, und die Abgrenzung ist genau die Regel von oben.**

Die gefilterte Belegliste aus Übung 5:

```tsx
const sichtbar = waehleEvidence(daten.evidence, daten.people, filter);
```

Das ist eine **Rechnung über die Eingaben**. Sie liest nichts von außen,
schreibt nichts nach außen, und zehnmal ausgeführt ergibt zehnmal dasselbe.
Die Funktion steht in einer Datei ohne React-Import — man kann sie aufrufen,
ohne dass irgendetwas davon erfährt.

**Wie das die Regel schärft:** Nicht „rechnet" gegen „tut etwas" ist die
Trennlinie, sondern **innen gegen außen**. Eine Rechnung über Props und
Zustand ist Render-Logik, auch wenn sie teuer ist. Ein Zugriff auf
`localStorage`, `document.title`, `window`, eine Netzwerkanfrage oder eine
Variable außerhalb der Komponente ist ein Effekt, auch wenn er billig ist.

Und das erklärt, warum Übung 5 so viel abgeleitet hat: Was eine Rechnung sein
kann, braucht keinen Effekt, keine Abhängigkeitsliste und keinen
Aufräum-Mechanismus. Der Ladezustand in `useFetch` ist derselbe Gedanke
nochmal.

---

## Demo 2 — `useEffect`-Modell und Abhängigkeitslisten

### Die drei Varianten, beobachtbar

`/#/sandbox/effects`, Abschnitt 1. Drei Effekte in einer Komponente, jeder mit
einer anderen Abhängigkeitsliste, jeder loggt.

Beobachtet über die **Konsole**, nicht über Zahlen auf dem Bildschirm. Der
Grund gehört selbst zur Sache: Effekte laufen **nach** dem Rendern. Ein
Zähler, den ein Effekt erhöht, ist auf dem Bildschirm immer einen Render alt —
und dieser Zähler darf kein Neu-Rendern auslösen, sonst läuft der Effekt ohne
Abhängigkeitsliste endlos. (Die erste Fassung hatte genau dieses Problem,
siehe Commit `582248c`.)

Die Ausgabe nach zwei Klicks:

```
--- wert: 0 -> 1 ---
  [keine Liste]  laeuft   (wert ist 1)
  [Liste [wert]] laeuft   (wert ist jetzt 1)
--- anderer Zustand: 0 -> 1 ---
  [keine Liste]  laeuft   (wert ist 1)
```

| Variante                | läuft                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| `useEffect(fn)`         | nach **jedem** Render                                             |
| `useEffect(fn, [])`     | **einmal** beim Mounten (in der Entwicklung zweimal — StrictMode) |
| `useEffect(fn, [wert])` | wenn sich `wert` **ändert**                                       |

Der zweite Knopf ändert `wert` nicht. Danach läuft nur der Effekt ohne Liste.

### Der echte, begründete Effekt

`useDokumentTitel` in `react/shared/hooks/useDokumentTitel.ts`, benutzt von
`react/app/Dokumenttitel.tsx` — einer Komponente, die `null` rendert und nur
einen Effekt hält. Dadurch steht die Zuordnung Pfad → Titel an einer Stelle
statt in fünf Ansichten.

**Warum das ein Effekt sein muss:** `document.title` gehört nicht zu dem DOM,
das React verwaltet. Reacts Zuständigkeit endet an seinem Wurzelknoten. Der
Tab-Titel, der `localStorage`, der Browser-Verlauf und ein `window`-Listener
sind in diesem Sinne alle dasselbe — **externe Systeme**. Und genau dafür ist
`useEffect` da: einen Wert aus React in ein externes System schreiben.

Die Aufräumfunktion setzt den vorherigen Titel zurück. In dieser App ist der
Nutzen klein, weil die Komponente immer gerendert ist — die Gewohnheit ist der
Punkt: Ein Effekt, der etwas aufbaut, räumt es auch ab.

> **Nachtrag zu Übung 5, Demo 10.** Dort stand, es gebe genau einen
> `document`-Zugriff in `react/`. Jetzt sind es zwei, und der Unterschied ist
> die Begründung: `main.tsx` greift **innerhalb** der Wurzel zu (der
> Einhängepunkt), `useDokumentTitel` **außerhalb**. Das erste wäre ein Fehler,
> wenn es irgendwo sonst stünde; das zweite ist die vorgesehene Art, mit der
> Außenwelt zu reden.

### Frage: Was vergleicht React in der Abhängigkeitsliste? Was passiert bei einem fehlenden Wert?

**`Object.is`, Element für Element, gegen die Liste des vorherigen Renders.**
Kein tiefer Vergleich — derselbe Vergleich wie bei Zustandsaktualisierungen
(Übung 5, Demo 3).

Daraus folgt eine Falle, die man kennen muss: Ein **Objekt oder Array**, das
im Render neu entsteht, ist bei jedem Render ein neuer Wert. Der Effekt läuft
dann jedes Mal, obwohl inhaltlich alles gleich ist. Deshalb steht in
`useCaseData` die leere Liste als Konstante **außerhalb** der Komponente, und
deshalb macht `useFetch` aus der übergebenen Liste erst eine Zeichenkette.

**Was bei einem fehlenden Wert passiert:** Der Effekt läuft nicht neu, wenn
sich dieser Wert ändert — und arbeitet dann mit dem Wert, den er beim letzten
Lauf aus seiner Closure mitgenommen hat. Das ist ein **veralteter Abschluss**
(stale closure).

Konkret an diesem Projekt: Ließe ich in der Wettlauf-Sandbox `suchbegriff` aus
der Liste weg, würde nach jedem Tippen weiterhin nach dem **ersten**
Suchbegriff gesucht. Die Oberfläche zeigte ein Ergebnis, das zur Eingabe nicht
passt — und zwar dauerhaft, nicht nur kurz.

**Deshalb habe ich in dieser Übung `eslint-plugin-react-hooks` installiert.**
Die Regel `exhaustive-deps` prüft genau das. Sie fand übrigens auch zwei
Dinge, mit denen ich nicht gerechnet hatte: `set-state-in-effect` in meiner
ersten `useFetch`-Fassung und `immutability` in der Demo-1-Komponente.

### Frage: Was ist der Unterschied zwischen `useEffect(fn, [])` und `fn()` im Komponentenkörper?

**Vier Unterschiede, und jeder einzelne macht die zweite Variante für „einmal
ausführen" untauglich.**

1. **Der Zeitpunkt.** `fn()` im Körper läuft **während** des Renderns, also
   bevor das Ergebnis im DOM steht. Der Effekt läuft **nach** dem Malen. Wer
   in `fn()` ein DOM-Element messen will, misst das von gestern.

2. **Die Häufigkeit.** `fn()` läuft bei **jedem** Render, nicht einmal. Und
   wie oft gerendert wird, entscheidet React — siehe Demo 1.

3. **Kein Aufräumen.** `fn()` kann keine Aufräumfunktion zurückgeben. Ein
   Timer oder Listener wäre damit nicht abbaubar.

4. **Reihenfolge und Unterbrechbarkeit.** React darf einen Render abbrechen
   und neu beginnen. Ein `fn()`, das dabei schon gelaufen ist, ist gelaufen —
   es gibt kein Zurück. Effekte laufen erst, wenn der Render festgeschrieben
   ist.

> **Das Missverständnis, das hinter der Frage steckt:** „Der
> Komponentenkörper läuft doch nur einmal, beim ersten Mal." Nein — er läuft
> bei jedem Render. Was nur einmal läuft, ist die **Initialisierung von
> `useState`**, und auch die nur, wenn man die Funktion übergibt
> (`useState(leseNotizen)`) und nicht ihr Ergebnis (`useState(leseNotizen())`).

---

## Demo 3 — Aufräumen: Timer und Abonnements

### Was gebaut wurde

`/#/sandbox/effects`, Abschnitt 2. Zwei Timer, dieselbe Aufgabe, ein
Unterschied:

```tsx
// MIT Aufräumen
useEffect(() => {
  console.log(`[MIT cleanup] Intervall ${marke} gestartet`);
  const id = setInterval(() => setSekunden((v) => v + 1), 1000);
  return () => {
    clearInterval(id);
    console.log(`[MIT cleanup] Intervall ${marke} beendet`);
  };
}, [marke]);
```

```tsx
// OHNE Aufräumen — absichtlich falsch
useEffect(() => {
  setInterval(() => { … }, 1000);
  // kein return
}, [marke]);
```

Drei Knöpfe: ein- und ausblenden (Mount/Unmount), umschalten zwischen den
beiden Fassungen, und die Abhängigkeit `marke` ändern.

**Mit Aufräumen** hat jedes „gestartet" ein „beendet".
**Ohne Aufräumen** hören die Ticks nach dem Ausblenden nicht auf, und jede
Änderung von `marke` legt ein weiteres Intervall obendrauf — die Ticks werden
dichter, statt sich zu ersetzen.

### Frage: Was ruft die Aufräumfunktion auf, und wann? Nenne zwei Situationen.

**React ruft sie auf**, nicht der Browser und nicht mein Code. Und zwar in
**vier** Situationen:

1. **Beim Unmounten.** Die Komponente verschwindet — Routenwechsel,
   Bedingung wird falsch, Elternteil verschwindet.
2. **Vor jedem erneuten Lauf des Effekts.** Ändert sich eine Abhängigkeit,
   räumt React **zuerst** den alten Lauf ab und startet **dann** den neuen.
   Das ist die Reihenfolge, die man kennen muss: aufräumen, dann aufbauen.
3. **Im StrictMode, in der Entwicklung, direkt nach dem ersten Lauf.** React
   mountet absichtlich, räumt ab und mountet wieder — um zu prüfen, ob der
   Effekt das überlebt. Ein Effekt ohne Aufräumen fällt hier sofort auf.
4. **Beim Ersetzen durch Hot Module Replacement**, während der Entwicklung.

> Situation 2 ist die, die man am leichtesten übersieht — und der Grund, warum
> der Timer ohne Aufräumen sich _aufstapelt_, statt nur zu überleben.

### Frage: Welcher beobachtbare Fehler entstünde ohne Aufräumen? Nicht „ein Memory Leak".

**Drei konkrete, und keiner davon ist ein Speicherproblem.**

**Erstens — in dieser App tatsächlich vorhanden, mit `useFetch`:** Ohne den
Abbruch in der Aufräumfunktion gewinnt die ältere Antwort. Gemessen in der
Wettlauf-Sandbox: Im Suchfeld steht `chat`, angezeigt werden die **sieben**
Treffer für `calibration`. Die Oberfläche widerspricht sichtbar der Eingabe.
Das ist Demo 7, und es ist der stärkste Fall, weil man ihn sehen kann.

**Zweitens — der aufgestapelte Timer.** In der Sandbox beobachtbar: Nach
dreimaligem Ändern von `marke` laufen drei Intervalle gleichzeitig. Der
Sekundenzähler springt dann um drei pro Sekunde statt um eins. Für den
Benutzer sieht das nicht nach „Leck" aus, sondern nach „die Uhr geht falsch".

**Drittens — der Zustandswechsel nach dem Unmounten.** Das Intervall ruft
`setSekunden` auf einer Komponente auf, die es nicht mehr gibt. React 18 und
19 werfen dafür keine Warnung mehr, es passiert einfach nichts — der Aufruf
ist still wirkungslos. Gefährlich ist die Variante davon: Ein
`window`-Listener, der nach dem Unmounten noch auf ein `resize` reagiert und
dabei eine Funktion aus einer alten Closure aufruft. Dann arbeitet Code mit
Werten weiter, die seit Minuten überholt sind.

**Und der Zusammenhang zur Vanilla-Version:** Dort gab es
`state.modalCloseListenerCount` — ein Zähler, der mitschrieb, wie viele
Schließen-Listener am Modal hängen. Dass dieser Zähler existieren musste, ist
die Diagnose: Es gab keine Stelle, die Listener wieder abbaut. In React ist
diese Stelle die Aufräumfunktion, und sie ist nicht optional vergessbar — sie
ist der Rückgabewert, der direkt neben dem Aufbau steht.

---

## Demo 4 — Das Backend

### Was gebaut wurde

`server/index.js`, Express, fünf Endpunkte, nur Lesezugriffe:

```
GET /api/case        GET /api/people       GET /api/timeline
GET /api/evidence    GET /api/locations
```

`/api/evidence` kennt zusätzlich `?q=` für eine Serversuche — gebraucht für
Demo 7.

Lesezeichen, Notizen und der Hypothesen-Entwurf bleiben im `localStorage`.
Daran ändert diese Übung nichts.

### Die drei Testschalter

| Parameter     | Wirkung                                             |
| ------------- | --------------------------------------------------- |
| `?delay=2000` | wartet 2000 ms vor der Antwort (gedeckelt auf 20 s) |
| `?fail=1`     | antwortet mit `500` statt mit Daten                 |
| `?empty=1`    | antwortet mit einer leeren Liste                    |

Dazu `API_DELAY` als Grundverzögerung für alle Endpunkte, Standard 250 ms.

Dieselben drei Schalter wirken über die **Adresszeile des Frontends** und
gelten dann für alle Anfragen:

```
react.html?delay=3000#/dashboard
react.html?fail=1#/dashboard
react.html?empty=1#/evidence
```

Geprüft:

```bash
curl -s -o /dev/null -w '%{http_code}\n' 'localhost:3001/api/evidence?fail=1'   # 500
curl -s 'localhost:3001/api/evidence?empty=1'                                   # []
curl -s -o /dev/null -w '%{time_total}\n' 'localhost:3001/api/case?delay=1000'   # 1.002
curl -s 'localhost:3001/api/evidence?q=calibration' | …                          # 7 Treffer
```

### Dev-only, und wie das sichergestellt ist

- `express` steht in **`devDependencies`**, nicht in `dependencies`.
- Der Server ist in keinem GitHub-Actions-Workflow erwähnt.
- `vite build` baut ihn nicht mit — er liegt außerhalb der Einstiegspunkte.
- Dokumentiert in `README.md`, Abschnitt „Entwicklungs-Backend (nur lokal)".

### Frage: Warum künstliche Verzögerung und Fehler, statt einfach die statischen Dateien zu nehmen?

**Weil eine statische Datei nur zwei Zustände kennt: sofort da, oder 404.**

Was sich damit **nicht** überzeugend zeigen lässt:

|                            | mit Datei                      | mit Backend              |
| -------------------------- | ------------------------------ | ------------------------ |
| Ladezustand                | ~2 ms, nie sichtbar            | `?delay=3000`, sichtbar  |
| Fehlerzustand              | nur durch Umbenennen der Datei | `?fail=1`, ein Parameter |
| Leerzustand                | nur durch Leeren der Datei     | `?empty=1`               |
| Wettlauf zwischen Anfragen | **gar nicht**                  | `?delay` **pro Anfrage** |

Die letzte Zeile ist der eigentliche Grund. Ein Wettlauf braucht, dass die
**erste** Anfrage langsam und die **zweite** schnell ist. Eine globale
Einstellung — oder eine Datei — kann das nicht. Deshalb ist die Verzögerung
ein **Query-Parameter** und keine Umgebungsvariable.

Und der zweite Grund, der mir beim Bauen klar wurde: Ohne beobachtbaren
Ladezustand kann man einen Spinner **behaupten**, aber nicht prüfen. Der
Fehler aus Übung 1 — ein Spinner, der im Fehlerfall für immer stehen blieb —
war genau deshalb so lange unentdeckt: Mit einer lokalen Datei schlägt der
Ladevorgang nie fehl.

### Frage: Was ist CORS, und musstest du damit umgehen?

**Ja, und ich habe es absichtlich nicht wegkonfiguriert.**

**Was CORS ist:** Der Browser verhindert per Same-Origin-Policy, dass
JavaScript von einem Origin die Antwort eines anderen **liest**. Origin =
Schema + Host + Port. Vite läuft auf `http://localhost:5173`, mein Server auf
`http://localhost:3001` — gleicher Host, anderer Port, also **anderer
Origin**. Cross-Origin Resource Sharing ist der Mechanismus, mit dem ein
Server das erlaubt.

**Ein Detail, das oft falsch erklärt wird:** Die Anfrage geht trotzdem raus
und der Server antwortet. Nur das **Lesen** der Antwort wird verhindert.
Deshalb sieht man im Netzwerk-Tab eine Antwort und in der Konsole gleichzeitig
einen CORS-Fehler.

**Was ich konfiguriert habe** — eigene Middleware in `server/index.js:52`,
bewusst statt des `cors`-Pakets, damit sichtbar ist, welcher Header
entscheidet:

```js
res.setHeader("Access-Control-Allow-Origin", origin);
res.setHeader("Vary", "Origin");
```

Nur die Vite-Adressen stehen auf der Liste, nicht `*`. Geprüft:

```bash
curl -D - -H "Origin: http://localhost:5173"  … | grep -i access-control
# Access-Control-Allow-Origin: http://localhost:5173

curl -D - -H "Origin: https://boese.example"  … | grep -i access-control
# (nichts)
```

`Vary: Origin` sagt Caches, dass die Antwort vom Origin der Anfrage abhängt —
ohne den Header könnte ein Proxy die Antwort für den falschen Origin
ausliefern.

**Was ich bewusst nicht gemacht habe:** Vite kann mit `server.proxy` Anfragen
an `/api` auf Port 3001 weiterleiten. Dann wäre für den Browser alles derselbe
Origin und **es gäbe kein CORS-Problem**. Das ist in echten Projekten oft die
bessere Wahl.

Ich habe es gelassen, weil der Proxy das Problem versteckt, statt es zu
lösen — und weil die Produktionsumgebung ohnehin anders aussieht. Lieber
einmal den echten Header setzen und wissen, warum.

> **Ein Preflight war nicht nötig.** Für einfache `GET`-Anfragen ohne
> Sonderheader schickt der Browser keine `OPTIONS`-Anfrage vorweg. Mit einem
> `Authorization`-Header oder einem `POST` mit JSON-Body wäre das anders, und
> dann bräuchte der Server auch `Access-Control-Allow-Headers` und `-Methods`.

---

## Demo 5 — Das Backend aus React konsumieren

### Was gemacht wurde

Alle fünf Datensätze kommen aus dem Backend. `useCaseData` ruft dafür fünfmal
`useFetch` auf — `react/shared/hooks/useCaseData.ts:62`.

Die Vanilla-Version unter `index.html` lädt weiterhin direkt die JSON-Dateien;
sie ist davon nicht betroffen.

### Der Produktions-Rückfall

Entschieden in `react/api/basis.ts:30`:

| Modus                         | Quelle                      |
| ----------------------------- | --------------------------- |
| `npm run dev`                 | `http://localhost:3001/api` |
| `npm run dev:static`          | `data/*.json`               |
| `npm run build`, GitHub Pages | `data/*.json`               |

Die Aufgabe sagt: Das Backend wird nicht deployt. Daraus folgt ein Problem,
das sie nicht nennt — zeigen alle Aufrufe auf `localhost:3001`, ist die
veröffentlichte Seite tot.

Das ist keine Notlösung, sondern dieselbe Trennung, die `vite dev` und
`vite build` immer machen. Und nachprüfbar: Der `localhost`-String landet
nicht einmal im Bundle, weil `import.meta.env.DEV` zur Bauzeit ersetzt und der
Zweig wegoptimiert wird.

```bash
npm run build && grep -c "localhost:3001" dist/assets/react-*.js
# 0
```

### Frage: Was passiert, in Reihenfolge, vom Mounten bis zu den Daten auf dem Schirm?

**Neun Schritte. Der entscheidende ist Nummer 8.**

1. **React rendert `App`.** `useCaseData()` läuft, und darin fünfmal
   `useFetch`. Jeder Aufruf richtet seinen `useState` ein — `ergebnis` ist
   `null`.
2. **`laedt` ist `true`**, berechnet als „das gespeicherte Ergebnis passt
   nicht zur aktuellen Marke" — und es gibt noch keines.
3. **React malt** die Ladeansicht. Das ist das erste, was der Benutzer sieht.
4. **Jetzt erst laufen die Effekte.** Fünf Stück, parallel. Jeder legt einen
   `AbortController` an und startet seine `fetch`-Anfrage.
5. **Der Effekt ist fertig** und gibt seine Aufräumfunktion zurück. Die
   Komponente wartet nicht — JavaScript läuft weiter.
   _In der Entwicklung passiert hier StrictMode: React räumt sofort ab und
   mountet erneut. Die ersten fünf Anfragen werden also abgebrochen — im
   Netzwerk-Tab als `ERR_ABORTED` sichtbar — und fünf neue gestartet._
6. **Der Server antwortet** nach der Grundverzögerung.
7. **Die API-Schicht prüft `res.ok`** und parst das JSON. Bei Evidence und
   Timeline normalisiert sie noch.
8. **`setErgebnis(...)` wird aufgerufen.** **Das ist der Auslöser.** Kein
   anderer Schritt bewirkt ein Neu-Rendern. Dass Daten eingetroffen sind,
   erfährt React ausschließlich hierdurch.
9. **React rendert erneut.** `marke` passt jetzt zum gespeicherten Ergebnis,
   also ist `laedt` false und `daten` gefüllt. Die Routen werden gerendert.

> **Die Frage, die hier gern kommt:** „Warum wartet der Effekt nicht?" Weil
> ein Effekt synchron zurückkehren muss — sein Rückgabewert ist die
> Aufräumfunktion. Deshalb steht die `async`-Funktion **innerhalb** des
> Effekts und wird mit `void` aufgerufen: Der Effekt gibt die Aufräumfunktion
> zurück, nicht ein Promise.

### Frage: Was muss die Komponente jetzt verfolgen, was sie vorher nicht brauchte?

**Bis Übung 4 waren die Daten einfach da.** Die Ansicht bekam `daten` als
Prop und rendert. Es gab nur einen Zustand: _Daten vorhanden._

Jetzt gibt es **vier**, und drei davon sind neu:

| Zustand                | vorher | jetzt |
| ---------------------- | ------ | ----- |
| Daten vorhanden        | ja     | ja    |
| wird noch geladen      | —      | ja    |
| fehlgeschlagen         | —      | ja    |
| erfolgreich, aber leer | —      | ja    |

Konkret an Zustandsvariablen: `useFetch` hält ein Ergebnisobjekt mit `daten`
und `fehler` sowie der Marke seiner Anfrage. `laedt` ist daraus abgeleitet.

**Und eine Sorte Zustand, die vorher gar nicht denkbar war: Zeit.** Zwischen
„angefordert" und „da" liegt jetzt eine Spanne, in der der Benutzer klickt,
tippt und navigiert. Daraus folgen die beiden Dinge, die diese Übung
eigentlich ausmachen:

- Eine Anfrage kann **überholt** werden → Demo 7.
- Eine Anfrage kann **irrelevant** werden, weil die Komponente weg ist → die
  Aufräumfunktion.

> **Das Interessante, und die Antwort auf Demo 10, Frage 2:** Nichts davon war
> _konzeptionell_ neu. Auch das `fetch` auf eine lokale Datei konnte
> fehlschlagen, auch es brauchte Zeit, auch es konnte überholt werden. Die
> Vanilla-Version hatte deshalb `state.evidenceViewLoading` und
> `state.latestSearchRequestId` — beides Antworten auf genau diese Probleme,
> bei einer Datenquelle, die nur Millisekunden brauchte. Das Backend hat die
> Probleme nicht geschaffen, nur **sichtbar** gemacht.

---

## Demo 6 — Lade-, Fehler- und Leerzustand

### Die drei Zustände, strukturell verschieden

| Zustand    | Form                                                   | wie ausgelöst |
| ---------- | ------------------------------------------------------ | ------------- |
| **Laden**  | bewegte Anzeige plus Text                              | `?delay=3000` |
| **Fehler** | Überschrift, Meldung mit URL und Status, Quellenangabe | `?fail=1`     |
| **Leer**   | eigene Karte mit Erklärung                             | `?empty=1`    |

Nicht drei Mal „nichts zu sehen", sondern drei verschiedene Formen.

Der Fehlerzustand nennt die Quelle (`BASIS_BESCHREIBUNG`) und gibt den Hinweis
auf `npm run server` — aber **nur**, wenn der Server gar nicht geantwortet
hat. Bei einem 500er läuft er offensichtlich, dann wäre das die falsche
Fehlersuche. Unterscheidungsmerkmal: Antworten mit Statuscode enthalten
„antwortete mit", ein Verbindungsfehler nicht.

### Der Leerzustand ist aufgeteilt

`react/features/evidence/components/EvidenceList.tsx:29` und `:48` — zwei
verschiedene Lagen, zwei verschiedene Texte:

| Lage                                                 | Text                                                                                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datensatz leer (`daten.evidence.length === 0`)       | „Keine Belege im Datensatz. Der Server hat eine erfolgreiche Antwort geschickt, die keine Belege enthält. Das ist kein Fehler — es ist nichts da." |
| Filter schließen alles aus (`sichtbar.length === 0`) | „Kein Treffer. Es gibt Belege, aber keiner passt zu den aktuellen Filtern." + Knopf zum Zurücksetzen                                               |

Vorher sagte die Liste in **beiden** Fällen „No evidence matches the current
filters". Bei leerem Datensatz ist das eine **falsche Auskunft**: Es gibt keine
Filter, es gibt nur keine Daten. Der Benutzer würde am Filter suchen.

Die Reihenfolge der Prüfung ist dabei wichtig — erst „gibt es überhaupt
Daten?", dann „passt etwas zu den Filtern?".

### Frage: Welche Zustandsvariablen unterscheiden die drei?

**Zwei gespeicherte, zwei abgeleitete.**

Gespeichert ist in `useFetch` ein einziges Objekt:

```ts
{
  marke: string;
  daten: T | null;
  fehler: string | null;
}
```

Daraus ergeben sich die vier Lagen:

|                   | `daten` | `fehler` | `laedt` |
| ----------------- | ------- | -------- | ------- |
| lädt              | `null`  | `null`   | `true`  |
| fehlgeschlagen    | `null`  | gesetzt  | `false` |
| erfolgreich       | gesetzt | `null`   | `false` |
| erfolgreich, leer | `[]`    | `null`   | `false` |

**`laedt` ist abgeleitet**, nicht gespeichert: `ergebnis.marke !== marke`.
Also die Frage _Gehört das gespeicherte Ergebnis zu der Anfrage, die gerade
gilt?_

**Und „leer" hat kein eigenes Feld.** Das ist `daten.length === 0` — eine
Eigenschaft der Daten, kein Zustand der Anfrage. Ein viertes Flag `istLeer`
wäre doppelter Zustand, also genau der Fehler aus Übung 5, Demo 9.

### Frage: Wie verhindert dein Zustandsmodell den hängenden Spinner aus Übung 1?

**Es verhindert ihn strukturell, weil es den Fehler nicht formulieren kann.**

Der Fehler damals: `state.evidenceViewLoading` wurde beim Start auf `true`
gesetzt und am Ende auf `false`. Auf dem **Fehlerpfad** fehlte das Zurücksetzen
— der Spinner blieb für immer. Zwei Zuweisungen, die zusammengehören, an zwei
verschiedenen Stellen, und eine davon in einem Zweig, der selten läuft.

Drei Gründe, warum das hier nicht geht:

**Erstens: Es gibt keine Zuweisung, die man vergessen könnte.** `laedt` wird
nirgends gesetzt. Es wird gerechnet, bei jedem Render. Man kann keinen Zweig
übersehen, in dem eine Zuweisung fehlt, wenn es keine Zuweisung gibt.

**Zweitens: Erfolg und Fehler schreiben dasselbe Feld.** Beide Zweige rufen
`setErgebnis({ marke, … })` — einmal mit Daten, einmal mit Fehlertext. Beide
tragen die Marke. Sobald **irgendein** Ergebnis für die aktuelle Marke
vorliegt, ist `laedt` false. Der Fehlerpfad **muss** also den Ladezustand
beenden, weil er dasselbe Feld füllt.

**Drittens: Die Richtung ist umgekehrt.** In der Vanilla-Version war
„nicht mehr laden" eine Aktion, die passieren musste. Hier ist „noch laden"
die **Abwesenheit** eines passenden Ergebnisses. Vergessen kann man eine
Aktion; eine Abwesenheit nicht.

> **Die ehrliche Einschränkung:** Meine _erste_ `useFetch`-Fassung hatte drei
> `useState` und ein `finally`-Block, der `setLaedt(false)` rief — also
> dieselbe Struktur wie der Vanilla-Code, nur mit `finally` statt
> handgeschriebener Doppelzuweisung. Das war schon besser (ein `finally` läuft
> auf beiden Pfaden), aber es war weiterhin eine Zuweisung, die man hätte
> weglassen können. Die abgeleitete Fassung kam erst, als
> `react-hooks/set-state-in-effect` mich auf den synchronen `setLaedt(true)`
> im Effektkörper hinwies. Der Linter hat hier zu einem besseren Entwurf
> geführt, nicht nur zu weniger Warnungen.

### Die UX-Entscheidung, ehrlich (gehört auch zu Demo 10)

**Der Ladezustand sperrt die ganze Anwendung, nicht nur die betroffene
Ansicht.** Solange eine der fünf Anfragen läuft, zeigt `App` den Spinner statt
der Routen.

**Dafür:** Alle fünf Ansichten brauchen alle fünf Datensätze — die Navigation
zeigt Zähler, das Dashboard rechnet über Belege, der Katalog braucht Personen
für den Personenfilter. Ein halb gefülltes Dashboard mit „0 People" wäre
schlechter als ein ehrlicher Spinner: Es sieht nach einem Ergebnis aus.

**Dagegen:** Die langsamste Anfrage bestimmt, wann **alles** erscheint. Mit
einem echten Backend und unterschiedlich teuren Abfragen wäre das falsch — das
Dashboard könnte die Fallübersicht längst zeigen, während die Belege noch
laden.

**Was ich mit mehr Zeit anders machen würde:** Pro Ansicht entscheiden, welche
Datensätze sie wirklich braucht, und den Rest nachladen lassen. Dafür müsste
der Ladezustand aber bei jeder Ansicht ankommen — entweder als weiteres Prop
durch fünf Komponenten oder über einen zweiten Context. Beides hätte in dieser
Übung mehr gekostet, als es gezeigt hätte, und ich hätte eine Entscheidung aus
Übung 5 revidieren müssen (die Falldaten gehen bewusst per Prop nach unten,
weil jede Ansicht sie benutzt).

---

## Demo 7 — Wettlauf zwischen Anfragen und Abbruch

### Der Wettlauf, in einem Klick

`/#/sandbox/race`. Links der handgeschriebene Effekt ohne Abbruch, rechts
`useFetch` — derselbe Hook, den der Rest der App benutzt.

„Wettlauf auslösen" schickt erst eine **langsame** Anfrage nach
`calibration` (3000 ms), dann 300 ms später eine **schnelle** nach `chat`
(150 ms).

**Gemessenes Ergebnis:**

|                 |                                             |
| --------------- | ------------------------------------------- |
| Suchfeld        | `chat`                                      |
| **Ohne Schutz** | **7 Treffer** — die Belege zu `calibration` |
| **Mit Schutz**  | **2 Treffer** — die Belege zu `chat`        |

Links gewinnt also die **ältere** Anfrage. Der Zustand widerspricht sichtbar
dem Suchfeld.

### Warum eine eigene Ansicht

Ein Wettlauf braucht zwei Dinge, die der Belegkatalog absichtlich nicht hat:
eine Anfrage, die von einer **Benutzereingabe** abhängt, und die Möglichkeit,
die erste Anfrage langsam und die zweite schnell zu machen.

Der Katalog filtert im Client, und das bleibt so — die Begründung steht in
CHANGES-5.md, Demo 4, und gilt weiter: Bei 18 Datensätzen ist Filtern im
Client richtig.

**Wichtig:** Die **Korrektur** liegt nicht in der Sandbox, sondern in
`useFetch`. Die Sandbox ist nur die Stelle, an der man das Problem sehen kann.

### Frage: Welche Abfolge lässt das veraltete Ergebnis gewinnen?

**Sechs Schritte. Entscheidend ist, dass Schritt 5 nach Schritt 4 kommt.**

1. `suchbegriff` wird `calibration`, Verzögerung 3000 ms. Der Effekt läuft,
   **Anfrage A** startet.
2. 300 ms später wird `suchbegriff` zu `chat`, Verzögerung 150 ms. Der Zustand
   ändert sich, React rendert.
3. Der Effekt läuft erneut, **Anfrage B** startet. _Ohne Aufräumfunktion
   passiert mit A nichts — sie läuft weiter._
4. Nach ~450 ms antwortet **B**. `setTreffer(…)` mit den `chat`-Belegen. Die
   Anzeige ist **richtig**.
5. Nach ~3300 ms antwortet **A**. `setTreffer(…)` mit den
   `calibration`-Belegen — **und überschreibt B**.
6. Die Anzeige zeigt `calibration`, das Suchfeld sagt `chat`.

**Der Kern in einem Satz:** Der Code nimmt an, dass Antworten in der
Reihenfolge der Anfragen eintreffen. Diese Annahme steht nirgends — sie ist
nur implizit darin, dass jede Antwort unbesehen geschrieben wird.

**Und es ist nicht zeitabhängig oder zufällig.** Bei 3000 gegen 150 ms ist es
reproduzierbar. Genau deshalb ist dieser Fehler in echten Anwendungen so
verbreitet: Bei schnellen Netzen und ähnlichen Antwortzeiten tritt er selten
auf — aber _selten_ heißt nicht _nie_, und bei einem Suchfeld mit einem Tipper
pro 100 ms heißt es _täglich_.

### Frage: `AbortController` bricht die Anfrage ab. Läuft die Aufräumfunktion separat, oder ist das Abbrechen das, was du darin tust?

**Das Abbrechen ist das, was ich darin tue — es gibt nur eine Sache.**

```ts
useEffect(() => {
  const controller = new AbortController();
  void (async () => { … lader(controller.signal) … })();
  return () => {
    controller.abort();   // ← die ganze Aufräumfunktion
  };
}, [marke]);
```

**Die Reihenfolge, wenn sich `marke` ändert:**

1. React ruft die Aufräumfunktion des **alten** Laufs auf → `abort()`.
2. React führt den Effekt für den **neuen** Lauf aus → neuer Controller, neue
   Anfrage.

Zuerst abräumen, dann aufbauen. Deshalb ist die alte Anfrage schon
abgebrochen, bevor die neue startet.

**Und jetzt der Punkt, den die Frage prüft: `abort()` tut zwei Dinge, und sie
sind leicht zu verwechseln.**

1. **Die HTTP-Anfrage wird abgebrochen.** `fetch` lehnt mit einem `AbortError`
   ab, der Browser schließt die Verbindung. Das spart Netzwerk und Serverlast.
2. **Die Antwort kann nicht mehr in den Zustand gelangen.** Der `catch`-Zweig
   erkennt den `AbortError` und schreibt nichts; der Erfolgszweig prüft
   zusätzlich `signal.aborted`.

**Punkt 2 verhindert den Wettlauf, nicht Punkt 1.** Das ist die Antwort, auf
die die Frage hinausläuft.

Punkt 2 allein wäre auch **ohne** `AbortController` erreichbar — mit einem
Flag in der Aufräumfunktion. So machte es `useCaseData` bis Übung 5
(`let aktiv = true`), und so macht es die Vanilla-Version mit
`state.latestSearchRequestId`. Nur **Punkt 1** kann der `AbortController`
zusätzlich.

> **Warum ich beide Riegel habe:** Zwischen „fetch war erfolgreich" und
> „meine Zeile läuft" liegt ein Tick der Ereigniswarteschlange. In dieser
> Lücke kann der Abbruch passieren, ohne dass `fetch` noch ablehnt. Dann ist
> `signal.aborted` true und das Ergebnis wird trotzdem verworfen.
>
> **Und warum der Abbruch kein Fehler ist:** Würde ich den `AbortError` als
> Fehler behandeln, zeigte jeder Tastendruck im Suchfeld kurz eine
> Fehlermeldung. Ein Abbruch bedeutet nicht „es ist schiefgegangen", sondern
> „diese Antwort interessiert niemanden mehr".

---

## Demo 8 — Der wiederverwendbare Hook

### Was extrahiert wurde

`react/shared/hooks/useFetch.ts` — Ladezustand, Fehlerzustand, Abbruch, in
einem Hook.

**Benutzt an zwei Stellen** (die Aufgabe verlangt zwei):

| Stelle                 | Aufruf                           | Abhängigkeiten                |
| ---------------------- | -------------------------------- | ----------------------------- |
| `useCaseData.ts:62–66` | fünfmal, für die fünf Datensätze | `[]` — einmal beim Mounten    |
| `RaceDemo.tsx:80`      | einmal, mit Serversuche          | `[suchbegriff, verzoegerung]` |

### Die Nebenwirkung, die nicht geplant war

Vorher stand in `useCaseData`:

```ts
const caseData = await ladeJson("data/case.json");
const people = await ladeJson("data/people.json");
…
```

Fünf `await` hintereinander — jede Anfrage wartete auf die vorige, die
Gesamtzeit war die **Summe**.

Fünf `useFetch`-Aufrufe sind fünf unabhängige Effekte, die gleichzeitig
starten. Die Gesamtzeit ist das **Maximum**. Bei 250 ms Grundverzögerung rund
250 ms statt rund 1250 ms.

Das war nicht geplant. Es ergab sich daraus, dass jeder Aufruf für sich steht —
die künstliche Reihenfolge konnte beim Extrahieren nicht erhalten bleiben.

### Frage: Was macht etwas zu einem legitimen Custom Hook und nicht zu einer Hilfsfunktion?

**Ein Hook ist eine Funktion, die andere Hooks aufruft. Das ist das ganze
Kriterium.**

`useFetch` ruft `useState` und `useEffect` auf. Damit hängt es an Reacts
Zustandsmaschinerie: Es hat Zustand, der zu **einer** Komponenteninstanz
gehört und ihre Lebensdauer teilt.

Der Gegentest aus demselben Projekt: `waehleEvidence` in `auswahl.ts` ist eine
Hilfsfunktion. Sie ruft keinen Hook auf, hat keinen Zustand, und man kann sie
außerhalb von React aufrufen. Deshalb heißt sie nicht `useEvidence`.

**Die Namenskonvention ist nicht Kosmetik.** Das `use`-Präfix ist, woran
React, der Linter und der Leser erkennen, dass die Regeln unten gelten.

### Die zwei Regeln, die React erzwingt

**1. Hooks nur auf der obersten Ebene.** Nicht in Bedingungen, Schleifen,
`try`-Blöcken oder verschachtelten Funktionen.

**Warum:** React identifiziert Hooks über ihre **Aufrufreihenfolge**, nicht
über Namen. Es führt intern eine Liste pro Komponente: erster `useState`,
zweiter `useState`, erster `useEffect`. Beim nächsten Render muss dieselbe
Reihenfolge entstehen, sonst bekommt der zweite `useState` den Zustand des
ersten.

Konkret: Stünde mein erster `useFetch`-Aufruf in `useCaseData` hinter einem
`if`, würde bei einem Render ohne diesen Zweig der `useState` von `personen`
mit dem Ergebnis von `fall` versorgt.

**2. Hooks nur aus Komponenten oder anderen Hooks.** Nicht aus einem
Ereignis-Handler, nicht aus einer normalen Funktion.

**Warum:** Ein Hook braucht die Komponenteninstanz, zu der sein Zustand
gehört. Außerhalb eines Renders weiß React nicht, welche das wäre.

> `eslint-plugin-react-hooks` prüft beides mit `rules-of-hooks`. Das ist der
> Grund, warum ich es in dieser Übung installiert habe — zusammen mit
> `exhaustive-deps`, das bei mir tatsächlich etwas gefunden hat.

### Frage: Was hat das Extrahieren erspart, und was ließ sich nicht teilen?

**Erspart — fünf Mal dasselbe:**

|                    |                                                              |
| ------------------ | ------------------------------------------------------------ |
| Zustandsverwaltung | `daten`, `fehler`, abgeleitetes `laedt`                      |
| `try`/`catch`      | inklusive der Unterscheidung „Abbruch ist kein Fehler"       |
| `AbortController`  | Anlegen, Signal durchgeben, in der Aufräumfunktion abbrechen |
| die zwei Riegel    | `AbortError` abfangen **und** `signal.aborted` prüfen        |
| die Marken-Logik   | damit ein Ergebnis zur richtigen Anfrage gehört              |

Ohne den Hook stünde das fünfmal in `useCaseData` und ein sechstes Mal in der
Sandbox. Und der Fehler, den der Linter in meiner ersten Fassung fand, wäre
sechsmal drin gewesen.

**Was sich nicht teilen ließ: die Abhängigkeitsliste.**

```ts
useFetch(ladeFall, EINMAL); // []
useFetch((s) => sucheEvidence(q, s, { delay }), [q, delay]); // [q, delay]
```

Der Hook **kann** nicht wissen, wovon der übergebene Lader abhängt. Bei einer
Pfeilfunktion im Aufruf ist der Lader bei jedem Render ein neues Objekt — als
Abhängigkeit also unbrauchbar, der Effekt würde endlos laufen.

Deshalb gilt ein **Vertrag**: In `abhaengigkeiten` steht alles, wovon der
Lader abhängt. Diesen Vertrag kann `exhaustive-deps` nicht prüfen — darum
steht an dieser Stelle eine `eslint-disable`-Zeile, mit der Begründung
daneben.

Es ist die einzige im Produktionscode. Das Projekt hat drei: Die beiden
anderen stehen in den Sandbox-Komponenten, die absichtlich falsch gebaut sind —
`react-hooks/immutability` beim Seiteneffekt im Render (Demo 1) und
`react-hooks/set-state-in-effect` bei der kaputten Wettlauf-Fassung (Demo 7).

Zwei kleinere Dinge blieben ebenfalls spezifisch: Ob ein Fehler **angezeigt**
wird (`useCaseData` nimmt den ersten von fünf; die Sandbox zeigt ihren eigenen)
und was bei leeren Daten passiert (`?? []` gegen einen eigenen Leerzustand).

---

## Demo 9 — Trennung von UI, Anwendungslogik und API-Zugriff

### Die vier Schichten

| Schicht         | Datei                            | weiß über                           | weiß **nicht** über              |
| --------------- | -------------------------------- | ----------------------------------- | -------------------------------- |
| API-Zugriff     | `api/basis.ts`, `api/fallApi.ts` | URLs, Antwortformen, Normalisierung | React, Ladezustände, Darstellung |
| Anwendungslogik | `hooks/useFetch.ts`              | Ladezustand, Fehler, Abbruch        | welche URLs es gibt              |
| Zusammensetzung | `hooks/useCaseData.ts`           | dass es fünf Datensätze gibt        | wie geladen wird                 |
| Darstellung     | alle Komponenten                 | wie etwas aussieht                  | dass es ein Netzwerk gibt        |

`fallApi.ts` enthält keinen React-Import. `useFetch.ts` enthält keine URL.

**Nachweisbar:**

```bash
grep -rn "fetch(" react/
# react/api/fallApi.ts:101:  const res = await fetch(pfad, { signal });
```

Eine Zeile, und sie steht in der API-Schicht.

### Frage: Wenn sich URLs oder Antwortformen ändern — wie viele Dateien?

| Änderung                                               | betroffene Dateien                                | Komponenten? |
| ------------------------------------------------------ | ------------------------------------------------- | ------------ |
| Ein Pfad heißt anders (`/api/evidence` → `/api/items`) | `fallApi.ts`                                      | nein         |
| Anderer Port oder Host                                 | `basis.ts` — oder **keine**, über `VITE_API_BASE` | nein         |
| Authentifizierung kommt dazu                           | `fallApi.ts` (ein Header in `holen`)              | nein         |
| Ein Feld heißt anders in der Antwort                   | `fallApi.ts` **und** `js/types.ts`                | nein         |
| Die Antwort wird eingepackt (`{ data: [...] }`)        | `fallApi.ts`                                      | nein         |

**Keine Komponente in keinem der Fälle.** Das ist der Zweck.

Der vierte Fall ist der interessanteste: Dort sind es **zwei** Dateien, weil
die Normalisierung Raw → kanonisch in `js/types.ts` steht — der Arbeit aus
Übung 2. Streng genommen eine Verletzung der Schichtung; praktisch ist es
richtig, weil die Vanilla-Version dieselbe Normalisierung braucht. Hätte ich
sie in die API-Schicht kopiert, gäbe es zwei Fassungen derselben Regel.

### Frage: Was spricht gegen diese Trennung bei einer so kleinen App?

**Vier Dinge, und ich nehme sie ernst.**

**Erstens: Es sind vier Dateien für fünf GET-Anfragen.** Um zu verstehen, wie
die Belegliste auf den Schirm kommt, muss man `basis.ts`, `fallApi.ts`,
`useFetch.ts` und `useCaseData.ts` lesen. Ein einziges `useEffect` mit `fetch`
in der Komponente wäre in zehn Zeilen lesbar gewesen.

**Zweitens: Die Indirektion verschleiert etwas.** Dass `useCaseData` fünf
parallele Anfragen auslöst, sieht man erst, wenn man weiß, dass jeder
`useFetch`-Aufruf einen eigenen Effekt hat. Beim sequenziellen `await` davor
stand es wortwörtlich da.

**Drittens: Die Schichtung ist an einer Stelle nicht sauber** — die
Normalisierung, siehe oben.

**Viertens: Ich habe eine Abstraktion gebaut, die nur zwei Aufrufer hat.** Die
Regel „abstrahiere beim dritten Mal" wäre hier nicht erfüllt. Die Aufgabe
verlangt zwei Aufrufer; ohne sie hätte ich vielleicht gewartet.

**Wann es Überbau wäre:** Bei einer Anwendung, die an einer Stelle Daten holt.
Dann sind API-Schicht und Hook dasselbe mit zwei Dateinamen.

**Warum ich sie hier trotzdem für richtig halte — drei Gründe:**

Der erste ist nachprüfbar: Der **Produktions-Rückfall** von Backend auf
statische Dateien ist eine Entscheidung, die **irgendwo** fallen muss. Mit
`fetch` in den Komponenten wäre sie an jeder Ladestelle gefallen — bei fünf
Datensätzen fünfmal, und beim sechsten hätte jemand sie vergessen. Es gab also
schon vor dem Refactoring einen Grund für `basis.ts`.

Der zweite ist belegt: Der Fehler, den der Linter in meiner ersten
`useFetch`-Fassung fand, war **einmal** vorhanden und einmal zu korrigieren.
Ohne den Hook wäre er fünfmal da gewesen.

Der dritte ist das Testbarkeitsargument, das ich **nicht** einlösen kann —
dieses Projekt hat keine Tests. Ich führe es trotzdem auf, weil die Form
richtig ist: `waehleEvidence` und `filterReducer` sind reine Funktionen und
wären ohne React testbar. Dass niemand es tut, ändert nichts daran, dass die
Trennung es erlauben würde.

---

## Demo 10 — Datenfluss und eine UX-Entscheidung

### Der Weg eines Datensatzes, Ende zu Ende

Am Beispiel der Belegliste:

```
1  public/data/evidence.json              18 Objekte, "Reviewed" und "unreviewed" gemischt
          │
          │  readFile + JSON.parse
          ▼
2  server/index.js:128                    GET /api/evidence
          │                               ?q= filtert, ?delay= wartet,
          │                               ?fail= antwortet 500, ?empty= gibt []
          │  HTTP, Access-Control-Allow-Origin: http://localhost:5173
          ▼
3  react/api/basis.ts:54                   url("evidence") -> http://localhost:3001/api/evidence
          │                                (im Produktionsbuild: data/evidence.json)
          ▼
4  react/api/fallApi.ts:122                ladeEvidence(signal)
          │                                fetch, res.ok prüfen, JSON.parse,
          │                                normalisiereEvidence() -> Evidence[]
          ▼
5  react/shared/hooks/useFetch.ts:88       useFetch(ladeEvidence, [])
          │                                AbortController, setErgebnis -> Render
          ▼
6  react/shared/hooks/useCaseData.ts:65    belege.daten ?? []
          ▼
7  react/App.tsx:94                        zusammengeführt mit dem Prüfstand
          │                                { ...ev, ...pruefung[ev.id] }
          ▼
8  react/features/evidence/EvidenceView    waehleEvidence(...) filtert und sortiert
          ▼
9  EvidenceList -> EvidenceCard            18 Karten auf dem Schirm
```

### Frage: Was bricht, wenn ein Schritt still aufhört zu passieren?

**Schritt 4, die Prüfung von `res.ok`.** Das ist die Stelle, an der ich am
meisten gelernt habe.

```ts
if (!res.ok) throw new Error(`${pfad} antwortete mit ${res.status}`);
```

**Was passiert, wenn diese Zeile fehlt:** `fetch` lehnt bei einem 500er
**nicht** ab. Das Promise erfüllt sich — mit einer Antwort, die eben einen
Fehlerstatus hat. Ohne die Prüfung läuft der Code also weiter in
`res.json()`.

**Wie ich es merken würde:** Nicht an der Fehlermeldung, die ich erwarte.
Mein Server schickt bei `?fail=1` einen JSON-Körper
(`{"fehler": "Simulierter Serverfehler"}`), also würde `res.json()`
**gelingen**. `normalisiereEvidence` bekäme dann ein Objekt statt eines
Arrays, und `.map` darauf wirft `raw.map is not a function`.

Die Fehlermeldung in der Oberfläche hieße also **„raw.map is not a
function"** statt **„antwortete mit 500 Internal Server Error"**. Ich würde
die Ursache im Normalisierungscode suchen — am falschen Ende der Kette.

Und bei einem Server, der HTML-Fehlerseiten schickt, wäre es noch eine Stufe
irreführender: `res.json()` würde mit `Unexpected token '<'` scheitern, und
das sieht nach einem Parserfehler aus, nicht nach einem Serverfehler.

> **Der allgemeine Satz:** Eine fehlende Prüfung erzeugt keinen Fehler an
> ihrer Stelle. Sie verschiebt ihn nach hinten, wo er nach einem anderen
> Problem aussieht. Genau deshalb steht die Prüfung in der API-Schicht und
> nicht in der Komponente — die Schicht, die die Antwortform kennt, ist die,
> die sie prüfen muss.

**Zwei weitere, kürzer:**

_Fällt Schritt 5 aus — der Abbruch in der Aufräumfunktion:_ Beim Navigieren
weg und zurück laufen die Anfragen weiter. Merkbar im Netzwerk-Tab: Die
`ERR_ABORTED`-Einträge verschwinden, es sind doppelt so viele vollständige
Anfragen. Die Oberfläche sähe zunächst richtig aus — bis man schnell genug
hin- und herklickt.

_Fällt Schritt 7 aus — die Zusammenführung mit dem Prüfstand:_ Eine Änderung
des Prüfstatus in der Detailansicht hätte keine Wirkung mehr. Der Zustand
würde gesetzt, die Anzeige nicht folgen. Merkbar sofort beim Benutzen.

### Die UX-Entscheidung, ehrlich

**Was ich entschieden habe:** Der Fehlerzustand nennt die technische Wahrheit —
die URL, den Statuscode, die Datenquelle. Nicht „Etwas ist schiefgegangen",
sondern:

> `http://localhost:3001/api/case?fail=1 antwortete mit 500 Internal Server Error`
> Quelle: `http://localhost:3001/api`

**Begründung:** Diese Anwendung hat genau einen Benutzertyp — mich und die
Prüfer. Für uns ist die URL die nützlichste Information, die dort stehen kann.
Eine freundliche Formulierung („Die Falldaten sind gerade nicht erreichbar,
bitte später erneut versuchen") wäre für eine echte Anwendung richtig und hier
schlicht weniger brauchbar.

Dazu der Hinweis auf `npm run server` — **aber nur**, wenn der Server gar
nicht geantwortet hat. Bei einem 500er läuft er offensichtlich, und dann wäre
der Hinweis eine falsche Spur.

**Was ich mit mehr Zeit anders machen würde — zwei Dinge:**

**Erstens: ein Wiederholen-Knopf.** Momentan ist der einzige Weg aus dem
Fehlerzustand ein Neuladen der Seite. Ein Knopf, der nur die fehlgeschlagene
Anfrage neu auslöst, wäre wenig Arbeit — `useFetch` bräuchte einen Zähler in
der Abhängigkeitsliste, den der Knopf erhöht. Dass es ihn nicht gibt, ist der
Punkt, der mich am meisten störte.

**Zweitens: die Meldung zweistufig.** Oben ein Satz für Menschen, darunter die
technischen Angaben in einem ausklappbaren Bereich. Das wäre beides, statt
sich zu entscheiden.

### Frage: Was hat der Weg von „statische Dateien" zu „echter Server" erzwungen? Und war etwas davon schon vorher nötig?

**Neu hinzugekommen sind vier Dinge:**

|               |                                                                               |
| ------------- | ----------------------------------------------------------------------------- |
| Ladezustand   | ein beobachtbarer Zeitraum zwischen Anfrage und Antwort                       |
| Fehlerzustand | mit der Unterscheidung „geantwortet mit Fehler" gegen „gar nicht geantwortet" |
| Leerzustand   | als eigener Fall, verschieden vom Fehler                                      |
| Abbruch       | `AbortController` in der Aufräumfunktion                                      |

**Und jetzt der ehrliche Teil: Konzeptionell war nichts davon neu.**

Auch das `fetch` auf eine lokale Datei war asynchron. Auch es konnte
fehlschlagen — bei einem Tippfehler im Pfad, einem fehlenden `public/`-Ordner,
einer defekten JSON-Datei. Auch es brauchte Zeit, nur eben zwei Millisekunden.
Und auch es konnte überholt werden.

**Der Beweis steht in der Vanilla-Version, geschrieben vor dieser Übung:**

| was dort stand                | was es war                                    |
| ----------------------------- | --------------------------------------------- |
| `state.evidenceViewLoading`   | ein Ladezustand                               |
| `state.latestSearchRequestId` | ein Wettlauf-Schutz                           |
| `state.loadingStepsRemaining` | ein Zähler für mehrere parallele Ladevorgänge |

Alle drei sind Antworten auf genau die Probleme dieser Übung — bei einer
Datenquelle, die nur Millisekunden brauchte. Jemand hat sie also für nötig
gehalten, bevor es ein Backend gab.

**Was das Backend geändert hat, ist nicht die Notwendigkeit, sondern die
Sichtbarkeit.** Und das hatte eine konkrete Folge: Der Bug mit dem hängenden
Spinner aus Übung 1 — `evidenceViewLoading` wurde im Fehlerfall nie
zurückgesetzt — konnte dort nur deshalb so lange unentdeckt bleiben, **weil
der Fehlerpfad mit einer lokalen Datei praktisch nie lief**. Der Code war
falsch von Anfang an. Erst ein Server, der auf Zuruf mit 500 antwortet, macht
aus „falsch" ein „sichtbar falsch".

> **Die Lektion, die ich mitnehme:** Eine Fehlerbehandlung, die man nicht
> auslösen kann, ist keine Fehlerbehandlung — sie ist eine Behauptung. Deshalb
> waren die drei Testschalter aus Demo 4 nicht Beiwerk, sondern der Teil, der
> alles andere prüfbar gemacht hat.
