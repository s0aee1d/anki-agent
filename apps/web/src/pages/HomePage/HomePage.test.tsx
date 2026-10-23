import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockApi } from "../../test/network";
import { renderWithProviders } from "../../test/render";
import { HomePage } from "./HomePage";

const routes = {
  "GET /api/decks": () => [{ deck_id: 1, name: "German", new_count: 1, learn_count: 0, review_count: 2 }],
  "GET /api/study/next": () => ({ card: { cardId: 1, question: "Q", answer: "A", css: "" }, remaining: 1 }),
  "POST /api/sync": () => ({ ok: true, at: Date.UTC(2026, 0, 1, 12, 0, 0) }),
};

describe("HomePage", () => {
  it("navigates from the deck list into a review and back", async () => {
    mockApi(routes);
    renderWithProviders(<HomePage />);
    await userEvent.click(await screen.findByRole("button", { name: /German/ }));
    expect(await screen.findByTitle("Card")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "‹ Decks" }));
    expect(await screen.findByRole("button", { name: /German/ })).toBeInTheDocument();
  });

  it("syncs and shows when it happened", async () => {
    mockApi(routes);
    renderWithProviders(<HomePage />);
    await userEvent.click(await screen.findByRole("button", { name: "Sync" }));
    expect(await screen.findByText(/^Synced /)).toBeInTheDocument();
  });

  it("shows sync errors", async () => {
    mockApi({ ...routes, "POST /api/sync": () => Response.json({ error: "no network" }, { status: 502 }) });
    renderWithProviders(<HomePage />);
    await userEvent.click(await screen.findByRole("button", { name: "Sync" }));
    expect(await screen.findByText("no network")).toBeInTheDocument();
  });

  it("opens and closes the chat panel", async () => {
    mockApi(routes);
    renderWithProviders(<HomePage />);
    await userEvent.click(await screen.findByRole("button", { name: "OpenClaw" }));
    expect(screen.getByRole("dialog", { name: "Chat with OpenClaw" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
