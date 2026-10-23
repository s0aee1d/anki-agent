import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContextChip } from "./ContextChip";

const props = {
  title: "auswählen",
  selectLabel: "Target deck",
  options: [{ value: "a", label: "A" }, { value: "b", label: "B" }],
  value: "a",
  dismissLabel: "Remove",
};

describe("ContextChip", () => {
  it("shows the title and the current choice, and reports changes", async () => {
    const onChange = vi.fn();
    render(<ContextChip {...props} onChange={onChange} onDismiss={() => {}} />);
    expect(screen.getByText("auswählen")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Target deck" })).toHaveValue("a");
    await userEvent.selectOptions(screen.getByRole("combobox"), "b");
    expect(onChange).toHaveBeenCalledWith("b");
  });
  it("dismisses", async () => {
    const onDismiss = vi.fn();
    render(<ContextChip {...props} onChange={() => {}} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
