/** Wire shapes returned by apps/server. Internal to api/; map to domain types before leaving. */

export interface DeckDto {
  deck_id: number;
  name: string;
  new_count: number;
  learn_count: number;
  review_count: number;
}

export interface CardDto {
  cardId: number;
  question: string;
  answer: string;
  css: string;
  ord: number;
}

export interface NextCardDto {
  card: CardDto | null;
  remaining: number;
}

export interface AuthStateDto {
  state: "none" | "pending" | "approved";
  id?: string;
}

export interface SyncDto {
  ok: boolean;
  at: number;
}

export interface ChatChunkDto {
  choices?: Array<{ delta?: { content?: string } }>;
}

export interface ChatContextDto {
  action: "add_vocabulary";
  selection: string;
  sentence: string;
  sourceDeck: string;
  targetDeck: string;
  cardId: number;
  side: "question" | "answer";
}
