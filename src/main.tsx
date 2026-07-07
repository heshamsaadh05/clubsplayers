import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved language direction early to prevent RTL/LTR flash
try {
  const saved = localStorage.getItem("preferred_language");
  if (saved) {
    // Known RTL codes; extend as needed
    const rtlLangs = ["ar", "he", "fa", "ur"];
    const dir = rtlLangs.includes(saved) ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = saved;
  }
} catch {
  // ignore
}

createRoot(document.getElementById("root")!).render(<App />);
