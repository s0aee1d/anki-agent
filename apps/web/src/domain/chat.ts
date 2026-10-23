export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

/** "Add the selected text as vocabulary", with the card it came from. */
export interface VocabRequest {
  selection: string;
  sentence: string;
  sourceDeck: string;
  targetDeck: string;
  cardId: number;
  side: "question" | "answer";
}
