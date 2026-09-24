import type { ReactNode } from 'react';

/** Centred card, no menu: the frame for every page a signed-out person sees. */
export default function AuthLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-h2 text-primary">EduFlow</p>
        <div className="rounded-lg border border-line bg-surface-raised p-6 shadow-sm">
          {children}
        </div>
        <p className="mt-6 text-center text-small text-ink-subtle">Powered by EduFlow</p>
      </div>
    </main>
  );
}
