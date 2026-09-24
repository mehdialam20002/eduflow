import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Status only, never decoration. Colour always travels with a word (DS-P08). */
export type BadgeTone = 'positive' | 'caution' | 'negative' | 'info' | 'neutral';

const TONE: Record<BadgeTone, string> = {
  positive: 'bg-success-soft text-success-text',
  caution: 'bg-warning-soft text-warning-text',
  negative: 'bg-danger-soft text-danger-text',
  info: 'bg-info-soft text-primary-hover',
  neutral: 'bg-neutral-soft text-ink-muted',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-label',
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
