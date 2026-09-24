import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client.ts';

// A 401, 403, 404 or 422 will answer the same way every time, so a retry only
// costs the user time. A network fault or an overloaded API is worth one retry.
const NEVER_RETRY = new Set([400, 401, 403, 404, 409, 422]);

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Lists on a school dashboard change slowly; half a minute avoids refetch storms.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && NEVER_RETRY.has(error.status)) return false;
          return failureCount < 1;
        },
      },
      mutations: {
        // A write is never replayed on its own. The screen decides, with an
        // Idempotency-Key where money is involved.
        retry: false,
      },
    },
  });
}
