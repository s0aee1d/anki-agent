import { describe, expect, it } from "vitest";
import { formatTime } from "./formatTime";

describe("formatTime", () => {
  const t = Date.UTC(2026, 0, 2, 14, 5, 9);

  it("matches Intl for the given locale", () => {
    expect(formatTime(t, "en-US")).toBe(new Intl.DateTimeFormat("en-US", { timeStyle: "medium" }).format(t));
  });
  it("includes seconds", () => expect(formatTime(t, "en-US")).toMatch(/:09/));
  it("is locale aware", () => expect(formatTime(t, "en-US")).not.toBe(formatTime(t, "de-DE")));
});
