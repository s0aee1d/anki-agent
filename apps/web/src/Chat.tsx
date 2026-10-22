import { FormEvent, useEffect, useRef, useState } from "react";
import { streamChat } from "./api";

interface Msg {
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

export function Chat({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  useEffect(() => () => abort.current?.abort(), []);

  const patchLast = (fn: (m: Msg) => Msg) =>
    setMsgs((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((all) => [...all, { role: "user", text }, { role: "assistant", text: "" }]);
    abort.current = new AbortController();
    try {
      await streamChat(text, (chunk) => patchLast((m) => ({ ...m, text: m.text + chunk })), abort.current.signal);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        patchLast((m) => ({ ...m, text: m.text || (err as Error).message, error: true }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="chat" role="dialog" aria-label="Chat with the Anki agent">
      <div className="chat-head">
        <b>Agent</b>
        <button className="link" onClick={onClose}>Close</button>
      </div>
      <div className="chat-log">
        {msgs.length === 0 && (
          <p className="note">Ask about your cards, e.g. “Which cards am I failing most?” or “Add 5 cards about …”.</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}${m.error ? " error" : ""}`}>
            {m.text || (busy && i === msgs.length - 1 ? "…" : "")}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the agent"
          enterKeyHint="send"
        />
        <button className="primary" disabled={busy || !input.trim()}>Send</button>
      </form>
    </aside>
  );
}
