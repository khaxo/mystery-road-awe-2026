import type { ReactNode } from "react";

interface Props {
  /** Optionale Ueberschrift. Fehlt sie, wird kein <h3> gerendert. */
  titel?: string;
  /** Zusaetzliche CSS-Klasse, damit dieselbe Huelle verschiedene Kartenarten tragen kann. */
  klasse?: string;
  /** Der Inhalt. Bewusst `children` statt einer Daten-Prop - siehe unten. */
  children: ReactNode;
}

/**
 * Generische Kartenhuelle.
 *
 * Diese Komponente bekommt ihren Inhalt ueber `children`, nicht ueber eine
 * Daten-Prop. Der Grund: Sie soll **nichts ueber den Inhalt wissen**. Eine
 * Personenkarte, eine Ortskarte und ein Dashboard-Panel haben voellig
 * verschiedene Innereien, aber dieselbe Huelle.
 *
 * Mit einer Daten-Prop wie `inhalt: string` koennte sie nur Text tragen. Mit
 * `children` kann der Aufrufer beliebiges JSX hineinstellen - und die Karte
 * bleibt trotzdem die einzige Stelle, an der das Huellen-Markup steht.
 */
export function Card({ titel, klasse, children }: Props) {
  return (
    <div className={klasse ? `panel-card ${klasse}` : "panel-card"}>
      {/* Conditional Rendering, Technik 1: logisches UND.
          Sicher, weil `titel` ein String ist - bei einer Zahl waere 0 das Problem. */}
      {titel && <h3>{titel}</h3>}
      {children}
    </div>
  );
}
