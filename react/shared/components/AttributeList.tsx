interface Props {
  titel: string;
  eintraege: readonly string[];
}

/**
 * Beschriftete Aufzaehlung. Wird an zwei Stellen benutzt:
 * - Personenkarte: "Responsibilities"
 * - Ortskarte: "Contains"
 *
 * In der Vanilla-Version war dieses Markup zweimal getrennt ausgeschrieben,
 * einmal in renderPeople() und einmal in renderLocations().
 */
export function AttributeList({ titel, eintraege }: Props) {
  // Conditional Rendering, Technik 2: early return mit null.
  // Eine leere Liste soll gar nichts rendern - auch keine Ueberschrift und
  // kein leeres <ul>, das im CSS trotzdem Abstand erzeugen wuerde.
  if (eintraege.length === 0) return null;

  return (
    <>
      <p>
        <strong>{titel}:</strong>
      </p>
      <ul>
        {eintraege.map((eintrag) => (
          <li key={eintrag}>{eintrag}</li>
        ))}
      </ul>
    </>
  );
}
