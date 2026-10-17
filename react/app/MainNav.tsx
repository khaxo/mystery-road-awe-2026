import { NavLink } from "react-router-dom";

interface NavEintrag {
  pfad: string;
  label: string;
}

const EINTRAEGE: readonly NavEintrag[] = [
  { pfad: "/dashboard", label: "Dashboard" },
  { pfad: "/team/people", label: "People & Locations" },
  { pfad: "/timeline", label: "Timeline" }
];

/**
 * Navigationsleiste.
 *
 * `NavLink` statt `<button onClick>`: Es rendert ein echtes <a> mit href.
 * Dadurch funktionieren Mittelklick, "in neuem Tab oeffnen" und das Kopieren
 * der Adresse - alles Dinge, die ein Klick-Handler nicht liefert.
 *
 * Die aktive Markierung kommt von NavLink selbst ueber `isActive`. In der
 * Vanilla-Version musste handleHashChange() die Klasse "active" bei allen
 * Buttons entfernen und bei einem setzen.
 */
export function MainNav() {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {EINTRAEGE.map(({ pfad, label }) => (
        <NavLink
          key={pfad}
          to={pfad}
          className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
