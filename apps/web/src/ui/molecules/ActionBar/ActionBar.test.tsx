import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionBar } from "./ActionBar";

describe("ActionBar", () => {
  it("renders its children", () => {
    render(<ActionBar><button>A</button><button>B</button></ActionBar>);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
