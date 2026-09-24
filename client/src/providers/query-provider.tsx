'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query-client';

export function QueryProvider({ children }: { children: ReactNode }): ReactNode {
  // useState keeps one client per browser tab. A client made during render would
  // be thrown away on every re-render, and the cache with it.
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
