import { describe, expect, it } from "vitest";
import { sentenceAround } from "./sentenceAround";

describe("sentenceAround", () => {
  const text = "Erster Satz. Wie Sprachaufenthalte auswählen? Dritter Satz!";

  it("returns the sentence containing the selection, with its punctuation", () => {
    expect(sentenceAround(text, "auswählen")).toBe("Wie Sprachaufenthalte auswählen?");
  });
  it("handles first and last sentences", () => {
    expect(sentenceAround(text, "Erster")).toBe("Erster Satz.");
    expect(sentenceAround(text, "Dritter")).toBe("Dritter Satz!");
  });
  it("stops at line breaks and collapses whitespace", () => {
    expect(sentenceAround("Titel\nein   langer  Text", "langer")).toBe("ein langer Text");
  });
  it("is empty when the selection is missing or blank", () => {
    expect(sentenceAround(text, "nope")).toBe("");
    expect(sentenceAround(text, "  ")).toBe("");
  });
  it("caps the length", () => {
    expect(sentenceAround("a".repeat(500), "a", 50)).toHaveLength(50);
  });
});
