import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { createRoot } from "react-dom/client";
import { queryClient } from "./api";
import "./i18n";
import { GatePage } from "./pages/GatePage";
import { HomePage } from "./pages/HomePage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <JotaiProvider>
      <GatePage>
        <HomePage />
      </GatePage>
    </JotaiProvider>
  </QueryClientProvider>,
);
