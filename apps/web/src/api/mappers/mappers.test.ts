import { describe, expect, it } from "vitest";
import { toAccess, toCard, toDeck, toNextCard, toSyncResult, withMediaUrls } from "./mappers";

describe("mappers", () => {
  it("toDeck renames wire fields to domain fields", () => {
    expect(toDeck({ deck_id: 7, name: "German", new_count: 1, learn_count: 2, review_count: 3 })).toEqual({
      id: 7,
      name: "German",
      newCount: 1,
      learningCount: 2,
      dueCount: 3,
    });
  });

  it("withMediaUrls rewrites bare filenames only", () => {
    expect(withMediaUrls('<img src="cat.png"><img src="https://x/y.png"><img src="/a/b.png">')).toBe(
      '<img src="/api/media/cat.png"><img src="https://x/y.png"><img src="/a/b.png">',
    );
  });

  it("toCard maps ids and rewrites media in question and answer", () => {
    expect(toCard({ cardId: 5, question: '<img src="q.png">', answer: '<img src="a.png">', css: ".x{}" })).toEqual({
      id: 5,
      question: '<img src="/api/media/q.png">',
      answer: '<img src="/api/media/a.png">',
      css: ".x{}",
    });
  });

  it("toNextCard keeps a null card", () => {
    expect(toNextCard({ card: null, remaining: 0 })).toEqual({ card: null, remaining: 0 });
  });

  it("toNextCard maps a present card", () => {
    const r = toNextCard({ card: { cardId: 1, question: "q", answer: "a", css: "" }, remaining: 4 });
    expect(r.card?.id).toBe(1);
    expect(r.remaining).toBe(4);
  });

  it("toAccess renames state/id", () => {
    expect(toAccess({ state: "pending", id: "ABCD-2345" })).toEqual({ status: "pending", deviceId: "ABCD-2345" });
    expect(toAccess({ state: "none" })).toEqual({ status: "none", deviceId: undefined });
  });

  it("toSyncResult drops the ok flag", () => {
    expect(toSyncResult({ ok: true, at: 99 })).toEqual({ at: 99 });
  });
});
