# Demo 1 — Package Manager & Projekt-Metadaten

**Dauer:** ca. 3 Minuten. Kein Server nötig, nur Terminal + Editor.

---

## Vorbereitung

Terminal im Projektordner:

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026"
```

---

## Schritt 1 — Zeig, dass es vorher kein npm gab

```bash
git show 6fe19a0 --stat --oneline | head -5
```

Und dann:

```bash
git show 22cb2d8 --name-only --format="" | head
```

**Sag dazu:**

> "Nach Übung 1 bestand das Projekt nur aus `index.html`, `styles.css` und dem
> `js/`-Ordner. Es gab keine `package.json`, keine Abhängigkeiten, kein Build-Werkzeug.
> Geladen wurde über einen einfachen statischen Dateiserver."

---

## Schritt 2 — Zeig die `package.json`

```bash
cat package.json
```

**Zeig mit dem Finger auf / sag dazu:**

> "Hier ist das Projekt-Manifest. Name, Version, Beschreibung, Autor, Repository-URL.
> `"type": "module"` sagt Node, dass die Dateien ES-Module sind — das passt zum
> Modul-Split aus Übung 1.
> Unten stehen die `devDependencies`: Vite, ESLint, Prettier, TypeScript. **Alle vier
> sind devDependencies, keine davon ist eine `dependency`** — dazu gleich mehr.
> Dieses Projekt hat null Laufzeitabhängigkeiten, weil der Browser am Ende nur fertig
> gebautes JavaScript bekommt."

---

## Schritt 3 — Zeig die `.gitignore`

```bash
cat .gitignore
```

**Sag dazu:**

> "`node_modules/` und `dist/` sind ignoriert. Beides ist **generiert**:
> `node_modules` lässt sich jederzeit aus `package.json` plus Lockfile wiederherstellen,
> `dist/` aus dem Quellcode. Generierte Dateien gehören nicht in die Versionskontrolle."

---

## Schritt 4 — Zeig das Lockfile

```bash
ls -lh package-lock.json && git log --oneline -1 -- package-lock.json
```

**Sag dazu:**

> "Das Lockfile ist committet — das ist der entscheidende Punkt. Zeig ich gleich, warum."

Dann einen Blick hinein:

```bash
head -20 package-lock.json
```

---

## Schritt 5 — Der Unterschied Manifest vs. Lockfile (der stärkste Teil)

```bash
grep '"vite"' package.json && grep -A2 '"node_modules/vite"' package-lock.json | head -4
```

**Sag dazu:**

> "Hier sieht man den Unterschied. In der `package.json` steht ein **Bereich** — das
> Dach-Zeichen heißt 'diese Version oder neuer, aber unter der nächsten Hauptversion'.
> Im Lockfile steht die **exakte** Version plus ein Integritäts-Hash, und das für
> jedes einzelne der rund 200 transitiven Pakete.
>
> Ohne committetes Lockfile bekommt ein Teammitglied, das nächste Woche installiert,
> womöglich eine neuere Version — und damit einen Bug, den es bei mir nicht gibt.
> In der CI wäre jeder Lauf potenziell ein anderer Build. Deshalb läuft in beiden
> Workflows `npm ci` und nicht `npm install`: `npm ci` installiert strikt nach Lockfile
> und bricht sogar ab, wenn Lockfile und `package.json` auseinanderlaufen."

---

## Erwartete Fragen und deine Antworten

**"Warum npm und nicht pnpm?"**

> "npm ist mit Node bereits installiert, pnpm nicht. Bei einem Projekt dieser Größe mit
> einem Entwickler ist der Nutzen von pnpm gering, der Zusatzaufwand real — zum Beispiel
> bräuchte ich in der CI eine zusätzliche `pnpm/action-setup`-Action. Die Entscheidung
> ist umkehrbar: `pnpm import` erzeugt aus meinem `package-lock.json` eine
> `pnpm-lock.yaml`."

**"Was macht pnpm denn anders?"**

> "Zwei Dinge. Erstens der Speicher: npm legt in **jedem** Projekt eine eigene Kopie
> aller Pakete ab. pnpm legt jedes Paket genau einmal in einem globalen Store ab und
> verlinkt es per Hardlink — das spart Platz und Installationszeit über viele Projekte
> hinweg.
> Zweitens, und das ist mir wichtiger: pnpm baut `node_modules` **nicht flach** auf.
> Unter npm liegen alle Pakete nebeneinander, und man kann aus Versehen etwas
> importieren, das man nie selbst installiert hat — das nennt sich Phantom-Dependency
> und fliegt einem auf, sobald das andere Paket seine Abhängigkeit wechselt. Unter pnpm
> geht das gar nicht erst."

**"Was löst ein Package Manager, das manuelles Herunterladen nicht löst?"**

> "Vor allem **transitive Abhängigkeiten**. Vite allein zieht rund 200 Pakete nach — die
> würde niemand von Hand verwalten. Dazu kommen: ein maschinenlesbares Manifest, mit dem
> jeder denselben Stand herstellt; Versionsbereiche, über die ich Sicherheitsupdates
> bekomme, ohne jede Abhängigkeit einzeln zu verfolgen; und `npm audit` für bekannte
> Schwachstellen."

**"Warum sind Vite, ESLint und TypeScript alle devDependencies?"**

> "Weil sie zur **Bauzeit** laufen, nicht zur Laufzeit. Was der Browser am Ende bekommt,
> ist der Inhalt von `dist/` — da steckt kein Vite drin, nur fertiges JavaScript.
> `dependencies` wären Bibliotheken, die im ausgelieferten Produkt landen. Davon hat
> dieses Projekt keine einzige."
