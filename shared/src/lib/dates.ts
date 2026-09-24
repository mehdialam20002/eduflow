// Date and time helpers for both sides of EduFlow.
//
// THE ONE RULE: every stored timestamp is UTC. PostgreSQL keeps `timestamptz`, the API sends
// ISO 8601 ending in `Z`, and the server process itself runs in UTC. A timezone is applied only
// when a value is shown to a person or when "today" has to be worked out for an organization.
// A calendar date (`@db.Date`) carries no zone at all, so a date of birth does not move when a
// parent opens the app from Dubai.

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_DAY = 86_400_000;

/** The default organization timezone; every Indian institute starts here. */
export const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

/** The default display locale that goes with it. */
export const DEFAULT_LOCALE = 'en-IN';

/** Indian sessions start in April, so 1 April 2027 opens the year named 2027-28. */
export const DEFAULT_ACADEMIC_YEAR_START_MONTH = 4;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(timeZone: string, at: Date): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const found: Record<string, string> = {};
  for (const part of formatter.formatToParts(at)) {
    found[part.type] = part.value;
  }
  return {
    year: Number(found['year'] ?? '1970'),
    month: Number(found['month'] ?? '1'),
    day: Number(found['day'] ?? '1'),
    hour: Number(found['hour'] ?? '0'),
    minute: Number(found['minute'] ?? '0'),
    second: Number(found['second'] ?? '0'),
  };
}

/** True when the text is a real calendar date written as YYYY-MM-DD. */
export function isCalendarDate(value: string): boolean {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (match === null) return false;
  const year = Number(match[1] ?? '');
  const month = Number(match[2] ?? '');
  const day = Number(match[3] ?? '');
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  return (
    asUtc.getUTCFullYear() === year &&
    asUtc.getUTCMonth() === month - 1 &&
    asUtc.getUTCDate() === day
  );
}

/** True when the text is a real ISO 8601 timestamp in UTC, ending in `Z`. */
export function isUtcTimestamp(value: string): boolean {
  if (!UTC_TIMESTAMP_PATTERN.test(value)) return false;
  if (Number.isNaN(Date.parse(value))) return false;
  return isCalendarDate(value.slice(0, 10));
}

function assertCalendarDate(value: string): string {
  if (!isCalendarDate(value)) {
    throw new RangeError(`"${value}" is not a calendar date written as YYYY-MM-DD.`);
  }
  return value;
}

/** Midnight UTC of a calendar date, which is what a `@db.Date` column stores. */
export function calendarDateToUtc(date: string): Date {
  const match = CALENDAR_DATE_PATTERN.exec(assertCalendarDate(date));
  const year = Number(match?.[1] ?? '');
  const month = Number(match?.[2] ?? '');
  const day = Number(match?.[3] ?? '');
  return new Date(Date.UTC(year, month - 1, day));
}

/** The UTC calendar date of an instant, as YYYY-MM-DD. */
export function toCalendarDate(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/** The wire form of an instant: ISO 8601 UTC with milliseconds. */
export function toUtcIso(at: Date): string {
  return at.toISOString();
}

/** How far the zone is ahead of UTC at that instant, in minutes. Handles daylight saving. */
export function timeZoneOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const parts = zonedParts(timeZone, at);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    at.getUTCMilliseconds(),
  );
  return Math.round((asUtc - at.getTime()) / MILLISECONDS_PER_MINUTE);
}

