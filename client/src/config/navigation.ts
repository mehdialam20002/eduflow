import { MODULES, type ModuleCode, type PermissionKey } from '@eduflow/shared';

// The menu is data, not markup. The sidebar renders whatever survives the
// permission filter, so a custom role such as Librarian gets a correct menu
// with no extra code.

export type NavIconName =
  | 'dashboard'
  | 'students'
  | 'admissions'
  | 'attendance'
  | 'batches'
  | 'subjects'
  | 'fees'
  | 'payments'
  | 'teachers'
  | 'staff'
  | 'timetable'
  | 'homework'
  | 'exams'
  | 'reportCards'
  | 'analytics'
  | 'library'
  | 'transport'
  | 'payroll'
  | 'settings';

export interface NavItem {
  /** Links the menu entry to its module in the canon list. */
  moduleCode: ModuleCode;
  label: string;
  route: string;
  permission: PermissionKey;
  icon: NavIconName;
  /** False while the module has no screens yet, so the link is not shown. */
  isEnabled: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    moduleCode: 'DASH',
    label: 'Dashboard',
    route: '/dashboard',
    permission: 'dashboard.view',
    icon: 'dashboard',
    isEnabled: true,
  },
  {
    moduleCode: 'STU',
    label: 'Students',
    route: '/students',
    permission: 'students.view',
    icon: 'students',
    isEnabled: false,
  },
  {
    moduleCode: 'ADM',
    label: 'Admissions',
    route: '/admissions',
    permission: 'admissions.view',
    icon: 'admissions',
    isEnabled: false,
  },
  {
    moduleCode: 'ATT',
    label: 'Attendance',
    route: '/attendance',
    permission: 'attendance.view',
    icon: 'attendance',
    isEnabled: false,
  },
  {
    moduleCode: 'BAT',
    label: 'Batches',
    route: '/batches',
    permission: 'batches.view',
    icon: 'batches',
    isEnabled: false,
  },
  {
    moduleCode: 'SUB',
    label: 'Subjects',
    route: '/subjects',
    permission: 'subjects.view',
    icon: 'subjects',
    isEnabled: false,
  },
  {
    moduleCode: 'FEE',
    label: 'Fees',
    route: '/fees',
    permission: 'fees.view',
    icon: 'fees',
    isEnabled: false,
  },
  {
    moduleCode: 'PAY',
    label: 'Payments',
    route: '/payments',
    permission: 'payments.view',
    icon: 'payments',
    isEnabled: false,
  },
  {
    moduleCode: 'TCH',
    label: 'Teachers',
    route: '/teachers',
    permission: 'teachers.view',
    icon: 'teachers',
    isEnabled: false,
  },
  {
    moduleCode: 'STF',
    label: 'Staff',
    route: '/staff',
    permission: 'staff.view',
    icon: 'staff',
    isEnabled: false,
  },
  {
    moduleCode: 'TT',
    label: 'Timetable',
    route: '/timetable',
    permission: 'timetable.view',
    icon: 'timetable',
    isEnabled: false,
  },
  {
    moduleCode: 'HW',
    label: 'Homework',
    route: '/homework',
    permission: 'homework.view',
    icon: 'homework',
    isEnabled: false,
  },
  {
    moduleCode: 'EXM',
    label: 'Exams',
    route: '/exams',
    permission: 'exams.view',
    icon: 'exams',
    isEnabled: false,
  },
  {
    moduleCode: 'RPT',
    label: 'Report cards',
    route: '/report-cards',
    permission: 'reportcards.view',
    icon: 'reportCards',
    isEnabled: false,
  },
  {
    moduleCode: 'ANL',
    label: 'Analytics',
    route: '/analytics',
    permission: 'analytics.view',
    icon: 'analytics',
    isEnabled: false,
  },
  {
    moduleCode: 'LIB',
    label: 'Library',
    route: '/library',
    permission: 'library.view',
    icon: 'library',
    isEnabled: false,
  },
  {
    moduleCode: 'TRN',
    label: 'Transport',
    route: '/transport',
    permission: 'transport.view',
    icon: 'transport',
    isEnabled: false,
  },
  {
    moduleCode: 'PRL',
    label: 'Payroll',
    route: '/payroll',
    permission: 'payroll.view',
    icon: 'payroll',
    isEnabled: false,
  },
  {
    moduleCode: 'SET',
    label: 'Settings',
    route: '/settings',
    permission: 'settings.view',
    icon: 'settings',
    isEnabled: false,
  },
];

/** Release phase of the module behind a menu entry, taken from the canon list. */
export function phaseOf(item: NavItem): number {
  return MODULES[item.moduleCode].phase;
}

/** Every first path segment that lives inside the signed-in app shell. */
export const DASHBOARD_ROUTE_PREFIXES: readonly string[] = [
  ...new Set(NAV_ITEMS.map((item) => item.route)),
  '/forbidden',
];
