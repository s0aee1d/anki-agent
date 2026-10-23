import { ReactNode, useEffect, useRef } from "react";
import { MessageBubble, MessageBubbleProps } from "../../molecules";

export interface MessageListItem {
  id: string;
  align: MessageBubbleProps["align"];
  tone?: MessageBubbleProps["tone"];
  content: ReactNode;
}

export interface MessageListProps {
  messages: MessageListItem[];
  empty?: ReactNode;
}

export function MessageList({ messages, empty }: MessageListProps) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && empty}
      {messages.map((m) => (
        <MessageBubble key={m.id} align={m.align} tone={m.tone}>
          {m.content}
        </MessageBubble>
      ))}
      <div ref={end} />
    </div>
  );
}
