import { ReactNode } from "react";
import { Button } from "../../atoms";

export interface ListButtonProps {
  onClick: () => void;
  children: ReactNode;
  trailing?: ReactNode;
}

export function ListButton({ onClick, children, trailing }: ListButtonProps) {
  return (
    <Button block className="list-button" onClick={onClick}>
      <span>{children}</span>
      {trailing && <span className="list-button__trailing">{trailing}</span>}
    </Button>
  );
}
