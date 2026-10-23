import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockApi } from "../../test/network";
import { renderWithProviders } from "../../test/render";
import { DeckListPage } from "./DeckListPage";

describe("DeckListPage", () => {
  it("shows loading, then decks with translated count titles", async () => {
    mockApi({ "GET /api/decks": () => [{ deck_id: 1, name: "German", new_count: 4, learn_count: 2, review_count: 9 }] });
    renderWithProviders(<DeckListPage onOpen={() => {}} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /German/ })).toBeInTheDocument();
    expect(screen.getByTitle("New")).toHaveTextContent("4");
    expect(screen.getByTitle("Learning")).toHaveTextContent("2");
    expect(screen.getByTitle("Due")).toHaveTextContent("9");
  });

  it("opens a deck by name", async () => {
    mockApi({ "GET /api/decks": () => [{ deck_id: 1, name: "German", new_count: 0, learn_count: 0, review_count: 0 }] });
    const onOpen = vi.fn();
    renderWithProviders(<DeckListPage onOpen={onOpen} />);
    await userEvent.click(await screen.findByRole("button", { name: /German/ }));
    expect(onOpen).toHaveBeenCalledWith("German");
  });

  it("shows the server error", async () => {
    mockApi({ "GET /api/decks": () => Response.json({ error: "Cannot run ankicli" }, { status: 502 }) });
    renderWithProviders(<DeckListPage onOpen={() => {}} />);
    expect(await screen.findByText("Cannot run ankicli")).toBeInTheDocument();
  });
});
