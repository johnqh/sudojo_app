import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Initialize all services BEFORE importing App
import { initializeApp } from "./config/initialize";
initializeApp();

// Initialize i18n
import "./i18n";

// Import App AFTER initialization
import App from "./App";

// Render React app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
