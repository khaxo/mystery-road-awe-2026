# Übung 5 — React Interactivity, State & Reactive Programming

Dokumentation zu den zehn Demos. Zu jeder Demo: was gemacht wurde, wo es steht,
und die Antworten auf die Theoriefragen.

## Commits dieser Übung

| Commit    | Inhalt                                | Demos   |
| --------- | ------------------------------------- | ------- |
| `b12106e` | Evidence- und Workspace-View in React | 1–6, 10 |
| `f187ee8` | `useReducer` für den Filterzustand    | 7       |
| `3d2cb6f` | Lesezeichen über Context              | 8       |
| `c6db892` | Zwei Zustandsfehler behoben           | 9       |

Die Reihenfolge ist Absicht: Demo 6 (Prop Drilling) und Demo 8 (Context) sind
dieselbe Sache in zwei Zuständen, Demo 2 (`useState`) und Demo 7 (`useReducer`)
ebenfalls. Beide Zustände existieren deshalb als eigene Commits und sind mit
`git show` nebeneinander zeigbar.

---

## Demo 1 — Ereignisse von Vanilla-Listenern auf React

### Was gemacht wurde

Sechs echte Handler sind umgestellt:

| Ereignis            | vorher                                                                                           | jetzt                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Lesezeichen-Klick   | ein Listener auf `#evidenceList`, Prüfung von `event.target.dataset.action`                      | `onClick` am Button, `EvidenceCard.tsx:49`      |
| Suchfeld            | `addEventListener("input")` in `main.ts`                                                         | `onChange`, `EvidenceToolbar.tsx`               |
| Notiz speichern     | Klick auf `[data-action="save-note"]`, Text per `getAttribute("data-evidence-id")` zurückgelesen | `onClick`, `EvidenceDetail.tsx:142`             |
| Sortierung          | `handleSortChange()` las `valueOf("sortEvidence")`                                               | `onChange` mit `isSortOrder`-Guard              |
| Prüfstatus          | zwei `addEventListener("change")`, bei **jedem** Neuzeichnen der Detailansicht neu angehängt     | `onChange`, `EvidenceDetail.tsx:100` und `:116` |
| Hypothese speichern | Klick auf `#saveHypothesisBtn`                                                                   | `onSubmit` am `<form>`, `HypothesisForm.tsx:76` |

Im gesamten `react/`-Verzeichnis gibt es kein `addEventListener` und kein
`onclick`-Attribut mehr. Der Nachweis:

```bash
grep -rn "addEventListener" react/
```

### Frage: Wie hängt man in React einen Klick-Handler an, verglichen mit vorher? Was bekommt das Ereignisobjekt, und ist es dasselbe?

**Drei Wege, drei Mechanismen.**

_Vanilla, Variante 1 — `onclick` im HTML-String:_ Der Browser parst das
Attribut und baut daraus eine Funktion. Der Handler ist ein String, der
irgendwann als Code ausgeführt wird; `this` ist das Element.

_Vanilla, Variante 2 — `addEventListener`:_ Der Handler ist eine echte
Funktion, registriert an einem bestimmten DOM-Knoten. Er bekommt das native
Ereignisobjekt des Browsers, also z. B. ein echtes `MouseEvent`.

_React — `onClick={handler}`:_ Das ist **kein** HTML-Attribut, obwohl es so
aussieht. `onClick` ist eine Prop. React registriert nicht an jedem Knoten
einen Listener, sondern **einen** Listener pro Ereignistyp am Wurzelcontainer
und ruft von dort aus den passenden Handler auf.

**Und das Ereignisobjekt?** Nein, es ist nicht dasselbe. React übergibt ein
`SyntheticEvent` — eine eigene Hülle um das native Ereignis. Die Oberfläche ist
bewusst gleich (`preventDefault()`, `stopPropagation()`, `target`,
`currentTarget` funktionieren alle), aber es ist ein anderes Objekt. Das native
liegt darunter und ist über `event.nativeEvent` erreichbar.

> **Wenn nachgefragt wird, warum React das tut:** Erstens Einheitlichkeit —
> Browser unterschieden sich historisch stark in den Ereignisobjekten, die
> Hülle glättet das. Zweitens die Delegation: Weil React ohnehin zentral
> zuhört, braucht es ein Objekt, bei dem es `target` und `currentTarget`
> selbst setzen kann.

### Frage: Braucht man Event Delegation in React noch?

**Nein — und zwar aus zwei getrennten Gründen, die man auseinanderhalten sollte.**

Der Grund, aus dem der _alte Code_ sie brauchte, ist weg. `renderEvidenceList()`
hat die Liste mit `container.innerHTML = html` komplett neu aufgebaut. Dabei
entstanden alle 18 Karten samt Buttons als **neue** DOM-Knoten. Einzeln
angehängte Listener wären mit den alten Knoten weggeworfen worden und hätten
nach jedem Neuzeichnen neu angehängt werden müssen. Ein Listener am Container,
der `event.target` prüft, überlebt das — er hängt am Container, und der bleibt.

React wirft die Knoten nicht weg. Es vergleicht und ändert nur, was sich
unterscheidet. Ein Button, der vorher da war und nachher da ist, ist derselbe
DOM-Knoten. Das Problem entsteht also nicht.

Der zweite Grund: React delegiert ohnehin schon. `onClick` an 18 Buttons
erzeugt nicht 18 Listener, sondern trägt 18 Handler in Reacts interne Tabelle
ein. Die Delegation ist also nicht weg, sondern nur nicht mehr mein Problem.

**Was ich dadurch gewonnen habe**, zeigt die Belegnummer: Vorher stand sie als
`data-id="E14"` im HTML-String und wurde im Handler mit
`target.dataset.id` zurückgelesen — ein Umweg durch das DOM, bei dem der Typ
`string | undefined` ist und ein Tippfehler im Attributnamen erst zur Laufzeit
auffällt. Jetzt kommt sie aus der Closure: `onClick={() => toggleBookmark(beleg.id)}`.
`beleg` ist typisiert, die Nummer verlässt JavaScript nie.

---

## Demo 2 — `useState` und kontrollierte Formulare

### Was gemacht wurde

- Suchfeld kontrolliert: `value={filter.suche}`, `onChange` meldet nach oben.
- Alle sechs Felder des Hypothesen-Formulars kontrolliert — Auswahl, Mehrfachauswahl, Schieberegler, zwei Textfelder.
- Speichern liest aus dem Zustand, nicht aus dem DOM: `HypothesisForm.tsx:57`.
- Zusätzlich `/#/sandbox/controlled`: drei Felder nebeneinander für die Frage unten.

### Frage: Was macht ein Feld „kontrolliert"? Was passiert ohne `onChange`, und warum?

**Die Unterscheidung ist: Wer besitzt den Wert?**

_Unkontrolliert:_ Das DOM-Element besitzt ihn. React setzt mit `defaultValue`
nur den Startwert und schaut danach nicht mehr hin. Will man den Wert wissen,
muss man das Element befragen — genau das, was die Vanilla-Version mit
`valueOf("hypSuspect")` an sechs Stellen tat.

_Kontrolliert:_ React besitzt ihn. `value` kommt aus dem Zustand, und `onChange`
ist der einzige Weg, den Zustand zu ändern. Was im Feld steht, ist eine **Folge**
des Zustands, nicht seine Quelle.

**Live zu sehen unter `/#/sandbox/controlled`.** Feld 2 hat `value`, aber kein
`onChange`. Tippen bewirkt nichts, und die Konsole sagt:

```
You provided a `value` prop to a form field without an `onChange` handler.
This will render a read-only field.
```

