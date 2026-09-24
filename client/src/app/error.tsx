'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/**
 * The last safety net. A screen that throws shows one plain sentence and a way
 * back, never a white page and never a stack trace.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-h1 text-ink">Something went wrong</h1>
      <p className="text-body text-ink-muted">
        Try again. If it keeps happening, tell us the reference below.
      </p>
      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
      {error.digest === undefined ? null : (
        <p className="text-small text-ink-subtle">Reference {error.digest}</p>
      )}
    </main>
  );
}
