import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";
import "./index.css";
import App from "./App.jsx";
import { validateHardwareDetection } from "./utils/hardwareDetection.js";

// Phase 1 Validation: Log hardware detection output
validateHardwareDetection()
  .then((hardware) => {
    console.log("[IOSANS] Hardware Detection Complete:", hardware);
  })
  .catch((error) => {
    console.error("[IOSANS] Hardware Detection Failed:", error);
  });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
