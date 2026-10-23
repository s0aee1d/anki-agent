import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders every slot in order", () => {
    const { container } = render(
      <AppShell header={<i>H</i>} notice={<i>N</i>} overlay={<i>O</i>}>
        <i>C</i>
      </AppShell>,
    );
    expect(container.textContent).toBe("HNCO");
  });
  it("renders with no slots", () => {
    const { container } = render(<AppShell />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
