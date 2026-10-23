import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HtmlFrame } from "./HtmlFrame";

describe("HtmlFrame", () => {
  it("is titled via props and sandboxed with the html as srcdoc", () => {
    render(<HtmlFrame title="Preview" html="<p>x</p>" />);
    const f = screen.getByTitle("Preview");
    expect(f).toHaveAttribute("srcdoc", "<p>x</p>");
    expect(f).toHaveAttribute("sandbox", "allow-same-origin");
  });
});
