# Demo 1 — Historische Einordnung des Web

## Die Entwicklungsstufen

| Ära                          | Etwa       | Wie es funktionierte                                                                                                                                       | Wo der Zustand lag                                     |
| ---------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Statische Dokumente**      | 1991–1995  | Server liefert fertige `.html`-Dateien. Jeder Klick = neue Datei.                                                                                          | Nirgends — es gab keinen                               |
| **Server-generierte Seiten** | 1995–2005  | CGI, PHP, JSP, ASP. Der Server baut das HTML pro Anfrage aus einer Datenbank. Jede Interaktion ist ein vollständiger Seitenwechsel.                        | Auf dem **Server**, in der Session                     |
| **AJAX & jQuery**            | 2005–2010  | `XMLHttpRequest`: Die Seite kann **Teile** nachladen, ohne neu zu laden. jQuery glättet die Browserunterschiede und macht DOM-Manipulation erträglich.     | Geteilt — Server _und_ ein wachsendes Stück im Browser |
| **SPA-Frameworks**           | 2010–2015  | Backbone, Angular, Ember, später React/Vue. Der Server liefert einmal eine fast leere Seite plus JavaScript; die Anwendung läuft im Browser.               | Im **Browser**, im Speicher                            |
| **Hybride Ansätze**          | seit ~2016 | Next.js, Nuxt, Remix, Astro. Serverseitiges Rendern für den ersten Aufruf, danach übernimmt der Client. Streaming, partielle Hydration, Server Components. | Verteilt, bewusst pro Fall entschieden                 |

## Wo diese App steht

**Zwischen der AJAX-Ära und den frühen SPA-Frameworks** — technisch näher an 2008 als an 2016.

Begründung, an konkreten Eigenschaften festgemacht:

1. **Sie ist unstrittig eine Single Page Application.** Es gibt genau ein HTML-Dokument,
   und zwischen den fünf Views wird **nie** neu geladen.
2. **Aber das Routing ist hash-basiert und handgeschrieben.** `#dashboard`, `#evidence` …
   gelesen von einem selbstgebauten `handleHashChange()`, das die Views über CSS-Klassen
   ein- und ausblendet. Kein Router, keine History API.
3. **Das Rendern läuft über String-Konkatenation und `innerHTML`** — genau das Muster,
   das man vor den Frameworks mit jQuery gemacht hat, nur ohne jQuery.
4. **Es gibt kein Komponentenmodell.** Funktionen wie `renderEvidenceCardHTML()` geben
   Strings zurück; sie besitzen weder eigenen Zustand noch eine Identität im DOM.
5. **Der Zustand liegt in globalen Variablen** (`allEvidence`, `currentPage`, …), die
   jede Funktion lesen und schreiben darf.

Das ist die Architektur, die entstand, als man gemerkt hatte, dass Vollneuladen stört —
aber bevor es anerkannte Antworten auf die Folgeprobleme gab.

## Fragen

### Welches Problem löste AJAX, und welches schuf es?

**Gelöst:** Bei einer server-gerenderten Seite war **jede** Interaktion ein vollständiger
Seitenwechsel — neue Anfrage, neues HTML, weißer Blitz, Scrollposition weg, alle
Formulareingaben weg. Für eine Suche, die drei von achtzehn Einträgen filtert, wurde die
komplette Seite neu übertragen und neu aufgebaut.

AJAX erlaubte, **nur die Daten** nachzuladen und **nur den betroffenen Teil** des
Dokuments auszutauschen. jQuery kam dazu, weil `XMLHttpRequest` und DOM-APIs sich
zwischen Internet Explorer und den übrigen Browsern erheblich unterschieden — jQuery war
die Kompatibilitätsschicht, die das erträglich machte.

**Neu geschaffen — drei Probleme, die direkt zu den SPA-Frameworks führten:**

1. **Der Zustand hatte keinen Ort mehr.** Vorher wusste der Server, wie die Seite
   aussieht. Jetzt wussten es nur noch verstreute DOM-Manipulationen. In dieser App sieht
   man das an `viewRendered`, `evidenceViewLoading` und `currentPage` — drei globale
   Flags, die den Zustand der Oberfläche nachbilden, weil es keinen besseren Ort gab.

2. **DOM und Daten liefen auseinander.** Wenn zwei Stellen dasselbe anzeigen, muss jede
   Änderung an **beiden** nachgezogen werden. Genau daran krankt das Dashboard dieser App:
   Es zeigt die Bookmark-Anzahl, aber wenn man in der Evidence-View ein Bookmark setzt,
   bleibt die Kachel stehen.

3. **Navigation war kaputt.** Ohne Vollneuladen änderte sich die URL nicht mehr — der
   Zurück-Button funktionierte nicht, Lesezeichen zeigten immer auf den Startzustand.
   Das Hash-Routing dieser App ist genau die Antwort darauf.

Die SPA-Frameworks griffen alle drei an: ein definierter Ort für den Zustand, ein
automatischer Abgleich zwischen Zustand und DOM, und ein echter Router.

### Was sagt Hash-Routing über das Alter der Entscheidung?

Hash-Routing gehört in die **AJAX-Ära, etwa 2005–2012**.

Der Grund ist technisch präzise: Der Teil der URL nach `#` wird vom Browser **nie an den
Server geschickt**. Man konnte ihn also ändern, ohne eine Anfrage auszulösen — der
einzige Weg, die URL zu einer Ansicht passend zu halten, bevor es etwas Besseres gab.

Das Bessere kam mit der **History API** (`pushState`/`replaceState`), breit verfügbar ab
etwa 2011/2012. Damit ließen sich echte Pfade wie `/evidence` verwenden. Der Preis: Der
Server muss mitspielen und für jeden dieser Pfade dieselbe `index.html` ausliefern,
sonst gibt es beim direkten Aufruf einen 404.

**Was die Wahl hier also verrät:** Entweder stammt die Entscheidung aus dieser Zeit — oder
sie wurde bewusst getroffen, weil die App auf einem rein statischen Host liegt. Und das
ist tatsächlich der Fall: Auf GitHub Pages lässt sich kein Rewrite konfigurieren. Hätte
diese App History-Routing, wäre `khaxo.github.io/mystery-road-awe-2026/evidence` ein 404.

Das ist der ehrlichste Teil der Antwort: **Hash-Routing ist hier technisch veraltet,
aber für den gewählten Hosting-Weg genau richtig.**
