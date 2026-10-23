import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { chatDraftAtom, chatMessagesAtom, chatOpenAtom, pendingVocabAtom } from "./chat.atoms";

describe("chat atoms", () => {
  it("have empty defaults", () => {
    const s = createStore();
    expect(s.get(chatOpenAtom)).toBe(false);
    expect(s.get(chatDraftAtom)).toBe("");
    expect(s.get(chatMessagesAtom)).toEqual([]);
    expect(s.get(pendingVocabAtom)).toBeNull();
  });
  it("append messages via updater", () => {
    const s = createStore();
    s.set(chatMessagesAtom, (all) => [...all, { id: "0", role: "user", text: "hi" }]);
    expect(s.get(chatMessagesAtom)).toHaveLength(1);
  });
});
