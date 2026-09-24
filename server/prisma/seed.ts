import process from 'node:process';
import bcrypt from 'bcryptjs';
import type { WeekDay } from '@prisma/client';
import {
  PERMISSION_KEYS,
  PERMISSIONS,
  SYSTEM_ROLE_KEYS,
  SYSTEM_ROLES,
  scopeFor,
  type PermissionKey,
  type SystemRole,
} from '@eduflow/shared';
import { env, isProduction } from '../src/config/env.ts';
import { db, disconnectPrisma } from '../src/lib/prisma.ts';
import { runAsPlatform } from '../src/lib/tenant-context.ts';

/**
 * Seeds everything the product needs before a single feature is built: the reference data of
 * the four launch markets, the four plans with their canon prices, the whole permission
 * catalogue, the seven system roles with their grants, and one demo school to click through.
 * Every write matches an existing row by its natural key, so running it twice changes nothing.
 */

type ModuleCode = NonNullable<Parameters<typeof db.permission.create>[0]['data']['module']>;
type StoredScope = 'ALL' | 'CAMPUS' | 'OWN' | 'VIEW';

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
];

const COUNTRIES = [
  {
    code: 'IN',
    iso3: 'IND',
    name: 'India',
    dialCode: '+91',
    defaultCurrencyCode: 'INR',
    defaultTimezone: 'Asia/Kolkata',
    defaultLocale: 'en-IN',
    taxName: 'GST',
    taxPercent: '18.00',
    taxIdLabel: 'GSTIN',
  },
  {
    code: 'AE',
    iso3: 'ARE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    defaultCurrencyCode: 'AED',
    defaultTimezone: 'Asia/Dubai',
    defaultLocale: 'en-AE',
    taxName: 'VAT',
    taxPercent: '5.00',
    taxIdLabel: 'TRN',
  },
  {
    code: 'US',
    iso3: 'USA',
    name: 'United States of America',
    dialCode: '+1',
    defaultCurrencyCode: 'USD',
    defaultTimezone: 'America/New_York',
    defaultLocale: 'en-US',
    taxName: 'Sales Tax',
    // Sales tax is set per state by Stripe Tax, so there is no single country rate.
    taxPercent: null,
    taxIdLabel: 'EIN',
  },
  {
    code: 'AU',
    iso3: 'AUS',
    name: 'Australia',
    dialCode: '+61',
    defaultCurrencyCode: 'AUD',
    defaultTimezone: 'Australia/Sydney',
    defaultLocale: 'en-AU',
    taxName: 'GST',
    taxPercent: '10.00',
    taxIdLabel: 'ABN',
  },
];

interface PlanSeed {
  code: string;
  name: string;
  description: string;
  maxStudents: number | null;
  maxCampuses: number | null;
  maxAdminUsers: number | null;
  maxStaffUsers: number | null;
  trialDays: number;
  isCustomPriced: boolean;
  sortOrder: number;
  /** [currency, monthly, yearly]; yearly is null when the contract is agreed per customer. */
  prices: [string, string, string | null][];
}

