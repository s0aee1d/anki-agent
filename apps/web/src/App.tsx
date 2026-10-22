import { useCallback, useEffect, useState } from "react";
import { Chat } from "./Chat";
import { answer, Card, Deck, getDecks, nextCard, syncNow } from "./api";

type SyncState = { kind: "idle" } | { kind: "busy" } | { kind: "ok"; at: number } | { kind: "error"; msg: string };

export function App() {
  const [deck, setDeck] = useState<string | null>(null);
  const [chat, setChat] = useState(false);
  const [sync, setSync] = useState<SyncState>({ kind: "idle" });

  const runSync = useCallback(async () => {
    setSync({ kind: "busy" });
    try {
      const r = await syncNow();
      setSync({ kind: "ok", at: r.at });
    } catch (e) {
      setSync({ kind: "error", msg: (e as Error).message });
    }
  }, []);

  return (
    <div className="app">
      <header>
        <button className="link" onClick={() => setDeck(null)}>
          {deck ? "‹ Decks" : "Anki"}
        </button>
        <div className="header-actions">
          <button onClick={() => setChat(true)}>Agent</button>
          <button onClick={runSync} disabled={sync.kind === "busy"}>
            {sync.kind === "busy" ? "Syncing…" : "Sync"}
          </button>
        </div>
      </header>
      {sync.kind === "ok" && <p className="note">Synced {new Date(sync.at).toLocaleTimeString()}</p>}
      {sync.kind === "error" && <p className="error">{sync.msg}</p>}
      {deck ? <Review deck={deck} onSync={runSync} /> : <Decks onOpen={setDeck} />}
      {chat && <Chat onClose={() => setChat(false)} />}
    </div>
  );
}

function Decks({ onOpen }: { onOpen: (name: string) => void }) {
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDecks().then(setDecks).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!decks) return <p className="note">Loading…</p>;
  return (
    <ul className="decks">
      {decks.map((d) => (
        <li key={d.deck_id}>
          <button onClick={() => onOpen(d.name)}>
            <span>{d.name}</span>
            <span className="counts">
              <b className="new">{d.new_count}</b> <b className="learn">{d.learn_count}</b>{" "}
              <b className="due">{d.review_count}</b>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const withMedia = (html: string) => html.replace(/src="([^"/]+)"/g, 'src="/api/media/$1"');

function Review({ deck, onSync }: { deck: string; onSync: () => void }) {
  const [card, setCard] = useState<Card | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await nextCard(deck);
      setCard(r.card);
      setRemaining(r.remaining);
      setShown(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [deck]);

  useEffect(() => {
    load();
  }, [load]);

  const rate = useCallback(
    async (ease: number) => {
      if (!card) return;
      try {
        await answer(card.cardId, ease);
        await load();
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [card, load],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) rate(Number(e.key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, rate]);

  if (error) return <p className="error">{error}</p>;
  if (loading && !card) return <p className="note">Loading…</p>;
  if (!card)
    return (
      <div className="done">
        <p>No cards due in “{deck}”.</p>
        <button onClick={onSync}>Sync</button>
      </div>
    );

  const html = `<style>${card.css}</style>${withMedia(shown ? card.answer : card.question)}`;
  return (
    <main className="review">
      <p className="note">{remaining} left</p>
      <iframe title="card" sandbox="allow-same-origin" srcDoc={html} className="card" />
      <div className="actions">
        {shown ? (
          <>
            <button className="again" onClick={() => rate(1)}>Again</button>
            <button className="hard" onClick={() => rate(2)}>Hard</button>
            <button className="good" onClick={() => rate(3)}>Good</button>
            <button className="easy" onClick={() => rate(4)}>Easy</button>
          </>
        ) : (
          <button className="primary" onClick={() => setShown(true)}>Show answer</button>
        )}
      </div>
    </main>
  );
}
