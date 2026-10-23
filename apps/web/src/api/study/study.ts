import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Ease } from "../../domain";
import { postJson, request } from "../client";
import { deckKeys } from "../decks";
import type { NextCardDto } from "../dto";
import { toNextCard } from "../mappers";

export const studyKeys = {
  all: ["study"] as const,
  next: (deck: string) => ["study", "next", deck] as const,
};

export const useNextCard = (deck: string) =>
  useQuery({
    queryKey: studyKeys.next(deck),
    queryFn: () => request<NextCardDto>(`/study/next?deck=${encodeURIComponent(deck)}`).then(toNextCard),
    staleTime: 0,
    gcTime: 0,
  });

export function useAnswerCard(deck: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { cardId: number; ease: Ease }) => postJson<{ ok: boolean }>("/study/answer", v),
    // Returned promise keeps the mutation pending until the next card has loaded.
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: studyKeys.next(deck) }),
        qc.invalidateQueries({ queryKey: deckKeys.all }),
      ]),
  });
}
