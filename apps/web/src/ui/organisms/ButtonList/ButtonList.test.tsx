import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ButtonList } from "./ButtonList";

describe("ButtonList", () => {
  const items = [
    { id: "a", content: "Alpha", trailing: "1" },
    { id: "b", content: "Beta" },
  ];
  it("renders one list item per entry", () => {
    render(<ButtonList items={items} onSelect={() => {}} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(within(screen.getAllByRole("listitem")[0]).getByText("1")).toBeInTheDocument();
  });
  it("reports the selected id", async () => {
    const onSelect = vi.fn();
    render(<ButtonList items={items} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Beta/ }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
  it("renders an empty list", () => {
    render(<ButtonList items={[]} onSelect={() => {}} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
