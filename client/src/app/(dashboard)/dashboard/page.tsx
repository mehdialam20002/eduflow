import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashboardOverview } from '@/features/dashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage(): ReactNode {
  return <DashboardOverview />;
}
