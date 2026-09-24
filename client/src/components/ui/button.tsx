import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

const BASE = [
  'inline-flex items-center justify-center gap-2 rounded-md',
  'text-label font-medium whitespace-nowrap',
  'transition-colors duration-150',
  'disabled:pointer-events-none disabled:opacity-60',
].join(' ');

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'border border-line bg-surface-raised text-ink hover:bg-surface-alt',
  ghost: 'text-ink-muted hover:bg-surface-alt hover:text-ink',
  danger: 'bg-danger text-danger-foreground hover:brightness-95',
};

// 44 px is the smallest comfortable target on a phone (DS-P02). The small size
// exists for desktop table rows, where a mouse is the only pointer.
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  icon: 'size-11 p-0',
};

/** For the rare case where a link must look like a button, such as "Sign in". */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks a second click while the request runs. */
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      type={type}
      className={buttonClassName(variant, size, className)}
      disabled={disabled === true || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner(): ReactNode {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
