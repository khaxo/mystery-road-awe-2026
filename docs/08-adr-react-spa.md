# ADR 001 — SPA mit React für das ReMotion-Ermittlungsportal

**Status:** angenommen (für den Kurskontext)
**Datum:** Oktober 2026
**Entscheidung:** Die Anwendung bleibt eine Single Page Application und wird schrittweise
nach React migriert.

## Kontext

Das Portal ist ein Werkzeug zur Fallanalyse mit fünf Ansichten über einem gemeinsamen,
festen Datenbestand: 18 Beweisstücke, 6 Personen, 6 Orte, 15 Zeitstrahl-Ereignisse. Die
Daten liegen als statische JSON-Dateien vor und ändern sich während einer Sitzung nicht.

Die Benutzer sind Ermittler. Sie **springen ständig zwischen den Ansichten** — vom
Zeitstrahl zu einem Beweisstück, von dort zur beteiligten Person, zurück zum Zeitstrahl.
Sie sammeln dabei eigenen Zustand an: Lesezeichen, Notizen, einen Hypothesen-Entwurf.

Es gibt keinen Anwendungsserver. Ausgeliefert wird über GitHub Pages, also rein statisch.

## Entscheidung und Begründung

**Die SPA-Architektur passt zu diesem Problem.**

1. **Das Nutzungsmuster ist das eigentliche Argument.** Ein Ermittler wechselt in einer
   Sitzung dutzende Male die Ansicht. Als MPA wäre jeder dieser Wechsel eine Anfrage, ein
   neues Dokument, ein weißer Blitz und ein verlorener Zwischenzustand. Das ist das
   Problem, das SPAs lösen — und hier liegt es tatsächlich vor.

2. **Die Daten werden einmal geladen und von allem geteilt.** Alle fünf Ansichten
   arbeiten auf demselben Bestand. Der Zeitstrahl verweist auf Beweisstücke, Beweisstücke
   verweisen auf Personen und Orte. In einer MPA würde jede Seite dieselben JSON-Dateien
   erneut holen.

3. **Es gibt keinen Server, der rendern könnte.** SSR ist nicht bloß unattraktiv, es ist
   mit GitHub Pages technisch nicht verfügbar. Die Alternative wäre ein Static-Site-
   Generator, der 18 Beweisstück-Seiten vorab erzeugt — das wäre möglich, würde aber
   genau die Interaktivität verlieren, um die es geht: Filtern, Sortieren, Suchen,
   Lesezeichen.

4. **Kein Suchmaschinenbedarf.** Der Fallinhalt soll nicht öffentlich auffindbar sein.
   Damit entfällt das gewichtigste Argument gegen CSR.

**React speziell**, weil der Zustandsabgleich hier bereits nachweislich schiefgegangen
ist. Der Dashboard-Bug — die Lesezeichen-Kachel bleibt stehen, wenn man in einer anderen
Ansicht ein Lesezeichen setzt — ist kein Flüchtigkeitsfehler, sondern die unvermeidliche
Folge manueller DOM-Buchführung. React macht diese Fehlerklasse strukturell unmöglich.

## Ehrliche Nachteile

### 1. Die Bundle-Größe. Gemessen, nicht geschätzt.

```
Vanilla-TypeScript-Version :  19,7 kB  (5,75 kB gzip)
React-Version              : 224,9 kB  (70,26 kB gzip)
```

**Das Elffache.** Und das für eine Anwendung mit 18 Datensätzen, die aktuell nur eine
einzige migrierte Ansicht hat. Für die _erste_ Anzeige ist React damit objektiv
langsamer: 225 kB müssen geladen und ausgeführt sein, bevor überhaupt „Loading case
file…" erscheint.

### 2. Zusätzliche Komplexität in der Werkzeugkette

Vorher: Vite und TypeScript. Jetzt zusätzlich `@vitejs/plugin-react`, `@types/react`,
`@types/react-dom`, `jsx: "react-jsx"` in der `tsconfig.json`, und ESLint musste auf
`.tsx` erweitert werden. Dazu React und React-DOM als erste echte Laufzeit-
abhängigkeiten — vorher hatte das Projekt **null**.

### 3. Eine eigene Klasse von Fehlern kommt dazu

Der manuelle Render-Cache verschwindet, dafür entstehen neue Fallen: fehlende
Abhängigkeiten in `useEffect`, instabile `key`s, Seiteneffekte im Render-Durchlauf,
unnötige Neu-Renders ganzer Teilbäume. Mein eigener Code enthält bereits eine solche
Stelle: `App.tsx` liest den `localStorage` während des Renderns — funktioniert, ist aber
nicht sauber und in `docs/05` dokumentiert.

