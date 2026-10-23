import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockApi, sseResponse } from "../../test/network";
import { renderWithProviders } from "../../test/render";
import { ChatPage } from "./ChatPage";

describe("ChatPage", () => {
  it("shows the empty hint and a disabled Send until there is text", () => {
    renderWithProviders(<ChatPage onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Chat with OpenClaw" })).toBeInTheDocument();
    expect(screen.getByText(/Ask about your cards/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("sends a message and streams the reply", async () => {
    const net = mockApi({ "POST /api/chat": () => sseResponse(["Hel", "lo"]) });
    renderWithProviders(<ChatPage onClose={() => {}} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Message OpenClaw" }), "hi{Enter}");
    expect(await screen.findByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(net.calls[0].body).toEqual({ message: "hi" });
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("shows server errors in the reply bubble", async () => {
    mockApi({ "POST /api/chat": () => Response.json({ error: "agent down" }, { status: 502 }) });
    renderWithProviders(<ChatPage onClose={() => {}} />);
    await userEvent.type(screen.getByRole("textbox"), "hi{Enter}");
    const bubble = await screen.findByText("agent down");
    expect(bubble).toHaveClass("bubble--error");
  });

  it("closes", async () => {
    const onClose = vi.fn();
    renderWithProviders(<ChatPage onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
