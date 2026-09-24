import type { ReactNode } from 'react';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';

export default function NotFound(): ReactNode {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-h1 text-ink">That page does not exist</h1>
      <p className="text-body text-ink-muted">
        The link may be old, or the module may not be built yet.
      </p>
      <div>
        <Link href="/dashboard" className={buttonClassName()}>
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
