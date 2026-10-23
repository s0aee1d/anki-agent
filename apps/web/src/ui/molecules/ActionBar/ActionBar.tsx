import { ReactNode } from "react";

export interface ActionBarProps {
  children: ReactNode;
}

/** Sticky row of equally sized actions. */
export function ActionBar({ children }: ActionBarProps) {
  return <div className="action-bar">{children}</div>;
}
