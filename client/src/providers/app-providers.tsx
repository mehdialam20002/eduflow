'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { QueryProvider } from './query-provider.tsx';
import { SessionProvider } from './session-provider.tsx';

/** The single wrapper that app/layout.tsx mounts. Order matters: toasts and
 *  session both need to be reachable from inside a query hook. */
export function AppProviders({ children }: { children: ReactNode }): ReactNode {
  return (
    <QueryProvider>
      <SessionProvider>
        <ToastProvider>{children}</ToastProvider>
      </SessionProvider>
    </QueryProvider>
  );
}
