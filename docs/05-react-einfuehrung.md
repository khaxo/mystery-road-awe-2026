# Demo 5 — React-Einführung

## Die Übungskomponente

Liegt in `react/sandbox/HalloFall.tsx`. Sie wird bewusst nirgends eingebunden —
sie ist die Übung, nicht Teil der Anwendung. Kein State, keine Props, keine Effekte:
nur statische Daten als JSX.

Enthalten sind die vier Dinge, die man an JSX verstanden haben muss:

| Im Code                            | Was es zeigt                                           |
| ---------------------------------- | ------------------------------------------------------ |
| `<h3>{FALL.titel}</h3>`            | Werte einsetzen über geschweifte Klammern              |
| `{FALL.id.toUpperCase()}`          | Darin steht beliebiges JavaScript, nicht nur Variablen |
| `{FALL.status === "open" ? … : …}` | Bedingungen als **Ausdruck** — kein `if` in JSX        |
| `{FALL.beteiligte.map(...)}`       | Listen aus Arrays, mit `key`                           |

## Was „Komponente" bedeutet

Eine React-Komponente ist eine Funktion, die **beschreibt**, wie ein Stück
Oberfläche aussehen soll — gegeben ihre Eingaben.

Drei Eigenschaften machen sie aus:

1. **Sie beschreibt, sie tut nicht.** Sie gibt eine Beschreibung zurück und fasst das
   DOM nicht an. Wer sie aufruft und wann, entscheidet React.
2. **Sie hat eine Identität über die Zeit.** React weiß, dass die Komponente an _dieser_
   Stelle im Baum dieselbe ist wie beim letzten Durchlauf. Deshalb kann sie eigenen
   Zustand behalten und deshalb kann React vergleichen statt neu zu bauen.
3. **Sie ist zusammensetzbar.** Komponenten enthalten Komponenten, und die Verschachtelung
   ist dieselbe Struktur, die der Benutzer am Ende sieht.

## Der Unterschied zu `renderEvidenceCardHTML()`

Die alte Funktion aus `app.js`:

```js
function renderEvidenceCardHTML(ev) {
  var html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html += '<button data-action="bookmark">' + (ev.bookmarked ? "★" : "☆") + "</button>";
  html += "<h3>" + ev.title + "</h3>";
  // ...
  return html; // ein String
}
```

Oberflächlich sieht das ähnlich aus — eine Funktion, Daten rein, Darstellung raus. Die
Unterschiede sind aber grundlegend:

|                 | `renderEvidenceCardHTML()`                            | React-Komponente                                   |
| --------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Rückgabe        | ein **String**                                        | ein **Objektbaum** (React-Elemente)                |
| Weg ins DOM     | `container.innerHTML = html` — Browser **parst Text** | React **vergleicht** und ändert gezielt            |
| Identität       | keine. Jeder Aufruf ist unabhängig                    | React weiß, welches Element dasselbe geblieben ist |
| Ereignisse      | nur über `data-`-Attribute und Delegation             | `onClick={…}` direkt am Element                    |
| Eigener Zustand | unmöglich                                             | möglich (`useState`)                               |
| Sicherheit      | `innerHTML` interpretiert HTML aus den Daten          | Werte in `{}` werden als **Text** eingesetzt       |

Der letzte Punkt ist mehr als Theorie: Stünde in einem Evidence-Titel ein `<script>`,
würde die Vanilla-Version es ausführen. In JSX erschiene es als sichtbarer Text.

## Fragen

### Was ist JSX wirklich, und wozu kompiliert es?

JSX ist **kein HTML und kein String**. Es ist eine Syntaxerweiterung für JavaScript, die
vor der Ausführung in normale Funktionsaufrufe übersetzt wird.

```jsx
<h3 className="titel">{FALL.titel}</h3>
```

wird — mit der modernen automatischen Runtime, die ich über `"jsx": "react-jsx"` in der
`tsconfig.json` eingestellt habe — zu etwa:

```js
import { jsx as _jsx } from "react/jsx-runtime";
_jsx("h3", { className: "titel", children: FALL.titel });
```

Das Ergebnis ist ein **gewöhnliches JavaScript-Objekt** der Form
`{ type: "h3", props: { … } }`. Dieses Objekt ist der Virtual DOM aus Demo 3.

Zwei Folgerungen daraus:

- Weil es Funktionsaufrufe sind, gelten normale JavaScript-Regeln. Deshalb kann man in
  JSX kein `if` schreiben, aber einen ternären Operator — ein Argument muss ein
  **Ausdruck** sein.
- Weil es nach `class` kein Attribut, sondern einen Objektschlüssel gibt und `class` in
  JavaScript reserviert ist, heißt es `className`.

In diesem Projekt macht die Übersetzung **esbuild**, angesteuert über
`@vitejs/plugin-react`.

### Was wird aus dem Rückgabewert — hier und dort?

**Alte Funktion:** Der String landet in `container.innerHTML`. Der Browser **parst Text
zu DOM**, erzeugt alle Knoten neu und wirft die alten weg. Der Browser hat keine
Möglichkeit zu erkennen, dass 17 von 18 Karten unverändert sind.

**Komponente:** Der Objektbaum geht an React. React vergleicht ihn mit dem vorigen und
führt nur die Unterschiede aus. Bei der ersten Anzeige erzeugt es Knoten mit
`document.createElement`; danach ändert es vorhandene Knoten gezielt.

Der praktische Unterschied, gemessen in Demo 3: 218 zerstörte und neu erzeugte Knoten
gegenüber einer einzelnen Textänderung.

### „Komponenten sind nur Funktionen" — was bricht bei Seiteneffekten?

Der Satz bedeutet: keine Klassen, keine Vererbung, kein Lebenszyklus-Protokoll. Daten
rein, Beschreibung raus.

Entscheidend ist die unausgesprochene Bedingung: Eine Komponente muss beim Rendern
**rein** sein. Gleiche Eingaben, gleiche Ausgabe, keine Wirkung nach außen.

Würde eine Komponente beim Rendern eine globale Variable verändern, bräche Folgendes:

1. **React rendert unter Umständen mehrfach**, bevor es etwas ins DOM schreibt — etwa
   um eine veraltete Berechnung zu verwerfen. Ein Zähler, der im Render erhöht wird,
   zählt dann falsch.
2. **`StrictMode` ruft Komponenten im Entwicklungsmodus absichtlich doppelt auf**, genau
   um solche Fehler aufzudecken. Mein `main.tsx` benutzt `StrictMode` — ein
   Render-Seiteneffekt würde dort sofort doppelt auftreten.
3. **Die Reihenfolge ist nicht garantiert.** Code, der darauf baut, dass Komponente A vor
   B rendert, ist bereits kaputt.

Deshalb gehören Seiteneffekte in `useEffect` — dort laufen sie **nach** dem Rendern, mit
definiertem Zeitpunkt und mit einer Aufräumfunktion. Genau so lädt mein `useCaseData()`
die Daten, und genau so meldet mein `useHashRoute()` den `hashchange`-Listener an und
wieder ab.

**Ehrliche Einschränkung in meinem eigenen Code:** `App.tsx` liest die Bookmark-Anzahl
mit `leseBookmarkAnzahl()` **während des Renderns** aus dem `localStorage`. Das ist nur
ein Lesevorgang, also kein Seiteneffekt im engeren Sinn — aber es ist auch nicht rein,
weil das Ergebnis von etwas außerhalb von React abhängt. Sauber wäre
`useSyncExternalStore`. Für diese Übung bewusst so belassen und hiermit dokumentiert.
