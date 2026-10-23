import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockApi } from "../../test/network";
import { createWrapper } from "../../test/render";
import { useAnswerCard, useNextCard } from "./study";

const card = { cardId: 3, question: "Q", answer: "A", css: "" };

describe("study hooks", () => {
  it("useNextCard maps the response and encodes the deck", async () => {
    const net = mockApi({ "GET /api/study/next": () => ({ card, remaining: 2 }) });
    const { result } = renderHook(() => useNextCard("A B"), { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ card: { id: 3, question: "Q", answer: "A", css: "" }, remaining: 2 });
    expect(net.fetch.mock.calls[0][0]).toBe("/api/study/next?deck=A%20B");
  });

  it("useAnswerCard posts the rating and refetches the next card and decks", async () => {
    let n = 0;
    const net = mockApi({
      "GET /api/study/next": () => ({ card: { ...card, cardId: ++n }, remaining: 1 }),
      "GET /api/decks": () => [],
      "POST /api/study/answer": () => ({ ok: true }),
    });
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => ({ next: useNextCard("D"), answer: useAnswerCard("D") }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.next.data?.card?.id).toBe(1));
    await queryClient.prefetchQuery({ queryKey: ["decks"], queryFn: () => [] });

    await act(() => result.current.answer.mutateAsync({ cardId: 1, ease: 3 }));

    expect(net.calls.find((c) => c.key === "POST /api/study/answer")?.body).toEqual({ cardId: 1, ease: 3 });
    await waitFor(() => expect(result.current.next.data?.card?.id).toBe(2));
  });
});
