import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FocusLayout } from "./FocusLayout";

describe("FocusLayout", () => {
  it("renders meta, content and actions inside main", () => {
    render(<FocusLayout meta={<i>M</i>} content={<i>C</i>} actions={<i>A</i>} />);
    expect(screen.getByRole("main").textContent).toBe("MCA");
  });
  it("works with only content", () => {
    render(<FocusLayout content={<i>C</i>} />);
    expect(screen.getByRole("main").textContent).toBe("C");
  });
});
