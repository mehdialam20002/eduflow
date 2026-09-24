// Zod schemas that more than one module needs. A form in the browser and a route on the
// API parse the same object here, so the two sides can never disagree about a shape.

import { z } from 'zod';

import {
  ERROR_CODE_KEYS,
  MODULE_CODES,
  PERMISSION_KEYS,
  SYSTEM_ROLE_KEYS,
  type ErrorCode,
  type ModuleCode,
  type PermissionKey,
  type SystemRole,
} from '../generated/index.ts';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../types/api.ts';
import { isCalendarDate, isUtcTimestamp } from '../lib/dates.ts';

// Zod needs a non-empty tuple to infer a literal union. The generated arrays are already
// non-empty, so the cast only tells the compiler what the generator guarantees.
type NonEmpty<T extends string> = [T, ...T[]];

export const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
export const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const INDIAN_MOBILE_PATTERN = /^\+91[6-9]\d{9}$/;
export const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
export const MONEY_AMOUNT_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;
export const SIGNED_MONEY_AMOUNT_PATTERN = /^-?\d{1,10}(\.\d{1,2})?$/;
export const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
export const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
export const IANA_TIME_ZONE_PATTERN = /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){1,2}$/;
export const REQUEST_ID_PATTERN = /^req_[0-9a-f]{12}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Identifiers

export const uuidSchema = z.uuid('Enter a valid id');
export const idParamsSchema = z.object({ id: uuidSchema });
export const idListSchema = z.array(uuidSchema).min(1, 'Choose at least one row').max(500);
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(40)
  .regex(SLUG_PATTERN, 'Use lower case letters, numbers and hyphens');

export const requestIdSchema = z.string().regex(REQUEST_ID_PATTERN, 'Not a valid request id');
export const idempotencyKeySchema = z.string().trim().min(16).max(100);

// Text, contact details and locale

export const shortTextSchema = z.string().trim().min(1).max(120);
export const longTextSchema = z.string().trim().max(2000);
// Tidied first, checked second, so a form field with a stray space is not rejected.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(160)
  .pipe(z.email('Enter a valid email address'));

/** Indian mobile number in E.164, for example `+919876543210`. */
export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(INDIAN_MOBILE_PATTERN, 'Enter a 10-digit Indian mobile number with +91');

/** Any international number in E.164, for the UAE, USA and Australia markets. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(E164_PHONE_PATTERN, 'Enter the number with its country code, for example +971501234567');

export const localeSchema = z.string().trim().regex(LOCALE_PATTERN, 'Use a locale such as en-IN');
export const timeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .regex(IANA_TIME_ZONE_PATTERN, 'Use an IANA timezone such as Asia/Kolkata');

// Dates and times. Stored values are UTC; calendar dates carry no timezone at all.

export const dateSchema = z
  .string()
  .regex(CALENDAR_DATE_PATTERN, 'Use the date format YYYY-MM-DD')
  .refine(isCalendarDate, 'This date does not exist');

export const dateTimeSchema = z
  .string()
  .regex(UTC_TIMESTAMP_PATTERN, 'Use an ISO 8601 UTC timestamp ending in Z')
  .refine(isUtcTimestamp, 'This timestamp does not exist');

export const timeOfDaySchema = z
  .string()
  .regex(TIME_OF_DAY_PATTERN, 'Use a 24-hour time like 09:15');

export const dateRangeSchema = z
  .object({ from: dateSchema, to: dateSchema })
  .refine((range) => range.from <= range.to, {
    message: 'The end date cannot be before the start date',
    path: ['to'],
  });

// Money. Amounts travel as strings because Decimal(12, 2) does not survive a JavaScript number.

export const moneyAmountSchema = z
  .string()
  .trim()
  .regex(MONEY_AMOUNT_PATTERN, 'Enter an amount like 12000 or 12000.50');

/** Adjustments, refunds and ledger lines may be negative. */
export const signedMoneyAmountSchema = z
  .string()
  .trim()
  .regex(SIGNED_MONEY_AMOUNT_PATTERN, 'Enter an amount like 12000.50 or -500.00');

export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CURRENCY_CODE_PATTERN, 'Use a 3-letter currency code such as INR');

