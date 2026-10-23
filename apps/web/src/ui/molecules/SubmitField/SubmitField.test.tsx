import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SubmitField } from "./SubmitField";

const setup = (over = {}) => {
  const props = { value: "hi", onChange: vi.fn(), onSubmit: vi.fn(), placeholder: "Type", submitLabel: "Send", ...over };
  render(<SubmitField {...props} />);
  return props;
};

describe("SubmitField", () => {
  it("labels the input from the placeholder prop", () => {
    setup();
    expect(screen.getByRole("textbox", { name: "Type" })).toHaveValue("hi");
  });
  it("reports the typed value", async () => {
    const p = setup({ value: "" });
    await userEvent.type(screen.getByRole("textbox"), "a");
    expect(p.onChange).toHaveBeenCalledWith("a");
  });
  it("submits on click and on Enter", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await userEvent.type(screen.getByRole("textbox"), "{Enter}");
    expect(p.onSubmit).toHaveBeenCalledTimes(2);
  });
  it("disables submit", () => {
    setup({ submitDisabled: true });
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
