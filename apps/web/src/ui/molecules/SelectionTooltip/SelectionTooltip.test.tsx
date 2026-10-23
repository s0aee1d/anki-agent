import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectionTooltip } from "./SelectionTooltip";

describe("SelectionTooltip", () => {
  it("is a labelled button placed under the given coordinates", async () => {
    const onClick = vi.fn();
    render(<SelectionTooltip x={40} y={90} label="Add" onClick={onClick} />);
    const btn = screen.getByRole("button", { name: "Add" });
    expect(btn.parentElement?.getAttribute("style")).toContain("40px");
    expect(btn.parentElement).toHaveStyle({ top: "90px" });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
