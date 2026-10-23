import { ReactNode } from "react";
import { ListButton } from "../../molecules";

export interface ButtonListItem {
  id: string;
  content: ReactNode;
  trailing?: ReactNode;
}

export interface ButtonListProps {
  items: ButtonListItem[];
  onSelect: (id: string) => void;
}

export function ButtonList({ items, onSelect }: ButtonListProps) {
  return (
    <ul className="button-list">
      {items.map((item) => (
        <li key={item.id}>
          <ListButton trailing={item.trailing} onClick={() => onSelect(item.id)}>
            {item.content}
          </ListButton>
        </li>
      ))}
    </ul>
  );
}
