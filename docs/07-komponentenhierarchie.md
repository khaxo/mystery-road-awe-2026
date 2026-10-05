# Demo 7 — Komponentenhierarchie für die gesamte Anwendung

Entwurf für **alle fünf Views**, nicht nur für das, was in dieser Übung gebaut wurde.
Was bereits existiert, ist mit ✅ markiert; der Rest folgt in Übung 4 und 5.

## Der Baum

```
App ✅
│
├── AppHeader ✅
│   ├── Brand ✅ (derzeit inline im Header)
│   └── MainNav ✅
│       └── NavButton            (derzeit inline per map)
│
└── <aktive View>
    │
    ├── DashboardView ✅
    │   ├── CaseSummaryCard ✅
    │   │   └── Badge ✅
    │   ├── StatGrid
    │   │   └── StatCard ✅        (×5)
    │   ├── ReviewProgress ✅
    │   │   └── ProgressBar        (derzeit inline)
    │   ├── RecentEvidenceList ✅
    │   │   └── MiniListItem       → Badge ✅
    │   └── RecentTimelineList ✅
    │       └── MiniListItem
    │
    ├── EvidenceView
    │   ├── EvidenceFilterBar
    │   │   ├── SearchInput
    │   │   ├── FilterSelect       (×5: Typ, Person, Ort, Status, Relevanz)
    │   │   ├── SortSelect
    │   │   └── Button             ("Clear filters")
    │   ├── EvidenceList
    │   │   └── EvidenceCard
    │   │       ├── BookmarkButton
    │   │       ├── Badge          (Status)
    │   │       ├── Badge          (Relevanz)
    │   │       └── TagList → Tag
    │   └── EvidenceDetailPanel
    │       ├── Badge
    │       ├── PersonLink         (×n)
    │       ├── LocationLink       (×n)
    │       ├── StatusSelect
    │       ├── RelevanceSelect
    │       └── NoteEditor
    │           └── Button
    │
    ├── PeopleView
    │   ├── TabBar → TabButton     (×2)
    │   ├── PeopleGrid
    │   │   └── PersonCard
    │   │       ├── Avatar
    │   │       └── EvidenceCountLink
    │   └── LocationGrid
    │       └── LocationCard
    │
    ├── TimelineView
    │   ├── TimelineFilterBar
    │   │   ├── SortSelect
    │   │   └── FilterSelect       (×3: Person, Ort, Typ)
    │   ├── TimelineList
    │   │   └── TimelineEntry
    │   │       ├── Badge          (Certainty)
    │   │       └── EvidenceLinkButton
    │   └── EvidenceQuickViewModal
    │       └── Modal              (generisch)
    │           ├── Badge
    │           └── Button
    │
    └── WorkspaceView
        ├── BookmarkList
        │   └── BookmarkItem → Button
        ├── NoteList
        │   └── NoteItem
        └── HypothesisForm
            ├── FormField          (generisch: Label + Fehler + Kind)
            ├── Select
            ├── MultiSelect
            ├── TextArea
            ├── RangeSlider
            └── Button
```

## Props für fünf Komponenten

### `StatCard` ✅ — gebaut

```ts
{
  wert: number | string;
  label: string;
}
```

Von `DashboardView` berechnet aus den geladenen Daten
(`evidence.length`, `people.length`, …). Rein darstellend, kennt die Herkunft nicht.

### `EvidenceCard`

```ts
{
  evidence: Evidence;
  istGemerkt: boolean;
  aufBookmark: (id: string) => void;
  aufOeffnen: (id: string) => void;
}
```

Die `Evidence` kommt aus der geladenen Liste. `istGemerkt` **nicht** aus dem Objekt
selbst, sondern aus der Bookmark-Liste — die Karte soll nicht wissen, wo Bookmarks
gespeichert werden. Die beiden Callbacks gehen an den Elternteil zurück; die Karte
ändert selbst nichts.

### `Badge` ✅ — gebaut

```ts
{
  text: string;
  klasse: string;
}
```

Die aufrufende Stelle bestimmt beides. Taucht in vier Views auf.

### `HypothesisForm`

```ts
{
  entwurf: Partial<Hypothesis>;
  personen: Person[];      // für das Verdächtigen-Dropdown
  evidence: Evidence[];    // für die Mehrfachauswahl
  aufSpeichern: (entwurf: Hypothesis) => void;
}
```

`personen` und `evidence` kommen aus den geladenen Daten, `entwurf` aus dem
`localStorage`. Das Speichern geht nach oben — das Formular kennt den `localStorage`
nicht.

