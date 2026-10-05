import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

// Der Weg vom Quellcode in die Seite:
//   react.html laedt dieses Modul  ->  createRoot haengt sich an #root
//   ->  render(<App />)  ->  React erzeugt die echten DOM-Knoten darin.
// Vorher (Vanilla) stand das Markup bereits in index.html und die TS-Module
// haben es nur gefuellt. Hier ist das HTML fast leer und React baut alles.
const wurzel = document.getElementById("root");
if (!wurzel) throw new Error("#root fehlt in react.html");

createRoot(wurzel).render(
  // StrictMode ist nur im Dev-Modus aktiv und ruft Komponenten absichtlich
  // doppelt auf, um Seiteneffekte im Render aufzudecken. Im Build ist es wirkungslos.
  <StrictMode>
    <App />
  </StrictMode>
);
