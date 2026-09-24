'use client';

import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building } from 'lucide-react';
import { useSession } from '@/providers/session-provider';

/**
 * Hidden when the user has one campus, because a select with a single option is
 * only noise. Switching drops the cache: every list is scoped by X-Campus-Id,
 * so the old rows belong to the other campus.
 */
export function CampusSwitcher(): ReactNode {
  const { session, activeCampusId, selectCampus } = useSession();
  const queryClient = useQueryClient();

  if (session === null || session.campuses.length < 2) return null;

  return (
    <label className="flex items-center gap-2">
      <Building aria-hidden="true" className="size-5 text-ink-subtle" strokeWidth={2} />
      <span className="sr-only">Campus</span>
      <select
        value={activeCampusId ?? ''}
        onChange={(event) => {
          selectCampus(event.target.value);
          void queryClient.invalidateQueries();
        }}
        className="h-11 rounded-sm border border-line bg-surface-raised px-2 text-label text-ink"
      >
        {session.campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </select>
    </label>
  );
}
