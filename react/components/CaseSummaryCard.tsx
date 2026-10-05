import type { CaseData } from "../../js/types.js";
import { Badge } from "./Badge.js";

interface Props {
  caseData: Partial<CaseData>;
}

export function CaseSummaryCard({ caseData }: Props) {
  return (
    <div className="case-summary-card">
      <h3>{caseData.title ?? "Case"}</h3>
      <p>
        <Badge text={(caseData.status ?? "unknown").toUpperCase()} klasse="badge-flagged" />
      </p>
      <p>{caseData.summary ?? ""}</p>
    </div>
  );
}
