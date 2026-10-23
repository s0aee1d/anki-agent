import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useChatStream } from "../../api";
import type { ChatMessage } from "../../domain";
import { chatDraftAtom, chatMessagesAtom } from "../../state";
import { Text } from "../../ui/atoms";
import { SubmitField } from "../../ui/molecules";
import { MessageList, Panel } from "../../ui/organisms";

export function ChatPage({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("chat");
  const [msgs, setMsgs] = useAtom(chatMessagesAtom);
  const [draft, setDraft] = useAtom(chatDraftAtom);
  const stream = useChatStream();
  const busy = stream.isPending;
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
    setMsgs((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setMsgs((all) => [
      ...all,
      { id: String(all.length), role: "user", text },
      { id: String(all.length + 1), role: "assistant", text: "" },
    ]);
    abort.current = new AbortController();
    try {
      await stream.mutateAsync({
        message: text,
        signal: abort.current.signal,
        onText: (chunk) => patchLast((m) => ({ ...m, text: m.text + chunk })),
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        patchLast((m) => ({ ...m, text: m.text || (err as Error).message, error: true }));
      }
    }
  }

  return (
    <Panel
      label={t("label")}
      title={t("title")}
      closeLabel={t("close")}
      onClose={onClose}
      footer={
        <SubmitField
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          placeholder={t("placeholder")}
          submitLabel={t("send")}
          submitDisabled={busy || !draft.trim()}
          enterKeyHint="send"
        />
      }
    >
      <MessageList
        empty={<Text tone="muted" size="sm">{t("empty")}</Text>}
        messages={msgs.map((m, i) => ({
          id: m.id,
          align: m.role === "user" ? "end" : "start",
          tone: m.error ? "error" : "default",
          content: m.text || (busy && i === msgs.length - 1 ? t("pending") : ""),
        }))}
      />
    </Panel>
  );
}