const PLANS: PlanSeed[] = [
  {
    code: 'STARTER',
    name: 'Starter',
    description: 'Free forever. Phase 1 core modules with EduFlow branding, in-app and email only.',
    maxStudents: 50,
    maxCampuses: 1,
    maxAdminUsers: 1,
    maxStaffUsers: 3,
    trialDays: 0,
    isCustomPriced: false,
    sortOrder: 1,
    prices: [
      ['INR', '0.00', '0.00'],
      ['USD', '0.00', '0.00'],
      ['AUD', '0.00', '0.00'],
      ['AED', '0.00', '0.00'],
    ],
  },
  {
    code: 'GROWTH',
    name: 'Growth',
    description: 'All Phase 1 and Phase 2 modules, unlimited staff users, online fee payment.',
    maxStudents: 300,
    maxCampuses: 1,
    maxAdminUsers: null,
    maxStaffUsers: null,
    trialDays: 14,
    isCustomPriced: false,
    sortOrder: 2,
    prices: [
      ['INR', '2499.00', '24990.00'],
      ['USD', '79.00', '790.00'],
      ['AUD', '119.00', '1190.00'],
      ['AED', '299.00', '2990.00'],
    ],
  },
  {
    code: 'PRO',
    name: 'Pro',
    description: 'Everything in Growth plus Phase 3 modules, multi-campus and custom roles.',
    maxStudents: 1_000,
    maxCampuses: 3,
    maxAdminUsers: null,
    maxStaffUsers: null,
    trialDays: 14,
    isCustomPriced: false,
    sortOrder: 3,
    prices: [
      ['INR', '5999.00', '59990.00'],
      ['USD', '199.00', '1990.00'],
      ['AUD', '299.00', '2990.00'],
      ['AED', '749.00', '7490.00'],
    ],
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Everything plus AI Insights, white-label, SSO and a custom yearly contract.',
    maxStudents: null,
    maxCampuses: null,
    maxAdminUsers: null,
    maxStaffUsers: null,
    trialDays: 14,
    isCustomPriced: true,
    sortOrder: 4,
    prices: [
      ['INR', '14999.00', null],
      ['USD', '499.00', null],
      ['AUD', '749.00', null],
      ['AED', '1849.00', null],
    ],
  },
];

/** Permission prefixes that gate one product module. The rest are cross-module keys. */
const MODULE_OF_PREFIX: Record<string, ModuleCode> = {
  admissions: 'ADM',
  ai: 'AI',
  analytics: 'ANL',
  attendance: 'ATT',
  batches: 'BAT',
  campuses: 'CAMP',
  certificates: 'CRT',
  dashboard: 'DASH',
  discounts: 'DSC',
  email: 'EML',
  exams: 'EXM',
  fees: 'FEE',
  homework: 'HW',
  hostel: 'HST',
  inventory: 'INV',
  leave: 'LEV',
  library: 'LIB',
  notifications: 'NTF',
  organizations: 'ORG',
  parentportal: 'PP',
  payments: 'PAY',
  payroll: 'PRL',
  reportcards: 'RPT',
  scholarships: 'SCH',
  settings: 'SET',
  sms: 'SMS',
  staff: 'STF',
  studentportal: 'SP',
  students: 'STU',
  subjects: 'SUB',
  teachers: 'TCH',
  timetable: 'TT',
  transport: 'TRN',
  whatsapp: 'WA',
};

const ROLE_USER_TYPE: Record<SystemRole, 'STAFF' | 'PARENT' | 'STUDENT' | 'PLATFORM'> = {
  SUPER_ADMIN: 'PLATFORM',
  ORG_ADMIN: 'STAFF',
  PRINCIPAL: 'STAFF',
  TEACHER: 'STAFF',
  ACCOUNTANT: 'STAFF',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
};

