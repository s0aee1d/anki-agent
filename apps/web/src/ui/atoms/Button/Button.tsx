import { ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "../../../lib";

export type ButtonTone = "default" | "primary" | "link" | "info" | "success" | "warning" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { tone = "default", block, className, type = "button", ...rest },
  ref,
) {
  const cls = cx("btn", `btn--${tone}`, block && "btn--block", className);
  return <button ref={ref} type={type} className={cls} {...rest} />;
});
