// Absichtlicher LINT-Fehler fuer Demo 8.
// Wichtig: Das ist KEIN Typfehler - `tsc` laeuft hier sauber durch.
// Nur ESLint beanstandet es, wegen der Regel @typescript-eslint/no-explicit-any.
export function formatiereRohdaten(eingabe: any): string {
  return String(eingabe);
}
