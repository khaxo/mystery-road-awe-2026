interface Props {
  text: string;
}

/** Einheitliche Darstellung fuer "hier ist nichts". */
export function EmptyState({ text }: Props) {
  return <p className="empty-state">{text}</p>;
}
