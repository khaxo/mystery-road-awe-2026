import { MainNav } from "./MainNav.js";
import type { ViewName } from "../hooks/useHashRoute.js";

interface Props {
  aktiveView: ViewName;
  aufNavigation: (ziel: ViewName) => void;
}

/** Kopfbereich: Branding links, Navigation rechts. */
export function AppHeader({ aktiveView, aufNavigation }: Props) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <img src="assets/logo/logo.svg" alt="Project ReMotion logo" className="brand-logo" />
          <div>
            <h1>Project ReMotion</h1>
            <p className="subtitle">
              Investigate the failure of an AI-assisted rehabilitation robot.
            </p>
          </div>
        </div>
        <MainNav aktiveView={aktiveView} aufNavigation={aufNavigation} />
      </div>
    </header>
  );
}
