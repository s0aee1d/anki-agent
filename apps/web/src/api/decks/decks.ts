import { useQuery } from "@tanstack/react-query";
import { request } from "../client";
import type { DeckDto } from "../dto";
import { toDeck } from "../mappers";

export const deckKeys = { all: ["decks"] as const };

export const useDecks = () =>
  useQuery({
    queryKey: deckKeys.all,
    queryFn: () => request<DeckDto[]>("/decks").then((ds) => ds.map(toDeck)),
  });
