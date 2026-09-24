import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A grey block with the height of the real content, so the page does not jump. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-surface-alt', className)}
      {...props}
    />
  );
}

/** The loading state of a list screen: never a full-page spinner. */
export function TableSkeleton({ rows = 8 }: { rows?: number }): ReactNode {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="rounded-md border border-line bg-surface-raised p-3"
    >
      <Skeleton className="mb-3 h-8 w-full" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="mb-2 h-10 w-full last:mb-0" />
      ))}
    </div>
  );
}
