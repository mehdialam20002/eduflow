'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'warning' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  /** One line, in the words a colleague would use at the counter. */
  message: string;
  tone?: ToastTone;
  action?: ToastAction;
}

interface ToastItem extends ToastInput {
  id: number;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE: Record<ToastTone, string> = {
  success: 'border-success bg-success-soft text-success-text',
  warning: 'border-warning bg-warning-soft text-warning-text',
  error: 'border-danger bg-danger-soft text-danger-text',
  info: 'border-primary bg-info-soft text-primary-hover',
};

// An error stays until the user dismisses it. An undo needs six seconds to be
// reachable; everything else clears itself after four.
function lifetimeFor(toast: ToastItem): number | null {
  if (toast.tone === 'error') return null;
  return toast.action === undefined ? 4000 : 6000;
}

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const item: ToastItem = { ...input, tone: input.tone ?? 'info', id: nextId.current };
      nextId.current += 1;
      setToasts((current) => [...current, item]);
      const lifetime = lifetimeFor(item);
      if (lifetime !== null) setTimeout(() => dismiss(item.id), lifetime);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={cn(
          'pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col gap-2',
          'sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:w-80',
        )}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }): ReactNode {
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-md border px-3 py-2 shadow-md',
        TONE[toast.tone],
      )}
    >
      <p className="flex-1 text-small">{toast.message}</p>
      {toast.action === undefined ? null : (
        <button
          type="button"
          className="text-label underline underline-offset-2"
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="shrink-0">
        <X aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (value === null) {
    throw new Error('useToast must be used inside <AppProviders>.');
  }
  return value;
}
