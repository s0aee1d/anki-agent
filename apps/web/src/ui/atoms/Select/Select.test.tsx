import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

describe("Select", () => {
  it("is labelled via props and reports changes", async () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="Deck" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Deck" }), "b");
    expect(onChange).toHaveBeenCalledOnce();
  });
  it("forwards ref and className", () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select ref={ref} className="x" aria-label="d" />);
    expect(ref.current).toHaveClass("select", "x");
  });
});
