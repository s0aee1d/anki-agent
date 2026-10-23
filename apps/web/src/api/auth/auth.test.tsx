import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockApi } from "../../test/network";
import { createWrapper } from "../../test/render";
import { useAccess, useRequestAccess } from "./auth";

describe("auth hooks", () => {
  it("useAccess maps the status", async () => {
    mockApi({ "GET /api/auth/status": () => ({ state: "approved", id: "X" }) });
    const { result } = renderHook(() => useAccess(), { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ status: "approved", deviceId: "X" }));
  });

  it("useRequestAccess updates the cached status", async () => {
    mockApi({
      "GET /api/auth/status": () => ({ state: "none" }),
      "POST /api/auth/request": () => ({ state: "pending", id: "ABCD-2345" }),
    });
    const { result } = renderHook(() => ({ access: useAccess(), req: useRequestAccess() }), {
      wrapper: createWrapper().Wrapper,
    });
    await waitFor(() => expect(result.current.access.data?.status).toBe("none"));
    await act(() => result.current.req.mutateAsync());
    await waitFor(() => expect(result.current.access.data).toEqual({ status: "pending", deviceId: "ABCD-2345" }));
  });
});
