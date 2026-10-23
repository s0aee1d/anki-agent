import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListButton } from "./ListButton";

describe("ListButton", () => {
  it("renders content and trailing slot and handles click", async () => {
    const onClick = vi.fn();
    render(<ListButton onClick={onClick} trailing={<i>3</i>}>Row</ListButton>);
    const b = screen.getByRole("button");
    expect(b).toHaveTextContent("Row");
    expect(screen.getByText("3")).toBeInTheDocument();
    await userEvent.click(b);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("omits the trailing wrapper when not given", () => {
    const { container } = render(<ListButton onClick={() => {}}>Row</ListButton>);
    expect(container.querySelector(".list-button__trailing")).toBeNull();
  });
});
