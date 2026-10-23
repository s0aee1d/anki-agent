import { atom } from "jotai";
import type { CardSelection } from "../../domain";

export const activeDeckAtom = atom<string | null>(null);
export const answerShownAtom = atom(false);

export const cardSelectionAtom = atom<CardSelection | null>(null);
