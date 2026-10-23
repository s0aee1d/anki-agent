import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { activeDeckAtom, answerShownAtom, cardSelectionAtom } from "./app.atoms";

describe("app atoms", () => {
  it("start empty", () => {
    const s = createStore();
    expect(s.get(activeDeckAtom)).toBeNull();
    expect(s.get(cardSelectionAtom)).toBeNull();
    expect(s.get(answerShownAtom)).toBe(false);
  });
  it("can be set", () => {
    const s = createStore();
    s.set(activeDeckAtom, "German");
    s.set(answerShownAtom, true);
    expect(s.get(activeDeckAtom)).toBe("German");
    expect(s.get(answerShownAtom)).toBe(true);
  });
});
