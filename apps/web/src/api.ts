export interface Deck {
  deck_id: number;
  name: string;
  new_count: number;
  learn_count: number;
  review_count: number;
}

export interface Card {
  cardId: number;
  question: string;
  answer: string;
  css: string;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body as T;
}

export const getDecks = () => call<Deck[]>("/decks");

export const nextCard = (deck: string) =>
  call<{ card: Card | null; remaining: number }>(`/study/next?deck=${encodeURIComponent(deck)}`);

export const answer = (cardId: number, ease: number) =>
  call<{ ok: boolean }>("/study/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId, ease }),
  });

export const syncNow = () => call<{ ok: boolean; at: number }>("/sync", { method: "POST" });

/** Streams the agent's reply; calls onText for each text chunk (OpenAI-style SSE). */
export async function streamChat(message: string, onText: (t: string) => void, signal?: AbortSignal) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? res.statusText);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const piece = JSON.parse(data).choices?.[0]?.delta?.content;
        if (piece) onText(piece);
      } catch {
        /* ignore keep-alives and partial frames */
      }
    }
  }
}
