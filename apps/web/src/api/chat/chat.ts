import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../client";
import type { VocabRequest } from "../../domain";
import { deckKeys } from "../decks";
import type { ChatChunkDto } from "../dto";
import { toChatContextDto } from "../mappers";

/** Streams the agent's reply; calls onText for each text chunk (OpenAI-style SSE). */
export async function streamChat(
  message: string,
  onText: (t: string) => void,
  signal?: AbortSignal,
  vocab?: VocabRequest,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vocab ? { message, context: toChatContextDto(vocab) } : { message }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
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
        const piece = (JSON.parse(data) as ChatChunkDto).choices?.[0]?.delta?.content;
        if (piece) onText(piece);
      } catch {
        /* ignore keep-alives and partial frames */
      }
    }
  }
}

export interface ChatStreamVars {
  message: string;
  onText: (t: string) => void;
  signal?: AbortSignal;
  vocab?: VocabRequest;
}

/** Streams a chat reply; the agent may have changed the collection, so deck counts are refetched after. */
export function useChatStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: ChatStreamVars) => streamChat(v.message, v.onText, v.signal, v.vocab),
    onSuccess: () => qc.invalidateQueries({ queryKey: deckKeys.all }),
  });
}