### 4. Zwei parallele Anwendungen während der Migration

`index.html` und `react.html` existieren nebeneinander. Das ist beabsichtigt, aber es
bedeutet vorübergehend doppelten Pflegeaufwand und doppelte Auslieferung.

### 5. Für diese Datenmenge ist React überdimensioniert

18 Einträge. Die Vanilla-Version baut die gesamte Liste per `innerHTML` neu — bei 18
Karten ist das für den Benutzer nicht wahrnehmbar langsam. Der Gewinn durch den
Virtual DOM ist hier **Korrektheit, nicht Geschwindigkeit.** Das sollte man nicht
umgekehrt verkaufen.

## Fragen

### Was verlöre man mit server-gerendertem Vanilla-HTML/JS?

- **Die sofortige Navigation.** Jeder Ansichtswechsel würde zu einer Anfrage. Beim
  beschriebenen Sprungverhalten ist das der spürbarste Verlust.
- **Den geteilten Datenbestand.** Jede Seite müsste ihre Daten neu beschaffen.
- **Den Zwischenzustand.** Ein halb ausgefüllter Hypothesen-Entwurf überlebt keinen
  Seitenwechsel, es sei denn, man legt ihn bei jedem Schritt im `localStorage` oder auf
  dem Server ab.
- **Die Möglichkeit, rein statisch auszuliefern.** Serverseitiges Rendern braucht einen
  Server.

**Gewonnen hätte man:** sofort sichtbaren Inhalt, Funktionieren ohne JavaScript,
Indexierbarkeit, und ein drastisch kleineres Bundle.

### Was verliert man durch React gegenüber einem leichteren SPA-Ansatz?

Gegen **Vanilla JS mit einem Router** — also im Grunde den Stand nach Übung 2 plus
einer Router-Bibliothek:

- Verloren: rund 200 kB, die Werkzeugkette, und das Konzept, das Neueinsteiger erst
  lernen müssen.
- Gewonnen: der automatische Zustandsabgleich. Genau der Punkt, an dem die aktuelle
  Version nachweislich scheitert.

Gegen eine **leichtere Bibliothek** wie Preact (~4 kB, weitgehend React-kompatibel):

- Verloren: ein großer Teil des Ökosystems, gewohnte Werkzeuge, und — im Kurskontext
  entscheidend — die Übertragbarkeit des Gelernten. Preact wäre technisch für diese App
  die bessere Wahl.
- Gewonnen: ein Zehntel der Größe.

**Ehrlich gesagt:** Die Entscheidung für React ist hier zu einem erheblichen Teil eine
Entscheidung für **Lernzweck und Verbreitung**, nicht für technische Optimalität. Wäre
dies ein echtes Produkt mit genau diesem Umfang, wäre Preact oder ein konsequent
weitergeführtes Vanilla-TypeScript gut begründbar. Das gehört in ein ehrliches ADR.

### Was bei harter Anforderung „schwache Geräte, schlechte Verbindung"?

**Dann würde ich die Architektur ändern** — und zwar nicht React gegen Preact tauschen,
sondern den Ansatz selbst.

Begründung: Bei einer schlechten Verbindung ist die Kette aus Demo 2 der Killer —
HTML, dann 225 kB JavaScript, dann die Ausführung, dann **fünf sequenzielle**
JSON-Anfragen, bevor irgendetwas Sinnvolles erscheint. Auf einem schwachen Gerät kommt
hinzu, dass das Ausführen des Bundles selbst spürbar dauert, nicht nur das Laden.

Was ich stattdessen täte:

1. **Statische Vorab-Generierung** mit Hydration — etwa Astro oder ein
   Static-Site-Generator. Die Daten ändern sich während einer Sitzung nicht, also lässt
   sich jede Ansicht zur Bauzeit rendern. Der erste Anblick wäre sofort da, ohne
   JavaScript.
2. **JavaScript nur dort**, wo tatsächlich Interaktivität nötig ist: Filter, Suche,
   Lesezeichen. Nicht für das Anzeigen von Text.
3. **Die fünf sequenziellen Anfragen parallelisieren** oder zu einer einzigen Datei
   bündeln. Das ist unabhängig vom Framework und sollte ohnehin passieren.

Mit der aktuellen Anforderungslage — Ermittler an Arbeitsplatzrechnern, kein
Offline-Bedarf, kein SEO — ist die SPA aber die richtige Wahl.
