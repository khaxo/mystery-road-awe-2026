/**
 * Übungskomponente für Demo 5.
 *
 * Bewusst minimal: kein State, keine Props, keine Effekte. Sie rendert nur
 * statische Daten als JSX. Sie wird nirgends eingebunden - sie existiert, um
 * zu zeigen, dass ich JSX schreiben und erklären kann.
 */

const FALL = {
  id: "REMOTION-2026-10",
  titel: "Project ReMotion",
  status: "open",
  beteiligte: ["Signal Scholar", "Patch Vector", "Nova Byte"]
};

export function HalloFall() {
  return (
    <article className="case-summary-card">
      <h3>{FALL.titel}</h3>

      {/* Ein Ausdruck in geschweiften Klammern. Alles darin ist normales
          JavaScript - hier eine Methode auf einem String. */}
      <p>
        Fallnummer: <strong>{FALL.id.toUpperCase()}</strong>
      </p>

      {/* Kein if/else in JSX, aber Ausdrücke gehen: der ternäre Operator. */}
      <p>Status: {FALL.status === "open" ? "offen" : "geschlossen"}</p>

      {/* Eine Liste entsteht aus einem Array - map() gibt ein Array von
          Elementen zurück, und React rendert jedes davon. key gibt jedem
          Eintrag eine stabile Identität für den Vergleich. */}
      <ul>
        {FALL.beteiligte.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </article>
  );
}
