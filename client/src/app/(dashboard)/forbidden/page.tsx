import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'No access' };

export default function ForbiddenPage(): ReactNode {
  return (
    <EmptyState
      title="You do not have access to this page"
      description="Ask your admin to give your role this permission."
      action={
        <Link href="/dashboard" className={buttonClassName()}>
          Go to dashboard
        </Link>
      }
    />
  );
}