/**
 * Today's calendar date in an organization's timezone.
 * At 5:15 am in Patna on 6 October it is still 5 October in UTC, so "today" must be asked
 * for in the zone, never taken from `new Date().toISOString()`.
 */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  const parts = zonedParts(timeZone, now);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${String(parts.year).padStart(4, '0')}-${month}-${day}`;
}

/** The instant at which a calendar date begins in a timezone, as a UTC `Date`. */
export function startOfDayUtc(date: string, timeZone: string): Date {
  const naive = calendarDateToUtc(date).getTime();
  // Two passes, because the offset itself may change on the morning the clocks move.
  const naiveOffset = timeZoneOffsetMinutes(timeZone, new Date(naive));
  const firstGuess = naive - naiveOffset * MILLISECONDS_PER_MINUTE;
  const offset = timeZoneOffsetMinutes(timeZone, new Date(firstGuess));
  return new Date(naive - offset * MILLISECONDS_PER_MINUTE);
}

/** The last millisecond of a calendar date in a timezone, as a UTC `Date`. */
export function endOfDayUtc(date: string, timeZone: string): Date {
  return new Date(startOfDayUtc(addDays(date, 1), timeZone).getTime() - 1);
}

/**
 * The half-open range of one day in a timezone: `startsAt <= t < endsBefore`.
 * Database filters use this form, because it cannot miss the last millisecond of a day.
 */
export function dayRangeUtc(date: string, timeZone: string): { startsAt: Date; endsBefore: Date } {
  return {
    startsAt: startOfDayUtc(date, timeZone),
    endsBefore: startOfDayUtc(addDays(date, 1), timeZone),
  };
}

/** Moves a calendar date by whole days. Pure date arithmetic, no timezone involved. */
export function addDays(date: string, days: number): string {
  const moved = new Date(calendarDateToUtc(date).getTime() + days * MILLISECONDS_PER_DAY);
  return toCalendarDate(moved);
}

/** Whole days from the first calendar date to the second; negative when it is earlier. */
export function differenceInDays(from: string, to: string): number {
  const span = calendarDateToUtc(to).getTime() - calendarDateToUtc(from).getTime();
  return Math.round(span / MILLISECONDS_PER_DAY);
}

/**
 * An invoice due on 10 April is overdue from the start of 11 April in the organization's
 * timezone, not at midnight UTC.
 */
export function isOverdue(dueDate: string, timeZone: string, now: Date = new Date()): boolean {
  return now.getTime() >= startOfDayUtc(addDays(dueDate, 1), timeZone).getTime();
}

/** A stored UTC timestamp shown in the organization's timezone: "2 Apr 2027, 11:01 am". */
export function formatDateTime(
  iso: string | Date,
  timeZone: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const at = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(at);
}

/** The date part of a stored UTC timestamp, in the organization's timezone. */
export function formatDate(
  iso: string | Date,
  timeZone: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const at = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(at);
}

/** The time part of a stored UTC timestamp, in the organization's timezone. */
export function formatTime(
  iso: string | Date,
  timeZone: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const at = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone }).format(at);
}

/** A calendar date shown to a person. It is formatted in UTC so that the day never shifts. */
export function formatCalendarDate(date: string, locale: string = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(calendarDateToUtc(date));
}

/** The name of the academic year that a start date opens: 2027-04-01 gives "2027-28". */
export function academicYearName(startDate: string): string {
  const startYear = calendarDateToUtc(startDate).getUTCFullYear();
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/** The academic year a calendar date falls in, for organizations whose session starts in April. */
export function academicYearNameFor(
  date: string,
  startMonth: number = DEFAULT_ACADEMIC_YEAR_START_MONTH,
): string {
  const at = calendarDateToUtc(date);
  const year = at.getUTCFullYear();
  const startYear = at.getUTCMonth() + 1 >= startMonth ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/** Reads "2027-28" or "2027-2028" back into the two calendar years it spans. */
export function parseAcademicYearName(name: string): { startYear: number; endYear: number } {
  const match = /^(\d{4})-(\d{2}|\d{4})$/.exec(name.trim());
  if (match === null) {
    throw new RangeError(`"${name}" is not an academic year name such as 2027-28.`);
  }
  const startYear = Number(match[1] ?? '');
  const tail = match[2] ?? '';
  const century = Math.floor(startYear / 100) * 100;
  let endYear = tail.length === 4 ? Number(tail) : century + Number(tail);
  // "2099-00" means 2099 to 2100, so a short tail that landed in the past rolls a century on.
  if (endYear < startYear) endYear += 100;
  if (endYear !== startYear + 1) {
    throw new RangeError(`An academic year spans two years in a row, so "${name}" cannot be right.`);
  }
  return { startYear, endYear };
}

/** The default first and last calendar date of a named academic year. */
export function academicYearRange(
  name: string,
  startMonth: number = DEFAULT_ACADEMIC_YEAR_START_MONTH,
): { startDate: string; endDate: string } {
  const { startYear, endYear } = parseAcademicYearName(name);
  const month = String(startMonth).padStart(2, '0');
  const startDate = `${startYear}-${month}-01`;
  return { startDate, endDate: addDays(`${endYear}-${month}-01`, -1) };
}

/** True when a calendar date falls inside the year, both ends included. */
export function isWithinAcademicYear(date: string, startDate: string, endDate: string): boolean {
  assertCalendarDate(date);
  assertCalendarDate(startDate);
  assertCalendarDate(endDate);
  // YYYY-MM-DD sorts correctly as text, so no Date objects are needed here.
  return date >= startDate && date <= endDate;
}
