import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders content with tone and native props", () => {
    render(<Badge tone="success" title="Due">5</Badge>);
    expect(screen.getByTitle("Due")).toHaveTextContent("5");
    expect(screen.getByTitle("Due")).toHaveClass("badge--success");
  });
  it("defaults to info", () => {
    render(<Badge>1</Badge>);
    expect(screen.getByText("1")).toHaveClass("badge--info");
  });
});
