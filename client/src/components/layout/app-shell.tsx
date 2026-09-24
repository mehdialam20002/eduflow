'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useSession } from '@/providers/session-provider';
import { Header } from './header.tsx';
import { Sidebar } from './sidebar.tsx';

/** Header, role-aware sidebar and the content area, for every signed-in screen. */
export function AppShell({ children }: { children: ReactNode }): ReactNode {
  const { status } = useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Alt+S is the shortcut named in the design system, for a laptop with a small
  // screen where 232 px of menu costs a whole table column.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        setIsCollapsed((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <EmptyState
          title="You are signed out"
          description="Sign in again to open your dashboard."
          action={
            <Link href="/login" className={buttonClassName()}>
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface-raised focus:p-3"
      >
        Skip to content
      </a>
      <Header
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onToggleCollapse={() => setIsCollapsed((current) => !current)}
      />
      <div className="flex">
        <Sidebar
          isCollapsed={isCollapsed}
          isOpen={isDrawerOpen}
          onNavigate={() => setIsDrawerOpen(false)}
        />
        {isDrawerOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          />
        ) : null}
        <main id="main" className="min-w-0 flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-360">{children}</div>
        </main>
      </div>
    </div>
  );
}
