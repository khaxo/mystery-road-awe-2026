import { useLocation } from "react-router-dom";
import { useDokumentTitel } from "../shared/hooks/useDokumentTitel.js";

const TITEL: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/evidence": "Evidence Catalogue",
  "/team/people": "People",
  "/team/locations": "Locations",
  "/timeline": "Timeline",
  "/workspace": "Workspace"
};

function titelFuer(pfad: string): string {
  const treffer = TITEL[pfad];
  if (treffer) return `${treffer} – Project ReMotion`;

  // Belegdetail: /evidence/E14
  if (pfad.startsWith("/evidence/")) {
    return `${pfad.slice("/evidence/".length)} – Project ReMotion`;
  }
  // Personenprofil: /team/people/nova-byte
  if (pfad.startsWith("/team/people/")) {
    return `${pfad.slice("/team/people/".length)} – Project ReMotion`;
  }
  return "Project ReMotion";
}

/**
 * Komponente ohne Ausgabe.
 *
 * Sie rendert `null` und tut nichts, ausser einen Effekt zu halten: Sie liest
 * den aktuellen Pfad und schreibt daraus den Tab-Titel. Das ist kein Trick,
 * sondern die saubere Form fuer "ein Effekt, der zu keiner Darstellung
 * gehoert" - die Zuordnung Pfad auf Titel steht dadurch an einer Stelle statt
 * in jeder der fuenf Ansichten.
 *
 * Sie muss INNERHALB des Routers stehen, weil `useLocation` den Router
 * braucht.
 */
export function Dokumenttitel() {
  const { pathname } = useLocation();
  useDokumentTitel(titelFuer(pathname));
  return null;
}
