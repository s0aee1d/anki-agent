import { atom } from "jotai";

export const activeDeckAtom = atom<string | null>(null);
export const answerShownAtom = atom(false);
