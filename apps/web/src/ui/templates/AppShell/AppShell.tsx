import { ReactNode } from "react";

export interface AppShellProps {
  header?: ReactNode;
  notice?: ReactNode;
  overlay?: ReactNode;
  children?: ReactNode;
}

export function AppShell({ header, notice, overlay, children }: AppShellProps) {
  return (
    <div className="app">
      {header}
      {notice}
      {children}
      {overlay}
    </div>
  );
}
