'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Briefcase,
  Bus,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  IndianRupee,
  Layers,
  LayoutDashboard,
  Library,
  NotebookPen,
  Settings,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS, type NavIconName, type NavItem } from '@/config/navigation';
import { usePermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';

// One icon per concept across the whole product: the rupee mark means fees
// everywhere, and payroll gets its own wallet.
const ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  students: Users,
  admissions: UserPlus,
  attendance: CalendarCheck,
  batches: Layers,
  subjects: BookOpen,
  fees: IndianRupee,
  payments: CreditCard,
  teachers: GraduationCap,
  staff: Briefcase,
  timetable: CalendarDays,
  homework: NotebookPen,
  exams: ClipboardList,
  reportCards: FileText,
  analytics: ChartColumn,
  library: Library,
  transport: Bus,
  payroll: Wallet,
  settings: Settings,
};

export interface SidebarProps {
  /** Desktop only: 232 px wide, or 64 px with icons alone. */
  isCollapsed: boolean;
  /** Phone and tablet: the drawer is closed until the menu button opens it. */
  isOpen: boolean;
  onNavigate: () => void;
}

export function Sidebar({ isCollapsed, isOpen, onNavigate }: SidebarProps): ReactNode {
  const pathname = usePathname();
  const { can } = usePermissions();
  // A missing grant hides the entry. It is never greyed out.
  const items = NAV_ITEMS.filter((item) => item.isEnabled && can(item.permission));

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col gap-1 overflow-y-auto',
        'border-r border-line bg-surface-alt px-2 py-3 transition-transform duration-150',
        'lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:translate-x-0',
        isCollapsed ? 'w-16' : 'w-58',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {items.map((item) => (
        <SidebarLink
          key={item.route}
          item={item}
          isActive={pathname === item.route || pathname.startsWith(`${item.route}/`)}
          isCollapsed={isCollapsed}
          onNavigate={onNavigate}
        />
      ))}
      {items.length === 0 ? (
        <p className="px-3 py-2 text-small text-ink-subtle">No menu items for your role yet.</p>
      ) : null}
    </nav>
  );
}

function SidebarLink({
  item,
  isActive,
  isCollapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate: () => void;
}): ReactNode {
  const Icon = ICONS[item.icon];

  return (
    <Link
      href={item.route}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        'flex h-11 items-center gap-3 rounded-md px-3 text-label',
        isActive ? 'bg-primary-soft text-primary-hover' : 'text-ink-muted hover:bg-surface-raised',
      )}
    >
      <Icon aria-hidden="true" className="size-6 shrink-0" strokeWidth={2} />
      <span className={cn(isCollapsed && 'sr-only')}>{item.label}</span>
    </Link>
  );
}
