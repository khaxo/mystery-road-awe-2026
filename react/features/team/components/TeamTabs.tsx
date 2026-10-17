import { NavLink } from "react-router-dom";

/**
 * Die beiden Tabs als echte Links.
 *
 * In der Vanilla-Version war das `switchPeopleTab()`: ein Klick-Handler, der
 * vier CSS-Klassen umgehaengt hat, ohne die URL zu aendern. Dadurch liess sich
 * der Locations-Tab weder verlinken noch als Lesezeichen speichern, und der
 * Zurueck-Button sprang an ihm vorbei.
 */
export function TeamTabs() {
  return (
    <div className="tab-bar">
      <NavLink
        to="/team/people"
        className={({ isActive }) => (isActive ? "tab-btn active" : "tab-btn")}
      >
        People
      </NavLink>
      <NavLink
        to="/team/locations"
        className={({ isActive }) => (isActive ? "tab-btn active" : "tab-btn")}
      >
        Locations
      </NavLink>
    </div>
  );
}
