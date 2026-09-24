import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label.tsx';

export type InputProps = ComponentPropsWithRef<'input'>;

export function Input({ className, ...props }: InputProps): ReactNode {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-sm border border-line bg-surface-raised px-3',
        'text-body text-ink placeholder:text-ink-subtle',
        'aria-[invalid=true]:border-danger',
        'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-subtle',
        className,
      )}
      {...props}
    />
  );
}

export interface FormFieldProps {
  label: string;
  isRequired?: boolean;
  /** Shown under the control until an error takes its place. */
  helperText?: string | undefined;
  errorText?: string | undefined;
  /** Receives the id and the aria wiring, so every form does it the same way. */
  children: (fieldProps: {
    id: string;
    'aria-invalid': boolean;
    'aria-required': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}

/** Label above, control, then one line of helper text that an error replaces. */
export function FormField({
  label,
  isRequired = false,
  helperText,
  errorText,
  children,
}: FormFieldProps): ReactNode {
  const id = useId();
  const messageId = `${id}-message`;
  const message = errorText ?? helperText;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} isRequired={isRequired}>
        {label}
      </Label>
      {children({
        id,
        'aria-invalid': errorText !== undefined,
        'aria-required': isRequired,
        'aria-describedby': message === undefined ? undefined : messageId,
      })}
      {message === undefined ? null : (
        <p
          id={messageId}
          role={errorText === undefined ? undefined : 'alert'}
          className={cn('text-small', errorText === undefined ? 'text-ink-subtle' : 'text-danger-text')}
        >
          {message}
        </p>
      )}
    </div>
  );
}
