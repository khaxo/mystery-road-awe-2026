# Demo 2 — Server-Side Rendering vs. Client-Side Rendering

## Vergleich

|                                                 | **SSR**                                 | **CSR**                                                                           |
| ----------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| Was der Server auf die erste Anfrage schickt    | Fertiges HTML mit dem sichtbaren Inhalt | Ein nahezu leeres HTML-Gerüst plus ein `<script>`                                 |
| Was der Browser tun muss, bevor man etwas sieht | HTML parsen, CSS laden, zeichnen        | HTML parsen, **JS laden**, **JS ausführen**, **Daten holen**, DOM bauen, zeichnen |
| Zeit bis zum ersten Inhalt                      | kurz                                    | länger — mindestens ein zusätzlicher Roundtrip                                    |
| Zeit bis bedienbar                              | kann länger sein (Hydration)            | fällt mit dem ersten Inhalt zusammen                                              |
| Folgenavigation                                 | neue Anfrage, neues Dokument            | kein Netzwerk nötig, nur Daten; sofortiger Wechsel                                |
| Ohne JavaScript                                 | funktioniert                            | leere Seite                                                                       |
| Suchmaschinen-Crawler                           | sieht den Inhalt direkt                 | muss JS ausführen können                                                          |
| Wo der Zustand lebt                             | Server (Session)                        | Browser (Speicher)                                                                |

## Ein echtes Beispiel: `wikipedia.org` ist SSR

**Belege, nachprüfbar:**

1. **Seitenquelltext anzeigen** (Cmd+U): Der komplette Artikeltext steht im HTML. Man
   kann im Quelltext nach einem Satz aus dem Artikel suchen und findet ihn.
2. **Netzwerk-Tab:** Das erste Dokument hat bereits die volle Größe. Es folgen keine
   `fetch`-Aufrufe, die den Artikelinhalt nachladen.
3. **JavaScript deaktivieren:** Der Artikel ist weiterhin vollständig lesbar.

Zum Gegentest eine CSR-Seite, etwa eine typische React-Anwendung: Im Quelltext steht nur
`<div id="root"></div>`, der sichtbare Text taucht dort **nicht** auf, und im Netzwerk-Tab
sieht man zuerst ein großes JS-Bundle und danach API-Aufrufe.

## Fragen

### Ist diese App SSR oder CSR? Was passiert Schritt für Schritt?

**Eindeutig CSR**, und zwar in beiden Varianten — der Vanilla-Version wie der
React-Version.

Ablauf der React-Version (`react.html`), vom Klick bis zum sichtbaren Dashboard:

1. Browser fordert `react.html` an. Der Server liefert **0,78 kB** — darin steht nur
   `<div id="root"></div>` und ein `<script type="module">`. **Sichtbarer Inhalt: keiner.**
2. Browser parst das HTML, findet das Script, fordert `assets/react-*.js` an — **225 kB**
   (70 kB gzip).
3. Browser lädt und **führt das Bundle aus**. React mountet `<App />` in `#root`.
4. `App` rendert zum ersten Mal. `useCaseData()` hat noch keine Daten → es erscheint
   „Loading case file…". **Das ist der erste sichtbare Inhalt** — und er ist noch leer.
5. Der `useEffect` startet und holt **fünf JSON-Dateien nacheinander**: `case.json`,
   `people.json`, `locations.json`, `evidence.json`, `timeline.json`.
6. Nach der letzten Antwort `setDaten(...)` → React rendert neu → **jetzt** erscheinen
   Kennzahlen, Fortschrittsbalken und die beiden Listen.

Der Benutzer sieht den eigentlichen Inhalt also erst nach: HTML-Request + JS-Request +
JS-Ausführung + **fünf** sequenziellen Daten-Requests. Bei SSR wäre all das schon im
ersten Dokument enthalten gewesen.

Die Vanilla-Version ist dieselbe Kette, nur mit kleinerem Bundle und mit dem Unterschied,
dass das Markup aller fünf Views statisch in `index.html` steht — **sichtbarer Inhalt
entsteht aber auch dort erst durch JavaScript.**

### Was kostet diese Entscheidung konkret?

**Ohne JavaScript: eine komplett leere Seite.** Bei `react.html` ist das wörtlich zu
nehmen — im Dokument steht nur ein leeres `<div>`. Kein Fallback, kein Hinweis, nichts.

**Bei langsamer Verbindung** zahlt man die Kette aus Schritt 1–6 vollständig. Das lässt
sich im Netzwerk-Tab mit „Slow 3G" vorführen: Erst passiert längere Zeit gar nichts,
dann erscheint „Loading case file…", und erst danach die Inhalte. Die 225 kB React
müssen vollständig geladen und ausgeführt sein, bevor überhaupt etwas passieren kann.

**Für einen Suchmaschinen-Crawler** ist nichts indexierbar, der kein JavaScript ausführt.
Moderne Google-Crawler können das, aber in einem zweiten, später eingeplanten Durchgang.
Andere Crawler — und die Vorschau-Generatoren von Messengern und sozialen Netzwerken —
können es meist nicht. Ein geteilter Link auf diese App bekommt daher keine sinnvolle
Vorschau.

**Die ehrliche Einordnung für genau diese App:** Alle drei Kosten sind hier
**verschmerzbar**. Es ist ein internes Ermittlungswerkzeug, kein öffentlich
auffindbarer Inhalt. Niemand muss es ohne JavaScript bedienen, und niemand soll es
googeln. Die Kosten wären ernst, wenn es eine öffentliche Dokumentation oder ein Shop
wäre — hier sind sie es nicht.
