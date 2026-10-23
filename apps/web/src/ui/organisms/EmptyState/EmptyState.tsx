import { ReactNode } from "react";

export interface EmptyStateProps {
  message: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {action}
    </div>
  );
}
