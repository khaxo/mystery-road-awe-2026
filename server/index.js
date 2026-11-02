// ---------------------------------------------------------------------
// Entwicklungs-Backend fuer Project ReMotion
// ---------------------------------------------------------------------
//
// NUR FUER DIE ENTWICKLUNG. Dieser Server wird nicht deployt und ist nicht
// Teil der GitHub-Pages-Pipeline aus Uebung 2. Siehe README.md, Abschnitt
// "Entwicklungs-Backend".
//
// Er liefert dieselben fuenf Datensaetze aus, die vorher direkt als statische
// Dateien ausgeliefert wurden - aber als echte HTTP-Endpunkte, die langsam
// sein, leer sein und fehlschlagen koennen. Genau diese drei Faehigkeiten
// fehlen einer statischen Datei, und ohne sie laesst sich kein Ladezustand,
// kein Fehlerzustand und kein Wettlauf zwischen Anfragen vorfuehren.
//
// Start:  npm run server
// ---------------------------------------------------------------------

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const hier = dirname(fileURLToPath(import.meta.url));
const DATEN = join(hier, "..", "public", "data");

const PORT = Number(process.env.PORT ?? 3001);
// Grundverzoegerung fuer ALLE Endpunkte, damit man den Ladezustand ueberhaupt
// sehen kann. Ohne sie antwortet der Server von der lokalen Platte in
// ein bis zwei Millisekunden - schneller, als React rendern kann.
const GRUND_VERZOEGERUNG = Number(process.env.API_DELAY ?? 250);

const app = express();

// ---------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------
//
// Hier steht bewusst eigene Middleware statt des cors-Pakets, damit sichtbar
// ist, welcher Header die Sache entscheidet.
//
// Das Problem: Der Vite-Dev-Server laeuft auf http://localhost:5173, dieser
// Server auf http://localhost:3001. Unterschiedlicher Port heisst
// unterschiedlicher Origin, und der Browser blockiert dann per
// Same-Origin-Policy, dass JavaScript von 5173 die Antwort von 3001 LIEST.
//
// Wichtig fuer die Demo: Die Anfrage geht trotzdem raus und der Server
// antwortet. Nur das Lesen der Antwort wird verhindert - deshalb sieht man im
// Netzwerk-Tab eine Antwort und in der Konsole trotzdem einen CORS-Fehler.
//
// Access-Control-Allow-Origin ist die Erlaubnis des Servers, dass genau dieser
// Origin die Antwort lesen darf.
const ERLAUBTE_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173"
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ERLAUBTE_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    // Sagt Caches, dass die Antwort vom Origin der Anfrage abhaengt.
    res.setHeader("Vary", "Origin");
  }
  next();
});

// ---------------------------------------------------------------------
// Die drei Testschalter
// ---------------------------------------------------------------------
//
//   ?delay=2000   wartet 2000 ms vor der Antwort  (fuer Ladezustand und Wettlauf)
//   ?fail=1       antwortet mit 500 statt Daten   (fuer den Fehlerzustand)
//   ?empty=1      antwortet mit einer leeren Liste (fuer den Leerzustand)
//
// Alle drei sind Query-Parameter und damit pro Anfrage einzeln steuerbar.
// Das ist fuer Demo 7 noetig: Dort muss die ERSTE Anfrage langsam und die
// ZWEITE schnell sein - mit einer globalen Einstellung ginge das nicht.
const schlafe = (ms) => new Promise((fertig) => setTimeout(fertig, ms));

function verzoegerungAus(req) {
  const roh = Number(req.query.delay);
  if (!Number.isFinite(roh) || roh < 0) return GRUND_VERZOEGERUNG;
  // Deckel, damit ein Tippfehler nicht den Server fuer eine Stunde blockiert.
  return Math.min(roh, 20000);
}

/** Baut einen GET-Endpunkt fuer eine der JSON-Dateien. */
function endpunkt(pfad, datei, leerWert) {
  app.get(pfad, async (req, res) => {
    const ms = verzoegerungAus(req);
    await schlafe(ms);

    if (req.query.fail) {
      console.log(`[api] ${pfad} -> 500 (angefordert), ${ms}ms`);
      return res.status(500).json({
        fehler: "Simulierter Serverfehler",
        hinweis: "Dieser Fehler wurde ueber ?fail=1 angefordert."
      });
    }

    if (req.query.empty) {
      console.log(`[api] ${pfad} -> leer (angefordert), ${ms}ms`);
      return res.json(leerWert);
    }

    try {
      const inhalt = await readFile(join(DATEN, datei), "utf8");
      const daten = JSON.parse(inhalt);
      console.log(`[api] ${pfad} -> 200, ${ms}ms`);
      return res.json(daten);
    } catch (err) {
      console.error(`[api] ${pfad} -> 500 (Datei unlesbar)`, err);
      return res.status(500).json({ fehler: "Datensatz konnte nicht gelesen werden" });
    }
  });
}

endpunkt("/api/case", "case.json", {});
endpunkt("/api/people", "people.json", []);
endpunkt("/api/locations", "locations.json", []);
endpunkt("/api/timeline", "timeline.json", []);

// Evidence hat zusaetzlich eine Serversuche ueber ?q= - gebraucht fuer Demo 7.
// Die Filterung im Belegkatalog bleibt bewusst im Client (Uebung 5, Demo 4);
// dieser Parameter existiert, damit es eine Anfrage gibt, die von einer
// Benutzereingabe abhaengt und damit ueberhaupt in einen Wettlauf geraten kann.
app.get("/api/evidence", async (req, res) => {
  const ms = verzoegerungAus(req);
  await schlafe(ms);

  if (req.query.fail) {
    console.log(`[api] /api/evidence -> 500 (angefordert), ${ms}ms`);
    return res.status(500).json({
      fehler: "Simulierter Serverfehler",
      hinweis: "Dieser Fehler wurde ueber ?fail=1 angefordert."
    });
  }
  if (req.query.empty) {
    console.log(`[api] /api/evidence -> leer (angefordert), ${ms}ms`);
    return res.json([]);
  }

  try {
    const inhalt = await readFile(join(DATEN, "evidence.json"), "utf8");
    const alle = JSON.parse(inhalt);

    const suche = typeof req.query.q === "string" ? req.query.q.toLowerCase().trim() : "";
    const ergebnis = suche
      ? alle.filter((ev) =>
          `${ev.title} ${ev.summary} ${(ev.tags ?? []).join(" ")}`.toLowerCase().includes(suche)
        )
      : alle;

    console.log(`[api] /api/evidence?q=${suche} -> 200 (${ergebnis.length}), ${ms}ms`);
    return res.json(ergebnis);
  } catch (err) {
    console.error("[api] /api/evidence -> 500 (Datei unlesbar)", err);
    return res.status(500).json({ fehler: "Datensatz konnte nicht gelesen werden" });
  }
});

// Alles andere unter /api ist ein echter 404 mit JSON-Koerper - nicht die
// HTML-Fehlerseite, die Express sonst schickt. Sonst scheitert im Frontend
// erst das JSON.parse und die Fehlermeldung waere irrefuehrend.
app.use("/api", (req, res) => {
  res.status(404).json({ fehler: `Unbekannter Endpunkt: ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`[api] Entwicklungs-Backend auf http://localhost:${PORT}`);
  console.log(`[api] Grundverzoegerung ${GRUND_VERZOEGERUNG}ms (API_DELAY aendert sie)`);
  console.log(`[api] Schalter pro Anfrage: ?delay=<ms>  ?fail=1  ?empty=1`);
});
