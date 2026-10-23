import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("aligns and tones", () => {
    render(<MessageBubble align="end" tone="error">Hi</MessageBubble>);
    expect(screen.getByText("Hi")).toHaveClass("bubble--end", "bubble--error");
  });
  it("defaults to default tone", () => {
    render(<MessageBubble align="start">Hi</MessageBubble>);
    expect(screen.getByText("Hi")).toHaveClass("bubble--default");
  });
});
