import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Draws the red asterisk that the form rules ask for on a required field. */
  isRequired?: boolean;
}

export function Label({ isRequired = false, className, children, ...props }: LabelProps): ReactNode {
  return (
    <label className={cn('block text-label text-ink', className)} {...props}>
      {children}
      {isRequired ? (
        <span aria-hidden="true" className="ml-0.5 text-danger-text">
          *
        </span>
      ) : null}
    </label>
  );
}
