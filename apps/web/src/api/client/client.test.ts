import { describe, expect, it } from "vitest";
import { mockApi } from "../../test/network";
import { ApiError, postJson, request } from "./client";

describe("client", () => {
  it("request returns parsed JSON under /api", async () => {
    const net = mockApi({ "GET /api/x": () => ({ a: 1 }) });
    await expect(request("/x")).resolves.toEqual({ a: 1 });
    expect(net.calls[0].key).toBe("GET /api/x");
  });

  it("request throws ApiError with server message and status", async () => {
    mockApi({ "GET /api/x": () => Response.json({ error: "nope" }, { status: 502 }) });
    await expect(request("/x")).rejects.toMatchObject({ message: "nope", status: 502 });
    await expect(request("/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("postJson sends a JSON body", async () => {
    const net = mockApi({ "POST /api/x": () => ({ ok: true }) });
    await postJson("/x", { n: 1 });
    expect(net.calls[0].body).toEqual({ n: 1 });
  });
});
