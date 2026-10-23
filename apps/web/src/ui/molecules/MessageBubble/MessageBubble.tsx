import { ReactNode } from "react";

export interface MessageBubbleProps {
  align: "start" | "end";
  tone?: "default" | "error";
  children: ReactNode;
}

export function MessageBubble({ align, tone = "default", children }: MessageBubbleProps) {
  return <div className={`bubble bubble--${align} bubble--${tone}`}>{children}</div>;
}
