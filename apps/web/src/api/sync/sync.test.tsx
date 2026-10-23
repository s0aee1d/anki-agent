import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockApi } from "../../test/network";
import { createWrapper } from "../../test/render";
import { useSync } from "./sync";

describe("useSync", () => {
  it("returns a domain SyncResult", async () => {
    mockApi({ "POST /api/sync": () => ({ ok: true, at: 123 }) });
    const { result } = renderHook(() => useSync(), { wrapper: createWrapper().Wrapper });
    let out;
    await act(async () => {
      out = await result.current.mutateAsync();
    });
    expect(out).toEqual({ at: 123 });
  });
});
