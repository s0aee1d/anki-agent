import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { ReactElement, ReactNode } from "react";
import "../i18n";

export function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const store = createStore();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>{children}</Provider>
    </QueryClientProvider>
  );
  return { Wrapper, queryClient, store };
}

/** Renders with fresh React Query + Jotai + the `en` i18n resources. */
export function renderWithProviders(ui: ReactElement) {
  const ctx = createWrapper();
  return { ...ctx, ...render(ui, { wrapper: ctx.Wrapper }) };
}
