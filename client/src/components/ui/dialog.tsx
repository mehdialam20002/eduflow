'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button.tsx';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Blocks Escape and the backdrop while a request is running. */
  isBusy?: boolean;
  className?: string;
}

/**
 * Built on the native <dialog> element: the browser then owns the focus trap,
 * the Escape key and the backdrop, which is exactly the part hand-written
 * modals get wrong.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  isBusy = false,
  className,
}: DialogProps): ReactNode {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialogRef.current;
    if (element === null || typeof element.showModal !== 'function') return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>): void => {
    if (event.target === dialogRef.current && !isBusy) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClick={handleBackdropClick}
      onCancel={(event) => {
        // Escape must not close a dialog that is waiting for the server.
        event.preventDefault();
        if (!isBusy) onClose();
      }}
      className={cn(
        'm-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line',
        'bg-surface-raised p-0 text-ink shadow-lg backdrop:bg-ink/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h1 text-ink">{title}</h2>
          {description === undefined ? null : (
            <p className="text-small text-ink-subtle">{description}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} disabled={isBusy}>
          <X aria-hidden="true" className="size-5" strokeWidth={2} />
        </Button>
      </div>
      {children === undefined ? null : <div className="px-4 py-4">{children}</div>}
      {footer === undefined ? null : (
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>
      )}
    </dialog>
  );
}
