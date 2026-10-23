import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("renders start and end slots inside a banner", () => {
    render(<Header start={<span>S</span>} end={<span>E</span>} />);
    expect(screen.getByRole("banner")).toHaveTextContent("SE");
  });
  it("omits the end wrapper without an end slot", () => {
    const { container } = render(<Header start="S" />);
    expect(container.querySelector(".header__end")).toBeNull();
  });
});
