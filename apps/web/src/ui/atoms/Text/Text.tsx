import { HTMLAttributes } from "react";
import { cx } from "../../../lib";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "p" | "span";
  tone?: "default" | "muted" | "error";
  size?: "sm" | "md" | "display";
}

export function Text({ as: Tag = "p", tone = "default", size = "md", className, ...rest }: TextProps) {
  const cls = cx("text", `text--${tone}`, `text--${size}`, className);
  return <Tag className={cls} {...rest} />;
}
