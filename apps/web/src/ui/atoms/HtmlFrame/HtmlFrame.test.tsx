import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HtmlFrame } from "./HtmlFrame";

describe("HtmlFrame", () => {
  it("is titled via props and sandboxed with the html as srcdoc", () => {
    render(<HtmlFrame title="Preview" html="<p>x</p>" />);
    const f = screen.getByTitle("Preview");
    expect(f).toHaveAttribute("srcdoc", "<p>x</p>");
    expect(f).toHaveAttribute("sandbox", "allow-same-origin allow-scripts");
  });

  it("reports the selection with its block text and position, and null when cleared", () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(<HtmlFrame title="Card" html="<p>Wie auswählen?</p>" onSelect={onSelect} />);
    const frame = screen.getByTitle("Card") as HTMLIFrameElement;
    const doc = frame.contentDocument!;
    const win = frame.contentWindow!;
    doc.body.innerHTML = "<p>Wie auswählen?</p>";
    (win as unknown as { Range: typeof Range }).Range.prototype.getBoundingClientRect = () =>
      ({ left: 10, width: 20, bottom: 30 }) as DOMRect;
    fireEvent.load(frame);

    const p = doc.querySelector("p")!;
    const range = doc.createRange();
    range.setStart(p.firstChild!, 4);
    range.setEnd(p.firstChild!, 13);
    win.getSelection()!.removeAllRanges();
    win.getSelection()!.addRange(range);
    act(() => {
      doc.dispatchEvent(new Event("selectionchange"));
      vi.advanceTimersByTime(200);
    });
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ text: "auswählen", block: "Wie auswählen?", x: 20, y: 30 }));

    win.getSelection()!.removeAllRanges();
    act(() => {
      doc.dispatchEvent(new Event("selectionchange"));
      vi.advanceTimersByTime(200);
    });
    expect(onSelect).toHaveBeenLastCalledWith(null);
    vi.useRealTimers();
  });
});
