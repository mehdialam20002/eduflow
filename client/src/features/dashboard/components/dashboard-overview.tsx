'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/formatters/date';
import { formatMoneyShort } from '@/lib/formatters/currency';
import { useSession } from '@/providers/session-provider';

interface StatCard {
  label: string;
  value: string;
  note: string;
}

/**
 * The first screen after sign-in. The tiles hold no data yet: each one is
 * replaced by a TanStack Query hook when its module arrives, and the shapes
 * below are the shapes those hooks will fill.
 */
export function DashboardOverview(): ReactNode {
  const { session } = useSession();
  if (session === null) return null;

  const { currency, timezone } = session.organization;
  const stats: StatCard[] = [
    { label: 'Active students', value: '—', note: 'Arrives with the Student Profile module' },
    { label: 'Present today', value: '—', note: 'Arrives with the Attendance module' },
    {
      label: 'Collected today',
      value: formatMoneyShort(0, currency),
      note: 'Arrives with the Payments module',
    },
    { label: 'Fees overdue', value: '—', note: 'Arrives with the Fees module' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-h1 text-ink">Dashboard</h1>
          {/* The clock can cross midnight between the server render and the
              browser render, and only this line would differ. */}
          <p className="text-small text-ink-subtle" suppressHydrationWarning>
            {session.organization.name} · {formatDate(new Date(), timezone)}
          </p>
        </div>
        <Badge tone="info">Skeleton build</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <p className="text-amount text-ink" data-tabular>
                {stat.value}
              </p>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-small text-ink-subtle">{stat.note}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today at a glance</CardTitle>
          <CardDescription>
            Attendance, fee receipts and new admissions will appear here as each module is built.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <EmptyState
            title="Nothing to show yet"
            description="Connect the API and build the first module to fill this space."
          />
        </CardBody>
      </Card>
    </div>
  );
}
