import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockApi, sseResponse } from "../../test/network";
import { renderWithProviders } from "../../test/render";
import { pendingVocabAtom } from "../../state";
import { ChatPage } from "./ChatPage";

describe("ChatPage", () => {
  it("shows the empty hint and a disabled Send until there is text", () => {
    renderWithProviders(<ChatPage onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Chat with OpenClaw" })).toBeInTheDocument();
    expect(screen.getByText(/Ask about your cards/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("sends a message and streams the reply", async () => {
    const net = mockApi({ "POST /api/chat": () => sseResponse(["Hel", "lo"]), "GET /api/decks": () => [] });
    renderWithProviders(<ChatPage onClose={() => {}} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Message OpenClaw" }), "hi{Enter}");
    expect(await screen.findByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(net.calls.find((c) => c.key === "POST /api/chat")?.body).toEqual({ message: "hi" });
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("shows server errors in the reply bubble", async () => {
    mockApi({ "POST /api/chat": () => Response.json({ error: "agent down" }, { status: 502 }) });
    renderWithProviders(<ChatPage onClose={() => {}} />);
    await userEvent.type(screen.getByRole("textbox"), "hi{Enter}");
    const bubble = await screen.findByText("agent down");
    expect(bubble).toHaveClass("bubble--error");
  });

  it("closes", async () => {
    const onClose = vi.fn();
    renderWithProviders(<ChatPage onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("attaches the pending vocabulary context with the chosen target deck, once", async () => {
    const net = mockApi({
      "POST /api/chat": () => sseResponse(["done"]),
      "GET /api/decks": () => [
        { deck_id: 1, name: "A", new_count: 0, learn_count: 0, review_count: 0, total_in_deck: 0 },
        { deck_id: 2, name: "B", new_count: 0, learn_count: 0, review_count: 0, total_in_deck: 0 },
      ],
    });
    const { store } = renderWithProviders(<ChatPage onClose={() => {}} />);
    const vocab = { selection: "auswählen", sentence: "Wie auswählen?", sourceDeck: "A", targetDeck: "A", cardId: 1, side: "answer" as const };
    act(() => store.set(pendingVocabAtom, vocab));

    expect(screen.getByText("Vocabulary: “auswählen”")).toBeInTheDocument();
    await screen.findByRole("option", { name: "B" });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Target deck" }), "B");
    await userEvent.type(screen.getByRole("textbox", { name: "Message OpenClaw" }), "add it{Enter}");

    await screen.findByText("done");
    const body = net.calls.find((c) => c.key === "POST /api/chat")?.body;
    expect(body).toEqual({ message: "add it", context: { action: "add_vocabulary", ...vocab, targetDeck: "B" } });
    expect(store.get(pendingVocabAtom)).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Target deck" })).not.toBeInTheDocument();
  });

  it("removes the context without sending anything", async () => {
    mockApi({ "GET /api/decks": () => [] });
    const { store } = renderWithProviders(<ChatPage onClose={() => {}} />);
    act(() => store.set(pendingVocabAtom, { selection: "x", sentence: "", sourceDeck: "A", targetDeck: "A", cardId: 1, side: "question" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove context" }));
    expect(store.get(pendingVocabAtom)).toBeNull();
  });
});
