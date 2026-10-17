import { Link, useLocation } from "react-router-dom";
import { Card } from "../shared/components/Card.js";

/**
 * 404-Ansicht fuer alle Pfade, die keine Route trifft.
 *
 * Bewusst anders als die Vanilla-Version: Dort hat handleHashChange() bei einem
 * unbekannten Hash **still** auf das Dashboard zurueckgefallen - die URL blieb
 * falsch stehen, und der Benutzer bekam keinen Hinweis, dass sein Link kaputt
 * war. Hier wird der Fehler sichtbar gemacht und ein Weg zurueck angeboten.
 */
export function NotFoundView() {
  const { pathname } = useLocation();

  return (
    <section className="view active">
      <h2>Seite nicht gefunden</h2>
      <Card>
        <p>
          Der Pfad <code>{pathname}</code> gehoert zu keiner bekannten Ansicht.
        </p>
        <p>
          <Link className="btn btn-secondary btn-small" to="/dashboard">
            Zum Dashboard
          </Link>
        </p>
      </Card>
    </section>
  );
}
