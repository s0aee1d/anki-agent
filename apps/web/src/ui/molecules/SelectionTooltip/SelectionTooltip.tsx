import { Button } from "../../atoms";

export interface SelectionTooltipProps {
  /** Viewport coordinates the tooltip hangs below (horizontal centre, top edge). */
  x: number;
  y: number;
  label: string;
  onClick: () => void;
}

/** A small floating action anchored under a text selection. */
export function SelectionTooltip({ x, y, label, onClick }: SelectionTooltipProps) {
  return (
    <div className="selection-tooltip" style={{ left: `clamp(80px, ${x}px, calc(100vw - 80px))`, top: y }}>
      {/* keep the selection alive while the pointer goes down on the tooltip */}
      <Button tone="primary" onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}
