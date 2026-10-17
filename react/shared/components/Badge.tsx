interface Props {
  text: string;
  klasse: string;
}

/**
 * Winzige Komponente, die in Dashboard, Evidence-Liste, Detailansicht und
 * Timeline auftaucht. In der Vanilla-Version gab es dafuer keine gemeinsame
 * Stelle - das Badge-Markup war vier Mal per String-Konkatenation
 * dupliziert, einmal pro Render-Funktion.
 */
export function Badge({ text, klasse }: Props) {
  return <span className={`badge ${klasse}`}>{text}</span>;
}
