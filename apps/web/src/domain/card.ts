export interface Card {
  id: number;
  /** HTML, ready to render (media URLs already resolvable by the browser). */
  question: string;
  answer: string;
  css: string;
}

export interface NextCard {
  card: Card | null;
  remaining: number;
}

/** 1 = again, 2 = hard, 3 = good, 4 = easy */
export type Ease = 1 | 2 | 3 | 4;
