export interface Card {
  id: number;
  /** HTML, ready to render (media URLs already resolvable by the browser). */
  question: string;
  answer: string;
  css: string;
  /** Card template index, 0-based. */
  ord: number;
}

export interface NextCard {
  card: Card | null;
  remaining: number;
}

/** 1 = again, 2 = hard, 3 = good, 4 = easy */
export type Ease = 1 | 2 | 3 | 4;

/** Text the user highlighted inside a rendered card, with where to anchor UI next to it. */
export interface CardSelection {
  text: string;
  /** Text of the surrounding block, used to find the sentence. */
  block: string;
  x: number;
  y: number;
}
