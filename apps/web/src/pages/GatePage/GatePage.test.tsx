import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockApi } from "../../test/network";
import { renderWithProviders } from "../../test/render";
import { GatePage } from "./GatePage";

describe("GatePage", () => {
  it("renders children once approved", async () => {
    mockApi({ "GET /api/auth/status": () => ({ state: "approved", id: "X" }) });
    renderWithProviders(<GatePage><p>secret</p></GatePage>);
    expect(await screen.findByText("secret")).toBeInTheDocument();
  });

  it("lets an unknown device request access, then shows its id", async () => {
    mockApi({
      "GET /api/auth/status": () => ({ state: "none" }),
      "POST /api/auth/request": () => ({ state: "pending", id: "ABCD-2345" }),
    });
    renderWithProviders(<GatePage><p>secret</p></GatePage>);
    await userEvent.click(await screen.findByRole("button", { name: "Request access" }));
    expect(await screen.findByText("ABCD-2345")).toBeInTheDocument();
    expect(screen.queryByText("secret")).toBeNull();
  });

  it("shows the error when the status call fails", async () => {
    mockApi({ "GET /api/auth/status": () => Response.json({ error: "boom" }, { status: 500 }) });
    renderWithProviders(<GatePage><p>secret</p></GatePage>);
    await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument());
  });
});
