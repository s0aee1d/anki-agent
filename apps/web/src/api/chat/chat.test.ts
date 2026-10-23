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
