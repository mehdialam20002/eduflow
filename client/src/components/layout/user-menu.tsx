'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, LogOut } from 'lucide-react';
import { setAccessToken } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useSession } from '@/providers/session-provider';

/**
 * Built on <details>, so the browser gives keyboard support and Escape for
 * free. The avatar shows initials until Organization branding supplies a photo.
 */
export function UserMenu(): ReactNode {
  const { session, clearSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  if (session === null) return null;

  const initials = `${session.user.firstName.charAt(0)}${session.user.lastName.charAt(0)}`;
  const roleNames = session.roles.map((role) => role.name).join(', ');

  const signOut = (): void => {
    // A shared office computer must not keep the last user's rows in the cache.
    setAccessToken(null);
    clearSession();
    queryClient.clear();
    router.push('/login');
  };

  return (
    <details className="relative">
      <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-md px-2">
        <span
          aria-hidden="true"
          className={cn(
            'grid size-8 place-items-center rounded-full',
            'bg-primary-soft text-label text-primary-hover',
          )}
        >
          {initials.toUpperCase()}
        </span>
        <span className="sr-only">Account menu</span>
        <ChevronDown aria-hidden="true" className="size-5 text-ink-subtle" strokeWidth={2} />
      </summary>
      <div
        className={cn(
          'absolute right-0 z-50 mt-1 w-60 rounded-md border border-line',
          'bg-surface-raised p-2 shadow-md',
        )}
      >
        <p className="px-2 py-1 text-label text-ink">
          {session.user.firstName} {session.user.lastName}
        </p>
        <p className="px-2 pb-2 text-small text-ink-subtle">{roleNames}</p>
        <button
          type="button"
          onClick={signOut}
          className={cn(
            'flex h-11 w-full items-center gap-2 rounded-md px-2',
            'text-label text-ink-muted hover:bg-surface-alt',
          )}
        >
          <LogOut aria-hidden="true" className="size-5" strokeWidth={2} />
          Sign out
        </button>
      </div>
    </details>
  );
}
