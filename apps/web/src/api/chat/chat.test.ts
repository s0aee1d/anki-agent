import { describe, expect, it, vi } from "vitest";
import { mockApi, sseResponse } from "../../test/network";
import { streamChat } from "./chat";

describe("streamChat", () => {
  it("emits each text chunk", async () => {
    mockApi({ "POST /api/chat": () => sseResponse(["Hel", "lo"]) });
    const onText = vi.fn();
    await streamChat("hi", onText);
    expect(onText.mock.calls.map((c) => c[0])).toEqual(["Hel", "lo"]);
  });

  it("sends the vocab request as context", async () => {
    const net = mockApi({ "POST /api/chat": () => sseResponse(["ok"]) });
    const vocab = { selection: "w", sentence: "s", sourceDeck: "a", targetDeck: "b", cardId: 1, side: "question" as const };
    await streamChat("add", vi.fn(), undefined, vocab);
    expect(net.calls[0].body).toEqual({ message: "add", context: { action: "add_vocabulary", ...vocab } });
  });

  it("ignores malformed frames", async () => {
    mockApi({ "POST /api/chat": () => new Response("data: {oops\n\ndata: [DONE]\n\n") });
    const onText = vi.fn();
    await expect(streamChat("hi", onText)).resolves.toBeUndefined();
    expect(onText).not.toHaveBeenCalled();
  });

  it("throws the server error", async () => {
    mockApi({ "POST /api/chat": () => Response.json({ error: "down" }, { status: 502 }) });
    await expect(streamChat("hi", vi.fn())).rejects.toThrow("down");
  });
});
