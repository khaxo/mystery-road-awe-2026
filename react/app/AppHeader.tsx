import { Link } from "react-router-dom";
import { MainNav } from "./MainNav.js";

/** Kopfbereich: Branding links, Navigation rechts. Kennt keine Daten. */
export function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/dashboard" className="brand">
          <img src="assets/logo/logo.svg" alt="Project ReMotion logo" className="brand-logo" />
          <div>
            <h1>Project ReMotion</h1>
            <p className="subtitle">
              Investigate the failure of an AI-assisted rehabilitation robot.
            </p>
          </div>
        </Link>
        <MainNav />
      </div>
    </header>
  );
}