### `EvidenceQuickViewModal`

```ts
{
  evidenceId: string | null;   // null = geschlossen
  aufSchliessen: () => void;
  aufVollansicht: (id: string) => void;
}
```

Bewusst `string | null` statt eines zusätzlichen `istOffen`-Flags: Zwei Werte, die
denselben Sachverhalt beschreiben, können auseinanderlaufen. Ein Wert kann das nicht.

## Fragen

### Nach welchen Kriterien wird etwas eine eigene Komponente?

Vier Kriterien, in dieser Reihenfolge:

1. **Es kommt mehrfach vor.** `Badge` erscheint in vier Views. Duplizierte Darstellung
   ist der häufigste Grund, warum zwei Stellen irgendwann unterschiedlich aussehen.
2. **Es hat eigenen Zustand oder eigene Effekte.** `NoteEditor` hält den noch nicht
   gespeicherten Text. Das gehört dorthin und nicht in den Elternteil — sonst rendert
   bei jedem Tastendruck die halbe View mit.
3. **Es hat eine klare, benennbare Verantwortung.** Wenn sich der Name ohne „und" sagen
   lässt, ist es meist eine gute Grenze. `EvidenceFilterBar` beschreibt sich selbst;
   „EvidenceFilterUndSortierungUndSuche" wäre ein Warnzeichen.
4. **Es wird sonst zu groß.** `renderEvidenceDetail()` war in der Vanilla-Version über
   siebzig Zeilen String-Konkatenation. Das ist nicht mehr lesbar.

**Wogegen ich mich bewusst entschieden habe:** `Brand` und `NavButton` bleiben vorerst
inline in `AppHeader` bzw. `MainNav`. Sie kommen je nur an einer Stelle vor, haben
keinen Zustand, und eine eigene Datei für drei Zeilen JSX kostet mehr an Navigation als
sie an Klarheit bringt. Wenn der Nav-Button Zusatzverhalten bekommt — ein Zähler-Badge,
eine Tastenkürzel-Anzeige — wird er extrahiert.

### Eine Komponente, die mehrfach vorkommt

**`Badge`.** Sie erscheint im Dashboard (Fallstatus, Evidence-Status), in der
Evidence-Liste (Status und Relevanz pro Karte), in der Detailansicht, in der Timeline
(Certainty) und im Modal.

In der Vanilla-Version gab es dafür **keine gemeinsame Stelle**. Das Markup war per
String-Konkatenation dupliziert, einmal in jeder Render-Funktion:

```js
'<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
```

Immerhin war die _Klassenlogik_ in `getStatusBadgeClass()` zentralisiert — die Struktur
aber nicht. Wer dem Badge ein Symbol oder ein `title`-Attribut hinzufügen wollte, musste
sechs Stellen finden und alle gleich ändern. Dass die Timeline eine **eigene** Funktion
`certaintyBadgeClass()` mit anderen Rückgabewerten hat, zeigt, wie die Varianten
auseinandergelaufen sind.

Mit einer Komponente gibt es eine Datei und einen Ort für jede künftige Änderung.

### Warum jetzt schon alles entwerfen?

Drei Gründe:

1. **Die gemeinsamen Teile zeigen sich nur in der Gesamtsicht.** `Badge`, `Button`,
   `FilterSelect` und `Modal` wären mir nie aufgefallen, hätte ich nur das Dashboard
   gezeichnet — dort kommt `Badge` nur zweimal vor. Erst über alle fünf Views wird
   sichtbar, dass es ein Baustein ist.

2. **Es verhindert, dass ich mir die Datenarchitektur verbaue.** Der Entwurf macht
   sichtbar, dass Evidence-Daten in **vier** Views gebraucht werden. Daraus folgt, dass
   mein jetziges `useCaseData()` in `App` eine Zwischenlösung ist — ich weiß jetzt
   schon, dass es ein Context oder Store wird, statt es später schmerzhaft zu entdecken.

3. **Die Reihenfolge der Migration wird begründbar.** Das Dashboard zuerst, weil es die
   wenigsten Interaktionen hat und die meisten Bausteine einführt, die andere Views
   später wiederverwenden. Der Workspace zuletzt, weil er mit dem Formular den meisten
   lokalen Zustand hat.

Der Entwurf ist ausdrücklich **kein Vertrag**. Er wird sich beim Bauen ändern — aber als
Hypothese, die man widerlegt, ist er mehr wert als gar keine.
