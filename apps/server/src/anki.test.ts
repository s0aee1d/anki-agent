import { afterEach, describe, expect, it, vi } from "vitest";
import { answerCard, getMedia, invoke, listDecks, nextCard } from "./anki.js";

const reply = (result: unknown, error: string | null = null) => Response.json({ result, error });

function stubAnki(handler: (action: string, params: any) => Response) {
  const fn = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const { action, params } = JSON.parse(String(init?.body));
    return handler(action, params);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("anki", () => {
  it("invoke sends AnkiConnect v6 envelopes and returns the result", async () => {
    const fn = stubAnki(() => reply(6));
    await expect(invoke("version")).resolves.toBe(6);
    expect(JSON.parse(String(fn.mock.calls[0][1]?.body))).toEqual({ action: "version", version: 6, params: {} });
  });

  it("invoke explains when AnkiConnect is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(invoke("version")).rejects.toThrow(/Cannot reach AnkiConnect/);
  });

  it("invoke surfaces AnkiConnect errors", async () => {
    stubAnki(() => reply(null, "collection is not available"));
    await expect(invoke("x")).rejects.toThrow("collection is not available");
  });

  it("listDecks returns stats for every deck", async () => {
    stubAnki((a) => (a === "deckNames" ? reply(["A"]) : reply({ A: { deck_id: 1, name: "A" } })));
    await expect(listDecks()).resolves.toEqual([{ deck_id: 1, name: "A" }]);
  });

  it("nextCard escapes quotes in the deck name and reports remaining", async () => {
    let query = "";
    stubAnki((a, p) => {
      if (a === "findCards") {
        query = p.query;
        return reply([10, 11]);
      }
      return reply([{ cardId: 10 }]);
    });
    const r = await nextCard('My "Deck"');
    expect(query).toContain('deck:"My \\"Deck\\""');
    expect(r).toEqual({ card: { cardId: 10 }, remaining: 2 });
  });

  it("nextCard returns null when nothing is due", async () => {
    stubAnki(() => reply([]));
    await expect(nextCard("D")).resolves.toEqual({ card: null, remaining: 0 });
  });

  it("answerCard returns AnkiConnect's verdict", async () => {
    stubAnki(() => reply([true]));
    await expect(answerCard(1, 3)).resolves.toBe(true);
  });

  it("getMedia decodes base64 and returns null for missing files", async () => {
    stubAnki(() => reply(Buffer.from("hi").toString("base64")));
    expect((await getMedia("a.png"))?.toString()).toBe("hi");
    stubAnki(() => reply(false));
    await expect(getMedia("nope")).resolves.toBeNull();
  });
});
