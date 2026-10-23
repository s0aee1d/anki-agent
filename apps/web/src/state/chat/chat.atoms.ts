import { atom } from "jotai";
import type { ChatMessage } from "../../domain";

export const chatOpenAtom = atom(false);
export const chatDraftAtom = atom("");
export const chatMessagesAtom = atom<ChatMessage[]>([]);
