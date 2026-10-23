import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders message and optional action", () => {
    const { rerender } = render(<EmptyState message="None" action={<button>Act</button>} />);
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
    rerender(<EmptyState message="None" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
