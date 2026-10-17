interface Props {
  wert: number | string;
  label: string;
}

/** Eine Kennzahl-Kachel. Ersetzt die Funktion statCardHTML() aus dashboard.ts. */
export function StatCard({ wert, label }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-value">{wert}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
