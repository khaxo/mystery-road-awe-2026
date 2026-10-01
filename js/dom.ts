// Typisierte DOM-Helfer.
//
// document.getElementById() liefert HTMLElement | null, und auf HTMLElement gibt
// es kein .value. Vorher stand in jeder Zeile implizit die Annahme "das Element
// existiert und ist ein <input>". Diese Helfer machen die Annahme explizit und
// an genau einer Stelle pruefbar.

/** Element oder null - fuer Stellen, die mit "nicht da" umgehen koennen. */
export function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/** Element, das im statischen index.html garantiert existiert. Wirft, wenn nicht. */
export function mustEl<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Erwartetes Element #${id} fehlt im DOM`);
  return found as T;
}

/** Wert eines <input>/<select>/<textarea>, leerer String wenn das Element fehlt. */
export function valueOf(id: string): string {
  const found = document.getElementById(id) as HTMLInputElement | null;
  return found ? found.value : "";
}

/**
 * e.target ist EventTarget | null - also weder garantiert vorhanden noch garantiert
 * ein DOM-Element (es koennte z.B. window sein). `instanceof` ist hier eine echte
 * Laufzeitpruefung, kein Cast: der Compiler verengt den Typ, WEIL der Code prueft.
 */
export function targetOf(e: Event): HTMLElement | null {
  return e.target instanceof HTMLElement ? e.target : null;
}

/** Wert des Elements, das ein Event ausgeloest hat - "" wenn es kein Eingabefeld ist. */
export function targetValue(e: Event): string {
  const t = e.target;
  return t instanceof HTMLInputElement ||
    t instanceof HTMLSelectElement ||
    t instanceof HTMLTextAreaElement
    ? t.value
    : "";
}
