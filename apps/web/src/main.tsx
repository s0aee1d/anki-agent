import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { createRoot } from "react-dom/client";
import { queryClient } from "./api";
import "./i18n";
import { GatePage } from "./pages/GatePage";
import { HomePage } from "./pages/HomePage";
import "./ui/tokens/anki-vars.css";
import "./styles.css";

// Anki themes via a `night-mode` class on the root element; follow the OS setting.
const dark = window.matchMedia("(prefers-color-scheme: dark)");
const applyTheme = () => document.documentElement.classList.toggle("night-mode", dark.matches);
applyTheme();
dark.addEventListener("change", applyTheme);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <JotaiProvider>
      <GatePage>
        <HomePage />
      </GatePage>
    </JotaiProvider>
  </QueryClientProvider>,
);