const STORED_SCOPE: Record<string, StoredScope | undefined> = {
  yes: 'ALL',
  campus: 'CAMPUS',
  own: 'OWN',
  view: 'VIEW',
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function splitKey(key: PermissionKey): { resource: string; action: string } {
  const dot = key.indexOf('.');
  return { resource: key.slice(0, dot), action: key.slice(dot + 1) };
}

async function seedCurrencies(): Promise<void> {
  for (const currency of CURRENCIES) {
    await db.currency.upsert({
      where: { code: currency.code },
      update: { name: currency.name, symbol: currency.symbol, isActive: true },
      create: { ...currency, decimalDigits: 2, isActive: true },
    });
  }
}

async function seedCountries(): Promise<void> {
  for (const country of COUNTRIES) {
    const fields = { ...country, isSupported: true };
    await db.country.upsert({ where: { code: country.code }, update: fields, create: fields });
  }
}

async function seedPlans(): Promise<void> {
  for (const plan of PLANS) {
    const { prices, ...fields } = plan;
    const row = await db.plan.upsert({
      where: { code: plan.code },
      update: { ...fields, isPublic: true, status: 'ACTIVE' },
      create: { ...fields, isPublic: true, status: 'ACTIVE' },
    });

    for (const [currency, monthly, yearly] of prices) {
      await db.planPrice.upsert({
        where: {
          planId_currency_billingCycle: { planId: row.id, currency, billingCycle: 'MONTHLY' },
        },
        update: { amount: monthly, isActive: true },
        create: { planId: row.id, currency, billingCycle: 'MONTHLY', amount: monthly },
      });

      // Enterprise has no list yearly price: that contract is agreed per customer.
      if (yearly === null) continue;
      await db.planPrice.upsert({
        where: {
          planId_currency_billingCycle: { planId: row.id, currency, billingCycle: 'YEARLY' },
        },
        update: { amount: yearly, isActive: true },
        create: { planId: row.id, currency, billingCycle: 'YEARLY', amount: yearly },
      });
    }
  }
}

async function seedPermissions(): Promise<Map<PermissionKey, string>> {
  const ids = new Map<PermissionKey, string>();

  for (const [index, key] of PERMISSION_KEYS.entries()) {
    const { resource, action } = splitKey(key);
    const fields = {
      resource,
      action,
      module: MODULE_OF_PREFIX[resource] ?? null,
      name: `${titleCase(resource)}: ${action.replace(/_/g, ' ')}`,
      description: PERMISSIONS[key].meaning.slice(0, 255),
      sortOrder: index,
    };
    const row = await db.permission.upsert({
      where: { key },
      update: fields,
      create: { key, ...fields },
    });
    ids.set(key, row.id);
  }
  return ids;
}

async function seedSystemRoles(permissionIds: Map<PermissionKey, string>): Promise<number> {
  let grants = 0;

  for (const roleKey of SYSTEM_ROLE_KEYS) {
    const definition = SYSTEM_ROLES[roleKey];
    const fields = {
      name: definition.label,
      description: `${definition.who}. Data scope: ${definition.dataScope}.`.slice(0, 255),
      isSystem: true,
      userType: ROLE_USER_TYPE[roleKey],
      status: 'ACTIVE' as const,
    };

    // A system role has organizationId null, and PostgreSQL treats every null as distinct,
    // so the compound unique key cannot find it. Match on the two columns by hand instead.
    const existing = await db.role.findFirst({ where: { key: roleKey, organizationId: null } });
    const role =
      existing === null
        ? await db.role.create({ data: { key: roleKey, organizationId: null, ...fields } })
        : await db.role.update({ where: { id: existing.id }, data: fields });

    const rows = PERMISSION_KEYS.flatMap((key) => {
      const scope = STORED_SCOPE[scopeFor(roleKey, key)];
      const permissionId = permissionIds.get(key);
      if (scope === undefined || permissionId === undefined) return [];
      return [{ roleId: role.id, permissionId, organizationId: null, scope }];
    });

    // The seven system roles belong to the platform and no tenant may edit them, so their
    // grant rows are rewritten on every run. That keeps the matrix and the database in step.
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (rows.length > 0) await db.rolePermission.createMany({ data: rows });
    grants += rows.length;
  }
  return grants;
}

async function seedDemoOrganization(passwordHash: string): Promise<string> {
  const plan = await db.plan.findUniqueOrThrow({ where: { code: 'GROWTH' } });

  const organization = await db.organization.upsert({
    where: { slug: 'brightfuture' },
    update: { name: 'Bright Future Public School', planId: plan.id },
    create: {
      name: 'Bright Future Public School',
      legalName: 'Bright Future Education Society',
      slug: 'brightfuture',
      type: 'SCHOOL',
      status: 'TRIAL',
      planId: plan.id,
      countryCode: 'IN',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      stateCode: '09',
      financialYearStartMonth: 4,
      email: 'office@brightfuture.example',
      phone: '+915222000100',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      signupSource: 'seed',
    },
  });
  const organizationId = organization.id;

  const campusFields = {
    name: 'Gomti Nagar Campus',
    isMain: true,
    email: 'gomtinagar@brightfuture.example',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    countryCode: 'IN',
    board: 'CBSE',
    weeklyOffDays: ['SUNDAY' as const],
    status: 'ACTIVE' as const,
  };
  const campus = await db.campus.upsert({
    where: { organizationId_code: { organizationId, code: 'LKO1' } },
    update: campusFields,
    create: { organizationId, code: 'LKO1', ...campusFields },
  });

  const yearFields = {
    startDate: new Date('2027-04-01T00:00:00.000Z'),
    endDate: new Date('2028-03-31T00:00:00.000Z'),
    isCurrent: true,
    status: 'ACTIVE' as const,
  };
  const year = await db.academicYear.upsert({
    where: { organizationId_name: { organizationId, name: '2027-28' } },
    update: yearFields,
    create: { organizationId, name: '2027-28', ...yearFields },
  });

  const courseFields = {
    name: 'Class 10',
    level: 10,
    board: 'CBSE',
    sortOrder: 10,
    campusId: campus.id,
    status: 'ACTIVE' as const,
  };
  const course = await db.course.upsert({
    where: { organizationId_code: { organizationId, code: 'C10' } },
    update: courseFields,
    create: { organizationId, code: 'C10', ...courseFields },
  });

  const batchFields = {
    name: '10-A',
    capacity: 40,
    shift: 'FULL_DAY' as const,
    medium: 'English',
    daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] satisfies WeekDay[],
    status: 'ACTIVE' as const,
  };
  await db.batch.upsert({
    where: {
      organizationId_campusId_academicYearId_code: {
        organizationId,
        campusId: campus.id,
        academicYearId: year.id,
        code: '10-A',
      },
    },
    update: batchFields,
    create: {
      organizationId,
      campusId: campus.id,
      academicYearId: year.id,
      courseId: course.id,
      code: '10-A',
      ...batchFields,
    },
  });

  const email = 'rajesh@brightfuture.example';
  const userFields = {
    status: 'ACTIVE' as const,
    firstName: 'Rajesh',
    lastName: 'Sharma',
    phone: '+919876543210',
    passwordHash,
    passwordChangedAt: new Date(),
    emailVerifiedAt: new Date(),
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
  };
  const existingUser = await db.user.findFirst({
    where: { organizationId, userType: 'STAFF', email },
  });
  const user =
    existingUser === null
      ? await db.user.create({ data: { organizationId, userType: 'STAFF', email, ...userFields } })
      : await db.user.update({ where: { id: existingUser.id }, data: userFields });

  const adminRole = await db.role.findFirst({ where: { key: 'ORG_ADMIN', organizationId: null } });
  if (adminRole !== null) {
    await db.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { organizationId, userId: user.id, roleId: adminRole.id },
    });
  }

  await db.userCampus.upsert({
    where: { userId_campusId: { userId: user.id, campusId: campus.id } },
    update: { isDefault: true },
    create: { organizationId, userId: user.id, campusId: campus.id, isDefault: true },
  });

  await db.organization.update({ where: { id: organizationId }, data: { ownerUserId: user.id } });

  return email;
}

