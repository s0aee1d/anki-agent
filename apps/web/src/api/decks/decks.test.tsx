import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createWrapper } from "../../test/render";
import { mockApi } from "../../test/network";
import { useDecks } from "./decks";

describe("useDecks", () => {
  it("returns domain decks", async () => {
    mockApi({ "GET /api/decks": () => [{ deck_id: 1, name: "A", new_count: 2, learn_count: 0, review_count: 5 }] });
    const { result } = renderHook(() => useDecks(), { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: "A", newCount: 2, learningCount: 0, dueCount: 5 }]);
  });

  it("exposes server errors", async () => {
    mockApi({ "GET /api/decks": () => Response.json({ error: "Cannot reach AnkiConnect" }, { status: 502 }) });
    const { result } = renderHook(() => useDecks(), { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Cannot reach AnkiConnect");
  });
});
