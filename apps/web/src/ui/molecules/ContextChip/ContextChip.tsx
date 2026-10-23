import { ReactNode } from "react";
import { Button, Select, Text } from "../../atoms";

export interface ContextChipOption {
  value: string;
  label: string;
}

export interface ContextChipProps {
  /** What the context is about, e.g. the selected text. */
  title: ReactNode;
  selectLabel: string;
  options: ContextChipOption[];
  value: string;
  onChange: (value: string) => void;
  dismissLabel: string;
  onDismiss: () => void;
}

/** A dismissible context summary with a single choice (e.g. a target) attached to the next message. */
export function ContextChip({ title, selectLabel, options, value, onChange, dismissLabel, onDismiss }: ContextChipProps) {
  return (
    <div className="context-chip">
      <Text size="sm" className="context-chip__title">{title}</Text>
      <Select aria-label={selectLabel} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
      <Button tone="link" aria-label={dismissLabel} onClick={onDismiss}>×</Button>
    </div>
  );
}
