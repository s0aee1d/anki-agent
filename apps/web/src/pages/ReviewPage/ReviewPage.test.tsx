import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockApi } from "../../test/network";
import { renderWithProviders } from "../../test/render";
import { cardSelectionAtom, chatDraftAtom, chatOpenAtom, pendingVocabAtom } from "../../state";
import { ReviewPage } from "./ReviewPage";

const dto = (id: number) => ({ cardId: id, question: `Q${id}`, answer: `A${id}`, css: "", ord: 0 });

describe("ReviewPage", () => {
  it("shows the question, reveals the answer, rates and loads the next card", async () => {
    let id = 0;
    const net = mockApi({
      "GET /api/study/next": () => ({ card: dto(++id), remaining: 3 }),
      "GET /api/decks": () => [],
      "POST /api/study/answer": () => ({ ok: true }),
    });
    renderWithProviders(<ReviewPage deck="D" onSync={() => {}} />);

    const frame = await screen.findByTitle("Card");
    expect(frame.getAttribute("srcdoc")).toContain("Q1");
    expect(screen.getByText("3 left")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show answer" }));
    expect(screen.getByTitle("Card").getAttribute("srcdoc")).toContain("A1");

    await userEvent.click(screen.getByRole("button", { name: "Good" }));
    expect(net.calls.find((c) => c.key === "POST /api/study/answer")?.body).toEqual({ cardId: 1, ease: 3 });
    await waitFor(() => expect(screen.getByTitle("Card").getAttribute("srcdoc")).toContain("Q2"));
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument();
  });

  it("supports keyboard: space reveals, digits rate", async () => {
    let id = 0;
    const net = mockApi({
      "GET /api/study/next": () => ({ card: dto(++id), remaining: 1 }),
      "GET /api/decks": () => [],
      "POST /api/study/answer": () => ({ ok: true }),
    });
    renderWithProviders(<ReviewPage deck="D" onSync={() => {}} />);
    await screen.findByTitle("Card");
    await userEvent.keyboard(" ");
    expect(screen.getByRole("button", { name: "Again" })).toBeInTheDocument();
    await userEvent.keyboard("1");
    await waitFor(() => expect(net.calls.some((c) => c.key === "POST /api/study/answer")).toBe(true));
    expect(net.calls.find((c) => c.key === "POST /api/study/answer")?.body).toEqual({ cardId: 1, ease: 1 });
  });

  it("rewrites media filenames to API URLs", async () => {
    mockApi({
      "GET /api/study/next": () => ({ card: { cardId: 1, question: '<img src="cat.png">', answer: "", css: "" }, remaining: 1 }),
    });
    renderWithProviders(<ReviewPage deck="D" onSync={() => {}} />);
    expect((await screen.findByTitle("Card")).getAttribute("srcdoc")).toContain('src="/api/media/cat.png"');
  });

  it("offers sync when nothing is due", async () => {
    mockApi({ "GET /api/study/next": () => ({ card: null, remaining: 0 }) });
    const onSync = vi.fn();
    renderWithProviders(<ReviewPage deck="German" onSync={onSync} />);
    expect(await screen.findByText("No cards due in “German”.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sync" }));
    expect(onSync).toHaveBeenCalledOnce();
  });

  it("shows server errors", async () => {
    mockApi({ "GET /api/study/next": () => Response.json({ error: "down" }, { status: 502 }) });
    renderWithProviders(<ReviewPage deck="D" onSync={() => {}} />);
    expect(await screen.findByText("down")).toBeInTheDocument();
  });

  it("offers Add vocabulary for a selection and hands it to the chat with its context", async () => {
    mockApi({ "GET /api/study/next": () => ({ card: dto(7), remaining: 1 }), "GET /api/decks": () => [] });
    const { store } = renderWithProviders(<ReviewPage deck="D" onSync={() => {}} />);
    await screen.findByTitle("Card");
    expect(screen.queryByRole("button", { name: "Add vocabulary" })).not.toBeInTheDocument();

    act(() => store.set(cardSelectionAtom, { text: "auswählen", block: "Eins. Wie auswählen? Drei.", x: 5, y: 6 }));
    await userEvent.click(await screen.findByRole("button", { name: "Add vocabulary" }));

    expect(store.get(pendingVocabAtom)).toEqual({
      selection: "auswählen",
      sentence: "Wie auswählen?",
      sourceDeck: "D",
      targetDeck: "D",
      cardId: 7,
      side: "question",
    });
    expect(store.get(chatOpenAtom)).toBe(true);
    expect(store.get(chatDraftAtom)).toBe("Add “auswählen” to my vocabulary");
    expect(store.get(cardSelectionAtom)).toBeNull();
  });

  it("drops the tooltip when the card is revealed", async () => {
    mockApi({ "GET /api/study/next": () => ({ card: dto(7), remaining: 1 }), "GET /api/decks": () => [] });
    const { store } = renderWithProviders(<ReviewPage deck="D" onSync={() => {}} />);
    await screen.findByTitle("Card");
    act(() => store.set(cardSelectionAtom, { text: "x", block: "x", x: 0, y: 0 }));
    await screen.findByRole("button", { name: "Add vocabulary" });
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Add vocabulary" })).not.toBeInTheDocument());
  });
});
