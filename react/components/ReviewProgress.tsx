interface Props {
  geprueft: number;
  gesamt: number;
}

export function ReviewProgress({ geprueft, gesamt }: Props) {
  // Wird bei jedem Render neu berechnet. Das ist hier billig (eine Division)
  // und deshalb bewusst nicht memoisiert - useMemo haette eigene Kosten.
  const prozent = gesamt === 0 ? 0 : Math.round((geprueft / gesamt) * 100);

  return (
    <div className="dashboard-panel">
      <h3>Review progress</h3>
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: `${prozent}%` }} />
      </div>
      <p>{prozent}% of evidence reviewed</p>
    </div>
  );
}