/** Every amount travels with its currency; two currencies are never added together. */
export const moneySchema = z.object({
  amount: moneyAmountSchema,
  currency: currencyCodeSchema,
});

/** A percentage as the API sends it: `10.5` means 10.5 percent, not 0.105. */
export const percentSchema = z.coerce.number().min(0).max(100);

// List queries. Every list endpoint of all 34 modules accepts exactly these four.

export const sortSchema = z.string().trim().max(60);
export const searchSchema = z.string().trim().min(2).max(100);

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  sort: sortSchema.optional(),
  q: searchSchema.optional(),
});

/** The same schema under the name the API standards chapter uses. */
export const paginationQuerySchema = listQuerySchema;

// Canon enums. Shared code cannot import Prisma, so the values are repeated here and a
// server test compares them with the Prisma enums.

export const organizationTypeSchema = z.enum(['SCHOOL', 'COACHING', 'COLLEGE', 'TRAINING_CENTRE']);
export const recordStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']);
export const bloodGroupSchema = z.enum([
  'A_POS',
  'A_NEG',
  'B_POS',
  'B_NEG',
  'AB_POS',
  'AB_NEG',
  'O_POS',
  'O_NEG',
  'UNKNOWN',
]);
export const channelSchema = z.enum(['IN_APP', 'WHATSAPP', 'SMS', 'EMAIL', 'PUSH']);
export const weekDaySchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);
export const approvalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const jobStatusSchema = z.enum([
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED',
  'CANCELLED',
]);
export const halfDaySessionSchema = z.enum(['FIRST_HALF', 'SECOND_HALF']);
export const shiftSchema = z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY', 'WEEKEND']);
export const audienceSchema = z.enum([
  'ALL',
  'STAFF',
  'STUDENTS',
  'PARENTS',
  'STUDENTS_AND_PARENTS',
]);
export const fileFormatSchema = z.enum(['XLSX', 'CSV', 'PDF', 'JSON', 'ZIP']);
export const devicePlatformSchema = z.enum(['WEB', 'ANDROID', 'IOS', 'API']);
export const paymentGatewaySchema = z.enum(['RAZORPAY', 'STRIPE', 'OFFLINE']);
export const billingCycleSchema = z.enum(['MONTHLY', 'YEARLY']);
export const planCodeSchema = z.enum(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE']);
export const actorTypeSchema = z.enum(['USER', 'SYSTEM', 'API_KEY', 'IMPERSONATION']);

// Enums that come from the specifications keep their single source of truth in ../generated.

export const systemRoleSchema = z.enum(SYSTEM_ROLE_KEYS as NonEmpty<SystemRole>);
export const moduleCodeSchema = z.enum(MODULE_CODES as NonEmpty<ModuleCode>);
export const permissionKeySchema = z.enum(PERMISSION_KEYS as NonEmpty<PermissionKey>);
export const errorCodeSchema = z.enum(ERROR_CODE_KEYS as NonEmpty<ErrorCode>);

// Inferred types

export type Uuid = z.infer<typeof uuidSchema>;
export type IdParams = z.infer<typeof idParamsSchema>;
export type CalendarDate = z.infer<typeof dateSchema>;
export type UtcTimestamp = z.infer<typeof dateTimeSchema>;
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type MoneyAmount = z.infer<typeof moneyAmountSchema>;
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type Money = z.infer<typeof moneySchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type PaginationQuery = ListQuery;
export type OrganizationType = z.infer<typeof organizationTypeSchema>;
export type RecordStatus = z.infer<typeof recordStatusSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type BloodGroup = z.infer<typeof bloodGroupSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type WeekDay = z.infer<typeof weekDaySchema>;
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type HalfDaySession = z.infer<typeof halfDaySessionSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type Audience = z.infer<typeof audienceSchema>;
export type FileFormat = z.infer<typeof fileFormatSchema>;
export type DevicePlatform = z.infer<typeof devicePlatformSchema>;
export type PaymentGateway = z.infer<typeof paymentGatewaySchema>;
export type BillingCycle = z.infer<typeof billingCycleSchema>;
export type PlanCode = z.infer<typeof planCodeSchema>;
export type ActorType = z.infer<typeof actorTypeSchema>;
