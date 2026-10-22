const URL = process.env.ANKI_CONNECT_URL ?? "http://127.0.0.1:8765";

export async function invoke<T = unknown>(action: string, params: object = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({ action, version: 6, params }),
    });
  } catch {
    throw new Error("Cannot reach AnkiConnect. Is Anki open with the add-on installed?");
  }
  const json = (await res.json()) as { result: T; error: string | null };
  if (json.error) throw new Error(json.error);
  return json.result;
}

export interface DeckStats {
  deck_id: number;
  name: string;
  new_count: number;
  learn_count: number;
  review_count: number;
  total_in_deck: number;
}

export interface CardInfo {
  cardId: number;
  noteId: number;
  deckName: string;
  question: string;
  answer: string;
  css: string;
}

export async function listDecks(): Promise<DeckStats[]> {
  const names = await invoke<string[]>("deckNames");
  const stats = await invoke<Record<string, DeckStats>>("getDeckStats", { decks: names });
  return Object.values(stats);
}

export async function nextCard(deck: string): Promise<{ card: CardInfo | null; remaining: number }> {
  const safe = deck.replace(/"/g, '\\"');
  const ids = await invoke<number[]>("findCards", {
    query: `deck:"${safe}" (is:due OR is:new) -is:suspended -is:buried`,
  });
  if (ids.length === 0) return { card: null, remaining: 0 };
  const [card] = await invoke<CardInfo[]>("cardsInfo", { cards: [ids[0]] });
  return { card, remaining: ids.length };
}

export async function answerCard(cardId: number, ease: 1 | 2 | 3 | 4): Promise<boolean> {
  const [ok] = await invoke<boolean[]>("answerCards", { answers: [{ cardId, ease }] });
  return ok;
}

export async function getMedia(filename: string): Promise<Buffer | null> {
  const b64 = await invoke<string | false>("retrieveMediaFile", { filename });
  return b64 ? Buffer.from(b64, "base64") : null;
}

export const sync = () => invoke("sync");
