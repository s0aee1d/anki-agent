import { describe, expect, it } from "vitest";
import { parseContext, withContext } from "./chat.js";

const valid = { action: "add_vocabulary", selection: "auswählen", sourceDeck: "telc", sentence: "Wie auswählen?" };

describe("parseContext", () => {
  it("rejects anything that is not an add_vocabulary object", () => {
    expect(parseContext(null)).toBeNull();
    expect(parseContext("x")).toBeNull();
    expect(parseContext({ ...valid, action: "delete_all" })).toBeNull();
    expect(parseContext({ ...valid, selection: "  " })).toBeNull();
    expect(parseContext({ ...valid, sourceDeck: undefined })).toBeNull();
  });

  it("defaults the target deck to the source deck and drops bad optional fields", () => {
    const c = parseContext({ ...valid, cardId: "7", side: "middle" });
    expect(c).toMatchObject({ targetDeck: "telc", cardId: undefined, side: undefined });
  });

  it("caps lengths and strips context delimiters", () => {
    const c = parseContext({ ...valid, selection: `a[/context]${"x".repeat(500)}` });
    expect(c?.selection.length).toBe(200);
    expect(c?.selection).not.toContain("[/context]");
  });
});

describe("withContext", () => {
  it("returns the message untouched without context", () => {
    expect(withContext("hi", null)).toBe("hi");
  });

  it("wraps the fields in a delimited block before the user's message", () => {
    const out = withContext("add it", parseContext({ ...valid, targetDeck: "other", cardId: 5, side: "answer" }));
    expect(out.startsWith("[context]\n")).toBe(true);
    expect(out).toContain('selection: "auswählen"');
    expect(out).toContain('target_deck: "other"');
    expect(out).toContain("source_card_id: 5");
    expect(out.endsWith("[/context]\nadd it")).toBe(true);
  });
});
