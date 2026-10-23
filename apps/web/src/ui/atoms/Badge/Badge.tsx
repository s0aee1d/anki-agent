import { HTMLAttributes } from "react";
import { cx } from "../../../lib";

export interface BadgeProps extends HTMLAttributes<HTMLElement> {
  tone?: "info" | "success" | "danger";
}

export function Badge({ tone = "info", className, ...rest }: BadgeProps) {
  return <b className={cx("badge", `badge--${tone}`, className)} {...rest} />;
}