**Warum, im Render-Zyklus gedacht:** Ein Tastendruck ändert zunächst nur den
DOM-Wert des Elements. Damit der neue Wert bestehen bleibt, müsste er in den
Zustand gelangen und ein neues Render auslösen — und dieses Render würde dann
den neuen `value` setzen. Ohne `onChange` fehlt der erste Schritt dieser Kette.
Es gibt keinen Zustandswechsel, also kein neues Render mit neuem Wert; React
hält am letzten gerenderten `value` fest und setzt ihn wieder ein. Das Feld
springt auf den alten Wert zurück, bevor man es sieht.

Kurz: **Kontrolliert heißt, die Anzeige folgt dem Zustand. Fehlt `onChange`,
fehlt der Weg vom Tastendruck zum Zustand — und damit der Weg zurück zur
Anzeige.**

### Frage: Ein `useState` pro Feld oder ein Objekt? Begründung.

**Ein Objekt** — `HypothesisForm.tsx:55`:

```tsx
const [entwurf, setEntwurf] = useState<Hypothesis>(anfangsEntwurf);
```

Die Begründung ist nicht „weniger Zeilen", sondern: **Die sechs Felder sind
kein Bündel unabhängiger Einstellungen, sondern ein Dokument.** Es wird als
Ganzes geladen, als Ganzes gespeichert und als ein JSON-Objekt in den
localStorage geschrieben. Der Typ dafür existierte schon — `Hypothesis` aus
`js/types.ts`, aus Übung 2.

Mit sechs einzelnen Zuständen müsste `speichern()` sie erst wieder zu einem
Objekt zusammensetzen. Das ist nicht nur Arbeit, sondern eine Stelle, an der
man beim siebten Feld etwas vergisst — und es fällt nicht auf, weil
`JSON.stringify` von einem fehlenden Feld nichts weiß.

**Das Gegenbeispiel steht in derselben Datei:** `EvidenceDetail.tsx:50` hat ein
eigenes `useState` nur für den Notiz-Entwurf. Richtig so — der halb getippte
Text gehört zu keinem Dokument, er interessiert niemanden sonst, und er wird
nicht mit etwas anderem zusammen gespeichert.

> **Rückverweis auf Demo 7**, den die Aufgabe ausdrücklich verlangt: Der
> Filterzustand des Katalogs ist derselbe Fall — sieben zusammengehörige Werte —
> und bekommt dort trotzdem keinen `useState` mit Objekt, sondern einen
> `useReducer`. Der Unterschied ist nicht die Anzahl der Werte, sondern die
> Anzahl der **Arten von Änderung**. Siehe Demo 7.

---

## Demo 3 — Unveränderliche Aktualisierungen

### Was gemacht wurde

Zwei Stellen, an denen die naheliegende Fassung mutiert hätte:

**1. Lesezeichen umschalten** — `BookmarkContext.tsx:71`:

```tsx
const neu = bookmarks.includes(evidenceId)
  ? bookmarks.filter((id) => id !== evidenceId)
  : [...bookmarks, evidenceId];

setBookmarks(neu);
```

Beide Zweige erzeugen ein neues Array. Die Vanilla-Fassung tat beides anders:

```js
state.bookmarks.push(evidenceId); // verändert das Array
ev.bookmarked = true; // verändert das geladene Belegobjekt
```

**2. Prüfstatus** — `App.tsx:78`. Vorher stand in `evidence.ts`:

```js
if (isEvidenceStatus(neu)) ev.status = neu; // direct mutation, stand so im Kommentar
```

`ev` ist dasselbe Objekt, das in `state.allEvidence` liegt. Der vom Benutzer
gesetzte Status landete also **in den geladenen Falldaten**. Jetzt liegt er in
einem Zusatzobjekt `pruefung`, und `App.tsx:90` führt beides beim Rendern
zusammen:

```tsx
const daten: CaseDaten = {
  ...geladen,
  evidence: geladen.evidence.map((ev) => {
    const stand = pruefung[ev.id];
    return stand ? { ...ev, ...stand } : ev;
  })
};
```

Die geladenen Objekte werden nie beschrieben. Pro Render entsteht eine neue
Sicht darauf.

### Frage: Warum „funktioniert" Mutation manchmal trotzdem, und was vergleicht React?

**React vergleicht Referenzen, nicht Inhalte.** `Object.is(alt, neu)` — kein
tiefer Vergleich. Bei `bookmarks.push("E14")` bleibt die Referenz dieselbe.
React sieht „unverändert" und rendert nicht neu.

**Warum es trotzdem oft klappt:** weil irgendetwas _anderes_ das Neu-Rendern
auslöst. Ein zweites `setState` im selben Handler, ein Elternteil, das sich
ändert, ein Routenwechsel. Dann liest React den Zustand neu — und findet das
mutierte Array mit dem neuen Eintrag. Es sieht aus, als hätte die Mutation
funktioniert. Tatsächlich hat ein Zufall sie gerettet.

**Deshalb ist es ein besonders unangenehmer Fehlertyp:**

1. Er ist **nicht reproduzierbar**. Mal zeichnet etwas anderes neu, mal nicht.
2. Er verschwindet im Development und erscheint im Build. StrictMode rendert
   absichtlich doppelt und verdeckt das Symptom damit systematisch.
3. Er tritt **an einer anderen Stelle** auf als dort, wo er verursacht wurde.
   Mutiert wird in der Belegkarte, nicht neu gezeichnet wird das Dashboard.
4. Er zerstört Daten dauerhaft, wenn das mutierte Objekt die geladenen
   Falldaten sind — siehe `ev.bookmarked = true` oben.

### Frage: Wie verhindert dein React-Update genau den Sortier-Bug aus Übung 1? Konkret, nicht „React regelt das".

**React regelt das ausdrücklich nicht.** Der Fehler ist in React genauso
möglich — ich hatte ihn in dieser Übung sogar wieder drin, siehe Demo 9,
zweiter Punkt.

Der Bug in Übung 1 bestand aus **zwei** Teilen:

```js
state.filteredEvidence = results;   // bei leerem Filter: dieselbe Referenz wie allEvidence
list.sort(...)                      // sortiert in place
```

Zwei Namen zeigten auf **ein** Array, und `sort()` arbeitet in place. Das
Sortieren der Ansicht hat also die Reihenfolge der geladenen Falldaten
umgeschrieben — dauerhaft, denn die Originalreihenfolge existierte nirgends
mehr. Sichtbar wurde es im Dashboard, das „die letzten fünf Belege" mit
`slice(-5)` aus genau diesem Array nahm.

**Was konkret anders ist, in drei Punkten:**

1. **Der zweite Name existiert nicht mehr.** Es gibt kein
   `state.filteredEvidence`. `waehleEvidence()` gibt die Liste zurück, der
   Aufrufer legt sie in eine lokale `const`, die beim nächsten Render
   verschwindet. Ohne gespeicherten zweiten Namen kann es kein Auseinanderlaufen
   geben — die Frage „welche der beiden Listen ist aktuell?" stellt sich nicht.

2. **Die Mutation ist explizit verboten statt nur vermieden.** Die Belegliste
   kommt als `Evidence[]` aus dem Zustand. Eine Zuweisung an diesen Zustand
   geht ausschließlich über `setDaten`. Mutiert man das Array trotzdem, rendert
   React nicht neu — der Fehler äußert sich also als „die Anzeige rührt sich
   nicht", und das sucht man in der Nähe des Zustands.

3. **Die Kopie steht an der Stelle, an der sortiert wird** — `auswahl.ts:110`:
   `return [...treffer].sort(...)`. Nicht an der Stelle, an der das Array
   entsteht. Das ist der Punkt, den ich in Übung 1 nicht verstanden hatte: Nicht
   die geteilte Referenz ist der Fehler, sondern das Sortieren in place. Mit der
   Kopie ist die Referenz folgenlos.

> **Der ehrliche Nachsatz**, falls gefragt wird: Punkt 3 habe ich in dieser
> Übung erst im zweiten Anlauf richtig gemacht. Siehe Demo 9.

---

