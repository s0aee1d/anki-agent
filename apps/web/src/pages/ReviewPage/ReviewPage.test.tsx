import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockApi } from "../../test/network";
import { renderWithProviders } from "../../test/render";
import { ReviewPage } from "./ReviewPage";

const dto = (id: number) => ({ cardId: id, question: `Q${id}`, answer: `A${id}`, css: "" });

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
});
