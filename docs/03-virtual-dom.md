# Demo 3 — Der Virtual DOM

## In eigenen Worten

Der Virtual DOM ist eine **einfache Objektdarstellung dessen, wie die Oberfläche
aussehen soll** — ein Baum aus gewöhnlichen JavaScript-Objekten, nicht aus
DOM-Knoten.

Statt dem Browser Anweisungen zu geben („ersetze den Inhalt dieses Containers"),
beschreibt man das **Ergebnis**: „so soll es jetzt aussehen". Die Bibliothek erzeugt
daraus einen neuen Objektbaum, vergleicht ihn mit dem vorigen und leitet daraus die
**kleinstmögliche Liste echter DOM-Operationen** ab.

Das gelöste Problem ist nicht in erster Linie Geschwindigkeit, sondern **Buchführung**.
Ohne Virtual DOM muss man für jede Zustandsänderung selbst wissen, welche Stellen im
Dokument betroffen sind. Diese Buchführung ist fehleranfällig, und genau sie geht in der
Vanilla-Version dieser App an mehreren Stellen schief.

## Der konkrete Fall im originalen `app.js`

Zu finden über `git show 22cb2d8:app.js`.

Ein Klick auf das Bookmark-Symbol einer Karte:

```js
function handleBookmarkClick(evidenceId) {
  var ev = findEvidenceById(evidenceId);
  if (!ev) return;

  if (bookmarks.indexOf(evidenceId) === -1) {
    bookmarks.push(evidenceId);
    ev.bookmarked = true;          // <- die gesamte Änderung
  } else {
    bookmarks = bookmarks.filter(...);
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (currentPage === "evidence") renderEvidenceList();   // <- die Folge
}
```

Und `renderEvidenceList()` baut daraufhin die **gesamte Liste** neu:

```js
var html = "";
for (var i = 0; i < results.length; i++) {
  html += renderEvidenceCardHTML(results[i]);
}
container.innerHTML = html; // alles weg, alles neu
```

### Nachgemessen im laufenden Programm

|                                                 | Wert                    |
| ----------------------------------------------- | ----------------------- |
| Karten in der Liste                             | 18                      |
| DOM-Knoten, die zerstört und neu erzeugt werden | **218**                 |
| Zeichen HTML, die neu geparst werden            | **12.443**              |
| Was sich tatsächlich ändern sollte              | **ein Zeichen** (☆ → ★) |

218 Knoten für ein Zeichen.

### Die unsichtbaren Folgekosten

Das ist nicht nur Verschwendung, es **zerstört Zustand**, den der Browser im DOM hält:

- Der Tastaturfokus geht verloren. Wer sich per Tab zum Bookmark-Button bewegt und
  Leertaste drückt, verliert danach den Fokus — der Knoten existiert nicht mehr.
- Eine aktive Textauswahl in einer Karte verschwindet.
- Laufende CSS-Übergänge brechen ab und beginnen von vorn.
- Scrollpositionen innerhalb scrollbarer Kindelemente werden zurückgesetzt.

Genau hier liegt der eigentliche Wert: Nicht gezeichnete Pixel, sondern **nicht
angetasteter Zustand**.

## Fragen

### Wie würde ein Virtual-DOM-Ansatz das vermeiden?

Konzeptionell in drei Schritten:

1. Nach der Zustandsänderung wird die Beschreibung der Liste **neu erzeugt** — als
   Objektbaum, nicht als DOM.
2. Dieser Baum wird gegen den vorherigen **verglichen**. Für 17 der 18 Karten ist das
   Ergebnis: identisch, nichts zu tun.
3. Für die eine geänderte Karte wird der Unterschied auf das Minimum eingedampft — im
   Idealfall ein einziges `textContent`-Update am Button.

Das Entscheidende: Die anderen 17 Karten sind **dieselben DOM-Knoten wie vorher**. Sie
werden nicht ersetzt, also bleiben Fokus, Auswahl und Animationen erhalten.

Damit der Vergleich funktioniert, braucht jedes Listenelement eine **stabile Identität** —
in React das `key`-Attribut. In meiner `RecentEvidenceList` steht deshalb `key={ev.id}`.
Ohne `key` müsste React anhand der Position raten, und beim Einfügen oben wäre jede
Karte „verschoben" statt „unverändert".

### Ist der Virtual DOM schneller als `innerHTML`?

**Nicht pauschal — und bei einem einzigen großen Austausch sogar langsamer.**

Was abgewogen wird:

`innerHTML = html` ist eine einzelne, hochoptimierte, in C++ implementierte Operation.
Der Browser parst einen String und baut einen Teilbaum. Das ist für sich genommen
**sehr schnell**.

Der Virtual DOM macht stattdessen **zusätzliche Arbeit in JavaScript**: einen kompletten
Objektbaum erzeugen und ihn Knoten für Knoten mit dem alten vergleichen. Diese Arbeit
existiert bei `innerHTML` gar nicht.

Der Handel lautet also: **mehr JavaScript-Arbeit gegen weniger DOM-Arbeit.**

Das lohnt sich, weil DOM-Operationen teuer sind — sie lösen Layout-Neuberechnung und
Neuzeichnen aus, und sie zerstören den oben genannten Browser-Zustand. Objekte zu
vergleichen ist dagegen billig.

Ehrlich dazugesagt: Würde man dieselbe Liste **einmalig** von null aufbauen, wäre
`innerHTML` schneller. Der Gewinn entsteht bei **wiederholten kleinen Änderungen an
großen Strukturen** — und das ist der Normalfall einer interaktiven Anwendung.

### Macht eine Virtual-DOM-Bibliothek die App automatisch schnell?

**Nein.** Sie beseitigt eine Fehlerklasse, keine Langsamkeit.

Was eine React-App trotzdem langsam macht:

- **Zu große Teilbäume rendern erneut.** Liegt der Zustand zu weit oben, rendert bei
  jedem Tastendruck die halbe Anwendung mit. In meiner App ist genau das angelegt:
  `useCaseData()` sitzt in `App`, also rendert bei jeder Datenänderung alles darunter mit.
  Bei dieser Größe egal — bei 5.000 Einträgen nicht.
- **Teure Berechnungen im Render.** Sortieren oder Filtern bei jedem Durchlauf statt
  einmal bei Änderung.
- **Fehlende oder instabile `key`s.** Mit `key={index}` wird aus einem Einfügen am Anfang
  ein „alles hat sich geändert" — der Diff findet dann nichts wiederzuverwenden.
- **Neue Objekt- oder Funktionsreferenzen bei jedem Render**, die Optimierungen wie
  `React.memo` wirkungslos machen.
- **Das Bundle selbst.** Mein Build zeigt es: React-Version **225 kB**,
  Vanilla-Version **20 kB**. Das sind über 200 kB, die geladen und ausgeführt sein
  müssen, bevor irgendetwas erscheint. Für die _erste_ Anzeige ist React damit
  objektiv **langsamer**.
