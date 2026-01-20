import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Initialize all services BEFORE importing App
import { initializeApp } from "./config/initialize";

// Wait for initialization to complete before rendering
initializeApp().then(async () => {
  // Initialize i18n
  await import("./i18n");

  // Import App AFTER initialization completes
  const { default: App } = await import("./App");

  // Render React app
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
