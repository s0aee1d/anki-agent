import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Panel } from "./Panel";

describe("Panel", () => {
  it("is a labelled dialog with title, body and footer", () => {
    render(<Panel label="Chat" title="T" closeLabel="Close" onClose={() => {}} footer={<p>F</p>}>Body</Panel>);
    const d = screen.getByRole("dialog", { name: "Chat" });
    expect(d).toHaveTextContent("T");
    expect(d).toHaveTextContent("Body");
    expect(d).toHaveTextContent("F");
  });
  it("calls onClose from the close button", async () => {
    const onClose = vi.fn();
    render(<Panel label="Chat" title="T" closeLabel="Close" onClose={onClose}>x</Panel>);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
