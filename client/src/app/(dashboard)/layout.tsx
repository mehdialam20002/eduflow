import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';

/** Every staff screen lives inside this frame: header, sidebar, content area. */
export default function DashboardLayout({ children }: { children: ReactNode }): ReactNode {
  return <AppShell>{children}</AppShell>;
}
