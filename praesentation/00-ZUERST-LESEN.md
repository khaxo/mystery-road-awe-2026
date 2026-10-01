# Zuerst lesen — Grundlagen für alle 10 Demos

## Deine Eckdaten

| Was               | Wert                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Projektordner     | `/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026` |
| GitHub-Repo       | https://github.com/khaxo/mystery-road-awe-2026                       |
| Live-Seite        | https://khaxo.github.io/mystery-road-awe-2026/                       |
| Actions-Übersicht | https://github.com/khaxo/mystery-road-awe-2026/actions               |
| Dev-Server        | http://localhost:5173/mystery-road-awe-2026/                         |
| Preview-Server    | http://localhost:4173/mystery-road-awe-2026/                         |

## Vor der Präsentation einmal vorbereiten

Öffne **drei Fenster** und lass sie offen:

1. **Terminal** im Projektordner
2. **Browser-Tab A** auf der Live-Seite
3. **Browser-Tab B** auf der Actions-Seite

Terminal vorbereiten — diesen Befehl einmal ausführen:

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && git status
```

Es muss erscheinen: `On branch main` und `nothing to commit, working tree clean`.
Steht da etwas anderes, siehe "Notfall" unten.

## Die wichtigste Regel: NICHT auschecken

Du musst für fast keine Demo einen alten Commit auschecken. Das ist gut, denn
Auschecken bringt dich in den sogenannten **"detached HEAD"**-Zustand, und da kommen
Anfänger schwer wieder raus.

Stattdessen zeigst du alte Stände so:

```bash
git show <commit>:<datei>
```

Das druckt die Datei aus einem alten Commit **im Terminal aus**, ohne irgendetwas zu
verändern. Beispiel — so sah `app.js` ganz am Anfang aus:

```bash
git show 22cb2d8:app.js | head -40
```

Und so vergleichst du zwei Stände:

```bash
git diff <alt> <neu> -- <datei>
```

Beides ist **völlig ungefährlich**. Dein Arbeitsstand bleibt unangetastet.

## Deine Commits (von alt nach neu)

### Übung 1

| Commit    | Was                                             |
| --------- | ----------------------------------------------- |
| `22cb2d8` | Ausgangszustand des Dozenten (= Tag `original`) |
| `704f962` | Bugfix 1                                        |
| `9f51911` | Bugfixes 5–6                                    |
| `3a17003` | Modul-Split                                     |
| `6fe19a0` | async/await, Arrow Functions, var-Sweep         |

### Übung 2

| Commit    | Was                        | Gehört zu         |
| --------- | -------------------------- | ----------------- |
| `2fbde76` | npm, Vite, Build           | Demo 1–3          |
| `c4e144d` | ESLint + Prettier          | Demo 4            |
| `681a8eb` | TypeScript-Migration       | Demo 5–7          |
| `6af60ad` | GitHub-Actions-Workflows   | Demo 8–9          |
| `f3a6097` | **absichtlicher Fehler**   | Demo 10           |
| `1c9b891` | Fehler behoben             | Demo 8, 10        |
| `9ef4018` | ESLint-Config des Dozenten | Demo 4 (Nachtrag) |

## Server starten und stoppen

**Dev-Server** (für Demo 2):

```bash
npm run dev
```

Läuft, bis du **Strg + C** drückst. Öffne dann http://localhost:5173/mystery-road-awe-2026/

**Preview-Server** (für Demo 3):

```bash
npm run preview
```

Öffne dann http://localhost:4173/mystery-road-awe-2026/

Wichtig: Es kann immer nur **ein** Server pro Port laufen. Kommt die Meldung
`Port is already in use`, läuft schon einer — dann einfach den Browser benutzen.

## Notfall: Ich habe etwas kaputtgemacht

Alles verwerfen und zurück auf den letzten Stand:

```bash
cd "/Users/khaledsalama/Advanced Web Engineering/mystery-road-awe-2026" && git checkout main && git reset --hard origin/main
```

**Achtung:** Dieser Befehl löscht alle nicht gespeicherten Änderungen. Das ist hier
gewollt — dein fertiger Stand liegt sicher auf GitHub.

Steht im Terminal irgendwo `detached HEAD`, hilft dasselbe:

```bash
git checkout main
```

## Wenn du eine Frage nicht weißt

Sag es ehrlich: _"Das habe ich nicht geprüft, ich würde es so nachschauen: …"_ — und
nenne das Werkzeug (Netzwerk-Tab, `git log`, die Actions-Logs). Das ist deutlich besser
als zu raten. Alle ausführlichen Antworten stehen in `CHANGES-2.md`.
