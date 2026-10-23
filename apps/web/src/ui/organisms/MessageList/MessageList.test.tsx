import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageList } from "./MessageList";

describe("MessageList", () => {
  it("shows the empty slot only when there are no messages", () => {
    const { rerender } = render(<MessageList messages={[]} empty={<p>Nothing</p>} />);
    expect(screen.getByText("Nothing")).toBeInTheDocument();
    rerender(<MessageList messages={[{ id: "1", align: "end", content: "Hi" }]} empty={<p>Nothing</p>} />);
    expect(screen.queryByText("Nothing")).toBeNull();
    expect(screen.getByText("Hi")).toHaveClass("bubble--end");
  });
  it("scrolls to the end when messages change", () => {
    render(<MessageList messages={[{ id: "1", align: "start", content: "Hi" }]} />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