## Demo 4 — Abgeleitete Werte statt gespeicherter Zustand

### Was gemacht wurde

| Wert                             | wie er entsteht                                             | Datei                  |
| -------------------------------- | ----------------------------------------------------------- | ---------------------- |
| gefilterte, sortierte Belegliste | `waehleEvidence(belege, personen, filter)` bei jedem Render | `EvidenceView.tsx:61`  |
| Dashboard-Lesezeichen-Zähler     | `bookmarks.length`                                          | `DashboardView.tsx`    |
| Workspace-Lesezeichen-Liste      | `evidence.filter(ev => bookmarks.includes(ev.id))`          | `WorkspaceView.tsx:29` |
| „Reviewed"-Zähler                | `evidence.filter(ev => ev.status === "reviewed").length`    | `DashboardView.tsx`    |
| Notizliste                       | `evidence.filter(ev => notizen[ev.id])`                     | `WorkspaceView.tsx`    |
| Trefferanzahl in der Leiste      | `sichtbar.length`                                           | `EvidenceView.tsx`     |
| Typ-Dropdown-Inhalt              | `vorhandeneTypen(evidence)`                                 | `auswahl.ts:114`       |

Keiner dieser Werte steht in einem `useState`.

### Frage: Was ist die Regel für `useState` vs. berechnen? Angewandt auf die gefilterte Liste.

**Die Regel, in einer Frage: Kann ich den Wert aus etwas anderem ausrechnen,
das ich schon habe? Dann darf er kein Zustand sein.**

Zustand ist nur, was _nicht_ herleitbar ist — was also eine Entscheidung des
Benutzers festhält, die sonst verloren wäre. Alles andere ist eine Rechnung.

**Angewandt auf die gefilterte Liste:**

- Habe ich die vollständige Belegliste? Ja, aus `useCaseData()`.
- Habe ich die Filterwerte? Ja, im Reducer.
- Ist die gefilterte Liste daraus vollständig bestimmt? Ja. Dieselben Belege
  plus dieselben Filter ergeben zwingend dasselbe Ergebnis.

Also kein Zustand. Sie ist eine reine Funktion ihrer beiden Eingaben, und genau
so steht sie da — `waehleEvidence()` ist eine reine Funktion in einer Datei
ohne React-Import.

**Und `useMemo`?** Habe ich nicht genommen, bewusst. `useMemo` ist eine
Optimierung, keine Design-Entscheidung — es ändert nicht, _dass_ der Wert
abgeleitet ist, nur _wie oft_ gerechnet wird. Bei 18 Belegen und sechs
Vergleichen pro Beleg ist das Messrauschen. Ich hätte dafür eine
Abhängigkeitsliste zu pflegen, die bei jedem neuen Filterfeld mitwachsen muss —
Aufwand und eine neue Fehlerquelle für keinen messbaren Gewinn.

> **Die Falle in dieser Frage:** `useMemo` cached das Ergebnis und gibt bei
> gleichen Abhängigkeiten **dieselbe Referenz** zurück. Ein `sort()` in place
> auf diesem Ergebnis würde den Cache dauerhaft beschädigen. Genau diese
> Kopplung ist der Grund, warum ich den Fehler aus Demo 9 behoben habe, obwohl
> er heute nicht auffällt.

### Frage: Warum macht Ableiten beide Bugs aus Übung 1 strukturell unmöglich?

Es waren zwei verschiedene Fehler mit zwei verschiedenen Mechanismen.

**Bug A — der veraltete Dashboard-Zähler.**

Vorher: `renderDashboard()` las `state.bookmarks.length` und schrieb die Zahl
als HTML-String in das DOM. Danach stand sie dort — als Text, ohne Verbindung
zu ihrer Quelle. Neu gerechnet wurde nur, wenn jemand `renderDashboard()`
aufrief, und das passierte wegen `state.viewRendered.dashboard` nur beim
**ersten** Besuch. Wer danach Lesezeichen setzte und zurück aufs Dashboard ging,
sah die alte Zahl.

Der Fehler war also: **zwischen Quelle und Anzeige lag ein manueller Schritt,
und der wurde nicht ausgeführt.**

Jetzt steht die Zahl nicht im DOM, sondern im Ausdruck `bookmarks.length` im
JSX. Dieser Ausdruck wird bei jedem Render ausgewertet. Und gerendert wird
immer dann, wenn `bookmarks` sich ändert — denn es ist ein `useState`, und sein
Setter löst das Rendern aus. **Die Kette Änderung → Rendern → neue Zahl hat
keinen manuellen Schritt mehr, den man vergessen könnte.** Es gibt keinen
Zeitpunkt, zu dem die angezeigte Zahl und `bookmarks` verschieden sein könnten,
weil die Zahl nirgends liegt — sie entsteht beim Hinschauen.

**Bug B — `filteredEvidence` als Alias.**

Das ist ein anderer Mechanismus: nicht ein vergessener Schritt, sondern zwei
Variablen, die dasselbe Objekt meinten. `state.filteredEvidence = results`, und
bei leerem Filter war `results` dasselbe Array wie `state.allEvidence`. Eine
Änderung an der einen Liste war eine Änderung an der anderen.

Hier hilft Ableiten anders: **Es gibt keine zweite Variable, die man aliasen
könnte.** Die gefilterte Liste wird zurückgegeben und in eine lokale `const`
gelegt, die mit dem Render endet. Sie wird nie irgendwo abgelegt, also kann
nichts anderes auf sie zeigen, also kann nichts auseinanderlaufen.

**Der gemeinsame Nenner beider Fälle:** Beide Bugs brauchen _zwei Orte_ für
_eine Tatsache_ — einmal die Quelle und die veraltete Kopie im DOM, einmal zwei
Namen für ein Array. Ein abgeleiteter Wert hat keinen eigenen Ort. Deshalb ist
es nicht „unwahrscheinlicher", sondern nicht formulierbar: Man kann keine zwei
Fassungen einer Zahl haben, die man nicht speichert.

---

## Demo 5 — Zustand zum nächsten gemeinsamen Besitzer heben

### Was gemacht wurde

**Wo die Lesezeichen gebraucht werden:**

| Ort                          | Zugriff             |
| ---------------------------- | ------------------- |
| `EvidenceCard` — Stern-Knopf | lesen und schreiben |
| `DashboardView` — Zähler     | lesen               |
| `WorkspaceView` — Liste      | lesen               |
| `BookmarkList` — „Entfernen" | schreiben           |

Der tiefste gemeinsame Vorfahr dieser vier ist **`App`**. Dorthin ist das
`useState` gewandert (Commit `b12106e`), und in Demo 8 von dort in den
`BookmarkProvider`, der an derselben Stelle im Baum sitzt.

**Nachweis, dass es wirkt:** Im Katalog einen Stern anklicken, dann aufs
Dashboard — der Zähler ist sofort höher. Kein Neuladen, kein Zwischenschritt.

### Frage: Was heißt „Zustand hochziehen" mechanisch? Vorher/nachher.

**Vorher (Vanilla).** Die Lesezeichen lagen in `state.bookmarks` — einem
Modul-Objekt, auf das jede Datei per `import` zugriff. Kein Besitzer, keine
Richtung: Jeder konnte lesen, jeder konnte schreiben. Dass `state` ein Objekt
und keine Einzelvariable ist, war selbst schon ein Workaround — `import { allEvidence }`
erzeugt ein read-only binding, eine Zuweisung dorthin wirft.

Zusätzlich lag dieselbe Information ein zweites Mal auf jedem Belegobjekt, als
`ev.bookmarked`. `applyStoredBookmarkFlags()` hielt beide Fassungen synchron.
Zwei Orte, eine Tatsache.

**Nachher (React).** Ein `useState` in `App` bzw. im `BookmarkProvider`.
`ev.bookmarked` ist aus dem Code verschwunden; die Frage „ist dieser Beleg
markiert?" wird per `istMarkiert(beleg.id)` an die eine Liste gestellt.