async function main(): Promise<void> {
  const password = env.SEED_DEMO_PASSWORD ?? 'EduFlow@Local123';
  const passwordHash = await bcrypt.hash(password, 12);

  const summary = await runAsPlatform(
    'seed: reference data, plans, permissions, system roles and the demo tenant',
    async () => {
      await seedCurrencies();
      await seedCountries();
      await seedPlans();
      const permissionIds = await seedPermissions();
      const grants = await seedSystemRoles(permissionIds);

      // Demo data belongs on a laptop and on staging. Production gets reference data only.
      const demoEmail = isProduction ? null : await seedDemoOrganization(passwordHash);
      return { permissions: permissionIds.size, grants, demoEmail };
    },
  );

  const report = [
    'Seed finished.',
    `  currencies ${CURRENCIES.length}   countries ${COUNTRIES.length}   plans ${PLANS.length}`,
    `  permissions ${summary.permissions}   system roles ${SYSTEM_ROLE_KEYS.length}` +
      `   role grants ${summary.grants}`,
    summary.demoEmail === null
      ? '  demo organization skipped, because NODE_ENV is production'
      : `  demo sign-in ${summary.demoEmail} / ${password}`,
    '',
  ].join('\n');
  process.stdout.write(report);
}

main()
  .catch((error: unknown) => {
    process.exitCode = 1;
    process.stderr.write(`Seed failed: ${String(error)}\n`);
  })
  .finally(() => disconnectPrisma());
