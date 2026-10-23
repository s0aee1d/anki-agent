import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "./Text";

describe("Text", () => {
  it("renders a paragraph by default", () => {
    render(<Text>Hello</Text>);
    expect(screen.getByText("Hello").tagName).toBe("P");
  });
  it("can render a span with tone and size", () => {
    render(<Text as="span" tone="error" size="sm">Oops</Text>);
    const el = screen.getByText("Oops");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("text--error", "text--sm");
  });
});
