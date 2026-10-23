import { ReactNode } from "react";

export interface FocusLayoutProps {
  meta?: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
}

/** One growing content area with a meta line above and a sticky action row below. */
export function FocusLayout({ meta, content, actions }: FocusLayoutProps) {
  return (
    <main className="focus-layout">
      {meta}
      {content}
      {actions}
    </main>
  );
}
