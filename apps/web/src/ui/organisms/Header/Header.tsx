import { ReactNode } from "react";

export interface HeaderProps {
  start?: ReactNode;
  end?: ReactNode;
}

export function Header({ start, end }: HeaderProps) {
  return (
    <header className="header">
      <div>{start}</div>
      {end && <div className="header__end">{end}</div>}
    </header>
  );
}
