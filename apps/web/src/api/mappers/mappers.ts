import type { Access, Card, Deck, NextCard, SyncResult } from "../../domain";
import type { AuthStateDto, CardDto, DeckDto, NextCardDto, SyncDto } from "../dto";

export const toDeck = (d: DeckDto): Deck => ({
  id: d.deck_id,
  name: d.name,
  newCount: d.new_count,
  learningCount: d.learn_count,
  dueCount: d.review_count,
});

/** Anki templates reference media by bare filename; serve them through the API. */
export const withMediaUrls = (html: string) => html.replace(/src="([^"/]+)"/g, 'src="/api/media/$1"');

export const toCard = (c: CardDto): Card => ({
  id: c.cardId,
  question: withMediaUrls(c.question),
  answer: withMediaUrls(c.answer),
  css: c.css,
});

export const toNextCard = (n: NextCardDto): NextCard => ({
  card: n.card ? toCard(n.card) : null,
  remaining: n.remaining,
});

export const toAccess = (a: AuthStateDto): Access => ({ status: a.state, deviceId: a.id });

export const toSyncResult = (s: SyncDto): SyncResult => ({ at: s.at });
