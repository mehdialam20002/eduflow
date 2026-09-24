'use client';

import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from './button.tsx';

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

/** Plain sentences only. A stack trace helps nobody at a fee counter. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'FORBIDDEN') return 'You do not have access to this. Ask your admin.';
    if (error.status === 0) return 'Could not reach EduFlow. Check your internet and try again.';
    return error.message;
  }
  return 'Could not load this. Check your internet and try again.';
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps): ReactNode {
  const requestId = error instanceof ApiError ? error.requestId : null;

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-line',
        'bg-surface-raised px-6 py-12 text-center',
        className,
      )}
    >
      <p className="max-w-md text-body text-ink">{messageFor(error)}</p>
      {onRetry === undefined ? null : (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
      {requestId === null ? null : (
        // Support calls start with this ID, so it stays on screen and copyable.
        <p className="text-small text-ink-subtle">Reference {requestId}</p>
      )}
    </div>
  );
}
