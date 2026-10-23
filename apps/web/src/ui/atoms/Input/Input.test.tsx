import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("is labelled via props and reports changes", async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "ab");
    expect(onChange).toHaveBeenCalledTimes(2);
  });
  it("forwards ref and className", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} className="x" aria-label="n" />);
    expect(ref.current).toHaveClass("input", "x");
  });
});