**Und mechanisch?** Es ist wörtlich eine Verschiebung von Zeilen nach oben, mit
zwei Folgen:

1. **Nach unten fließen Werte.** Die Kinder bekommen, was sie anzeigen sollen —
   als Props oder per Context. Sie besitzen nichts davon.
2. **Nach oben fließen Absichten.** Ein Kind sagt „schalte E14 um", nicht „hier
   ist die neue Liste". Was daraus folgt, entscheidet der Besitzer.

Dadurch entsteht genau **eine** Stelle, an der das Umschalten passiert, und
eine Stelle, an der der localStorage beschrieben wird — `BookmarkContext.tsx:71`.
Vorher war das Schreiben über `saveBookmarksToStorage()` von überall aufrufbar.

### Frage: Was wäre schiefgegangen mit je einem `useState` pro View?

Das muss ich nicht hypothetisch beantworten — **ich hatte diesen Fehler in
dieser Übung tatsächlich drin**, siehe Demo 9. Der Workspace hielt eine eigene
Kopie. Beobachtet, nicht ausgedacht:

Nach einem Klick auf „Entfernen" im Workspace:

| Ort              | Zustand        |
| ---------------- | -------------- |
| Workspace-Liste  | Eintrag weg    |
| Dashboard-Zähler | unverändert    |
| Stern im Katalog | weiter gefüllt |
| localStorage     | unverändert    |

Nach einem Reload war der Eintrag wieder da — die einzige Fassung, die
überlebte, war die, die nicht geändert wurde.

**Drei Dinge wären mit drei getrennten Zuständen konkret passiert:**

1. **Jede Ansicht hätte ihre eigene Wahrheit.** Welche richtig ist, hängt davon
   ab, wo zuletzt geklickt wurde. Das ist nicht debuggbar — es gibt keinen
   falschen Zustand, es gibt drei.

2. **Der Zustand würde beim Navigieren zurückgesetzt.** Routenwechsel
   unmountet die Ansicht, `useState` beginnt beim nächsten Mounten neu beim
   Startwert. Lesezeichen aus dem Katalog würden beim Verlassen der Ansicht
   verschwinden — ein Fehler, der wie „das Speichern funktioniert nicht"
   aussieht und in Wirklichkeit „der Zustand lebt an der falschen Stelle" ist.

3. **Man würde versuchen, zu synchronisieren.** Das ist das eigentlich
   Teure: Der naheliegende Reflex ist ein `useEffect`, der die drei Zustände
   abgleicht. Damit baut man die Fehlerklasse, die `applyStoredBookmarkFlags()`
   in der Vanilla-Version war — eine Funktion, deren Aufgabe es ist, zwei
   Fassungen derselben Tatsache beieinander zu halten, und die genau dann
   vergessen wird, wenn eine dritte Fassung dazukommt.

---

## Demo 6 — Rückrufe nach unten geben

### Was gemacht wurde

Zwei Interaktionen, die Zustand eines Vorfahren ändern:

**1. Lesezeichen** — Commit `b12106e`, vor der Context-Umstellung:

```
App  (useState bookmarks, function toggleBookmark)
 └─ EvidenceView        bookmarks, onToggleBookmark
     └─ EvidenceList    bookmarks, onToggleBookmark
         └─ EvidenceCard   onClick={() => onToggleBookmark(beleg.id)}
```

**2. Notiz speichern** — so steht es noch heute im Code:

```
App  (useState notizen, function speichereNotiz)
 └─ EvidenceView        onNotizSpeichern
     └─ EvidenceDetail  onClick={() => onNotizSpeichern(beleg.id, entwurf)}
```

Ebenso der Prüfstatus (`onPruefung`) aus der Detailansicht.

### Frage: Warum soll ein tief verschachteltes Kind nicht direkt den Zustand eines fernen Vorfahren ändern? Was bringt der Rückruf?

**Weil es gar nicht geht — und der Grund dafür ist der eigentliche Punkt.**

`bookmarks` ist eine lokale `const` in einer Funktion. `EvidenceCard` hat keinen
Zugriff auf den Geltungsbereich von `App`. Das ist kein Verbot aus Höflichkeit,
das ist JavaScript.

Interessanter ist die Variante, die technisch _möglich_ wäre: Das Kind bekommt
`setBookmarks` und ruft es selbst auf. Dagegen sprechen drei Dinge:

1. **Die Regel wäre an der falschen Stelle.** Dass „umschalten" heißt
   _entfernen, wenn vorhanden, sonst anhängen_ — und dass danach der
   localStorage beschrieben wird —, ist eine Entscheidung über Lesezeichen,
   nicht über Belegkarten. Mit `setBookmarks` im Kind müsste jede Karte sie
   kennen und richtig umsetzen. Bei zwei Aufrufern hat man die Regel zweimal,
   und beim nächsten Mal nur an einer Stelle geändert.

2. **Das Kind müsste den Zustand kennen.** Um „umschalten" zu formulieren,
   braucht man die aktuelle Liste. Die Karte müsste also nicht nur schreiben,
   sondern auch die ganze Liste lesen — obwohl sie nur eine Ja/Nein-Antwort für
   sich selbst braucht. Das ist genau das, was `markiert: boolean` statt
   `bookmarks: string[]` verhindert.

3. **Es gäbe keinen Ort mehr, an dem man nachschaut.** Bei einer falschen Liste
   wäre die Frage „wer hat geschrieben?" unbeantwortbar. Mit einem Rückruf ist
   `toggleBookmark` die einzige Stelle, an der sich die Liste ändern kann —
   ein Haltepunkt dort fängt jede Änderung.

