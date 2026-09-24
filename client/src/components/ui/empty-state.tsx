import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  /** One sentence that names the next step, not the missing data. */
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** A blank data area is a bug. Every list uses this when it has no rows. */
export function EmptyState({ title, description, action, className }: EmptyStateProps): ReactNode {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-dashed border-line',
        'bg-surface-raised px-6 py-12 text-center',
        className,
      )}
    >
      <h2 className="text-h3 text-ink">{title}</h2>
      {description === undefined ? null : (
        <p className="max-w-md text-small text-ink-subtle">{description}</p>
      )}
      {action}
    </div>
  );
}
