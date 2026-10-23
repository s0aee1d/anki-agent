import { forwardRef, SelectHTMLAttributes } from "react";
import { cx } from "../../../lib";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native select; options are passed as `<option>` children. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} className={cx("select", className)} {...rest} />;
});