**Was der Rückruf also bringt:** Das Kind sagt, **was passiert ist** („dieser
Stern wurde geklickt"). Der Besitzer entscheidet, **was das bedeutet**. Die
Karte bleibt damit eine Komponente, die man überall einsetzen kann — der
Aufrufer bestimmt, was der Klick tut.

### Frage: Verfolge einen Rückruf von der Definition bis zum Aufruf. Wie viele Ebenen? Ist Prop Drilling hier ein Problem?

**Verfolgt am Notiz-Speichern, weil das heute noch so im Code steht:**

| Ebene | Datei                    | was dort passiert                                                                   |
| ----- | ------------------------ | ----------------------------------------------------------------------------------- |
| 0     | `App.tsx:68`             | `const [notizen, setNotizen] = useState(leseNotizen)`                               |
| 0     | `App.tsx:71`             | `speichereNotiz()` — baut das neue Objekt, ruft `setNotizen`, schreibt localStorage |
| 1     | `App.tsx`                | `<EvidenceView onNotizSpeichern={speichereNotiz} />`                                |
| 2     | `EvidenceView.tsx`       | nimmt `onNotizSpeichern` an und gibt es weiter — **benutzt es nicht**               |
| 3     | `EvidenceDetail.tsx:142` | `onClick={() => onNotizSpeichern(beleg.id, entwurf)}`                               |

**Drei Prop-Ebenen, eine davon reine Durchreiche.**

Bei den Lesezeichen war es vor Demo 8 eine Ebene mehr: `App` →
`EvidenceView` → `EvidenceList` → `EvidenceCard`, also **zwei**
Durchreichestationen.

**Fühlt sich das nach „zu viel" an? Nein, und ich will dabei genau sein.**

Was mich bei den Lesezeichen gestört hat, war nicht die Tiefe, sondern dass
`EvidenceList` in ihrer Props-Schnittstelle zwei Dinge ankündigte, mit denen
sie inhaltlich nichts zu tun hat. Wer die Datei liest, muss erst feststellen,
dass sie beides nur weitergibt. Das ist eine Leseschuld, kein Fehlerrisiko.

**Ein echtes Problem wäre Prop Drilling für mich bei einem von drei Anzeichen:**

- Vier oder mehr Ebenen, bei denen die Hälfte nur durchreicht.
- Eine Zwischenebene, die mehrere durchgereichte Props hat und dadurch eine
  Schnittstelle bekommt, die ihre eigentliche Aufgabe nicht mehr erkennen lässt.
- Eine neue Verbrauchsstelle in einem anderen Teilbaum, die eine **neue** Kette
  von oben nach unten nötig macht.

Das dritte Anzeichen war bei den Lesezeichen gegeben: vier Verbrauchsstellen in
drei Feature-Ordnern. Deshalb Demo 8. Bei den Notizen ist keines davon gegeben —
eine schreibende und eine lesende Stelle — und deshalb bleiben sie bei Props.

---

## Demo 7 — `useReducer` für Filter, Suche und Sortierung

### Was gemacht wurde

Commit `f187ee8`. Sieben `useState`-Aufrufe wurden ein `useReducer` mit drei
Aktionen. Der Reducer steht in `filterReducer.ts`, der Zustandstyp in
`auswahl.ts:18`.

Der Diff zum Vorher:

```bash
git show f187ee8 -- react/features/evidence/EvidenceView.tsx
```

### Frage: Warum passt `useReducer` hier besser als viele `useState`? Was wurde konkret leichter?

**Der Grund ist nicht die Anzahl der Werte, sondern die Anzahl der Arten von
Änderung.**

Sieben unabhängige Schalter wären sieben `useState` — völlig in Ordnung. Diese
sieben Werte sind aber ein **Zustandsbereich**: Sie werden gemeinsam gelesen
(`waehleEvidence` bekommt sie als ein Objekt), gemeinsam zurückgesetzt, und sie
wachsen gemeinsam.

**Vier Dinge, die konkret leichter wurden:**

1. **Die Zuordnung Feldname → Setter ist verschwunden.** Vorher ein `switch`
   mit sechs Fällen, der von Hand mit dem Interface synchron gehalten werden
   musste. Jetzt ein berechneter Schlüssel:
   `return { ...zustand, [aktion.feld]: aktion.wert }` — `filterReducer.ts:26`.

2. **Zurücksetzen ist eine Aktion statt sieben Aufrufen.** Vorher sieben
   Setter in Folge in `zuruecksetzen()`. Jetzt
   `dispatch({ type: "CLEAR_FILTERS" })`, und welche Startwerte gelten, steht
   nur in `LEERER_FILTER`.

3. **Ein achtes Filterfeld kostet eine Zeile statt vier.** Vorher: Zeile im
   Interface, neues `useState`, neuer `case` im Switch, neue Zeile in
   `zuruecksetzen()` — und das vierte vergisst man. Jetzt nur die Zeile im
   Interface; `SET_FILTER` und `CLEAR_FILTERS` decken es automatisch ab.

4. **Die Komponente kennt die Form des Zustands nicht mehr im Detail.** Sie
   schickt Absichten, keine Werte an Setter. Welche Felder es gibt, weiß der
   Reducer.

**Was sich nicht geändert hat:** die Filterleiste. Sie bekam vorher Rückrufe
und bekommt jetzt Rückrufe. Dass oben ein Reducer statt sieben `useState`
liegt, merkt sie nicht — der Commit fasst eine einzige Datei an. Das ist der
Beleg dafür, dass `useReducer` eine Entscheidung über die _Verwaltung_ des
Zustands ist, nicht über seine Schnittstelle.

### Frage: Zeig `CLEAR_FILTERS`. Wie macht ein Reducer „mehrere zusammengehörige Werte konsistent zurücksetzen" leichter?

`filterReducer.ts:34`:

```ts
case "CLEAR_FILTERS":
  return { ...LEERER_FILTER, sortierung: zustand.sortierung };
```

**Eine Zeile, und sie enthält eine fachliche Entscheidung:** Die Sortierung
bleibt erhalten. Der Knopf heißt „Clear filters", nicht „alles zurück" — wer
nach Titel sortiert hat und die Filter leert, will weiter nach Titel sortiert
sehen.

**Warum das mit sieben Settern schwer richtig zu bekommen ist — drei Gründe:**

1. **Es ist atomar.** Ein `dispatch` erzeugt **einen** neuen Zustand. Es gibt
   keinen Zwischenstand, in dem die Suche schon leer, der Typfilter aber noch
   gesetzt ist. Bei sieben Settern gibt es sechs solche Zwischenstände. React
   fasst sie in einem Event-Handler zwar zu einem Render zusammen, aber das ist
   eine Zusage über das Rendern — nicht darüber, dass die sieben Aufrufe
   überhaupt alle dastehen.

2. **Die Startwerte stehen an einer Stelle.** `LEERER_FILTER` ist derselbe
   Wert, den `useReducer` als Initialzustand bekommt. „Zurücksetzen" und
   „Anfangszustand" können per Konstruktion nicht auseinanderlaufen. Mit sieben
   Settern sind es zwei Listen von Startwerten — eine in den `useState`-Aufrufen,
   eine in `zuruecksetzen()` — die von Hand gleich gehalten werden müssen.

3. **Die Ausnahme ist formulierbar.** „Alles zurück **außer** der Sortierung"
   ist hier ein sichtbarer Teil des Ausdrucks, weil der Reducer den ganzen
   Zustand auf einmal sieht. Mit sieben Settern wäre es die Abwesenheit eines
   Aufrufs — also nur zu erkennen, wenn man zählt, dass sechs von sieben
   Settern aufgerufen werden, und das für eine Entscheidung hält statt für ein
   Versehen. In der Vanilla-Version war es tatsächlich beides nicht zu
   unterscheiden: `clearFilters()` leerte sechs DOM-Elemente und ließ
   `sortEvidence` stehen — ob gewollt, ist aus dem Code nicht erkennbar.

### Frage: Ist `useReducer` grundlegend anders als `useState`, oder ist `useState` ein Spezialfall?

**`useState` ist ein Spezialfall.** Das ist nicht nur eine Analogie — es lässt
sich ausschreiben:

```ts
function useStateNachgebaut<T>(start: T) {
  return useReducer(
    (alt: T, aktion: T | ((alt: T) => T)) =>
      typeof aktion === "function" ? (aktion as (alt: T) => T)(alt) : aktion,
    start
  );
}
```

Das ist `useState`. Der Reducer ist „nimm, was reingegeben wird" — und wenn eine
Funktion reingegeben wird, wende sie auf den alten Zustand an. Letzteres ist
genau die Updater-Form `setWert(v => v + 1)`, und sie ist der Beleg: Eine
Updater-Funktion **ist** ein Reducer, nur ad hoc an der Aufrufstelle definiert
statt zentral.

In der React-Implementierung ist es dieselbe Maschinerie — `useState` ruft
intern denselben Mechanismus auf und setzt einen eingebauten `basicStateReducer`
ein.

**Der Unterschied ist, wo die Übergangslogik steht:**

|                      | `useState`               | `useReducer`                 |
| -------------------- | ------------------------ | ---------------------------- |
| Übergangslogik       | an jeder Aufrufstelle    | an einer Stelle              |
| Aufrufer übergibt    | den neuen Wert           | die Absicht                  |
| Aufrufer muss wissen | wie der Zustand aussieht | nur, welche Aktionen es gibt |

**Wann also was?** Solange der Übergang „nimm diesen Wert" ist, ist die
Aufrufstelle der richtige Ort — `useState` ist dann keine Vereinfachung, sondern
die passende Form. Sobald der Übergang eine Regel ist, die mehrere Felder
betrifft oder von mehreren Stellen gleich aufgerufen wird, gehört sie zentral.

> **Falls das Gespräch weitergeht:** Deshalb ist Redux kein anderes Konzept,
> sondern derselbe Mechanismus mit Werkzeugen drumherum — ein Reducer plus
> Store plus Middleware. Wer `useReducer` versteht, hat den Kern davon schon.

---

## Demo 8 — Context, und wann nicht

### Was gemacht wurde

Commit `3d2cb6f`. Der Lesezeichen-Zustand liegt im `BookmarkProvider`
(`BookmarkContext.tsx`), vier Stellen holen ihn per `useBookmarks()`.
Entfernt wurden damit:

| Datei               | was wegfiel                                                  |
| ------------------- | ------------------------------------------------------------ |
| `App.tsx`           | Übergabe von `bookmarks` + `onToggleBookmark` an drei Routen |
| `EvidenceView.tsx`  | zwei Props, nur durchgereicht                                |
| `EvidenceList.tsx`  | zwei Props, nur durchgereicht                                |
| `DashboardView.tsx` | eine Prop                                                    |

### Die Entscheidung, ehrlich

**Für diese App, in ihrer heutigen Größe, war Prop Drilling vertretbar.** Es
ging um zwei Props über zwei Zwischenebenen. Der Commit davor funktionierte, und
niemand hätte den Unterschied bemerkt.

**Was für Context spricht, ist nicht die Tiefe, sondern die Streuung.**
Lesezeichen werden an vier Stellen in drei Feature-Ordnern gebraucht. Jede
weitere Stelle hätte eine neue Kette von `App` nach unten bedeutet — und das
ist der Punkt, an dem Durchreichen von „lästig" zu „strukturell falsch" kippt.

**Die Gegenprobe steht im gleichen Commit:** Die Notizen sind absichtlich **nicht**
auf Context umgestellt. Eine schreibende Stelle, eine lesende, eine Ebene tief.
Dort wäre Context Aufwand ohne Gegenwert.

### Frage: Welches Problem löst Context? Welches nicht?

**Was es löst:** den Transport durch Zwischenebenen, die mit dem Wert nichts zu
tun haben. Der Provider stellt bereit, jeder Nachfahre holt sich den Wert
selbst, egal wie tief. Mehr nicht — und das ist keine Einschränkung, sondern die
Beschreibung.

**Was es nicht löst — Context ist kein Zustandsverwalter.** Der Zustand in
`BookmarkContext.tsx:69` ist ein gewöhnliches `useState`, dasselbe, das vorher
in `App.tsx` stand. Context hat es nicht ersetzt, nur umgezogen. Es transportiert,
es verwaltet nicht.

**Wo die Erwartung „das ist wie globaler Zustand" konkret bricht — vier Punkte:**

1. **Kein selektives Abonnieren.** Ändert sich der Context-Wert, rendert
   **jeder** Konsument neu — auch wer nur ein Feld daraus liest. Redux, Zustand
   und MobX können das; Context nicht. Bei vier Konsumenten irrelevant, bei
   vierzig nicht.

2. **Jeder Render des Providers erzeugt ein neues Objekt.** Mein `zugriff`-Objekt
   wird bei jedem Render neu gebaut. Für React ist das ein neuer Wert, also
   rendern alle Konsumenten — selbst wenn `bookmarks` identisch ist. Das ist der
   Punkt, an dem man `useMemo` und `useCallback` bräuchte. Bei dieser Größe
   bewusst nicht gemacht.

3. **Der Wert lebt im Komponentenbaum.** Unmountet der Provider, ist der Zustand
   weg. Eine globale Variable überlebt das. Dass meine Lesezeichen einen Reload
   überleben, liegt am localStorage, nicht am Context.

4. **„Global" ist relativ.** Zwei Provider ergeben zwei unabhängige Werte, und
   der nächstgelegene gewinnt. Das ist ein Vorteil — man kann einen Teilbaum
   bewusst anders versorgen —, aber es heißt: Es gibt nicht _den_ Wert, es gibt
   den Wert _an dieser Stelle im Baum_.

> **Ein Detail, das gern gefragt wird:** Der Standardwert meines Context ist
> `null`, nicht ein leeres Ersatzobjekt. `useBookmarks()` wirft, wenn es
> außerhalb des Providers aufgerufen wird. Mit `{ bookmarks: [] }` als
> Standardwert würde eine falsch platzierte Komponente stillschweigend mit einer
> leeren Liste arbeiten — ein Fehler, der sich als „meine Lesezeichen sind
> verschwunden" tarnt. Lieber sofort laut.

### Frage: War das Prop Drilling aus Demo 6 ein echtes Problem? Was ist deine Schwelle?

**Es war ein handhabbares Problem, kein echtes.** Zwei Props, zwei
Zwischenebenen, kein Fehler ist dadurch entstanden.

Was mich gestört hat, war die Props-Schnittstelle von `EvidenceList`: Sie
kündigte zwei Dinge an, mit denen sie nichts zu tun hat. Das kostet
Lesezeit, nicht Korrektheit.

**Meine Schwelle, in einem Satz: Ich greife zu Context, wenn eine _neue_
Verbrauchsstelle eine _neue_ Kette von oben nach unten bedeuten würde.**

Nicht ab einer bestimmten Tiefe. Drei Ebenen in einem Feature sind harmlos.
Aber vier Verbrauchsstellen in drei Feature-Ordnern heißt: Die fünfte kommt, und
sie wird wieder eine Kette brauchen. Dann ist Durchreichen nicht mehr lästig,
sondern falsch.

**Umgekehrt formuliert — wann ich eine Ebene mehr durchreiche:** wenn der Wert
in einem Feature bleibt, wenn es bei einem oder zwei Verbrauchern bleibt, oder
wenn die durchgereichte Prop in der Zwischenebene _gelesen_ wird. Dann ist sie
keine Durchreiche, sondern Teil der Aufgabe dieser Komponente.

### Frage: Könnte Context hier selbst „unnecessary global state" sein?

**Ja, und ich halte das für die interessanteste Frage der Übung.**

Context ist technisch keine globale Variable — er ist auf einen Teilbaum
begrenzt, React-verwaltet, typisiert und verschwindet mit seinem Provider. Aber
die _Eigenschaft_, die „unnecessary global state" problematisch macht, hat er
durchaus: **Von jeder Stelle im Teilbaum aus unsichtbar erreichbar.**

**Drei Dinge, die ich mit dem Context aufgegeben habe:**

1. **`EvidenceCard` ist nicht mehr beliebig einsetzbar.** Sie läuft nur
   innerhalb eines `BookmarkProvider` und wirft sonst. Mit `markiert: boolean`
   als Prop war sie überall verwendbar. Das steht als Kommentar in der Datei,
   weil es ein echter Verlust ist.

2. **Die Abhängigkeit steht nicht in der Signatur.** Vorher sagte
   `interface Props`, was die Komponente braucht. Jetzt steht ein Teil davon in
   einem `useBookmarks()`-Aufruf im Funktionskörper. Man muss die Implementierung
   lesen, um die Abhängigkeiten zu kennen.

3. **Testen braucht jetzt eine Hülle.** Die Karte isoliert zu rendern geht nur
   mit einem Provider drumherum. Vorher reichten zwei Props.

**Mein Urteil:** Für die Lesezeichen ist es gerechtfertigt — vier Stellen in drei
Ordnern. Für die Notizen wäre es genau der benannte Fehler, und deshalb sind sie
bei Props geblieben. Diese Grenze im selben Commit zu ziehen, war der eigentliche
Inhalt von Demo 8: nicht „Context benutzen", sondern **entscheiden, wofür**.

> **Und wenn jemand sagt, ich hätte es ganz lassen sollen:** Dann würde ich nicht
> widersprechen. Die Aufgabe verlangt, Context zu implementieren und die
> Entscheidung ehrlich zu begründen. Meine Begründung ist die Streuung über
> Feature-Ordner — nicht, dass Prop Drilling weh getan hätte.

---

## Demo 9 — Zustandsprobleme finden und beheben

Commit `c6db892`. Beide Fehler sind beim Bauen dieser Übung selbst entstanden.

### Fehler 1 — doppelter Zustand, der zu veraltetem Zustand führte

**Kategorie: duplicated state** (mit stale state als Symptom).

Der Workspace hielt eine eigene Liste der angezeigten Lesezeichen:

```tsx
// Eigene Liste der angezeigten Lesezeichen, damit das Entfernen hier
// sofort sichtbar ist, ohne auf den Zustand weiter oben zu warten.
const [sichtbareBookmarks, setSichtbareBookmarks] = useState<string[]>([...bookmarks]);
```

Die Begründung im Kommentar klingt plausibel — und ist falsch. Es gab nichts
abzuwarten; der Zustand oben hätte sofort gewirkt. Damit stand dieselbe Tatsache
an zwei Stellen, und nach einem Klick auf „Entfernen" widersprachen sie sich:

| Ort              | Zustand                                    |
| ---------------- | ------------------------------------------ |
| Workspace-Liste  | Eintrag weg                                |
| Dashboard-Zähler | unverändert                                |
| Stern im Katalog | weiter gefüllt                             |
| localStorage     | unverändert — nach Reload war alles zurück |

**Wie aufgefallen:** beim Durchspielen der Demo-Reihenfolge von Hand. Drei Belege
markieren, in den Workspace, einen entfernen, aufs Dashboard — der Zähler stand
noch auf drei. Also ein sichtbarer Fehler, kein Code-Review-Fund.

**Behoben** durch Löschen des `useState`. Die Liste wird abgeleitet,
„Entfernen" ruft `toggleBookmark` aus dem Context:

```tsx
const markierteBelege = daten.evidence.filter((ev) => bookmarks.includes(ev.id));
```

**Der Zusammenhang zu Übung 1:** Es ist derselbe Fehler wie der veraltete
Bookmark-Zähler, mit umgekehrten Vorzeichen. Dort war die abgeleitete Anzeige zu
alt, hier war die kopierte Liste zu neu. Beide Male: zwei Orte, eine Tatsache.

### Fehler 2 — Mutation eines geteilten Arrays

**Kategorie: mutation.**

`waehleEvidence()` hat eine Abkürzung: Ist kein Filter aktiv, wird nicht
gefiltert, sondern das übergebene Array direkt weiterverwendet. Danach stand:

```ts
return treffer.sort(vergleicher(filter.sortierung));
```

`sort()` arbeitet in place. Ohne aktiven Filter wurde also die Liste des
**Aufrufers** umsortiert.

**Das ist wörtlich Bug 5 aus Übung 1.** Dort zeigten `state.filteredEvidence` und
`state.allEvidence` auf dasselbe Array, und das Sortieren der Ansicht hat die
Originalreihenfolge der Falldaten dauerhaft zerstört.

**Wie aufgefallen:** beim Wiederlesen, nicht durch ein Symptom. Und das ist der
Teil, den ich ehrlich sagen will — **heute fällt dieser Fehler nicht auf.**
`App.tsx:90` baut die Belegliste bei jedem Render neu auf (`.map()`), das
sortierte Array ist also ein Wegwerfobjekt. Der Fehler ist latent.

**Trotzdem behoben, aus einem konkreten Grund:** Er ist nur durch ein
Implementierungsdetail einer _anderen_ Datei harmlos. Ein `useMemo` um diesen
`.map()`-Aufruf — eine naheliegende Optimierung — würde ihn sofort scharf machen,
und dann wäre das Symptom „nach dem Sortieren zeigt das Dashboard andere
Belege an": weit weg von der Ursache. Genau diese zufällige Kopplung war in
Übung 1 teuer.

**Behoben** mit `auswahl.ts:110`:

```ts
return [...treffer].sort(vergleicher(filter.sortierung));
```

Die Abkürzung darf bleiben. Nicht sie war das Problem, sondern das Sortieren in
place.

### Fehler 3 — Prop Drilling (bereits in Demo 8 behoben)

Vollständigkeit halber: `EvidenceView` und `EvidenceList` nahmen zwei
Lesezeichen-Props an, nur um sie weiterzugeben. **Kategorie: excessive prop
drilling.** Gefunden beim Lesen der Props-Schnittstellen, behoben in Commit
`3d2cb6f`.

### Frage: Welche Kategorie, und wie bemerkt?

| #   | Kategorie                      | wie bemerkt                                     |
| --- | ------------------------------ | ----------------------------------------------- |
| 1   | duplicated state → stale state | sichtbarer Fehler beim Durchspielen des Ablaufs |
| 2   | mutation                       | Wiederlesen des Codes; kein Symptom             |
| 3   | excessive prop drilling        | Lesen der Props-Schnittstellen beim Aufräumen   |

Nicht benutzt habe ich die React DevTools. Hätte ich sie benutzt, wäre Fehler 1
schneller gefunden worden: Zwei Komponenten mit je einer Lesezeichen-Liste im
Zustandsbaum sind dort unmittelbar sichtbar.

### Frage: Welches der fünf Probleme ist die Geschichte dieser App am deutlichsten?

**Duplicated state** — und zwar so deutlich, dass die anderen Bugs Folgen davon
sind.

Die Vanilla-App hat die Lesezeichen an **drei** Stellen gehalten:

1. `state.bookmarks` — die Liste der Nummern
2. `ev.bookmarked` auf jedem Belegobjekt — dieselbe Information pro Beleg
3. der localStorage-Eintrag

Es gab eine Funktion, deren einzige Aufgabe es war, (1) und (2)
zusammenzuhalten: `applyStoredBookmarkFlags()`. **Eine Funktion, die nichts tut,
außer zwei Fassungen derselben Tatsache abzugleichen, ist die Diagnose selbst.**

Und die Folgefehler:

- Der veraltete Dashboard-Zähler war eine **vierte** Fassung — die Zahl als Text
  im DOM, die nur beim ersten Besuch geschrieben wurde.
- `filteredEvidence` neben `allEvidence` war dasselbe Muster für die Belegliste:
  zwei Namen, eine Wahrheit, und bei leerem Filter buchstäblich dasselbe Objekt.
- `ev.bookmarked = true` und `ev.status = neu` waren Mutationen, die es nur
  gab, **weil** die Information doppelt gehalten wurde. Hätte es nur die Liste
  gegeben, wäre das Belegobjekt nie angefasst worden.

**Was React daran strukturell geändert hat:** Es ist nicht so, dass React die
Duplikation verbietet — ich habe sie in dieser Übung selbst wieder eingebaut
(Fehler 1). Was React ändert, ist die **Alternative**. In der Vanilla-Version war
Duplizieren der naheliegende Weg: Es gab keinen Mechanismus, der eine Anzeige
automatisch nachzieht, also musste man den abgeleiteten Wert irgendwo hinschreiben.
In React ist der abgeleitete Wert billiger als die Kopie — man rechnet ihn im
JSX aus und ist fertig. Die Duplikation ist dadurch nicht unmöglich, aber sie
ist nicht mehr der bequemere Weg.

---

## Demo 10 — Letzte DOM-Manipulation entfernen, Abschluss

### Was gemacht wurde

Der Nachweis in einem Befehl:

```bash
grep -rn "document\.\|classList\|innerHTML\|querySelector\|addEventListener" react/ | grep -v "\*"
```

Das zweite `grep` wirft Kommentarzeilen weg — in mehreren Dateien steht in
einem Kommentar, was die Vanilla-Version an dieser Stelle tat. Übrig bleibt
**eine** Zeile, `react/main.tsx:10`:

```ts
const wurzel = document.getElementById("root");
```

**Diese Zeile muss bleiben, und sie ist die Ausnahme, die die Regel erklärt:**
React muss irgendwo anfangen. `createRoot` braucht einen echten DOM-Knoten als
Einhängepunkt. Genau **ein** imperativer Zugriff, in der Einstiegsdatei, und von
dort an ist alles deklarativ.

Zwei Befehle ohne jeden Filter sagen dasselbe kürzer:

```bash
grep -rn "document\." react/        # eine Zeile: main.tsx:10
grep -rn "addEventListener" react/   # keine Treffer
```

> **Nachtrag aus Übung 6.** Seit `useDokumentTitel` gibt es einen zweiten
> `document`-Zugriff: `document.title`. Das widerspricht der Aussage nicht,
> sondern schärft sie — und der Unterschied ist genau der Punkt:
>
> | Zugriff                           | wo                    | Bewertung                                                           |
> | --------------------------------- | --------------------- | ------------------------------------------------------------------- |
> | `document.getElementById("root")` | `main.tsx`            | **innerhalb** der Wurzel: der Einhängepunkt, einmalig, unvermeidbar |
> | `document.title`                  | `useDokumentTitel.ts` | **außerhalb** der Wurzel: ein externes System, in einem Effekt      |
>
> Reacts Zuständigkeit endet an seinem Wurzelknoten. Alles darin baut React —
> dort wäre ein Direktzugriff ein Fehler. Der Tab-Titel liegt darüber und
> gehört React nicht; ihn in einem Effekt zu setzen ist die vorgesehene Art,
> mit der Außenwelt zu reden. Siehe CHANGES-6.md, Demo 1 und 2.

**Fünf Ansichten, alle auf React-Zustand und Props:**

| Ansicht            | Route                                | Zustand                                        |
| ------------------ | ------------------------------------ | ---------------------------------------------- |
| Dashboard          | `/dashboard`                         | keiner; alles abgeleitet                       |
| Evidence           | `/evidence`, `/evidence/:evidenceId` | `useReducer` für Filter; Auswahl aus der Route |
| People & Locations | `/team/:tab`                         | keiner; Tab aus der Route                      |
| Timeline           | `/timeline`                          | keiner; Filter in der URL                      |
| Workspace          | `/workspace`                         | Formularentwurf lokal; Lesezeichen aus Context |

Zusätzlich aufgeräumt: Die Timeline-Filterleiste war in Übung 4 absichtlich
abgeschaltet (`disabled`, `defaultValue`, kein Handler) mit dem Kommentar, das
Verdrahten sei Thema von Übung 5. Sie ist jetzt verdrahtet — und zwar über die
URL, ohne ein einziges `useState`.

### Frage: Eine Entscheidung, bei der du dir nicht sicher bist. Beide Richtungen.

**Dass der Filterzustand des Belegkatalogs in einem Reducer liegt und nicht in
der URL.**

Die Timeline nebenan macht es anders: Ihre vier Filter stehen in
`?order=&person=&ort=&typ=`, verwaltet mit `useSearchParams`. Zwei verschiedene
Antworten auf dieselbe Frage, in derselben App, von mir, in derselben Übung.

**Dafür, den Katalog in der URL zu haben:**

- In Übung 4 habe ich die Regel aufgestellt und verteidigt: _Wenn ein Zustand den
  Benutzer interessiert, gehört er in die URL._ Ein gefilterter Belegkatalog
  interessiert den Benutzer. „Schau dir die kritischen, ungeprüften Belege an"
  ist genau die Nachricht, die man verschicken will.
- Zurück-Button und Lesezeichen würden mitarbeiten, wie bei der Timeline.
- Die sieben Werte wären weiterhin ein Objekt — die Demo-7-Begründung bleibt
  gültig, nur der Speicherort wäre ein anderer.

**Dagegen:**

- Die Adresse wäre bei vollständigem Filter unlesbar lang. Sieben Parameter plus
  Suchbegriff plus die Beleg-ID in der Route.
- Jeder Tastendruck im Suchfeld wäre ein Eintrag in der Browser-Historie. Ein
  Suchbegriff mit elf Zeichen bedeutet elf Mal Zurück-Drücken, um wieder beim
  leeren Feld zu sein. Das ist mit `replace: true` lösbar, aber dann arbeitet
  der Zurück-Button bei der Suche _nicht_ mehr mit — und damit ist der
  Hauptvorteil für das wichtigste Feld weg.
- Jeder Wert aus der URL ist `string | null` und muss validiert werden. Beim
  Reducer ist der Zustand typisiert; nur die zwei Stellen, die aus dem DOM
  kommen, brauchen einen Guard.

**Wo ich stehe:** Ich würde heute wahrscheinlich einen Mittelweg nehmen — die
fünf Dropdowns und die Sortierung in die URL, den Suchbegriff lokal. Das ist
genau die Trennung, die die Historien-Frage auflöst, weil nur das Suchfeld
tippweise feuert.

Dass ich das nicht gemacht habe, hat einen Grund, den ich auch nennen würde: Es
wäre ein Zustand an zwei Orten. Und nach Demo 9 bin ich bei zwei Orten für
zusammengehörige Werte vorsichtig geworden — die gemischte Lösung ist sauberer
in der URL und unsauberer im Code. Ich bin nicht sicher, welcher Preis der
niedrigere ist.

### Frage: Eine Bug-Kategorie aus Übung 1, die jetzt konstruktionsbedingt unmöglich ist. Warum schließt die Architektur sie aus?

**Der veraltete Dashboard-Zähler. Nicht behoben — nicht mehr formulierbar.**

Der Bug in Übung 1 hatte drei Zutaten:

1. Die Zahl wurde **berechnet und dann weggeschrieben** — als Text ins DOM,
   ohne Verbindung zu ihrer Quelle.
2. Neu berechnet wurde nur, wenn jemand `renderDashboard()` **aufrief**.
3. Ein Flag, `state.viewRendered.dashboard`, verhinderte genau das ab dem
   zweiten Besuch.

Die dritte Zutat war sogar als Optimierung gedacht: nicht neu zeichnen, was
schon gezeichnet ist.

**Warum das heute nicht mehr geht — die Zutaten existieren nicht mehr:**

Zutat 1 fehlt, weil die Zahl **nirgends liegt**. Im JSX steht der Ausdruck
`bookmarks.length`. Es gibt keinen Ort, an dem eine veraltete Fassung dieser
Zahl gespeichert sein könnte. Eine Zahl, die man nicht speichert, kann nicht
veralten — man kann nicht zwei Fassungen von etwas haben, das keinen Ort hat.

Zutat 2 fehlt, weil niemand das Neuzeichnen auslösen muss. Der Setter von
`useState` tut es. Die Kette _Lesezeichen ändern → `setBookmarks` → Render →
`bookmarks.length` wird neu ausgewertet_ hat keinen Schritt, den man vergessen
oder überspringen könnte.

Zutat 3 kann nicht wiederkommen, weil die Optimierung, die sie darstellte, Teil
von React ist. Der Vergleich im virtuellen DOM macht genau das — nur ändern, was
sich unterscheidet — und zwar auf der Ebene einzelner Knoten statt ganzer
Ansichten. Ein Flag „diese Ansicht ist schon gezeichnet" wäre nicht nur
unnötig, es wäre schlechter.

**Der allgemeine Satz dahinter:** Der Bug brauchte einen manuellen Schritt
zwischen Datenänderung und Anzeige. Reacts Render-Modell hat diesen Schritt
nicht — die Anzeige ist eine Funktion des Zustands, und die Funktion wird
automatisch neu ausgewertet. Man kann nicht vergessen, etwas zu tun, was man
nicht tun muss.

> **Die Grenze dieser Aussage**, falls nachgebohrt wird: Das gilt für
> **abgeleitete** Werte. Für **kopierte** gilt es nicht — Fehler 1 aus Demo 9
> war ein veralteter Zustand in React. React schließt veraltete _Ableitungen_
> aus, nicht veraltete _Kopien_. Was es dafür bietet, ist die Alternative:
> Ableiten ist billiger als Kopieren, also tut man es.
