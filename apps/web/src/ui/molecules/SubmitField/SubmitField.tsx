import { FormEvent } from "react";
import { Button, Input } from "../../atoms";

export interface SubmitFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  submitDisabled?: boolean;
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
}

export function SubmitField({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  submitDisabled,
  enterKeyHint,
}: SubmitFieldProps) {
  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form className="submit-field" onSubmit={handle}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint={enterKeyHint}
      />
      <Button type="submit" tone="primary" block={false} disabled={submitDisabled}>
        {submitLabel}
      </Button>
    </form>
  );
}
