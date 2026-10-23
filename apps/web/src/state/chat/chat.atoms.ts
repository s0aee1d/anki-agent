import { atom } from "jotai";
import type { ChatMessage, VocabRequest } from "../../domain";

export const chatOpenAtom = atom(false);
export const chatDraftAtom = atom("");
export const chatMessagesAtom = atom<ChatMessage[]>([]);

/** Set by the review screen when the user picks text to add as vocabulary; consumed by the chat. */
export const pendingVocabAtom = atom<VocabRequest | null>(null);
