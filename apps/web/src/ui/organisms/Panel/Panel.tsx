import { ReactNode } from "react";
import { Button } from "../../atoms";

export interface PanelProps {
  label: string;
  title: ReactNode;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Side sheet (full-screen on small viewports) with a title bar, scrollable body and footer slot. */
export function Panel({ label, title, closeLabel, onClose, children, footer }: PanelProps) {
  return (
    <aside className="panel" role="dialog" aria-label={label}>
      <div className="panel__head">
        <b>{title}</b>
        <Button tone="link" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
      <div className="panel__body">{children}</div>
      {footer}
    </aside>
  );
}
