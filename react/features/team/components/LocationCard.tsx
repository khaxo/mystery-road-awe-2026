import type { CaseLocation } from "../../../../js/types.js";
import { AttributeList } from "../../../shared/components/AttributeList.js";
import { Card } from "../../../shared/components/Card.js";

interface Props {
  ort: CaseLocation;
}

/** Rein darstellend: Props rein, JSX raus. Keine Berechnung, keine Daten-Beschaffung. */
export function LocationCard({ ort }: Props) {
  return (
    <Card klasse="location-card" titel={`${ort.id} — ${ort.name}`}>
      <p>{ort.description}</p>
      <AttributeList titel="Contains" eintraege={ort.contains} />
    </Card>
  );
}
